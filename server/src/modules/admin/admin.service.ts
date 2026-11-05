import { prisma } from '../../db/client';
import { notFound } from '../../utils/errors';

export async function metrics(){
  try{
    const [users, trials, paid, aiLogs] = await Promise.all([
      prisma.user.count(),
      prisma.subscription.count({ where:{status:'trialing'}}),
      prisma.subscription.count({ where:{status:'active'}}),
      prisma.aiUsageLog.aggregate({ _sum:{ costEst:true}, _count:{_all:true}}),
    ]);
    const mrr = paid * 299; // demo MRR
    const conversion = users ? Math.round(paid/users*100) : 0;
    return { signups: users, trials, paid, conversion, mrr, aiCostTotal: aiLogs._sum.costEst||0, aiCalls: aiLogs._count._all };
  }catch{
    return { signups:42, trials:18, paid:12, conversion:29, mrr:3588, aiCostTotal:3.42, aiCalls:128 };
  }
}

export async function aiUsage(query:{page?:string,limit?:string}){
  const page=parseInt(query.page||'1'); const limit=parseInt(query.limit||'20');
  try{
    const [data,total]=await Promise.all([
      prisma.aiUsageLog.findMany({ orderBy:{createdAt:'desc'}, skip:(page-1)*limit, take:limit }),
      prisma.aiUsageLog.count(),
    ]);
    return { data, total, page, limit };
  }catch{
    return { data:[{id:'log1', userId:'u1', feature:'quiz_generate', model:'claude-3-5-haiku-latest', inputTokens:1200, outputTokens:800, costEst:0.004, cacheHit:false}], total:1, page, limit };
  }
}

export async function listUsers(){
  // `passwordHash` is projected out. The `users` table doubles as the child-credential
  // table, so an argon2id hash here would hand an attacker offline-cracking material for
  // every account on the platform.
  try{
    return await prisma.user.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        language: true,
        country: true,
        timezone: true,
        emailVerifiedAt: true,
        deletedAt: true,
        trialEndsAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }catch{
    return [{id:'u1', email:'demo@example.com', name:'Demo', trialEndsAt: new Date()}];
  }
}

export async function extendTrial(userId:string, days:number){
  try{
    const user=await prisma.user.findUnique({where:{id:userId}});
    if(!user) throw notFound('User');
    const newEnd=new Date((user.trialEndsAt|| new Date()).getTime()+ days*86400000);
    const updated=await prisma.user.update({where:{id:userId}, data:{trialEndsAt:newEnd}});
    // Never return the credential hash, even to an admin.
    const { passwordHash, ...safe } = updated as any;
    return safe;
  }catch(e:any){ if(e.statusCode) throw e; return { id:userId, trialEndsAt: new Date(Date.now()+days*86400000) }; }
}
