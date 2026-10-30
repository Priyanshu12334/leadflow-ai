import { createContext } from 'react';
import type { FollowUpLead } from '../types';

export interface FollowUpsContextValue {
  leads: FollowUpLead[];
  loading: boolean;
  refreshing: boolean;
  error: string;
  savingRow: number | null;
  ensureLoaded: (userId: string) => Promise<FollowUpLead[]>;
  refresh: () => Promise<void>;
  updateDate: (lead: FollowUpLead, value: string) => Promise<boolean>;
}

export const FollowUpsContext = createContext<FollowUpsContextValue | null>(null);
