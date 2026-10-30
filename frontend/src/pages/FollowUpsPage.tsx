import { CalendarCheck2 } from 'lucide-react';
import { FollowUpList } from '../components/dashboard/FollowUpList';

export const FollowUpsPage = () => (
  <div className="mx-auto w-full min-w-0 max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
    <div className="mb-5 flex w-full min-w-0 items-center gap-3">
      <div className="min-w-0 flex-1"><h1 className="text-xl font-semibold text-slate-100">Follow-ups</h1><p className="mt-0.5 text-sm text-slate-500">Keep your next conversations on schedule.</p></div>
    </div>
    <div className="w-full min-w-0"><FollowUpList /></div>
  </div>
);
