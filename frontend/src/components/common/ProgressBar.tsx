import React from 'react';

interface ProgressBarProps {
  used?: number;
  total?: number;
  showLabel?: boolean;
  label?: string;
}

export const ProgressBar = ({ used = 0, total = 20, showLabel = true, label = 'Usage' }: ProgressBarProps) => {
  const percentage = Math.min(Math.round((used / (total || 1)) * 100), 100);

  let barColor = 'bg-indigo-500';
  if (percentage >= 90) barColor = 'bg-red-500';
  else if (percentage >= 75) barColor = 'bg-amber-500';

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center text-xs text-slate-500 mb-1.5">
          <span>{label}</span>
          <span className="font-medium text-slate-400">{used} / {total} ({percentage}%)</span>
        </div>
      )}
      <div className="w-full h-2 bg-[#1e2130] rounded-full overflow-hidden border border-[#2a2d3a]">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
