import { LeadList } from '../components/dashboard/FollowUpList';

export const LeadsPage = () => (
  <div className="mx-auto w-full min-w-0 max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
    <div className="mb-5 flex w-full min-w-0 items-center gap-3">
      <div className="min-w-0 flex-1"><h1 className="text-2xl font-semibold text-slate-100">Leads</h1><p className="mt-0.5 text-sm text-slate-500">Browse the leads imported from your Google Sheet.</p></div>
    </div>
    <div className="w-full min-w-0"><LeadList /></div>
  </div>
);
