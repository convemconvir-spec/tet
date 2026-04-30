const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { Boxes, Plus, Package, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import { formatCurrency } from '@/components/shared/CurrencyDisplay';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const STATUS_MAP = {
  preparando: { label: 'Preparando', color: 'bg-yellow-100 text-yellow-800' },
  entregue: { label: 'Entregue', color: 'bg-blue-100 text-blue-800' },
  em_acerto: { label: 'Em Acerto', color: 'bg-purple-100 text-purple-800' },
  finalizado: { label: 'Finalizado', color: 'bg-green-100 text-green-800' },
  cancelado: { label: 'Cancelado', color: 'bg-red-100 text-red-800' },
};

export default function Kits() {
  const [showForm, setShowForm] = useState(false);
  const [selectedReseller, setSelectedReseller] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [quantities, setQuantities] = useState({});
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: kits = [] } = useQuery({
    queryKey: ['kits'],
    queryFn: () => db.entities.Kit.list('-created_date')
  });

  const { data: resellers = [] } = useQuery({
    queryKey: ['resellers'],
    queryFn: () => db.entities.Reseller.list()
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => db.entities.Product.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => db.entities.Kit.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kits'] });
      setShowForm(false);
      setSelectedReseller('');
      setSelectedProducts([]);
      setQuantities({});
      toast.success('Kit criado com sucesso');
    }
  });

  const handleCreateKit = () => {
    const reseller = resellers.find(r => r.id === selectedReseller);
    if (!reseller || selectedProducts.length === 0) {
      toast.error('Selecione revendedora e pelo menos um produto');
      return;
    }

    const items = selectedProducts.map(pid => {
      const p = products.find(pr => pr.id === pid);
      const qty = quantities[pid] || 1;
      return {
        product_id: pid,
        product_name: p.name,
        sku: p.sku,
        quantity: qty,
        sale_price: p.sale_price,
        status: 'pendente'
      };
    });

    const total = items.reduce((sum, i) => sum + (i.sale_price * i.quantity), 0);

    createMutation.mutate({
      code: `KIT-${Date.now().toString(36).toUpperCase()}`,
      reseller_id: reseller.id,
      reseller_name: reseller.name,
      items,
      total_value: total,
      status: 'preparando',
      delivery_date: new Date().toISOString().split('T')[0]
    });
  };

  const toggleProduct = (pid) => {
    setSelectedProducts(prev =>
      prev.includes(pid) ? prev.filter(p => p !== pid) : [...prev, pid]
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kits de Consignação"
        subtitle={`${kits.length} kits no sistema`}
        actions={
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Novo Kit
          </Button>
        }
      />

      {kits.length === 0 ? (
        <EmptyState
          icon={Boxes}
          title="Nenhum kit criado"
          description="Monte kits de produtos para enviar às revendedoras"
          action={<Button onClick={() => setShowForm(true)}>Criar Kit</Button>}
        />
      ) : (
        <div className="space-y-3">
          {kits.map(kit => {
            const status = STATUS_MAP[kit.status] || STATUS_MAP.preparando;
            return (
              <Card key={kit.id} className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/settlements?kit=${kit.id}`)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Boxes className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm">{kit.code}</h3>
                          <Badge className={`text-xs ${status.color}`}>{status.label}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {kit.reseller_name} · {kit.items?.length || 0} itens · {formatCurrency(kit.total_value)}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Kit de Consignação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Revendedora</Label>
              <Select value={selectedReseller} onValueChange={setSelectedReseller}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {resellers.map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.name} - {r.city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2 block">Produtos</Label>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {products.filter(p => p.active !== false && (p.central_stock || 0) > 0).map(p => (
                  <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg border">
                    <Checkbox
                      checked={selectedProducts.includes(p.id)}
                      onCheckedChange={() => toggleProduct(p.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(p.sale_price)} · Estoque: {p.central_stock}</p>
                    </div>
                    {selectedProducts.includes(p.id) && (
                      <Input
                        type="number"
                        min={1}
                        max={p.central_stock}
                        value={quantities[p.id] || 1}
                        onChange={(e) => setQuantities(prev => ({ ...prev, [p.id]: parseInt(e.target.value) || 1 }))}
                        className="w-16 text-center"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {selectedProducts.length > 0 && (
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-sm font-medium">
                  Total: {formatCurrency(selectedProducts.reduce((sum, pid) => {
                    const p = products.find(pr => pr.id === pid);
                    return sum + ((p?.sale_price || 0) * (quantities[pid] || 1));
                  }, 0))}
                </p>
                <p className="text-xs text-muted-foreground">{selectedProducts.length} produto(s) selecionado(s)</p>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button onClick={handleCreateKit} disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Criando...' : 'Criar Kit'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}