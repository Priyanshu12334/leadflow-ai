import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    q: 'Does LeadFlow automatically send emails from my Gmail?',
    a: 'No. LeadFlow creates drafts in your Gmail Drafts folder only. It never sends emails without your explicit approval. You review every draft before sending.',
  },
  {
    q: 'How does the Google Sheet integration work?',
    a: 'Copy your Google Spreadsheet ID from the browser URL bar and paste it in your dashboard settings. Your sheet needs columns for Name, Email, and Context/Notes. LeadFlow reads unprocessed rows and updates their status to "Draft Created" after processing.',
  },
  {
    q: 'Is my Google account secure?',
    a: 'Yes. We use standard Google OAuth 2.0. We only request permission to manage Gmail Drafts and read/write the spreadsheets you configure. Refresh tokens are encrypted using AES-256.',
  },
  {
    q: 'What happens when I exceed my monthly quota?',
    a: 'Processing safely pauses until your next monthly cycle resets or you upgrade your plan. Your counter resets at the start of each billing cycle.',
  },
  {
    q: 'Can I process multiple sheets?',
    a: 'Yes. You can configure any Spreadsheet ID and sheet tab name (e.g. "Sheet1", "Leads_Q4") directly in your dashboard at any time.',
  },
];

export const FAQ = () => {
  const [openIdx, setOpenIdx] = useState(-1);

  return (
    <section className="py-16 bg-[#0f1117] border-b border-[#2a2d3a]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="text-sm font-semibold text-indigo-400 uppercase tracking-wide">FAQ</span>
          <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">
            Frequently asked questions
          </h2>
        </div>

        <div className="space-y-2">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => setOpenIdx(isOpen ? -1 : idx)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 text-sm font-medium text-slate-200 hover:bg-[#1e2130] transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-500 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 text-sm text-slate-500 leading-relaxed border-t border-[#2a2d3a]">
                    <div className="pt-3">{faq.a}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
