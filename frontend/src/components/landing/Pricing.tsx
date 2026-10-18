import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Check } from 'lucide-react';

const plans = [
  {
    name: 'Starter',
    price: { monthly: '$0', yearly: '$0' },
    period: 'forever',
    description: 'For testing and early-stage exploration.',
    drafts: '20 drafts / month',
    highlighted: false,
    cta: 'Get started free',
    features: [
      '20 Gemini AI drafts per month',
      '1 Google Sheet connection',
      'Gmail Drafts sync',
      'Basic rate limiting',
      'Community support',
    ],
  },
  {
    name: 'Pro',
    price: { monthly: '$29', yearly: '$24' },
    period: '/ month',
    description: 'For active SDRs and sales teams.',
    drafts: '1,000 drafts / month',
    highlighted: true,
    cta: 'Start 14-day trial',
    features: [
      '1,000 Gemini AI drafts per month',
      'Unlimited Sheet connections',
      'Priority Gemini response engine',
      'Custom prompt persona tuning',
      'Automated retry & recovery',
      'Email support',
    ],
  },
  {
    name: 'Agency',
    price: { monthly: '$79', yearly: '$65' },
    period: '/ month',
    description: 'For agencies and high-volume teams.',
    drafts: '5,000+ drafts / month',
    highlighted: false,
    cta: 'Contact sales',
    features: [
      '5,000+ Gemini AI drafts per month',
      'Multi-account Google OAuth',
      'Custom field mapping rules',
      'Dedicated API throughput',
      'SLA & priority 24/7 support',
      'Custom onboarding',
    ],
  },
];

export const Pricing = () => {
  const { loginWithGoogle } = useAuth();
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');

  return (
    <section id="pricing" className="py-16 bg-[#13151f] border-b border-[#2a2d3a]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-sm font-semibold text-indigo-400 uppercase tracking-wide">Pricing</span>
          <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">
            Simple, transparent pricing
          </h2>
          <p className="mt-3 text-sm text-slate-500">
            Start free with 20 drafts included every month. Upgrade as your pipeline grows.
          </p>

          {/* Billing toggle */}
          <div className="mt-6 inline-flex items-center gap-1 p-1 bg-[#1a1d27] border border-[#2a2d3a] rounded-md">
            <button
              onClick={() => setBilling('monthly')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
                billing === 'monthly'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling('yearly')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors flex items-center gap-1.5 cursor-pointer ${
                billing === 'yearly'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              Yearly
              <span className="text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {plans.map((plan, idx) => (
            <div
              key={idx}
              className={`bg-[#1a1d27] rounded-lg border flex flex-col relative ${
                plan.highlighted
                  ? 'border-indigo-500/60'
                  : 'border-[#2a2d3a]'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-indigo-600 text-white text-[10px] font-semibold px-3 py-1 rounded-full uppercase tracking-wide">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="p-6 flex-1">
                <h3 className="text-sm font-semibold text-slate-200">{plan.name}</h3>
                <p className="text-xs text-slate-500 mt-1 mb-4">{plan.description}</p>

                <div className="mb-4">
                  <span className="text-3xl font-bold text-slate-100">{plan.price[billing]}</span>
                  <span className="text-sm text-slate-500 ml-1">{plan.period}</span>
                </div>

                <div className="text-xs font-medium text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded px-3 py-2 mb-5">
                  {plan.drafts}
                </div>

                <ul className="space-y-2">
                  {plan.features.map((feat, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-2 text-sm text-slate-400">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="px-6 pb-6">
                <button
                  onClick={loginWithGoogle}
                  className={`w-full py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                    plan.highlighted
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                      : 'bg-[#0f1117] hover:bg-[#1e2130] text-slate-300 border border-[#2a2d3a] hover:border-slate-500'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
