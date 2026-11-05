import { prisma } from '../../db/client';
import { notFound, forbidden, badRequest } from '../../utils/errors';
import { store, seedDemoRows, registerDemoFixture } from '../../core/store';
import { DEMO_ROUTINES } from '../../core/demo-data';
import { assertChildAccess, assertEntityAccess, type Actor } from '../../core/tenancy';

/**
 * The demo routine fixtures.
 *
 * These belong to the demo tenant. They are registered into the owner-partitioned store
 * (`core/store`) at import time. The dataset itself lives in `core/demo-data.ts` so the
 * seed scripts and this fallback stay in sync.
 */
const demoRoutineFixtures: any[] = DEMO_ROUTINES.map((r) => ({
  ...r,
  startsOn: r.startsOn,
  createdAt: new Date().toISOString(),
}));

/**
 * Register the demo routines into the owner-partitioned store.
 *
 * The degraded (no-database) path reads from `store.routines`, which is partitioned by
 * owner — so the demo routines are visible to the demo parent and to nobody else.
 */
registerDemoFixture(() => {
  seedDemoRows(store.routines, demoRoutineFixtures);
});

export async function listRoutines(actor: Actor, childId: string) {
  await assertChildAccess(actor, childId);
  try {
    const dbList: any[] = await prisma.routine.findMany({
      where: { childId, active: true },
      orderBy: { createdAt: 'desc' },
    });
    // The demo period fixtures live in the mem store. The database only holds the handful
    // of rows the seed wrote, so returning the DB rows alone would hide the school/college
    // timetable. Merge both sources, de-duplicating by id (the DB wins).
    const memList = store.routines
      .forChild(actor.ownerId, childId)
      .filter((r: any) => r.active !== false && !dbList.some((d: any) => d.id === r.id));
    return [...dbList, ...memList];
  } catch {
    return store.routines.forChild(actor.ownerId, childId).filter((r: any) => r.active !== false);
  }
}

export async function createRoutine(actor: Actor, childId: string, data: any) {
  await assertChildAccess(actor, childId);
  const payload = {
    childId,
    ...data,
    startsOn: new Date(data.startsOn || Date.now()),
    endsOn: data.endsOn ? new Date(data.endsOn) : null,
    active: true,
  };
  try {
    return await prisma.routine.create({ data: payload });
  } catch {
    const r = {
      id: 'routine-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      ...payload,
      ownerId: actor.ownerId,
      createdAt: new Date().toISOString(),
    };
    store.routines.add(r as any);
    return r;
  }
}

export async function updateRoutine(actor: Actor, routineId: string, data: any) {
  await assertEntityAccess(actor, { kind: 'routine', id: routineId });
  const r: any = await findRoutine(actor, routineId);
  try {
    return await prisma.routine.update({ where: { id: routineId }, data });
  } catch {
    Object.assign(r, data);
    return r;
  }
}

export async function deleteRoutine(actor: Actor, routineId: string) {
  await assertEntityAccess(actor, { kind: 'routine', id: routineId });
  try {
    await prisma.routine.update({ where: { id: routineId }, data: { active: false } });
  } catch {
    const r = store.routines.find(actor.ownerId, routineId);
    if (r) r.active = false;
  }
  return { message: 'Deactivated' };
}

export async function addException(actor: Actor, routineId: string, data: any) {
  await assertEntityAccess(actor, { kind: 'routine', id: routineId });
  const routine = await findRoutine(actor, routineId);
  // Class logs identify one routine per day. Do not merge two of its sessions
  // onto a day where a different occurrence of that routine already exists.
  if (data.type === 'rescheduled' && data.newDate && data.newDate !== data.originalDate) {
    const target = await getSchedule(actor, routine.childId, data.newDate, data.newDate);
    const conflict = target.occurrences.some((occurrence: any) =>
      occurrence.routineId === routineId && occurrence.status !== 'rescheduled'
      && occurrence.originalDate !== data.originalDate
    );
    if (conflict) throw badRequest('This routine already has a class on that date. Please choose another date.');
  }
  const payload = {
    routineId,
    originalDate: new Date(data.originalDate),
    type: data.type,
    newDate: data.newDate ? new Date(data.newDate) : null,
    newStartTime: data.newStartTime,
    note: data.note,
  };
  try {
    return await prisma.routineException.upsert({
      where: { routineId_originalDate: { routineId, originalDate: payload.originalDate } },
      create: payload,
      update: { type: payload.type, newDate: payload.newDate, newStartTime: payload.newStartTime, note: payload.note },
    });
  } catch {
    const e = { id: 'exc-' + Date.now(), ...payload, childId: routine.childId, ownerId: actor.ownerId };
    const existing = store.exceptions.forChild(actor.ownerId, routine.childId)
      .find((row: any) => row.routineId === routineId && new Date(row.originalDate).toISOString().slice(0, 10) === payload.originalDate.toISOString().slice(0, 10));
    if (existing) store.exceptions.remove(existing.id);
    store.exceptions.add(e as any);
    return e;
  }
}

