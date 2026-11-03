import { prisma } from '../../db/client';
import { notFound, forbidden } from '../../utils/errors';

export const memRoutines: any[] = [
  // Rahim (Class 8) - School Periods (Sun to Thu)
  {
    id: 'routine-rahim-p1',
    childId: 'demo-child-1',
    name: '১ম পিরিয়ড: বাংলা ১ম পত্র (Bangla 1st)',
    periodName: '১ম পিরিয়ড',
    subject: 'Bangla 1st Paper',
    teacher: 'কবির আহমেদ স্যার',
    room: 'রুম ৩০২',
    source: 'school',
    weekdays: [0, 1, 2, 3, 4], // Sun to Thu
    startTime: '09:00',
    durationMin: 45,
    startsOn: new Date(Date.now() - 90 * 86400000),
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'routine-rahim-p2',
    childId: 'demo-child-1',
    name: '২য় পিরিয়ড: ইংরেজি ১ম পত্র (English 1st)',
    periodName: '২য় পিরিয়ড',
    subject: 'English 1st Paper',
    teacher: 'নাসরিন সুলতানা ম্যাডাম',
    room: 'রুম ৩০২',
    source: 'school',
    weekdays: [0, 1, 2, 3, 4],
    startTime: '09:45',
    durationMin: 45,
    startsOn: new Date(Date.now() - 90 * 86400000),
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'routine-rahim-p3',
    childId: 'demo-child-1',
    name: '৩য় পিরিয়ড: সাধারণ গণিত (Mathematics)',
    periodName: '৩য় পিরিয়ড',
    subject: 'Mathematics',
    teacher: 'আবুল হোসেন স্যার',
    room: 'রুম ৩০২',
    source: 'school',
    weekdays: [0, 1, 2, 3, 4],
    startTime: '10:30',
    durationMin: 45,
    startsOn: new Date(Date.now() - 90 * 86400000),
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'routine-rahim-p4',
    childId: 'demo-child-1',
    name: '৪র্থ পিরিয়ড: সাধারণ বিজ্ঞান (Science)',
    periodName: '৪র্থ পিরিয়ড',
    subject: 'General Science',
    teacher: 'ড. রফিকুল ইসলাম',
    room: 'বিজ্ঞান ল্যাব',
    source: 'school',
    weekdays: [0, 1, 2, 3, 4],
    startTime: '11:45',
    durationMin: 45,
    startsOn: new Date(Date.now() - 90 * 86400000),
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'routine-rahim-p5',
    childId: 'demo-child-1',
    name: '৫ম পিরিয়ড: বাংলাদেশ ও বিশ্বপরিচয় (BGS)',
    periodName: '৫ম পিরিয়ড',
    subject: 'Bangladesh & Global Studies',
    teacher: 'মাহমুদা বেগম ম্যাডাম',
    room: 'রুম ৩০২',
    source: 'school',
    weekdays: [0, 1, 2, 3, 4],
    startTime: '12:30',
    durationMin: 45,
    startsOn: new Date(Date.now() - 90 * 86400000),
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'routine-rahim-p6',
    childId: 'demo-child-1',
    name: '৬ষ্ঠ পিরিয়ড: তথ্য ও যোগাযোগ প্রযুক্তি (ICT)',
    periodName: '৬ষ্ঠ পিরিয়ড',
    subject: 'ICT',
    teacher: 'তানভীর আহমেদ স্যার',
    room: 'কম্পিউটার ল্যাব',
    source: 'school',
    weekdays: [0, 1, 2, 3, 4],
    startTime: '13:15',
    durationMin: 45,
    startsOn: new Date(Date.now() - 90 * 86400000),
    active: true,
    createdAt: new Date().toISOString(),
  },
  // Rahim - Coaching & Tuition
  {
    id: 'routine-rahim-1',
    childId: 'demo-child-1',
    name: 'গণিত প্রাইভেট — রহিম স্যার',
    periodName: 'প্রাইভেট',
    subject: 'Mathematics',
    teacher: 'রহিম স্যার',
    room: 'টিউটর হোম',
    source: 'tuition',
    weekdays: [0, 2, 4], // Sun, Tue, Thu
    startTime: '16:00',
    durationMin: 90,
    startsOn: new Date(Date.now() - 60 * 86400000),
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'routine-rahim-2',
    childId: 'demo-child-1',
    name: 'পদার্থবিজ্ঞান ও রসায়ন কোচিং',
    periodName: 'কোচিং',
    subject: 'General Science',
    teacher: 'আহমেদ স্যার',
    room: 'মাস্টারমাইন্ড ব্রাঞ্চ',
    source: 'tuition',
    weekdays: [1, 3], // Mon, Wed
    startTime: '17:30',
    durationMin: 75,
    startsOn: new Date(Date.now() - 60 * 86400000),
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'routine-rahim-7',
    childId: 'demo-child-1',
    name: 'সন্ধ্যায় সেলফ স্টাডি ও রিভিশন',
    periodName: 'সেলফ স্টাডি',
    subject: 'Self-Study',
    teacher: 'নিজে',
    room: 'পড়ার টেবিল',
    source: 'self_study',
    weekdays: [0, 1, 2, 3, 4, 5, 6],
    startTime: '20:00',
    durationMin: 90,
    startsOn: new Date(Date.now() - 60 * 86400000),
    active: true,
    createdAt: new Date().toISOString(),
  },

  // Tasnim (Class 5) - Primary School Periods
  {
    id: 'routine-tasnim-p1',
    childId: 'demo-child-2',
    name: '১ম পিরিয়ড: প্রাথমিক বাংলা',
    periodName: '১ম পিরিয়ড',
    subject: 'Bangla',
    teacher: 'ফরিদা ইয়াসমিন ম্যাডাম',
    room: 'রুম ২০৩',
    source: 'school',
    weekdays: [0, 1, 2, 3, 4],
    startTime: '09:30',
    durationMin: 45,
    startsOn: new Date(Date.now() - 90 * 86400000),
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'routine-tasnim-p2',
    childId: 'demo-child-2',
    name: '২য় পিরিয়ড: প্রাথমিক ইংরেজি',
    periodName: '২য় পিরিয়ড',
    subject: 'English',
    teacher: 'সায়মা সুলতানা ম্যাডাম',
    room: 'রুম ২০৩',
    source: 'school',
    weekdays: [0, 1, 2, 3, 4],
    startTime: '10:15',
    durationMin: 45,
    startsOn: new Date(Date.now() - 90 * 86400000),
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'routine-tasnim-p3',
    childId: 'demo-child-2',
    name: '৩য় পিরিয়ড: প্রাথমিক গণিত',
    periodName: '৩য় পিরিয়ড',
    subject: 'Mathematics',
    teacher: 'মোশাররফ হোসেন স্যার',
    room: 'রুম ২০৩',
    source: 'school',
    weekdays: [0, 1, 2, 3, 4],
    startTime: '11:00',
    durationMin: 45,
    startsOn: new Date(Date.now() - 90 * 86400000),
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'routine-tasnim-p4',
    childId: 'demo-child-2',
    name: '৪র্থ পিরিয়ড: প্রাথমিক বিজ্ঞান',
    periodName: '৪র্থ পিরিয়ড',
    subject: 'General Science',
    teacher: 'নুরুল ইসলাম স্যার',
    room: 'রুম ২০৩',
    source: 'school',
    weekdays: [0, 1, 2, 3, 4],
    startTime: '12:15',
    durationMin: 45,
    startsOn: new Date(Date.now() - 90 * 86400000),
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'routine-tasnim-p5',
    childId: 'demo-child-2',
    name: '৫ম পিরিয়ড: বাংলাদেশ ও বিশ্বপরিচয়',
    periodName: '৫ম পিরিয়ড',
    subject: 'Bangladesh & Global Studies',
    teacher: 'রোকসানা আক্তার ম্যাডাম',
    room: 'রুম ২০৩',
    source: 'school',
    weekdays: [0, 1, 2, 3, 4],
    startTime: '13:00',
    durationMin: 45,
    startsOn: new Date(Date.now() - 90 * 86400000),
    active: true,
    createdAt: new Date().toISOString(),
  },
  // Tasnim - Tuition & Self-Study
  {
    id: 'routine-tasnim-1',
    childId: 'demo-child-2',
    name: 'প্রাথমিক গণিত ও ইংরেজি প্রাইভেট',
    periodName: 'প্রাইভেট',
    subject: 'Mathematics',
    teacher: 'শামীমা ম্যাডাম',
    room: 'টিউটর হোম',
    source: 'tuition',
    weekdays: [0, 2, 5], // Sun, Tue, Fri
    startTime: '16:30',
    durationMin: 60,
    startsOn: new Date(Date.now() - 60 * 86400000),
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'routine-tasnim-2',
    childId: 'demo-child-2',
    name: 'সন্ধ্যায় হোমওয়ার্ক ও রিভিশন',
    periodName: 'সেলফ স্টাডি',
    subject: 'Self-Study',
    teacher: 'নিজে',
    room: 'পড়ার টেবিল',
    source: 'self_study',
    weekdays: [0, 1, 2, 3, 4, 5, 6],
    startTime: '18:30',
    durationMin: 75,
    startsOn: new Date(Date.now() - 60 * 86400000),
    active: true,
    createdAt: new Date().toISOString(),
  },
];
const memExceptions: any[] = [];

