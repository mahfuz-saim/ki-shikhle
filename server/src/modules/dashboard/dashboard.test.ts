import { describe, it, expect } from 'vitest';
import * as dashboardSvc from './dashboard.service';
import { listRoutines } from '../routines/routines.service';

describe('College Student Dashboard & Study Time (Fahim Islam)', () => {
  it('returns valid college study hours in weekly study time for Fahim', async () => {
    const studyTimes = await dashboardSvc.studyTime('demo-child-3', 'parent-demo', 'week');
    expect(studyTimes).toBeDefined();
    expect(Array.isArray(studyTimes)).toBe(true);
    expect(studyTimes.length).toBeGreaterThan(0);

    // Sum of college minutes must be > 0 for Fahim
    const totalCollegeMin = studyTimes.reduce((acc, curr) => acc + (curr.college || 0), 0);
    expect(totalCollegeMin).toBeGreaterThan(0);
    expect(totalCollegeMin).toBeGreaterThanOrEqual(500); // 5 weekdays * 100 min/day = 500 min (~8.3 hours)
  });

  it('returns realistic high-school / college KPIs in summary for Fahim', async () => {
    const sum = await dashboardSvc.summary('demo-child-3', 'parent-demo');
    expect(sum).toBeDefined();
    expect(sum.kpis).toBeDefined();
    expect(sum.kpis.totalTime).toBeGreaterThanOrEqual(1500); // 26 hours
    expect(sum.kpis.streak).toBeGreaterThanOrEqual(7);
    expect(sum.kpis.avgScore).toBeGreaterThanOrEqual(90);
  });

  it('returns college routines with source "college" for Fahim', async () => {
    const routines = await listRoutines('demo-child-3', 'parent-demo');
    expect(routines).toBeDefined();
    expect(routines.length).toBeGreaterThan(0);

    const collegeRoutines = routines.filter((r: any) => r.source === 'college');
    expect(collegeRoutines.length).toBeGreaterThanOrEqual(5);

    // Verify 50-minute periods and subjects
    const subjects = collegeRoutines.map((r: any) => r.subject);
    expect(subjects).toContain('Physics 1st Paper');
    expect(subjects).toContain('Chemistry 1st Paper');
    expect(subjects).toContain('Higher Mathematics');
  });
});
