import { useState, useEffect } from "react";
import { useListHabits, useGetTodayHabitLogs, useLogHabit, useCreateHabit } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Square, Check, Plus, Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function Habits() {
  const { data: habits, isLoading: habitsLoading } = useListHabits();
  const { data: logs, isLoading: logsLoading } = useGetTodayHabitLogs();
  
  if (habitsLoading || logsLoading) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const defaultHabits = habits?.filter(h => h.isDefault) || [];
  const customHabits = habits?.filter(h => !h.isDefault) || [];

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Daily Improvement</h1>
          <p className="text-muted-foreground mt-1">Track your mandatory systems and custom habits.</p>
        </div>
        <AddHabitModal />
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-display font-bold border-b border-border/50 pb-2">Core Systems</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {defaultHabits.map(habit => (
            <HabitCard key={habit.id} habit={habit} log={logs?.find(l => l.habitId === habit.id)} />
          ))}
        </div>
      </div>

      {customHabits.length > 0 && (
        <div className="space-y-6 pt-4">
          <h2 className="text-xl font-display font-bold border-b border-border/50 pb-2">Custom Habits</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {customHabits.map(habit => (
              <HabitCard key={habit.id} habit={habit} log={logs?.find(l => l.habitId === habit.id)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function HabitCard({ habit, log }: { habit: any, log: any }) {
  const isCompleted = log?.completed;
  
  return (
    <Card className={`overflow-hidden border transition-all duration-300 ${
      isCompleted 
        ? "bg-primary/5 border-primary/20 shadow-sm shadow-primary/5" 
        : "bg-card border-border/50 hover:border-border"
    }`}>
      <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between h-full">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{habit.category}</span>
            {isCompleted && <span className="bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold">DONE</span>}
          </div>
          <h3 className={`text-lg font-bold transition-colors ${isCompleted ? "text-foreground line-through opacity-70" : "text-foreground"}`}>
            {habit.title}
          </h3>
        </div>
        
        <div className="w-full sm:w-auto">
          <HabitInput habit={habit} log={log} isCompleted={isCompleted} />
        </div>
      </div>
    </Card>
  );
}

function HabitInput({ habit, log, isCompleted }: { habit: any, log: any, isCompleted: boolean }) {
  const logMutation = useLogHabit();
  const queryClient = useQueryClient();
  
  const handleComplete = (val?: string, duration?: number) => {
    logMutation.mutate(
      {
        id: habit.id,
        data: {
          completed: true,
          value: val || null,
          durationSeconds: duration || null,
        }
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/habit-logs/today"] });
          queryClient.invalidateQueries({ queryKey: ["/api/stats/dashboard"] });
        }
      }
    );
  };

  const handleUndo = () => {
    logMutation.mutate(
      {
        id: habit.id,
        data: { completed: false }
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/habit-logs/today"] });
          queryClient.invalidateQueries({ queryKey: ["/api/stats/dashboard"] });
        }
      }
    );
  };

  if (isCompleted) {
    return (
      <Button variant="outline" size="sm" onClick={handleUndo} className="w-full sm:w-auto border-primary/30 text-primary hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30">
        <Check className="h-4 w-4 mr-2" /> Completed
      </Button>
    );
  }

  // Input variants
  if (habit.inputType === "checkbox") {
    return (
      <Button 
        onClick={() => handleComplete()} 
        className="w-full sm:w-auto bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground"
      >
        Mark Done
      </Button>
    );
  }

  if (habit.inputType === "timer") {
    return <TimerControl onComplete={(dur) => handleComplete(undefined, dur)} />;
  }

  if (habit.inputType === "number" || habit.inputType === "text") {
    return (
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const val = fd.get("val") as string;
          if (val) handleComplete(val);
        }}
        className="flex items-center gap-2 w-full sm:w-auto"
      >
        <Input 
          name="val" 
          type={habit.inputType} 
          placeholder={habit.inputType === "number" ? "Amount" : "Value"} 
          className="w-24 h-9" 
          required 
        />
        <Button type="submit" size="sm">Save</Button>
      </form>
    );
  }

  return <Button onClick={() => handleComplete()}>Done</Button>;
}

function TimerControl({ onComplete }: { onComplete: (duration: number) => void }) {
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (isActive) {
      interval = setInterval(() => setSeconds(s => s + 1), 1000);
    } else if (!isActive && seconds !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, seconds]);

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="flex items-center gap-3 bg-secondary/50 p-1.5 rounded-lg border border-border/50">
      <div className="font-mono text-lg font-bold px-3 w-16 text-center">{formatTime(seconds)}</div>
      {!isActive ? (
        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-md text-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-500" onClick={() => setIsActive(true)}>
          <Play className="h-4 w-4" fill="currentColor" />
        </Button>
      ) : (
        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-md text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setIsActive(false)}>
          <Square className="h-4 w-4" fill="currentColor" />
        </Button>
      )}
      <Button 
        size="sm" 
        onClick={() => onComplete(seconds)} 
        disabled={seconds === 0 && !isActive}
        className="h-8 ml-1"
      >
        Log
      </Button>
    </div>
  );
}

function AddHabitModal() {
  const [open, setOpen] = useState(false);
  const createHabit = useCreateHabit();
  const queryClient = useQueryClient();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createHabit.mutate({
      data: {
        title: fd.get("title") as string,
        category: fd.get("category") as string,
        inputType: fd.get("inputType") as string,
      }
    }, {
      onSuccess: () => {
        setOpen(false);
        queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-xl gap-2 shadow-lg shadow-primary/20 bg-gradient-to-r from-primary to-accent hover:opacity-90">
          <Plus className="h-4 w-4" /> Add Custom Habit
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border/50">
        <DialogHeader>
          <DialogTitle>Create Custom Habit</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Habit Title</label>
            <Input name="title" placeholder="e.g. Read 10 pages" required className="bg-background" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            <Select name="category" defaultValue="personal">
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="health">Health & Fitness</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="personal">Personal Growth</SelectItem>
                <SelectItem value="mind">Mindfulness</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Tracking Type</label>
            <Select name="inputType" defaultValue="checkbox">
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Select tracking type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="checkbox">Simple Checkbox (Done/Not Done)</SelectItem>
                <SelectItem value="timer">Timer (Track duration)</SelectItem>
                <SelectItem value="number">Number (Track quantity)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full mt-4" disabled={createHabit.isPending}>
            {createHabit.isPending ? "Saving..." : "Create Habit"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
