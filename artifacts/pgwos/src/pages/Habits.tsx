import { useState, useEffect } from "react";
import { useListHabits, useGetTodayHabitLogs, useLogHabit, useCreateHabit, useDeleteHabit } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const CATEGORY_ICONS: Record<string, string> = {
  communication: "forum",
  sales:         "trending_up",
  leadership:    "star",
  confidence:    "shield",
  reflection:    "psychology",
  planning:      "event_note",
  health:        "fitness_center",
  business:      "business_center",
  personal:      "person",
  mind:          "self_improvement",
};
const CATEGORY_COLORS: Record<string, string> = {
  communication: "#94aaff",
  sales:         "#ffbd5c",
  leadership:    "#94aaff",
  confidence:    "#5cfd80",
  reflection:    "#ffbd5c",
  planning:      "#94aaff",
  health:        "#5cfd80",
  business:      "#ffbd5c",
  personal:      "#94aaff",
  mind:          "#5cfd80",
};

export default function Habits() {
  const { data: habits, isLoading } = useListHabits();
  const { data: logs } = useGetTodayHabitLogs();
  const [showAdd, setShowAdd] = useState(false);

  const categories = habits ? Array.from(new Set(habits.map((h) => h.category.toLowerCase()))) : [];

  const completedCount = logs?.filter((l) => l.completed).length || 0;
  const totalCount = habits?.length || 0;
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="py-6 space-y-6">
      {/* Header */}
      <div className="grid grid-cols-12 gap-4 items-end">
        <div className="col-span-8 space-y-1">
          <p className="text-[10px] font-['Inter'] uppercase tracking-[0.2em] text-[#adaaaa] font-bold">Growth OS / Daily Progress</p>
          <h2 className="font-['Manrope'] font-extrabold text-4xl tracking-tighter leading-none">
            Unlocking <br /><span className="text-[#94aaff] italic">Excellence.</span>
          </h2>
        </div>
        <div className="col-span-4 bg-[#131313] p-4 rounded-2xl ds-ghost-border border-l-4 border-[#5cfd80]">
          <p className="text-[#5cfd80] font-bold text-lg mb-1">{pct}% Complete</p>
          <div className="w-full bg-[#262626] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#5cfd80] h-full rounded-full shadow-[0_0_12px_rgba(92,253,128,0.4)] transition-all duration-1000"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-[#adaaaa] text-[10px] mt-2">
            {totalCount - completedCount} actions left
          </p>
        </div>
      </div>

      {/* Habits by category */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-40 bg-[#131313] rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-4">
          {categories.map((cat) => {
            const catHabits = habits?.filter((h) => h.category.toLowerCase() === cat) || [];
            const icon = CATEGORY_ICONS[cat] || "check_circle";
            const color = CATEGORY_COLORS[cat] || "#94aaff";
            return (
              <CategorySection
                key={cat}
                category={cat}
                icon={icon}
                color={color}
                habits={catHabits}
                logs={logs || []}
              />
            );
          })}
        </div>
      )}

      {/* Add habit button */}
      <button
        onClick={() => setShowAdd(true)}
        className="w-full flex items-center justify-center gap-2 py-4 bg-[#131313] rounded-2xl ds-ghost-border text-[#94aaff] font-['Manrope'] font-bold hover:bg-[#1a1a1a] transition-colors active:scale-[0.98]"
      >
        <span className="material-symbols-outlined">add_circle</span>
        Add Custom Habit
      </button>

      {showAdd && <AddHabitModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}

function CategorySection({ category, icon, color, habits, logs }: {
  category: string; icon: string; color: string; habits: any[]; logs: any[];
}) {
  const doneCount = habits.filter((h) => logs.find((l) => l.habitId === h.id)?.completed).length;
  return (
    <div className="bg-[#131313] p-5 rounded-2xl ds-ghost-border space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="material-symbols-outlined" style={{ color }}>{icon}</span>
        <h3 className="font-['Manrope'] font-bold text-lg text-white capitalize">{category}</h3>
        <span className="ml-auto text-xs text-[#adaaaa]">{doneCount}/{habits.length}</span>
      </div>
      <div className="space-y-3">
        {habits.map((habit) => {
          const log = logs.find((l) => l.habitId === habit.id);
          return <HabitItem key={habit.id} habit={habit} log={log} color={color} />;
        })}
      </div>
    </div>
  );
}

function HabitItem({ habit, log, color }: { habit: any; log: any; color: string }) {
  const isCompleted = log?.completed;
  const logMutation = useLogHabit();
  const deleteHabit = useDeleteHabit();
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/habit-logs/today"] });
    queryClient.invalidateQueries({ queryKey: ["/api/stats/dashboard"] });
  };

  const complete = (val?: string, duration?: number) => {
    logMutation.mutate({ id: habit.id, data: { completed: true, value: val || null, durationSeconds: duration || null } }, { onSuccess: invalidate });
  };

  const undo = () => {
    logMutation.mutate({ id: habit.id, data: { completed: false } }, { onSuccess: invalidate });
  };

  const remove = () => {
    if (confirm(`Delete habit "${habit.title}"?`)) {
      deleteHabit.mutate({ id: habit.id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
          invalidate();
        }
      });
    }
  };

  return (
    <div className={`flex items-center justify-between p-4 rounded-xl transition-colors group border ${isCompleted ? "bg-[rgba(92,253,128,0.05)] border-[rgba(92,253,128,0.1)]" : "bg-[#1a1a1a] border-[rgba(72,72,71,0.1)] hover:bg-[#2c2c2c]"}`}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div
          className="w-6 h-6 rounded border-2 flex items-center justify-center shrink-0 cursor-pointer transition-all"
          style={{
            borderColor: isCompleted ? "#5cfd80" : "#484847",
            backgroundColor: isCompleted ? "rgba(92,253,128,0.1)" : "transparent",
          }}
          onClick={() => (isCompleted ? undo() : habit.inputType === "checkbox" && complete())}
        >
          {isCompleted && <span className="material-symbols-outlined text-[#5cfd80] text-sm">check</span>}
        </div>
        <span className={`font-medium text-sm truncate ${isCompleted ? "line-through text-[#adaaaa]" : "text-white"}`}>
          {habit.title}
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {!isCompleted && habit.inputType === "timer" && (
          <TimerControl color={color} onComplete={(dur) => complete(undefined, dur)} />
        )}
        {!isCompleted && habit.inputType === "number" && (
          <NumberControl color={color} onComplete={(val) => complete(val)} />
        )}
        {!isCompleted && (habit.inputType === "notes" || habit.inputType === "text") && (
          <NotesControl onComplete={(val) => complete(val)} />
        )}
        {isCompleted && (
          <div className="flex items-center gap-2 bg-[rgba(92,253,128,0.1)] px-3 py-1 rounded-full border border-[rgba(92,253,128,0.2)]">
            <span className="material-symbols-outlined text-[#5cfd80] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>timer</span>
            {log?.durationSeconds ? (
              <span className="text-[#5cfd80] font-mono text-sm font-bold">
                {String(Math.floor(log.durationSeconds / 60)).padStart(2, "0")}:{String(log.durationSeconds % 60).padStart(2, "0")}
              </span>
            ) : log?.value ? (
              <span className="text-[#5cfd80] text-sm font-bold">{log.value}</span>
            ) : (
              <span className="text-[#5cfd80] text-sm font-bold">Done</span>
            )}
          </div>
        )}
        {!habit.isDefault && (
          <button onClick={remove} className="opacity-0 group-hover:opacity-100 p-1 rounded text-[#adaaaa] hover:text-[#ff6e84] transition-all">
            <span className="material-symbols-outlined text-[16px]">delete</span>
          </button>
        )}
      </div>
    </div>
  );
}

