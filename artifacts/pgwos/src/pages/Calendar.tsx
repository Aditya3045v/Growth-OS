import { useState } from "react";
import { useListEvents, useCreateEvent, useUpdateEvent, useDeleteEvent } from "@workspace/api-client-react";
import type { CalendarEvent } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  format, addMonths, subMonths, eachDayOfInterval,
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  isSameDay, isSameMonth, addDays, subDays, addWeeks, subWeeks, parseISO,
} from "date-fns";

type ViewMode = "day" | "week" | "month";
const HOURS = Array.from({ length: 14 }, (_, i) => i + 7);

export default function Calendar() {
  const { data: events } = useListEvents();
  const queryClient = useQueryClient();
  const deleteEvent = useDeleteEvent();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [showForm, setShowForm] = useState(false);
  const [editEvent, setEditEvent] = useState<CalendarEvent | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["/api/events"] });

  const removeEvent = (id: number) => {
    if (confirm("Delete this event?")) {
      deleteEvent.mutate({ id }, { onSuccess: invalidate });
    }
  };

  const navigatePrev = () => {
    if (viewMode === "month") setCurrentMonth((m) => subMonths(m, 1));
    else if (viewMode === "week") setSelectedDate((d) => subWeeks(d, 1));
    else setSelectedDate((d) => subDays(d, 1));
  };
  const navigateNext = () => {
    if (viewMode === "month") setCurrentMonth((m) => addMonths(m, 1));
    else if (viewMode === "week") setSelectedDate((d) => addWeeks(d, 1));
    else setSelectedDate((d) => addDays(d, 1));
  };

  const headerLabel = () => {
    if (viewMode === "month") return format(currentMonth, "MMMM yyyy");
    if (viewMode === "week") {
      const ws = startOfWeek(selectedDate);
      const we = endOfWeek(selectedDate);
      return `${format(ws, "MMM d")} – ${format(we, "MMM d, yyyy")}`;
    }
    return format(selectedDate, "EEEE, MMMM d, yyyy");
  };

  return (
    <div className="py-6 space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] font-['Inter'] uppercase tracking-[0.2em] text-[#adaaaa] font-bold mb-1">Current Focus</p>
          <h2 className="font-['Manrope'] font-extrabold text-3xl tracking-tighter leading-tight">
            {headerLabel()}
          </h2>
        </div>
        <div className="flex gap-2">
          <button onClick={navigatePrev} className="p-2 rounded-xl bg-[#131313] text-[#adaaaa] hover:bg-[#1a1a1a] transition-colors ds-ghost-border active:scale-95">
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <button onClick={navigateNext} className="p-2 rounded-xl bg-[#131313] text-[#adaaaa] hover:bg-[#1a1a1a] transition-colors ds-ghost-border active:scale-95">
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex bg-[#1a1a1a] p-1 rounded-2xl gap-1 ds-ghost-border">
        {(["day", "week", "month"] as ViewMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`flex-1 py-2 rounded-xl text-[11px] font-['Inter'] font-bold uppercase tracking-wider transition-all ${
              viewMode === mode ? "bg-[#94aaff] text-[#000] shadow-sm" : "text-[#adaaaa] hover:text-white"
            }`}
          >
            {mode}
          </button>
        ))}
      </div>

      {/* Add Event Button */}
      <button
        onClick={() => { setEditEvent(null); setShowForm(true); }}
        className="w-full flex items-center justify-center gap-2 py-3.5 ds-liquid-gradient rounded-2xl font-['Manrope'] font-bold text-[#000] ds-inner-glow active:scale-[0.98] transition-transform"
      >
        <span className="material-symbols-outlined">add</span>
        New Event for {format(selectedDate, "MMM d")}
      </button>

      {/* Event form */}
      {showForm && (
        <EventForm
          initial={editEvent}
          defaultDate={format(selectedDate, "yyyy-MM-dd")}
          onClose={() => { setShowForm(false); setEditEvent(null); }}
          onSaved={invalidate}
        />
      )}

      {/* Views */}
      {viewMode === "day" && (
        <DayView
          selectedDate={selectedDate}
          events={events || []}
          onEdit={(ev) => { setEditEvent(ev); setShowForm(true); }}
          onDelete={removeEvent}
          onSelectDate={setSelectedDate}
        />
      )}
      {viewMode === "week" && (
        <WeekView
          selectedDate={selectedDate}
          events={events || []}
          onSelectDate={(d) => { setSelectedDate(d); setViewMode("day"); }}
        />
      )}
      {viewMode === "month" && (
        <MonthView
          currentMonth={currentMonth}
          selectedDate={selectedDate}
          events={events || []}
          onSelectDate={(d) => { setSelectedDate(d); setViewMode("day"); }}
        />
      )}
    </div>
  );
}

