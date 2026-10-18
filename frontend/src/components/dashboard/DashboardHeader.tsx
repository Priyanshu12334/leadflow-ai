import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { RefreshCw } from 'lucide-react';

export const DashboardHeader = () => {
  const { user, refreshUser } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await refreshUser();
    } finally {
      setRefreshing(false);
    }
  };

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.charAt(0).toUpperCase() || 'U';

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      {/* User Info */}
      <div className="flex min-w-0 items-center gap-3">
        <div className="w-10 h-10 bg-indigo-600 rounded-full ring-2 ring-indigo-500/20 flex items-center justify-center text-white text-sm font-semibold shrink-0 shadow-sm shadow-indigo-950/30">
          {initials}
        </div>
        <div className="min-w-0">
          <h1 className="text-base font-bold text-slate-100 truncate">
            {user?.name || user?.email?.split('@')[0] || 'User'}
          </h1>
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <p className="text-xs text-slate-500 truncate">
              {user?.email}
            </p>
            {user?.plan && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold tracking-wide bg-indigo-500/8 text-indigo-300 border border-indigo-400/20">
                {user.plan} Plan
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className={`flex items-center gap-1.5 text-xs font-medium text-slate-300 bg-[#1a1d27] hover:bg-[#1e2130] hover:text-slate-100 border border-[#2a2d3a] rounded-md px-3 py-2 transition-colors ${refreshing ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
          title="Refresh dashboard and user data"
          aria-label="Refresh dashboard and user data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
    </div>
  );
};
