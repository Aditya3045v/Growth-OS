import { useState, useEffect } from "react";
import { useGetTodayCheckin, useCreateCheckin } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

const MOODS = [
  { value: 1, emoji: "😩", label: "Rough" },
  { value: 2, emoji: "😕", label: "Meh" },
  { value: 3, emoji: "😐", label: "Okay" },
  { value: 4, emoji: "😊", label: "Good" },
  { value: 5, emoji: "🤩", label: "Great!" },
];

export function CheckInModal() {
  const { data: todayCheckin } = useGetTodayCheckin();
  const createCheckin = useCreateCheckin();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [mood, setMood] = useState<number>(3);
  const [energy, setEnergy] = useState<number>(3);
  const [focus, setFocus] = useState<number>(3);
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Only show modal if triggered by notification (?action=checkin)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("action") === "checkin") {
      setOpen(true);
      // Clean up URL without refreshing
      const newUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);

  const moodToStr = (m: number) => m <= 2 ? "low" : m === 3 ? "neutral" : "happy";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCheckin.mutate({
      data: {
        mood: moodToStr(mood),
        energyLevel: energy,
        focusLevel: focus,
        notes: notes.trim() || null,
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/checkins/today"] });
        queryClient.invalidateQueries({ queryKey: ["/api/stats/dashboard"] });
        setSubmitted(true);
        setTimeout(() => setOpen(false), 1500);
      }
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-[#000]/80 backdrop-blur-md p-4">
      <div className="bg-[#131313] w-full max-w-md rounded-3xl p-7 space-y-6 ds-ghost-border shadow-2xl">
        {submitted ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-20 h-20 mx-auto flex items-center justify-center rounded-full bg-[rgba(92,253,128,0.1)] border border-[rgba(92,253,128,0.2)]">
              <span className="material-symbols-outlined text-5xl text-[#5cfd80]">check_circle</span>
            </div>
            <div>
              <h3 className="font-['Manrope'] font-bold text-2xl">Logged!</h3>
              <p className="text-[#adaaaa] mt-1">Your daily reflection is complete.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-['Inter'] uppercase tracking-[0.2em] text-[#94aaff] font-bold">Daily Ritual</p>
                <h2 className="font-['Manrope'] font-extrabold text-2xl mt-1">Daily Reflection</h2>
                <p className="text-[#adaaaa] text-sm mt-1">{format(new Date(), "EEEE, MMMM d")}</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-2 rounded-xl text-[#adaaaa] hover:bg-[#2c2c2c] transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Mood Grid */}
              <div className="space-y-3">
                <label className="text-[10px] font-['Inter'] uppercase tracking-[0.15em] text-[#adaaaa] font-bold">How are you feeling?</label>
                <div className="flex justify-between gap-2">
                  {MOODS.map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setMood(m.value)}
                      className={`flex-1 flex flex-col items-center gap-1.5 py-3 px-1 rounded-2xl transition-all active:scale-90 ${
                        mood === m.value
                          ? "bg-[rgba(148,170,255,0.15)] border border-[rgba(148,170,255,0.3)] shadow-[0_0_20px_rgba(148,170,255,0.1)]"
                          : "bg-[#1a1a1a] border border-[rgba(72,72,71,0.1)] hover:bg-[#2c2c2c]"
                      }`}
                    >
                      <span className={`text-2xl transition-transform duration-200 ${mood === m.value ? "scale-125" : ""}`}>
                        {m.emoji}
                      </span>
                      <span className={`text-[9px] font-bold uppercase tracking-wider ${mood === m.value ? "text-[#94aaff]" : "text-[#adaaaa]"}`}>
                        {m.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Energy Slider */}
              <SliderField
                label="Energy Level"
                value={energy}
                onChange={setEnergy}
                min={1} max={5}
                labels={["Low", "Mid", "High"]}
                color="#ffbd5c"
              />

              {/* Focus Slider */}
              <SliderField
                label="Focus Level"
                value={focus}
                onChange={setFocus}
                min={1} max={5}
                labels={["Scattered", "Neutral", "Locked in"]}
                color="#5cfd80"
              />

              {/* Notes */}
              <div className="space-y-2">
                <label className="text-[10px] font-['Inter'] uppercase tracking-[0.15em] text-[#adaaaa] font-bold">Today's intention</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[#262626] border-none rounded-xl py-3.5 px-4 text-white placeholder:text-[#767575] focus:outline-none focus:ring-1 focus:ring-[#94aaff] resize-none text-sm leading-relaxed"
                  placeholder="What's your main focus for today?"
                  rows={3}
                />
              </div>

              <button
                type="submit"
                disabled={createCheckin.isPending}
                className="w-full ds-liquid-gradient py-4 rounded-2xl font-['Manrope'] font-extrabold text-[#000] text-base ds-inner-glow active:scale-[0.98] transition-transform shadow-[0_20px_40px_-10px_rgba(148,170,255,0.3)] disabled:opacity-50"
              >
                {createCheckin.isPending ? "Logging..." : "Log My Day →"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

function SliderField({ label, value, onChange, min, max, labels, color }: {
  label: string; value: number; onChange: (v: number) => void;
  min: number; max: number; labels: string[]; color: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label className="text-[10px] font-['Inter'] uppercase tracking-[0.15em] text-[#adaaaa] font-bold">{label}</label>
        <span className="font-['Manrope'] font-bold text-base" style={{ color }}>{value}/{max}</span>
      </div>
      <input
        type="range"
        className="custom-range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        style={{ accentColor: color }}
      />
      <div className="flex justify-between text-[9px] text-[#adaaaa] uppercase tracking-wider font-bold">
        {labels.map((l) => <span key={l}>{l}</span>)}
      </div>
    </div>
  );
}
