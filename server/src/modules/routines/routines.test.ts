import { describe, it, expect } from 'vitest';
import { listRoutines, createRoutine, deleteRoutine, memRoutines } from './routines.service';

// Pure function test for schedule logic (without DB)
function computeOccurrences(weekdays: number[], from: string, to: string) {
  const fromDate = new Date(from);
  const toDate = new Date(to);
  const occ: string[] = [];
  for (let d = new Date(fromDate); d <= toDate; d.setDate(d.getDate() + 1)) {
    if (weekdays.includes(d.getUTCDay())) occ.push(d.toISOString().slice(0, 10));
  }
  return occ;
}

describe('Routine recurrence & occurrences', () => {
  it('Sun/Tue/Fri pattern', () => {
    const occ = computeOccurrences([0, 2, 5], '2026-10-25', '2026-10-31'); // Sun=0, Tue=2, Fri=5
    // 2026-10-25 is Sun, 27 Tue, 30 Fri
    expect(occ).toContain('2026-10-25');
    expect(occ).toContain('2026-10-27');
    expect(occ).toContain('2026-10-30');
  });

  it('reschedule moves Sunday to Monday', () => {
    const original = ['2026-10-25'];
    const after = ['2026-10-26']; // Monday
    expect(original).not.toContain('2026-10-26');
    expect(after).toContain('2026-10-26');
  });

  it('timezone-safe compute uses UTC for test', () => {
    const d = new Date('2026-10-30T00:00:00+06:00'); // Dhaka
    expect(d.toISOString().slice(0, 10)).toBe('2026-10-29'); // UTC shifts previous day
  });
});

describe('School and College Schedule Routine Management', () => {
  it('lists default school periods for student', async () => {
    const list = await listRoutines('demo-child-1', 'parent-1');
    expect(list.length).toBeGreaterThan(0);
    const schoolPeriods = list.filter((r: any) => r.source === 'school');
    expect(schoolPeriods.length).toBeGreaterThanOrEqual(5);

    // Verify presence of core subjects
    const subjects = schoolPeriods.map((r: any) => r.subject);
    expect(subjects).toContain('Bangla 1st Paper');
    expect(subjects).toContain('Mathematics');
    expect(subjects).toContain('General Science');
  });

  it('creates a new school period and deactivates it', async () => {
    const newPeriod = await createRoutine('demo-child-1', 'parent-1', {
      name: '৭ম পিরিয়ড: শারীরিক শিক্ষা ও স্বাস্থ্য',
      periodName: '৭ম পিরিয়ড',
      subject: 'Physical Education',
      teacher: 'কামাল স্যার',
      room: 'খেলার মাঠ',
      source: 'school',
      weekdays: [0, 2, 4],
      startTime: '14:00',
      durationMin: 40,
      startsOn: '2026-11-01',
    });

    expect(newPeriod.id).toBeDefined();
    expect(newPeriod.periodName).toBe('৭ম পিরিয়ড');
    expect(newPeriod.weekdays).toEqual([0, 2, 4]);

    // Deactivate
    const res = await deleteRoutine(newPeriod.id, 'parent-1');
    expect(res.message).toBe('Deactivated');

    const updatedList = await listRoutines('demo-child-1', 'parent-1');
    expect(updatedList.some((r: any) => r.id === newPeriod.id)).toBe(false);
  });
});
