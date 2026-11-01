const sections = [
  {
    title: '1. About LeadFlow',
    paragraphs: [
      'LeadFlow is operated by Priyanshu Suyal ("we", "us", or "our"). It helps you read lead information from a Google Sheet, generate suggested follow-up email content with AI, and create Gmail drafts for your review.',
      'These Terms of Service ("Terms") govern your access to and use of LeadFlow. By using the service, you agree to these Terms. If you do not agree, do not use LeadFlow.',
    ],
  },
  {
    title: '2. Eligibility and your account',
    paragraphs: [
      'You must be legally able to enter into a binding agreement to use LeadFlow. You are responsible for the accuracy of the account information you provide, keeping your sign-in session secure, and all activity conducted through your account. Notify us promptly if you believe your account has been accessed without permission.',
      'Sign-in uses Google OAuth. You must follow Google’s terms and keep control of the Google account you connect. We may suspend access where reasonably necessary to protect users, the service, or third parties, or to comply with law.',
    ],
  },
  {
    title: '3. Google access and email drafts',
    paragraphs: [
      'When you connect Google, you authorize LeadFlow to use the Google Sheets and Gmail permissions shown in Google’s consent screen to perform the features you request. LeadFlow reads the spreadsheet and tab you configure, may update supported lead status and draft reference cells, and may create Gmail drafts in your account.',
      'LeadFlow creates drafts for your review. It does not send email automatically. You are responsible for checking each draft, recipient, content, and legal basis before you send it. You can disconnect Google from your LeadFlow settings. Google services remain subject to Google’s own terms and availability.',
    ],
  },
  {
    title: '4. Acceptable use',
    paragraphs: [
      'Use LeadFlow only with accounts, spreadsheets, and data you are authorized to access. You must comply with applicable laws, privacy and marketing rules, Google policies, and the rights of people whose information appears in your spreadsheet.',
      'You may not use LeadFlow to send unlawful, deceptive, harassing, or unsolicited communications; violate another person’s rights; interfere with the service or its security; reverse engineer or abuse the service; or bypass usage limits. You are responsible for obtaining any notices, permissions, and consents required for your use of lead data and generated content.',
    ],
  },
  {
    title: '5. AI-generated content',
    paragraphs: [
      'AI-generated text may be inaccurate, incomplete, inappropriate, or unsuitable for your situation. It is a suggestion, not legal, financial, or professional advice. You must review and edit generated content before using it and remain responsible for the messages you send and decisions you make.',
    ],
  },
  {
    title: '6. Plans and usage limits',
    paragraphs: [
      'LeadFlow may apply draft-generation limits, including limits displayed in the product. Limits can change as the service develops. Do not attempt to evade them. If paid features are offered, their price and additional terms will be presented before purchase; these Terms do not authorize an undisclosed charge.',
    ],
  },
  {
    title: '7. Your content and service rights',
    paragraphs: [
      'You retain your rights in the information and content you provide or connect. You authorize us to process that content only as needed to operate, secure, and provide the features you use, as described in our Privacy Policy. You are responsible for having the rights and permissions needed to provide it.',
      'LeadFlow and its software, branding, and design are owned by us or our licensors. These Terms give you a limited, personal, non-transferable right to use the service while you comply with these Terms. No other rights are granted.',
    ],
  },
  {
    title: '8. Third-party services and availability',
    paragraphs: [
      'LeadFlow depends on third-party services, including Google APIs and AI infrastructure. Those services may change, become unavailable, or impose their own terms and limits. We are not responsible for third-party services or content. We may modify, suspend, or discontinue part or all of LeadFlow, with notice where reasonably practicable.',
    ],
  },
  {
    title: '9. Disclaimers and limits of liability',
    paragraphs: [
      'To the extent permitted by law, LeadFlow is provided “as is” and “as available,” without warranties that it will be uninterrupted, error-free, secure in every circumstance, or suitable for a particular purpose. Nothing in these Terms excludes a warranty or right that applicable law does not allow to be excluded.',
      'To the extent permitted by law, we will not be liable for indirect, incidental, special, consequential, exemplary, or punitive losses, or loss of profits, data, goodwill, or business opportunities arising from your use of LeadFlow. Our total liability for claims relating to the service will not exceed the amount you paid us for LeadFlow in the 12 months before the event giving rise to the claim; if you paid nothing, the limit is zero. These limits do not apply where prohibited by law or to liability that cannot legally be limited.',
    ],
  },
  {
    title: '10. Suspension and termination',
    paragraphs: [
      'You may stop using LeadFlow at any time and disconnect Google in your account settings. We may suspend or end access if you materially breach these Terms, create a security or legal risk, or if we discontinue the service. Where appropriate, we will provide notice and an opportunity to address the issue. Sections that by their nature should continue will survive termination.',
    ],
  },
  {
    title: '11. Changes to these Terms',
    paragraphs: [
      'We may update these Terms as LeadFlow changes or for legal, security, or operational reasons. We will update the effective date below and provide notice of material changes through the service or another reasonable channel. Continued use after an update takes effect means you accept the revised Terms. If you do not agree, stop using LeadFlow.',
    ],
  },
  {
    title: '12. General',
    paragraphs: [
      'These Terms and the Privacy Policy describe the agreement between you and us about LeadFlow. If a provision is unenforceable, the remaining provisions continue to apply. A failure to enforce a provision is not a waiver. You may not transfer your rights under these Terms without our consent. These Terms do not limit rights you have under mandatory local law.',
    ],
  },
];

export const TermsPage = () => (
  <article className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
    <header className="mb-8 border-b border-[#2a2d3a] pb-6">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-indigo-300">Legal</p>
      <h1 className="mt-2 text-3xl font-semibold text-slate-100">Terms of Service</h1>
      <p className="mt-3 text-sm text-slate-500">Effective date: November 1, 2026</p>
      <p className="mt-4 text-sm leading-6 text-slate-400">These terms explain the rules for using LeadFlow, including its Google integrations and AI-assisted draft generation.</p>
    </header>
    <div className="space-y-7">
      {sections.map(({ title, paragraphs }) => (
        <section key={title}>
          <h2 className="text-base font-semibold text-slate-200">{title}</h2>
          <div className="mt-2 space-y-3 text-sm leading-7 text-slate-400">
            {paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </div>
        </section>
      ))}
    </div>
    <p className="mt-8 border-t border-[#2a2d3a] pt-5 text-sm text-slate-400">Questions about these Terms? Email <a className="text-indigo-300 hover:text-indigo-200" href="mailto:suyalpriyanshu2@gmail.com">suyalpriyanshu2@gmail.com</a>.</p>
  </article>
);
