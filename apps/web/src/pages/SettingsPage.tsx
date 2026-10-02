'use client';

import React, { useState } from 'react';
import { Container, SectionHeader } from '@trak-watch/ui/components/layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@trak-watch/ui/components/primitives/Card';
import { Button } from '@trak-watch/ui/components/primitives/Button';
import { Input } from '@trak-watch/ui/components/primitives/Input';
import { Switch } from '@trak-watch/ui/components/primitives/Switch';
import { useLists } from '@/features/lists/store';
import { User, Palette, Bell, Shield, Globe } from 'lucide-react';
import { useToast } from '@trak-watch/ui/components/primitives/useToast';

type Tab = 'account' | 'appearance' | 'notifications' | 'stremio' | 'data';

function useSetting<T>(key: string, initial: T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(`trakwatch:settings:${key}`);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });
  return [
    value,
    (v: T) => {
      setValue(v);
      try {
        localStorage.setItem(`trakwatch:settings:${key}`, JSON.stringify(v));
      } catch {
        // ignorar
      }
    },
  ];
}

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('account');
  const { exportJson, importJson } = useLists();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useSetting('displayName', 'Mi colección');
  const [theme, setTheme] = useSetting<'dark' | 'light'>('theme', 'dark');
  const [notifyNew, setNotifyNew] = useSetting('notifyNew', false);
  const [notifyReco, setNotifyReco] = useSetting('notifyReco', false);

  const tabs = [
    { id: 'account' as Tab, label: 'Cuenta', icon: User },
    { id: 'appearance' as Tab, label: 'Apariencia', icon: Palette },
    { id: 'notifications' as Tab, label: 'Notificaciones', icon: Bell },
    { id: 'stremio' as Tab, label: 'Stremio', icon: Shield },
    { id: 'data' as Tab, label: 'Datos', icon: Globe },
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

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { imported, errors } = importJson(await file.text());
    if (errors.length > 0) {
      toast({ title: 'Importación parcial', description: errors[0], variant: 'warning' });
    } else {
      toast({ title: 'Importado', description: `${imported} elementos importados`, variant: 'success' });
    }
    e.target.value = '';
  };

  return (
    <div className="min-h-screen">
      <main className="py-8">
        <Container className="max-w-3xl">
          <SectionHeader title="Ajustes" description="Configuración local de Trak Watch" />

          <div className="flex flex-wrap gap-2 mb-8 border-b border-border pb-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-accent/20 text-accent border border-accent/30'
                    : 'text-fg-muted hover:text-fg hover:bg-bg-card'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'account' && (
            <Card>
              <CardHeader>
                <CardTitle>Cuenta local</CardTitle>
                <CardDescription>Sin login por ahora: todo se guarda en este navegador</CardDescription>
              </CardHeader>
              <CardContent>
                <Input
                  label="Nombre de tu colección"
                  value={displayName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDisplayName(e.target.value)}
                  maxLength={60}
                />
              </CardContent>
            </Card>
          )}

          {activeTab === 'appearance' && (
            <Card>
              <CardHeader>
                <CardTitle>Apariencia</CardTitle>
                <CardDescription>Tema de la app</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {(['dark', 'light'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTheme(t)}
                      className={`p-4 rounded-lg border-2 transition-all capitalize ${
                        theme === t ? 'border-accent bg-accent/10' : 'border-border hover:border-accent/50'
                      }`}
                    >
                      {t === 'dark' ? 'Oscuro' : 'Claro'}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-fg-subtle mt-3">El tema claro completo llegará más adelante; hoy manda el modo oscuro.</p>
              </CardContent>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle>Notificaciones</CardTitle>
                <CardDescription>Preferencias locales (sin servidor todavía)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-fg">Nuevos episodios</p>
                    <p className="text-sm text-fg-muted">Avisar de novedades de mis series</p>
                  </div>
                  <Switch checked={notifyNew} onCheckedChange={setNotifyNew} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-fg">Recomendaciones</p>
                    <p className="text-sm text-fg-muted">Sugerencias semanales</p>
                  </div>
                  <Switch checked={notifyReco} onCheckedChange={setNotifyReco} />
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'stremio' && (
            <Card>
              <CardHeader>
                <CardTitle>Stremio</CardTitle>
                <CardDescription>El addon llegará después; la app ya deja todo sync-ready</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-fg-muted">
                  Cada elemento guarda <code className="bg-bg px-1 rounded text-xs">tmdb_id + imdb_id + media_type</code> y
                  cada cambio de estado queda registrado para sincronizar.
                </p>
                <Button variant="secondary" asChild>
                  <a href="/lists">Ver mis listas</a>
                </Button>
              </CardContent>
            </Card>
          )}

          {activeTab === 'data' && (
            <Card>
              <CardHeader>
                <CardTitle>Datos</CardTitle>
                <CardDescription>Exporta o importa tus listas en JSON</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={handleExport}>
                    Exportar JSON
                  </Button>
                  <label className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-fg bg-bg-elevated border border-border rounded-lg hover:bg-bg-card cursor-pointer">
                    Importar JSON
                    <input type="file" accept="application/json" className="hidden" onChange={handleImportFile} />
                  </label>
                </div>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (window.confirm('¿Borrar todas las listas locales?')) {
                      localStorage.removeItem('trakwatch:lists:v1');
                      window.location.reload();
                    }
                  }}
                >
                  Borrar datos locales
                </Button>
              </CardContent>
            </Card>
          )}
        </Container>
      </main>
    </div>
  );
}
