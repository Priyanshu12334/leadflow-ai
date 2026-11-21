import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { leadApi } from '../../api/leadApi';
import { Play, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { LeadProcessingJob, LeadProcessingResult } from '../../types';
import { getErrorMessage } from '../../types';
import { formatQuotaResetDate } from '../../utils/quota';

const PROCESSING_HELPER_MESSAGES = [
  'Reading your Google Sheet and generating personalized Gmail drafts...',
  'This can take a few minutes because of AI rate limits. Please keep this page open.',
  "Checking each lead's details...",
  'Writing a personalized follow-up for every lead...',
  'Saving the drafts to your Gmail...',
  'Almost there, thanks for your patience...',
];

interface ProcessLeadsCardProps {
  onProcessingComplete?: (result: LeadProcessingResult) => void;
}

export const ProcessLeadsCard = ({ onProcessingComplete }: ProcessLeadsCardProps) => {
  const { user, updateUserData } = useAuth();

  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [jobProgress, setJobProgress] = useState<LeadProcessingJob | null>(null);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [previousLoadingMessageIndex, setPreviousLoadingMessageIndex] = useState<number | null>(null);
  const userRef = useRef(user);
  const updateUserDataRef = useRef(updateUserData);
  const onProcessingCompleteRef = useRef(onProcessingComplete);
  const loadingMessageIndexRef = useRef(0);
  const loadingAnimationTimeoutRef = useRef<number | null>(null);
  userRef.current = user;
  updateUserDataRef.current = updateUserData;
  onProcessingCompleteRef.current = onProcessingComplete;

  const isGoogleConnected = Boolean(user?.googleConnected);
  const isSheetConfigured = Boolean(user?.spreadsheetId && /^[A-Za-z0-9_-]{15,}$/.test(user.spreadsheetId));
  const isDemo = Boolean(user?.isDemo);
  const remainingQuota = Math.max(0, (isDemo ? 20 : user?.draftLimit || 20) - (user?.draftsUsed || 0));
  const hasQuota = isDemo || remainingQuota > 0;
  const isReady = (isDemo || (isGoogleConnected && isSheetConfigured)) && hasQuota;
  const resetDate = formatQuotaResetDate(user?.usagePeriodResetAt) || 'your next 30-day reset date';

  useEffect(() => {
    if (!processing || isDemo) return undefined;

    const intervalId = window.setInterval(() => {
      const previousIndex = loadingMessageIndexRef.current;
      const nextIndex = (previousIndex + 1) % PROCESSING_HELPER_MESSAGES.length;
      if (loadingAnimationTimeoutRef.current !== null) {
        window.clearTimeout(loadingAnimationTimeoutRef.current);
      }
      setPreviousLoadingMessageIndex(previousIndex);
      loadingMessageIndexRef.current = nextIndex;
      setLoadingMessageIndex(nextIndex);
      loadingAnimationTimeoutRef.current = window.setTimeout(() => {
        setPreviousLoadingMessageIndex(null);
        loadingAnimationTimeoutRef.current = null;
      }, 400);
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
      if (loadingAnimationTimeoutRef.current !== null) {
        window.clearTimeout(loadingAnimationTimeoutRef.current);
        loadingAnimationTimeoutRef.current = null;
      }
    };
  }, [processing, isDemo]);

  useEffect(() => {
    if (!activeJobId) return undefined;
    let cancelled = false;
    let timeoutId: number;

    const pollJob = async () => {
      try {
        const job = await leadApi.getProcessLeadsJob(activeJobId);
        if (cancelled) return;
        setJobProgress(job);
        if (job.status === 'completed') {
          setProcessing(false);
          setActiveJobId(null);
          if (!job.result) {
            setErrorMessage('Processing job completed without results.');
            return;
          }
          const result = job.result;
          const currentUser = userRef.current;
          if (currentUser && typeof result.draftsUsed === 'number') {
            updateUserDataRef.current({
              ...currentUser,
              draftsUsed: result.draftsUsed,
              draftLimit: result.draftLimit || currentUser.draftLimit,
              usagePeriodStart: result.usagePeriodStart || currentUser.usagePeriodStart,
              quotaCycleStartAt: result.quotaCycleStartAt || currentUser.quotaCycleStartAt,
              usagePeriodResetAt: result.usagePeriodResetAt || currentUser.usagePeriodResetAt,
            });
          }
          onProcessingCompleteRef.current?.(result);
          return;
        }
        if (job.status === 'failed') {
          setProcessing(false);
          setErrorMessage(job.error || 'Lead processing failed.');
          setActiveJobId(null);
          return;
        }
        timeoutId = window.setTimeout(() => { void pollJob(); }, 3000);
      } catch (error: unknown) {
        if (!cancelled) {
          setProcessing(false);
          setErrorMessage(getErrorMessage(error) || 'Could not retrieve processing progress.');
          setActiveJobId(null);
        }
      }
    };

    timeoutId = window.setTimeout(() => { void pollJob(); }, 3000);
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [activeJobId]);

  const handleProcess = async () => {
    if (!isReady || processing || !user) return;

    if (!user.isDemo) {
      loadingMessageIndexRef.current = 0;
      setLoadingMessageIndex(0);
      setPreviousLoadingMessageIndex(null);
    }
    setProcessing(true);
    setErrorMessage(null);
    setJobProgress(null);

    try {
      if (user.isDemo) {
        await new Promise<void>((resolve) => { window.setTimeout(resolve, 1000); });
        onProcessingComplete?.({
          message: '8 demo drafts generated.',
          processed: 8,
          created: 8,
          skipped: 0,
          failed: 0,
        });
        setProcessing(false);
        return;
      }

      const { jobId } = await leadApi.processLeads(user.spreadsheetId || '', user.sheetName || 'Sheet1');
      setJobProgress({
        jobId,
        status: 'queued',
        currentLead: 0,
        totalLeads: 0,
        draftsCreated: 0,
        failed: 0,
      });
      setActiveJobId(jobId);
    } catch (error: unknown) {
      setErrorMessage(getErrorMessage(error) || 'An error occurred while processing leads.');
      setProcessing(false);
    }
  };

  const checks = [
    {
      label: 'Google account',
      ok: isDemo || isGoogleConnected,
      detail: isDemo ? 'Not required in demo' : isGoogleConnected ? 'Connected' : 'Connect Google above',
    },
    {
      label: 'Spreadsheet ID',
      ok: isDemo || isSheetConfigured,
      detail: isDemo ? 'Not required in demo' : isSheetConfigured ? 'Configured' : 'Set ID below',
    },
    {
      label: 'Draft quota',
      ok: hasQuota,
      detail: isDemo ? '20 / 20 drafts remaining' : `${remainingQuota} remaining`,
      subDetail: isDemo ? 'Drafts are not consumed in demo mode' : null,
    },
  ];

  return (
    <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-5">
      {/* Header */}
      <div className="mb-5">
        <h2 className="text-sm font-semibold text-slate-200">Process Leads</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          {isDemo
            ? 'Processes sample leads and generates email drafts here in the app. A valid email address is required for each draft; a contact name is optional.'
            : 'Reads each row in your Google Sheet and uses its available fields to prepare personalized Gmail drafts. A valid email address is required for each draft; a contact name is optional.'}
        </p>
      </div>

      {/* Pre-flight checklist */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-5">
        {checks.map((c, idx) => (
          <div
            key={idx}
            className="flex min-h-[84px] items-center gap-2 px-3 py-2 rounded-md border border-[#2a2d3a] bg-[#1a1d27] text-xs md:min-h-0"
          >
            {c.ok
              ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
              : <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-red-400" />}
            <div>
              <span className="font-semibold text-slate-200 block">{c.label}</span>
              <span className={`font-medium ${c.label === 'Draft quota' && !isDemo ? 'text-emerald-500' : c.ok ? 'text-emerald-500' : 'text-red-400'}`}>
                {c.detail}
              </span>
              {'subDetail' in c && c.subDetail && (
                <span className={`mt-0.5 block ${c.ok ? 'text-slate-500' : 'text-red-400'}`}>
                  {c.subDetail}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {!isDemo && !hasQuota && (
        <div role="alert" className="mb-4 flex items-start gap-2 rounded-md border border-amber-500/20 bg-amber-500/8 px-3 py-2.5 text-xs text-amber-300">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <p>Draft limit reached. Resets on {resetDate}.</p>
        </div>
      )}

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

      {processing && isDemo && (
        <p className="mt-2 text-center text-xs text-slate-500">
          Processing sample leads...
        </p>
      )}

      {processing && !isDemo && (
        <div role="status" aria-live="polite" className="mt-3 rounded-md border border-indigo-500/20 bg-indigo-500/5 px-3 py-2.5 text-center text-xs text-slate-300">
          {jobProgress !== null && jobProgress.totalLeads > 0 && jobProgress.currentLead > 0 && (
            <p className="mb-1 text-slate-300">
              Processing lead {jobProgress.currentLead} of {jobProgress.totalLeads}... {jobProgress.draftsCreated} drafts created, {jobProgress.failed} failed.
            </p>
          )}
          <div className="process-leads-helper">
            {previousLoadingMessageIndex !== null && (
              <p
                key={`previous-${previousLoadingMessageIndex}`}
                aria-hidden="true"
                className="process-leads-helper__message process-leads-helper__message--exit"
              >
                {PROCESSING_HELPER_MESSAGES[previousLoadingMessageIndex]}
              </p>
            )}
            <p
              key={`current-${loadingMessageIndex}`}
              className={`process-leads-helper__message ${previousLoadingMessageIndex !== null ? 'process-leads-helper__message--enter' : ''}`}
            >
              {PROCESSING_HELPER_MESSAGES[loadingMessageIndex]}
            </p>
          </div>
        </div>
      )}

      {!isReady && !processing && hasQuota && (
        <p className="mt-2 text-center text-xs text-slate-600">
          Complete all checks above before running.
        </p>
      )}
    </div>
  );
};