function TimerControl({ color, onComplete }: { color: string; onComplete: (dur: number) => void }) {
  const [secs, setSecs] = useState(0);
  const [active, setActive] = useState(false);

  useEffect(() => {
    let id: NodeJS.Timeout;
    if (active) id = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [active]);

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="flex items-center gap-2 bg-[rgba(148,170,255,0.08)] px-3 py-1.5 rounded-full border border-[rgba(148,170,255,0.2)]">
      <span className="font-mono text-sm font-bold" style={{ color }}>{fmt(secs)}</span>
      {!active ? (
        <button onClick={() => setActive(true)} className="transition-colors" style={{ color }}>
          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
        </button>
      ) : (
        <button onClick={() => setActive(false)} className="text-[#ff6e84]">
          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>stop</span>
        </button>
      )}
      <button
        disabled={secs === 0}
        onClick={() => onComplete(secs)}
        className="text-[10px] font-['Inter'] font-bold uppercase tracking-wider disabled:opacity-30"
        style={{ color }}
      >
        Log
      </button>
    </div>
  );
}

function NumberControl({ color, onComplete }: { color: string; onComplete: (val: string) => void }) {
  const [val, setVal] = useState("");
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (val) onComplete(val); }} className="flex items-center gap-2">
      <input
        type="number"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder="0"
        className="w-16 bg-[#262626] border-none rounded-lg text-white font-['Manrope'] font-bold text-base focus:outline-none focus:ring-1 focus:ring-[#94aaff] py-1.5 px-2 text-center"
        required
      />
      <button type="submit" className="text-[10px] font-['Inter'] font-bold uppercase tracking-wider px-2 py-1.5 rounded-lg bg-[rgba(148,170,255,0.1)]" style={{ color }}>
        Save
      </button>
    </form>
  );
}

