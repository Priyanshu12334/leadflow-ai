import React from 'react';
import { CheckCircle2, AlertCircle, Clock, XCircle, RefreshCw } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  text?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge = ({ status, text, size = 'md' }: StatusBadgeProps) => {
  const sizeClasses = size === 'sm'
    ? 'px-1.5 py-0.5 text-xs'
    : 'px-2 py-0.5 text-xs';

  switch (status) {
    case 'connected':
    case 'success':
    case 'created':
    case 'Draft Created':
      return (
        <span className={`inline-flex items-center gap-1 font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 ${sizeClasses}`}>
          <CheckCircle2 className="w-3 h-3" />
          {text || 'Connected'}
        </span>
      );
    case 'sent':
    case 'Sent':
      return (
        <span className={`inline-flex items-center gap-1 font-medium rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 ${sizeClasses}`}>
          <CheckCircle2 className="w-3 h-3" />
          {text || 'Sent'}
        </span>
      );
    case 'disconnected':
    case 'failed':
    case 'Failed':
    case 'error':
      return (
        <span className={`inline-flex items-center gap-1 font-medium rounded-full bg-red-500/10 text-red-400 border border-red-500/25 ${sizeClasses}`}>
          <XCircle className="w-3 h-3" />
          {text || 'Disconnected'}
        </span>
      );
    case 'verified':
      return (
        <span className={`inline-flex items-center gap-1 font-medium rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/25 ${sizeClasses}`}>
          <RefreshCw className="w-3 h-3" />
          {text || 'Verified'}
        </span>
      );
    case 'skipped':
    case 'warning':
      return (
        <span className={`inline-flex items-center gap-1 font-medium rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/25 ${sizeClasses}`}>
          <AlertCircle className="w-3 h-3" />
          {text || 'Already Processed'}
        </span>
      );
    case 'processing':
    case 'Processing':
      return (
        <span className={`inline-flex items-center gap-1 font-medium rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 ${sizeClasses}`}>
          <Clock className="w-3 h-3 animate-spin" />
          {text || 'Processing'}
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center gap-1 font-medium rounded-full bg-slate-700/50 text-slate-400 border border-slate-600/50 ${sizeClasses}`}>
          {text || status}
        </span>
      );
  }
};
