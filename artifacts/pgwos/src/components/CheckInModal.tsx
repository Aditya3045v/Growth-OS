import { useState, useEffect } from "react";
import { useGetTodayCheckin, useCreateCheckin } from "@workspace/api-client-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Smile, Meh, Frown, Sparkles, Zap } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export function CheckInModal() {
  const [isOpen, setIsOpen] = useState(false);
  const { data, isLoading } = useGetTodayCheckin();
  const createCheckin = useCreateCheckin();
  const queryClient = useQueryClient();

  const [mood, setMood] = useState<string>("happy");
  const [energyLevel, setEnergyLevel] = useState(7);
  const [focusLevel, setFocusLevel] = useState(7);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!isLoading && data && !data.checkin) {
      setIsOpen(true);
    }
  }, [data, isLoading]);

  const handleSubmit = () => {
    createCheckin.mutate(
      {
        data: {
          mood,
          energyLevel,
          focusLevel,
          notes: notes || null,
        }
      },
      {
        onSuccess: () => {
          setIsOpen(false);
          queryClient.invalidateQueries({ queryKey: ["/api/checkins/today"] });
          queryClient.invalidateQueries({ queryKey: ["/api/stats/dashboard"] });
          queryClient.invalidateQueries({ queryKey: ["/api/stats/streak"] });
        }
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && false}> {/* Prevent manual close */}
      <DialogContent className="sm:max-w-[500px] border-border/50 bg-card shadow-2xl shadow-primary/10">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display">Daily Check-in</DialogTitle>
          <DialogDescription>
            Take a moment to reflect before starting your day. This maintains your streak!
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">How are you feeling?</Label>
            <div className="flex gap-3">
              {[
                { value: "happy", icon: Smile, label: "Great" },
                { value: "neutral", icon: Meh, label: "Okay" },
                { value: "low", icon: Frown, label: "Low" }
              ].map(m => (
                <button
                  key={m.value}
                  onClick={() => setMood(m.value)}
                  className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-xl border-2 transition-all ${
                    mood === m.value 
                      ? "border-primary bg-primary/10 text-primary" 
                      : "border-border hover:border-primary/50 text-muted-foreground hover:bg-accent/5"
                  }`}
                >
                  <m.icon className="h-8 w-8" />
                  <span className="font-medium text-sm">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label className="flex justify-between text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              <span className="flex items-center gap-2"><Zap className="h-4 w-4" /> Energy Level</span>
              <span className="text-primary">{energyLevel}/10</span>
            </Label>
            <input 
              type="range" 
              min="1" max="10" 
              value={energyLevel} 
              onChange={(e) => setEnergyLevel(parseInt(e.target.value))}
              className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>

          <div className="space-y-3">
            <Label className="flex justify-between text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              <span className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> Focus Level</span>
              <span className="text-primary">{focusLevel}/10</span>
            </Label>
            <input 
              type="range" 
              min="1" max="10" 
              value={focusLevel} 
              onChange={(e) => setFocusLevel(parseInt(e.target.value))}
              className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Intentions for today (Optional)</Label>
            <Textarea 
              placeholder="What's your main focus?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resize-none h-20 rounded-xl bg-background border-2 focus-visible:ring-primary/20"
            />
          </div>
        </div>

        <Button 
          onClick={handleSubmit} 
          disabled={createCheckin.isPending}
          className="w-full h-12 text-lg rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg shadow-primary/25"
        >
          {createCheckin.isPending ? "Starting Day..." : "Start My Day"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
