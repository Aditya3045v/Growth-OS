import { useGetDashboardStats, useGetStreak, useGetSettings } from "@workspace/api-client-react";
import { Flame, CheckCircle2, MessageSquare, Target, Zap, Activity } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: streak, isLoading: streakLoading } = useGetStreak();
  const { data: settings } = useGetSettings();

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const name = settings?.userName || "User";

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
            {greeting()}, <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">{name}</span>
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">Let's make today count.</p>
        </div>
        
        {streakLoading ? <Skeleton className="h-16 w-32 rounded-2xl" /> : (
          <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 px-6 py-4 rounded-2xl flex items-center gap-4 shadow-inner shadow-orange-500/5">
            <div className="bg-gradient-to-b from-orange-400 to-red-500 p-3 rounded-xl shadow-lg shadow-orange-500/30">
              <Flame className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-orange-500 uppercase tracking-wider">Current Streak</p>
              <p className="text-3xl font-display font-bold text-foreground">{streak?.currentStreak || 0} Days</p>
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
          icon={<UsersIcon className="h-5 w-5 text-blue-500" />}
          gradient="from-blue-500/20 to-transparent"
          delay={0.4}
        />
      </div>

      {/* Weekly Progress Overview - simplified visual representation */}
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
          <div className="space-y-8">
            <div className="space-y-3">
              <div className="flex justify-between text-sm font-medium">
                <span className="text-muted-foreground">Habit Completion</span>
                <span className="text-foreground">{Math.round((stats?.habitsCompletedToday || 0) / Math.max(stats?.habitsTotalToday || 1, 1) * 100)}%</span>
              </div>
              <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.round((stats?.habitsCompletedToday || 0) / Math.max(stats?.habitsTotalToday || 1, 1) * 100)}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-primary to-accent"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm font-medium">
                <span className="text-muted-foreground">Task Completion</span>
                <span className="text-foreground">{Math.round((stats?.tasksCompletedToday || 0) / Math.max(stats?.tasksTotalToday || 1, 1) * 100)}%</span>
              </div>
              <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.round((stats?.tasksCompletedToday || 0) / Math.max(stats?.tasksTotalToday || 1, 1) * 100)}%` }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                  className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, gradient, delay }: { title: string, value: string, icon: React.ReactNode, gradient: string, delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
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

// Simple icons for dashboard that aren't imported top level
function CalendarIcon(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round" {...props}><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>;
}
function UsersIcon(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round" {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
}
