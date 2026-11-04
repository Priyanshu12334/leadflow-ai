import assert from 'node:assert/strict';
import test from 'node:test';
import { getLeadDisplayEmail, getPrimaryLeadTitle, isDuplicateDisplayValue } from '../src/utils/leadDisplay.ts';

test('primary lead title detects contact and student names after unrelated leading columns', () => {
  assert.equal(getPrimaryLeadTitle([
    { column: 'Company', value: 'Northstar Labs' },
    { column: 'Contact Name', value: 'Avery Chen' },
    { column: 'Email', value: 'avery@example.com' },
  ]), 'Avery Chen');
  assert.equal(getPrimaryLeadTitle([
    { column: 'Student U.Roll', value: 'U-1042' },
    { column: 'Student Name', value: 'Mira Patel' },
    { column: 'Date of exam', value: '2026-05-12' },
    { column: 'Time of exam', value: '09:30' },
  ]), 'Mira Patel');
});

test('primary title falls back to a populated title or first populated cell', () => {
  assert.equal(getPrimaryLeadTitle([
    { column: 'Project', value: 'Project A' },
    { column: 'Title', value: 'Project title' },
  ]), 'Project title');
  assert.equal(getPrimaryLeadTitle([
    { column: 'Student U.Roll', value: '' },
    { column: 'Exam Room', value: ' Room 12 ' },
  ]), 'Room 12');
  assert.equal(getPrimaryLeadTitle([]), 'Unnamed lead');
});

test('email is detected dynamically and omitted from the row when it duplicates its title', () => {
  const fields = [
    { column: 'Exam Room', value: ' Room 12 ' },
    { column: 'Mail ID', value: 'room 12' },
  ];
  const title = getPrimaryLeadTitle(fields);
  const email = getLeadDisplayEmail(fields);
  assert.equal(isDuplicateDisplayValue(title, email), true);
  assert.equal(getLeadDisplayEmail([{ column: 'E-mail Address', value: 'person@example.com' }]), 'person@example.com');
});
