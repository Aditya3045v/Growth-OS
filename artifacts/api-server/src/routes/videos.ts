import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, videosTable } from "@workspace/db";
import {
  CreateVideoBody,
  UpdateVideoParams,
  UpdateVideoBody,
  DeleteVideoParams,
  ListVideosResponse,
  GetVideoResponse,
  UpdateVideoResponse,
} from "@workspace/api-zod";

const router = Router();

// List all videos
router.get("/videos", async (_req: any, res: any): Promise<void> => {
  const videos = await db.select().from(videosTable).orderBy(videosTable.folder, videosTable.createdAt);
  res.json(ListVideosResponse.parse(videos));
});

// Create a video
router.post("/videos", async (req: any, res: any): Promise<void> => {
  const parsed = CreateVideoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [video] = await db.insert(videosTable).values({
    title: parsed.data.title,
    url: parsed.data.url,
    folder: parsed.data.folder,
    notes: parsed.data.notes ?? null,
  }).returning();
  res.status(201).json(GetVideoResponse.parse(video));
});

// Update a video
router.patch("/videos/:id", async (req: any, res: any): Promise<void> => {
  const params = UpdateVideoParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = UpdateVideoBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
  if (parsed.data.url !== undefined) updateData.url = parsed.data.url;
  if (parsed.data.folder !== undefined) updateData.folder = parsed.data.folder;
  if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes;

  const [video] = await db.update(videosTable)
    .set(updateData as typeof videosTable.$inferInsert)
    .where(eq(videosTable.id, params.data.id))
    .returning();

  if (!video) { res.status(404).json({ error: "Video not found" }); return; }
  res.json(UpdateVideoResponse.parse(video));
});

// Delete a video
router.delete("/videos/:id", async (req: any, res: any): Promise<void> => {
  const params = DeleteVideoParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(videosTable).where(eq(videosTable.id, params.data.id));
  res.status(204).send();
});

export default router;
