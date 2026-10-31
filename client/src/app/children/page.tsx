'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';

export default function ChildrenPage() {
  const [list, setList] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', nickname: '', grade: '6', curriculum: 'NCTB', medium: 'Bangla', pin: '' });
  const [msg, setMsg] = useState(''); const [err, setErr] = useState('');

  const load = () => api.get('/children').then(r => setList(r.data.data)).catch(()=> setList([{ id: 'demo1', name: 'Rahim (demo)', grade: '6', curriculum: 'NCTB', medium: 'Bangla' }]));
  useEffect(() => { load(); }, []);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault(); setErr('');
    try { await api.post('/children', form); setMsg('Child added'); load(); } catch (e: any) { setErr(e.response?.data?.error?.message || 'Failed'); }
  }

  async function enterPin(id: string) {
    const pin = prompt('Enter PIN (4-6 digits)');
    if (!pin) return;
    try {
      const r = await api.post(`/children/${id}/enter`, { pin });
      localStorage.setItem('childToken', r.data.data.token);
      alert('Child mode token stored — now use kid routes. Auto-lock after inactivity.');
    } catch (e: any) { alert(e.response?.data?.error?.message || 'Invalid PIN'); }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Children</h1>
      <p className="text-sm text-muted-foreground">Parent-managed profiles with PIN-based child mode; no email required for children. Limited by subscription (trial: 2).</p>

      <Card><CardHeader><CardTitle>Add Child</CardTitle><CardDescription>Fields: name, nickname, grade, curriculum (NCTB default), medium, avatar, PIN (hashed)</CardDescription></CardHeader>
      <CardContent><form onSubmit={onCreate} className="grid md:grid-cols-3 gap-4">
        <div><Label>Name</Label><Input value={form.name} onChange={e=>setForm({...form, name: e.target.value})} required /></div>
        <div><Label>Nickname</Label><Input value={form.nickname} onChange={e=>setForm({...form, nickname: e.target.value})} /></div>
        <div><Label>Grade</Label><Input value={form.grade} onChange={e=>setForm({...form, grade: e.target.value})} /></div>
        <div><Label>Curriculum</Label><select value={form.curriculum} onChange={e=>setForm({...form, curriculum: e.target.value})} className="h-10 w-full border rounded px-3"><option>NCTB</option><option>English Version</option><option>Madrasa</option></select></div>
        <div><Label>Medium</Label><select value={form.medium} onChange={e=>setForm({...form, medium: e.target.value})} className="h-10 w-full border rounded px-3"><option>Bangla</option><option>English</option></select></div>
        <div><Label>PIN (4-6 digits, hashed)</Label><Input value={form.pin} onChange={e=>setForm({...form, pin: e.target.value})} placeholder="1234" /></div>
        <Button type="submit" className="md:col-span-3">Add Child</Button>
        {msg && <p className="text-sm text-emerald-600 md:col-span-3">{msg}</p>}
        {err && <p className="text-sm text-destructive md:col-span-3">{err}</p>}
      </form></CardContent></Card>

      <div className="grid md:grid-cols-2 gap-4">
        {list.map((c:any) => (
          <Card key={c.id}><CardHeader><CardTitle>{c.name} <span className="text-sm font-normal text-muted-foreground">Grade {c.grade} • {c.curriculum} • {c.medium}</span></CardTitle><CardDescription>ID: {c.id}</CardDescription></CardHeader>
          <CardContent className="flex gap-2">
            <Button variant="outline" onClick={()=> enterPin(c.id)}>Switch to child mode</Button>
            <Button variant="ghost" onClick={()=> alert('Edit — PATCH /children/'+c.id)}>Edit</Button>
            <Button variant="destructive" onClick={async()=> { if(confirm('Delete?')){ await api.delete('/children/'+c.id); load(); }}}>Delete</Button>
          </CardContent></Card>
        ))}
      </div>

      <Card><CardHeader><CardTitle>Subjects (seeded NCTB)</CardTitle><CardDescription>GET /subjects?childId= • Custom subjects via POST /subjects (e.g., Arabic, Drawing)</CardDescription></CardHeader><CardContent><SubjectsManager /></CardContent></Card>
    </div>
  );
}

function SubjectsManager(){
  const [list, setList]=useState<any[]>([]);
  const [nameEn, setNameEn]=useState(''); const [nameBn, setNameBn]=useState('');
  useEffect(()=>{ api.get('/subjects').then(r=>setList(r.data.data)).catch(()=> setList([{nameEn:'Mathematics', nameBn:'গণিত'}, {nameEn:'Science', nameBn:'বিজ্ঞান'}])); }, []);
  async function add(){ await api.post('/subjects', { nameEn, nameBn, curriculum: 'NCTB', grade: '6' }); setNameEn(''); setNameBn(''); const r=await api.get('/subjects'); setList(r.data.data); }
  return (
    <div className="space-y-3">
      <div className="flex gap-2"><Input placeholder="English e.g. Arabic" value={nameEn} onChange={e=>setNameEn(e.target.value)} /><Input placeholder="বাংলা (optional)" value={nameBn} onChange={e=>setNameBn(e.target.value)} /><Button onClick={add}>Add custom</Button></div>
      <ul className="grid grid-cols-2 gap-2 text-sm">{list.map((s:any,i:number)=> <li key={i} className="border rounded p-2">{s.nameEn} {s.nameBn && `• ${s.nameBn}`} {s.isCustom && <span className="text-xs bg-secondary px-2 py-1 rounded">custom</span>}</li>)}</ul>
    </div>
  );
}
