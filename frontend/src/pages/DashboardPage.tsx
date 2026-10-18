import React, { useState } from 'react';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { UsageMetricsCard } from '../components/dashboard/UsageMetricsCard';
import { GoogleStatusCard } from '../components/dashboard/GoogleStatusCard';
import { SpreadsheetConfigCard } from '../components/dashboard/SpreadsheetConfigCard';
import { ProcessLeadsCard } from '../components/dashboard/ProcessLeadsCard';
import { ProcessingResultsPanel } from '../components/dashboard/ProcessingResultsPanel';
import type { LeadProcessingResult } from '../types';
import { OAuthFeedback } from '../components/common/OAuthFeedback';

export const DashboardPage = () => {
  const [lastResults, setLastResults] = useState<LeadProcessingResult | null>(null);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <OAuthFeedback />
      {/* Page Header */}
      <div className="mb-6">
        <DashboardHeader />
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
        <ProcessLeadsCard onProcessingComplete={(results) => setLastResults(results)} />
      </div>

      {/* Results panel (shown after a processing run) */}
      {lastResults && (
        <div className="mb-4">
          <ProcessingResultsPanel
            results={lastResults}
            onClear={() => setLastResults(null)}
          />
        </div>
      )}
    </div>
  );
};
