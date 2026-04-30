import { db } from '../../lib/localDb.js';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { FileCheck, Check, RotateCcw, AlertTriangle, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import { formatCurrency } from '@/components/shared/CurrencyDisplay';
import SignaturePad from '@/components/settlements/SignaturePad';
import { toast } from 'sonner';

export default function Settlements() {
  const [selectedKit, setSelectedKit] = useState(null);
  const [itemStatuses, setItemStatuses] = useState({});
  const [signature, setSignature] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [amountPaid, setAmountPaid] = useState('');
  const [geoLocation, setGeoLocation] = useState(null);
  const [showSettlement, setShowSettlement] = useState(false);
  const qc = useQueryClient();

  const urlParams = new URLSearchParams(window.location.search);
  const kitIdFromUrl = urlParams.get('kit');

  const { data: kits = [] } = useQuery({
    queryKey: ['kits'],
    queryFn: () => db.entities.Kit.list('-created_date')
  });

  const { data: settlements = [] } = useQuery({
    queryKey: ['settlements'],
    queryFn: () => db.entities.Settlement.list('-created_date')
  });

  const { data: resellers = [] } = useQuery({
    queryKey: ['resellers'],
    queryFn: () => db.entities.Reseller.list()
  });

  useEffect(() => {
    if (kitIdFromUrl && kits.length > 0) {
      const kit = kits.find(k => k.id === kitIdFromUrl);
      if (kit) startSettlement(kit);
    }
  }, [kitIdFromUrl, kits]);

  const settlementMutation = useMutation({
    mutationFn: async (data) => {
      const settlement = await db.entities.Settlement.create(data.settlement);
      await db.entities.Kit.update(data.kitId, { status: 'finalizado', settlement_date: new Date().toISOString().split('T')[0] });
      
      // Create financial transactions
      if (data.settlement.total_sales > 0) {
        await db.entities.FinancialTransaction.create({
          type: 'entrada',
          description: `Venda kit ${data.settlement.kit_code} - ${data.settlement.reseller_name}`,
          amount: data.settlement.total_sales,
          reference_id: data.kitId,
          reseller_name: data.settlement.reseller_name,
          date: new Date().toISOString().split('T')[0],
          status: 'confirmado'
        });
      }
      if (data.settlement.commission_amount > 0) {
        await db.entities.FinancialTransaction.create({
          type: 'comissao',
          description: `Comissão revendedora - ${data.settlement.reseller_name}`,
          amount: data.settlement.commission_amount,
          reference_id: data.kitId,
          reseller_name: data.settlement.reseller_name,
          date: new Date().toISOString().split('T')[0],
          status: 'confirmado'
        });
      }
      return settlement;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settlements'] });
      qc.invalidateQueries({ queryKey: ['kits'] });
      setShowSettlement(false);
      setSelectedKit(null);
      setItemStatuses({});
      setSignature(null);
      toast.success('Acerto realizado com sucesso!');
    }
  });

  const startSettlement = (kit) => {
    setSelectedKit(kit);
    const statuses = {};
    kit.items?.forEach((item, i) => {
      statuses[i] = item.status || 'pendente';
    });
    setItemStatuses(statuses);
    setShowSettlement(true);

    // Get geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setGeoLocation(`${pos.coords.latitude},${pos.coords.longitude}`),
        () => {}
      );
    }
  };

  const calculateTotals = () => {
    if (!selectedKit?.items) return { sold: 0, returned: 0, lost: 0, totalSales: 0, commission: 0 };
    
    let sold = 0, returned = 0, lost = 0, totalSales = 0;
    
    selectedKit.items.forEach((item, i) => {
      const status = itemStatuses[i] || 'pendente';
      const qty = item.quantity || 1;
      if (status === 'vendido') { sold += qty; totalSales += (item.sale_price || 0) * qty; }
      else if (status === 'devolvido') { returned += qty; }
      else if (status === 'perdido') { lost += qty; totalSales += (item.sale_price || 0) * qty; }
    });

    const reseller = resellers.find(r => r.id === selectedKit.reseller_id);
    const commissionRate = (reseller?.commission_rate || 30) / 100;
    const commission = totalSales * commissionRate;

    return { sold, returned, lost, totalSales, commission, amountDue: totalSales - commission };
  };

  const handleFinalize = () => {
    const totals = calculateTotals();
    const paid = parseFloat(amountPaid) || totals.amountDue;

    settlementMutation.mutate({
      kitId: selectedKit.id,
      settlement: {
        kit_id: selectedKit.id,
        kit_code: selectedKit.code,
        reseller_id: selectedKit.reseller_id,
        reseller_name: selectedKit.reseller_name,
        items_sold: totals.sold,
        items_returned: totals.returned,
        items_lost: totals.lost,
        total_sales: totals.totalSales,
        commission_amount: totals.commission,
        amount_due: totals.amountDue,
        amount_paid: paid,
        payment_method: paymentMethod,
        signature_url: signature,
        geolocation: geoLocation,
        status: paid >= totals.amountDue ? 'concluido' : 'parcial'
      }
    });
  };

  const activeKits = kits.filter(k => k.status === 'entregue' || k.status === 'em_acerto');
  const totals = selectedKit ? calculateTotals() : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Acertos de Contas"
        subtitle="Baixa de kits e conciliação com revendedoras"
      />

      {/* Active kits for settlement */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Kits Pendentes de Acerto</CardTitle>
        </CardHeader>
        <CardContent>
          {activeKits.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhum kit pendente</p>
          ) : (
            <div className="space-y-2">
              {activeKits.map(kit => (
                <div key={kit.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <div>
                    <p className="text-sm font-medium">{kit.code} - {kit.reseller_name}</p>
                    <p className="text-xs text-muted-foreground">{kit.items?.length || 0} itens · {formatCurrency(kit.total_value)}</p>
                  </div>
                  <Button size="sm" onClick={() => startSettlement(kit)} className="text-xs gap-1">
                    <FileCheck className="w-3 h-3" /> Iniciar Acerto
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* History */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Histórico de Acertos</CardTitle>
        </CardHeader>
        <CardContent>
          {settlements.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhum acerto realizado</p>
          ) : (
            <div className="space-y-2">
              {settlements.map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="text-sm font-medium">{s.reseller_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.items_sold} vendidos · {s.items_returned} devolvidos · {s.items_lost} perdidos
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatCurrency(s.amount_paid)}</p>
                    <Badge variant={s.status === 'concluido' ? 'default' : 'secondary'} className="text-xs">
                      {s.status === 'concluido' ? 'Concluído' : 'Parcial'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settlement Dialog */}
      <Dialog open={showSettlement} onOpenChange={setShowSettlement}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Acerto - {selectedKit?.code}</DialogTitle>
          </DialogHeader>

          {selectedKit && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-sm font-medium">{selectedKit.reseller_name}</p>
                <p className="text-xs text-muted-foreground">{selectedKit.items?.length || 0} itens no kit</p>
                {geoLocation && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-green-600">
                    <MapPin className="w-3 h-3" /> Localização registrada
                  </div>
                )}
              </div>

              {/* Item statuses */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Baixa dos Itens</Label>
                {selectedKit.items?.map((item, i) => (
                  <div key={i} className="p-3 rounded-lg border space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{item.product_name}</p>
                        <p className="text-xs text-muted-foreground">Qtd: {item.quantity} · {formatCurrency(item.sale_price)}</p>
                      </div>
                    </div>
                    <RadioGroup
                      value={itemStatuses[i] || 'pendente'}
                      onValueChange={(v) => setItemStatuses(prev => ({ ...prev, [i]: v }))}
                      className="flex gap-3"
                    >
                      <div className="flex items-center gap-1.5">
                        <RadioGroupItem value="vendido" id={`sold-${i}`} />
                        <Label htmlFor={`sold-${i}`} className="text-xs text-green-700 cursor-pointer">Vendido</Label>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <RadioGroupItem value="devolvido" id={`ret-${i}`} />
                        <Label htmlFor={`ret-${i}`} className="text-xs text-blue-700 cursor-pointer">Devolvido</Label>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <RadioGroupItem value="perdido" id={`lost-${i}`} />
                        <Label htmlFor={`lost-${i}`} className="text-xs text-red-700 cursor-pointer">Perdido</Label>
                      </div>
                    </RadioGroup>
                  </div>
                ))}
              </div>

              {/* Summary */}
              {totals && (
                <Card className="bg-muted/50">
                  <CardContent className="p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Vendas</span>
                      <span className="font-semibold">{formatCurrency(totals.totalSales)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Comissão Revendedora</span>
                      <span className="font-semibold text-orange-600">-{formatCurrency(totals.commission)}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between">
                      <span className="font-semibold">Valor a Receber</span>
                      <span className="font-bold text-lg">{formatCurrency(totals.amountDue)}</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Payment */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Forma de Pagamento</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="cartao">Cartão</SelectItem>
                      <SelectItem value="boleto">Boleto</SelectItem>
                      <SelectItem value="parcial">Parcial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Valor Pago (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    placeholder={totals?.amountDue?.toFixed(2)}
                  />
                </div>
              </div>

              {/* Signature */}
              <SignaturePad onSave={(sig) => { setSignature(sig); toast.success('Assinatura capturada'); }} />

              {signature && (
                <div className="flex items-center gap-2 text-xs text-green-600">
                  <Check className="w-4 h-4" /> Assinatura confirmada
                </div>
              )}

              <Button
                className="w-full"
                onClick={handleFinalize}
                disabled={settlementMutation.isPending}
              >
                {settlementMutation.isPending ? 'Finalizando...' : 'Finalizar Acerto'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}