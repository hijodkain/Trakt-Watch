'use client';

import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/features/auth/AuthProvider';
import { Button } from '@trak-watch/ui/components/primitives/Button';
import { Card, CardContent } from '@trak-watch/ui/components/primitives/Card';

export function CallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Procesando autenticación...');

  useEffect(() => {
    const handleAuth = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      if (error) {
        setStatus('error');
        setMessage(errorDescription || 'Error en la autenticación');
        return;
      }

      if (code) {
        try {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          
          setStatus('success');
          setMessage('¡Autenticación exitosa! Redirigiendo...');
          
          // Redirect after short delay
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 1500);
        } catch (err: any) {
          setStatus('error');
          setMessage(err.message || 'Error al procesar la sesión');
        }
      } else {
        setStatus('error');
        setMessage('Código de autenticación no encontrado');
      }
    };

    handleAuth();
  }, [searchParams, navigate]);

  const icons = {
    loading: <Loader2 className="h-8 w-8 animate-spin text-accent" />,
    success: <CheckCircle className="h-8 w-8 text-green-400" />,
    error: <XCircle className="h-8 w-8 text-red-400" />,
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <Card className="w-full max-w-md text-center">
        <CardContent className="py-12 px-8">
          <div className="mb-6">{icons[status]}</div>
          
          <h2 className="text-xl font-bold text-fg mb-2">
            {status === 'loading' && 'Autenticando...'}
            {status === 'success' && '¡Bienvenido!'}
            {status === 'error' && 'Error de autenticación'}
          </h2>
          
          <p className="text-fg-muted mb-6">{message}</p>
          
          {status === 'error' && (
            <Button variant="secondary" onClick={() => navigate('/auth/login')}>
              Volver al login
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { useState } from 'react';