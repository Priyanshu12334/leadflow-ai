import { Link } from 'react-router-dom';

export const NotFoundPage = () => (
  <main className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6 lg:px-8">
    <p className="text-sm font-semibold uppercase tracking-[0.12em] text-indigo-300">404</p>
    <h1 className="mt-3 text-3xl font-semibold text-slate-100">Page not found</h1>
    <p className="mt-3 text-sm text-slate-400">The page you requested doesn’t exist or may have moved.</p>
    <Link to="/" className="mt-6 inline-flex rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500">
      Go to LeadFlow
    </Link>
  </main>
);