export async function deleteException(actor: Actor, exceptionId: string) {
  // The exception is owned through its routine — assert on the routine's child.
  await assertEntityAccess(actor, { kind: 'exception', id: exceptionId });
  try {
    await prisma.routineException.delete({ where: { id: exceptionId } });
  } catch {
    store.exceptions.remove(exceptionId);
  }
  return { message: 'Deleted' };
}

// Core: compute occurrences for date range on demand, timezone Asia/Dhaka
export async function getSchedule(actor: Actor, childId: string, from: string, to: string) {
  await assertChildAccess(actor, childId);
  const routines = await listRoutines(actor, childId);
  // fetch exceptions
  let exceptions: any[] = [];
  try {
    exceptions = await prisma.routineException.findMany({ where: { routineId: { in: routines.map((r: any) => r.id) } } });
  } catch {
    exceptions = store.exceptions
      .forChild(actor.ownerId, childId)
      .filter((e: any) => routines.some((r: any) => r.id === e.routineId));
  }

  const fromDate = new Date(from);
  const toDate = new Date(to);
  const occurrences: any[] = [];

  // helper to format date as YYYY-MM-DD in Asia/Dhaka
  const toKey = (d: Date) => d.toISOString().slice(0, 10);
  // For each routine, generate occurrences
  for (const r of routines) {
    const start = new Date(r.startsOn);
    const end = r.endsOn ? new Date(r.endsOn) : toDate;
    let cur = new Date(Math.max(start.getTime(), fromDate.getTime()));
    // iterate day by day
    for (let d = new Date(cur); d <= toDate && d <= end; d.setDate(d.getDate() + 1)) {
      const weekday = d.getUTCDay(); // 0 Sun
      if (!r.weekdays.includes(weekday)) continue;
      const key = toKey(d);
      // check exception for this date
      const exc = exceptions.find((e: any) => toKey(new Date(e.originalDate)) === key && e.routineId === r.id);
      if (exc) {
        if (exc.type === 'cancelled') continue;
        if (exc.type === 'rescheduled') {
          occurrences.push({
            routineId: r.id,
            name: r.name,
            periodName: r.periodName,
            teacher: r.teacher,
            room: r.room,
            subjectId: r.subjectId,
            subject: r.subject,
            source: r.source,
            date: key,
            startTime: r.startTime,
            durationMin: r.durationMin,
            status: 'rescheduled',
            originalDate: key,
            newDate: exc.newDate ? toKey(new Date(exc.newDate)) : null,
            newStartTime: exc.newStartTime,
          });
          continue;
        }
      }
      occurrences.push({
        routineId: r.id,
        name: r.name,
        periodName: r.periodName,
        teacher: r.teacher,
        room: r.room,
        subjectId: r.subjectId,
        subject: r.subject,
        source: r.source,
        date: key,
        startTime: r.startTime,
        durationMin: r.durationMin,
        status: 'scheduled',
      });
    }
  }
  // A moved occurrence belongs to the destination query even if its original day
  // is outside that query. Generate it independently of the normal weekday loop.
  for (const exception of exceptions.filter((e: any) => e.type === 'rescheduled' && e.newDate)) {
    const date = toKey(new Date(exception.newDate));
    if (date < from || date > to) continue;
    const routine = routines.find((r: any) => r.id === exception.routineId);
    if (!routine) continue;
    occurrences.push({
      routineId: routine.id, name: routine.name, subject: routine.subject,
      periodName: routine.periodName, teacher: routine.teacher, room: routine.room,
      subjectId: routine.subjectId, source: routine.source, date,
      startTime: exception.newStartTime || routine.startTime,
      durationMin: routine.durationMin, status: 'extra_from_reschedule',
      originalDate: toKey(new Date(exception.originalDate)),
    });
  }
  // handle extra exceptions not tied to weekday
  for (const e of exceptions.filter((x: any) => x.type === 'extra')) {
    const k = toKey(new Date(e.originalDate));
    if (new Date(k) >= fromDate && new Date(k) <= toDate) {
      const routine = routines.find((r: any) => r.id === e.routineId) as any;
      occurrences.push({
        routineId: e.routineId,
        name: routine?.name || 'Extra',
        periodName: routine?.periodName,
        teacher: routine?.teacher,
        room: routine?.room,
        subjectId: routine?.subjectId,
        source: routine?.source || 'self_study',
        date: k,
        startTime: e.newStartTime || '09:00',
        durationMin: routine?.durationMin || 60,
        status: 'extra',
        note: e.note,
      });
    }
  }

  occurrences.sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));

  return { occurrences, missed: [] };
}

