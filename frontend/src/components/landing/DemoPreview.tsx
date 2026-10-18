import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, RefreshCw, Mail, Check, Copy, ArrowRight } from 'lucide-react';

interface SampleLead {
  name: string;
  company: string;
  email: string;
  context: string;
  subject: string;
  body: string;
}

interface EmailDraft {
  subject: string;
  body: string;
}

export const DemoPreview = () => {
  const { isAuthenticated, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [selectedLead, setSelectedLead] = useState<Omit<SampleLead, 'subject' | 'body'>>({
    name: "Marcus Vance",
    company: "Apex Sales Tech",
    email: "marcus@apextech.com",
    context: "Looking to automate follow-up drafts for 50 SDRs to increase reply rates.",
  });

  const [generating, setGenerating] = useState(false);
  const [generatedDraft, setGeneratedDraft] = useState<EmailDraft>({
    subject: "Re: Scaling SDR outreach at Apex Sales Tech with AI",
    body: `Hi Marcus,\n\nI noticed Apex Sales Tech is scaling cold outreach for 50 SDRs! Managing follow-ups manually for that volume often causes lost deals and high SDR fatigue.\n\nOur Gemini AI engine integrates directly with your Google Sheets to draft personalized Gmail follow-ups in seconds—giving your team 10+ hours back per week while boosting response rates.\n\nWould you be open to a 10-min demo this Thursday?\n\nBest regards,\nYour Sales Team`,
  });

  const [copied, setCopied] = useState(false);

  const sampleLeads: SampleLead[] = [
    {
      name: "Marcus Vance",
      company: "Apex Sales Tech",
      email: "marcus@apextech.com",
      context: "Looking to automate follow-up drafts for 50 SDRs to increase reply rates.",
      subject: "Re: Scaling SDR outreach at Apex Sales Tech with AI",
      body: `Hi Marcus,\n\nI noticed Apex Sales Tech is scaling cold outreach for 50 SDRs! Managing follow-ups manually for that volume often causes lost deals and high SDR fatigue.\n\nOur Gemini AI engine integrates directly with your Google Sheets to draft personalized Gmail follow-ups in seconds—giving your team 10+ hours back per week while boosting response rates.\n\nWould you be open to a 10-min demo this Thursday?\n\nBest regards,\nYour Sales Team`,
    },
    {
      name: "Elena Rostova",
      company: "CloudScale Systems",
      email: "elena@cloudscale.io",
      context: "Requested pricing for custom agency plan with 5,000 monthly drafts.",
      subject: "Custom Agency Plan & Enterprise Demo for CloudScale Systems",
      body: `Hi Elena,\n\nThanks for reaching out about CloudScale Systems! For agency workloads requiring 5,000+ monthly AI email drafts, our Scale tier includes dedicated throughput, priority Gemini token allocation, and custom sheet mapping.\n\nI've attached our agency overview. Let me know if 2 PM tomorrow works for a quick walkthrough.\n\nCheers,\nLeadFlow Support`,
    },
    {
      name: "David Kim",
      company: "GrowthStack Marketing",
      email: "david@growthstack.co",
      context: "Inquired about Google Sheet integration security and OAuth scopes.",
      subject: "Quick note on LeadFlow AI OAuth & Data Security for GrowthStack",
      body: `Hi David,\n\nThanks for asking about our security model! LeadFlow AI uses official Google OAuth 2.0 with minimal required scopes (Gmail Drafts & Sheets read/write). Your credentials are stored using AES-256 encryption, and we never read existing inbox messages.\n\nWould love to set you up with our 20 free trial drafts to test the integration!\n\nBest,\nLeadFlow Security Team`,
    },
  ];

  const handleSelectLead = (lead: SampleLead): void => {
    setSelectedLead(lead);
    setGenerating(true);
    setTimeout(() => {
      setGeneratedDraft({ subject: lead.subject, body: lead.body });
      setGenerating(false);
    }, 600);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`Subject: ${generatedDraft.subject}\n\n${generatedDraft.body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      loginWithGoogle();
    }
  };

  return (
    <section id="demo" className="py-20 relative bg-slate-950 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-400">
            <Sparkles className="w-3.5 h-3.5" /> Live Interactive Playground
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold text-slate-100 tracking-tight">
            See how Gemini AI drafts personalized emails
          </h2>
          <p className="text-slate-400 text-base sm:text-lg">
            Select a sample prospect lead to test how our AI turns spreadsheet data into personalized outreach.
          </p>
        </div>

        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Column: Sample Lead Selector */}
          <div className="lg:col-span-5 glass-panel rounded-2xl p-6 space-y-4 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center justify-between">
                <span>Select Sample Lead Row</span>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded">3 Test Presets</span>
              </h3>

              <div className="space-y-3">
                {sampleLeads.map((lead, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectLead(lead)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all text-xs flex flex-col gap-1 cursor-pointer ${
                      selectedLead.email === lead.email
                        ? 'bg-indigo-600/15 border-indigo-500/60'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-slate-200">
                      <span>{lead.name}</span>
                      <span className="text-indigo-400 text-[10px]">{lead.company}</span>
                    </div>
                    <span className="text-slate-400 text-[11px]">{lead.email}</span>
                    <p className="text-slate-400 text-[11px] line-clamp-1 italic mt-1">"{lead.context}"</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <button
                onClick={handleGetStarted}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                Start Generating For Real Leads
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Right Column: Simulated AI Draft Preview */}
          <div className="lg:col-span-7 glass-panel rounded-2xl p-6 flex flex-col justify-between space-y-4 border-indigo-500/30">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-100">Gmail Draft Preview</h4>
                    <span className="text-[11px] text-slate-400">To: {selectedLead.email}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {generating ? (
                <div className="py-16 flex flex-col items-center justify-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
                  <p className="text-sm text-indigo-300 font-medium">Gemini 2.5 analyzing context & drafting email...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-xs">
                    <span className="text-slate-400 font-semibold mr-2">Subject:</span>
                    <span className="text-slate-100 font-medium">{generatedDraft.subject}</span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-300 whitespace-pre-wrap leading-relaxed font-sans min-h-[180px]">
                    {generatedDraft.body}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <Sparkles className="w-3.5 h-3.5" /> High Confidence AI Draft
              </span>
              <span>Ready for Gmail Sync</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
