const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

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