import { useCallback, useRef, useState, type PropsWithChildren } from 'react';
import { leadApi } from '../api/leadApi';
import { useAuth } from './AuthContext';
import type { LeadListItem } from '../types';
import { getErrorMessage } from '../types';
import { FollowUpsContext, type FollowUpsContextValue } from './FollowUpsContextValue';

interface UserFollowUpCache {
  leads: LeadListItem[];
}

export const FollowUpsProvider = ({ children }: PropsWithChildren) => {
  const { user } = useAuth();
  const [cache, setCache] = useState<Record<string, UserFollowUpCache>>({});
  const [loadingByUser, setLoadingByUser] = useState<Record<string, boolean>>({});
  const [errorsByUser, setErrorsByUser] = useState<Record<string, string>>({});
  const inFlight = useRef(new Map<string, Promise<LeadListItem[]>>());

  const scopeKey = (requestedUserId: string, spreadsheetId: string | null, sheetName: string) => `${requestedUserId}:${spreadsheetId || ''}:${sheetName}`;
  const loadForUser = useCallback((userId: string, spreadsheetId: string | null, sheetName: string): Promise<LeadListItem[]> => {
    const key = scopeKey(userId, spreadsheetId, sheetName);
    const existingRequest = inFlight.current.get(key);
    if (existingRequest) return existingRequest;

    setLoadingByUser((current) => ({ ...current, [key]: true }));
    setErrorsByUser((current) => ({ ...current, [key]: '' }));
    const request = leadApi.listLeads()
      .then((leads) => {
        setCache((current) => ({ ...current, [key]: { leads } }));
        return leads;
      })
      .catch((error: unknown) => {
        setErrorsByUser((current) => ({ ...current, [key]: getErrorMessage(error) || 'Could not load leads.' }));
        throw error;
      })
      .finally(() => {
        inFlight.current.delete(key);
        setLoadingByUser((current) => ({ ...current, [key]: false }));
      });
    inFlight.current.set(key, request);
    return request;
  }, []);

  const userId = user?.id;
  const key = userId ? scopeKey(userId, user?.spreadsheetId ?? null, user?.sheetName ?? '') : '';
  const entry = key ? cache[key] : undefined;
  const ensureLoaded = useCallback((requestedUserId: string, spreadsheetId: string | null, sheetName: string) => {
    const requestedKey = scopeKey(requestedUserId, spreadsheetId, sheetName);
    const existing = cache[requestedKey];
    return existing ? Promise.resolve(existing.leads) : loadForUser(requestedUserId, spreadsheetId, sheetName);
  }, [cache, loadForUser]);

  const refresh = useCallback(async () => {
    if (!userId) return;
    try { await loadForUser(userId, user?.spreadsheetId ?? null, user?.sheetName ?? ''); } catch { /* Error is exposed through context. */ }
  }, [loadForUser, userId, user?.spreadsheetId, user?.sheetName]);

  const value: FollowUpsContextValue = {
    leads: entry?.leads ?? [],
    loading: Boolean(userId && !entry && loadingByUser[key] !== false),
    refreshing: Boolean(userId && loadingByUser[key]),
    error: userId ? errorsByUser[key] ?? '' : '',
    ensureLoaded,
    refresh,
  };

  return <FollowUpsContext.Provider value={value}>{children}</FollowUpsContext.Provider>;
};
