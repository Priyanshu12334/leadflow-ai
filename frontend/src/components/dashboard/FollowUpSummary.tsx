import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useFollowUps } from '../../hooks/useFollowUps';
import { countFollowUps } from '../../utils/followUps';

const cards = [
  { key: 'due', title: 'Due Today', color: 'text-amber-300' },
  { key: 'upcoming', title: 'Upcoming', color: 'text-indigo-300' },
  { key: 'overdue', title: 'Overdue', color: 'text-red-300' },
] as const;

export const FollowUpSummary = () => {
  const { leads, loading, error } = useFollowUps();
  const counts = countFollowUps(leads);

  return <section className="rounded-lg border border-[#2a2d3a] bg-[#1a1d27] p-5">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-sm font-semibold text-slate-200">Follow-ups</h2>
        <p className="mt-1 text-xs text-slate-500">A quick view of your scheduled lead follow-ups.</p>
      </div>
      <Link to="/follow-ups" className="inline-flex min-h-10 items-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1d27]">
        View all follow-ups <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
    {error && <p role="alert" className="mb-3 text-xs text-red-300">{error}</p>}
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      {cards.map((card) => <Link key={card.key} to={`/follow-ups?filter=${card.key}`} aria-label={`View ${card.title.toLowerCase()} follow-ups`} className="block cursor-pointer rounded-md border border-[#2a2d3a] bg-[#0f1117] px-3 py-2.5 transition-colors hover:border-indigo-400/40 hover:bg-indigo-500/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400">
        <span className={`block text-xs ${card.color}`}>{card.title}</span>
        <strong className="mt-1 block text-xl text-slate-100">{loading ? '—' : counts[card.key]}</strong>
      </Link>)}
    </div>
  </section>;
};
