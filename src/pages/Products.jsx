const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { Package, Plus, Search, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import { formatCurrency } from '@/components/shared/CurrencyDisplay';
import { toast } from 'sonner';

const CATEGORIES = {
  cosmeticos: 'Cosméticos',
  perfumaria: 'Perfumaria',
  cuidados_pessoais: 'Cuidados Pessoais',
  maquiagem: 'Maquiagem',
  acessorios: 'Acessórios',
  outros: 'Outros'
};

export default function Products() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const qc = useQueryClient();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => db.entities.Product.list()
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editing
      ? db.entities.Product.update(editing.id, data)
      : db.entities.Product.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      setShowForm(false);
      setEditing(null);
      toast.success(editing ? 'Produto atualizado' : 'Produto criado');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => db.entities.Product.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produto removido');
    }
  });

  const filtered = products.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = {
      name: fd.get('name'),
      sku: fd.get('sku'),
      category: fd.get('category'),
      sale_price: parseFloat(fd.get('sale_price')) || 0,
      cost_price: parseFloat(fd.get('cost_price')) || 0,
      central_stock: parseInt(fd.get('central_stock')) || 0,
      min_stock: parseInt(fd.get('min_stock')) || 5,
      photo_url: fd.get('photo_url'),
      active: true
    };
    saveMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Produtos"
        subtitle={`${products.length} produtos cadastrados`}
        actions={
          <Button onClick={() => { setEditing(null); setShowForm(true); }} className="gap-2">
            <Plus className="w-4 h-4" /> Novo Produto
          </Button>
        }
      />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {filtered.length === 0 && !isLoading ? (
        <EmptyState
          icon={Package}
          title="Nenhum produto encontrado"
          description="Comece adicionando seus primeiros produtos ao catálogo"
          action={<Button onClick={() => setShowForm(true)}>Adicionar Produto</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(product => (
            <Card key={product.id} className="overflow-hidden hover:shadow-md transition-shadow">
              {product.photo_url && (
                <div className="h-40 bg-muted">
                  <img src={product.photo_url} alt={product.name} className="w-full h-full object-cover" />
                </div>
              )}
              <CardContent className={product.photo_url ? "p-4" : "p-4"}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-sm">{product.name}</h3>
                    <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {CATEGORIES[product.category] || product.category}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                  <div className="p-2 rounded-lg bg-muted">
                    <span className="text-muted-foreground">Venda</span>
                    <p className="font-semibold">{formatCurrency(product.sale_price)}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted">
                    <span className="text-muted-foreground">Custo</span>
                    <p className="font-semibold">{formatCurrency(product.cost_price)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <div className="flex-1 flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${(product.central_stock || 0) <= (product.min_stock || 5) ? 'bg-orange-500' : 'bg-green-500'}`} />
                    <span className="text-xs">Central: {product.central_stock || 0}</span>
                  </div>
                  <div className="flex-1 text-xs text-muted-foreground">
                    Trânsito: {product.transit_stock || 0}
                  </div>
                </div>

                {(product.central_stock || 0) <= (product.min_stock || 5) && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-orange-600">
                    <AlertTriangle className="w-3 h-3" />
                    Estoque baixo
                  </div>
                )}

                <div className="flex gap-2 mt-3">
                  <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => { setEditing(product); setShowForm(true); }}>
                    <Edit className="w-3 h-3 mr-1" /> Editar
                  </Button>
                  <Button variant="outline" size="sm" className="text-destructive text-xs" onClick={() => deleteMutation.mutate(product.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Nome</Label>
                <Input name="name" defaultValue={editing?.name} required />
              </div>
              <div>
                <Label>SKU</Label>
                <Input name="sku" defaultValue={editing?.sku} required />
              </div>
              <div>
                <Label>Categoria</Label>
                <Select name="category" defaultValue={editing?.category || 'outros'}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORIES).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Preço Venda (R$)</Label>
                <Input name="sale_price" type="number" step="0.01" defaultValue={editing?.sale_price} required />
              </div>
              <div>
                <Label>Preço Custo (R$)</Label>
                <Input name="cost_price" type="number" step="0.01" defaultValue={editing?.cost_price} required />
              </div>
              <div>
                <Label>Estoque Central</Label>
                <Input name="central_stock" type="number" defaultValue={editing?.central_stock || 0} />
              </div>
              <div>
                <Label>Estoque Mínimo</Label>
                <Input name="min_stock" type="number" defaultValue={editing?.min_stock || 5} />
              </div>
              <div className="col-span-2">
                <Label>URL da Foto</Label>
                <Input name="photo_url" defaultValue={editing?.photo_url} placeholder="https://..." />
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