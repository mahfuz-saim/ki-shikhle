import { prisma } from '../../db/client';

const memNotifs: any[] = [];

export async function list(userId: string) {
  try { return await prisma.notification.findMany({ where:{ userId}, orderBy:{createdAt:'desc'}, take:50}); }
  catch { return memNotifs.filter((n:any)=> n.userId===userId); }
}
export async function markRead(userId: string, id:string){
  try { return await prisma.notification.update({ where:{id}, data:{ readAt: new Date()}}); }
  catch { const n=memNotifs.find((x:any)=> x.id===id); if(n) n.readAt=new Date(); return n; }
}
export async function markAllRead(userId:string){
  try { await prisma.notification.updateMany({ where:{userId, readAt:null}, data:{readAt:new Date()}}); } catch {}
  return { message:'All read' };
}
export async function create(userId:string, type:string, payload:any){
  try { return await prisma.notification.create({ data:{ userId, type: type as any, payloadJson: payload}}); }
  catch { const n={id:'notif-'+Date.now(), userId, type, payloadJson: payload, readAt:null, createdAt:new Date().toISOString()}; memNotifs.push(n); return n; }
}
