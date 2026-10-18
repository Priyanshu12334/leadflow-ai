import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ArrowRight, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';
import { GoogleIcon } from '../common/GoogleIcon';

export const Hero = () => {
  const { isAuthenticated, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

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
          <p className="text-base sm:text-lg text-slate-400 max-w-3xl mx-auto mb-8 leading-relaxed">
           Turn your leads into personalized follow-up emails with AI — ready to review and send.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
            {isAuthenticated ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-6 py-2.5 rounded-md transition-colors cursor-pointer"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={loginWithGoogle}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-6 py-2.5 rounded-md transition-colors cursor-pointer"
              >
                <GoogleIcon />
                Connect with Google — it's free
              </button>
            )}
            <a
              href="#how-it-works"
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 text-sm text-slate-300 hover:text-slate-100 border border-[#2a2d3a] hover:border-[#2a2d3a] px-6 py-2.5 rounded-md transition-colors bg-transparent cursor-pointer"
            >
              See how it works
            </a>
          </div>

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
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              No code required
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
