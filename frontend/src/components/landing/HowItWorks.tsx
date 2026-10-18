import React from 'react';
import { Link2, Cpu, CheckCheck } from 'lucide-react';

const steps = [
  {
    num: '1',
    icon: <Link2 className="w-5 h-5 text-indigo-400" />,
    title: 'Connect Google & paste Sheet ID',
    desc: 'Sign in with Google OAuth and enter your Google Spreadsheet ID. LeadFlow reads your lead rows (Name, Email, Context) instantly.',
  },
  {
    num: '2',
    icon: <Cpu className="w-5 h-5 text-indigo-400" />,
    title: 'Gemini AI generates drafts',
    desc: "Our Gemini AI engine reads each prospect's details and writes a personalized, human-sounding follow-up email in seconds.",
  },
  {
    num: '3',
    icon: <CheckCheck className="w-5 h-5 text-indigo-400" />,
    title: 'Review & send in Gmail',
    desc: 'Drafts appear automatically in your Gmail Drafts folder. Review, make quick tweaks if needed, and hit send when ready.',
  },
];

export const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-16 bg-[#0f1117] border-b border-[#2a2d3a]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-sm font-semibold text-indigo-400 uppercase tracking-wide">How It Works</span>
          <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">
            Up and running in 3 steps
          </h2>
          <p className="mt-3 text-sm text-slate-500">
            From raw spreadsheet rows to ready-to-send Gmail drafts in under 60 seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, idx) => (
            <div key={idx} className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-6 hover:border-indigo-500/40 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {step.num}
                </div>
                <div className="w-8 h-8 bg-[#0f1117] border border-[#2a2d3a] rounded-md flex items-center justify-center">
                  {step.icon}
                </div>
              </div>
              <h3 className="text-sm font-semibold text-slate-200 mb-2">{step.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
