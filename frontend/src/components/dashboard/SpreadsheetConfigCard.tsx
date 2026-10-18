import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userApi } from '../../api/userApi';
import { FileSpreadsheet, Save, Check, ExternalLink, HelpCircle, AlertCircle, X } from 'lucide-react';
import type { FormEvent } from 'react';
import type { User } from '../../types';
import { getErrorMessage } from '../../types';

interface SpreadsheetConfigCardProps {
  onConfigSaved?: (user: User) => void;
}

export const SpreadsheetConfigCard = ({ onConfigSaved }: SpreadsheetConfigCardProps) => {
  const { user, updateUserData, loginWithGoogle } = useAuth();

  const [spreadsheetId, setSpreadsheetId] = useState(user?.spreadsheetId || '');
  const [sheetName, setSheetName] = useState(user?.sheetName || 'Sheet1');
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [configuredSheetUrl, setConfiguredSheetUrl] = useState<string | null>(null);
  const [tabLinkState, setTabLinkState] = useState<'idle' | 'loading' | 'ready' | 'missing' | 'error'>('idle');
  const [tabError, setTabError] = useState<string | null>(null);
  const [reconnectForSheets, setReconnectForSheets] = useState(false);

  const apiErrorDetails = (error: unknown): { message?: string; code?: string } => {
    if (typeof error !== 'object' || error === null || !('response' in error)) return {};
    const response = (error as { response?: { data?: { error?: unknown; code?: unknown } } }).response;
    return {
      message: typeof response?.data?.error === 'string' ? response.data.error : undefined,
      code: typeof response?.data?.code === 'string' ? response.data.code : undefined,
    };
  };

  useEffect(() => {
    let active = true;
    if (!user?.googleConnected || !user.spreadsheetId) {
      setConfiguredSheetUrl(null);
      setTabLinkState('idle');
      setTabError(null);
      setReconnectForSheets(false);
      return () => { active = false; };
    }

    setConfiguredSheetUrl(null);
    setTabError(null);
    setReconnectForSheets(false);
    setTabLinkState('loading');
    userApi.getSpreadsheetOpenLink().then(({ url }) => {
      if (!active) return;
      setConfiguredSheetUrl(url);
      setTabLinkState('ready');
    }).catch((error: unknown) => {
      if (!active) return;
      const status = typeof error === 'object' && error !== null && 'response' in error
        ? (error as { response?: { status?: number } }).response?.status : undefined;
      const details = apiErrorDetails(error);
      setTabError(details.message || 'Could not verify access to the configured spreadsheet.');
      setReconnectForSheets(details.code === 'GOOGLE_SHEETS_SCOPE_REQUIRED');
      setTabLinkState(status === 404 ? 'missing' : 'error');
    });

    return () => { active = false; };
  }, [user?.googleConnected, user?.spreadsheetId, user?.sheetName]);

  useEffect(() => {
    if (user) {
      if (user.spreadsheetId) setSpreadsheetId(user.spreadsheetId);
      if (user.sheetName) setSheetName(user.sheetName);
    }
  }, [user]);

  const isValidSpreadsheetId = (id: string): boolean =>
    typeof id === 'string' && /^[A-Za-z0-9_-]{15,}$/.test(id.trim());

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    const cleanId = spreadsheetId.trim();
    const cleanSheet = sheetName.trim() || 'Sheet1';

    if (!cleanId) {
      setErrorMessage('Spreadsheet ID is required.');
      return;
    }
    if (!isValidSpreadsheetId(cleanId)) {
      setErrorMessage('Invalid Spreadsheet ID format (must be at least 15 alphanumeric characters/hyphens).');
      return;
    }

    setSaving(true);
    try {
      const data = await userApi.updateSpreadsheet(cleanId, cleanSheet);
      updateUserData(data.user);
      setSuccessMessage('Settings saved successfully.');
      if (onConfigSaved) onConfigSaved(data.user);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: unknown) {
      const details = apiErrorDetails(error);
      setErrorMessage(details.message || getErrorMessage(error) || 'Failed to save spreadsheet configuration.');
    } finally {
      setSaving(false);
    }
  };

  const handleDemoPreset = () => {
    setSpreadsheetId('1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms');
    setSheetName('Sheet1');
  };

  return (
    <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-5 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 border-[#34A853]/20 rounded-md flex items-center justify-center">
            <FileSpreadsheet className="w-7 h-7 text-emerald-100" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-200">Google Sheet</p>
            <p className="text-xs text-slate-500">Select your spreadshe</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowHelp(!showHelp)}
          className="self-start sm:self-auto flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-100 border border-[#2a2d3a] rounded-md px-2.5 py-1.5 hover:bg-[#1e2130] transition-colors cursor-pointer"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          How to find ID
        </button>
      </div>

      {/* Help panel */}
      {showHelp && (
        <div className="mb-4 bg-blue-500/8 border border-blue-500/20 rounded-md p-3 relative">
          <button
            type="button"
            onClick={() => setShowHelp(false)}
            className="absolute top-2 right-2 text-slate-500 hover:text-slate-300 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <p className="text-xs font-medium text-blue-300 mb-2">Finding your Google Sheet ID</p>
          <p className="text-xs text-blue-400/70 mb-2">Open your Google Sheet and look at the browser URL:</p>
          <div className="bg-[#0f1117] border border-[#2a2d3a] rounded px-2.5 py-2 text-[11px] text-slate-500 overflow-x-auto">
            https://docs.google.com/spreadsheets/d/
            <span className="text-emerald-400 font-bold">
              1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
            </span>
            /edit
          </div>
          <p className="text-xs text-blue-400/70 mt-2">
            Copy the string between <code className="bg-[#0f1117] border border-[#2a2d3a] px-1 rounded">/d/</code> and <code className="bg-[#0f1117] border border-[#2a2d3a] px-1 rounded">/edit</code>.
          </p>
        </div>
      )}

      {/* Messages */}
      {successMessage && (
        <div className="mb-4 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/25 rounded-md px-3 py-2 text-xs text-emerald-500">
          <Check className="w-3.5 h-3.5 shrink-0" />
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="mb-4 flex items-center gap-2 bg-red-500/10 border border-red-500/25 rounded-md px-3 py-2 text-xs text-red-500">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {errorMessage}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-x-4 gap-y-4">
          {/* Spreadsheet ID */}
          <div className="md:col-span-8">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-slate-400">
                Spreadsheet ID <span className="text-red-400">*</span>
              </label>
              <button
                type="button"
                onClick={handleDemoPreset}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
              >
                Use demo ID
              </button>
            </div>
            <input
              type="text"
              value={spreadsheetId}
              onChange={(e) => setSpreadsheetId(e.target.value)}
              placeholder="e.g. 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
              className="w-full px-3 py-2.5 text-sm border border-[#2a2d3a] rounded-md bg-[#0f1117] text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-colors placeholder:text-slate-600"
            />
            <p className="mt-1.5 text-[11px] text-slate-500">Paste the ID from your Google Sheets URL.</p>
          </div>

          {/* Sheet Name */}
          <div className="md:col-span-4">
            <label className="block text-xs font-medium text-slate-400 mb-2">
              Sheet tab name
            </label>
            <input
              type="text"
              value={sheetName}
              onChange={(e) => setSheetName(e.target.value)}
              placeholder="Sheet1"
              className="w-full px-3 py-2.5 text-sm border border-[#2a2d3a] rounded-md bg-[#0f1117] text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-colors placeholder:text-slate-600"
            />
            <p className="mt-1.5 text-[11px] text-slate-500">Example: Sheet1</p>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-4 border-t border-[#2a2d3a]">
          {user?.spreadsheetId && isValidSpreadsheetId(user.spreadsheetId) && user.googleConnected ? (
            <div className="flex flex-col gap-2">
              <a
                href={configuredSheetUrl || `https://docs.google.com/spreadsheets/d/${encodeURIComponent(user.spreadsheetId)}/edit`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 self-start rounded-md bg-[#187935] border-[#188038] px-3 py-2 text-xs font-medium text-white hover:bg-[#177433] transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Open in Google Sheets
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              {tabLinkState === 'loading' && <span className="text-xs text-slate-400">Verifying configured tab…</span>}
              {tabLinkState === 'missing' && <span className="text-xs text-amber-400">{tabError || `Configured tab "${user.sheetName}" was not found. Check its name and save your settings.`}</span>}
              {tabLinkState === 'error' && (
                <>
                  <span className="text-xs text-amber-400">{tabError || 'Could not verify the configured tab. The workbook link above is still available.'}</span>
                  {reconnectForSheets && (
                    <button type="button" onClick={loginWithGoogle} className="self-start text-xs text-indigo-400 hover:text-indigo-300">
                      Reconnect Google and approve Sheets access
                    </button>
                  )}
                </>
              )}
            </div>
          ) : (
            <span className="text-xs text-slate-500">Save a spreadsheet and connect Google to enable the sheet link</span>
          )}

          <button
            type="submit"
            disabled={saving}
            className={`flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white text-xs font-semibold px-4 py-2.5 rounded-md shadow-sm shadow-violet-950/20 transition-colors ${
  saving ? 'cursor-not-allowed' : 'cursor-pointer'
}`}
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
};
