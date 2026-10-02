'use client';

import { Container, SectionHeader } from '@trak-watch/ui/components/layout';
import { Card, CardContent } from '@trak-watch/ui/components/primitives/Card';
import { Button } from '@trak-watch/ui/components/primitives/Button';
import { useLists } from '@/features/lists/store';
import { readSyncEvents } from '@/features/sync/outbox';
import { Heart, Eye, Check, Clock, Download } from 'lucide-react';

export function ProfilePage() {
  const { lists, items, exportJson } = useLists();
  const byStatus = (s: string) => items.filter((i) => i.status === s).length;
  const pendingSync = readSyncEvents().length;

  const stats = [
    { icon: Heart, label: 'Favoritas', value: byStatus('favoritas'), color: 'text-red-400 bg-red-400/10' },
    { icon: Eye, label: 'Pendientes', value: byStatus('pendientes'), color: 'text-blue-400 bg-blue-400/10' },
    { icon: Check, label: 'Vistas', value: byStatus('vistas'), color: 'text-green-400 bg-green-400/10' },
    { icon: Clock, label: 'En listas', value: items.length, color: 'text-purple-400 bg-purple-400/10' },
  ];

  const handleExport = () => {
    const blob = new Blob([exportJson()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trak-watch-listas-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen">
      <main className="py-8">
        <Container>
          <SectionHeader title="Mi colección" description="Uso local, sin cuenta. Tus datos están en este navegador." />

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((s) => (
              <Card key={s.label}>
                <CardContent className="pt-6 text-center">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-3 ${s.color}`}>
                    <s.icon className="h-6 w-6" />
                  </div>
                  <p className="text-3xl font-bold text-fg">{s.value}</p>
                  <p className="text-sm text-fg-muted">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-fg">{lists.length} listas · {items.length} elementos</p>
                  <p className="text-sm text-fg-muted">
                    {pendingSync > 0
                      ? `${pendingSync} cambios pendientes de sincronizar con Stremio.`
                      : 'Todo sincronizable está al día en local.'}
                  </p>
                </div>
                <Button variant="secondary" onClick={handleExport} className="gap-2">
                  <Download className="h-4 w-4" />
                  Exportar datos
                </Button>
              </div>
            </CardContent>
          </Card>
        </Container>
      </main>
    </div>
  );
}
