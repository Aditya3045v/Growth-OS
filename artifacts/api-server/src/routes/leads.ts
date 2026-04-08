import { Router } from "express";
import { eq, ilike, or } from "drizzle-orm";
import { db, leadsTable } from "@workspace/db";
import {
  CreateLeadBody,
  UpdateLeadBody,
  UpdateLeadParams,
  GetLeadParams,
  DeleteLeadParams,
  ListLeadsQueryParams,
  ListLeadsResponse,
  GetLeadResponse,
  UpdateLeadResponse,
} from "@workspace/api-zod";

const router = Router();

router.get("/leads", async (req: any, res: any): Promise<void> => {
  const query = ListLeadsQueryParams.safeParse(req.query);
  let leads = await db.select().from(leadsTable).orderBy(leadsTable.createdAt);

  if (query.success && query.data.status) {
    leads = leads.filter((l) => l.status === query.data.status);
  }
  if (query.success && query.data.search) {
    const s = query.data.search.toLowerCase();
    leads = leads.filter(
      (l) =>
        l.name.toLowerCase().includes(s) ||
        (l.businessName && l.businessName.toLowerCase().includes(s)) ||
        (l.email && l.email.toLowerCase().includes(s)) ||
        (l.phone && l.phone.toLowerCase().includes(s))
    );
  }

  res.json(ListLeadsResponse.parse(leads));
});

router.post("/leads", async (req: any, res: any): Promise<void> => {
  const parsed = CreateLeadBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [lead] = await db.insert(leadsTable).values(parsed.data).returning();
  res.status(201).json(GetLeadResponse.parse(lead));
});

router.get("/leads/:id", async (req: any, res: any): Promise<void> => {
  const params = GetLeadParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [lead] = await db.select().from(leadsTable).where(eq(leadsTable.id, params.data.id));
  if (!lead) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }
  res.json(GetLeadResponse.parse(lead));
});

router.patch("/leads/:id", async (req: any, res: any): Promise<void> => {
  const params = UpdateLeadParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateLeadBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [lead] = await db.update(leadsTable).set(parsed.data).where(eq(leadsTable.id, params.data.id)).returning();
  if (!lead) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }
  res.json(UpdateLeadResponse.parse(lead));
});

router.delete("/leads/:id", async (req: any, res: any): Promise<void> => {
  const params = DeleteLeadParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [lead] = await db.delete(leadsTable).where(eq(leadsTable.id, params.data.id)).returning();
  if (!lead) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
