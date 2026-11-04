import { useEffect, useMemo, useRef, useState } from 'react';
import { Eye, RefreshCw, Search, X } from 'lucide-react';
import { SiGmail, SiGooglesheets } from 'react-icons/si';
import { Link } from 'react-router-dom';
import { paginateLeads } from '../../utils/followUpPagination';
import { getLeadDisplayEmail, getPrimaryLeadTitle, isDuplicateDisplayValue } from '../../utils/leadDisplay';
import { useFollowUps } from '../../hooks/useFollowUps';
import { useAuth } from '../../context/AuthContext';
import { userApi } from '../../api/userApi';
import type { LeadListItem } from '../../types';
import { getErrorMessage } from '../../types';

export const LeadList = () => {
  const { leads, loading, refreshing, error, refresh } = useFollowUps();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [selectedLead, setSelectedLead] = useState<LeadListItem | null>(null);
  const [sheetUrl, setSheetUrl] = useState<string | null>(null);
  const [sheetUrlError, setSheetUrlError] = useState('');
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const detailsButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    setSelectedLead(null);
    setPage(1);
  }, [user?.id, user?.spreadsheetId, user?.sheetName]);

  const filteredLeads = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase();
    if (!query) return leads;
    const matches = leads.filter((lead) => [lead.name, lead.email, lead.company, lead.context, ...lead.fields.map(({ value }) => value)]
      .some((value) => value.toLocaleLowerCase().includes(query)));
    return matches.sort((left, right) => {
      const leftExactName = left.name.toLocaleLowerCase() === query;
      const rightExactName = right.name.toLocaleLowerCase() === query;
      return Number(rightExactName) - Number(leftExactName);
    });
  }, [leads, searchQuery]);
  const pageData = useMemo(() => paginateLeads(filteredLeads, page, 10), [filteredLeads, page]);
  const drawerTitle = selectedLead ? getPrimaryLeadTitle(selectedLead.fields) : 'Unnamed lead';
  const pageWindowStart = Math.min(Math.max(1, pageData.page - 2), Math.max(1, pageData.pageCount - 4));
  const pageNumbers = Array.from({ length: Math.min(5, pageData.pageCount) }, (_, index) => pageWindowStart + index);

  useEffect(() => {
    let active = true;
    setSheetUrl(null);
    setSheetUrlError('');
    if (!user?.googleConnected || !user.spreadsheetId) return () => { active = false; };

    userApi.getSpreadsheetOpenLink()
      .then(({ url }) => { if (active) setSheetUrl(url); })
      .catch((error: unknown) => {
        if (active) setSheetUrlError(getErrorMessage(error) || 'Could not load the configured Google Sheet link.');
      });
    return () => { active = false; };
  }, [user?.googleConnected, user?.spreadsheetId, user?.sheetName]);

  useEffect(() => {
    if (!selectedLead) return undefined;
    closeButtonRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedLead(null);
        detailsButtonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [selectedLead]);

  const closeDrawer = () => {
    setSelectedLead(null);
    detailsButtonRef.current?.focus();
  };

  const changeSearch = (value: string) => {
    setSearchQuery(value);
    setPage(1);
  };

  return <section className="w-full min-w-0 max-w-full rounded-lg border border-[#2a2d3a] bg-[#1a1d27] p-4 sm:p-5">
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-slate-200">Lead directory</h2>
        <p className="mt-1 text-xs text-slate-500">Imported leads from your configured Google Sheet.</p>
      </div>
      <div className="flex w-full min-w-0 flex-wrap gap-1.5 sm:w-auto sm:justify-end lg:flex-nowrap">
        <Link to="/dashboard#process-leads" className="inline-flex min-h-10 items-center rounded-md border border-[#2a2d3a] px-2.5 py-2 font-sans text-xs font-medium tracking-normal text-slate-300 transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400">
          Process leads
        </Link>
        <a href="https://mail.google.com/mail/u/0/#drafts" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-1.5 rounded-md border border-[#2a2d3a] px-2.5 py-2 text-xs text-slate-300 transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400">
          <SiGmail aria-hidden="true" className="h-4 w-4 text-[#EA4335]" /> Gmail Drafts
        </a>
        <button type="button" onClick={() => { if (sheetUrl) window.open(sheetUrl, '_blank', 'noopener,noreferrer'); }} disabled={!sheetUrl} title={!user?.googleConnected ? 'Connect Google to open your spreadsheet' : !user.spreadsheetId ? 'Configure a spreadsheet to open it' : sheetUrlError || (sheetUrl ? 'Open the configured Google Sheet in a new tab' : 'Loading the configured Google Sheet')} aria-label="Open Google Sheet" className="inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-md border border-[#2a2d3a] px-2.5 py-2 text-xs text-slate-300 transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-100">
          <SiGooglesheets aria-hidden="true" className="h-4 w-4 text-[#34A853]" /> Google Sheet
        </button>
        <button type="button" onClick={() => void refresh()} disabled={refreshing} title="Refresh leads" aria-label="Refresh leads" className="inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-md border border-[#2a2d3a] px-2.5 py-2 text-xs text-slate-300 transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-50">
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>
    </div>

    <label className="mb-4 flex min-h-10 w-full items-center gap-2 rounded-md border border-[#343847] bg-[#0f1117] px-3 text-slate-400 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500/30 sm:max-w-[300px]">
      <Search aria-hidden="true" className="h-4 w-4 shrink-0" />
      <span className="sr-only">Search leads</span>
      <input value={searchQuery} onChange={(event) => changeSearch(event.currentTarget.value)} placeholder="Search leads..." className="min-w-0 flex-1 bg-transparent py-2 text-sm text-slate-200 outline-none placeholder:text-slate-600" />
      {searchQuery && <button type="button" onClick={() => changeSearch('')} aria-label="Clear search" className="rounded p-1 text-slate-500 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"><X className="h-3.5 w-3.5" /></button>}
    </label>

    {error && <div role="alert" className="mb-3 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</div>}
    {loading && leads.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">Loading leads...</p>
      : leads.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">No leads found in the configured sheet.</p>
        : pageData.total === 0 ? <p className="py-8 text-center text-sm text-slate-500">No leads match your search.</p>
          : <div className="w-full min-w-0 overflow-x-auto overscroll-x-contain">
            <table className="w-full min-w-0 table-fixed text-left text-sm">
              <colgroup><col className="w-[66%]" /><col className="w-[34%]" /></colgroup>
              <thead className="text-xs text-slate-500"><tr><th scope="col" className="px-3 py-2 font-medium">Lead</th><th scope="col" className="px-3 py-2 text-right font-medium">Actions</th></tr></thead>
              <tbody>{pageData.items.map((lead) => {
                const displayName = getPrimaryLeadTitle(lead.fields);
                const email = getLeadDisplayEmail(lead.fields, lead.email);
                return <tr key={lead.rowNumber} className="border-t border-[#2a2d3a]">
                  <td className="min-w-0 px-3 py-3.5">
                    <div className="break-words font-medium text-slate-100">{displayName}</div>
                    {email && !isDuplicateDisplayValue(displayName, email) && <div className="mt-0.5 break-all text-xs text-slate-400">{email}</div>}
                  </td>
                  <td className="px-2 py-3 text-right sm:px-3">
                  <button type="button" onClick={(event) => { detailsButtonRef.current = event.currentTarget; setSelectedLead(lead); }} aria-label={`View details for ${displayName}`} className="inline-flex min-h-9 cursor-pointer items-center justify-center gap-1 rounded-md border border-[#343847] px-1.5 text-[11px] font-medium text-slate-300 transition-colors hover:border-indigo-400/40 hover:bg-indigo-500/5 hover:text-indigo-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 sm:gap-1.5 sm:px-2.5 sm:text-xs">
                      <Eye aria-hidden="true" className="h-3.5 w-3.5 shrink-0" /><span><span className="hidden sm:inline">View </span>Details</span>
                    </button>
                  </td>
                </tr>;
              })}</tbody>
            </table>
          </div>}

    {!loading && filteredLeads.length > 0 && <div className="mt-4 flex flex-col items-center justify-between gap-3 border-t border-[#2a2d3a] pt-4 sm:flex-row">
      <p className="text-xs text-slate-500">Showing {pageData.first}–{pageData.last} of {pageData.total} leads</p>
      <nav aria-label="Lead pages" className="flex min-w-0 max-w-full flex-wrap items-center justify-center gap-1">
        <button type="button" onClick={() => setPage(Math.max(1, pageData.page - 1))} disabled={pageData.page === 1} className="min-h-9 rounded-md border border-[#2a2d3a] px-2 text-xs text-slate-300 transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-40">Previous</button>
        {pageNumbers.map((pageNumber) => <button key={pageNumber} type="button" onClick={() => setPage(pageNumber)} aria-label={`Page ${pageNumber}`} aria-current={pageData.page === pageNumber ? 'page' : undefined} className={`min-h-9 min-w-9 rounded-md border px-2 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${pageData.page === pageNumber ? 'border-indigo-500/60 bg-indigo-500/10 text-indigo-200' : 'border-[#2a2d3a] text-slate-300 hover:bg-white/5'}`}>{pageNumber}</button>)}
        <button type="button" onClick={() => setPage(Math.min(pageData.pageCount, pageData.page + 1))} disabled={pageData.page === pageData.pageCount} className="min-h-9 rounded-md border border-[#2a2d3a] px-2 text-xs text-slate-300 transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-40">Next</button>
      </nav>
    </div>}

    {selectedLead && <div className="fixed inset-0 z-50 flex justify-end bg-black/60" onMouseDown={(event) => { if (event.target === event.currentTarget) closeDrawer(); }}>
        <aside role="dialog" aria-modal="true" aria-labelledby="lead-detail-title" onKeyDown={(event) => { if (event.key === 'Tab') { event.preventDefault(); closeButtonRef.current?.focus(); } }} className="flex h-full w-full max-w-full flex-col border-l border-[#343847] bg-[#1a1d27] shadow-2xl sm:max-w-lg">
        <div className="flex items-start justify-between gap-4 border-b border-[#2a2d3a] px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo-300">Lead details</p>
            <h2 id="lead-detail-title" className="mt-1 break-words text-lg font-semibold text-slate-100">{drawerTitle}</h2>
          </div>
          <button ref={closeButtonRef} type="button" onClick={closeDrawer} aria-label="Close lead details" className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"><X className="h-4 w-4" /></button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          {selectedLead.fields.length > 0 ? <dl className="divide-y divide-[#2a2d3a]">
            {selectedLead.fields.filter(({ column, value }) => column.trim() && value.trim()).map(({ column, value }, index) => <div key={`${column}-${index}`} className="grid min-w-0 gap-1 py-3 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] sm:gap-4">
              <dt className="break-words text-xs font-medium text-slate-500">{column}</dt>
              <dd className="min-w-0 whitespace-pre-wrap break-words text-sm text-slate-200">{value}</dd>
            </div>)}
          </dl> : <p className="py-8 text-center text-sm text-slate-500">No non-empty sheet fields are available for this lead.</p>}
        </div>
      </aside>
    </div>}
  </section>;
};
