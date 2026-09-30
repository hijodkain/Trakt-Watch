'use client';

import React from 'react';
import { Container, SectionHeader } from '@trak-watch/ui/components/layout';
import { Button } from '@trak-watch/ui/components/primitives/Button';
import { Input } from '@trak-watch/ui/components/primitives/Input';
import { Avatar, AvatarImage, AvatarFallback } from '@trak-watch/ui/components/primitives/Avatar';
import { Card, CardHeader, CardTitle, CardContent } from '@trak-watch/ui/components/primitives/Card';
import { Badge } from '@trak-watch/ui/components/primitives/Badge';
import { supabase } from '@/features/auth/AuthProvider';
import { useAuth } from '@/features/auth/AuthProvider';
import { useQuery } from '@tanstack/react-query';
import { Settings, User, Heart, Eye, Check, Clock, LogOut, Camera } from 'lucide-react';

interface UserStats {
  lists_count: number;
  items_count: number;
  watched_count: number;
  favorites_count: number;
}

async function fetchProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  const { data, error } = await supabase.functions.invoke('profile-get', { body: { user_id: user.id } });
  if (error) throw error;
  return data?.profile;
}

async function fetchStats() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  const { data, error } = await supabase.functions.invoke('profile-stats', { body: { user_id: user.id } });
  if (error) throw error;
  return data?.stats;
}

export function ProfilePage() {
  const { user, signOut } = useAuth();
  const { data: profile } = useQuery({ queryKey: ['profile'], queryFn: fetchProfile });
  const { data: stats } = useQuery({ queryKey: ['profile', 'stats'], queryFn: fetchStats });

  return (
    <div className="min-h-screen">
      <main className="py-8">
        <Container>
          {/* Profile Header */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-start">
                <div className="relative w-32 h-32 flex-shrink-0">
                  <Avatar className="w-32 h-32">
                    <AvatarImage src={profile?.avatar_url || user?.user_metadata?.avatar_url || ''} alt={profile?.username || user?.user_metadata?.full_name || ''} />
                    <AvatarFallback className="text-4xl">{profile?.username?.[0]?.toUpperCase() || user?.user_metadata?.full_name?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                  </Avatar>
                  <Button variant="secondary" size="icon" className="absolute bottom-0 right-0 bg-bg-elevated">
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex-1 text-center lg:text-left">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-4">
                    <div>
                      <h1 className="text-3xl font-bold text-fg">{profile?.username || user?.user_metadata?.full_name || 'Usuario'}</h1>
                      <p className="text-fg-muted">@{profile?.username || user?.user_metadata?.username || 'user'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="gap-1">
                        <User className="h-3 w-3" />
                        {profile?.locale === 'es' ? 'Español' : 'English'}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-fg-muted max-w-xl">
                    {profile?.description || 'Sin descripción. Edita tu perfil para añadir una.'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" asChild>
                    <a href="/settings">Editar perfil</a>
                  </Button>
                  <Button variant="secondary" onClick={() => signOut()}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Cerrar sesión
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard icon={Heart} label="Favoritas" value={stats?.favorites_count || 0} color="red" />
            <StatCard icon={Eye} label="Por ver" value={stats?.watchlist_count || 0} color="blue" />
            <StatCard icon={Check} label="Vistas" value={stats?.watched_count || 0} color="green" />
            <StatCard icon={Clock} label="Total items" value={stats?.items_count || 0} color="purple" />
          </div>

          {/* Public Lists */}
          <SectionHeader title="Mis listas públicas" />
          <div className="text-center py-12 text-fg-muted">
            <p>Próximamente: visualización de listas públicas</p>
          </div>
        </Container>
      </main>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number; color: string }) {
  const colorClasses = {
    red: 'text-red-400 bg-red-400/10',
    blue: 'text-blue-400 bg-blue-400/10',
    green: 'text-green-400 bg-green-400/10',
    purple: 'text-purple-400 bg-purple-400/10',
  };
  
  return (
    <Card>
      <CardContent className="pt-6 text-center">
        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-3 ${colorClasses[color as keyof typeof colorClasses]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <p className="text-3xl font-bold text-fg">{value}</p>
        <p className="text-sm text-fg-muted">{label}</p>
      </CardContent>
    </Card>
  );
}