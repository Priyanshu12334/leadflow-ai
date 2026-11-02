import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Moon, RefreshCw, Sun } from 'lucide-react';
import { useFollowUps } from '../../hooks/useFollowUps';

interface DashboardHeaderProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const DashboardHeader = ({ theme, onToggleTheme }: DashboardHeaderProps) => {
  const { user, refreshUser } = useAuth();
  const { refresh: refreshLeads } = useFollowUps();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await Promise.all([refreshUser(), refreshLeads()]);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">{user?.name?.trim() ? ` ${user.name.trim()}` : 'Welcome back!'}</h1>
        <p className="mt-0.5 text-xs text-slate-500">Your account and lead activity at a glance.</p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-start gap-2 sm:justify-end">
        <button
          onClick={onToggleTheme}
          className="hidden h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-[#2a2d3a] bg-[#1a1d27] text-slate-300 transition-colors hover:bg-[#1e2130] hover:text-slate-100 xl:flex"
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className={`flex w-full items-center justify-center gap-1.5 text-xs font-medium text-slate-300 bg-[#1a1d27] hover:bg-[#1e2130] hover:text-slate-100 border border-[#2a2d3a] rounded-md px-3 py-2 transition-colors sm:w-auto ${refreshing ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
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
