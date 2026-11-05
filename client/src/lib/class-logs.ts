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

/** The persisted entry IDs link a quiz to one log, not every log of that subject. */
export function findLogQuiz(quizzes: any[], entryId?: string, assignedOnly = true): any | undefined {
  if (!entryId) return undefined;
  return quizzes.find((quiz) => Array.isArray(quiz.scopeJson?.entryIds)
    && quiz.scopeJson.entryIds.includes(entryId)
    && (!assignedOnly || quiz.status === 'assigned' || quiz.status === 'completed'));
}

/** Match the API's calendar day so future logging cannot depend on browser timezone. */
export function classLogToday(): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Dhaka', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const value = (type: string) => parts.find((part) => part.type === type)!.value;
  return `${value('year')}-${value('month')}-${value('day')}`;
}

export function isFutureClassDate(date: string): boolean {
  return date > classLogToday();
}
