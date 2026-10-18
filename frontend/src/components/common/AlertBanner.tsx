import React from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle, X } from 'lucide-react';

type AlertType = 'info' | 'success' | 'warning' | 'error';

interface AlertBannerProps {
  type?: AlertType;
  title?: string;
  message: string;
  onClose?: () => void;
}

export const AlertBanner = ({ type = 'info', title, message, onClose }: AlertBannerProps) => {
  const styles: Record<AlertType, { bg: string; icon: React.ReactNode }> = {
    info: {
      bg: 'bg-blue-500/10 border-blue-500/20 text-blue-300',
      icon: <Info className="w-5 h-5 text-blue-400 shrink-0" />,
    },
    success: {
      bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
    },
    warning: {
      bg: 'bg-amber-500/10 border-amber-500/20 text-amber-300',
      icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
    },
    error: {
      bg: 'bg-rose-500/10 border-rose-500/20 text-rose-300',
      icon: <XCircle className="w-5 h-5 text-rose-400 shrink-0" />,
    },
  };

  const style = styles[type] || styles.info;

  return (
    <div className={`p-4 rounded-xl border ${style.bg} flex items-start justify-between gap-3 transition-colors duration-150`}>
      <div className="flex items-start gap-3">
        {style.icon}
        <div>
          {title && <h4 className="font-semibold text-sm mb-0.5">{title}</h4>}
          <p className="text-sm opacity-90 leading-relaxed">{message}</p>
        </div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/50 transition-colors cursor-pointer"
          aria-label="Close alert"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
