'use client';

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, isSupabaseConfigured } from '@/features/auth/AuthProvider';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  // Modo single-user sin login (alcance v1): sin backend configurado,
  // se entra directo a la app en lugar de rebotar al login.
  if (!isSupabaseConfigured) {
    return <>{children}</>;
  }

  if (!user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}