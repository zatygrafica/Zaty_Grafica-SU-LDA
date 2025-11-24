import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import InitialLoadingScreen from '../components/Layout/InitialLoadingScreen';
import { AuthSync } from '../components/Auth/AuthSync';

export const ProtectedRoute: React.FC = () => {
  const { session, profile, initialized, loading } = useAuthStore();
  const location = useLocation();

  if (loading && !initialized) {
    return <InitialLoadingScreen />;
  }

  if (!session || !profile) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return (
    <AuthSync profile={profile}>
      <Outlet />
    </AuthSync>
  );
};
