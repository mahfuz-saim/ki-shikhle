'use client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

const COLORS = ['#4F46E5','#F59E0B','#10B981','#06B6D4','#8B5CF6','#EF4444'];

export function StudyTimeChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data}>
        <XAxis dataKey="date" fontSize={12} />
        <YAxis fontSize={12} />
        <Tooltip />
        <Legend />
        <Bar dataKey="school" stackId="a" fill="#4F46E5" name="School" />
        <Bar dataKey="tuition" stackId="a" fill="#F59E0B" name="Tuition" />
        <Bar dataKey="self_study" stackId="a" fill="#10B981" name="Self-study" />
        <Bar dataKey="college" stackId="a" fill="#06B6D4" name="College" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ScoreTrendChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <XAxis dataKey="date" fontSize={11} />
        <YAxis domain={[0,100]} fontSize={11} />
        <Tooltip />
        <Line type="monotone" dataKey="score" stroke="#4F46E5" strokeWidth={2} dot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function SubjectDonut({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="subject" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function MasteryRadar({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <RadarChart data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="subject" fontSize={11} />
        <PolarRadiusAxis angle={30} domain={[0, 100]} fontSize={10} />
        <Radar name="Mastery" dataKey="accuracy" stroke="#4F46E5" fill="#4F46E5" fillOpacity={0.5} />
        <Tooltip />
      </RadarChart>
    </ResponsiveContainer>
  );
}

export function Heatmap({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data).slice(0, 35);
  return (
    <div className="grid grid-cols-7 gap-1">
      {entries.map(([date, val]) => (
        <div key={date} className={`h-8 rounded flex items-center justify-center text-xs border ${val ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`} title={`${date}: ${val ? 'logged' : 'missed'}`}>
          {new Date(date).getDate()}
        </div>
      ))}
    </div>
  );
}
