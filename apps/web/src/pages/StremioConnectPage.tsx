'use client';

import { useState, useEffect } from 'react';
import { Container, SectionHeader } from '@trak-watch/ui/components/layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Button, Input, Badge, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@trak-watch/ui';
import { Copy, Check, X, Loader2, RefreshCw, ExternalLink, Smartphone, Monitor, Tablet, QrCode, Plus } from 'lucide-react';
import { useToast } from '@trak-watch/ui/components/primitives/useToast';
import { supabase } from '@/features/auth/AuthProvider';

interface StremioToken {
  id: string;
  device_name: string | null;
  last_sync: string | null;
  expires_at: string;
  created_at: string;
}

async function fetchTokens() {
  const { data, error } = await supabase.functions.invoke('stremio-tokens-list', { body: {} });
  if (error) throw error;
  return data?.tokens || [];
}

async function createToken(deviceName: string) {
  const { data, error } = await supabase.functions.invoke('stremio-token-create', { body: { device_name: deviceName } });
  if (error) throw error;
  return data?.token;
}

async function revokeToken(id: string) {
  const { error } = await supabase.functions.invoke('stremio-token-revoke', { body: { id } });
  if (error) throw error;
}

export function StremioConnectPage() {
  const { toast } = useToast();
  const [tokens, setTokens] = useState<StremioToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [deviceName, setDeviceName] = useState('');
  const [newToken, setNewToken] = useState<string | null>(null);
  const [connectingUrl, setConnectingUrl] = useState<string | null>(null);

  const loadTokens = async () => {
    try {
      const data = await fetchTokens();
      setTokens(data);
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudieron cargar los tokens', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTokens();
  }, []);

  const handleCreateToken = async () => {
    if (!deviceName.trim()) return;
    
    try {
      const token = await createToken(deviceName.trim());
      setNewToken(token);
      setConnectingUrl(`stremio://addon/https://trakwatch.supabase.co/functions/v1/plugin/manifest.json?token=${token}`);
      setShowCreateDialog(false);
      setDeviceName('');
      await loadTokens();
      toast({ title: 'Token creado', description: 'Copia el enlace para añadirlo a Stremio', variant: 'success' });
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo crear el token', variant: 'destructive' });
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      await revokeToken(id);
      await loadTokens();
      toast({ title: 'Token revocado', variant: 'success' });
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo revocar el token', variant: 'destructive' });
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast({ title: 'Copiado', description: 'Enlace copiado al portapapeles', variant: 'success' });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isExpired = (dateString: string) => {
    return new Date(dateString) < new Date();
  };

  return (
    <div className="min-h-screen">
      <main className="py-8">
        <Container>
          <SectionHeader
            title="Conexión con Stremio"
            description="Genera tokens para sincronizar tus listas con el addon de Stremio"
          />

          {/* Instructions */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-accent/10 border border-accent/20 rounded-lg">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                    <QrCode className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-medium text-fg">Cómo conectar</h3>
                    <ol className="text-sm text-fg-muted space-y-1 mt-2 list-decimal list-inside">
                      <li>Genera un token usando el botón de abajo</li>
                      <li>Copia el enlace <code className="bg-bg-elevated px-1.5 py-0.5 rounded text-xs">stremio://addon/...</code></li>
                      <li>Abre Stremio → Addons → Community Addons → "Install from URL"</li>
                      <li>Pega el enlace y confirma la instalación</li>
                    </ol>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div className="p-4 bg-bg-elevated rounded-lg border border-border">
                    <Smartphone className="h-8 w-8 mx-auto mb-2 text-fg-muted" />
                    <p className="font-medium text-fg">Móvil</p>
                    <p className="text-xs text-fg-muted">Stremio Android/iOS</p>
                  </div>
                  <div className="p-4 bg-bg-elevated rounded-lg border border-border">
                    <Monitor className="h-8 w-8 mx-auto mb-2 text-fg-muted" />
                    <p className="font-medium text-fg">Desktop</p>
                    <p className="text-xs text-fg-muted">Windows/Mac/Linux</p>
                  </div>
                  <div className="p-4 bg-bg-elevated rounded-lg border border-border">
                    <Tablet className="h-8 w-8 mx-auto mb-2 text-fg-muted" />
                    <p className="font-medium text-fg">Tablet/TV</p>
                    <p className="text-xs text-fg-muted">Android TV, Fire TV</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tokens List */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-fg">Tus tokens activos</h2>
            <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Generar nuevo token
            </Button>
          </div>

          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="pt-6">
                    <div className="h-6 bg-bg-elevated rounded w-1/4 mb-4" />
                    <div className="h-4 bg-bg-elevated rounded w-1/2" />
                    <div className="h-4 bg-bg-elevated rounded w-1/3 mt-2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : tokens.length === 0 ? (
            <Card>
              <CardContent className="pt-6 pb-12 text-center">
                <QrCode className="h-16 w-16 mx-auto mb-4 text-fg-muted" />
                <h3 className="text-lg font-medium text-fg mb-2">No hay tokens generados</h3>
                <p className="text-fg-muted mb-4">Crea tu primer token para conectar Stremio</p>
                <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Generar token
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {tokens.map((token) => (
                <Card key={token.id}>
                  <CardContent className="pt-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-accent/10 rounded-lg">
                          <Smartphone className="h-5 w-5 text-accent" />
                        </div>
                        <div>
                          <p className="font-medium text-fg">{token.device_name || 'Dispositivo desconocido'}</p>
                          <p className="text-sm text-fg-muted">Creado: {formatDate(token.created_at)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={isExpired(token.expires_at) ? 'destructive' : 'success'}>
                          {isExpired(token.expires_at) ? 'Expirado' : 'Activo'}
                        </Badge>
                        {token.last_sync && (
                          <Badge variant="secondary" className="text-xs">
                            Último sync: {formatDate(token.last_sync)}
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-xs">
                          Expira: {formatDate(token.expires_at)}
                        </Badge>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" onClick={() => copyToClipboard(`stremio://addon/https://trakwatch.supabase.co/functions/v1/plugin/manifest.json?token=${token.id}`)} aria-label="Copiar enlace">
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleRevoke(token.id)} className="text-red-400 hover:text-red-300" aria-label="Revocar token">
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* New Token Dialog */}
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Generar nuevo token</DialogTitle>
                <DialogDescription>Asigna un nombre al dispositivo para identificarlo</DialogDescription>
              </DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); handleCreateToken(); }}>
                <div className="py-4">
                  <Input
                    label="Nombre del dispositivo"
                    placeholder="Ej: Mi móvil, Stremio TV, Fire Stick..."
                    value={deviceName}
                    onChange={(e) => setDeviceName(e.target.value)}
                    required
                    maxLength={50}
                    autoFocus
                  />
                </div>
                <DialogFooter>
                  <Button variant="secondary" onClick={() => setShowCreateDialog(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" loading={loading}>
                    Generar token
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Success Dialog with URL */}
          {newToken && connectingUrl && (
            <Dialog open onOpenChange={() => { setNewToken(null); setConnectingUrl(null); }}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-green-400">
                    <Check className="h-5 w-5" />
                    ¡Token generado!
                  </DialogTitle>
                  <DialogDescription>Copia este enlace e instálalo en Stremio</DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <div className="p-3 bg-bg-elevated rounded-lg border border-border">
                    <code className="text-xs break-all block">{connectingUrl}</code>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" className="flex-1 gap-2" onClick={() => copyToClipboard(connectingUrl)}>
                      <Copy className="h-4 w-4" />
                      Copiar enlace
                    </Button>
                    <Button className="flex-1 gap-2" onClick={() => window.open(connectingUrl, '_blank')}>
                      <ExternalLink className="h-4 w-4" />
                      Abrir en Stremio
                    </Button>
                  </div>
                  <p className="text-xs text-fg-muted text-center">
                    También puedes escanear el código QR desde la app móvil de Stremio
                  </p>
                </div>
                <DialogFooter>
                  <Button onClick={() => { setNewToken(null); setConnectingUrl(null); }}>
                    Entendido
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </Container>
      </main>
    </div>
  );
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}