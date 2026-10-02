'use client';

import { NavLink } from 'react-router-dom';
import { Container, SectionHeader } from '@trak-watch/ui/components/layout';
import { Card, CardContent } from '@trak-watch/ui/components/primitives/Card';
import { Button } from '@trak-watch/ui/components/primitives/Button';
import { useLists } from '@/features/lists/store';
import { readSyncEvents } from '@/features/sync/outbox';
import { QrCode, ListVideo } from 'lucide-react';

export function StremioConnectPage() {
  const { lists, items } = useLists();
  const pending = readSyncEvents();

  return (
    <div className="min-h-screen">
      <main className="py-8">
        <Container className="max-w-3xl">
          <SectionHeader
            title="Conexión con Stremio"
            description="El addon llegará en la fase 2. La app ya prepara todo lo necesario."
          />

          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-accent/10 rounded-lg">
                  <QrCode className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-medium text-fg">Cómo funcionará</h3>
                  <ol className="text-sm text-fg-muted space-y-1 mt-2 list-decimal list-inside">
                    <li>El addon pedirá tus listas a la app y las mostrará en Stremio.</li>
                    <li>Desde Stremio podrás marcar: vistas, favoritas, siguiendo o pendientes.</li>
                    <li>Las listas personalizadas (Documentales, Apple TV+, HBO Max…) se siguen creando aquí.</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <ListVideo className="h-5 w-5 text-accent" />
                <h3 className="font-medium text-fg">Estado sync-ready</h3>
              </div>
              <p className="text-sm text-fg-muted">
                {lists.length} listas · {items.length} elementos · {pending.length} cambios registrados para sincronizar.
              </p>
              <div className="mt-4">
                <Button variant="secondary" asChild>
                  <NavLink to="/lists">Ver mis listas</NavLink>
                </Button>
              </div>
            </CardContent>
          </Card>
        </Container>
      </main>
    </div>
  );
}