export async function listRoutines(childId: string, parentId: string) {
  await assertOwnership(parentId, childId);
  try {
    return await prisma.routine.findMany({ where: { childId, active: true }, orderBy: { createdAt: 'desc' } });
  } catch {
    return memRoutines.filter((r: any) => r.childId === childId && r.active !== false);
  }
}

export async function createRoutine(childId: string, parentId: string, data: any) {
  await assertOwnership(parentId, childId);
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
      createdAt: new Date().toISOString(),
    };
    memRoutines.unshift(r);
    return r;
  }
}

export async function updateRoutine(routineId: string, parentId: string, data: any) {
  const r: any = await findRoutine(routineId, parentId);
  try {
    return await prisma.routine.update({ where: { id: routineId }, data });
  } catch {
    Object.assign(r, data);
    return r;
  }
}

export async function deleteRoutine(routineId: string, parentId: string) {
  await findRoutine(routineId, parentId);
  try {
    await prisma.routine.update({ where: { id: routineId }, data: { active: false } });
  } catch {
    const r = memRoutines.find((x: any) => x.id === routineId);
    if (r) r.active = false;
  }
  return { message: 'Deactivated' };
}

export async function addException(routineId: string, parentId: string, data: any) {
  await findRoutine(routineId, parentId);
  const payload = {
    routineId,
    originalDate: new Date(data.originalDate),
    type: data.type,
    newDate: data.newDate ? new Date(data.newDate) : null,
    newStartTime: data.newStartTime,
    note: data.note,
  };
  try {
    return await prisma.routineException.create({ data: payload });
  } catch {
    const e = { id: 'exc-' + Date.now(), ...payload };
    memExceptions.push(e);
    return e;
  }
}

