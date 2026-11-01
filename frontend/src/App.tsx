import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Menu, Moon, Sun } from 'lucide-react';
import { AuthProvider } from './context/AuthContext';
import { FollowUpsProvider } from './context/FollowUpsContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { PublicOnlyRoute } from './components/common/PublicOnlyRoute';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { FollowUpsPage } from './pages/FollowUpsPage';
import { ContactPage } from './pages/ContactPage';
import { SettingsPage } from './pages/SettingsPage';
import { TermsPage } from './pages/TermsPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { AppSidebar } from './components/common/AppSidebar';
import { LeadFlowBrand } from './components/common/LeadFlowBrand';
import './App.css';
import type { PropsWithChildren } from 'react';

type Theme = 'dark' | 'light';

interface ThemeLayoutProps extends PropsWithChildren {
  theme: Theme;
  onToggleTheme: () => void;
}

function LandingLayout({ children, theme, onToggleTheme }: ThemeLayoutProps) {
  return (
    <div data-app-theme={theme} className="min-h-screen bg-[#0f1117] text-slate-200 flex flex-col">
      <Navbar theme={theme} onToggleTheme={onToggleTheme} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

function DashboardLayout({ children, theme, onToggleTheme }: PropsWithChildren<{ theme: Theme; onToggleTheme: () => void }>) {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [mobileOpen]);

  return (
    <div data-app-theme={theme} data-app-surface="dashboard" className="min-h-screen w-full bg-[#0f1117] text-slate-200">
      <AppSidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <div className="min-h-screen w-full min-w-0 xl:pl-60">
        <header className="sticky top-0 z-30 flex h-14 min-w-0 items-center border-b border-[#2a2d3a] bg-[#13151f] px-4 sm:px-6 xl:hidden">
          <div className="min-w-0"><LeadFlowBrand size="navbar" /></div>
          <div className="ml-auto flex shrink-0 items-center gap-1">
            <button type="button" onClick={onToggleTheme} className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-300 hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <button type="button" onClick={() => setMobileOpen((open) => !open)} className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-300 hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400" aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={mobileOpen} aria-controls="app-sidebar">
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </header>
        <main className="w-full min-w-0">{children}</main>
      </div>
    </div>
  );
}

export default function App() {
  const [theme, setTheme] = useState<Theme>(() =>
    window.localStorage.getItem('leadflow-dashboard-theme') === 'light' ? 'light' : 'dark',
  );

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    window.localStorage.setItem('leadflow-dashboard-theme', nextTheme);
    setTheme(nextTheme);
  };

  return (
    <BrowserRouter>
      <AuthProvider>
        <FollowUpsProvider>
        <Routes>
          <Route
            path="/terms"
            element={
              <LandingLayout theme={theme} onToggleTheme={toggleTheme}>
                <TermsPage />
              </LandingLayout>
            }
          />

          <Route
            path="/privacy-policy"
            element={
              <LandingLayout theme={theme} onToggleTheme={toggleTheme}>
                <PrivacyPolicyPage />
              </LandingLayout>
            }
          />

          {/* Public Landing Page Route (Redirects to /dashboard if already authenticated) */}
          <Route
            path="/"
            element={
              <PublicOnlyRoute>
                <LandingLayout theme={theme} onToggleTheme={toggleTheme}>
                  <LandingPage />
                </LandingLayout>
              </PublicOnlyRoute>
            }
          />

          {/* Protected Dashboard Route (Redirects to / if unauthenticated) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout theme={theme} onToggleTheme={toggleTheme}>
                  <DashboardPage theme={theme} onToggleTheme={toggleTheme} />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/follow-ups"
            element={
              <ProtectedRoute>
                <DashboardLayout theme={theme} onToggleTheme={toggleTheme}>
                  <FollowUpsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/contact"
            element={
              <ProtectedRoute>
                <DashboardLayout theme={theme} onToggleTheme={toggleTheme}>
                  <ContactPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <DashboardLayout theme={theme} onToggleTheme={toggleTheme}>
                  <SettingsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="*"
            element={
              <LandingLayout theme={theme} onToggleTheme={toggleTheme}>
                <NotFoundPage />
              </LandingLayout>
            }
          />
        </Routes>
        </FollowUpsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
