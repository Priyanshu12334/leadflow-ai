import React from 'react';
import { FileSpreadsheet, Sparkles, Mail, Zap, ShieldCheck, BarChart3 } from 'lucide-react';

const features = [
  {
    icon: <FileSpreadsheet className="w-5 h-5 text-indigo-400" />,
    title: 'Google Sheet Sync',
    description: 'Connect any Google Spreadsheet by ID. Reads lead names, emails, and notes instantly.',
  },
  {
    icon: <Sparkles className="w-5 h-5 text-indigo-400" />,
    title: 'Gemini AI Drafts',
    description: "Uses Google's Gemini AI to craft unique, context-aware emails for each prospect.",
  },
  {
    icon: <Mail className="w-5 h-5 text-indigo-400" />,
    title: 'Gmail Integration',
    description: 'Drafts go directly into your Gmail Drafts folder. Review, edit, or send with one click.',
  },
  {
    icon: <Zap className="w-5 h-5 text-indigo-400" />,
    title: 'One-Click Processing',
    description: 'Process dozens of leads in a single click with status updates written back to the sheet.',
  },
  {
    icon: <ShieldCheck className="w-5 h-5 text-indigo-400" />,
    title: 'Secure OAuth',
    description: 'Industry-standard Google OAuth 2.0 with AES-256 encrypted refresh tokens.',
  },
  {
    icon: <BarChart3 className="w-5 h-5 text-indigo-400" />,
    title: 'Usage Tracking',
    description: 'Built-in quota management tracks your monthly draft usage and prevents overages.',
  },
];

export const Features = () => {
  return (
    <section id="features" className="py-16 bg-[#13151f] border-b border-[#2a2d3a]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-sm font-semibold text-indigo-400 uppercase tracking-wide">Features</span>
          <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">
            Everything you need to automate lead follow-ups
          </h2>
          <p className="mt-3 text-sm text-slate-500 leading-relaxed">
            From spreadsheet to personalized draft in seconds — no manual work required.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((item, idx) => (
            <div
              key={idx}
              className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-5 hover:border-indigo-500/40 transition-colors"
            >
              <div className="w-9 h-9 bg-indigo-500/10 border border-indigo-500/20 rounded-md flex items-center justify-center mb-3">
                {item.icon}
              </div>
              <h3 className="text-sm font-semibold text-slate-200 mb-1">{item.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
