import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import emailjs from '@emailjs/browser';
import { BriefcaseBusiness, Code2, Globe2, LoaderCircle, Mail, Send } from 'lucide-react';

const contactLinks = [
  { label: 'Contact us by email', detail: 'suyalpriyanshu2@gmail.com', href: 'mailto:suyalpriyanshu2@gmail.com', icon: Mail, external: false },
  { label: 'View portfolio', detail: 'Personal website', href: 'https://portfolio-ten-blond-87.vercel.app', icon: Globe2, external: true },
  { label: 'Connect on LinkedIn', detail: 'LinkedIn profile', href: 'https://www.linkedin.com/in/priyanshu-suyal-5732b224a', icon: BriefcaseBusiness, external: true },
  { label: 'View GitHub profile', detail: 'GitHub profile', href: 'https://github.com/Priyanshu12334', icon: Code2, external: true },
];

export const ContactPage = () => {
  const config = {
    serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID?.trim(),
    templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID?.trim(),
    publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY?.trim(),
  };
  const missingConfig = [
    !config.serviceId && 'VITE_EMAILJS_SERVICE_ID',
    !config.templateId && 'VITE_EMAILJS_TEMPLATE_ID',
    !config.publicKey && 'VITE_EMAILJS_PUBLIC_KEY',
  ].filter((key): key is string => Boolean(key));

  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const sendingRef = useRef(false);

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.currentTarget;
    setForm((current) => ({ ...current, [name]: value }));
    setSuccess('');
    setError('');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sendingRef.current || missingConfig.length > 0) return;

    const cleaned = {
      name: form.name.trim(),
      email: form.email.trim(),
      subject: form.subject.trim(),
      message: form.message.trim(),
    };
    if (!cleaned.name || !cleaned.email || !cleaned.subject || !cleaned.message) {
      setError('Please complete every field.');
      return;
    }
    if (cleaned.name.length > 120 || cleaned.email.length > 254 || cleaned.subject.length < 3 || cleaned.subject.length > 160 || cleaned.message.length < 10 || cleaned.message.length > 4000) {
      setError('Check the field lengths: name up to 120 characters, subject 3–160, and message 10–4000.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleaned.email)) {
      setError('Enter a valid email address.');
      return;
    }

    sendingRef.current = true;
    setSending(true);
    setError('');
    setSuccess('');
    try {
      const response = await emailjs.send(config.serviceId!, config.templateId!, {
        from_name: cleaned.name,
        from_email: cleaned.email,
        subject: cleaned.subject,
        message: cleaned.message,
      }, { publicKey: config.publicKey! });
      if (response.status !== 200) {
        throw new Error('EmailJS did not confirm a successful send.');
      }
      setForm({ name: '', email: '', subject: '', message: '' });
      setSuccess('Your message was sent successfully.');
    } catch {
      setError('EmailJS could not send your message. Check your connection and try again, or contact us using the email link.');
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  };

  return <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
    <div className="mb-6">
      <h1 className="text-xl font-semibold text-slate-100">Contact</h1>
      <p className="mt-1 max-w-2xl text-sm text-slate-500">Reach out with questions, feedback, or support requests. You can contact the LeadFlow owner directly using the links below.</p>
    </div>

    <div className="grid min-w-0 gap-4 lg:grid-cols-[0.85fr_1.15fr]">
      <section className="rounded-xl border border-[#2a2d3a] bg-[#1a1d27] p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-indigo-300">LeadFlow owner</p>
        <h2 className="mt-2 text-lg font-semibold text-slate-100">Priyanshu Suyal</h2>
        <div className="mt-5 space-y-2">
          {contactLinks.map(({ label, detail, href, icon: Icon, external }) => <a key={label} href={href} aria-label={`${label}: ${detail}`} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} className="flex min-h-12 min-w-0 cursor-pointer items-center gap-3 rounded-lg border border-transparent px-3 text-sm text-slate-300 transition-colors hover:border-[#2a2d3a] hover:bg-[#0f1117] hover:text-indigo-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1d27]">
            <Icon aria-hidden="true" className="h-[18px] w-[18px] shrink-0 text-indigo-300" />
            <span className="min-w-0 flex-1">{label}</span>
            <span className="max-w-[48%] break-all text-right text-[11px] leading-4 text-slate-500 sm:break-normal">{detail}</span>
          </a>)}
        </div>
      </section>

      <section className="rounded-xl border border-[#2a2d3a] bg-[#1a1d27] p-5 sm:p-6">
        <h2 className="text-base font-semibold text-slate-100">Send a message</h2>
        <p className="mt-1 text-xs text-slate-500">Send a question, feedback, or support request directly to the LeadFlow owner.</p>
        {missingConfig.length > 0 && <p role="alert" className="mt-4 rounded-md border border-amber-400/30 bg-amber-400/5 px-3 py-2.5 text-xs leading-relaxed text-amber-200">Contact sending is not configured. Add {missingConfig.join(', ')} to the frontend environment and restart the app.</p>}
        <form className="mt-5 space-y-4" onSubmit={handleSubmit} noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-xs font-medium text-slate-300">Name
              <input name="name" type="text" autoComplete="name" required maxLength={120} value={form.name} onChange={handleChange} disabled={sending} className="mt-1.5 w-full rounded-md border border-[#343847] bg-[#0f1117] px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-indigo-500 disabled:opacity-60" />
            </label>
            <label className="block text-xs font-medium text-slate-300">Email
              <input name="email" type="email" autoComplete="email" required maxLength={254} value={form.email} onChange={handleChange} disabled={sending} className="mt-1.5 w-full rounded-md border border-[#343847] bg-[#0f1117] px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-indigo-500 disabled:opacity-60" />
            </label>
          </div>
          <label className="block text-xs font-medium text-slate-300">Subject
            <input name="subject" type="text" required minLength={3} maxLength={160} value={form.subject} onChange={handleChange} disabled={sending} className="mt-1.5 w-full rounded-md border border-[#343847] bg-[#0f1117] px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-indigo-500 disabled:opacity-60" />
          </label>
          <label className="block text-xs font-medium text-slate-300">Message
            <textarea name="message" required minLength={10} maxLength={4000} rows={5} value={form.message} onChange={handleChange} disabled={sending} className="mt-1.5 h-32 min-h-32 w-full resize-none overflow-y-auto rounded-md border border-[#343847] bg-[#0f1117] px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-indigo-500 disabled:opacity-60" />
          </label>
          <button type="submit" disabled={sending || missingConfig.length > 0} className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1d27] disabled:cursor-not-allowed disabled:opacity-60">
            {sending ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Sending…</> : <><Send className="h-4 w-4" /> Send message</>}
          </button>
          {error && <p role="alert" className="rounded-md border border-red-400/20 bg-red-400/5 px-3 py-2.5 text-xs leading-relaxed text-red-200">{error}</p>}
          {success && <p role="status" className="rounded-md border border-emerald-400/20 bg-emerald-400/5 px-3 py-2.5 text-xs leading-relaxed text-emerald-200">{success}</p>}
        </form>
      </section>
    </div>
  </div>;
};
