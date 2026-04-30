import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, Loader2, Upload } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { toast } from 'sonner';
import { db } from '@/lib/localDb.js';

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
  const [backupJson, setBackupJson] = useState('');

  const handleExport = async () => {
    setLoading(true);
    setStats(null);

    try {
      const data = {};
      const counts = {};

      for (const entity of ENTITIES) {
        const items = await db.entities[entity.key].filter();
        data[entity.key] = items;
        counts[entity.label] = items.length;
      }

      const backup = {
        version: '1.0',
        createdAt: new Date().toISOString(),
        data,
      };

      const jsonString = JSON.stringify(backup, null, 2);
      setBackupJson(jsonString);
      setStats({ totalEntities: ENTITIES.length, counts });

      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'backup.json';
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);

      toast.success('Backup exportado com sucesso!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao exportar backup.');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setRestoring(true);

    try {
      const content = await file.text();
      const backup = JSON.parse(content);

      if (!backup?.data) {
        throw new Error('Arquivo de backup inválido.');
      }

      for (const entity of ENTITIES) {
        const items = backup.data[entity.key] || [];
        localStorage.setItem(`${entity.key.toLowerCase()}s`, JSON.stringify(items));
      }

      toast.success('Backup restaurado com sucesso!');
    } catch (error) {
      console.error(error);
      toast.error('Falha ao restaurar backup. Verifique o arquivo.');
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Backup" description="Exportar ou restaurar os dados da aplicação." />

      <Card>
        <CardHeader>
          <CardTitle>Backup de dados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p>Faça backup dos dados atuais ou restaure a partir de um arquivo JSON.</p>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button onClick={handleExport} disabled={loading} variant="default">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                Exportar backup
              </Button>
              <label className="cursor-pointer rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50">
                <Upload className="mr-2 inline-block h-4 w-4" />
                {restoring ? 'Restaurando...' : 'Restaurar backup'}
                <input type="file" accept="application/json" className="hidden" onChange={handleRestore} />
              </label>
            </div>
          </div>

          {stats && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ENTITIES.map((entity) => (
                <Badge key={entity.key} className="bg-slate-100 text-slate-900">
                  {entity.label}: {stats.counts[entity.label]}
                </Badge>
              ))}
            </div>
          )}

          {backupJson && (
            <pre className="max-h-56 overflow-auto rounded-md border bg-slate-950 p-4 text-xs text-slate-100">
              {backupJson}
            </pre>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
