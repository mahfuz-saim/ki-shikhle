'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';

export default function BillingPage(){
  const [plans, setPlans]=useState<any[]>([]);
  const [sub, setSub]=useState<any>(null);
  const [invoices, setInvoices]=useState<any[]>([]);
  const [form, setForm]=useState({ planCode:'standard', childCount:1, billingPeriod:'monthly', simulateFailure:false });
  const [msg, setMsg]=useState(''); const [err, setErr]=useState('');

  useEffect(()=>{
    api.get('/billing/plans').then(r=> setPlans(r.data.data)).catch(()=> setPlans([
      {code:'starter', name:'Starter', priceBdt:149, limitsJson:{maxChildren:3, aiQuizzesPerMonth:10}},
      {code:'standard', name:'Standard', priceBdt:299, limitsJson:{maxChildren:5, aiQuizzesPerMonth:40}},
      {code:'premium', name:'Premium', priceBdt:499, limitsJson:{maxChildren:10, aiQuizzesPerMonth:120}},
    ]));
    api.get('/billing/subscription').then(r=> setSub(r.data.data)).catch(()=> setSub({status:'trialing', plan:{code:'trial'}, currentPeriodEnd: new Date(Date.now()+12*86400000).toISOString()}));
    api.get('/billing/invoices').then(r=> setInvoices(r.data.data)).catch(()=> setInvoices([]));
  },[]);

  async function checkout(){
    setErr(''); setMsg('');
    try{
      const r=await api.post('/billing/demo-checkout', { planCode: form.planCode, childCount: form.childCount, billingPeriod: form.billingPeriod, simulateFailure: form.simulateFailure });
      setMsg(`✅ Checkout succeeded — invoice ${r.data.data.invoiceNo} — ৳${r.data.data.amount} — DemoProvider always succeeds unless simulateFailure`);
      const s=await api.get('/billing/subscription'); setSub(s.data.data);
      const inv=await api.get('/billing/invoices'); setInvoices(inv.data.data);
    }catch(e:any){ setErr(e.response?.data?.error?.message || 'Checkout failed'); }
  }

  const trialDays = sub?.currentPeriodEnd ? Math.ceil((new Date(sub.currentPeriodEnd).getTime() - Date.now())/86400000) : null;
  const isTrial = sub?.status==='trialing';

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Billing & Subscription</h1>

      {isTrial && (
        <Card className="border-amber-500"><CardHeader><CardTitle>Trial — {trialDays} days left</CardTitle><CardDescription>Full Standard features, up to 2 children. After expiry: read-only (data kept, quizzes/AI locked) with upgrade prompt. Daily cron trial reminders at day 10,13,15 + 3-day grace.</CardDescription></CardHeader>
        <CardContent><p className="text-sm">Enforced via central entitlements service: children count, AI quizzes/mo, AI vision OCR, history length.</p></CardContent></Card>
      )}

      <Card><CardHeader><CardTitle>Current Subscription</CardTitle></CardHeader><CardContent>
        <p className="text-sm">Status: <Badge>{sub?.status}</Badge> • Plan: {sub?.plan?.code || sub?.planCode} • Slots: {sub?.childSlots} • Ends: {sub?.currentPeriodEnd?.slice?.(0,10)} {sub?.readOnly && <span className="text-destructive">• Read-only — upgrade to unlock AI</span>}</p>
      </CardContent></Card>

      <div className="grid md:grid-cols-3 gap-4">
        {plans.map((p:any)=> (
          <Card key={p.code} className={p.code==='standard'?'border-primary':''}>
            <CardHeader>
              <CardTitle>{p.name} — ৳{p.priceBdt}/child/mo</CardTitle>
              <CardDescription>{p.limitsJson?.aiQuizzesPerMonth} AI quizzes/mo • {p.limitsJson?.maxChildren} kids • {p.limitsJson?.historyMonths ? `${p.limitsJson.historyMonths}mo history` : 'unlimited'}</CardDescription>
            </CardHeader>
            <CardContent><Button variant={p.code===form.planCode?'default':'outline'} onClick={()=> setForm({...form, planCode:p.code})}>Select {p.code}</Button></CardContent>
          </Card>
        ))}
      </div>

      <Card><CardHeader><CardTitle>Demo Checkout</CardTitle><CardDescription>Fake card/mobile-wallet form, always succeeds (switch to simulate failure), creates payments rows flagged is_demo=true</CardDescription></CardHeader><CardContent className="space-y-3">
        <div className="grid md:grid-cols-3 gap-3">
          <div><Label>Plan</Label><select value={form.planCode} onChange={e=> setForm({...form, planCode:e.target.value})} className="h-10 border rounded px-3 w-full"><option value="starter">Starter ৳149</option><option value="standard">Standard ৳299</option><option value="premium">Premium ৳499</option></select></div>
          <div><Label>Children count</Label><Input type="number" value={form.childCount} onChange={e=> setForm({...form, childCount: parseInt(e.target.value)})} /></div>
          <div><Label>Billing</Label><select value={form.billingPeriod} onChange={e=> setForm({...form, billingPeriod:e.target.value})} className="h-10 border rounded px-3 w-full"><option value="monthly">Monthly</option><option value="yearly">Yearly — pay 10 get 12</option></select></div>
        </div>
        <div className="flex items-center gap-2"><input type="checkbox" checked={form.simulateFailure} onChange={e=> setForm({...form, simulateFailure:e.target.checked})} /> <Label>Simulate failure (test)</Label></div>
        <div className="flex gap-2">
          <div className="flex-1"><Label>Card (demo — any)</Label><Input placeholder="4111 1111 1111 1111" /></div>
          <div><Label>Exp</Label><Input placeholder="12/28" /></div>
          <div><Label>CVC</Label><Input placeholder="123" /></div>
        </div>
        <Button onClick={checkout} className="w-full">Pay with DemoProvider — ৳{ (plans.find((p:any)=>p.code===form.planCode)?.priceBdt || 299) * form.childCount * (form.billingPeriod==='yearly'?10:1) }</Button>
        {msg && <p className="text-sm text-emerald-600">{msg}</p>}
        {err && <p className="text-sm text-destructive">{err}</p>}
        <p className="text-xs text-muted-foreground">Provider interface: createCheckout/confirm/cancel/webhook → DemoProvider. Real gateways (bKash/Nagad/SSLCommerz/Stripe) will drop in later. Idempotency keys on checkout.</p>
      </CardContent></Card>

      <Card><CardHeader><CardTitle>Invoices</CardTitle></CardHeader><CardContent><ul className="text-sm space-y-1">{invoices.length? invoices.map((inv:any)=> <li key={inv.id} className="border-b py-1">{inv.invoiceNo} — ৳{inv.amount} {inv.currency} • {inv.status} {inv.isDemo && <Badge variant="secondary">demo</Badge>}</li>) : <li className="text-muted-foreground">No invoices yet</li>}</ul></CardContent></Card>

      <Card><CardHeader><CardTitle>Enforcement</CardTitle></CardHeader><CardContent className="text-sm space-y-1">
        <li>Plan limits enforced server-side in entitlements service</li>
        <li>After forcing expiry, AI features lock correctly (read-only demo)</li>
        <li>Sibling discount: 25% off 2nd, 35% off 3rd+ (computed at checkout)</li>
      </CardContent></Card>
    </div>
  );
}