/**
 * The completions for a child within a date range.
 *
 * The schedule page used to keep these in `localStorage` only, so the server never
 * learned that a session had been done and the parent's dashboard could not reflect
 * it. They are now real rows.
 */
export async function listCompletions(actor: Actor, childId: string, from?: string, to?: string) {
  await assertChildAccess(actor, childId);

  const fromDate = from ? new Date(from) : new Date(Date.now() - 1000 * 60 * 60 * 24 * 90);
  const toDate = to ? new Date(to) : new Date(Date.now() + 1000 * 60 * 60 * 24 * 90);

  try {
    const rows: any[] = await prisma.routineCompletion.findMany({
      where: {
        childId,
        date: { gte: fromDate, lte: toDate },
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });
    return rows.map(toCompletionDto);
  } catch {
    return store.routineCompletions
      .forChild(actor.ownerId, childId)
      .filter((c: any) => {
        const d = new Date(c.date);
        return d >= fromDate && d <= toDate;
      })
      .map(toCompletionDto);
  }
}

/**
 * Mark (or unmark) one scheduled session as completed.
 *
 * The occurrence key is `(childId, date, startTime)` — the same key the schedule page
 * uses to identify a session — so the write is idempotent and two parents tapping
 * the same session cannot create duplicate rows.
 */
export async function setCompletion(
  actor: Actor,
  childId: string,
  data: { date: string; startTime: string; routineId?: string | null; completed?: boolean }
) {
  await assertChildAccess(actor, childId);

  const date = toDateOnly(data.date);
  const startTime = String(data.startTime || '').slice(0, 5);
  const completed = data.completed !== false;
  const routineId = data.routineId || null;

  try {
    const row = await prisma.routineCompletion.upsert({
      where: { childId_date_startTime: { childId, date, startTime } },
      create: { childId, date, startTime, routineId, completed },
      update: { completed, routineId },
    });
    return toCompletionDto(row);
  } catch {
    // Degraded mode — the mem store is tenant-partitioned, so the same isolation
    // rule applies to the fallback path.
    const existing = store.routineCompletions
      .forChild(actor.ownerId, childId)
      .find((c: any) => c.date === date && c.startTime === startTime);

    if (existing) {
      existing.completed = completed;
      existing.routineId = routineId;
      existing.completedAt = new Date().toISOString();
      return toCompletionDto(existing);
    }

    const row = {
      id: 'rc-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      ownerId: actor.ownerId,
      childId,
      routineId,
      date,
      startTime,
      completed,
      completedAt: new Date().toISOString(),
    };
    store.routineCompletions.add(row as any);
    return toCompletionDto(row);
  }
}

/** Normalise a date to `YYYY-MM-DD` (the DB column is a `@db.Date`). */
function toDateOnly(value: string | Date): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const raw = String(value || '').trim();
  const match = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1];
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? raw.slice(0, 10) : parsed.toISOString().slice(0, 10);
}

/** Shape a completion row for the API. */
function toCompletionDto(row: any) {
  return {
    id: row.id,
    childId: row.childId,
    routineId: row.routineId ?? null,
    date: toDateOnly(row.date),
    startTime: row.startTime,
    completed: row.completed !== false,
    completedAt: row.completedAt instanceof Date ? row.completedAt.toISOString() : row.completedAt,
  };
}

/**
 * Load a routine the actor is allowed to touch.
 *
 * The ownership check itself lives in `core/tenancy` — this only resolves the row.
 *
 * The child row is projected, not included wholesale: `Child` carries `passwordHash`
 * and `pinHash`, and `updateRoutine` returns this object straight to the browser.
 */
async function findRoutine(actor: Actor, routineId: string) {
  try {
    const r: any = await prisma.routine.findUnique({
      where: { id: routineId },
      include: {
        child: {
          select: { id: true, name: true, nickname: true, grade: true, curriculum: true, medium: true, avatar: true },
        },
      },
    });
    if (!r) throw notFound('Routine not found');
    return r;
  } catch (e: any) {
    if (e.statusCode) throw e;
    const r = store.routines.find(actor.ownerId, routineId);
    if (!r) throw notFound('Routine not found');
    return r;
  }
}
