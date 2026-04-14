"use client";

import React, { useState } from "react";
import {
  Calendar,
  Plus,
  Clock,
  BookOpen,
  Users,
  Flame,
  ChevronLeft,
  ChevronRight,
  X,
  ShieldAlert,
  FileText,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { DEMO_PLANNER_EVENTS, DEMO_UPCOMING_SESSIONS } from "@/lib/mock-data";

const TYPE_STYLE: Record<string, string> = {
  exam: "bg-red-500",
  group: "bg-primary",
  study: "bg-emerald-500",
  deadline: "bg-orange-500",
};

const TYPE_ICON: Record<string, React.ReactNode> = {
  exam: <ShieldAlert size={14} />,
  group: <Users size={14} />,
  study: <BookOpen size={14} />,
  deadline: <Flame size={14} />,
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function PlannerPage() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const eventsForDate = (dateStr: string) =>
    DEMO_PLANNER_EVENTS.filter((e) => e.date === dateStr);

  const selectedEvents = selectedDate ? eventsForDate(selectedDate) : [];

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      {/* Header */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight italic underline decoration-primary decoration-4">
            Study Planner
          </h1>
          <p className="text-text-secondary font-bold mt-2">
            Schedule exams, sessions, and deadlines at a glance.
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="px-8 py-4 bg-primary text-white font-bold text-lg rounded-base flex items-center justify-center gap-3 hover:shadow-2xl hover:shadow-primary/30 active:scale-95 transition-all"
        >
          <Plus size={22} /> Add Event
        </button>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-bold tracking-tight">
              {MONTHS[currentMonth]} {currentYear}
            </h2>
            <div className="flex items-center gap-2">
              <button onClick={prevMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-base transition-colors">
                <ChevronLeft size={20} />
              </button>
              <button onClick={nextMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-base transition-colors">
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b">
            {DAYS.map((d) => (
              <div key={d} className="py-3 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 dark:text-slate-400">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[80px] border-b border-r border-slate-50 dark:border-slate-800" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const dayEvents = eventsForDate(dateStr);
              const isToday = dateStr === today.toISOString().split("T")[0];
              const isSelected = selectedDate === dateStr;

              return (
                <div
                  key={dateStr}
                  onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                  className={cn(
                    "min-h-[80px] border-b border-r border-slate-50 dark:border-slate-800 p-2 cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50",
                    isSelected && "bg-primary/5 border-primary/20"
                  )}
                >
                  <span
                    className={cn(
                      "w-7 h-7 flex items-center justify-center rounded-full text-sm font-black mb-1",
                      isToday && "bg-primary text-white",
                      !isToday && isSelected && "text-primary",
                      !isToday && !isSelected && "text-slate-700 dark:text-slate-300"
                    )}
                  >
                    {day}
                  </span>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 2).map((e) => (
                      <div
                        key={e.id}
                        className={cn("text-[9px] font-bold text-white px-1.5 py-0.5 rounded-full truncate", TYPE_STYLE[e.type])}
                      >
                        {e.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">+{dayEvents.length - 2} more</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar: Upcoming + Selected Day */}
        <div className="space-y-8">
          {/* Selected Day Events */}
          <AnimatePresence>
            {selectedDate && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="bg-white dark:bg-slate-900 border border-primary/30 rounded-xl shadow-sm p-6 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-primary">
                    {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long" })}
                  </h3>
                  <button onClick={() => setSelectedDate(null)} className="p-1 hover:bg-slate-100 rounded-full transition-colors">
                    <X size={16} />
                  </button>
                </div>
                {selectedEvents.length === 0 ? (
                  <p className="text-sm font-medium text-text-secondary">No events on this day.</p>
                ) : (
                  <div className="space-y-3">
                    {selectedEvents.map((e) => (
                      <div key={e.id} className="flex items-start gap-3">
                        <div className={cn("w-8 h-8 rounded-base flex items-center justify-center text-white shrink-0", TYPE_STYLE[e.type])}>
                          {TYPE_ICON[e.type]}
                        </div>
                        <div>
                          <p className="font-bold text-sm leading-tight">{e.title}</p>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">
                            {e.time} · {e.module}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Upcoming Sessions */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-widest">Upcoming Sessions</h3>
              <button
                onClick={() => setShowAdd(true)}
                className="text-primary hover:bg-primary/10 p-1 rounded-full transition-colors"
              >
                <Plus size={18} />
              </button>
            </div>
            <div className="space-y-5">
              {DEMO_UPCOMING_SESSIONS.map((s) => (
                <div key={s.id} className="flex gap-4">
                  <div className={cn("w-1 rounded-full shrink-0", s.type === "exam" ? "bg-red-500" : s.type === "group" ? "bg-primary" : "bg-emerald-500")} />
                  <div>
                    <p className="font-bold text-sm leading-tight">{s.title}</p>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 mt-1">
                      <Clock size={11} className="text-primary" />
                      <span>{s.time}</span>
                      <span className="w-1 h-1 bg-slate-300 rounded-full" />
                      <span>{s.duration}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full py-3 text-sm font-bold uppercase tracking-widest text-text-secondary bg-slate-50 dark:bg-slate-800 rounded-base hover:text-primary transition-colors">
              View All Events
            </button>
          </div>

          {/* Legend */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-sm p-6 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Legend</h3>
            {[
              { label: "Mock Exam", type: "exam" },
              { label: "Study Group", type: "group" },
              { label: "Study Session", type: "study" },
              { label: "Deadline", type: "deadline" },
            ].map((l) => (
              <div key={l.type} className="flex items-center gap-3">
                <div className={cn("w-3 h-3 rounded-full", TYPE_STYLE[l.type])} />
                <span className="text-sm font-bold">{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Event Modal */}
      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAdd(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-900 w-full max-w-md rounded-xl shadow-2xl relative z-10 p-8 space-y-6"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold tracking-tight">Add Event</h2>
                <button onClick={() => setShowAdd(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={18} /></button>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-text-secondary">Event Title</label>
                  <input type="text" placeholder="e.g. LAW201 Mock Exam" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary rounded-base outline-none font-medium" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-text-secondary">Date</label>
                    <input type="date" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary rounded-base outline-none font-medium" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-text-secondary">Time</label>
                    <input type="time" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary rounded-base outline-none font-medium" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-text-secondary">Type</label>
                  <select className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary rounded-base outline-none font-bold appearance-none">
                    <option value="study">Study Session</option>
                    <option value="exam">Mock Exam</option>
                    <option value="group">Study Group</option>
                    <option value="deadline">Deadline</option>
                  </select>
                </div>
              </div>
              <button
                onClick={() => setShowAdd(false)}
                className="w-full py-4 bg-primary text-white font-bold rounded-base hover:shadow-xl hover:shadow-primary/30 active:scale-95 transition-all"
              >
                Save Event
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
