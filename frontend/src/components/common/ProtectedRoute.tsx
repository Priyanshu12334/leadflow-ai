import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LoadingScreen } from './LoadingScreen';
import type { PropsWithChildren } from 'react';

export const ProtectedRoute = ({ children }: PropsWithChildren) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }
  if (user.isDemo) return <Navigate to="/demo" replace />;

  return children ? children : <Outlet />;
};
