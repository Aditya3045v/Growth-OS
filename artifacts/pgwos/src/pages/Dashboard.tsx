import { useGetDashboardStats, useGetStreak, useGetSettings, useGetAnalytics } from "@workspace/api-client-react";
import { format } from "date-fns";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { useLocation } from "wouter";

const PIE_COLORS = ["#94aaff", "#5cfd80", "#ffbd5c", "#ff6e84", "#ec9e00", "#484847"];

export default function Dashboard() {
  const { data: stats } = useGetDashboardStats();
  const { data: streak } = useGetStreak();
  const { data: settings } = useGetSettings();
  const { data: analytics } = useGetAnalytics({ days: 14 });
  const [, navigate] = useLocation();

  const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? "Good Morning" : h < 18 ? "Good Afternoon" : "Good Evening";
  };

  const name = settings?.userName || "Alex";
  const chartData = analytics?.dailySummaries?.slice(-14) || [];
  const habitPct = Math.round(((stats?.habitsCompletedToday || 0) / Math.max(stats?.habitsTotalToday || 1, 1)) * 100);
  const taskPct = Math.round(((stats?.tasksCompletedToday || 0) / Math.max(stats?.tasksTotalToday || 1, 1)) * 100);

  return (
    <div className="space-y-6 py-6">
      {/* Greeting */}
      <header className="space-y-1">
        <h2 className="font-['Manrope'] font-extrabold text-4xl tracking-tight leading-none">
          {greeting()},{" "}
          <span className="text-[#94aaff] italic">{name}</span>
        </h2>
        <p className="text-[#adaaaa] font-medium">
          {format(new Date(), "EEEE, MMMM d")} &bull; {format(new Date(), "h:mm a")}
        </p>
      </header>

      {/* Bento Row 1: Streak + Stats */}
      <div className="grid grid-cols-12 gap-4">
        {/* Streak */}
        <div className="col-span-12 sm:col-span-4 bg-[#131313] p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between ds-ghost-border">
          <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
            <span className="material-symbols-outlined text-[80px]" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
          </div>
          <span className="text-[10px] font-['Inter'] uppercase tracking-[0.15em] text-[#adaaaa] font-bold">Current Streak</span>
          <div>
            <div className="text-6xl font-['Manrope'] font-extrabold text-[#94aaff]">{streak?.currentStreak || 0}</div>
            <p className="text-[#adaaaa] text-sm mt-1">Days of consistent growth</p>
          </div>
          <div className="flex gap-1 mt-3">
            {[...Array(Math.min(streak?.currentStreak || 0, 7))].map((_, i) => (
              <div key={i} className="h-1 flex-1 rounded-full bg-[#94aaff]" />
            ))}
            {[...Array(Math.max(0, 7 - (streak?.currentStreak || 0)))].map((_, i) => (
              <div key={i} className="h-1 flex-1 rounded-full bg-[#262626]" />
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="col-span-12 sm:col-span-8 grid grid-cols-3 gap-4">
          <StatCard label="Habits" value={`${stats?.habitsCompletedToday || 0}/${stats?.habitsTotalToday || 0}`} accent="#5cfd80" />
          <StatCard label="Tasks" value={`${stats?.tasksCompletedToday || 0}/${stats?.tasksTotalToday || 0}`} accent="#94aaff" />
          <StatCard label="Active Leads" value={`${stats?.activeLeads || 0}`} accent="#ffbd5c" />
        </div>
      </div>

      {/* Daily Progress Ring + Habit/Task bars */}
      <div className="grid grid-cols-12 gap-4">
        {/* Circular progress */}
        <div className="col-span-12 sm:col-span-4 bg-[#131313] p-6 rounded-2xl ds-ghost-border flex flex-col items-center justify-center gap-4">
          <span className="text-[10px] font-['Inter'] uppercase tracking-[0.15em] text-[#adaaaa] font-bold">Daily Progress</span>
          <div className="relative w-32 h-32 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
              <circle cx="64" cy="64" r="56" fill="none" stroke="#262626" strokeWidth="10" />
              <circle
                cx="64" cy="64" r="56" fill="none"
                stroke="url(#pg-grad)" strokeWidth="10"
                strokeDasharray={2 * Math.PI * 56}
                strokeDashoffset={2 * Math.PI * 56 * (1 - habitPct / 100)}
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="pg-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#94aaff" />
                  <stop offset="100%" stopColor="#809bff" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-['Manrope'] font-black">{habitPct}%</span>
            </div>
          </div>
          <p className="text-[#adaaaa] text-xs text-center leading-relaxed">
            {stats?.habitsCompletedToday || 0} of {stats?.habitsTotalToday || 0} habits complete
          </p>
        </div>

        {/* Progress bars */}
        <div className="col-span-12 sm:col-span-8 bg-[#131313] p-6 rounded-2xl ds-ghost-border space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-['Manrope'] font-bold text-lg">Outreach Activity</h3>
            <button onClick={() => navigate("/analytics")} className="text-[#94aaff] text-xs font-['Inter'] uppercase tracking-widest hover:underline">Full Report</button>
          </div>

          {[
            { label: "Habits", pct: habitPct, accent: "#5cfd80" },
            { label: "Tasks", pct: taskPct, accent: "#94aaff" },
            { label: "Productivity", pct: Math.round(stats?.productivityScore || 0), accent: "#ffbd5c" },
          ].map((item) => (
            <div key={item.label} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#adaaaa] font-medium">{item.label}</span>
                <span style={{ color: item.accent }} className="text-xs font-bold">{item.pct}%</span>
              </div>
              <div className="h-1.5 bg-[#262626] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{ width: `${item.pct}%`, backgroundColor: item.accent, boxShadow: `0 0 8px ${item.accent}60` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lead Pipeline */}
      {analytics?.leadStatusCounts && analytics.leadStatusCounts.length > 0 && (
        <div className="bg-[#131313] p-6 rounded-2xl ds-ghost-border">
          <h3 className="font-['Manrope'] font-bold text-lg mb-4">Lead Pipeline</h3>
          <div className="space-y-3">
            {analytics.leadStatusCounts.map((entry, idx) => (
              <div key={entry.status} className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                  <span className="capitalize text-sm font-medium">{entry.status.replace("_", " ")}</span>
                </div>
                <span className="font-['Manrope'] font-bold text-xl" style={{ color: PIE_COLORS[idx % PIE_COLORS.length] }}>
                  {String(entry.count).padStart(2, "0")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 14-day Productivity Chart */}
      {chartData.length > 0 && (
        <div className="bg-[#131313] p-6 rounded-2xl ds-ghost-border">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="font-['Manrope'] font-bold text-lg">Productivity Trends</h3>
              <p className="text-[#adaaaa] text-sm">Performance over 14 days</p>
            </div>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barSize={12}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(72,72,71,0.1)" vertical={false} />
                <XAxis dataKey="date" stroke="#767575" fontSize={10} tickFormatter={(v) => v.substring(5, 10)} tickLine={false} axisLine={false} />
                <YAxis stroke="#767575" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "#1a1a1a", border: "none", borderRadius: "8px", fontSize: "11px" }} cursor={{ fill: "rgba(148,170,255,0.05)" }} />
                <Bar dataKey="habitsCompleted" name="Habits" fill="#94aaff" radius={[4, 4, 0, 0]} stackId="a" />
                <Bar dataKey="tasksCompleted" name="Tasks" fill="#5cfd80" radius={[4, 4, 0, 0]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Habit Completion Ring CTA */}
      <div className="bg-[#131313] rounded-2xl p-6 ds-ghost-border flex items-center gap-4">
        <div className="relative w-16 h-16 shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="27" fill="none" stroke="#262626" strokeWidth="6" />
            <circle
              cx="32" cy="32" r="27" fill="none"
              stroke="#5cfd80" strokeWidth="6"
              strokeDasharray={2 * Math.PI * 27}
              strokeDashoffset={2 * Math.PI * 27 * (1 - habitPct / 100)}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-['Manrope'] font-black text-[#5cfd80]">{habitPct}%</span>
        </div>
        <div className="flex-1">
          <p className="font-['Manrope'] font-bold text-base">Consistency is Key 🔥</p>
          <p className="text-[#adaaaa] text-sm">You've reached {habitPct}% of your daily output goal.</p>
        </div>
        <button
          onClick={() => navigate("/habits")}
          className="ds-liquid-gradient text-[#000] font-['Manrope'] font-bold px-4 py-2 rounded-xl text-sm shrink-0 ds-inner-glow active:scale-95 transition-transform"
        >
          Complete Day
        </button>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="bg-[#131313] p-4 rounded-2xl ds-ghost-border flex flex-col justify-between gap-2">
      <span className="text-[10px] font-['Inter'] uppercase tracking-[0.15em] text-[#adaaaa] font-bold">{label}</span>
      <div className="text-3xl font-['Manrope'] font-bold mt-1" style={{ color: accent }}>{value}</div>
    </div>
  );
}
