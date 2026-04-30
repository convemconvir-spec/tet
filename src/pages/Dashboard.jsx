import { db } from '../../lib/localDb.js';

import React from 'react';
import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/lib/AuthContext';
import { Package, Users, Boxes, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import StatCard from '@/components/shared/StatCard';
import PageHeader from '@/components/shared/PageHeader';
import { formatCurrency } from '@/components/shared/CurrencyDisplay';

const COLORS = ['hsl(215,65%,25%)', 'hsl(200,75%,45%)', 'hsl(160,60%,45%)', 'hsl(38,92%,50%)', 'hsl(0,72%,51%)'];

export default function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => db.entities.Product.list()
  });

  const { data: resellers = [] } = useQuery({
    queryKey: ['resellers'],
    queryFn: () => db.entities.Reseller.list()
  });

  const { data: kits = [] } = useQuery({
    queryKey: ['kits'],
    queryFn: () => db.entities.Kit.list()
  });

  const { data: settlements = [] } = useQuery({
    queryKey: ['settlements'],
    queryFn: () => db.entities.Settlement.list()
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => db.entities.FinancialTransaction.list()
  });

  const totalSales = settlements.reduce((sum, s) => sum + (s.total_sales || 0), 0);
  const activeKits = kits.filter(k => k.status === 'entregue' || k.status === 'em_acerto').length;
  const lowStock = products.filter(p => (p.central_stock || 0) <= (p.min_stock || 5)).length;

  const regionData = resellers.reduce((acc, r) => {
    const region = r.region || 'Sem Região';
    const existing = acc.find(a => a.name === region);
    if (existing) { existing.value += 1; } else { acc.push({ name: region, value: 1 }); }
    return acc;
  }, []);

  const statusData = [
    { name: 'Preparando', value: kits.filter(k => k.status === 'preparando').length },
    { name: 'Entregue', value: kits.filter(k => k.status === 'entregue').length },
    { name: 'Em Acerto', value: kits.filter(k => k.status === 'em_acerto').length },
    { name: 'Finalizado', value: kits.filter(k => k.status === 'finalizado').length },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Olá, ${user?.full_name?.split(' ')[0] || 'Usuário'}`}
        subtitle="Aqui está o resumo das suas operações"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Vendas Totais" value={formatCurrency(totalSales)} icon={DollarSign} />
        <StatCard title="Revendedoras" value={resellers.length} icon={Users} />
        <StatCard title="Kits Ativos" value={activeKits} icon={Boxes} />
        <StatCard title="Produtos" value={products.length} icon={Package} />
      </div>

      {/* Alerts */}
      {lowStock > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0" />
            <div>
              <p className="text-sm font-medium text-orange-900">{lowStock} produto(s) com estoque baixo</p>
              <p className="text-xs text-orange-700">Verifique o estoque central para reposição</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Status dos Kits</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={statusData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(210,15%,89%)" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(215,65%,25%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">Nenhum kit cadastrado ainda</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Revendedoras por Região</CardTitle>
          </CardHeader>
          <CardContent>
            {regionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={regionData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {regionData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">Nenhuma revendedora cadastrada</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Settlements */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Últimos Acertos</CardTitle>
        </CardHeader>
        <CardContent>
          {settlements.length > 0 ? (
            <div className="space-y-3">
              {settlements.slice(0, 5).map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="text-sm font-medium">{s.reseller_name}</p>
                    <p className="text-xs text-muted-foreground">Kit: {s.kit_code}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatCurrency(s.total_sales)}</p>
                    <Badge variant={s.status === 'concluido' ? 'default' : 'secondary'} className="text-xs">
                      {s.status === 'concluido' ? 'Concluído' : s.status === 'parcial' ? 'Parcial' : 'Pendente'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum acerto realizado</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}