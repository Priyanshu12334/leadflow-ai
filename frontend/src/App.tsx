import React, { useEffect, useRef, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Menu, Moon, Sun } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FollowUpsProvider } from './context/FollowUpsContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { DemoRoute } from './components/common/DemoRoute';
import { PublicOnlyRoute } from './components/common/PublicOnlyRoute';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { RouteScrollManager } from './components/common/RouteScrollManager';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { LeadsPage } from './pages/FollowUpsPage';
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

function isDemoPath(pathname: string): boolean {
  return pathname === '/demo' || pathname.startsWith('/demo/');
}

function DemoHistoryGuard() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const replacedEntry = useRef(false);
  const restoringFromBack = useRef(false);

  useEffect(() => {
    if (!user?.isDemo || !isDemoPath(location.pathname) || replacedEntry.current) return;
    window.history.replaceState(window.history.state, '', window.location.href);
    replacedEntry.current = true;
  }, [location.pathname, user?.isDemo]);

  useEffect(() => {
    if (!user?.isDemo) return undefined;
    const keepDemoOpen = () => {
      if (!isDemoPath(window.location.pathname)) {
        restoringFromBack.current = true;
        navigate('/demo');
      }
    };
    window.addEventListener('popstate', keepDemoOpen, true);
    return () => window.removeEventListener('popstate', keepDemoOpen, true);
  }, [navigate, user?.isDemo]);

  useEffect(() => {
    if (!user?.isDemo) return;
    if (isDemoPath(location.pathname)) {
      restoringFromBack.current = false;
      return;
    }
    if (!restoringFromBack.current) navigate('/demo', { replace: true });
  }, [location.pathname, navigate, user?.isDemo]);

  return null;
}

interface ThemeLayoutProps extends PropsWithChildren {
  theme: Theme;
  onToggleTheme: () => void;
}

function LandingLayout({ children, theme, onToggleTheme }: ThemeLayoutProps) {
  return (
    <div data-app-theme={theme} data-app-surface="landing" className="min-h-screen bg-[#0f1117] text-slate-200 flex flex-col">
      <Navbar theme={theme} onToggleTheme={onToggleTheme} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

function DashboardLayout({ children, theme, onToggleTheme }: PropsWithChildren<{ theme: Theme; onToggleTheme: () => void }>) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();

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
            <button type="button" onClick={onToggleTheme} className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <button type="button" onClick={() => setMobileOpen((open) => !open)} className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-300 hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400" aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={mobileOpen} aria-controls="app-sidebar">
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </header>
        {user?.isDemo && (
          <div className="flex justify-end border-b border-indigo-400/20 bg-indigo-500/5 px-4 py-2 sm:px-6">
            <button type="button" onClick={() => { void logout(); }} className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-md border-0 bg-red-500 px-4 text-sm font-medium text-white transition-colors hover:bg-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400">
              <LogOut className="h-4 w-4" />
              Logout from demo
            </button>
          </div>
        )}
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
      <RouteScrollManager />
      <AuthProvider>
        <DemoHistoryGuard />
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

          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <LandingLayout theme={theme} onToggleTheme={toggleTheme}>
                  <LandingPage />
                </LandingLayout>
              </PublicOnlyRoute>
            }
          />

          <Route
            path="/demo"
            element={
              <DemoRoute>
                <DashboardLayout theme={theme} onToggleTheme={toggleTheme}>
                  <DashboardPage theme={theme} onToggleTheme={toggleTheme} />
                </DashboardLayout>
              </DemoRoute>
            }
          />

          <Route
            path="/demo/leads"
            element={
              <DemoRoute>
                <DashboardLayout theme={theme} onToggleTheme={toggleTheme}>
                  <LeadsPage />
                </DashboardLayout>
              </DemoRoute>
            }
          />

          <Route
            path="/demo/settings"
            element={
              <DemoRoute>
                <DashboardLayout theme={theme} onToggleTheme={toggleTheme}>
                  <SettingsPage />
                </DashboardLayout>
              </DemoRoute>
            }
          />

          <Route path="/demo/*" element={<DemoRoute><Navigate to="/demo" replace /></DemoRoute>} />

          {/* Protected Dashboard Route */}
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
            path="/leads"
            element={
              <ProtectedRoute>
                <DashboardLayout theme={theme} onToggleTheme={toggleTheme}>
                  <LeadsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route path="/follow-ups" element={<Navigate to="/leads" replace />} />

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
