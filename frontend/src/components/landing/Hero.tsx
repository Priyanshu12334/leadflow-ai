import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AlertTriangle, ArrowRight, BrainCircuit, CheckCircle2, RefreshCw, ShieldCheck } from 'lucide-react';
import { GoogleIcon } from '../common/GoogleIcon';
import { getErrorMessage } from '../../types';

export const Hero = () => {
  const { user, isAuthenticated, loginWithGoogle, loginWithDemo } = useAuth();
  const navigate = useNavigate();
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoError, setDemoError] = useState<string | null>(null);

  const handleTryDemo = async (): Promise<void> => {
    setDemoLoading(true);
    setDemoError(null);
    try {
      await loginWithDemo();
    } catch (error: unknown) {
      setDemoError(getErrorMessage(error) || 'Could not start demo mode. Please try again.');
      setDemoLoading(false);
    }
  };

  return (
    <section className="bg-[#0f1117] border-b border-[#2a2d3a]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center">
          

          {/* Headline */}
          <h1 className="text-[26px] sm:text-5xl font-bold text-slate-100 leading-[1.15] sm:leading-tight tracking-tight mb-4">
            Turn Google Sheet leads into{' '}
            <span className="text-indigo-400">Gmail drafts</span>{' '}
            automatically
          </h1>

          {/* Subheadline */}
          <p className="text-base sm:text-sm text-slate-400 max-w-3xl mx-auto mb-8 leading-relaxed">
           Turn your leads into personalized follow-up emails with AI — ready to review and send.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
            {isAuthenticated ? (
              <button
                onClick={() => navigate(user?.isDemo ? '/demo' : '/dashboard')}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-6 py-2.5 rounded-md transition-colors cursor-pointer"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  onClick={loginWithGoogle}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-6 py-2.5 rounded-md transition-colors cursor-pointer"
                >
                  <GoogleIcon />
                  Connect with Google
                </button>
                <button
                  type="button"
                  onClick={() => void handleTryDemo()}
                  disabled={demoLoading}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 border border-[#2a2d3a] hover:border-indigo-400/50 hover:bg-white/5 text-slate-200 text-sm font-medium px-6 py-2.5 rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer"
                >
                  {demoLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                  {demoLoading ? 'Starting demo…' : 'Try Demo'}
                </button>
              </>
            )}
            <a
              href="#how-it-works"
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 text-sm text-slate-300 hover:text-slate-100 border border-[#2a2d3a] hover:border-[#2a2d3a] px-6 py-2.5 rounded-md transition-colors bg-transparent cursor-pointer"
            >
              See how it works
            </a>
          </div>
          {demoError && (
            <p role="alert" className="mb-5 flex items-center justify-center gap-1.5 text-xs text-red-300">
              <AlertTriangle className="h-3.5 w-3.5" />
              {demoError}
            </p>
          )}

          {/* Trust row */}
          <div className="flex flex-wrap items-center justify-center gap-5 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              20 free drafts/month
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              Secure Google OAuth
            </span>
            <span className="flex items-center gap-1.5">
              <BrainCircuit className="w-3.5 h-3.5 text-amber-400" />
              AI-Powered Follow-ups
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
