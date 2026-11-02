import { createContext } from 'react';
import type { LeadListItem } from '../types';

export interface FollowUpsContextValue {
  leads: LeadListItem[];
  loading: boolean;
  refreshing: boolean;
  error: string;
  ensureLoaded: (userId: string) => Promise<LeadListItem[]>;
  refresh: () => Promise<void>;
}

export const FollowUpsContext = createContext<FollowUpsContextValue | null>(null);
