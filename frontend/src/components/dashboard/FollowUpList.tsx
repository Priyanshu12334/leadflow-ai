import { useMemo, useState } from 'react';
import { CalendarDays, ExternalLink, RefreshCw } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import type { FollowUpFilter } from '../../utils/followUps';
import { countFollowUps, filterFollowUps, localDateKey } from '../../utils/followUps';
import { paginateLeads } from '../../utils/followUpPagination';
import { useFollowUps } from '../../hooks/useFollowUps';

const filters: Array<{ key: FollowUpFilter; title: string; color: string }> = [
  { key: 'all', title: 'All leads', color: 'text-slate-300' },
  { key: 'due', title: 'Due Today', color: 'text-amber-300' },
  { key: 'upcoming', title: 'Upcoming', color: 'text-indigo-300' },
  { key: 'overdue', title: 'Overdue', color: 'text-red-300' },
  { key: 'none', title: 'Not scheduled', color: 'text-slate-400' },
];
const filterKeys = new Set<FollowUpFilter>(filters.map(({ key }) => key));

export const FollowUpList = () => {
  const { leads, loading, refreshing, error, savingRow, refresh, updateDate } = useFollowUps();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedFilter = searchParams.get('filter') as FollowUpFilter | null;
  const filter = requestedFilter && filterKeys.has(requestedFilter) ? requestedFilter : 'all';
  const [pageState, setPageState] = useState<{ filter: FollowUpFilter; page: number }>({ filter: 'all', page: 1 });
  const page = pageState.filter === filter ? pageState.page : 1;
  const today = localDateKey();
  const counts = countFollowUps(leads, today);
  const filteredLeads = useMemo(() => filterFollowUps(leads, filter, today), [filter, leads, today]);
  const pageData = useMemo(() => paginateLeads(filteredLeads, page, 10), [filteredLeads, page]);

  const chooseFilter = (nextFilter: FollowUpFilter) => {
    setPageState({ filter: nextFilter, page: 1 });
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (nextFilter === 'all') next.delete('filter');
      else next.set('filter', nextFilter);
      return next;
    }, { replace: true });
  };

  const pageWindowStart = Math.min(Math.max(1, pageData.page - 2), Math.max(1, pageData.pageCount - 4));
  const pageNumbers = Array.from({ length: Math.min(5, pageData.pageCount) }, (_, index) => pageWindowStart + index);

  return <section className="w-full min-w-0 max-w-full rounded-lg border border-[#2a2d3a] bg-[#1a1d27] p-4 sm:p-5">
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <h2 className="text-sm font-semibold text-slate-200">Lead follow-ups</h2>
        <p className="mt-1 text-xs text-slate-500">Set dates to track when each lead needs attention. Dates use your local calendar.</p>
      </div>
      <div className="flex w-full min-w-0 max-w-full flex-wrap gap-2 sm:w-auto">
        <a href="https://mail.google.com/mail/u/0/#drafts" target="_blank" rel="noreferrer" className="inline-flex min-h-10 max-w-full items-center gap-2 rounded-md border border-[#2a2d3a] px-3 py-2 text-xs text-slate-300 hover:bg-white/5">
          Open Gmail drafts <ExternalLink className="h-3.5 w-3.5" />
        </a>
        <Link to="/dashboard#process-leads" className="inline-flex min-h-10 max-w-full items-center rounded-md border border-[#2a2d3a] px-3 py-2 text-xs text-slate-300 hover:bg-white/5">
          Process leads
        </Link>
        <button onClick={() => void refresh()} disabled={refreshing} className="inline-flex min-h-10 max-w-full items-center gap-2 rounded-md border border-[#2a2d3a] px-3 py-2 text-xs text-slate-300 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50">
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>
    </div>

    <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
      {filters.map((item) => {
        const count = item.key === 'all' ? leads.length : counts[item.key];
        return <button key={item.key} onClick={() => chooseFilter(item.key)} aria-pressed={filter === item.key} className={`min-w-0 cursor-pointer rounded-md px-3 py-2.5 text-left transition-colors outline-none shadow-none ${filter === item.key ? 'bg-[#202633]' : 'bg-[#222938] hover:bg-[#2a3242] focus-visible:bg-[#2a3242]'}`}>
          <span className={`block text-xs ${item.color}`}>{item.title}</span>
          <strong className="mt-1 block text-lg text-slate-100">{loading && leads.length === 0 ? '—' : count}</strong>
        </button>;
      })}
    </div>

    {error && <div role="alert" className="mb-3 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</div>}
    {loading && leads.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">Loading leads…</p>
      : leads.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">No leads found in the configured sheet.</p>
        : pageData.total === 0 ? <p className="py-8 text-center text-sm text-slate-500">No leads in this follow-up group.</p>
          : <div className="relative block w-full min-w-0 max-w-full overflow-x-auto overscroll-x-contain"><table className="w-full min-w-[680px] text-left text-sm">
            <thead className="text-xs text-slate-500"><tr><th className="px-3 py-2 font-medium">Lead</th><th className="px-3 py-2 font-medium">Company</th><th className="px-3 py-2 font-medium">Follow-up date</th></tr></thead>
            <tbody>{pageData.items.map((lead) => <tr key={lead.rowNumber} className="border-t border-[#2a2d3a]">
              <td className="px-3 py-3"><div className="font-medium text-slate-200">{lead.name || 'Unnamed lead'}</div><div className="text-xs text-slate-500">{lead.email}</div></td>
              <td className="px-3 py-3 text-slate-400">{lead.company || '—'}</td>
              <td className="px-3 py-3"><label className="flex flex-wrap items-center gap-2 text-xs text-slate-400"><CalendarDays className="h-3.5 w-3.5 shrink-0"/><span className="sr-only">Set follow-up date for {lead.name}</span><input type="date" value={lead.nextFollowUpDate ?? ''} disabled={savingRow === lead.rowNumber} onChange={(event) => void updateDate(lead, event.target.value)} className="rounded border border-[#343847] bg-[#0f1117] px-2 py-1.5 text-slate-200 disabled:opacity-50"/>{!lead.nextFollowUpDate && <span>Not scheduled</span>}</label></td>
            </tr>)}</tbody>
          </table></div>}

    {!loading && leads.length > 0 && <div className="mt-4 flex flex-col items-center justify-between gap-3 border-t border-[#2a2d3a] pt-4 sm:flex-row">
      <p className="text-xs text-slate-500">Showing {pageData.first}–{pageData.last} of {pageData.total} leads</p>
      <nav aria-label="Follow-up lead pages" className="flex min-w-0 max-w-full flex-wrap items-center justify-center gap-1">
        <button type="button" onClick={() => setPageState({ filter, page: Math.max(1, pageData.page - 1) })} disabled={pageData.page === 1} className="min-h-9 rounded-md border border-[#2a2d3a] px-2 text-xs text-slate-300 transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-40">Previous</button>
        {pageNumbers.map((pageNumber) => <button key={pageNumber} type="button" onClick={() => setPageState({ filter, page: pageNumber })} aria-label={`Page ${pageNumber}`} aria-current={pageData.page === pageNumber ? 'page' : undefined} className={`min-h-9 min-w-9 rounded-md border px-2 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${pageData.page === pageNumber ? 'border-indigo-500/60 bg-indigo-500/10 text-indigo-200' : 'border-[#2a2d3a] text-slate-300 hover:bg-white/5'}`}>{pageNumber}</button>)}
        <button type="button" onClick={() => setPageState({ filter, page: Math.min(pageData.pageCount, pageData.page + 1) })} disabled={pageData.page === pageData.pageCount} className="min-h-9 rounded-md border border-[#2a2d3a] px-2 text-xs text-slate-300 transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-40">Next</button>
      </nav>
    </div>}
  </section>;
};
