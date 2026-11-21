import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ProgressBar } from '../common/ProgressBar';
import { Zap, AlertCircle } from 'lucide-react';

export const UsageMetricsCard = () => {
  const { user } = useAuth();
  const isDemo = Boolean(user?.isDemo);
  const draftLimit = isDemo ? 20 : user?.draftLimit ?? 20;
  const draftsUsed = isDemo ? draftLimit : user?.draftsUsed ?? 0;
  const remaining = Math.max(0, draftLimit - draftsUsed);
  const percentage = Math.min(Math.round((draftsUsed / draftLimit) * 100), 100);

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
            <p className="text-xs text-slate-500">{isDemo ? 'Demo limit: 20 drafts' : '30-day usage'}</p>
          </div>
        </div>

        {!isDemo && percentage >= 90 && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-400 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded-full">
            <AlertCircle className="w-3 h-3" />
            Quota low
          </span>
        )}
      </div>

      {/* Counter */}
      <div className="mb-4">
        <div className="flex items-baseline justify-between mb-2">
          {isDemo ? (
            <span className="whitespace-nowrap text-xl leading-6 font-medium text-slate-100">
              {draftLimit} / {draftLimit} drafts remaining
            </span>
          ) : (
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-semibold text-slate-100">{draftsUsed}</span>
              <span className="text-base text-slate-500">/ {draftLimit} drafts</span>
            </div>
          )}
        </div>
        <ProgressBar used={draftsUsed} total={draftLimit} showLabel={false} color={isDemo ? 'emerald' : undefined} />
        <p className="mt-2 text-sm text-slate-400">{isDemo ? 'Drafts are not consumed in demo mode' : `${remaining} drafts remaining in this cycle`}</p>
      </div>
    </div>
  );
};
