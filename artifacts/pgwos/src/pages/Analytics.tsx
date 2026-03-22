import { useState } from "react";
import { useGetAnalytics, useGetStreak } from "@workspace/api-client-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

const PIE_COLORS = ["#94aaff", "#5cfd80", "#ffbd5c", "#ff6e84", "#ec9e00", "#484847"];
const DAYS_OPTIONS = [7, 14, 30, 90];

export default function Analytics() {
  const [days, setDays] = useState(30);
  const { data: analytics } = useGetAnalytics({ days });
  const { data: streak } = useGetStreak();

  const summary = analytics?.summary;
  const chartData = analytics?.dailySummaries?.slice(-days) || [];
  const leadData = analytics?.leadStatusCounts || [];

  const avgHabits = summary?.avgHabitsPerDay ?? 0;
  const avgTasks = summary?.avgTasksPerDay ?? 0;
  const maxStreak = streak?.maxStreak ?? 0;
  const currentStreak = streak?.currentStreak ?? 0;

  return (
    <div className="py-6 space-y-6">
      <div>
        <p className="text-[10px] font-['Inter'] uppercase tracking-[0.2em] text-[#adaaaa] font-bold mb-1">Performance Intelligence</p>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="font-['Manrope'] font-extrabold text-4xl tracking-tight">Analytics</h2>
          <div className="flex bg-[#1a1a1a] p-1 rounded-2xl gap-1 ds-ghost-border">
            {DAYS_OPTIONS.map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-4 py-2 rounded-xl text-[11px] font-['Inter'] font-bold uppercase tracking-wider transition-all ${
                  days === d ? "bg-[#94aaff] text-[#000] shadow-sm" : "text-[#adaaaa] hover:text-white"
                }`}
              >
                {d}D
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Current Streak" value={`${currentStreak}d`} accent="#94aaff" icon="local_fire_department" />
        <KPICard label="Best Streak" value={`${maxStreak}d`} accent="#5cfd80" icon="emoji_events" />
        <KPICard label="Avg Habits/Day" value={avgHabits.toFixed(1)} accent="#ffbd5c" icon="self_improvement" />
        <KPICard label="Avg Tasks/Day" value={avgTasks.toFixed(1)} accent="#ff6e84" icon="task_alt" />
      </div>

      {chartData.length > 0 && (
        <div className="bg-[#131313] p-6 rounded-2xl ds-ghost-border">
          <h3 className="font-['Manrope'] font-bold text-base mb-1">Daily Performance</h3>
          <p className="text-[#adaaaa] text-sm mb-6">Habit & task completion over {days} days</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="habGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#94aaff" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#94aaff" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="taskGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#5cfd80" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#5cfd80" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(72,72,71,0.1)" vertical={false} />
                <XAxis dataKey="date" stroke="#767575" fontSize={10} tickFormatter={(v) => v.substring(5)} tickLine={false} axisLine={false} />
                <YAxis stroke="#767575" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "#1a1a1a", border: "none", borderRadius: "12px", fontSize: "11px" }} />
                <Area type="monotone" dataKey="habitsCompleted" name="Habits" stroke="#94aaff" fill="url(#habGrad)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="tasksCompleted" name="Tasks" stroke="#5cfd80" fill="url(#taskGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {chartData.some((d: any) => d.avgMood) && (
        <div className="bg-[#131313] p-6 rounded-2xl ds-ghost-border">
          <h3 className="font-['Manrope'] font-bold text-base mb-1">Mood & Energy</h3>
          <p className="text-[#adaaaa] text-sm mb-6">Daily check-in averages</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barSize={12}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(72,72,71,0.1)" vertical={false} />
                <XAxis dataKey="date" stroke="#767575" fontSize={10} tickFormatter={(v) => v.substring(5)} tickLine={false} axisLine={false} />
                <YAxis stroke="#767575" fontSize={10} domain={[0, 5]} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "#1a1a1a", border: "none", borderRadius: "12px", fontSize: "11px" }} />
                <Bar dataKey="avgMood" name="Mood" fill="#94aaff" radius={[4, 4, 0, 0]} />
                <Bar dataKey="avgEnergy" name="Energy" fill="#ffbd5c" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {leadData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#131313] p-6 rounded-2xl ds-ghost-border">
            <h3 className="font-['Manrope'] font-bold text-base mb-6">Lead Pipeline</h3>
            <div className="h-48 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={leadData} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4}>
                    {leadData.map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "#1a1a1a", border: "none", borderRadius: "12px", fontSize: "11px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-[#131313] p-6 rounded-2xl ds-ghost-border">
            <h3 className="font-['Manrope'] font-bold text-base mb-4">Pipeline Breakdown</h3>
            <div className="space-y-3">
              {leadData.map((entry: any, idx: number) => (
                <div key={entry.status} className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                  <span className="flex-1 capitalize text-sm text-[#adaaaa] font-medium">{entry.status.replace("_", " ")}</span>
                  <span className="font-['Manrope'] font-bold text-base" style={{ color: PIE_COLORS[idx % PIE_COLORS.length] }}>{entry.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KPICard({ label, value, accent, icon }: { label: string; value: string | number; accent: string; icon: string }) {
  return (
    <div className="bg-[#131313] p-5 rounded-2xl ds-ghost-border flex flex-col gap-3">
      <span className="material-symbols-outlined text-[22px]" style={{ color: accent }}>{icon}</span>
      <div className="text-3xl font-['Manrope'] font-extrabold" style={{ color: accent }}>{value}</div>
      <div className="text-[10px] text-[#adaaaa] uppercase tracking-[0.15em] font-bold">{label}</div>
    </div>
  );
}
