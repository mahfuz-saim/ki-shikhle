'use client';

import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n-context';

const COLORS = [
  '#4F46E5', // Indigo
  '#06B6D4', // Cyan
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#3B82F6', // Blue
  '#EF4444', // Red
];

function toBnNum(num: number | string): string {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/[0-9]/g, (d) => bnDigits[parseInt(d, 10)]);
}


export function StudyTimeChart({
  data,
  institutionType = 'school',
  isBn = false,
}: {
  data: any[];
  institutionType?: 'school' | 'college' | 'admission';
  isBn?: boolean;
}) {
  // The chart takes `isBn` as a prop, but the *strings* come from the dictionary.
  // Reading the locale from the context here means the labels follow the user's
  // chosen locale rather than whatever the parent page happened to pass down.
  const { t } = useI18n();
  const hasCollegeData = data?.some((d) => (d.college || 0) > 0);
  const showCollege = institutionType === 'college' || hasCollegeData;
  const showSchool = (institutionType === 'school' || data?.some((d) => (d.school || 0) > 0)) && !showCollege;

  return (
    <div className="w-full min-w-0 h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="date" fontSize={12} />
          <YAxis fontSize={12} unit={isBn ? ' মি' : ' m'} />
          <Tooltip
            formatter={(value: any, name: any) => {
              const v = Number(value) || 0;
              const h = Math.floor(v / 60);
              const m = v % 60;
              const formatted = h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
              return [`${v} ${isBn ? 'মিনিট' : 'mins'} (${formatted})`, name];
            }}
          />
          <Legend />
          {showSchool && (
            <Bar dataKey="school" stackId="a" fill="#4F46E5" name={isBn ? 'স্কুল' : 'School'} />
          )}
          {showCollege && (
            <Bar dataKey="college" stackId="a" fill="#06B6D4" name={isBn ? 'কলেজ' : 'College'} />
          )}
          <Bar
            dataKey="tuition"
            stackId="a"
            fill="#F59E0B"
            name={institutionType === 'admission' ? (isBn ? 'কোচিং / টেস্ট' : 'Coaching / Test') : (isBn ? 'প্রাইভেট / টিউশন' : 'Tuition')}
          />
          <Bar
            dataKey="self_study"
            stackId="a"
            fill="#10B981"
            name={isBn ? 'সেলফ-স্টাডি' : 'Self-study'}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ScoreTrendChart({ data }: { data: any[] }) {
  return (
    <div className="w-full min-w-0 h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="date" fontSize={11} />
          <YAxis domain={[0, 100]} fontSize={11} />
          <Tooltip />
          <Line type="monotone" dataKey="score" stroke="#4F46E5" strokeWidth={2} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SubjectDonut({
  data = [],
  isBn = false,
}: {
  data: any[];
  isBn?: boolean;
}) {
  const { t } = useI18n();
  const validData = Array.isArray(data)
    ? data.filter((d) => Number(d?.value || d?.count || 0) > 0)
    : [];

  const totalLessons = validData.reduce((sum, d) => sum + (Number(d.value || d.count) || 0), 0);

  if (validData.length === 0) {
    return (
      <div className="w-full min-h-[200px] flex flex-col items-center justify-center text-xs text-muted-foreground gap-1.5">
        <span className="text-2xl">📚</span>
        <span>{isBn ? 'কোনো বিষয়ের পাঠ এখনও লগ করা হয়নি' : 'No subject lesson data yet'}</span>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 flex flex-col sm:flex-row items-center justify-between gap-4 py-1">
      {/* Donut Chart with Centered KPI */}
      <div className="relative w-[140px] h-[140px] shrink-0 mx-auto sm:mx-0 flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
            <Pie
              data={validData}
              dataKey="value"
              nameKey="subject"
              cx="50%"
              cy="50%"
              innerRadius={42}
              outerRadius={64}
              paddingAngle={3}
              stroke="none"
            >
              {validData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: any, name: any) => {
                const val = Number(value) || 0;
                const pct = totalLessons > 0 ? Math.round((val / totalLessons) * 100) : 0;
                return [
                  `${isBn ? toBnNum(val) : val} ${isBn ? 'টি পাঠ' : 'lessons'} (${isBn ? toBnNum(pct) : pct}%)`,
                  name,
                ];
              }}
              contentStyle={{
                borderRadius: '12px',
                fontSize: '12px',
                border: '1px solid rgba(0,0,0,0.1)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        {/* Center Total Count */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
          <span className="text-xl font-black text-foreground tracking-tight leading-none">
            {isBn ? toBnNum(totalLessons) : totalLessons}
          </span>
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">
            {isBn ? 'পাঠ' : 'Lessons'}
          </span>
        </div>
      </div>

      {/* Structured Subject Breakdown List (Shows 6 subjects, rest scrollable within box) */}
      <div className="flex-1 w-full min-w-0 space-y-1.5 max-h-[224px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/40 overscroll-contain">
        {validData.map((item, idx) => {
          const val = Number(item.value || item.count || 0);
          const pct = totalLessons > 0 ? Math.round((val / totalLessons) * 100) : 0;
          return (
            <div
              key={idx}
              className="flex items-center justify-between text-xs gap-2 min-w-0 p-1.5 px-2 rounded-xl hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                  style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                />
                <span
                  className="font-medium text-foreground truncate"
                  title={item.subject}
                >
                  {item.subject}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 text-muted-foreground font-semibold">
                <span className="text-foreground font-bold">
                  {isBn ? `${toBnNum(val)}টি` : `${val}`}
                </span>
                <span className="text-[11px] text-muted-foreground/70 min-w-[38px] text-right">
                  {isBn ? `${toBnNum(pct)}%` : `${pct}%`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function MasteryRadar({ data }: { data: any[] }) {
  return (
    <div className="w-full min-w-0 h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="subject" fontSize={11} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} fontSize={10} />
          <Radar name="Mastery" dataKey="accuracy" stroke="#4F46E5" fill="#4F46E5" fillOpacity={0.5} />
          <Tooltip />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

const BENGALI_MONTHS = [
  'জানুয়ারি',
  'ফেব্রুয়ারি',
  'মার্চ',
  'এপ্রিল',
  'মে',
  'জুন',
  'জুলাই',
  'আগস্ট',
  'সেপ্টেম্বর',
  'অক্টোবর',
  'নভেম্বর',
  'ডিসেম্বর',
];

const ENGLISH_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const BENGALI_DAYS = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহস্পতি', 'শুক্র', 'শনি'];
const ENGLISH_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];


export function MonthlyActivityCalendar({
  data = {},
  isBn = false,
}: {
  data: Record<string, number>;
  isBn?: boolean;
}) {
  const { t } = useI18n();
  const [viewDate, setViewDate] = useState(() => new Date());

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth(); // 0-11
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sunday

  const today = new Date();
  const isCurrentMonthView = today.getFullYear() === year && today.getMonth() === month;
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const goToPrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setViewDate(new Date());
  };

  const monthLabel = isBn ? BENGALI_MONTHS[month] : ENGLISH_MONTHS[month];
  const yearLabel = isBn ? toBnNum(year) : year;
  const daysOfWeek = isBn ? BENGALI_DAYS : ENGLISH_DAYS;

  // Calculate monthly stats
  let completedCount = 0;
  let missedCount = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayDate = new Date(year, month, day, 23, 59, 59);
    const isFuture = dayDate > today;
    const val = data?.[dStr];

    if (!isFuture || dStr === todayStr) {
      if (val !== undefined) {
        if (val > 0) completedCount++;
        else if (val === 0) missedCount++;
      }
    }
  }

  const loggedDays = completedCount + missedCount;
  const consistencyRate = loggedDays > 0 ? Math.round((completedCount / loggedDays) * 100) : 0;

  return (
    <div className="w-full select-none">
      {/* Month Navigation & Controls */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 font-bold text-sm sm:text-base text-foreground">
            <CalendarIcon className="w-4 h-4 text-primary" />
            <span>
              {monthLabel} {yearLabel}
            </span>
          </div>
          {!isCurrentMonthView && (
            <button
              type="button"
              onClick={goToToday}
              className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              {isBn ? 'বর্তমান মাস' : 'Current Month'}
            </button>
          )}
        </div>

        {/* Forward / Backward navigation arrows */}
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-lg border-border/60 hover:bg-muted"
            onClick={goToPrevMonth}
            title={isBn ? 'পূর্ববর্তী মাস' : 'Previous Month'}
            aria-label="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-lg border-border/60 hover:bg-muted"
            onClick={goToNextMonth}
            title={isBn ? 'পরবর্তী মাস' : 'Next Month'}
            aria-label="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5 mb-1.5">
        {daysOfWeek.map((dayName, idx) => (
          <div
            key={idx}
            className="text-[11px] sm:text-xs font-semibold text-muted-foreground/80 text-center py-1"
          >
            {dayName}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {/* Empty padding slots before first day of month */}
        {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
          <div
            key={`pad-${idx}`}
            className="h-9 sm:h-12 rounded-xl bg-transparent opacity-0 pointer-events-none"
            aria-hidden="true"
          />
        ))}

        {/* Month Day Cells */}
        {Array.from({ length: daysInMonth }).map((_, idx) => {
          const day = idx + 1;
          const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isToday = dStr === todayStr;
          const isFuture = new Date(year, month, day, 23, 59, 59) > today && !isToday;
          const val = data?.[dStr];

          let status: 'completed' | 'missed' | 'future' | 'neutral' = 'neutral';
          if (isFuture) {
            status = 'future';
          } else if (val !== undefined && val > 0) {
            status = 'completed';
          } else if (val === 0) {
            status = 'missed';
          } else {
            status = 'neutral';
          }

          let tooltipText = `${dStr}`;
          if (status === 'completed') {
            tooltipText += isBn
              ? `: পড়াশোনা সম্পন্ন (${toBnNum(val)}টি সেশন)`
              : `: Study logged (${val} session${val > 1 ? 's' : ''})`;
          } else if (status === 'missed') {
            tooltipText += isBn ? ': পড়াশোনা মিস হয়েছে' : ': Missed study session';
          } else if (status === 'future') {
            tooltipText += isBn ? ': ভবিষ্যৎ তারিখ' : ': Upcoming date';
          } else {
            tooltipText += isBn ? ': কোনো লগ নেই' : ': No logs recorded';
          }

          // Lighter tone styles to match the theme
          let cellStyle = 'bg-muted/30 border-border/40 text-muted-foreground/70';
          if (status === 'completed') {
            // Soft lighter green tone
            cellStyle =
              'bg-emerald-500/15 border-emerald-500/35 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/25 shadow-sm';
          } else if (status === 'missed') {
            // Soft lighter red tone
            cellStyle =
              'bg-rose-500/15 border-rose-500/35 text-rose-800 dark:text-rose-300 hover:bg-rose-500/25 shadow-sm';
          } else if (status === 'future') {
            cellStyle = 'bg-muted/10 border-border/20 border-dashed text-muted-foreground/30';
          }

          return (
            <div
              key={dStr}
              title={tooltipText}
              className={`h-9 sm:h-12 p-0.5 sm:p-1.5 rounded-xl border flex flex-col justify-between transition-all relative ${cellStyle} ${
                isToday ? 'ring-2 ring-primary ring-offset-1 dark:ring-offset-background font-black' : ''
              }`}
            >
              <div className="flex items-center justify-between w-full leading-none">
                <span className="text-[11px] sm:text-xs font-semibold">
                  {isBn ? toBnNum(day) : day}
                </span>
                {isToday && (
                  <span className="text-[8px] sm:text-[9px] uppercase tracking-wider font-extrabold text-primary px-1 py-0.5 rounded bg-primary/10">
                    {isBn ? 'আজ' : 'Today'}
                  </span>
                )}
              </div>

              {/* Status Indicator */}
              <div className="flex items-center justify-end w-full leading-none">
                {status === 'completed' && (
                  <span className="text-[10px] sm:text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    ✓{val > 1 ? <span className="text-[9px] ml-0.5">{isBn ? toBnNum(val) : val}</span> : null}
                  </span>
                )}
                {status === 'missed' && (
                  <span className="text-[10px] sm:text-xs font-bold text-rose-600 dark:text-rose-400">
                    ✕
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend & Monthly Summary */}
      <div className="mt-4 pt-3 border-t border-border/50 flex flex-wrap items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center flex-wrap gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-emerald-500/20 border border-emerald-500/40 inline-block" />
            <span className="text-muted-foreground">
              {isBn ? 'সম্পন্ন' : 'Completed'}{' '}
              {completedCount > 0 ? `(${isBn ? toBnNum(completedCount) : completedCount})` : ''}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-rose-500/20 border border-rose-500/40 inline-block" />
            <span className="text-muted-foreground">
              {isBn ? 'মিস হয়েছে' : 'Missed'}{' '}
              {missedCount > 0 ? `(${isBn ? toBnNum(missedCount) : missedCount})` : ''}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-muted/40 border border-border/40 inline-block" />
            <span className="text-muted-foreground">{isBn ? 'অন্যান্য / ভবিষ্যৎ' : 'Rest / Future'}</span>
          </div>
        </div>

        {loggedDays > 0 && (
          <div className="text-muted-foreground font-medium">
            {isBn ? 'ধারাবাহিকতা:' : 'Consistency:'}{' '}
            <span className="font-bold text-foreground">
              {isBn ? toBnNum(consistencyRate) : consistencyRate}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export function Heatmap(props: { data: Record<string, number>; isBn?: boolean }) {
  return <MonthlyActivityCalendar {...props} />;
}
