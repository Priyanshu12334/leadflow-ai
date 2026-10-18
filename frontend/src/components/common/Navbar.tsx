import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Menu, Moon, Sun, X } from 'lucide-react';
import { LeadFlowBrand } from './LeadFlowBrand';
import { GoogleIcon } from './GoogleIcon';

interface NavbarProps {
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const Navbar = ({ theme = 'dark', onToggleTheme }: NavbarProps) => {
  const { user, isAuthenticated, loginWithGoogle, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const handleBrand = () => {
    isAuthenticated ? navigate('/dashboard') : navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-[#13151f] border-b border-[#2a2d3a]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">

          {/* Brand */}
          <button
            onClick={handleBrand}
            className="flex items-center gap-2 focus:outline-none cursor-pointer"
            aria-label="LeadFlow home"
          >
            <LeadFlowBrand />
          </button>

          {/* Desktop Nav */}
          {!isAuthenticated && (
            <nav className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm text-slate-400 hover:text-slate-100 transition-colors cursor-pointer">Features</a>
              <a href="#how-it-works" className="text-sm text-slate-400 hover:text-slate-100 transition-colors cursor-pointer">How It Works</a>
              <a href="#pricing" className="text-sm text-slate-400 hover:text-slate-100 transition-colors cursor-pointer">Pricing</a>
            </nav>
          )}

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-slate-400 truncate max-w-[160px]">
                  {user?.name || user?.email}
                </span>
                {onToggleTheme && (
                  <button
                    onClick={onToggleTheme}
                    className="flex items-center justify-center text-slate-400 hover:text-slate-100 border border-[#2a2d3a] rounded-md p-1.5 hover:bg-[#1e2130] transition-colors cursor-pointer"
                    aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                    title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                  >
                    {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </button>
                )}
                <button
                  onClick={logout}
                  className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-red-300 border border-[#2a2d3a] rounded-md px-3 py-1.5 hover:bg-red-500/10 hover:border-red-400/30 transition-colors duration-200 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign out
                </button>
              </>
            ) : (
              <>
                {onToggleTheme && (
                  <button
                    onClick={onToggleTheme}
                    className="flex items-center justify-center text-slate-400 hover:text-slate-100 border border-[#2a2d3a] rounded-md p-1.5 hover:bg-[#1e2130] transition-colors cursor-pointer"
                    aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                    title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                  >
                    {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </button>
                )}
                <button
                  onClick={loginWithGoogle}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-1.5 rounded-md transition-colors cursor-pointer"
                >
                  <GoogleIcon />
                  Connect with Google
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-[#1e2130] transition-colors cursor-pointer"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div id="mobile-navigation" className="md:hidden overflow-x-hidden border-t border-[#2a2d3a] bg-[#13151f] shadow-lg">
          <div className="mx-auto max-w-6xl space-y-1 px-4 py-3 sm:px-6">
            {!isAuthenticated && (
              <nav aria-label="Mobile navigation" className="space-y-1">
                <a
                  href="#features"
                  onClick={() => setMobileOpen(false)}
                  className="flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-slate-400 hover:bg-[#1e2130] hover:text-slate-100 transition-colors cursor-pointer"
                >
                  Features
                </a>
                <a
                  href="#how-it-works"
                  onClick={() => setMobileOpen(false)}
                  className="flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-slate-400 hover:bg-[#1e2130] hover:text-slate-100 transition-colors cursor-pointer"
                >
                  How It Works
                </a>
                <a
                  href="#pricing"
                  onClick={() => setMobileOpen(false)}
                  className="flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-slate-400 hover:bg-[#1e2130] hover:text-slate-100 transition-colors cursor-pointer"
                >
                  Pricing
                </a>
              </nav>
            )}

            <div className={`flex flex-col gap-2 ${!isAuthenticated ? 'mt-3 border-t border-[#2a2d3a] pt-3' : ''}`}>
              {onToggleTheme && (
                <button
                  onClick={onToggleTheme}
                  className="flex min-h-11 w-full items-center gap-3 rounded-lg border border-[#2a2d3a] px-3 text-sm font-medium text-slate-300 hover:bg-[#1e2130] hover:text-slate-100 transition-colors cursor-pointer"
                  aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                  title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  <span>Switch to {theme === 'dark' ? 'Light' : 'Dark'} mode</span>
                </button>
              )}
              {isAuthenticated ? (
                <button
                  onClick={() => { logout(); setMobileOpen(false); }}
                  className="flex min-h-11 w-full min-w-0 items-center gap-2 rounded-lg border border-transparent px-3 text-sm text-slate-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-400/30 transition-colors duration-200 cursor-pointer"
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                  <span className="truncate">Sign out ({user?.name || user?.email})</span>
                </button>
              ) : (
                <button
                  onClick={() => { loginWithGoogle(); setMobileOpen(false); }}
                  className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-500 transition-colors cursor-pointer"
                >
                  <GoogleIcon />
                  Connect with Google
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
