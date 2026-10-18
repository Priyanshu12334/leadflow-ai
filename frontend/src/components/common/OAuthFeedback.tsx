import React from 'react';
import { useSearchParams } from 'react-router-dom';

const messages: Record<string, string> = {
  google_denied: 'Google sign in was cancelled. You can try again when ready.',
  account_mismatch: 'Choose the same Google account to reconnect. Sign out first to use a different account.',
  account_in_use: 'That Google account is already linked to another LeadFlow user.',
  missing_refresh_token: 'Google did not grant offline access. Reconnect and approve the requested access.',
  missing_identity: 'Google did not return an account identity. Please try again.',
  database_unavailable: 'LeadFlow could not reach PostgreSQL. Start the database, then try Google sign in again.',
  oauth_failed: 'Google sign in could not be completed. Please try again.',
};

export const OAuthFeedback = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const code = searchParams.get('authError');
  const message = code ? messages[code] : undefined;
  if (!message) return null;

  return (
    <div role="alert" className="mx-auto mt-4 max-w-5xl rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
      {message}
      <button
        type="button"
        className="ml-3 underline underline-offset-2"
        onClick={() => {
          const next = new URLSearchParams(searchParams);
          next.delete('authError');
          setSearchParams(next, { replace: true });
        }}
      >
        Dismiss
      </button>
    </div>
  );
};
