export function buildSpreadsheetOpenUrl(spreadsheetId: string, sheetId: number): string {
  const url = new URL(`/spreadsheets/d/${encodeURIComponent(spreadsheetId)}/edit`, "https://docs.google.com");
  const gid = String(sheetId);
  url.searchParams.set("gid", gid);
  url.hash = new URLSearchParams({ gid }).toString();
  return url.toString();
}
