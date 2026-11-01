import { prisma } from '../../db/client';
import { storage } from '../../services/storage';
import { callAI, estimateCost } from '../../services/ai';
import crypto from 'crypto';
import { notFound, forbidden } from '../../utils/errors';

const memNotes: any[] = [];

function hashText(t: string) { return crypto.createHash('sha256').update(t.trim()).digest('hex'); }

export async function createNote(childId: string, parentId: string, file: any, body: any) {
  await assertOwnership(parentId, childId);
  let fileUrl: string | undefined; let textClean = body.textClean || body.text || '';
  let ocrConfidence: number | undefined = body.ocrConfidence ? parseFloat(body.ocrConfidence) : undefined;

  if (file) {
    const saved = await storage.save(file.buffer, file.originalname, file.mimetype);
    fileUrl = saved.url;
    if (!textClean) textClean = `[OCR pending - file at ${fileUrl}]`;
  }

  const textHash = textClean ? hashText(textClean) : undefined;
  const payload: any = { childId, subjectId: body.subjectId || null, entryId: body.entryId || null, date: body.date ? new Date(body.date) : new Date(), fileUrl, textClean, textHash, ocrConfidence, status: 'active' };

  try {
    const note = await prisma.note.create({ data: payload });
    if (textHash) {
      const existing = await prisma.topicDigest.findUnique({ where: { textHash } }).catch(()=> null);
      if (!existing) queueDigest('note', note.id, childId, payload.subjectId, textClean);
    }
    return note;
  } catch {
    const note = { id: 'note-' + Date.now(), ...payload, createdAt: new Date().toISOString() };
    memNotes.push(note);
    if (textHash) queueDigest('note', note.id, childId, payload.subjectId, textClean);
    return note;
  }
}

export async function listNotes(childId: string, parentId: string) {
  await assertOwnership(parentId, childId);
  try { return await prisma.note.findMany({ where: { childId }, orderBy: { createdAt: 'desc' } }); }
  catch { return memNotes.filter((n: any)=> n.childId===childId); }
}

export async function updateNote(noteId: string, parentId: string, data: any) {
  const note: any = await findNote(noteId, parentId);
  const textHash = data.textClean ? hashText(data.textClean) : note.textHash;
  const payload = { ...data, textHash };
  try { return await prisma.note.update({ where:{id:noteId}, data: payload }); }
  catch { Object.assign(note, payload); return note; }
}

export async function deleteNote(noteId: string, parentId: string) {
  const note: any = await findNote(noteId, parentId);
  // best-effort: remove the stored file too (local disk or R2 object)
  const key = typeof note.fileUrl === 'string' ? note.fileUrl.split('/').pop() : null;
  if (key) await storage.delete(key).catch(() => {});
  try { await prisma.note.delete({ where:{id:noteId}}); } catch { const idx=memNotes.findIndex((x:any)=>x.id===noteId); if(idx>=0) memNotes.splice(idx,1); }
  return { message: 'Deleted' };
}

export async function aiOcrFallback(noteId: string, parentId: string, userId: string) {
  const note: any = await findNote(noteId, parentId);
  const prompt = { system: 'You are OCR helper. Improve text.', user: `Improve OCR for: ${note.textClean?.slice(0,4000) ?? ''}`, model: 'fast' as const, maxTokens: 2000 };
  const start = Date.now();
  const result = await callAI(prompt);
  const latency = Date.now() - start;
  const improved = result.content.slice(0, 5000);
  const cost = estimateCost(result.inputTokens, result.outputTokens, result.model);
  try { await prisma.aiUsageLog.create({ data: { userId, childId: note.childId, feature: 'ai_ocr', model: result.model, inputTokens: result.inputTokens, outputTokens: result.outputTokens, costEst: cost, latencyMs: latency, status: 'success' } }); } catch {}
  await updateNote(noteId, parentId, { textClean: improved, ocrConfidence: 0.95 });
  return { improvedText: improved, usage: { inputTokens: result.inputTokens, outputTokens: result.outputTokens, costEst: cost, model: result.model } };
}

async function findNote(noteId: string, parentId: string){
  try {
    const n:any = await prisma.note.findUnique({where:{id:noteId}, include:{child:true}});
    if(!n) throw notFound('Note not found');
    if(n.child.parentId!==parentId) throw forbidden('Not yours');
    return n;
  } catch(e:any){ if(e.statusCode) throw e;
    const n=memNotes.find((x:any)=> x.id===noteId);
    if(!n) throw notFound('Note not found');
    return n;
  }
}
async function assertOwnership(parentId: string, childId: string){
  try { const c=await prisma.child.findFirst({where:{id:childId, parentId}}); if(!c) throw notFound('Child not found'); } catch(e:any){ if(e.statusCode===404) throw e; }
}
function queueDigest(sourceType: string, sourceId: string, childId: string, subjectId: string | null, text: string){
  console.log(`[Digest] note ${sourceId}: ${text.slice(0,60)}...`);
}
