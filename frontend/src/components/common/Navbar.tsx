import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Moon, Sun, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { LeadFlowBrand } from './LeadFlowBrand';
import { GoogleIcon } from './GoogleIcon';

interface NavbarProps {
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

const publicLinks = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How It Works' },
  { href: '#pricing', label: 'Pricing' },
];

export const Navbar = ({ theme = 'dark', onToggleTheme }: NavbarProps) => {
  const { loginWithGoogle } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const toggleLabel = `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`;

  return <header className="sticky top-0 z-50 border-b border-[#2a2d3a] bg-[#13151f]">
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <div className="flex h-14 items-center justify-between">
        <button onClick={() => navigate('/')} className="flex cursor-pointer items-center gap-2 focus:outline-none" aria-label="LeadFlow home"><LeadFlowBrand /></button>
        <nav aria-label="Main navigation" className="hidden items-center gap-6 md:flex">
          {publicLinks.map((link) => <a key={link.href} href={link.href} className="cursor-pointer text-sm text-slate-400 transition-colors hover:text-slate-100">{link.label}</a>)}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          {onToggleTheme && <button onClick={onToggleTheme} className="flex items-center justify-center rounded-md border border-[#2a2d3a] p-1.5 text-slate-400 transition-colors hover:bg-[#1e2130] hover:text-slate-100" aria-label={toggleLabel} title={toggleLabel}>{theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</button>}
          <button onClick={loginWithGoogle} className="flex cursor-pointer items-center gap-2 rounded-md bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500"><GoogleIcon />Connect with Google</button>
        </div>
        <button className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-[#1e2130] md:hidden" onClick={() => setMobileOpen((open) => !open)} aria-label={mobileOpen ? 'Close menu' : 'Open menu'} aria-expanded={mobileOpen} aria-controls="public-mobile-menu">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
    </div>
    {mobileOpen && <div id="public-mobile-menu" className="border-t border-[#2a2d3a] bg-[#13151f] px-4 py-3 shadow-lg md:hidden">
      <nav aria-label="Mobile navigation" className="space-y-1">
        {publicLinks.map((link) => <a key={link.href} href={link.href} onClick={() => setMobileOpen(false)} className="flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-slate-400 transition-colors hover:bg-[#1e2130] hover:text-slate-100">{link.label}</a>)}
      </nav>
      <div className="mt-3 flex flex-col gap-2 border-t border-[#2a2d3a] pt-3">
        {onToggleTheme && <button onClick={onToggleTheme} className="flex min-h-11 items-center gap-3 rounded-lg border border-[#2a2d3a] px-3 text-sm font-medium text-slate-300 transition-colors hover:bg-[#1e2130]" aria-label={toggleLabel}>{theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}Switch to {theme === 'dark' ? 'Light' : 'Dark'} mode</button>}
        <button onClick={() => { loginWithGoogle(); setMobileOpen(false); }} className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white transition-colors hover:bg-indigo-500"><GoogleIcon />Connect with Google</button>
      </div>
    </div>}
  </header>;
};
