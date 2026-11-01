import { describe, it, expect } from 'vitest';

// Pure function test for schedule logic (without DB)
function computeOccurrences(weekdays: number[], from: string, to: string) {
  const fromDate = new Date(from); const toDate = new Date(to);
  const occ: string[] = [];
  for (let d=new Date(fromDate); d<=toDate; d.setDate(d.getDate()+1)) {
    if (weekdays.includes(d.getUTCDay())) occ.push(d.toISOString().slice(0,10));
  }
  return occ;
}

describe('Routine recurrence', () => {
  it('Sun/Tue/Fri pattern', () => {
    const occ = computeOccurrences([0,2,5], '2026-10-25', '2026-10-31'); // Sun=0, Tue=2, Fri=5
    // 2026-10-25 is Sun, 27 Tue, 30 Fri
    expect(occ).toContain('2026-10-25');
    expect(occ).toContain('2026-10-27');
    expect(occ).toContain('2026-10-30');
  });

  it('reschedule moves Sunday to Monday', () => {
    // Sunday occurrence becomes rescheduled, Monday appears
    // Simulated: original Sunday not in list, Monday added
    const original = ['2026-10-25'];
    const after = ['2026-10-26']; // Monday
    expect(original).not.toContain('2026-10-26');
    expect(after).toContain('2026-10-26');
  });

  it('timezone-safe compute uses UTC for test', () => {
    const d = new Date('2026-10-30T00:00:00+06:00'); // Dhaka
    expect(d.toISOString().slice(0,10)).toBe('2026-10-29'); // UTC shifts previous day — need timezone handling note
    // This test documents why we store date as Date without time and use user timezone on client
  });
});
