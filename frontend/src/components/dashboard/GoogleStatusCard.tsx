import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle2, AlertTriangle, RefreshCw, ShieldCheck, Unplug } from 'lucide-react';
import { GoogleIcon } from '../common/GoogleIcon';
import { getErrorMessage } from '../../types';

export const GoogleStatusCard = () => {
  const { user, loginWithGoogle, disconnectGoogle } = useAuth();
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isConnected = Boolean(user?.googleConnected);

  const handleDisconnect = async () => {
    if (!window.confirm('Disconnect Google access? Your LeadFlow account, quota, and processing history will remain.')) return;
    setDisconnecting(true);
    setError(null);
    try {
      await disconnectGoogle();
    } catch (disconnectError: unknown) {
      setError(getErrorMessage(disconnectError) || 'Could not disconnect Google. Please try again.');
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 border border-[#2a2d3a] rounded-md flex items-center justify-center bg-[#0f1117] p-1.5">
            <GoogleIcon className="w-full h-full" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-200">Google Account</p>
            <p className="text-xs text-slate-500">Gmail & Sheets access</p>
          </div>
        </div>

        {isConnected ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-500 border-emerald-500/25 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3" />
            Connected
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/25 px-2 py-0.5 rounded-full">
            <AlertTriangle className="w-3 h-3" />
            Not connected
          </span>
        )}
      </div>

      {/* Body */}
      {isConnected ? (
        <div className="bg-[#0f1117] border border-[#2a2d3a] rounded-md px-3 py-2.5 mb-4">
          <p className="text-xs text-slate-500 mb-0.5">Connected account</p>
          <p className="dashboard-secondary-email text-sm font-medium text-slate-200 truncate">{user?.email}</p>
        </div>
      ) : (
        <div className="bg-amber-500/8 border border-amber-500/20 rounded-md px-3 py-2.5 mb-4 flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-300/80">
            Connect your Google account to enable Gmail Drafts and Google Sheets access.
          </p>
        </div>
      )}

      {/* Footer */}
      {error && <p role="alert" className="mb-3 text-xs text-red-300">{error}</p>}
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-slate-600 flex items-center gap-1">
         
          OAuth 2.0 secured
        </span>
        <div className="flex items-center gap-2">
          {isConnected && (
            <button
              type="button"
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="flex items-center gap-1.5 text-xs font-medium border border-[#2a2d3a] text-slate-300 hover:text-red-300 px-3 py-1.5 rounded-md transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Unplug className="w-3 h-3" />
              {disconnecting ? 'Disconnecting…' : 'Disconnect'}
            </button>
          )}
          <button
            type="button"
            onClick={loginWithGoogle}
            className="flex items-center gap-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-md transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            {isConnected ? 'Reconnect' : 'Connect Google'}
          </button>
        </div>
      </div>
    </div>
  );
}
