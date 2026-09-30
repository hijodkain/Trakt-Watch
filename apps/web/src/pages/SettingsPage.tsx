'use client';

import { useState } from 'react';
import { Container, SectionHeader } from '@trak-watch/ui/components/layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Button, Input, Switch, Avatar, AvatarImage, AvatarFallback } from '@trak-watch/ui';
import { supabase } from '@/features/auth/AuthProvider';
import { useAuth } from '@/features/auth/AuthProvider';
import { User, Moon, Sun, Bell, Globe, Shield, Palette, Camera, Save, Loader2 } from 'lucide-react';

export function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'account' | 'appearance' | 'notifications' | 'stremio' | 'data'>('account');
  const [saving, setSaving] = useState(false);

  const tabs: Array<{ id: 'account' | 'appearance' | 'notifications' | 'stremio' | 'data'; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'account', label: 'Cuenta', icon: User },
    { id: 'appearance', label: 'Apariencia', icon: Palette },
    { id: 'notifications', label: 'Notificaciones', icon: Bell },
    { id: 'stremio', label: 'Stremio', icon: Shield },
    { id: 'data', label: 'Datos', icon: Globe },
  ];

  return (
    <div className="min-h-screen">
      <main className="py-8">
        <Container className="max-w-3xl">
          <SectionHeader title="Ajustes" description="Configura tu experiencia en Trak Watch" />
          
          {/* Tab Navigation */}
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

          {/* Account Tab */}
          {activeTab === 'account' && (
            <Card>
              <CardHeader>
                <CardTitle>Cuenta</CardTitle>
                <CardDescription>Gestiona tu información personal</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={user?.user_metadata?.avatar_url || ''} alt={user?.user_metadata?.full_name || ''} />
                    <AvatarFallback className="text-2xl">{user?.user_metadata?.full_name?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-fg">Foto de perfil</h3>
                    <p className="text-sm text-fg-muted">Arrastra una imagen o haz clic para subir</p>
                    <Button variant="secondary" className="mt-2 gap-2">
                      <Camera className="h-4 w-4" />
                      Cambiar foto
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Nombre completo" value={user?.user_metadata?.full_name || ''} placeholder="Tu nombre" />
                  <Input label="Nombre de usuario" value={user?.user_metadata?.username || ''} placeholder="@usuario" />
                </div>
                <Input label="Email" type="email" value={user?.email || ''} disabled />
                <Button onClick={() => setSaving(true)} loading={saving} className="gap-2">
                  <Save className="h-4 w-4" />
                  Guardar cambios
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <Card>
              <CardHeader>
                <CardTitle>Apariencia</CardTitle>
                <CardDescription>Personaliza cómo se ve Trak Watch</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-fg mb-3">Tema</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['light', 'dark', 'system'].map((theme) => (
                      <button
                        key={theme}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          theme === 'dark' ? 'border-accent bg-accent/10' : 'border-border hover:border-accent/50'
                        }`}
                      >
                        <div className="text-center">
                          {theme === 'light' && <Sun className="h-8 w-8 mx-auto mb-2 text-yellow-400" />}
                          {theme === 'dark' && <Moon className="h-8 w-8 mx-auto mb-2 text-blue-400" />}
                          {theme === 'system' && <Globe className="h-8 w-8 mx-auto mb-2 text-purple-400" />}
                          <p className="text-sm font-medium capitalize">{theme}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-fg mb-3">Idioma</label>
                  <select className="w-full px-4 py-2.5 text-sm text-fg bg-bg-elevated border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent">
                    <option value="es">Español</option>
                    <option value="en">English</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-fg mb-3">Tamaño de pósters</label>
                  <select className="w-full px-4 py-2.5 text-sm text-fg bg-bg-elevated border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent">
                    <option value="small">Pequeño</option>
                    <option value="medium">Mediano</option>
                    <option value="large">Grande</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle>Notificaciones</CardTitle>
                <CardDescription>Configura qué notificaciones recibes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { id: 'new_episodes', label: 'Nuevos episodios', desc: 'Avisarme cuando salga un nuevo episodio de mis series' },
                  { id: 'recommendations', label: 'Recomendaciones', desc: 'Recibir sugerencias personalizadas semanalmente' },
                  { id: 'social', label: 'Actividad social', desc: 'Notificaciones cuando alguien sigue mis listas' },
                  { id: 'marketing', label: 'Novedades', desc: 'Emails sobre nuevas funciones y actualizaciones' },
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-fg">{item.label}</p>
                      <p className="text-sm text-fg-muted">{item.desc}</p>
                    </div>
                    <Switch checked={true} onCheckedChange={() => {}} />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Stremio Tab */}
          {activeTab === 'stremio' && (
            <Card>
              <CardHeader>
                <CardTitle>Stremio</CardTitle>
                <CardDescription>Conecta tus listas con Stremio</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-bg-elevated rounded-lg border border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-fg">Plugin de Stremio</p>
                      <p className="text-sm text-fg-muted">Sincroniza tus listas con el addon de Stremio</p>
                    </div>
                    <span className="px-3 py-1 text-sm font-medium bg-green-500/20 text-green-400 border border-green-500/30 rounded-full">Conectado</span>
                  </div>
                </div>
                <Button variant="secondary" className="w-full gap-2" asChild>
                  <a href="/stremio">Gestionar conexión</a>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Data Tab */}
          {activeTab === 'data' && (
            <Card>
              <CardHeader>
                <CardTitle>Datos</CardTitle>
                <CardDescription>Exporta o importa tus datos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="secondary" className="gap-2 h-auto py-4" asChild>
                    <a href="/profile/export">
                      <Download className="h-5 w-5" />
                      <div>
                        <p className="font-medium">Exportar datos</p>
                        <p className="text-xs text-fg-muted">Descargar JSON con tus listas</p>
                      </div>
                    </a>
                  </Button>
                  <Button variant="secondary" className="gap-2 h-auto py-4" asChild>
                    <a href="/profile/import">
                      <Upload className="h-5 w-5" />
                      <div>
                        <p className="font-medium">Importar datos</p>
                        <p className="text-xs text-fg-muted">Subir JSON o CSV de Trakt</p>
                      </div>
                    </a>
                  </Button>
                </div>
                <div className="border-t border-border pt-4">
                  <Button variant="destructive" className="w-full gap-2">
                    <Trash2 className="h-4 w-4" />
                    Eliminar cuenta
                  </Button>
                  <p className="text-xs text-fg-muted text-center mt-2">Esta acción no se puede deshacer. Se eliminarán todos tus datos permanentemente.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </Container>
      </main>
    </div>
  );
}

import { Download, Upload, Trash2 } from 'lucide-react';