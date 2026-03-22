import { useListEvents } from "@workspace/api-client-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";
import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function Calendar() {
  const { data: events, isLoading } = useListEvents();
  
  if (isLoading) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const today = new Date();
  const start = startOfMonth(today);
  const end = endOfMonth(today);
  const days = eachDayOfInterval({ start, end });

  return (
    <div className="space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-display font-bold">Schedule</h1>
        <p className="text-muted-foreground mt-1">{format(today, "MMMM yyyy")}</p>
      </div>

      <Card className="p-4 sm:p-6 bg-card border-border/50 rounded-2xl shadow-sm">
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider py-2">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {/* Empty cells for offset */}
          {Array.from({ length: start.getDay() }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[80px] sm:min-h-[120px] rounded-xl bg-secondary/20 border border-transparent"></div>
          ))}
          
          {days.map(day => {
            const dayEvents = events?.filter(e => isSameDay(new Date(e.startDate), day)) || [];
            const isToday = isSameDay(day, today);
            
            return (
              <div 
                key={day.toISOString()} 
                className={`min-h-[80px] sm:min-h-[120px] rounded-xl border p-1 sm:p-2 transition-colors ${
                  isToday 
                    ? "border-primary bg-primary/5 shadow-inner shadow-primary/10" 
                    : "border-border/50 bg-background hover:border-primary/30"
                }`}
              >
                <div className={`text-right text-sm font-semibold mb-1 ${isToday ? "text-primary" : "text-muted-foreground"}`}>
                  {format(day, "d")}
                </div>
                <div className="space-y-1">
                  {dayEvents.map(event => (
                    <div 
                      key={event.id} 
                      className="text-[10px] sm:text-xs truncate px-1.5 py-0.5 rounded bg-primary text-primary-foreground font-medium shadow-sm"
                      title={event.title}
                    >
                      {event.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