function DayView({ selectedDate, events, onEdit, onDelete, onSelectDate }: {
  selectedDate: Date;
  events: CalendarEvent[];
  onEdit: (ev: CalendarEvent) => void;
  onDelete: (id: number) => void;
  onSelectDate: (d: Date) => void;
}) {
  const weekStart = subDays(selectedDate, selectedDate.getDay());
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const dayEvents = events.filter((e) => isSameDay(parseISO(e.startDate), selectedDate));

  return (
    <>
      {/* Horizontal Week Scroller */}
      <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2 -mx-4 px-4">
        {weekDays.map((day) => {
          const isSelected = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());
          const hasEvents = events.some((e) => isSameDay(parseISO(e.startDate), day));
          return (
            <button
              key={day.toISOString()}
              onClick={() => onSelectDate(day)}
              className={`shrink-0 w-16 h-24 flex flex-col items-center justify-center rounded-3xl transition-all active:scale-95 ${
                isSelected
                  ? "bg-gradient-to-br from-[#94aaff] to-[#809bff] text-[#000] shadow-[0_0_30px_rgba(148,170,255,0.2)]"
                  : "bg-[#131313] text-[#adaaaa] hover:bg-[#1a1a1a] ds-ghost-border"
              }`}
            >
              <span className={`text-[10px] font-['Inter'] uppercase tracking-widest mb-1 ${isSelected ? "text-[rgba(0,0,0,0.7)]" : ""}`}>
                {format(day, "EEE")}
              </span>
              <span className={`font-['Manrope'] font-extrabold text-xl ${isSelected ? "text-[#000]" : isToday ? "text-[#94aaff]" : "text-white"}`}>
                {format(day, "d")}
              </span>
              {hasEvents && !isSelected && <div className="w-1.5 h-1.5 bg-[#94aaff] rounded-full mt-1" />}
              {isSelected && hasEvents && <div className="w-1.5 h-1.5 bg-[rgba(0,0,0,0.5)] rounded-full mt-1" />}
            </button>
          );
        })}
      </div>

      {/* Timeline */}
      <div className="bg-[#131313] rounded-2xl ds-ghost-border overflow-hidden">
        <div className="px-6 py-4 border-b border-[rgba(72,72,71,0.1)]">
          <h3 className="font-['Manrope'] font-bold text-base">{format(selectedDate, "EEEE, MMMM d")}</h3>
          <p className="text-[#adaaaa] text-sm">{dayEvents.length} event{dayEvents.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="relative">
          <div className="absolute left-[72px] top-0 bottom-0 w-[1px] bg-[rgba(72,72,71,0.1)]" />
          {HOURS.map((hour) => {
            const hourEvents = dayEvents.filter((e) => {
              const h = parseInt(e.startDate.split("T")[1]?.split(":")[0] || "0");
              return h === hour;
            });
            return (
              <div key={hour} className="flex min-h-[72px]">
                <div className="w-[72px] pt-2 px-4 shrink-0">
                  <span className="text-[10px] font-['Inter'] font-bold text-[#adaaaa] uppercase">
                    {hour > 12 ? `${hour - 12} PM` : hour === 12 ? "12 PM" : `${hour} AM`}
                  </span>
                </div>
                <div className="flex-1 pb-4 border-b border-[rgba(72,72,71,0.05)] relative pr-4">
                  {hourEvents.map((event) => (
                    <div
                      key={event.id}
                      className="absolute inset-x-0 top-0 mx-4 bg-[#20201f] rounded-3xl p-5 border-l-4 border-[#94aaff] cursor-pointer group hover:bg-[#2c2c2c] transition-colors"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-['Manrope'] font-bold text-base text-white">{event.title}</h4>
                        <span className="bg-[rgba(148,170,255,0.1)] text-[#94aaff] text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full">
                          {event.eventType || "Event"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[#adaaaa] text-xs">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">schedule</span>
                          {format(parseISO(event.startDate), "h:mm a")}
                          {event.endDate && ` - ${format(parseISO(event.endDate), "h:mm a")}`}
                        </span>
                      </div>
                      <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); onEdit(event); }} className="text-[#94aaff] text-[10px] font-bold uppercase tracking-wider hover:underline">
                          Edit
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); onDelete(event.id); }} className="text-[#ff6e84] text-[10px] font-bold uppercase tracking-wider hover:underline">
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

function WeekView({ selectedDate, events, onSelectDate }: {
  selectedDate: Date;
  events: CalendarEvent[];
  onSelectDate: (d: Date) => void;
}) {
  const weekStart = startOfWeek(selectedDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="bg-[#131313] rounded-2xl ds-ghost-border overflow-hidden">
      <div className="grid grid-cols-7 border-b border-[rgba(72,72,71,0.1)]">
        {weekDays.map((day) => (
          <div key={day.toISOString()} className="p-3 text-center border-r last:border-0 border-[rgba(72,72,71,0.05)]">
            <div className="text-[9px] font-['Inter'] uppercase tracking-widest text-[#adaaaa]">{format(day, "EEE")}</div>
            <div className={`font-['Manrope'] font-extrabold text-lg mt-0.5 ${isSameDay(day, new Date()) ? "text-[#94aaff]" : "text-white"}`}>
              {format(day, "d")}
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 min-h-[300px]">
        {weekDays.map((day) => {
          const dayEvs = events.filter((e) => isSameDay(parseISO(e.startDate), day));
          return (
            <button
              key={day.toISOString()}
              onClick={() => onSelectDate(day)}
              className="p-2 border-r last:border-0 border-[rgba(72,72,71,0.05)] text-left hover:bg-[#1a1a1a] transition-colors align-top"
            >
              <div className="space-y-1">
                {dayEvs.slice(0, 4).map((ev) => (
                  <div key={ev.id} className="bg-[rgba(148,170,255,0.15)] text-[#94aaff] text-[9px] font-bold rounded px-1.5 py-0.5 truncate">
                    {ev.title}
                  </div>
                ))}
                {dayEvs.length > 4 && (
                  <div className="text-[9px] text-[#adaaaa]">+{dayEvs.length - 4} more</div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MonthView({ currentMonth, selectedDate, events, onSelectDate }: {
  currentMonth: Date;
  selectedDate: Date;
  events: CalendarEvent[];
  onSelectDate: (d: Date) => void;
}) {
  const start = startOfWeek(startOfMonth(currentMonth));
  const end = endOfWeek(endOfMonth(currentMonth));
  const days = eachDayOfInterval({ start, end });
  const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="bg-[#131313] rounded-2xl ds-ghost-border overflow-hidden">
      <div className="grid grid-cols-7 border-b border-[rgba(72,72,71,0.1)]">
        {WEEK_DAYS.map((d) => (
          <div key={d} className="p-3 text-center text-[9px] font-['Inter'] uppercase tracking-widest text-[#adaaaa]">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const inMonth = isSameMonth(day, currentMonth);
          const isSelected = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());
          const dayEvs = events.filter((e) => isSameDay(parseISO(e.startDate), day));
          return (
            <button
              key={day.toISOString()}
              onClick={() => onSelectDate(day)}
              className={`relative min-h-[72px] p-2 border-b border-r border-[rgba(72,72,71,0.05)] last-of-type:border-r-0 text-left hover:bg-[#1a1a1a] transition-colors ${
                !inMonth ? "opacity-30" : ""
              } ${isSelected ? "bg-[rgba(148,170,255,0.08)]" : ""}`}
            >
              <span className={`text-xs font-['Manrope'] font-bold ${
                isSelected ? "text-[#94aaff]" : isToday ? "text-[#5cfd80]" : inMonth ? "text-white" : "text-[#adaaaa]"
              }`}>
                {format(day, "d")}
              </span>
              <div className="mt-1 space-y-0.5">
                {dayEvs.slice(0, 2).map((ev) => (
                  <div key={ev.id} className="bg-[rgba(148,170,255,0.12)] text-[#94aaff] text-[8px] font-bold rounded px-1 py-0.5 truncate">
                    {ev.title}
                  </div>
                ))}
                {dayEvs.length > 2 && (
                  <div className="text-[8px] text-[#adaaaa]">+{dayEvs.length - 2}</div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function EventForm({ initial, defaultDate, onClose, onSaved }: {
  initial: CalendarEvent | null; defaultDate: string; onClose: () => void; onSaved: () => void;
}) {
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const dateStr = fd.get("date") as string;
    const timeStr = fd.get("time") as string;
    const endTimeStr = fd.get("endTime") as string;
    const startDate = timeStr ? `${dateStr}T${timeStr}:00` : `${dateStr}T00:00:00`;
    const endDate = endTimeStr ? `${dateStr}T${endTimeStr}:00` : null;
    const data = {
      title: fd.get("title") as string,
      startDate,
      endDate,
      eventType: fd.get("type") as string || "event",
    };
    const opts = { onSuccess: () => { onSaved(); onClose(); } };
    if (initial) {
      updateEvent.mutate({ id: initial.id, data }, opts);
    } else {
      createEvent.mutate({ data }, opts);
    }
  };

  const initDate = initial?.startDate?.split("T")[0] || defaultDate;
  const initTime = initial?.startDate?.split("T")[1]?.substring(0, 5) || "";
  const initEndTime = initial?.endDate?.split("T")[1]?.substring(0, 5) || "";

  return (
    <div className="bg-[#131313] rounded-2xl p-6 space-y-5 ds-ghost-border">
      <div className="flex justify-between items-center">
        <h3 className="font-['Manrope'] font-bold text-lg">{initial ? "Edit Event" : "New Event"}</h3>
        <button onClick={onClose} className="p-1.5 rounded-full text-[#adaaaa] hover:bg-[#2c2c2c]">
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="title"
          defaultValue={initial?.title || ""}
          required
          autoFocus
          className="w-full bg-[#262626] border-none rounded-xl py-4 px-5 text-white placeholder:text-[#767575] focus:outline-none focus:ring-1 focus:ring-[#94aaff] font-medium"
          placeholder="Event title..."
        />

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-3 sm:col-span-1 space-y-2">
            <label className="text-[10px] text-[#adaaaa] font-bold uppercase tracking-widest">Date</label>
            <input type="date" name="date" defaultValue={initDate}
              className="w-full bg-[#262626] border-none rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-1 focus:ring-[#94aaff]"
            />
          </div>
          <div className="col-span-3 sm:col-span-1 space-y-2">
            <label className="text-[10px] text-[#adaaaa] font-bold uppercase tracking-widest">Start Time</label>
            <input type="time" name="time" defaultValue={initTime}
              className="w-full bg-[#262626] border-none rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-1 focus:ring-[#94aaff]"
            />
          </div>
          <div className="col-span-3 sm:col-span-1 space-y-2">
            <label className="text-[10px] text-[#adaaaa] font-bold uppercase tracking-widest">End Time</label>
            <input type="time" name="endTime" defaultValue={initEndTime}
              className="w-full bg-[#262626] border-none rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-1 focus:ring-[#94aaff]"
            />
          </div>
        </div>

        <select name="type" defaultValue={initial?.eventType || "event"}
          className="w-full bg-[#262626] border-none rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-1 focus:ring-[#94aaff]"
        >
          <option value="event">Event</option>
          <option value="meeting">Meeting</option>
          <option value="task">Task</option>
          <option value="reminder">Reminder</option>
        </select>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-[#262626] text-[#adaaaa] font-['Inter'] font-medium hover:bg-[#2c2c2c] transition-colors"
          >
            Cancel
          </button>
          <button type="submit"
            className="flex-1 py-3 rounded-xl ds-liquid-gradient text-[#000] font-['Manrope'] font-bold ds-inner-glow active:scale-95 transition-transform"
          >
            {initial ? "Save Changes" : "Create Event"}
          </button>
        </div>
      </form>
    </div>
  );
}
