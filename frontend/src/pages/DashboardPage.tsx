import React, { useEffect, useState } from 'react';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { UsageMetricsCard } from '../components/dashboard/UsageMetricsCard';
import { GoogleStatusCard } from '../components/dashboard/GoogleStatusCard';
import { SpreadsheetConfigCard } from '../components/dashboard/SpreadsheetConfigCard';
import { ProcessLeadsCard } from '../components/dashboard/ProcessLeadsCard';
import { ProcessingResultsPanel } from '../components/dashboard/ProcessingResultsPanel';
import type { LeadProcessingResult } from '../types';
import { OAuthFeedback } from '../components/common/OAuthFeedback';
import { useAuth } from '../context/AuthContext';

interface DashboardPageProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const DashboardPage = ({ theme, onToggleTheme }: DashboardPageProps) => {
  const { user } = useAuth();
  const [lastResults, setLastResults] = useState<LeadProcessingResult | null>(null);
  const [hasProcessed, setHasProcessed] = useState(false);

  useEffect(() => {
    if (!hasProcessed) return;
    document.getElementById('processing-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [hasProcessed]);

  const handleProcessingComplete = (results: LeadProcessingResult) => {
    setLastResults(results);
    if (user?.isDemo) setHasProcessed(true);
  };

  return (
    <div className="dashboard-page max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <OAuthFeedback />
      {/* Page Header */}
      <div className="mb-6">
        <DashboardHeader theme={theme} onToggleTheme={onToggleTheme} />
      </div>

      {/* Status row: Google connection + Draft quota */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <GoogleStatusCard />
        <UsageMetricsCard />
      </div>

      {/* Spreadsheet configuration */}
      <div className="mb-4">
        <SpreadsheetConfigCard />
      </div>

      {/* Process leads */}
      <div className="mb-4">
        <div id="process-leads">
          <ProcessLeadsCard onProcessingComplete={handleProcessingComplete} />
        </div>
      </div>

      {lastResults && (!user?.isDemo || hasProcessed) && (
        <div id="processing-results" className="mb-4 scroll-mt-20">
          <ProcessingResultsPanel
            results={lastResults}
          />
        </div>
      )}
    </div>
  );
};
