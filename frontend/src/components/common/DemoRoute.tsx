import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LoadingScreen } from './LoadingScreen';
import type { PropsWithChildren } from 'react';

export const DemoRoute = ({ children }: PropsWithChildren) => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.isDemo) return <Navigate to="/dashboard" replace />;

  return children ? children : <Outlet />;
};
