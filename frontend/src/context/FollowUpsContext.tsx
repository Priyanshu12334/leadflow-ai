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

  const loadForUser = useCallback((userId: string): Promise<LeadListItem[]> => {
    const existingRequest = inFlight.current.get(userId);
    if (existingRequest) return existingRequest;

    setLoadingByUser((current) => ({ ...current, [userId]: true }));
    setErrorsByUser((current) => ({ ...current, [userId]: '' }));
    const request = leadApi.listLeads()
      .then((leads) => {
        setCache((current) => ({ ...current, [userId]: { leads } }));
        return leads;
      })
      .catch((error: unknown) => {
        setErrorsByUser((current) => ({ ...current, [userId]: getErrorMessage(error) || 'Could not load leads.' }));
        throw error;
      })
      .finally(() => {
        inFlight.current.delete(userId);
        setLoadingByUser((current) => ({ ...current, [userId]: false }));
      });
    inFlight.current.set(userId, request);
    return request;
  }, []);

  const userId = user?.id;
  const entry = userId ? cache[userId] : undefined;
  const ensureLoaded = useCallback((requestedUserId: string) => {
    const existing = cache[requestedUserId];
    return existing ? Promise.resolve(existing.leads) : loadForUser(requestedUserId);
  }, [cache, loadForUser]);

  const refresh = useCallback(async () => {
    if (!userId) return;
    try { await loadForUser(userId); } catch { /* Error is exposed through context. */ }
  }, [loadForUser, userId]);

  const value: FollowUpsContextValue = {
    leads: entry?.leads ?? [],
    loading: Boolean(userId && !entry && loadingByUser[userId] !== false),
    refreshing: Boolean(userId && loadingByUser[userId]),
    error: userId ? errorsByUser[userId] ?? '' : '',
    ensureLoaded,
    refresh,
  };

  return <FollowUpsContext.Provider value={value}>{children}</FollowUpsContext.Provider>;
};
