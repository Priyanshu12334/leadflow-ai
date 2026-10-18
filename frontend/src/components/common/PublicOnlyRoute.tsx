import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { RefreshCw } from 'lucide-react';
import type { PropsWithChildren } from 'react';

export const PublicOnlyRoute = ({ children }: PropsWithChildren) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f17] flex flex-col items-center justify-center space-y-4 text-indigo-400">
        <RefreshCw className="w-10 h-10 animate-spin" />
        <p className="text-xs font-bold tracking-widest uppercase text-slate-400">Loading LeadFlow AI...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children ? children : <Outlet />;
};
