import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, notesTable } from "@workspace/db";
import {
  CreateNoteBody,
  UpdateNoteBody,
  UpdateNoteParams,
  DeleteNoteParams,
  ListNotesQueryParams,
  ListNotesResponse,
  UpdateNoteResponse,
} from "@workspace/api-zod";

const router = Router();

router.get("/notes", async (req, res): Promise<void> => {
  const query = ListNotesQueryParams.safeParse(req.query);
  let notes = await db.select().from(notesTable).orderBy(notesTable.updatedAt);
  notes = notes.reverse();

  if (query.success && query.data.search) {
    const s = query.data.search.toLowerCase();
    notes = notes.filter(
      (n) =>
        n.title.toLowerCase().includes(s) ||
        n.content.toLowerCase().includes(s)
    );
  }
  if (query.success && query.data.tag) {
    notes = notes.filter((n) => n.tags.includes(query.data.tag!));
  }

  res.json(ListNotesResponse.parse(notes));
});

router.post("/notes", async (req, res): Promise<void> => {
  const parsed = CreateNoteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [note] = await db.insert(notesTable).values(parsed.data).returning();
  res.status(201).json(note);
});

router.patch("/notes/:id", async (req, res): Promise<void> => {
  const params = UpdateNoteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateNoteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [note] = await db.update(notesTable).set(parsed.data).where(eq(notesTable.id, params.data.id)).returning();
  if (!note) {
    res.status(404).json({ error: "Note not found" });
    return;
  }
  res.json(UpdateNoteResponse.parse(note));
});

router.delete("/notes/:id", async (req, res): Promise<void> => {
  const params = DeleteNoteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [note] = await db.delete(notesTable).where(eq(notesTable.id, params.data.id)).returning();
  if (!note) {
    res.status(404).json({ error: "Note not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
