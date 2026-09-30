'use client';

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Github, Chrome, Apple } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthProvider';
import { Button } from '@trak-watch/ui/components/primitives/Button';
import { Input } from '@trak-watch/ui/components/primitives/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@trak-watch/ui/components/primitives/Card';
import { Toast } from '@trak-watch/ui/components/primitives/Toast';
import { useToast } from '@trak-watch/ui/components/primitives/useToast';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const from = (location.state as any)?.from?.pathname || '/';

  const handleOAuthSignIn = async (provider: 'google' | 'github' | 'apple') => {
    setLoading(true);
    setError('');
    try {
      await signIn(provider);
    } catch (err) {
      setError('Error al iniciar sesión. Inténtalo de nuevo.');
      toast({ title: 'Error', description: 'Error al iniciar sesión', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Credenciales incorrectas');
      toast({ title: 'Error', description: err.message || 'Credenciales incorrectas', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Introduce tu email primero');
      return;
    }
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      
      if (error) throw error;
      toast({ title: 'Email enviado', description: 'Revisa tu bandeja de entrada', variant: 'success' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-accent">Trak Watch</h1>
          <p className="text-fg-muted mt-2">Inicia sesión para sincronizar tus listas</p>
        </div>

        <Card className="space-y-6">
          <CardHeader className="text-center">
            <CardTitle>Bienvenido de nuevo</CardTitle>
            <CardDescription>Inicia sesión con tu cuenta</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* OAuth Buttons */}
            <div className="space-y-3">
              <Button
                variant="secondary"
                className="w-full gap-2"
                onClick={() => handleOAuthSignIn('google')}
                disabled={loading}
              >
                <Chrome className="h-5 w-5" />
                Continuar con Google
              </Button>
              
              <Button
                variant="secondary"
                className="w-full gap-2"
                onClick={() => handleOAuthSignIn('github')}
                disabled={loading}
              >
                <Github className="h-5 w-5" />
                Continuar con GitHub
              </Button>
              
              <Button
                variant="secondary"
                className="w-full gap-2"
                onClick={() => handleOAuthSignIn('apple')}
                disabled={loading}
              >
                <Apple className="h-5 w-5" />
                Continuar con Apple
              </Button>
            </div>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase text-fg-subtle">
                <span className="bg-bg-elevated px-4">o continua con email</span>
              </div>
            </div>

            {/* Email Form */}
            <form onSubmit={handleEmailSignIn} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg">
                  {error}
                </div>
              )}

              <Input
                label="Email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="h-4 w-4" />}
                required
                autoComplete="email"
                disabled={loading}
              />

              <div className="relative">
                <Input
                  label="Contraseña"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  leftIcon={<Lock className="h-4 w-4" />}
                  required
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-subtle hover:text-fg"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded border-border text-accent focus:ring-accent" />
                  <span className="text-sm text-fg-muted">Recordarme</span>
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm text-accent hover:underline"
                >
                  ¿Olvidaste la contraseña?
                </button>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                loading={loading}
              >
                Iniciar sesión
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col gap-2">
            <p className="text-center text-sm text-fg-muted">
              ¿No tienes cuenta?{' '}
              <button
                className="text-accent hover:underline font-medium"
                onClick={() => navigate('/auth/register', { replace: true })}
              >
                Regístrate
              </button>
            </p>
            <p className="text-center text-xs text-fg-subtle">
              Al continuar, aceptas nuestros{' '}
              <a href="/terms" className="text-accent hover:underline">Términos</a>{' '}
              y{' '}
              <a href="/privacy" className="text-accent hover:underline">Política de privacidad</a>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

// Need to import supabase
import { supabase } from '@/features/auth/AuthProvider';