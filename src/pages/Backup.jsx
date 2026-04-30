import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, Database, CheckCircle2, Loader2, AlertTriangle, Upload } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { toast } from 'sonner';

const ENTITIES = [
  { key: 'Product', label: 'Produtos' },
  { key: 'Reseller', label: 'Revendedoras' },
  { key: 'Kit', label: 'Kits' },
  { key: 'Settlement', label: 'Acertos' },
  { key: 'FinancialTransaction', label: 'Transações Financeiras' },
];

export default function Backup() {
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [stats, setStats] = useState(null);

  const handleExport = async () => {
    setLoading(true);
    setStats(null);
    try {
      const backup = {
        version: '1.0',