import { useGetDashboardStats, useGetStreak, useGetSettings, useGetAnalytics } from "@workspace/api-client-react";
import { Flame, CheckCircle2, Target, Zap, Activity, Users } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

const PIE_COLORS = ['#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#f43f5e', '#64748b'];

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: streak, isLoading: streakLoading } = useGetStreak();
  const { data: settings } = useGetSettings();
  const { data: analytics, isLoading: analyticsLoading } = useGetAnalytics({ days: 14 });

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const name = settings?.userName || "User";
  const chartData = analytics?.dailySummaries?.slice(-14) || [];

  return (
    <div className="space-y-8 pb-10">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-card/30 p-6 rounded-3xl border border-border/50">
        <div>
          <h2 className="text-muted-foreground font-medium flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            {format(new Date(), "EEEE, MMMM do")}
          </h2>
          <h1 className="text-4xl font-display font-bold mt-2 text-foreground tracking-tight">
            {greeting()},{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
              {name}
            </span>
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">Let's make today count.</p>
        </div>

        {streakLoading ? (
          <Skeleton className="h-16 w-32 rounded-2xl" />
        ) : (
          <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 px-6 py-4 rounded-2xl flex items-center gap-4 shadow-inner shadow-orange-500/5">
            <div className="bg-gradient-to-b from-orange-400 to-red-500 p-3 rounded-xl shadow-lg shadow-orange-500/30">
              <Flame className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-orange-500 uppercase tracking-wider">Current Streak</p>
              <p className="text-3xl font-display font-bold text-foreground">
                {streak?.currentStreak || 0} Days
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <StatCard
          title="Productivity Score"
          value={statsLoading ? "..." : `${Math.round(stats?.productivityScore || 0)}%`}
          icon={<Zap className="h-5 w-5 text-yellow-500" />}
          gradient="from-yellow-500/20 to-transparent"
          delay={0.1}
        />
        <StatCard
          title="Tasks Completed"
          value={statsLoading ? "..." : `${stats?.tasksCompletedToday || 0}/${stats?.tasksTotalToday || 0}`}
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />}
          gradient="from-emerald-500/20 to-transparent"
          delay={0.2}
        />
        <StatCard
          title="Habits Done"
          value={statsLoading ? "..." : `${stats?.habitsCompletedToday || 0}/${stats?.habitsTotalToday || 0}`}
          icon={<Target className="h-5 w-5 text-primary" />}
          gradient="from-primary/20 to-transparent"
          delay={0.3}
        />
        <StatCard
          title="Active Leads"
          value={statsLoading ? "..." : `${stats?.activeLeads || 0}`}
          icon={<Users className="h-5 w-5 text-blue-500" />}
          gradient="from-blue-500/20 to-transparent"
          delay={0.4}
        />
      </div>

      {/* Today's Progress bars */}
      <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-display font-bold">Today's Progress</h3>
          <Activity className="h-5 w-5 text-muted-foreground" />
        </div>
        {statsLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : (
          <div className="space-y-6">
            <ProgressBar
              label="Habit Completion"
              completed={stats?.habitsCompletedToday || 0}
              total={stats?.habitsTotalToday || 1}
              color="from-primary to-accent"
            />
            <ProgressBar
              label="Task Completion"
              completed={stats?.tasksCompletedToday || 0}
              total={stats?.tasksTotalToday || 1}
              color="from-emerald-400 to-emerald-500"
            />
          </div>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Productivity Line Chart */}
        <Card className="p-6 bg-card border-border/50 rounded-3xl shadow-sm">
          <h3 className="font-bold text-lg mb-6">14-Day Productivity Trend</h3>
          {analyticsLoading ? (
            <Skeleton className="h-48 w-full rounded-xl" />
          ) : (
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickFormatter={(v) => v.substring(5, 10)}
                    tickLine={false}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                    itemStyle={{ color: "#8b5cf6" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="productivityScore"
                    name="Score"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 5, fill: "#8b5cf6" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Lead Pipeline Pie Chart */}
        <Card className="p-6 bg-card border-border/50 rounded-3xl shadow-sm">
          <h3 className="font-bold text-lg mb-4">Lead Pipeline</h3>
          {analyticsLoading ? (
            <Skeleton className="h-48 w-full rounded-xl" />
          ) : analytics?.leadStatusCounts && analytics.leadStatusCounts.length > 0 ? (
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.leadStatusCounts}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="count"
                    nameKey="status"
                    stroke="none"
                  >
                    {analytics.leadStatusCounts.map((_entry, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(val, name) => [val, String(name).replace("_", " ")]}
                  />
                  <Legend
                    formatter={(val) => String(val).replace("_", " ")}
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: "11px", textTransform: "capitalize" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center">
              <p className="text-muted-foreground text-sm">No lead data yet.</p>
            </div>
          )}
        </Card>
      </div>

      {/* Habits + Tasks Bar Chart */}
      <Card className="p-6 bg-card border-border/50 rounded-3xl shadow-sm">
        <h3 className="font-bold text-lg mb-6">14-Day Task & Habit Output</h3>
        {analyticsLoading ? (
          <Skeleton className="h-56 w-full rounded-xl" />
        ) : (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barSize={14}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickFormatter={(v) => v.substring(5, 10)}
                  tickLine={false}
                />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  cursor={{ fill: "hsl(var(--secondary))" }}
                />
                <Bar dataKey="habitsCompleted" name="Habits" fill="#8b5cf6" radius={[4, 4, 0, 0]} stackId="a" />
                <Bar dataKey="tasksCompleted" name="Tasks" fill="#06b6d4" radius={[4, 4, 0, 0]} stackId="a" />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </div>
  );
}

function ProgressBar({
  label,
  completed,
  total,
  color,
}: {
  label: string;
  completed: number;
  total: number;
  color: string;
}) {
  const pct = Math.round((completed / Math.max(total, 1)) * 100);
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm font-medium">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-foreground">{pct}%</span>
      </div>
      <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full bg-gradient-to-r ${color}`}
        />
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  gradient,
  delay,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  gradient: string;
  delay: number;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay }}>
      <Card className="overflow-hidden border-border/50 bg-card hover:shadow-xl hover:border-border transition-all duration-300 group">
        <CardContent className="p-0">
          <div className={`h-1 w-full bg-gradient-to-r ${gradient}`} />
          <div className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
                <h3 className="text-3xl font-display font-bold mt-2 text-foreground">{value}</h3>
              </div>
              <div className="p-3 bg-secondary rounded-xl group-hover:scale-110 transition-transform duration-300">
                {icon}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function CalendarIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  );
}
