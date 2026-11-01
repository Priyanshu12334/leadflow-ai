const sections = [
  {
    title: '1. Who we are and scope',
    paragraphs: [
      'LeadFlow is operated by Priyanshu Suyal ("LeadFlow", "we", "us", or "our"). This Privacy Policy explains how we handle information when you visit or use LeadFlow. Contact us at suyalpriyanshu2@gmail.com with privacy questions or requests.',
      'This policy applies to LeadFlow’s website and service. Google, Vercel, Render, EmailJS, and Google’s AI services may separately process information under their own privacy terms when providing their services.',
    ],
  },
  {
    title: '2. Information we handle',
    paragraphs: [
      'Account information: when you sign in with Google, we receive your Google account identifier, name, and email address. We keep account settings such as your selected spreadsheet ID and tab name, plan and draft usage counters, and account timestamps.',
      'Google data you ask us to use: if you connect Google, LeadFlow uses the Sheets permission to read the spreadsheet and tab you configure, including lead fields such as name, email, company, website, context, and status. It may update supported status or draft-reference cells. Through Gmail permissions, it creates drafts and may access the metadata needed to identify draft, message, or thread references. LeadFlow does not send messages automatically.',
      'Processing records: to prevent duplicate work and show follow-up status, the service stores the spreadsheet and tab reference, row number, a fingerprint derived from lead fields, processing status, scheduled follow-up date, Gmail draft/message/thread identifiers, error details, and timestamps. It does not store a copy of the complete spreadsheet row in these processing records.',
      'Session and technical information: the service uses a strictly necessary, HTTP-only session cookie to keep you signed in. The browser may send standard connection information to the hosting provider when loading the site or making requests. We do not use the app for advertising or cross-site tracking.',
      'Support messages: if you submit the Contact form, your name, email address, subject, and message are sent through EmailJS to the LeadFlow owner. You can instead contact us directly by email.',
    ],
  },
  {
    title: '3. How we use information',
    paragraphs: [
      'We use information to authenticate you, maintain your account, connect to the Google spreadsheet and Gmail account you selected, generate follow-up suggestions, create drafts at your request, track processing and usage limits, prevent duplicate processing, provide support, protect the service, and comply with law.',
      'Lead content needed to draft a follow-up is sent to Google’s Gemini AI service for generation. We use it to provide the user-facing feature you requested. We do not use Google user data for advertising, sell it, or use it to build generalized AI or machine-learning models. We do not permit people to read Google user data except where required for security, legal compliance, or with your specific affirmative agreement where applicable.',
      'The use of information received from Google Workspace APIs adheres to the Google API Services User Data Policy, including its Limited Use requirements. We request Google permissions to provide the product features described in the app and in this policy.',
    ],
  },
  {
    title: '4. Google permissions and disconnection',
    paragraphs: [
      'The Google consent screen identifies the permissions requested, which include basic sign-in information, access to Google Sheets, Gmail draft composition, and Gmail metadata. We use these permissions only for the LeadFlow functions described above.',
      'You can disconnect Google in LeadFlow settings. Disconnection removes the stored refresh token and spreadsheet ID from your LeadFlow account and attempts to revoke the Google grant. It does not delete your LeadFlow account or existing processing history. You can also review or revoke the app’s access in your Google Account settings.',
    ],
  },
  {
    title: '5. When we share information',
    paragraphs: [
      'We share information only as needed to operate LeadFlow: with Google APIs to authenticate you, read or update the spreadsheet you selected, and create drafts; with Google’s Gemini service to generate a response from the lead information you submitted for that feature; with hosting and database providers that run the website and backend; and with EmailJS when you submit the contact form.',
      'We may also disclose information if reasonably necessary to protect the service or a person, investigate abuse, comply with a valid legal request, or complete a business transfer, subject to applicable law. We do not sell personal information or share Google user data with advertising platforms or data brokers.',
    ],
  },
  {
    title: '6. Security',
    paragraphs: [
      'We use technical and organizational safeguards intended to protect information. Google refresh tokens are encrypted in the application database using authenticated encryption, and the session cookie is HTTP-only. No method of storage or transmission is completely secure, so we cannot guarantee absolute security. You are responsible for protecting your Google account and device.',
    ],
  },
  {
    title: '7. Retention and deletion',
    paragraphs: [
      'We keep account information and processing history while needed to operate your account, maintain quota and duplicate-prevention records, resolve support matters, protect the service, and meet legal obligations. We do not currently provide an in-app account deletion feature. To request deletion of your LeadFlow account and associated records, email suyalpriyanshu2@gmail.com from your account email. We will verify the request and delete or de-identify information unless we must retain it for legal, security, or legitimate operational reasons.',
      'Disconnecting Google removes the refresh token and spreadsheet ID from the account, but leaves the LeadFlow account and processing history in place. Disconnecting does not delete drafts already created in Gmail or change the contents of your Google Sheet.',
    ],
  },
  {
    title: '8. Your choices and rights',
    paragraphs: [
      'You can review and update spreadsheet settings in LeadFlow, disconnect Google, revoke Google access through Google Account settings, and contact us to request access to, correction of, or deletion of your LeadFlow account information. Depending on where you live, privacy laws may give you additional rights. We will respond to verified requests as required by applicable law.',
    ],
  },
  {
    title: '9. Children and international processing',
    paragraphs: [
      'LeadFlow is a business productivity service and is not directed to children under 13. We do not knowingly collect personal information directly from children under 13. Our service providers may process information in countries where they or their infrastructure operate, subject to their safeguards and applicable law.',
    ],
  },
  {
    title: '10. Changes and contact',
    paragraphs: [
      'We may update this policy to reflect changes to LeadFlow or its data practices. We will revise the effective date and provide notice of material changes through the service or another reasonable channel. Continued use after the updated policy takes effect is subject to the revised policy.',
    ],
  },
];

export const PrivacyPolicyPage = () => (
  <article className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
    <header className="mb-8 border-b border-[#2a2d3a] pb-6">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-indigo-300">Legal</p>
      <h1 className="mt-2 text-3xl font-semibold text-slate-100">Privacy Policy</h1>
      <p className="mt-3 text-sm text-slate-500">Effective date: November 1, 2026</p>
      <p className="mt-4 text-sm leading-6 text-slate-400">This policy describes the information LeadFlow uses to connect your Google account, work with the spreadsheet you select, and create Gmail drafts.</p>
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
    <p className="mt-8 border-t border-[#2a2d3a] pt-5 text-sm text-slate-400">Privacy contact: <a className="text-indigo-300 hover:text-indigo-200" href="mailto:suyalpriyanshu2@gmail.com">suyalpriyanshu2@gmail.com</a>.</p>
  </article>
);
