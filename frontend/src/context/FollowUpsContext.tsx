import { useCallback, useRef, useState, type PropsWithChildren } from 'react';
import { leadApi } from '../api/leadApi';
import { useAuth } from './AuthContext';
import type { FollowUpLead } from '../types';
import { getErrorMessage } from '../types';
import { FollowUpsContext, type FollowUpsContextValue } from './FollowUpsContextValue';

interface UserFollowUpCache {
  leads: FollowUpLead[];
}

export const FollowUpsProvider = ({ children }: PropsWithChildren) => {
  const { user } = useAuth();
  const [cache, setCache] = useState<Record<string, UserFollowUpCache>>({});
  const [loadingByUser, setLoadingByUser] = useState<Record<string, boolean>>({});
  const [errorsByUser, setErrorsByUser] = useState<Record<string, string>>({});
  const [savingRow, setSavingRow] = useState<number | null>(null);
  const inFlight = useRef(new Map<string, Promise<FollowUpLead[]>>());

  const loadForUser = useCallback((userId: string): Promise<FollowUpLead[]> => {
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

  const updateDate = useCallback(async (lead: FollowUpLead, value: string): Promise<boolean> => {
    if (!userId) return false;
    setSavingRow(lead.rowNumber);
    setErrorsByUser((current) => ({ ...current, [userId]: '' }));
    try {
      const nextFollowUpDate = await leadApi.updateFollowUpDate(lead.rowNumber, value || null);
      setCache((current) => {
        const currentEntry = current[userId];
        if (!currentEntry) return current;
        return {
          ...current,
          [userId]: {
            ...currentEntry,
            leads: currentEntry.leads.map((item) => item.rowNumber === lead.rowNumber ? { ...item, nextFollowUpDate } : item),
          },
        };
      });
      return true;
    } catch (error: unknown) {
      setErrorsByUser((current) => ({ ...current, [userId]: getErrorMessage(error) || 'Could not save follow-up date.' }));
      return false;
    } finally {
      setSavingRow(null);
    }
  }, [userId]);

  const value: FollowUpsContextValue = {
    leads: entry?.leads ?? [],
    loading: Boolean(userId && !entry && loadingByUser[userId] !== false),
    refreshing: Boolean(userId && loadingByUser[userId]),
    error: userId ? errorsByUser[userId] ?? '' : '',
    savingRow,
    ensureLoaded,
    refresh,
    updateDate,
  };

  return <FollowUpsContext.Provider value={value}>{children}</FollowUpsContext.Provider>;
};
