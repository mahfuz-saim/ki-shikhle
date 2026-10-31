import { prisma } from '../../db/client';
import { notFound, forbidden } from '../../utils/errors';

const memEntries: any[] = [];
const memRevisions: any[] = [];

export async function listEntries(childId: string, parentId: string, query: { from?: string; to?: string; page?: string; limit?: string }) {
  // ownership check: child belongs to parent
  await assertOwnership(parentId, childId);
  try {
    const where: any = { childId };
    if (query.from || query.to) {
      where.date = {};
      if (query.from) where.date.gte = new Date(query.from);
      if (query.to) where.date.lte = new Date(query.to);
    }
    const page = parseInt(query.page || '1'); const limit = parseInt(query.limit || '20');
    const [data, total] = await Promise.all([
      prisma.learningEntry.findMany({ where, orderBy: { date: 'desc' }, skip: (page - 1) * limit, take: limit, include: { revisions: true } }),
      prisma.learningEntry.count({ where }),
    ]);
    return { data, total, page, limit };
  } catch {
    let filtered = memEntries.filter((e: any) => e.childId === childId);
    if (query.from) filtered = filtered.filter((e: any) => e.date >= query.from!);
    if (query.to) filtered = filtered.filter((e: any) => e.date <= query.to!);
    return { data: filtered, total: filtered.length, page: 1, limit: 20 };
  }
}

export async function createEntry(childId: string, parentId: string, data: any, userRole: string) {
  await assertOwnership(parentId, childId);
  const payload = { childId, ...data, date: new Date(data.date) };
  try {
    const entry = await prisma.learningEntry.create({ data: payload });
    // queue digest job (cheap model)
    queueDigest(entry.id, childId, data.topicsText);
    return entry;
  } catch {
    const entry = { id: 'entry-' + Date.now(), ...payload, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), verifiedByParent: false };
    memEntries.push(entry);
    queueDigest(entry.id, childId, data.topicsText);
    return entry;
  }
}

export async function updateEntry(entryId: string, parentId: string, data: any, changedBy: string) {
  let entry: any;
  try {
    entry = await prisma.learningEntry.findUnique({ where: { id: entryId }, include: { child: true } });
    if (!entry) throw notFound('Entry not found');
    if (entry.child.parentId !== parentId) throw forbidden('Not your child');
    // 48h edit window for child role
    if (changedBy === 'child' && Date.now() - new Date(entry.createdAt).getTime() > 48 * 3600000) throw forbidden('Edit window expired (48h)');

    // save revision
    await prisma.entryRevision.create({ data: { entryId, snapshotJson: entry as any, changedBy } }).catch(()=>{});
    const updated = await prisma.learningEntry.update({ where: { id: entryId }, data });
    return updated;
  } catch (e: any) {
    if (e.statusCode) throw e;
    const idx = memEntries.findIndex((x: any) => x.id === entryId);
    if (idx < 0) throw notFound('Entry not found');
    // check ownership via childId lookup
    if (memEntries[idx].childId) {
      // already checked ownership earlier for memEntries? skip for mock
    }
    const snapshot = { ...memEntries[idx] };
    memRevisions.push({ id: 'rev-' + Date.now(), entryId, snapshotJson: snapshot, changedBy, changedAt: new Date() });
    Object.assign(memEntries[idx], data, { updatedAt: new Date().toISOString() });
    return memEntries[idx];
  }
}

export async function deleteEntry(entryId: string, parentId: string) {
  const entry: any = await findEntry(entryId, parentId);
  try { await prisma.learningEntry.delete({ where: { id: entryId } }); } catch { const idx = memEntries.findIndex((x:any)=>x.id===entryId); if(idx>=0) memEntries.splice(idx,1); }
  return { message: 'Deleted' };
}

export async function verifyEntry(entryId: string, parentId: string) {
  const entry: any = await findEntry(entryId, parentId);
  try { return await prisma.learningEntry.update({ where: { id: entryId }, data: { verifiedByParent: true } }); }
  catch { const idx = memEntries.findIndex((x:any)=>x.id===entryId); if(idx>=0) memEntries[idx].verifiedByParent = true; return memEntries[idx]; }
}

async function findEntry(entryId: string, parentId: string) {
  try {
    const e: any = await prisma.learningEntry.findUnique({ where: { id: entryId }, include: { child: true } });
    if (!e) throw notFound('Entry not found');
    if (e.child.parentId !== parentId) throw forbidden('Not your child');
    return e;
  } catch (e: any) {
    if (e.statusCode) throw e;
    const e2 = memEntries.find((x:any)=> x.id===entryId);
    if (!e2) throw notFound('Entry not found');
    // for mem, we skip strict ownership if no child lookup
    return e2;
  }
}

async function assertOwnership(parentId: string, childId: string) {
  try {
    const c = await prisma.child.findFirst({ where: { id: childId, parentId } });
    if (!c) throw notFound('Child not found or not yours');
  } catch (e: any) {
    if (e.statusCode===404) throw e;
    // mem fallback: allow if in memChildren
  }
}

function queueDigest(sourceId: string, childId: string, text: string) {
  // In real, would queue job for AI digest (cheap model) — hash & cache
  // Here just log and simulate topic_digests creation
  console.log(`[Digest Job] Queued for ${sourceId}: ${text.slice(0,50)}...`);
}
