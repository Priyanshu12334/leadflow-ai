import { LogOut } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

function formatQuotaResetDateTime(value?: string): string {
  if (!value) return 'your next 30-day reset date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'your next 30-day reset date';
  const dateText = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
  const timeText = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
  return `${dateText} at ${timeText}`;
}

export const SettingsPage = () => {
  const { user, logout } = useAuth();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const draftsUsed = user?.draftsUsed ?? 0;
  const draftLimit = user?.draftLimit ?? 20;
  const draftsRemaining = Math.max(0, draftLimit - draftsUsed);
  const resetDateTime = formatQuotaResetDateTime(user?.usagePeriodResetAt);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-100">Settings</h1>
        <p className="mt-0.5 text-xs text-slate-500">Your account and usage settings.</p>
      </div>

      <section aria-labelledby="draft-quota-heading" className="rounded-lg border border-[#2a2d3a] bg-[#1a1d27] p-5 sm:p-6">
        <div className="mb-5">
          <div>
            <h2 id="draft-quota-heading" className={user?.isDemo ? 'text-sm font-semibold text-slate-100' : 'text-base font-semibold text-slate-100'}>
              {user?.isDemo ? 'Draft Quota' : 'Draft Quota & Reset'}
            </h2>
            <p className={user?.isDemo ? 'mt-0.5 text-xs text-slate-500' : 'mt-1 text-sm text-slate-400'}>
              {user?.isDemo ? 'Demo limit: 20 drafts' : 'Free plan limit: 20 drafts per 30-day cycle'}
            </p>
          </div>
        </div>

        {user?.isDemo ? (
          <>
            <div className="rounded-md border border-[#2a2d3a] bg-[#0f1117] p-4">
              <p className="text-xs text-slate-500">Demo limit</p>
              <p className="mt-1 text-xl font-semibold text-slate-100">20 drafts</p>
            </div>
            <p className="mt-4 text-xs leading-5 text-slate-400">In demo mode, drafts are not consumed.</p>
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="min-h-[108px] rounded-md border border-[#2a2d3a] bg-[#0f1117] p-4">
                <p className="text-sm text-slate-400">Drafts used</p>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-2xl font-semibold text-slate-100">{draftsUsed}</span>
                  <span className="text-base text-slate-400">/ {draftLimit}</span>
                </div>
                <p className="mt-1 text-sm text-slate-400">{draftsRemaining} drafts remaining</p>
              </div>
              <div className="min-h-[108px] rounded-md border border-[#2a2d3a] bg-[#0f1117] p-4">
                <p className="text-sm text-slate-400">Next reset</p>
                <p className="mt-1 text-base font-medium leading-6 text-slate-100">{resetDateTime}</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-5 text-slate-400">
              Your quota renews every 30 days from your individual signup and quota cycle date. It does not reset on the first of each month.
            </p>
          </>
        )}
      </section>

      <section aria-label="Account actions" className="mt-4 flex flex-col gap-3 rounded-lg border border-[#2a2d3a] bg-[#1a1d27] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-sm font-medium text-slate-200">Account session</p>
            <p className="text-xs text-slate-500">Sign out of LeadFlow on this device.</p>
          </div>
        </div>
        <button type="button" onClick={() => setConfirmLogout(true)} className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-md border-0 bg-red-500 px-4 text-sm font-medium text-white transition-colors hover:bg-red-600">
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </section>

      {confirmLogout && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setConfirmLogout(false); }}>
        <section role="alertdialog" aria-modal="true" aria-labelledby="logout-confirm-title" aria-describedby="logout-confirm-message" className="w-full max-w-sm rounded-lg border border-[#343847] bg-[#1a1d27] p-5 shadow-2xl">
          <h2 id="logout-confirm-title" className="text-base font-semibold text-slate-100">Log out?</h2>
          <p id="logout-confirm-message" className="mt-2 text-sm text-slate-400">Are you sure you want to log out of LeadFlow?</p>
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={() => setConfirmLogout(false)} className="inline-flex min-h-9 cursor-pointer items-center justify-center rounded-md border border-[#343847] px-3 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5">Cancel</button>
            <button type="button" onClick={() => { setConfirmLogout(false); void logout(); }} className="inline-flex min-h-9 cursor-pointer items-center justify-center rounded-md bg-red-500 px-3 text-sm font-medium text-white transition-colors hover:bg-red-600">Log out</button>
          </div>
        </section>
      </div>}
    </div>
  );
};
