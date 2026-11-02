import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import emailjs from '@emailjs/browser';
import { ArrowUpRight, LoaderCircle, Send } from 'lucide-react';
import { FaEnvelope, FaGithub, FaGlobe, FaLinkedin } from 'react-icons/fa';

const contactLinks = [
  { label: 'Contact us by email', detail: 'suyalpriyanshu2@gmail.com', subtitle: 'Get in touch', href: 'mailto:suyalpriyanshu2@gmail.com', icon: FaEnvelope, color: 'text-red-300', iconBg: 'bg-red-400/10', external: false },
  { label: 'View portfolio', detail: 'Personal website', subtitle: 'Explore projects and work', href: 'https://portfolio-ten-blond-87.vercel.app', icon: FaGlobe, color: 'text-violet-300', iconBg: 'bg-violet-400/10', external: true },
  { label: 'Connect on LinkedIn', detail: 'LinkedIn profile', subtitle: 'Let\'s connect', href: 'https://www.linkedin.com/in/priyanshu-suyal-5732b224a', icon: FaLinkedin, color: 'text-[#0A66C2]', iconBg: 'bg-[#0A66C2]/15', external: true },
  { label: 'View GitHub profile', detail: 'GitHub profile', subtitle: 'View code and contributions', href: 'https://github.com/Priyanshu12334', icon: FaGithub, color: 'text-slate-100', iconBg: 'bg-white/10', external: true },
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

  return <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
    <header className="mb-8 sm:mb-10">
      <p className="text-sm uppercase tracking-[0.15em] text-indigo-300">We're here to help</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-100">Let's talk</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Questions, feedback, or need a hand with LeadFlow? Send a message or connect directly.</p>
    </header>

    <div className="grid min-w-0 gap-5 lg:grid-cols-[1.08fr_0.92fr] lg:gap-6">
      <section aria-labelledby="contact-owner-title" className="order-2 flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] lg:order-2 lg:self-stretch">
        <div className="border-b border-[var(--color-border)] p-5 sm:p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-indigo-300">LeadFlow owner</p>
          <h2 id="contact-owner-title" className="mt-2 text-base font-semibold text-slate-100">Priyanshu Suyal</h2>
          <p className="mt-0.5 text-xs text-slate-400">Founder of LeadFlow</p>
        </div>
        <div className="flex flex-col gap-1.5 p-3 sm:p-4 lg:flex-1">
          {contactLinks.map(({ label, detail, subtitle, href, icon: Icon, color, iconBg, external }) => <a key={label} href={href} aria-label={`${label}: ${detail}`} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} className="group flex min-h-[58px] min-w-0 cursor-pointer items-center gap-2.5 rounded-lg border border-transparent px-2.5 py-2 text-slate-300 transition-colors duration-150 hover:border-[var(--color-border)] hover:bg-[#0f1117]/60 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)] lg:flex-1 sm:gap-3 sm:px-3">
            <span className={`flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-lg ${iconBg}`}>
              <Icon aria-hidden="true" className={`h-[15px] w-[15px] ${color}`} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-medium leading-5 text-slate-100">{label}</span>
              <span className="block break-all text-[11px] leading-4 text-slate-400 sm:break-normal">{detail} <span className="text-slate-500">· {subtitle}</span></span>
            </span>
            <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-slate-500 transition-colors duration-150 group-hover:text-indigo-300" />
          </a>)}
        </div>
      </section>

      <section aria-labelledby="contact-form-title" className="order-1 min-w-0 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.16)] sm:p-6 lg:order-1">
        <div className="mb-5 flex items-start gap-3">
          <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-300"><Send className="h-[18px] w-[18px]" /></span>
          <div className="min-w-0">
            <h2 id="contact-form-title" className="text-base font-semibold text-slate-100">Send a message</h2>
            <p className="mt-1 text-xs leading-5 text-slate-400">Have a question or feedback? Drop us a message.</p>
          </div>
        </div>
        {missingConfig.length > 0 && <p role="alert" className="mt-4 rounded-md border border-amber-400/30 bg-amber-400/5 px-3 py-2.5 text-xs leading-relaxed text-amber-200">Contact sending is not configured. Add {missingConfig.join(', ')} to the frontend environment and restart the app.</p>}
        <form className="mt-5 space-y-4" onSubmit={handleSubmit} noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-xs font-medium text-slate-300">Name
              <input name="name" type="text" autoComplete="name" required maxLength={120} value={form.name} onChange={handleChange} disabled={sending} className="mt-1.5 w-full rounded-md border border-[#343847] bg-[#0f1117] px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500/40 disabled:opacity-60" />
            </label>
            <label className="block text-xs font-medium text-slate-300">Email
              <input name="email" type="email" autoComplete="email" required maxLength={254} value={form.email} onChange={handleChange} disabled={sending} className="mt-1.5 w-full rounded-md border border-[#343847] bg-[#0f1117] px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500/40 disabled:opacity-60" />
            </label>
          </div>
          <label className="block text-xs font-medium text-slate-300">Subject
            <input name="subject" type="text" required minLength={3} maxLength={160} value={form.subject} onChange={handleChange} disabled={sending} className="mt-1.5 w-full rounded-md border border-[#343847] bg-[#0f1117] px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500/40 disabled:opacity-60" />
          </label>
          <label className="block text-xs font-medium text-slate-300">Message
            <textarea name="message" required minLength={10} maxLength={4000} rows={5} value={form.message} onChange={handleChange} disabled={sending} className="mt-1.5 h-32 min-h-32 w-full resize-none overflow-y-auto rounded-md border border-[#343847] bg-[#0f1117] px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500/40 disabled:opacity-60" />
          </label>
          <button type="submit" disabled={sending || missingConfig.length > 0} className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1d27] disabled:cursor-not-allowed disabled:opacity-60">
            {sending ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Sending…</> : <><Send className="h-4 w-4" /> Send message</>}
          </button>
          {error && <p role="alert" className="rounded-md border border-red-400/20 bg-red-400/5 px-3 py-2.5 text-xs leading-relaxed text-red-200">{error}</p>}
          {success && <p role="status" className="rounded-md border border-emerald-400/20 bg-emerald-400/5 px-3 py-2.5 text-xs leading-relaxed text-emerald-200">{success}</p>}
        </form>
      </section>
    </div>
  </main>;
};
