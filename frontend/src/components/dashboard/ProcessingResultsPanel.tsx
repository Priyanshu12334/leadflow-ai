import React, { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { Mail, ExternalLink, ChartNoAxesCombined, AlertTriangle, Info, X } from 'lucide-react';
import type { LeadProcessingResult } from '../../types';

interface ProcessingResultsPanelProps {
  results: LeadProcessingResult;
  onClear?: () => void;
}

export const ProcessingResultsPanel = ({ results, onClear }: ProcessingResultsPanelProps) => {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [popoverTop, setPopoverTop] = useState(0);
  const helpRef = useRef<HTMLDivElement>(null);
  const helpButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isHelpOpen) return undefined;

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!(event.target instanceof Node) || !helpRef.current?.contains(event.target)) {
        setIsHelpOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsHelpOpen(false);
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isHelpOpen]);

  if (!results) return null;

  const {
    message = 'Lead processing completed',
    processed = 0,
    created = 0,
    skipped = 0,
    failed = 0,
    limitReached = false,
    draftsUsed,
    draftLimit,
    details = [],
  } = results;
  const failedDetails = details.filter((detail) => detail.action === 'failed');

  const stats = [
    { label: 'Leads Checked', value: processed, color: 'text-slate-300', bg: 'bg-[#0f1117]', border: 'border-[#2a2d3a]' },
    { label: 'Drafts Created', value: created, color: 'text-slate-300', bg: 'bg-[#0f1117]', border: 'border-[#2a2d3a]', primary: true },
    { label: 'Already Processed', value: skipped, color: 'text-slate-300', bg: 'bg-[#0f1117]', border: 'border-[#2a2d3a]' },
    failed > 0
      ? { label: 'Failed', value: failed, color: 'text-red-400', bg: 'bg-red-500/8', border: 'border-red-500/20' }
      : { label: 'Failed', value: failed, color: 'text-slate-300', bg: 'bg-[#0f1117]', border: 'border-[#2a2d3a]' },
  ];

  return (
    <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-5">
      {/* Header */}
      <div className="flex flex-col items-stretch gap-3 pb-4 mb-4 border-b border-[#2a2d3a] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-violet-500/10 border border-violet-500/20 rounded-lg flex items-center justify-center">
            <ChartNoAxesCombined className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <p className="text-sm font-medium text-slate-200">Processing Results</p>
              <div className="relative" ref={helpRef}>
                <button
                  type="button"
                  ref={helpButtonRef}
                  onClick={() => {
                    if (!isHelpOpen) {
                      const button = helpButtonRef.current;
                      if (button) setPopoverTop(button.getBoundingClientRect().bottom + 8);
                    }
                    setIsHelpOpen((open) => !open);
                  }}
                  className="p-0.5 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                  aria-label="What do these results mean?"
                  aria-expanded={isHelpOpen}
                  aria-controls="processing-results-help"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
                {isHelpOpen && (
                  <div
                    id="processing-results-help"
                    role="dialog"
                    aria-label="Processing result definitions"
                    style={{ '--mobile-popover-top': `${popoverTop}px` } as CSSProperties}
                    className="fixed left-1/2 top-[var(--mobile-popover-top)] z-20 w-[min(18rem,calc(100vw-2rem))] -translate-x-1/2 rounded-md border border-[#343847] bg-[#11141c] p-3 shadow-xl sm:absolute sm:left-0 sm:top-full sm:mt-2 sm:w-72 sm:max-w-[calc(100vw-3rem)] sm:translate-x-0"
                  >
                    <p className="mb-2 text-xs font-medium text-slate-200">What do these mean?</p>
                    <dl className="space-y-1.5 text-xs text-slate-400">
                      <div><dt className="inline font-medium text-slate-200">Leads Checked:</dt> <dd className="inline">Total leads checked in this run.</dd></div>
                      <div><dt className="inline font-medium text-slate-200">Drafts Created:</dt> <dd className="inline">New Gmail drafts created.</dd></div>
                      <div><dt className="inline font-medium text-slate-200">Already Processed:</dt> <dd className="inline">Rows already processed or not eligible.</dd></div>
                      <div><dt className="inline font-medium text-slate-200">Failed:</dt> <dd className="inline">Leads that could not be processed due to an error.</dd></div>
                    </dl>
                  </div>
                )}
              </div>
            </div>
            <p className="text-xs text-slate-500">{message}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:justify-end">
          <a
            href="https://mail.google.com/mail/u/0/#drafts"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 text-xs font-medium text-white bg-[#EA4335] hover:bg-[#D93025] border border-[#EA4335] rounded-md px-3 py-2 transition-colors cursor-pointer"
          >
            <Mail className="w-3.5 h-3.5" />
            Open Gmail Drafts
            <ExternalLink className="w-3 h-3 opacity-60" />
          </a>

          {onClear && (
            <button
              onClick={onClear}
              className="p-1.5 text-slate-500 hover:text-slate-200 hover:bg-[#1e2130] rounded-md transition-colors cursor-pointer"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`${stat.bg} ${stat.border} border rounded-lg px-3 py-3 text-center`}
          >
            <p className={`${'primary' in stat && stat.primary ? 'text-2xl' : 'text-xl'} font-extrabold ${stat.color}`}>
              {stat.value}
            </p>
            <p className={`text-xs font-semibold ${stat.color} opacity-90 mt-0.5`}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quota warning */}
      {limitReached && (
        <div className="flex items-start gap-2 bg-amber-500/8 border border-amber-500/20 rounded-md px-3 py-2.5 text-xs text-amber-400 mb-4">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block mb-0.5">Monthly quota reached</span>
            Processing paused. Quota: {draftsUsed} / {draftLimit}. Resets at next billing cycle.
          </div>
        </div>
      )}

      {failedDetails.length > 0 && (
        <div className="bg-red-500/8 border border-red-500/20 rounded-md px-3 py-2.5 text-xs text-red-300 mb-4">
          <p className="font-medium mb-1.5">Processing errors</p>
          <ul className="space-y-1">
            {failedDetails.map((detail) => (
              <li key={detail.rowNumber}>
                {detail.name || detail.email || `Row ${detail.rowNumber}`}: {detail.reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Summary */}
      <div className="bg-[#0f1117] border border-[#2a2d3a] rounded-md px-3 py-2.5 text-xs text-slate-500">
        <p className="font-medium text-slate-400 mb-1">Summary</p>
        <div className="space-y-0.5 leading-relaxed">
          <p>
            {created > 0
              ? `${created} new Gmail drafts created with Gemini AI.`
              : 'No new Gmail drafts were created.'}
          </p>
          {skipped > 0 && (
            <p>
              {skipped} {skipped === 1 ? 'lead was' : 'leads were'} already processed or not eligible.
            </p>
          )}
          <p>
            {failed} {failed === 1 ? 'lead failed' : 'leads failed'}.
          </p>
        </div>
      </div>
    </div>
  );
};
