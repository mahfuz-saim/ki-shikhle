import { badRequest } from './errors';

/** School dates are calendar days in Bangladesh, not UTC timestamps. */
export function currentSchoolDate(): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Dhaka', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const value = (type: string) => parts.find((part) => part.type === type)!.value;
  return `${value('year')}-${value('month')}-${value('day')}`;
}

export function assertClassLogDate(value: string | Date): void {
  const key = value instanceof Date && Number.isFinite(value.getTime())
    ? value.toISOString().slice(0, 10) : String(value);
  const parsed = new Date(`${key}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key) || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== key) {
    throw badRequest('Invalid class log date');
  }
  if (key > currentSchoolDate()) throw badRequest('Future classes cannot be logged. Please log the class on or after its scheduled date.');
}