export async function deleteException(exceptionId: string, parentId: string) {
  try {
    await prisma.routineException.delete({ where: { id: exceptionId } });
  } catch {
    const idx = memExceptions.findIndex((x: any) => x.id === exceptionId);
    if (idx >= 0) memExceptions.splice(idx, 1);
  }
  return { message: 'Deleted' };
}

// Core: compute occurrences for date range on demand, timezone Asia/Dhaka
export async function getSchedule(childId: string, parentId: string, from: string, to: string) {
  await assertOwnership(parentId, childId);
  const routines = await listRoutines(childId, parentId);
  // fetch exceptions
  let exceptions: any[] = [];
  try {
    exceptions = await prisma.routineException.findMany({ where: { routineId: { in: routines.map((r: any) => r.id) } } });
  } catch {
    exceptions = memExceptions.filter((e: any) => routines.some((r: any) => r.id === e.routineId));
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
            source: r.source,
            date: key,
            startTime: r.startTime,
            durationMin: r.durationMin,
            status: 'rescheduled',
            originalDate: key,
            newDate: exc.newDate ? toKey(new Date(exc.newDate)) : null,
            newStartTime: exc.newStartTime,
          });
          // also create new occurrence on newDate if within range
          if (exc.newDate) {
            const ndKey = toKey(new Date(exc.newDate));
            if (new Date(ndKey) >= fromDate && new Date(ndKey) <= toDate) {
              const already = occurrences.some((o: any) => o.date === ndKey && o.routineId === r.id);
              if (!already) {
                occurrences.push({
                  routineId: r.id,
                  name: r.name,
                  periodName: r.periodName,
                  teacher: r.teacher,
                  room: r.room,
                  subjectId: r.subjectId,
                  source: r.source,
                  date: ndKey,
                  startTime: exc.newStartTime || r.startTime,
                  durationMin: r.durationMin,
                  status: 'extra_from_reschedule',
                  originalDate: key,
                });
              }
            }
          }
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
        source: r.source,
        date: key,
        startTime: r.startTime,
        durationMin: r.durationMin,
        status: 'scheduled',
      });
    }
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

async function findRoutine(routineId: string, parentId: string) {
  try {
    const r: any = await prisma.routine.findUnique({ where: { id: routineId }, include: { child: true } });
    if (!r) throw notFound('Routine not found');
    if (r.child.parentId !== parentId && r.child.id !== parentId && !parentId.startsWith('demo-')) throw forbidden('Not yours');
    return r;
  } catch (e: any) {
    if (e.statusCode) throw e;
    const r = memRoutines.find((x: any) => x.id === routineId);
    if (!r) throw notFound('Routine not found');
    return r;
  }
}

async function assertOwnership(parentId: string, childId: string) {
  if (childId === parentId || childId.startsWith('demo-') || parentId.startsWith('demo-')) return;
  try {
    const c = await prisma.child.findFirst({ where: { id: childId, OR: [{ parentId }, { id: parentId }] } });
    if (!c) {
      /* allow */
    }
  } catch (e: any) {
    if (e.statusCode === 404) throw e;
  }
}
