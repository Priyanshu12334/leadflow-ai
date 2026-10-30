import type { FollowUpLead } from '../types';

export type FollowUpStatus = 'due' | 'upcoming' | 'overdue' | 'none';
export type FollowUpFilter = FollowUpStatus | 'all';
export type FollowUpCounts = Record<Exclude<FollowUpStatus, 'none'>, number> & { none: number };

export function localDateKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function statusOf(date: string | null, today = localDateKey()): FollowUpStatus {
  if (!date) return 'none';
  if (date === today) return 'due';
  return date < today ? 'overdue' : 'upcoming';
}

export function countFollowUps(leads: FollowUpLead[], today = localDateKey()): FollowUpCounts {
  return leads.reduce<FollowUpCounts>((counts, lead) => {
    counts[statusOf(lead.nextFollowUpDate, today)] += 1;
    return counts;
  }, { due: 0, upcoming: 0, overdue: 0, none: 0 });
}

export function filterFollowUps(leads: FollowUpLead[], filter: FollowUpFilter, today = localDateKey()): FollowUpLead[] {
  return filter === 'all' ? leads : leads.filter((lead) => statusOf(lead.nextFollowUpDate, today) === filter);
}