function NotesControl({ onComplete }: { onComplete: (val: string) => void }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 text-[10px] font-['Inter'] font-bold uppercase tracking-wider text-[#94aaff] bg-[rgba(148,170,255,0.1)] px-3 py-1.5 rounded-full border border-[rgba(148,170,255,0.2)] hover:bg-[rgba(148,170,255,0.15)] transition-colors"
      >
        <span className="material-symbols-outlined text-sm">edit_note</span>
        Write
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        autoFocus
        className="w-full bg-[#262626] border-none rounded-xl text-sm text-white placeholder:text-[#767575] focus:outline-none focus:ring-1 focus:ring-[#94aaff] py-2 px-3 resize-none"
        placeholder="What did you do / learn?"
        rows={3}
      />
      <div className="flex gap-2">
        <button
          onClick={() => { setOpen(false); setNote(""); }}
          className="flex-1 py-1.5 text-[11px] font-bold text-[#adaaaa] bg-[#1a1a1a] rounded-lg"
        >
          Cancel
        </button>
        <button
          onClick={() => { if (note.trim()) { onComplete(note); setOpen(false); } }}
          className="flex-1 py-1.5 text-[11px] font-bold text-[#000] ds-liquid-gradient rounded-lg"
        >
          Save
        </button>
      </div>
    </div>
  );
}

function AddHabitModal({ onClose }: { onClose: () => void }) {
  const createHabit = useCreateHabit();
  const queryClient = useQueryClient();
  const [inputType, setInputType] = useState("checkbox");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createHabit.mutate({
      data: {
        title: fd.get("title") as string,
        category: fd.get("category") as string,
        inputType,
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
        onClose();
      }
    });
  };

  const types = [
    { value: "checkbox", label: "Checkbox" },
    { value: "timer",    label: "Timer" },
    { value: "number",   label: "Number" },
    { value: "notes",    label: "Notes" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#000]/70 backdrop-blur-sm p-4">
      <div className="bg-[#131313] w-full max-w-md rounded-3xl p-6 space-y-5 ds-ghost-border">
        <div className="flex justify-between items-center">
          <h3 className="font-['Manrope'] font-bold text-xl">Create Custom Habit</h3>
          <button onClick={onClose} className="p-1.5 rounded-full text-[#adaaaa] hover:bg-[#2c2c2c]">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-['Inter'] uppercase tracking-widest text-[#adaaaa] font-bold">Habit Title</label>
            <input
              name="title"
              required
              autoFocus
              className="w-full bg-[#262626] border-none rounded-xl py-3.5 px-4 text-white placeholder:text-[#767575] focus:outline-none focus:ring-1 focus:ring-[#94aaff]"
              placeholder="e.g. Read 10 pages"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-['Inter'] uppercase tracking-widest text-[#adaaaa] font-bold">Category</label>
            <select
              name="category"
              defaultValue="personal"
              className="w-full bg-[#262626] border-none rounded-xl py-3.5 px-4 text-white focus:outline-none focus:ring-1 focus:ring-[#94aaff]"
            >
              <option value="health">Health & Fitness</option>
              <option value="business">Business</option>
              <option value="personal">Personal Growth</option>
              <option value="mind">Mindfulness</option>
              <option value="communication">Communication</option>
              <option value="sales">Sales</option>
              <option value="leadership">Leadership</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-['Inter'] uppercase tracking-widest text-[#adaaaa] font-bold">Tracking Type</label>
            <div className="flex gap-2 flex-wrap">
              {types.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setInputType(t.value)}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all ${
                    inputType === t.value
                      ? "bg-[#94aaff] text-[#000]"
                      : "bg-[#262626] text-[#adaaaa] hover:text-white"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={createHabit.isPending}
            className="w-full ds-liquid-gradient py-4 rounded-2xl font-['Manrope'] font-extrabold text-[#000] text-base ds-inner-glow active:scale-[0.98] transition-transform disabled:opacity-50"
          >
            {createHabit.isPending ? "Creating..." : "Create Habit"}
          </button>
        </form>
      </div>
    </div>
  );
}
