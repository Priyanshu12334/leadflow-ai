import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ProgressBar } from '../common/ProgressBar';
import { Zap, Calendar, AlertCircle } from 'lucide-react';

export const UsageMetricsCard = () => {
  const { user } = useAuth();
  const draftsUsed = user?.draftsUsed ?? 0;
  const draftLimit = user?.draftLimit ?? 20;
  const remaining = Math.max(0, draftLimit - draftsUsed);
  const percentage = Math.min(Math.round((draftsUsed / draftLimit) * 100), 100);

  const formattedDate = user?.usagePeriodStart
    ? new Date(user.usagePeriodStart).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Current cycle';

  return (
    <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-500/10 border border-indigo-500/20 rounded-md flex items-center justify-center">
            <Zap className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-200">Draft Quota</p>
            <p className="text-xs text-slate-500">Monthly usage</p>
          </div>
        </div>

        {percentage >= 90 && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-400 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded-full">
            <AlertCircle className="w-3 h-3" />
            Quota low
          </span>
        )}
      </div>

      {/* Counter */}
      <div className="mb-4">
        <div className="flex items-baseline justify-between mb-2">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-100">{draftsUsed}</span>
            <span className="text-sm text-slate-500">/ {draftLimit} drafts</span>
          </div>
          <span className="text-sm font-medium text-slate-400">{remaining} left</span>
        </div>
        <ProgressBar used={draftsUsed} total={draftLimit} showLabel={false} />
      </div>

      {/* Footer */}
      <div className="flex items-center gap-1.5 text-xs text-slate-600">
        <Calendar className="w-3.5 h-3.5" />
        <span>Resets from: <span className="text-slate-400 font-medium">{formattedDate}</span></span>
      </div>
    </div>
  );
};
