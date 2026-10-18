import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { GoogleIcon } from '../common/GoogleIcon';

export const CtaSection = () => {
  const { isAuthenticated, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  return (
    <section className="py-16 bg-[#13151f] border-b border-[#2a2d3a]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-3xl font-bold text-slate-100 tracking-tight mb-3">
          Ready to automate your lead follow-up?
        </h2>
        <p className="landing-secondary-text text-sm text-slate-50 mb-7 leading-relaxed">
          Join founders, SDRs, and agencies saving hours every week with AI-generated Gmail drafts.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-5">
          {isAuthenticated ? (
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-6 py-2.5 rounded-md transition-colors cursor-pointer"
            >
              Go to Dashboard
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={loginWithGoogle}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-6 py-2.5 rounded-md transition-colors cursor-pointer"
            >
              <GoogleIcon />
              Connect with Google
            </button>
          )}
        </div>

        <p className="flex items-center font-semibold justify-center text-sm text-slate-600">
          No credit card required · 20 free drafts included every month
        </p>
      </div>
    </section>
  );
}
