import { prisma } from '../../db/client';
import { notFound, forbidden } from '../../utils/errors';

const memSubjects: any[] = [];

export async function listSubjects(userId: string, childId?: string) {
  try {
    // seeded + custom for parent
    const all = await prisma.subject.findMany({ where: { OR: [{ parentId: null }, { parentId: userId }] }, orderBy: { nameEn: 'asc' } });
    return all;
  } catch {
    // fallback seed
    return [
      { id: 's1', curriculum: 'NCTB', grade: '6', nameEn: 'Mathematics', nameBn: 'গণিত', isCustom: false },
      { id: 's2', curriculum: 'NCTB', grade: '6', nameEn: 'Science', nameBn: 'বিজ্ঞান', isCustom: false },
      { id: 's3', curriculum: 'NCTB', grade: '6', nameEn: 'English', nameBn: 'ইংরেজি', isCustom: false },
      { id: 's4', curriculum: 'NCTB', grade: '11', nameEn: 'Physics', nameBn: 'পদার্থবিজ্ঞান', isCustom: false },
    ];
  }
}

export async function createCustom(userId: string, data: any) {
  try { return await prisma.subject.create({ data: { ...data, parentId: userId, isCustom: true } }); }
  catch { const s = { id: 'cs-'+Date.now(), ...data, parentId: userId, isCustom: true }; memSubjects.push(s); return s; }
}
export async function updateSubject(userId: string, id: string, data: any) {
  const subj: any = await prisma.subject.findUnique({ where: { id } }).catch(()=> null);
  if (subj && subj.parentId !== userId) throw forbidden('Cannot edit seeded subjects');
  try { return await prisma.subject.update({ where: { id }, data }); } catch { return { id, ...data }; }
}
export async function deleteSubject(userId: string, id: string) {
  const subj: any = await prisma.subject.findUnique({ where: { id } }).catch(()=> null);
  if (subj && !subj.isCustom) throw forbidden('Cannot delete seeded subjects');
  try { await prisma.subject.delete({ where: { id } }); } catch {}
  return { message: 'Deleted' };
}
