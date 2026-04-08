import { Router } from "express";
import { eq, and, gte, lte } from "drizzle-orm";
import { db, habitsTable, habitLogsTable } from "@workspace/db";
import type { HabitLog } from "@workspace/db";
import {
  CreateHabitBody,
  UpdateHabitBody,
  UpdateHabitParams,
  GetHabitParams,
  DeleteHabitParams,
  LogHabitBody,
  LogHabitParams,
  GetHabitHistoryQueryParams,
  ListHabitsResponse,
  GetHabitResponse,
  UpdateHabitResponse,
  LogHabitResponse,
  GetTodayHabitLogsResponse,
  GetHabitHistoryResponse,
} from "@workspace/api-zod";

const router = Router();

const DEFAULT_HABITS = [
  { title: "Speak out loud for 15 minutes", category: "Communication", inputType: "timer", order: 1 },
  { title: "Send outreach messages", category: "Sales", inputType: "number", order: 2 },
  { title: "Explain one concept to someone", category: "Leadership", inputType: "notes", order: 3 },
  { title: "Read English out loud for 10 minutes", category: "Communication", inputType: "timer", order: 4 },
  { title: "Start one conversation", category: "Confidence", inputType: "checkbox", order: 5 },
  { title: "Record one progress video", category: "Communication", inputType: "checkbox", order: 6 },
  { title: "Do one leadership action", category: "Leadership", inputType: "text", order: 7 },
  { title: "Review today's progress", category: "Reflection", inputType: "notes", order: 8 },
  { title: "Plan tomorrow's tasks", category: "Planning", inputType: "notes", order: 9 },
];

async function seedDefaultHabits() {
  const existing = await db.select().from(habitsTable).limit(1);
  if (existing.length === 0) {
    await db.insert(habitsTable).values(
      DEFAULT_HABITS.map((h) => ({ ...h, isDefault: true, isActive: true }))
    );
  }
}

seedDefaultHabits().catch(() => {});

router.get("/habits", async (_req: any, res: any): Promise<void> => {
  const habits = await db.select().from(habitsTable).orderBy(habitsTable.order);
  res.json(ListHabitsResponse.parse(habits));
});

router.post("/habits", async (req: any, res: any): Promise<void> => {
  const parsed = CreateHabitBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [habit] = await db.insert(habitsTable).values({ ...parsed.data, isDefault: false, isActive: true }).returning();
  res.status(201).json(GetHabitResponse.parse(habit));
});

router.get("/habits/:id", async (req: any, res: any): Promise<void> => {
  const params = GetHabitParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [habit] = await db.select().from(habitsTable).where(eq(habitsTable.id, params.data.id));
  if (!habit) {
    res.status(404).json({ error: "Habit not found" });
    return;
  }
  res.json(GetHabitResponse.parse(habit));
});

router.patch("/habits/:id", async (req: any, res: any): Promise<void> => {
  const params = UpdateHabitParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateHabitBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [habit] = await db.update(habitsTable).set(parsed.data).where(eq(habitsTable.id, params.data.id)).returning();
  if (!habit) {
    res.status(404).json({ error: "Habit not found" });
    return;
  }
  res.json(UpdateHabitResponse.parse(habit));
});

router.delete("/habits/:id", async (req: any, res: any): Promise<void> => {
  const params = DeleteHabitParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [habit] = await db.delete(habitsTable).where(eq(habitsTable.id, params.data.id)).returning();
  if (!habit) {
    res.status(404).json({ error: "Habit not found" });
    return;
  }
  res.sendStatus(204);
});

router.post("/habits/:id/log", async (req: any, res: any): Promise<void> => {
  const params = LogHabitParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = LogHabitBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const today = new Date().toISOString().split("T")[0];

  const existing = await db.select().from(habitLogsTable).where(
    and(eq(habitLogsTable.habitId, params.data.id), eq(habitLogsTable.date, today))
  );

  let log;
  if (existing.length > 0) {
    [log] = await db.update(habitLogsTable)
      .set(parsed.data)
      .where(and(eq(habitLogsTable.habitId, params.data.id), eq(habitLogsTable.date, today)))
      .returning();
  } else {
    [log] = await db.insert(habitLogsTable).values({
      habitId: params.data.id,
      date: today,
      ...parsed.data,
    }).returning();
  }

  const toLog = (l: HabitLog) => ({ ...l, date: new Date(l.date) });
  res.json(LogHabitResponse.parse(log ? toLog(log) : log));
});

router.get("/habit-logs/today", async (_req, res): Promise<void> => {
  const today = new Date().toISOString().split("T")[0];
  const logs = await db.select().from(habitLogsTable).where(eq(habitLogsTable.date, today));
  const toLog = (l: HabitLog) => ({ ...l, date: new Date(l.date) });
  res.json(GetTodayHabitLogsResponse.parse(logs.map(toLog)));
});

router.get("/habit-logs/history", async (req: any, res: any): Promise<void> => {
  const query = GetHabitHistoryQueryParams.safeParse(req.query);
  const days = query.success && query.data.days ? query.data.days : 30;

  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);

  const startStr = start.toISOString().split("T")[0];
  const endStr = end.toISOString().split("T")[0];

  const logs = await db.select().from(habitLogsTable).where(
    and(gte(habitLogsTable.date, startStr), lte(habitLogsTable.date, endStr))
  );

  const totalHabits = await db.select().from(habitsTable).where(eq(habitsTable.isActive, true));
  const habitCount = totalHabits.length;

  const summaryMap = new Map<string, { completed: number }>();
  for (const log of logs) {
    if (!summaryMap.has(log.date)) summaryMap.set(log.date, { completed: 0 });
    if (log.completed) summaryMap.get(log.date)!.completed++;
  }

  const summaries = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    const data = summaryMap.get(dateStr) ?? { completed: 0 };
    summaries.push({
      date: dateStr,
      totalHabits: habitCount,
      completedHabits: data.completed,
      completionRate: habitCount > 0 ? Math.round((data.completed / habitCount) * 100) / 100 : 0,
    });
  }

  res.json(GetHabitHistoryResponse.parse(summaries));
});

export default router;
