import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { PublicOnlyRoute } from './components/common/PublicOnlyRoute';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
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

function DashboardLayout({ children, theme, onToggleTheme }: ThemeLayoutProps) {
  return (
    <div data-app-theme={theme} data-app-surface="dashboard" className="min-h-screen bg-[#0f1117] text-slate-200 flex flex-col">
      <Navbar theme={theme} onToggleTheme={onToggleTheme} />
      <main className="flex-1">{children}</main>
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
        <Routes>
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
                  <DashboardPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Fallback Catch-All Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
