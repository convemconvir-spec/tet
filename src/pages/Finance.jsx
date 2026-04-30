import { db } from '../../lib/localDb.js';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { DollarSign, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Percent } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import PageHeader from '@/components/shared/PageHeader';
import StatCard from '@/components/shared/StatCard';
import { formatCurrency } from '@/components/shared/CurrencyDisplay';
import { format, subDays, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Finance() {
  const [period, setPeriod] = useState('30');

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => db.entities.FinancialTransaction.list('-created_date')
  });

  const { data: settlements = [] } = useQuery({
    queryKey: ['settlements'],
    queryFn: () => db.entities.Settlement.list()
  });

  const cutoffDate = subDays(new Date(), parseInt(period));
  const filtered = transactions.filter(t => {
    const tDate = t.date ? new Date(t.date) : new Date(t.created_date);
    return isAfter(tDate, cutoffDate);
  });

  const entradas = filtered.filter(t => t.type === 'entrada').reduce((s, t) => s + (t.amount || 0), 0);
  const comissoes = filtered.filter(t => t.type === 'comissao').reduce((s, t) => s + (t.amount || 0), 0);
  const perdas = filtered.filter(t => t.type === 'perda').reduce((s, t) => s + (t.amount || 0), 0);
  const liquido = entradas - comissoes - perdas;

  const pendingSettlements = settlements.filter(s => s.status === 'parcial' || s.status === 'pendente');
  const receivables = pendingSettlements.reduce((s, settlement) => s + ((settlement.amount_due || 0) - (settlement.amount_paid || 0)), 0);

  // Chart data - group by day
  const chartData = (() => {
    const days = {};
    const numDays = parseInt(period);
    for (let i = numDays; i >= 0; i--) {
      const d = format(subDays(new Date(), i), 'dd/MM');
      days[d] = { date: d, entradas: 0, comissoes: 0 };
    }
    filtered.forEach(t => {
      const d = format(t.date ? new Date(t.date) : new Date(t.created_date), 'dd/MM');
      if (days[d]) {
        if (t.type === 'entrada') days[d].entradas += t.amount || 0;
        if (t.type === 'comissao') days[d].comissoes += t.amount || 0;
      }
    });
    return Object.values(days);
  })();

  // Top resellers
  const resellerTotals = {};
  filtered.filter(t => t.type === 'entrada').forEach(t => {
    const name = t.reseller_name || 'Desconhecido';
    resellerTotals[name] = (resellerTotals[name] || 0) + (t.amount || 0);
  });
  const topResellers = Object.entries(resellerTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, total]) => ({ name, total }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Painel Financeiro"
        subtitle="Fluxo de caixa e análise de desempenho"
        actions={
          <Tabs value={period} onValueChange={setPeriod}>
            <TabsList>
              <TabsTrigger value="7" className="text-xs">7 dias</TabsTrigger>
              <TabsTrigger value="30" className="text-xs">30 dias</TabsTrigger>
              <TabsTrigger value="90" className="text-xs">90 dias</TabsTrigger>
            </TabsList>
          </Tabs>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Entradas" value={formatCurrency(entradas)} icon={TrendingUp} />
        <StatCard title="Comissões" value={formatCurrency(comissoes)} icon={Percent} />
        <StatCard title="Líquido" value={formatCurrency(liquido)} icon={DollarSign} />
        <StatCard title="A Receber" value={formatCurrency(receivables)} icon={ArrowUpRight} />
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Fluxo de Caixa</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="entradas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(215,65%,25%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(215,65%,25%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="comissoes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(38,92%,50%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(38,92%,50%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(210,15%,89%)" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${v}`} />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Area type="monotone" dataKey="entradas" stroke="hsl(215,65%,25%)" fill="url(#entradas)" name="Entradas" />
              <Area type="monotone" dataKey="comissoes" stroke="hsl(38,92%,50%)" fill="url(#comissoes)" name="Comissões" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Resellers */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Top Revendedoras</CardTitle>
          </CardHeader>
          <CardContent>
            {topResellers.length > 0 ? (
              <div className="space-y-3">
                {topResellers.map((r, i) => (
                  <div key={r.name} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{r.name}</p>
                    </div>
                    <p className="text-sm font-semibold">{formatCurrency(r.total)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Sem dados no período</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Últimas Transações</CardTitle>
          </CardHeader>
          <CardContent>
            {filtered.length > 0 ? (
              <div className="space-y-2">
                {filtered.slice(0, 8).map(t => (
                  <div key={t.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${t.type === 'entrada' ? 'bg-green-100' : t.type === 'comissao' ? 'bg-orange-100' : 'bg-red-100'}`}>
                        {t.type === 'entrada' ? (
                          <ArrowUpRight className="w-3 h-3 text-green-700" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3 text-orange-700" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-medium truncate max-w-[160px]">{t.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {t.date ? format(new Date(t.date), "dd/MM", { locale: ptBR }) : ''}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs font-semibold ${t.type === 'entrada' ? 'text-green-700' : 'text-orange-700'}`}>
                      {t.type === 'entrada' ? '+' : '-'}{formatCurrency(t.amount)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Sem transações no período</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}