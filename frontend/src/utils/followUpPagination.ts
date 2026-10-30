export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageCount: number;
  first: number;
  last: number;
  total: number;
}

export function paginateLeads<T>(items: T[], requestedPage: number, pageSize = 10): PaginatedResult<T> {
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, requestedPage), pageCount);
  const startIndex = (page - 1) * pageSize;
  return {
    items: items.slice(startIndex, startIndex + pageSize),
    page,
    pageCount,
    first: total ? startIndex + 1 : 0,
    last: Math.min(startIndex + pageSize, total),
    total,
  };
}
