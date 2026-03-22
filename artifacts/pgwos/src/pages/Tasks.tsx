import { useState } from "react";
import { useListTasks, useCreateTask, useUpdateTask, useDeleteTask } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Calendar, Trash2, Clock } from "lucide-react";

export default function Tasks() {
  const { data: tasks, isLoading } = useListTasks();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const queryClient = useQueryClient();

  if (isLoading) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const toggleTask = (id: number, currentStatus: string) => {
    updateTask.mutate({
      id,
      data: { status: currentStatus === "completed" ? "pending" : "completed" }
    }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/tasks"] })
    });
  };

  const removeTask = (id: number) => {
    if(confirm("Delete this task?")) {
      deleteTask.mutate({ id }, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/tasks"] })
      });
    }
  };

  const pendingTasks = tasks?.filter(t => t.status !== "completed") || [];
  const completedTasks = tasks?.filter(t => t.status === "completed") || [];

  return (
    <div className="space-y-8 pb-20 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Action Items</h1>
          <p className="text-muted-foreground mt-1">Focus on high priority tasks first.</p>
        </div>
        <AddTaskModal />
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/50 pb-2">
          To Do ({pendingTasks.length})
        </h2>
        {pendingTasks.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-border rounded-xl bg-secondary/20">
            <p className="text-muted-foreground">All caught up! 🎉</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingTasks.map(task => (
              <TaskRow 
                key={task.id} 
                task={task} 
                onToggle={() => toggleTask(task.id, task.status)} 
                onDelete={() => removeTask(task.id)} 
              />
            ))}
          </div>
        )}
      </div>

      {completedTasks.length > 0 && (
        <div className="space-y-4 pt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/50 pb-2">
            Completed ({completedTasks.length})
          </h2>
          <div className="space-y-3 opacity-60">
            {completedTasks.map(task => (
              <TaskRow 
                key={task.id} 
                task={task} 
                onToggle={() => toggleTask(task.id, task.status)} 
                onDelete={() => removeTask(task.id)} 
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TaskRow({ task, onToggle, onDelete }: { task: any, onToggle: () => void, onDelete: () => void }) {
  const priorityColor = {
    high: "bg-red-500/10 text-red-500 border-red-500/20",
    medium: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    low: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  }[task.priority as 'high'|'medium'|'low'] || "bg-secondary text-secondary-foreground";

  return (
    <div className={`group flex items-start gap-4 p-4 rounded-xl border transition-all ${task.status === "completed" ? "bg-secondary/30 border-transparent" : "bg-card border-border hover:border-primary/30 hover:shadow-md"}`}>
      <Checkbox 
        checked={task.status === "completed"} 
        onCheckedChange={onToggle}
        className="mt-1 h-5 w-5 rounded-full"
      />
      <div className="flex-1 min-w-0">
        <h3 className={`font-semibold text-base ${task.status === "completed" ? "line-through text-muted-foreground" : "text-foreground"}`}>
          {task.title}
        </h3>
        <div className="flex flex-wrap items-center gap-3 mt-2">
          <Badge variant="outline" className={`uppercase text-[10px] tracking-wider font-bold ${priorityColor}`}>
            {task.priority}
          </Badge>
          {task.dueDate && (
            <span className="flex items-center text-xs font-medium text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-md">
              <Calendar className="h-3 w-3 mr-1.5" /> 
              {format(new Date(task.dueDate), "MMM d")}
            </span>
          )}
          {task.dueTime && (
            <span className="flex items-center text-xs font-medium text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-md">
              <Clock className="h-3 w-3 mr-1.5" /> 
              {task.dueTime}
            </span>
          )}
        </div>
      </div>
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10 -mt-1 -mr-1"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

function AddTaskModal() {
  const [open, setOpen] = useState(false);
  const createTask = useCreateTask();
  const queryClient = useQueryClient();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createTask.mutate({
      data: {
        title: fd.get("title") as string,
        priority: fd.get("priority") as string,
        dueDate: fd.get("dueDate") as string || null,
        dueTime: fd.get("dueTime") as string || null,
      }
    }, {
      onSuccess: () => {
        setOpen(false);
        queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
        queryClient.invalidateQueries({ queryKey: ["/api/stats/dashboard"] });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-xl shadow-lg shadow-primary/20 bg-gradient-to-r from-primary to-accent hover:opacity-90">
          <Plus className="h-4 w-4 mr-2" /> New Task
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border/50">
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Task Title *</label>
            <Input name="title" required autoFocus className="bg-background" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Priority</label>
            <Select name="priority" defaultValue="medium">
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low Priority</SelectItem>
                <SelectItem value="medium">Medium Priority</SelectItem>
                <SelectItem value="high">High Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Due Date</label>
              <Input name="dueDate" type="date" className="bg-background" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Time</label>
              <Input name="dueTime" type="time" className="bg-background" />
            </div>
          </div>
          <Button type="submit" className="w-full mt-4" disabled={createTask.isPending}>
            {createTask.isPending ? "Saving..." : "Add Task"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
