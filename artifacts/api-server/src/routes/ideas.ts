import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, ideasTable } from "@workspace/db";
import {
  CreateIdeaBody,
  UpdateIdeaParams,
  UpdateIdeaBody,
  DeleteIdeaParams,
  ListIdeasResponse,
  GetIdeaResponse,
  UpdateIdeaResponse,
} from "@workspace/api-zod";

const router = Router();

router.get("/ideas", async (_req: any, res: any): Promise<void> => {
  const ideas = await db.select().from(ideasTable).orderBy(ideasTable.createdAt);
  res.json(ListIdeasResponse.parse(ideas));
});

router.post("/ideas", async (req: any, res: any): Promise<void> => {
  const parsed = CreateIdeaBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [idea] = await db.insert(ideasTable).values({ text: parsed.data.text }).returning();
  res.status(201).json(GetIdeaResponse.parse(idea));
});

router.patch("/ideas/:id", async (req: any, res: any): Promise<void> => {
  const params = UpdateIdeaParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = UpdateIdeaBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [idea] = await db.update(ideasTable)
    .set(parsed.data)
    .where(eq(ideasTable.id, params.data.id))
    .returning();

  if (!idea) { res.status(404).json({ error: "Idea not found" }); return; }
  res.json(UpdateIdeaResponse.parse(idea));
});

router.delete("/ideas/:id", async (req: any, res: any): Promise<void> => {
  const params = DeleteIdeaParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(ideasTable).where(eq(ideasTable.id, params.data.id));
  res.status(204).send();
});

export default router;
