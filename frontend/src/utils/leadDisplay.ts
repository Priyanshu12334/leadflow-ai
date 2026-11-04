export interface SheetDisplayField {
  column: string;
  value: string;
}

function normalizeHeader(value: string): string {
  return value.trim().toLocaleLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
}

const NAME_HEADERS = new Set([
  'name', 'full name', 'student name', 'contact name', 'person', 'person name',
  'first name', 'last name', 'given name', 'surname', 'candidate name', 'applicant name',
  'lead name', 'customer name', 'client name', 'employee name', 'attendee name',
  'participant name', 'prospect name', 'student full name', 'teacher name', 'user name',
  'guest name', 'contact person', 'candidate', 'applicant',
]);
const TITLE_HEADERS = new Set(['title']);

const EMAIL_HEADERS = new Set([
  'email', 'e mail', 'email address', 'e mail address', 'email id', 'mail', 'mail id', 'contact email', 'work email',
]);

export function getPrimaryLeadTitle(fields: SheetDisplayField[]): string {
  const namedValue = fields.find(({ column, value }) => NAME_HEADERS.has(normalizeHeader(column)) && value.trim())?.value.trim();
  const titledValue = fields.find(({ column, value }) => TITLE_HEADERS.has(normalizeHeader(column)) && value.trim())?.value.trim();
  return namedValue || titledValue || fields.find(({ value }) => value.trim())?.value.trim() || 'Unnamed lead';
}

export function getLeadDisplayEmail(fields: SheetDisplayField[], fallback = ''): string {
  return fields.find(({ column, value }) => EMAIL_HEADERS.has(normalizeHeader(column)) && value.trim())?.value.trim()
    || fallback.trim();
}

export function isDuplicateDisplayValue(left: string, right: string): boolean {
  return left.trim().toLocaleLowerCase() === right.trim().toLocaleLowerCase();
}
