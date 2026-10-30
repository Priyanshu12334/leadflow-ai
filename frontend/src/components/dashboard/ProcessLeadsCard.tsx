import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { leadApi } from '../../api/leadApi';
import { Play, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { LeadProcessingResult } from '../../types';
import { getErrorMessage } from '../../types';

interface ProcessLeadsCardProps {
  onProcessingComplete?: (result: LeadProcessingResult) => void;
}

export const ProcessLeadsCard = ({ onProcessingComplete }: ProcessLeadsCardProps) => {
  const { user, updateUserData } = useAuth();

  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isGoogleConnected = Boolean(user?.googleConnected);
  const isSheetConfigured = Boolean(user?.spreadsheetId && /^[A-Za-z0-9_-]{15,}$/.test(user.spreadsheetId));
  const remainingQuota = Math.max(0, (user?.draftLimit || 20) - (user?.draftsUsed || 0));
  const hasQuota = remainingQuota > 0;
  const isReady = isGoogleConnected && isSheetConfigured && hasQuota;

  const handleProcess = async () => {
    if (!isReady || processing || !user || !user.spreadsheetId) return;

    setProcessing(true);
    setErrorMessage(null);

    try {
      const result = await leadApi.processLeads(user.spreadsheetId, user.sheetName || 'Sheet1');

      if (typeof result.draftsUsed === 'number') {
        updateUserData({
          ...user,
          draftsUsed: result.draftsUsed,
          draftLimit: result.draftLimit || user.draftLimit,
          usagePeriodStart: result.usagePeriodStart || user.usagePeriodStart,
          usagePeriodResetAt: result.usagePeriodResetAt || user.usagePeriodResetAt,
        });
      }

      if (onProcessingComplete) {
        onProcessingComplete(result);
      }
    } catch (error: unknown) {
      setErrorMessage(getErrorMessage(error) || 'An error occurred while processing leads.');
    } finally {
      setProcessing(false);
    }
  };

  const checks = [
    {
      label: 'Google account',
      ok: isGoogleConnected,
      detail: isGoogleConnected ? 'Connected' : 'Connect Google above',
    },
    {
      label: 'Spreadsheet ID',
      ok: isSheetConfigured,
      detail: isSheetConfigured ? 'Configured' : 'Set ID below',
    },
    {
      label: 'Draft quota',
      ok: hasQuota,
      detail: hasQuota ? `${remainingQuota} remaining` : 'Quota exhausted',
    },
  ];

  return (
    <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-5">
      {/* Header */}
      <div className="mb-5">
        <h2 className="text-sm font-semibold text-slate-200">Process Leads</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Reads your Google Sheet, generates personalized Gmail drafts with Gemini AI.
        </p>
      </div>

      {/* Pre-flight checklist */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-5">
        {checks.map((c, idx) => (
          <div
            key={idx}
            className="flex items-center gap-2 px-3 py-2 rounded-md border border-[#2a2d3a] bg-[#1a1d27] text-xs"
          >
            {c.ok
              ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
              : <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-red-400" />}
            <div>
              <span className="font-semibold text-slate-200 block">{c.label}</span>
              <span className={`font-medium ${c.ok ? 'text-emerald-500' : 'text-red-400'}`}>
                {c.detail}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Error */}
      {errorMessage && (
        <div className="mb-4 flex items-start gap-2 bg-red-500/8 border border-red-500/20 rounded-md px-3 py-2.5 text-xs text-red-400">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block mb-0.5">Processing failed</span>
            {errorMessage}
          </div>
        </div>
      )}

      {/* Primary Button */}
      <button
        onClick={handleProcess}
        disabled={!isReady || processing}
        className={`w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-md transition-colors ${
          isReady
            ? processing
              ? 'bg-indigo-600 text-white opacity-60 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white shadow-sm shadow-indigo-950/30 cursor-pointer'
            : 'bg-[#0f1117] text-slate-600 border border-[#2a2d3a] cursor-not-allowed'
        }`}
      >
        {processing ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Processing Leads...</span>
          </>
        ) : (
          <>
            <Play className="w-4 h-4 fill-current" />
            <span>Process Leads</span>
          </>
        )}
      </button>

      {processing && (
        <p className="mt-2 text-center text-xs text-slate-500">
          Reading your Google Sheet and generating personalized Gmail drafts...
        </p>
      )}

      {!isReady && !processing && (
        <p className="mt-2 text-center text-xs text-slate-600">
          Complete all checks above before running.
        </p>
      )}
    </div>
  );
};
