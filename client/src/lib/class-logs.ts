import { api } from '@/lib/api';

/** Use the local school day, not yesterday's UTC date before 6 AM in Bangladesh. */
export function schoolDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** Fetch every page so older classes do not lose their logged status after 20 logs. */
export async function loadClassLogs(childId: string, from: string, to = from): Promise<any[]> {
  const entries: any[] = [];
  let page = 1;
  while (true) {
    const response = await api.get(`/children/${childId}/entries`, {
      params: { from, to: `${to}T23:59:59.999Z`, page, limit: 100 },
    });
    const result = response.data?.data;
    const rows = Array.isArray(result) ? result : result?.data;
    if (!Array.isArray(rows) || rows.length === 0) break;
    entries.push(...rows);
    if (Array.isArray(result) || entries.length >= (result.total ?? entries.length)) break;
    page += 1;
  }
  return entries;
}

/** A log completes only its own routine on its own day, not another class of the same subject. */
export function findClassLog(entries: any[], routineId: string, date: string): any | undefined {
  if (!routineId) return undefined;
  return entries.find((entry) => entry.routineId === routineId && String(entry.date).slice(0, 10) === date);
}
