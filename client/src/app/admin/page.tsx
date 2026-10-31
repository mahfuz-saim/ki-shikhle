'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

export default function AdminPage(){
  const [metrics, setMetrics]=useState<any>(null);
  const [usage, setUsage]=useState<any>(null);
  const [users, setUsers]=useState<any[]>([]);
  useEffect(()=>{
    api.get('/admin/metrics').then(r=> setMetrics(r.data.data)).catch(()=> setMetrics({signups:42, trials:18, paid:12, conversion:29, mrr:3588, aiCostTotal:3.42, aiCalls:128}));
    api.get('/admin/ai-usage').then(r=> setUsage(r.data.data)).catch(()=> setUsage({data:[{feature:'quiz_generate', model:'claude-3-5-haiku-latest', inputTokens:1200, outputTokens:800, costEst:0.004}], total:1}));
    api.get('/admin/users').then(r=> setUsers(r.data.data)).catch(()=> setUsers([{email:'parent@demo.com', name:'Demo Parent', trialEndsAt: new Date()}]));
  },[]);
  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Admin — Metrics & AI Usage</h1>
      <div className="grid md:grid-cols-4 gap-4">
        <Card><CardHeader><CardTitle>Signups</CardTitle></CardHeader><CardContent className="text-2xl">{metrics?.signups}</CardContent></Card>
        <Card><CardHeader><CardTitle>Trials</CardTitle></CardHeader><CardContent className="text-2xl">{metrics?.trials}</CardContent></Card>
        <Card><CardHeader><CardTitle>Paid</CardTitle></CardHeader><CardContent className="text-2xl">{metrics?.paid} <span className="text-sm text-muted-foreground">({metrics?.conversion}% conv)</span></CardContent></Card>
        <Card><CardHeader><CardTitle>MRR (demo)</CardTitle></CardHeader><CardContent className="text-2xl">৳{metrics?.mrr}</CardContent></Card>
      </div>
      <Card><CardHeader><CardTitle>AI Usage & Est. Cost / user</CardTitle><CardDescription>Cost per active child target &lt;20% of price. Provider logs in ai_usage_logs.</CardDescription></CardHeader><CardContent>
        <p className="text-sm">Total cost: ${metrics?.aiCostTotal} • Calls: {metrics?.aiCalls} • Cost/active child: ${(metrics?.aiCostTotal / (metrics?.paid || 1)).toFixed(3)}</p>
        <table className="w-full text-sm mt-3 border">
          <thead><tr className="bg-muted"><th className="p-2">Feature</th><th>Model</th><th>Tokens in/out</th><th>Cost</th><th>Cache</th></tr></thead>
          <tbody>{usage?.data?.map((u:any,i:number)=> <tr key={i} className="border-t"><td className="p-2">{u.feature}</td><td>{u.model}</td><td>{u.inputTokens}/{u.outputTokens}</td><td>${u.costEst}</td><td>{u.cacheHit?'hit':'miss'}</td></tr>)}</tbody>
        </table>
      </CardContent></Card>
      <Card><CardHeader><CardTitle>Users & Trials</CardTitle></CardHeader><CardContent><ul className="text-sm space-y-1">{users.map((u:any)=> <li key={u.id||u.email} className="flex justify-between border p-2 rounded">{u.email} — trial ends {String(u.trialEndsAt).slice(0,10)} <Button size="sm" variant="outline" onClick={async()=>{ await api.post(`/admin/users/${u.id}/extend-trial`, {days:7}); alert('Extended 7d'); }}>Extend 7d</Button></li>)}</ul></CardContent></Card>
      <p className="text-xs text-muted-foreground">Minimal admin area in v1 — view users, subscriptions, AI usage & costs, extend trials, support.</p>
    </div>
  );
}
