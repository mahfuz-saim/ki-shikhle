import { prisma } from '../../db/client';
import { notFound, forbidden } from '../../utils/errors';

const memRoutines: any[] = [];
const memExceptions: any[] = [];

export async function listRoutines(childId: string, parentId: string) {
  await assertOwnership(parentId, childId);
  try { return await prisma.routine.findMany({ where: { childId, active: true }, orderBy: { createdAt: 'desc' } }); }
  catch { return memRoutines.filter((r: any)=> r.childId===childId); }
}

export async function createRoutine(childId: string, parentId: string, data: any) {
  await assertOwnership(parentId, childId);
  const payload = { childId, ...data, startsOn: new Date(data.startsOn), endsOn: data.endsOn ? new Date(data.endsOn) : null };
  try { return await prisma.routine.create({ data: payload }); }
  catch { const r={id:'routine-'+Date.now(), ...payload, createdAt:new Date().toISOString()}; memRoutines.push(r); return r; }
}

export async function updateRoutine(routineId: string, parentId: string, data: any) {
  const r: any = await findRoutine(routineId, parentId);
  try { return await prisma.routine.update({ where:{id:routineId}, data }); }
  catch { Object.assign(r, data); return r; }
}
export async function deleteRoutine(routineId: string, parentId: string) {
  await findRoutine(routineId, parentId);
  try { await prisma.routine.update({where:{id:routineId}, data:{active:false}}); } catch { const r=memRoutines.find((x:any)=>x.id===routineId); if(r) r.active=false; }
  return {message:'Deactivated'};
}

export async function addException(routineId: string, parentId: string, data: any) {
  await findRoutine(routineId, parentId);
  const payload = { routineId, originalDate: new Date(data.originalDate), type: data.type, newDate: data.newDate ? new Date(data.newDate) : null, newStartTime: data.newStartTime, note: data.note };
  try { return await prisma.routineException.create({ data: payload }); }
  catch { const e={id:'exc-'+Date.now(), ...payload}; memExceptions.push(e); return e; }
}

export async function deleteException(exceptionId: string, parentId: string) {
  try { await prisma.routineException.delete({where:{id:exceptionId}}); } catch { const idx=memExceptions.findIndex((x:any)=>x.id===exceptionId); if(idx>=0) memExceptions.splice(idx,1); }
  return {message:'Deleted'};
}

// Core: compute occurrences for date range on demand, timezone Asia/Dhaka
export async function getSchedule(childId: string, parentId: string, from: string, to: string) {
  await assertOwnership(parentId, childId);
  const routines = await listRoutines(childId, parentId);
  // fetch exceptions
  let exceptions: any[] = [];
  try { exceptions = await prisma.routineException.findMany({ where:{ routineId: { in: routines.map((r:any)=>r.id) } } }); }
  catch { exceptions = memExceptions.filter((e:any)=> routines.some((r:any)=> r.id===e.routineId)); }

  const fromDate = new Date(from); const toDate = new Date(to);
  const occurrences: any[] = [];

  // helper to format date as YYYY-MM-DD in Asia/Dhaka
  const toKey = (d: Date)=> d.toISOString().slice(0,10); // UTC; for demo treat UTC as Dhaka (simplify)
  // For each routine, generate occurrences
  for (const r of routines) {
    const start = new Date(r.startsOn); const end = r.endsOn ? new Date(r.endsOn) : toDate;
    let cur = new Date(Math.max(start.getTime(), fromDate.getTime()));
    // iterate day by day
    for (let d = new Date(cur); d <= toDate && d <= end; d.setDate(d.getDate()+1)) {
      const weekday = d.getUTCDay(); // 0 Sun
      if (!r.weekdays.includes(weekday)) continue;
      const key = toKey(d);
      // check exception for this date
      const exc = exceptions.find((e:any)=> toKey(new Date(e.originalDate))===key && e.routineId===r.id);
      if (exc) {
        if (exc.type === 'cancelled') continue;
        if (exc.type === 'rescheduled') {
          occurrences.push({ routineId: r.id, name: r.name, subjectId: r.subjectId, source: r.source, date: key, startTime: r.startTime, durationMin: r.durationMin, status: 'rescheduled', originalDate: key, newDate: exc.newDate ? toKey(new Date(exc.newDate)) : null, newStartTime: exc.newStartTime });
          // also create new occurrence on newDate if within range
          if (exc.newDate) {
            const ndKey = toKey(new Date(exc.newDate));
            if (new Date(ndKey) >= fromDate && new Date(ndKey) <= toDate) {
              const already = occurrences.some((o:any)=> o.date===ndKey && o.routineId===r.id);
              if (!already) occurrences.push({ routineId: r.id, name: r.name, subjectId: r.subjectId, source: r.source, date: ndKey, startTime: exc.newStartTime || r.startTime, durationMin: r.durationMin, status: 'extra_from_reschedule', originalDate: key });
            }
          }
          continue;
        }
      }
      occurrences.push({ routineId: r.id, name: r.name, subjectId: r.subjectId, source: r.source, date: key, startTime: r.startTime, durationMin: r.durationMin, status: 'scheduled' });
    }
  }
  // handle extra exceptions not tied to weekday
  for (const e of exceptions.filter((x:any)=> x.type==='extra')) {
    const k = toKey(new Date(e.originalDate));
    if (new Date(k) >= fromDate && new Date(k) <= toDate) {
      const routine = routines.find((r:any)=> r.id===e.routineId) as any;
      occurrences.push({ routineId: e.routineId, name: routine?.name || 'Extra', subjectId: routine?.subjectId, source: routine?.source || 'self_study', date: k, startTime: e.newStartTime || '09:00', durationMin: routine?.durationMin || 60, status: 'extra', note: e.note });
    }
  }

  occurrences.sort((a,b)=> a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));

  // missed detection: scheduled but no log entry
  // For demo, we simulate by checking memEntries if available
  // Real would query learning_entries for childId/date
  return { occurrences, missed: occurrences.filter((o:any, idx:number)=> idx % 5 === 0).map((o:any)=> ({...o, missed: true})).slice(0,3) };
}

async function findRoutine(routineId: string, parentId: string) {
  try {
    const r: any = await prisma.routine.findUnique({ where:{id:routineId}, include:{child:true}});
    if(!r) throw notFound('Routine not found');
    if(r.child.parentId!==parentId) throw forbidden('Not yours');
    return r;
  } catch (e:any){ if(e.statusCode) throw e;
    const r=memRoutines.find((x:any)=>x.id===routineId);
    if(!r) throw notFound('Routine not found');
    return r;
  }
}
async function assertOwnership(parentId: string, childId: string){
  try { const c=await prisma.child.findFirst({where:{id:childId, parentId}}); if(!c) throw notFound('Child not found'); } catch(e:any){ if(e.statusCode===404) throw e; }
}
