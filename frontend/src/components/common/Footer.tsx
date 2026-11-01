import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { LeadFlowBrand } from './LeadFlowBrand';

export const Footer = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleBrand = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/');
    }
  };

  return (
    <footer className="bg-[#0f1117] border-b border-[#2a2d3a] py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <button onClick={handleBrand} className="flex items-center mb-3 cursor-pointer" aria-label="LeadFlow home">
              <LeadFlowBrand size="footer" />
            </button>
            <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
              AI-powered lead follow-up. Connect your Google Sheet, generate personalized Gmail drafts, and close more deals.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wide mb-3">Product</h4>
            <ul className="space-y-2">
              <li><Link to="/#features" className="text-sm text-slate-500 hover:text-slate-200 transition-colors cursor-pointer">Features</Link></li>
              <li><Link to="/#how-it-works" className="text-sm text-slate-500 hover:text-slate-200 transition-colors cursor-pointer">How It Works</Link></li>
              <li><Link to="/#pricing" className="text-sm text-slate-500 hover:text-slate-200 transition-colors cursor-pointer">Pricing</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wide mb-3">Legal</h4>
            <ul className="space-y-2">
              <li><Link to="/privacy-policy" className="text-sm text-slate-500 hover:text-slate-200 transition-colors cursor-pointer">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-sm text-slate-500 hover:text-slate-200 transition-colors cursor-pointer">Terms of Service</Link></li>
            </ul>
          </div>

          {/* Creator */}
          <div className="md:col-span-2">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wide mb-3">Connect</h4>
            <p className="text-sm text-slate-500 leading-relaxed">
              LeadFlow — Engineered by Priyanshu Suyal
            </p>
            <div className="flex items-center gap-4 mt-3">
              <a
                href="mailto:suyalpriyanshu2@gmail.com"
                aria-label="Email Priyanshu Suyal"
                className="text-slate-500 hover:text-slate-200 transition-colors"
              >
                <Mail className="w-4 h-4" />
              </a>
              <a
                href="https://github.com/Priyanshu12334"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Priyanshu Suyal on GitHub"
                className="text-slate-500 hover:text-slate-200 transition-colors"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                  <path d="M12 .8a11.2 11.2 0 0 0-3.54 21.83c.56.1.77-.24.77-.54v-2.1c-3.13.68-3.79-1.33-3.79-1.33-.51-1.3-1.25-1.65-1.25-1.65-1.02-.7.08-.69.08-.69 1.13.08 1.73 1.16 1.73 1.16 1 .1.77 2.3 3.18 1.63.1-.73.39-1.22.7-1.5-2.5-.28-5.12-1.25-5.12-5.56 0-1.23.44-2.23 1.16-3.02-.12-.29-.5-1.43.11-2.98 0 0 .95-.3 3.08 1.15a10.7 10.7 0 0 1 5.6 0c2.14-1.45 3.08-1.15 3.08-1.15.62 1.55.23 2.69.12 2.98.72.79 1.15 1.79 1.15 3.02 0 4.32-2.62 5.27-5.12 5.55.4.35.75 1.03.75 2.08v3.09c0 .3.2.65.77.54A11.2 11.2 0 0 0 12 .8Z" />
                </svg>
              </a>
              <a
                href="https://www.linkedin.com/in/priyanshu-suyal-5732b224a"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Priyanshu Suyal on LinkedIn"
                className="text-slate-500 hover:text-slate-200 transition-colors"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                  <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.13 1.44-2.13 2.94v5.67H9.35V9h3.42v1.56h.05a3.75 3.75 0 0 1 3.37-1.85c3.6 0 4.27 2.37 4.27 5.45v6.29ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12Zm1.78 13.02H3.55V9h3.57v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0Z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-[#2a2d3a] pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
          <p>© {new Date().getFullYear()} LeadFlow. All rights reserved.</p>
          <p>Powered by Gemini AI · Google OAuth</p>
        </div>
      </div>
    </footer>
  );
};
