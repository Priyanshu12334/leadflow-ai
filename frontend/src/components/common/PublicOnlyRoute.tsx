import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LoadingScreen } from './LoadingScreen';
import type { PropsWithChildren } from 'react';

export const PublicOnlyRoute = ({ children }: PropsWithChildren) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const isLandingSectionNavigation = ['#features', '#how-it-works', '#pricing'].includes(location.hash);

  if (loading) {
    return <LoadingScreen />;
  }

  if (isAuthenticated && !isLandingSectionNavigation) {
    return <Navigate to="/dashboard" replace />;
  }

  return children ? children : <Outlet />;
};
