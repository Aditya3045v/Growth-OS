import { Router, type Request, type Response } from "express";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { db, tasksTable, habitsTable, habitLogsTable, leadsTable, checkinsTable } from "@workspace/db";
import {
  GetDashboardStatsResponse,
  GetStreakResponse,
  GetAnalyticsQueryParams,
  GetAnalyticsResponse,
} from "@workspace/api-zod";

const router = Router();

router.get("/stats/dashboard", async (_req: Request, res: Response): Promise<void> => {
  const today = new Date().toISOString().split("T")[0];

  const [tasks, habits, habitLogs, leads] = await Promise.all([
    db.select().from(tasksTable),
    db.select().from(habitsTable).where(eq(habitsTable.isActive, true)),
    db.select().from(habitLogsTable).where(eq(habitLogsTable.date, today)),
    db.select().from(leadsTable),
  ]);

  const tasksToday = tasks.filter((t) => {
    if (t.dueDate === today) return true;
    if (t.status !== "completed" && !t.dueDate) return true;
    return false;
  });

  const tasksCompletedToday = tasksToday.filter((t) => t.status === "completed").length;
  const tasksTotalToday = tasksToday.length;

  const habitsTotal = habits.length;
  const habitsCompleted = habitLogs.filter((l) => l.completed).length;
  const habitCompletionRate = habitsTotal > 0 ? Math.round((habitsCompleted / habitsTotal) * 100) / 100 : 0;

  const totalLeads = leads.length;
  const activeLeads = leads.filter((l) => !["closed", "lost"].includes(l.status)).length;
  const closedLeads = leads.filter((l) => l.status === "closed").length;
  const lostLeads = leads.filter((l) => l.status === "lost").length;
  const followUpsToday = leads.filter((l) => l.nextFollowUpDate === today).length;

  const totalActivities = tasksToday.length + habitsTotal;
  const completedActivities = tasksCompletedToday + habitsCompleted;
  const productivityScore = totalActivities > 0
    ? Math.round((completedActivities / totalActivities) * 100)
    : 0;

  const outreachHabit = habits.find((h) => h.title.toLowerCase().includes("outreach") || h.title.toLowerCase().includes("message"));
  let messagesCount = 0;
  if (outreachHabit) {
    const log = habitLogs.find((l) => l.habitId === outreachHabit.id);
    if (log && log.value) {
      messagesCount = parseInt(log.value, 10) || 0;
    }
  }

  const streakResult = await computeStreak();

  res.json(GetDashboardStatsResponse.parse({
    streak: streakResult.currentStreak,
    tasksCompletedToday,
    tasksTotalToday,
    habitCompletionRate,
    habitsCompletedToday: habitsCompleted,
    habitsTotalToday: habitsTotal,
    totalLeads,
    activeLeads,
    closedLeads,
    lostLeads,
    productivityScore,
    messagesCount,
    followUpsToday,
  }));
});

async function computeStreak(): Promise<{ currentStreak: number; longestStreak: number; lastCheckinDate: string | null }> {
  const checkins = await db.select().from(checkinsTable).orderBy(desc(checkinsTable.date));
  if (checkins.length === 0) {
    return { currentStreak: 0, longestStreak: 0, lastCheckinDate: null };
  }

  const today = new Date().toISOString().split("T")[0];
  let currentStreak = 0;
  let longestStreak = 0;
  let streak = 0;

  const dateSet = new Set(checkins.map((c) => c.date));
  const lastDate = checkins[0].date;

  let checkDate = new Date(today);
  while (true) {
    const dateStr = checkDate.toISOString().split("T")[0];
    if (dateSet.has(dateStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }
  currentStreak = streak;

  let tempStreak = 0;
  const sortedDates = [...dateSet].sort();
  for (let i = 0; i < sortedDates.length; i++) {
    if (i === 0) {
      tempStreak = 1;
    } else {
      const prev = new Date(sortedDates[i - 1]);
      const curr = new Date(sortedDates[i]);
      const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);
  }

  return { currentStreak, longestStreak, lastCheckinDate: lastDate };
}

router.get("/stats/streak", async (_req: Request, res: Response): Promise<void> => {
  const streakData = await computeStreak();
  res.json(GetStreakResponse.parse(streakData));
});

router.get("/stats/analytics", async (req: Request, res: Response): Promise<void> => {
  const query = GetAnalyticsQueryParams.safeParse(req.query);
  const days = query.success && query.data.days ? query.data.days : 30;

  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - (days - 1));

  const startStr = start.toISOString().split("T")[0];
  const endStr = end.toISOString().split("T")[0];

  const [tasks, habitLogs, activeHabits, leads] = await Promise.all([
    db.select().from(tasksTable),
    db.select().from(habitLogsTable).where(
      and(gte(habitLogsTable.date, startStr), lte(habitLogsTable.date, endStr))
    ),
    db.select().from(habitsTable).where(eq(habitsTable.isActive, true)),
    db.select().from(leadsTable),
  ]);

  const habitCount = activeHabits.length;

  const dailySummaries = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];

    const dayLogs = habitLogs.filter((l) => l.date === dateStr);
    const habitsCompleted = dayLogs.filter((l) => l.completed).length;

    const dayTasks = tasks.filter((t) => t.dueDate === dateStr && t.status === "completed");
    const tasksCompleted = dayTasks.length;

    const totalActivities = habitCount + (tasks.filter((t) => t.dueDate === dateStr).length || 1);
    const completedActivities = habitsCompleted + tasksCompleted;
    const productivityScore = totalActivities > 0
      ? Math.round((completedActivities / totalActivities) * 100)
      : 0;

    dailySummaries.push({ date: dateStr, tasksCompleted, habitsCompleted, productivityScore });
  }

  const statusGroups = ["new", "contacted", "interested", "follow_up", "closed", "lost"];
  const leadStatusCounts = statusGroups.map((status) => ({
    status,
    count: leads.filter((l) => l.status === status).length,
  }));

  const taskCompletionTrend = dailySummaries.map((d) => ({
    date: d.date,
    value: d.tasksCompleted,
  }));

  res.json(GetAnalyticsResponse.parse({
    dailySummaries,
    leadStatusCounts,
    taskCompletionTrend,
  }));
});

export default router;
