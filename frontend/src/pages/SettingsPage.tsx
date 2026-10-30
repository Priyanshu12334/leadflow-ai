import { LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const SettingsPage = () => {
  const { user, logout } = useAuth();
  const draftsUsed = user?.draftsUsed ?? 0;
  const draftLimit = user?.draftLimit ?? 20;
  const resetDate = user?.usagePeriodResetAt
    ? new Date(user.usagePeriodResetAt).toLocaleString(undefined, {
        year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit',
      })
    : 'Loading quota data…';

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-slate-100">Settings</h1>
        <p className="mt-0.5 text-xs text-slate-500">Your account and usage settings.</p>
      </div>

      <section aria-labelledby="draft-quota-heading" className="rounded-lg border border-[#2a2d3a] bg-[#1a1d27] p-5 sm:p-6">
        <div className="mb-5 flex items-center gap-3">

          <div>
            <h2 id="draft-quota-heading" className="text-sm font-semibold text-slate-100">Draft Quota &amp; Reset</h2>
            <p className="mt-0.5 text-xs text-slate-500">Free plan limit: {draftLimit} drafts per 30-day cycle</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-md border border-[#2a2d3a] bg-[#0f1117] p-4">
            <p className="text-xs text-slate-500">Drafts used</p>
            <p className="mt-1 text-xl font-semibold text-slate-100">{draftsUsed} <span className="text-sm font-normal text-slate-500">/ {draftLimit}</span></p>
          </div>
          <div className="rounded-md border border-[#2a2d3a] bg-[#0f1117] p-4">
            <p className="text-xs text-slate-500">Next reset</p>
            <p className="mt-1 text-sm font-semibold text-slate-100">{resetDate}</p>
          </div>
        </div>

        <p className="mt-4 text-xs leading-5 text-slate-400">
          Your quota renews every 30 days from your individual signup and quota cycle date. It does not reset on the first of each month.
        </p>
      </section>

      <section aria-label="Account actions" className="mt-4 flex flex-col gap-3 rounded-lg border border-[#2a2d3a] bg-[#1a1d27] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
    
          <div>
            <p className="text-sm font-medium text-slate-200">Account session</p>
            <p className="text-xs text-slate-500">Sign out of LeadFlow on this device.</p>
          </div>
        </div>
        <button type="button" onClick={() => { void logout(); }} className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-red-500/25 bg-red-500/10 px-4 text-sm font-medium text-red-300 transition-colors hover:bg-red-500/15">
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </section>
    </div>
  );
};
