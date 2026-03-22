import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, checkinsTable } from "@workspace/db";
import {
  CreateCheckinBody,
  ListCheckinsQueryParams,
  ListCheckinsResponse,
  GetTodayCheckinResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const toCheckin = (c: any) => ({ ...c, date: new Date(c.date), createdAt: new Date(c.createdAt) });

router.get("/checkins/today", async (_req, res): Promise<void> => {
  const today = new Date().toISOString().split("T")[0];
  const [checkin] = await db.select().from(checkinsTable).where(eq(checkinsTable.date, today));
  res.json(GetTodayCheckinResponse.parse({ checkin: checkin ? toCheckin(checkin) : null }));
});

router.get("/checkins", async (req, res): Promise<void> => {
  const query = ListCheckinsQueryParams.safeParse(req.query);
  const limit = query.success && query.data.limit ? query.data.limit : 30;
  const checkins = await db.select().from(checkinsTable).orderBy(desc(checkinsTable.date)).limit(limit);
  res.json(ListCheckinsResponse.parse(checkins.map(toCheckin)));
});

router.post("/checkins", async (req, res): Promise<void> => {
  const parsed = CreateCheckinBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const today = new Date().toISOString().split("T")[0];
  const existing = await db.select().from(checkinsTable).where(eq(checkinsTable.date, today));

  let checkin;
  if (existing.length > 0) {
    [checkin] = await db.update(checkinsTable).set(parsed.data).where(eq(checkinsTable.date, today)).returning();
  } else {
    [checkin] = await db.insert(checkinsTable).values({ ...parsed.data, date: today }).returning();
  }

  res.status(201).json(checkin ? toCheckin(checkin) : checkin);
});

export default router;
