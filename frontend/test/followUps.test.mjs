import assert from 'node:assert/strict';
import test from 'node:test';
import { filterFollowUps, countFollowUps } from '../src/utils/followUps.ts';
import { paginateLeads } from '../src/utils/followUpPagination.ts';

const today = '2026-10-23';
const leads = Array.from({ length: 23 }, (_, index) => ({
  rowNumber: index + 2,
  name: `Lead ${index + 1}`,
  email: `lead${index + 1}@example.com`,
  company: 'Example',
  nextFollowUpDate: index < 3 ? today : index < 7 ? '2026-10-24' : index < 12 ? '2026-10-22' : null,
}));

test('pagination returns ten leads, accurate ranges, and a partial last page', () => {
  const first = paginateLeads(leads, 1);
  assert.equal(first.items.length, 10);
  assert.equal(first.first, 1);
  assert.equal(first.last, 10);
  assert.equal(first.pageCount, 3);

  const last = paginateLeads(leads, 3);
  assert.equal(last.items.length, 3);
  assert.equal(last.first, 21);
  assert.equal(last.last, 23);
});

test('pagination clamps requested pages when filters or refreshed data shrink the result set', () => {
  const filtered = filterFollowUps(leads, 'due', today);
  const lastValidPage = paginateLeads(filtered, 4);
  assert.equal(lastValidPage.page, 1);
  assert.equal(lastValidPage.items.length, 3);
});

test('all follow-up filters include only leads with their matching local-date status', () => {
  assert.equal(filterFollowUps(leads, 'all', today).length, 23);
  assert.equal(filterFollowUps(leads, 'due', today).length, 3);
  assert.equal(filterFollowUps(leads, 'upcoming', today).length, 4);
  assert.equal(filterFollowUps(leads, 'overdue', today).length, 5);
  assert.equal(filterFollowUps(leads, 'none', today).length, 11);
});

test('editing a date updates the corresponding count and filtered row', () => {
  const edited = leads.map((lead) => lead.rowNumber === 2 ? { ...lead, nextFollowUpDate: '2026-10-24' } : lead);
  assert.equal(countFollowUps(edited, today).due, 2);
  assert.equal(countFollowUps(edited, today).upcoming, 5);
  assert.equal(filterFollowUps(edited, 'upcoming', today).some((lead) => lead.rowNumber === 2), true);
});
