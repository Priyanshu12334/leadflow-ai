import { CalendarDays, LayoutDashboard, Mail, Settings, X } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LeadFlowBrand } from './LeadFlowBrand';

interface AppSidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const navigation = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/follow-ups', label: 'Follow-ups', icon: CalendarDays, end: false },
  { to: '/contact', label: 'Contact', icon: Mail, end: false },
  { to: '/settings', label: 'Settings', icon: Settings, end: false },
];

function initials(name?: string, email?: string): string {
  const label = name?.trim() || email?.trim() || '?';
  const parts = label.includes('@') ? [label.split('@')[0]] : label.split(/\s+/);
  return parts.slice(0, 2).map((part) => part.charAt(0)).join('').toUpperCase();
}

export const AppSidebar = ({ mobileOpen, onCloseMobile }: AppSidebarProps) => {
  const { user } = useAuth();
  const activeClass = 'border-0 shadow-none bg-[#1e2130] text-slate-100';
  const inactiveClass = 'border border-transparent text-slate-400 hover:bg-[#1e2130] hover:text-slate-100';

  return <>
    {mobileOpen && <button type="button" aria-label="Close navigation menu" className="fixed inset-0 z-40 bg-black/60 xl:hidden" onClick={onCloseMobile} />}
    <aside id="app-sidebar" aria-label="Application sidebar" className={`fixed inset-y-0 left-auto right-0 z-50 flex w-[min(84vw,18rem)] flex-col border-l border-[#2a2d3a] bg-[#1a1d27] px-4 py-5 transition-transform duration-200 xl:left-0 xl:right-auto xl:w-60 xl:border-l-0 xl:border-r xl:translate-x-0 xl:px-5 ${mobileOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="flex items-start justify-between">
        <div className="min-w-0 py-1"><LeadFlowBrand size="sidebar" /></div>
        <button type="button" onClick={onCloseMobile} className="ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-white/[0.05] hover:text-slate-100 xl:hidden" aria-label="Close navigation menu"><X className="h-5 w-5" /></button>
      </div>

      <nav aria-label="Primary navigation" className="mt-9 space-y-1.5">
        {navigation.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} onClick={(event) => { if (event.detail > 0) event.currentTarget.blur(); onCloseMobile(); }} className={({ isActive }) => `flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors outline-none shadow-none focus-visible:ring-0 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-slate-500 ${isActive ? activeClass : inactiveClass}`}>
          <Icon className="h-[18px] w-[18px] shrink-0" />
          <span>{label}</span>
        </NavLink>)}
      </nav>

      <div className="mt-auto space-y-4 border-t border-[#2a2d3a] pt-4">
        <Link to="/settings" onClick={onCloseMobile} aria-label="Open Settings" className="flex min-w-0 cursor-pointer flex-wrap items-center gap-x-2.5 gap-y-1 rounded-lg bg-[#1e2130] p-2.5 transition-colors hover:bg-[#1e2130] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#13151f]">
          <div aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-500/15 text-sm font-semibold text-indigo-200">{initials(user?.name, user?.email)}</div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-100">{user?.name || 'LeadFlow user'}</p>
            {user?.plan && <p className="text-[11px] font-medium capitalize text-indigo-300">{user.plan} Plan</p>}
          </div>
        </Link>
      </div>
    </aside>
  </>;
};
