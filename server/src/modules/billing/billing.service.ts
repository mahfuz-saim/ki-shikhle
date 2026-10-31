import { prisma } from '../../db/client';
import { paymentProvider } from '../../services/payments';
import { PLANS } from '../../services/entitlements';
import { notFound, badRequest } from '../../utils/errors';

const memSubs: any[] = [];
const memPayments: any[] = [];

export async function getPlans(){
  try { return await prisma.plan.findMany({ where:{active:true}}); }
  catch { return Object.entries(PLANS).map(([code,v])=> ({code, name:v.name, priceBdt:v.priceBdt, priceUsd:v.priceUsd, limitsJson:v.limits, active:true})); }
}

export async function getSubscription(userId:string){
  try {
    const sub = await prisma.subscription.findFirst({ where:{ userId }, include:{plan:true, payments: true}, orderBy:{createdAt:'desc'}});
    if(!sub) return { status:'trialing', plan:{code:'trial'}, currentPeriodEnd: new Date(Date.now()+15*86400000), childSlots:2 };
    // check trial expiry
    const user = await prisma.user.findUnique({ where:{id:userId}});
    if(user?.trialEndsAt && new Date(user.trialEndsAt) < new Date() && sub.status==='trialing'){
      // mark expired + read-only
      // In real, cron would handle; here compute
      return { ...sub, expired:true, readOnly:true, message:'Trial expired — read-only, upgrade to unlock AI' };
    }
    return sub;
  } catch {
    return { id:'sub-mock', userId, plan:{code:'trial', name:'Trial', priceBdt:0}, status:'trialing', childSlots:2, currentPeriodEnd: new Date(Date.now()+15*86400000) };
  }
}

export async function demoCheckout(userId:string, input:{ planCode:string, childCount:number, billingPeriod:'monthly'|'yearly', simulateFailure?:boolean }){
  const plan = (PLANS as any)[input.planCode];
  if(!plan) throw notFound('Plan');
  const sub = await getSubscription(userId) as any;
  // call provider
  const result = await paymentProvider.createCheckout({ userId, planCode: input.planCode, childCount: input.childCount, billingPeriod: input.billingPeriod, simulateFailure: input.simulateFailure });
  if(result.status==='failed') throw badRequest('Payment failed (demo simulation) — try without simulateFailure');

  try {
    const planRec = await prisma.plan.findUnique({ where:{code: input.planCode}});
    const periodEnd = new Date(Date.now()+ (input.billingPeriod==='yearly'? 365:30)*86400000);
    let subscription: any;
    if(sub.id && !sub.id.startsWith('sub-mock')){
      subscription = await prisma.subscription.update({ where:{id: sub.id}, data:{ planId: planRec!.id, status:'active', childSlots: input.childCount, currentPeriodEnd: periodEnd }});
    } else {
      subscription = await prisma.subscription.create({ data:{ userId, planId: planRec!.id, status:'active', childSlots: input.childCount, currentPeriodEnd: periodEnd }});
    }
    const payment = await prisma.payment.create({ data:{ subscriptionId: subscription.id, amount: result.amount, currency: result.currency, provider:'demo', status:'succeeded', isDemo:true, invoiceNo: result.invoiceNo }});
    return { subscription, payment, invoiceNo: result.invoiceNo, amount: result.amount };
  } catch {
    const subMock={ id:'sub-'+Date.now(), userId, plan: {code:input.planCode}, status:'active', childSlots:input.childCount, currentPeriodEnd: new Date(Date.now()+30*86400000)};
    memSubs.push(subMock);
    const pay={ id:'pay-'+Date.now(), subscriptionId:subMock.id, amount: result.amount, invoiceNo: result.invoiceNo, isDemo:true, status:'succeeded'};
    memPayments.push(pay);
    return { subscription: subMock, payment: pay, invoiceNo: result.invoiceNo, amount: result.amount };
  }
}

export async function cancelSubscription(userId:string){
  const sub = await getSubscription(userId) as any;
  if(!sub.id || sub.id.startsWith('sub-mock')) return { message:'Canceled (mock)', cancelAtPeriodEnd:true };
  try {
    const updated = await prisma.subscription.update({ where:{id:sub.id}, data:{ cancelAtPeriodEnd:true}});
    return updated;
  } catch { return { message:'Canceled', cancelAtPeriodEnd:true }; }
}

export async function getInvoices(userId:string){
  try {
    const subs = await prisma.subscription.findMany({ where:{userId}});
    const ids = subs.map((s:any)=> s.id);
    const payments = await prisma.payment.findMany({ where:{ subscriptionId:{ in: ids}}, orderBy:{createdAt:'desc'}});
    return payments;
  } catch { return memPayments.filter((p:any)=> true); }
}

export async function checkEntitlement(userId:string, feature:string){
  const sub = await getSubscription(userId) as any;
  const planCode = sub.plan?.code || sub.planCode || 'trial';
  const limits = (PLANS as any)[planCode]?.limits;
  if(!limits) return true;
  // read-only if trial expired
  const readOnly = sub.readOnly;
  if(readOnly && ['quiz_generate','ai_ocr','explanation'].includes(feature)) return false;
  return true;
}
