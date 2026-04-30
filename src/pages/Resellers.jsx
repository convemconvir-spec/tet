const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { Users, Plus, Search, Edit, Phone, MapPin, Trash2, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import { formatCurrency } from '@/components/shared/CurrencyDisplay';
import CepInput from '@/components/shared/CepInput';
import { toast } from 'sonner';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function Resellers() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [addressData, setAddressData] = useState({});
  const [numero, setNumero] = useState('');
  const qc = useQueryClient();

  const { data: resellers = [], isLoading } = useQuery({
    queryKey: ['resellers'],
    queryFn: () => db.entities.Reseller.list()
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editing
      ? db.entities.Reseller.update(editing.id, data)
      : db.entities.Reseller.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['resellers'] });
      setShowForm(false);
      setEditing(null);
      setAddressData({});
      setNumero('');
      toast.success(editing ? 'Revendedora atualizada' : 'Revendedora cadastrada');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => db.entities.Reseller.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['resellers'] });
      toast.success('Revendedora removida');
    }
  });

  const filtered = resellers.filter(r =>
    r.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.city?.toLowerCase().includes(search.toLowerCase()) ||
    r.region?.toLowerCase().includes(search.toLowerCase())
  );

  const openForm = (reseller = null) => {
    setEditing(reseller);
    setAddressData(reseller ? {
      address: reseller.address,
      city: reseller.city,
      state: reseller.state,
      latitude: reseller.latitude,
      longitude: reseller.longitude,
    } : {});
    setNumero(reseller?.numero || '');
    setShowForm(true);
  };

  const handleAddressFound = (data) => {
    setAddressData(data);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = {
      name: fd.get('name'),
      phone: fd.get('phone'),
      email: fd.get('email'),
      numero: numero,
      address: addressData.address ? `${addressData.address}${numero ? ', ' + numero : ''}` : fd.get('address'),
      city: addressData.city || fd.get('city'),
      state: addressData.state || fd.get('state'),
      region: fd.get('region'),
      latitude: addressData.latitude || null,
      longitude: addressData.longitude || null,
      commission_rate: parseFloat(fd.get('commission_rate')) || 30,
      notes: fd.get('notes'),
      active: true
    };
    saveMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Revendedoras"
        subtitle={`${resellers.length} revendedoras ativas`}
        actions={
          <Button onClick={() => openForm()} className="gap-2">
            <Plus className="w-4 h-4" /> Nova Revendedora
          </Button>
        }
      />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, cidade ou região..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {filtered.length === 0 && !isLoading ? (
        <EmptyState
          icon={Users}
          title="Nenhuma revendedora encontrada"
          description="Cadastre suas revendedoras para começar"
          action={<Button onClick={() => openForm()}>Cadastrar Revendedora</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(reseller => (
            <Card key={reseller.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">
                        {reseller.name?.[0]?.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{reseller.name}</h3>
                      <p className="text-xs text-muted-foreground">{reseller.region || 'Sem região'}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant={reseller.active !== false ? 'default' : 'secondary'} className="text-xs">
                      {reseller.active !== false ? 'Ativa' : 'Inativa'}
                    </Badge>
                    {reseller.latitude && reseller.longitude && (
                      <span className="text-xs text-green-600 flex items-center gap-0.5">
                        <MapPin className="w-3 h-3" /> No mapa
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  {reseller.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="w-3 h-3" />
                      <a href={`https://wa.me/55${reseller.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="hover:text-primary">
                        {reseller.phone}
                      </a>
                    </div>
                  )}
                  {(reseller.city || reseller.address) && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">{reseller.address ? `${reseller.address}, ` : ''}{reseller.city}{reseller.state ? ` - ${reseller.state}` : ''}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div className="p-2 rounded-lg bg-muted text-center">
                    <span className="text-xs text-muted-foreground block">Comissão</span>
                    <span className="text-sm font-semibold">{reseller.commission_rate || 30}%</span>
                  </div>
                  <div className="p-2 rounded-lg bg-muted text-center">
                    <span className="text-xs text-muted-foreground block">Saldo</span>
                    <span className="text-sm font-semibold">{formatCurrency(reseller.balance)}</span>
                  </div>
                </div>

                <div className="flex gap-2 mt-3">
                  <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => openForm(reseller)}>
                    <Edit className="w-3 h-3 mr-1" /> Editar
                  </Button>
                  <Button variant="outline" size="sm" className="text-destructive text-xs" onClick={() => deleteMutation.mutate(reseller.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Revendedora' : 'Nova Revendedora'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">

              {/* Nome e contato */}
              <div className="col-span-2">
                <Label>Nome</Label>
                <Input name="name" defaultValue={editing?.name} required />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input name="phone" defaultValue={editing?.phone} required placeholder="(11) 99999-9999" />
              </div>
              <div>
                <Label>Email</Label>
                <Input name="email" type="email" defaultValue={editing?.email} />
              </div>

              {/* CEP - preenche tudo automaticamente */}
              <div className="col-span-2">
                <CepInput
                  defaultCep={editing?.cep || ''}
                  onAddressFound={handleAddressFound}
                />
              </div>

              {/* Número - aparece após CEP ser preenchido */}
              {addressData.address && (
                <div className="col-span-2">
                  <Label>Número</Label>
                  <Input
                    placeholder="Ex: 123, S/N"
                    value={numero}
                    onChange={(e) => setNumero(e.target.value)}
                    autoFocus
                  />
                </div>
              )}

              {/* Endereço preenchido automaticamente */}
              <div className="col-span-2">
                <Label>Logradouro</Label>
                <Input
                  name="address"
                  value={addressData.address || ''}
                  onChange={(e) => setAddressData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Preenchido pelo CEP"
                />
              </div>
              <div>
                <Label>Cidade</Label>
                <Input
                  name="city"
                  value={addressData.city || ''}
                  onChange={(e) => setAddressData(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="Preenchido pelo CEP"
                />
              </div>
              <div>
                <Label>Estado</Label>
                <Input
                  name="state"
                  value={addressData.state || ''}
                  onChange={(e) => setAddressData(prev => ({ ...prev, state: e.target.value }))}
                  placeholder="SP"
                />
              </div>

              <div>
                <Label>Região</Label>
                <Input name="region" defaultValue={editing?.region} />
              </div>
              <div>
                <Label>Comissão (%)</Label>
                <Input name="commission_rate" type="number" defaultValue={editing?.commission_rate || 30} />
              </div>

              {/* Coordenadas (somente leitura, preenchidas pelo CEP) */}
              {addressData.latitude && addressData.longitude && (
                <div className="col-span-2">
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-green-50 border border-green-200">
                    <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                    <div className="text-xs text-green-700">
                      <span className="font-medium">Localização encontrada: </span>
                      {addressData.latitude.toFixed(5)}, {addressData.longitude.toFixed(5)}
                    </div>
                  </div>
                </div>
              )}

              {/* Mini mapa de preview */}
              {addressData.latitude && addressData.longitude && (
                <div className="col-span-2 rounded-lg overflow-hidden border h-44">
                  <MapContainer
                    key={`${addressData.latitude}-${addressData.longitude}`}
                    center={[addressData.latitude, addressData.longitude]}
                    zoom={15}
                    className="h-full w-full z-0"
                    zoomControl={false}
                    dragging={false}
                    scrollWheelZoom={false}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={[addressData.latitude, addressData.longitude]}>
                      <Popup>{addressData.address}, {addressData.city}</Popup>
                    </Marker>
                  </MapContainer>
                </div>
              )}

              <div className="col-span-2">
                <Label>Observações</Label>
                <Textarea name="notes" defaultValue={editing?.notes} />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}