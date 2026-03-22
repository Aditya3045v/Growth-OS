import { useState } from "react";
import { useListNotes, useCreateNote, useUpdateNote, useDeleteNote } from "@workspace/api-client-react";
import type { Note } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { format } from "date-fns";

export default function Notes() {
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const { data: notes } = useListNotes(search ? { search } : undefined);
  const [showForm, setShowForm] = useState(false);
  const [editNote, setEditNote] = useState<Note | null>(null);
  const queryClient = useQueryClient();
  const deleteNote = useDeleteNote();

  const allTags = Array.from(new Set(notes?.flatMap((n) => n.tags || []) || []));
  const filtered = activeTag ? notes?.filter((n) => n.tags?.includes(activeTag)) : notes;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["/api/notes"] });

  const remove = (id: number) => {
    if (confirm("Delete this note?")) {
      deleteNote.mutate({ id }, { onSuccess: invalidate });
    }
  };

  return (
    <div className="py-6 space-y-6">
      {/* Header */}
      <section>
        <p className="text-[10px] font-['Inter'] uppercase tracking-[0.2em] text-[#94aaff] font-semibold mb-1">Knowledge Vault</p>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <h2 className="font-['Manrope'] font-extrabold text-4xl tracking-tight">Learning Log</h2>
          <div className="flex gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#adaaaa] text-[18px]">search</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#262626] border-none rounded-2xl py-3.5 pl-11 pr-4 text-white placeholder:text-[#767575] focus:outline-none focus:ring-1 focus:ring-[#94aaff] text-sm"
                placeholder="Filter through logs..."
              />
            </div>
            <button
              onClick={() => { setEditNote(null); setShowForm(true); }}
              className="flex items-center gap-2 px-5 py-3.5 ds-liquid-gradient rounded-2xl font-['Manrope'] font-bold text-[#000] ds-inner-glow active:scale-[0.98] transition-transform shrink-0 text-sm whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-[18px]">add_notes</span>
              Create New Note
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link href="/calendar">
          <button className="w-full flex items-center gap-3 p-4 bg-[#131313] rounded-2xl ds-ghost-border hover:border-[rgba(148,170,255,0.2)] transition-all group active:scale-[0.98]">
            <div className="w-10 h-10 rounded-xl bg-[rgba(148,170,255,0.1)] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[#94aaff] text-xl">calendar_month</span>
            </div>
            <div className="text-left min-w-0">
              <p className="font-['Manrope'] font-bold text-sm text-white">Calendar</p>
              <p className="text-[10px] text-[#adaaaa] truncate">Schedule &amp; events</p>
            </div>
          </button>
        </Link>
        <Link href="/tasks">
          <button className="w-full flex items-center gap-3 p-4 bg-[#131313] rounded-2xl ds-ghost-border hover:border-[rgba(92,253,128,0.2)] transition-all group active:scale-[0.98]">
            <div className="w-10 h-10 rounded-xl bg-[rgba(92,253,128,0.1)] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[#5cfd80] text-xl">task_alt</span>
            </div>
            <div className="text-left min-w-0">
              <p className="font-['Manrope'] font-bold text-sm text-white">Tasks</p>
              <p className="text-[10px] text-[#adaaaa] truncate">Action items</p>
            </div>
          </button>
        </Link>
        <Link href="/habits">
          <button className="w-full flex items-center gap-3 p-4 bg-[#131313] rounded-2xl ds-ghost-border hover:border-[rgba(255,189,92,0.2)] transition-all group active:scale-[0.98]">
            <div className="w-10 h-10 rounded-xl bg-[rgba(255,189,92,0.1)] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[#ffbd5c] text-xl">self_improvement</span>
            </div>
            <div className="text-left min-w-0">
              <p className="font-['Manrope'] font-bold text-sm text-white">Habits</p>
              <p className="text-[10px] text-[#adaaaa] truncate">Daily growth</p>
            </div>
          </button>
        </Link>
        <Link href="/analytics">
          <button className="w-full flex items-center gap-3 p-4 bg-[#131313] rounded-2xl ds-ghost-border hover:border-[rgba(148,170,255,0.2)] transition-all group active:scale-[0.98]">
            <div className="w-10 h-10 rounded-xl bg-[rgba(148,170,255,0.1)] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[#94aaff] text-xl">bar_chart</span>
            </div>
            <div className="text-left min-w-0">
              <p className="font-['Manrope'] font-bold text-sm text-white">Analytics</p>
              <p className="text-[10px] text-[#adaaaa] truncate">Insights &amp; data</p>
            </div>
          </button>
        </Link>
      </section>

      {/* Tag Filters */}
      {allTags.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setActiveTag(null)}
            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors ${
              activeTag === null ? "bg-[#94aaff] text-[#000]" : "bg-[#1a1a1a] text-[#adaaaa] hover:text-white ds-ghost-border"
            }`}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors ${
                activeTag === tag ? "bg-[#94aaff] text-[#000]" : "bg-[rgba(148,170,255,0.1)] text-[#94aaff] hover:bg-[rgba(148,170,255,0.15)]"
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Note form */}
      {showForm && (
        <NoteForm
          initial={editNote}
          onClose={() => { setShowForm(false); setEditNote(null); }}
          onSaved={invalidate}
        />
      )}

      {/* Recent Reflections */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-['Manrope'] font-bold text-lg">Recent Reflections</h3>
          <span className="text-[#adaaaa] text-sm">{filtered?.length || 0} notes</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {filtered?.length === 0 && (
            <div className="md:col-span-12 text-center py-20 bg-[#131313] rounded-2xl ds-ghost-border">
              <span className="material-symbols-outlined text-5xl text-[#484847]">auto_stories</span>
              <p className="text-[#adaaaa] mt-3 font-medium">No notes yet. Start capturing your thoughts!</p>
            </div>
          )}

          {filtered?.map((note, idx) => {
            const isLarge = idx === 0;
            return (
              <article
                key={note.id}
                className={`${isLarge && filtered.length > 1 ? "md:col-span-8" : "md:col-span-4"} bg-[#131313] rounded-2xl p-6 ds-ghost-border flex flex-col justify-between min-h-[200px] relative overflow-hidden group hover:border-[rgba(148,170,255,0.2)] transition-all cursor-pointer`}
                onClick={() => { setEditNote(note); setShowForm(true); }}
              >
                {/* Tags */}
                {note.tags && note.tags.length > 0 && (
                  <div className="flex gap-2 flex-wrap mb-4">
                    {note.tags.map((tag: string) => (
                      <span key={tag} className="px-2 py-0.5 bg-[rgba(148,170,255,0.1)] text-[#94aaff] rounded-full text-[10px] font-bold uppercase tracking-wider">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex-1">
                  <h4 className={`font-['Manrope'] font-bold leading-tight mb-2 ${isLarge ? "text-2xl" : "text-lg"}`}>
                    {note.title}
                  </h4>
                  <p className="text-[#adaaaa] text-sm leading-relaxed line-clamp-4">{note.content}</p>
                </div>

                <div className="flex items-center justify-between mt-5 pt-5 border-t border-[rgba(72,72,71,0.1)]">
                  <span className="text-[11px] text-[#adaaaa]/60 font-['Inter'] uppercase tracking-widest">
                    {format(new Date(note.createdAt), "MMM d, yyyy")}
                  </span>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditNote(note); setShowForm(true); }}
                      className="p-1.5 rounded-lg text-[#94aaff] hover:bg-[rgba(148,170,255,0.1)] transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); remove(note.id); }}
                      className="p-1.5 rounded-lg text-[#ff6e84] hover:bg-[rgba(255,110,132,0.1)] transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function NoteForm({ initial, onClose, onSaved }: {
  initial: Note | null; onClose: () => void; onSaved: () => void;
}) {
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const tagsRaw = fd.get("tags") as string;
    const tags = tagsRaw ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean) : [];
    const data = {
      title: fd.get("title") as string,
      content: fd.get("content") as string,
      tags,
    };
    const opts = { onSuccess: () => { onSaved(); onClose(); } };
    if (initial) {
      updateNote.mutate({ id: initial.id, data }, opts);
    } else {
      createNote.mutate({ data }, opts);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#000]/75 backdrop-blur-sm p-4">
      <div className="bg-[#131313] w-full max-w-2xl rounded-3xl p-6 space-y-5 ds-ghost-border max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center">
          <h3 className="font-['Manrope'] font-bold text-xl">{initial ? "Edit Note" : "Write a Note"}</h3>
          <button onClick={onClose} className="p-1.5 rounded-full text-[#adaaaa] hover:bg-[#2c2c2c]">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="title"
            required
            defaultValue={initial?.title || ""}
            autoFocus
            className="w-full bg-[#262626] border-none rounded-xl py-4 px-5 text-white placeholder:text-[#767575] focus:outline-none focus:ring-1 focus:ring-[#94aaff] font-['Manrope'] font-bold text-lg"
            placeholder="Note Title"
          />
          <textarea
            name="content"
            required
            defaultValue={initial?.content || ""}
            className="w-full bg-[#262626] border-none rounded-xl py-4 px-5 text-white placeholder:text-[#767575] focus:outline-none focus:ring-1 focus:ring-[#94aaff] resize-none leading-relaxed text-sm"
            placeholder="Write your thoughts here..."
            rows={8}
          />
          <input
            name="tags"
            defaultValue={initial?.tags?.join(", ") || ""}
            className="w-full bg-[#262626] border-none rounded-xl py-3.5 px-5 text-white placeholder:text-[#767575] focus:outline-none focus:ring-1 focus:ring-[#94aaff] text-sm"
            placeholder="Tags (comma separated, e.g. strategy, ideas)"
          />
          <button
            type="submit"
            disabled={createNote.isPending || updateNote.isPending}
            className="w-full ds-liquid-gradient py-4 rounded-2xl font-['Manrope'] font-extrabold text-[#000] ds-inner-glow active:scale-[0.98] transition-transform disabled:opacity-50"
          >
            {createNote.isPending || updateNote.isPending ? "Saving..." : initial ? "Update Note" : "Save Note"}
          </button>
        </form>
      </div>
    </div>
  );
}
