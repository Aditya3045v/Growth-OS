import { useState } from "react";
import { useListTasks, useCreateTask, useUpdateTask, useDeleteTask } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

type Priority = "low" | "medium" | "high";

export default function Tasks() {
  const { data: tasks, isLoading } = useListTasks();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState<any>(null);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    queryClient.invalidateQueries({ queryKey: ["/api/stats/dashboard"] });
  };

  const toggleTask = (id: number, currentStatus: string) => {
    updateTask.mutate({ id, data: { status: currentStatus === "completed" ? "pending" : "completed" } }, { onSuccess: invalidate });
  };

  const removeTask = (id: number) => {
    if (confirm("Delete this task?")) {
      deleteTask.mutate({ id }, { onSuccess: invalidate });
    }
  };

  const pending = tasks?.filter((t) => t.status !== "completed") || [];
  const completed = tasks?.filter((t) => t.status === "completed") || [];

  return (
    <div className="py-6 space-y-6">
      {/* Header */}
      <section className="space-y-2">
        <p className="text-[10px] font-['Inter'] uppercase tracking-[0.15em] text-[#94aaff] font-semibold">Zenith OS Sanctuary</p>
        <h2 className="font-['Manrope'] text-4xl font-extrabold tracking-tight">
          Design your <br /><span className="text-[#809bff]">productivity.</span>
        </h2>
      </section>

      {/* Add Task Button */}
      <button
        onClick={() => { setEditTask(null); setShowForm(true); }}
        className="w-full ds-liquid-gradient py-4 rounded-2xl font-['Manrope'] font-extrabold text-[#000] text-base ds-inner-glow active:scale-[0.98] transition-transform shadow-[0_20px_40px_-10px_rgba(148,170,255,0.25)]"
      >
        + New Task
      </button>

      {/* Task Form */}
      {showForm && (
        <TaskForm
          initial={editTask}
          onClose={() => { setShowForm(false); setEditTask(null); }}
          onSaved={invalidate}
        />
      )}

      {/* Pending Tasks */}
      {pending.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-[10px] font-['Inter'] uppercase tracking-[0.15em] text-[#adaaaa] font-bold px-1">
            To Do ({pending.length})
          </h3>
          {pending.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onToggle={() => toggleTask(task.id, task.status)}
              onDelete={() => removeTask(task.id)}
              onEdit={() => { setEditTask(task); setShowForm(true); }}
            />
          ))}
        </div>
      )}

      {pending.length === 0 && !isLoading && (
        <div className="text-center py-16 bg-[#131313] rounded-2xl ds-ghost-border">
          <span className="material-symbols-outlined text-5xl text-[#484847]">task_alt</span>
          <p className="text-[#adaaaa] mt-3 font-medium">All caught up! 🎉</p>
        </div>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <div className="space-y-3 opacity-50">
          <h3 className="text-[10px] font-['Inter'] uppercase tracking-[0.15em] text-[#adaaaa] font-bold px-1">
            Completed ({completed.length})
          </h3>
          {completed.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onToggle={() => toggleTask(task.id, task.status)}
              onDelete={() => removeTask(task.id)}
              onEdit={() => { setEditTask(task); setShowForm(true); }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TaskRow({ task, onToggle, onDelete, onEdit }: {
  task: any; onToggle: () => void; onDelete: () => void; onEdit: () => void;
}) {
  const priorityStyle: Record<Priority, { color: string; bg: string }> = {
    high:   { color: "#ff6e84", bg: "rgba(255,110,132,0.1)" },
    medium: { color: "#ffbd5c", bg: "rgba(255,189,92,0.1)" },
    low:    { color: "#94aaff", bg: "rgba(148,170,255,0.1)" },
  };
  const ps = priorityStyle[(task.priority as Priority) || "medium"];

  return (
    <div className="flex items-start gap-4 p-4 bg-[#131313] rounded-2xl ds-ghost-border group hover:border-[rgba(148,170,255,0.2)] transition-all">
      <button
        onClick={onToggle}
        className="mt-0.5 w-6 h-6 rounded border-2 flex items-center justify-center shrink-0 transition-all"
        style={{
          borderColor: task.status === "completed" ? "#5cfd80" : "#484847",
          backgroundColor: task.status === "completed" ? "rgba(92,253,128,0.1)" : "transparent",
        }}
      >
        {task.status === "completed" && (
          <span className="material-symbols-outlined text-[#5cfd80] text-sm font-bold">check</span>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <p className={`font-medium text-base ${task.status === "completed" ? "line-through text-[#adaaaa]" : "text-white"}`}>
          {task.title}
        </p>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ color: ps.color, backgroundColor: ps.bg }}>
            {task.priority || "medium"}
          </span>
          {task.dueDate && (
            <span className="flex items-center gap-1 text-xs text-[#adaaaa]">
              <span className="material-symbols-outlined text-sm">calendar_today</span>
              {format(new Date(task.dueDate), "MMM d")}
            </span>
          )}
          {task.dueTime && (
            <span className="flex items-center gap-1 text-xs text-[#adaaaa]">
              <span className="material-symbols-outlined text-sm">schedule</span>
              {task.dueTime}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onEdit} className="p-1.5 rounded-lg text-[#adaaaa] hover:text-[#94aaff] hover:bg-[#1a1a1a] transition-colors">
          <span className="material-symbols-outlined text-[16px]">edit</span>
        </button>
        <button onClick={onDelete} className="p-1.5 rounded-lg text-[#adaaaa] hover:text-[#ff6e84] hover:bg-[rgba(255,110,132,0.1)] transition-colors">
          <span className="material-symbols-outlined text-[16px]">delete</span>
        </button>
      </div>
    </div>
  );
}

function TaskForm({ initial, onClose, onSaved }: { initial: any; onClose: () => void; onSaved: () => void }) {
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const [priority, setPriority] = useState<Priority>(initial?.priority || "medium");
  const [title, setTitle] = useState(initial?.title || "");
  const [dueDate, setDueDate] = useState(initial?.dueDate ? initial.dueDate.split("T")[0] : "");
  const [dueTime, setDueTime] = useState(initial?.dueTime || "");
  const [description, setDescription] = useState(initial?.description || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const data = { title, priority, dueDate: dueDate || null, dueTime: dueTime || null };
    const opts = { onSuccess: () => { onSaved(); onClose(); } };
    if (initial) {
      updateTask.mutate({ id: initial.id, data }, opts);
    } else {
      createTask.mutate({ data }, opts);
    }
  };

  const priorities: Priority[] = ["low", "medium", "high"];

  return (
    <div className="bg-[#131313] rounded-2xl p-6 space-y-6 ds-ghost-border">
      <div className="flex justify-between items-center">
        <h3 className="font-['Manrope'] font-bold text-lg">{initial ? "Edit Task" : "New Task"}</h3>
        <button onClick={onClose} className="p-1.5 rounded-lg text-[#adaaaa] hover:bg-[#1a1a1a] transition-colors">
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <div className="space-y-2">
          <label className="text-[10px] font-['Inter'] uppercase tracking-widest text-[#adaaaa] font-bold px-1">Task Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-[#262626] border-none rounded-xl py-4 px-5 text-white placeholder:text-[#767575] focus:outline-none focus:ring-1 focus:ring-[#94aaff] text-base font-medium"
            placeholder="Enter task name..."
            required
            autoFocus
          />
        </div>

        {/* Date + Priority grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-[#0e0e0e] rounded-2xl p-5 ds-ghost-border space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-[#1a1a1a] rounded-lg">
                <span className="material-symbols-outlined text-[#94aaff] text-[18px]">calendar_today</span>
              </div>
              <span className="text-[10px] font-['Inter'] uppercase tracking-widest text-[#adaaaa] font-bold">Due Date</span>
            </div>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="bg-transparent border-none text-white font-['Manrope'] text-base focus:outline-none w-full"
            />
          </div>

          <div className="bg-[#0e0e0e] rounded-2xl p-5 ds-ghost-border space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-[#1a1a1a] rounded-lg">
                <span className="material-symbols-outlined text-[#ffbd5c] text-[18px]">priority_high</span>
              </div>
              <span className="text-[10px] font-['Inter'] uppercase tracking-widest text-[#adaaaa] font-bold">Priority</span>
            </div>
            <div className="flex bg-[#262626] p-1 rounded-xl">
              {priorities.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`flex-1 py-2 text-[11px] font-['Inter'] font-bold uppercase rounded-lg transition-all ${
                    priority === p ? "bg-[#2c2c2c] text-white shadow-sm" : "text-[#adaaaa] hover:text-white"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="text-[10px] font-['Inter'] uppercase tracking-widest text-[#adaaaa] font-bold px-1">Description</label>
          <div className="bg-[#0e0e0e] rounded-2xl p-1 ds-ghost-border">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-transparent border-none rounded-xl py-4 px-5 text-white placeholder:text-[#767575] focus:outline-none resize-none leading-relaxed text-sm"
              placeholder="What needs to be done? Define the outcome..."
              rows={4}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={createTask.isPending || updateTask.isPending}
          className="w-full ds-liquid-gradient py-4 rounded-2xl font-['Manrope'] font-extrabold text-[#000] text-base ds-inner-glow active:scale-[0.98] transition-transform shadow-[0_20px_40px_-10px_rgba(148,170,255,0.3)] disabled:opacity-50"
        >
          {createTask.isPending || updateTask.isPending ? "Saving..." : initial ? "Update Task" : "Create Task"}
        </button>
      </form>
    </div>
  );
}
