import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import InitialLoadingScreen from '../components/Layout/InitialLoadingScreen';
import { AuthSync } from '../components/Auth/AuthSync';

export const ProtectedRoute: React.FC = () => {
  const { session, profile, initialized, loading } = useAuthStore();
  const location = useLocation();

  console.log('[ProtectedRoute] Check auth:', { session: !!session, profile: !!profile, initialized, loading });

  if (loading && !initialized) {
    console.log('[ProtectedRoute] Showing loading screen');
    return <InitialLoadingScreen />;
  }

  if (!session || !profile) {
    console.log('[ProtectedRoute] No auth, redirecting to /login');
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  console.log('[ProtectedRoute] Authenticated, showing protected content');
  return (
    <AuthSync profile={profile}>
      <Outlet />
    </AuthSync>
  );
};
