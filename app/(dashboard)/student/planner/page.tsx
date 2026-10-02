"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Bell,
  BellRing,
  BookOpen,
  Calendar,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  ExternalLink,
  Flame,
  Plus,
  ShieldAlert,
  Users,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  createIcsCalendar,
  createGoogleCalendarUrl,
  DEFAULT_PLANNER_SETTINGS,
  formatEventDate,
  formatEventDateTime,
  formatReminderLabel,
  getEventDateTime,
  PLANNER_EVENTS_STORAGE_KEY,
  PLANNER_FIRED_REMINDERS_STORAGE_KEY,
  PLANNER_SETTINGS_STORAGE_KEY,
  PlannerEvent,
  PlannerEventType,
  PlannerSettings,
  REMINDER_OPTIONS,
  seedPlannerEvents,
  sortPlannerEvents,
} from "@/lib/planner";

const TYPE_STYLE: Record<PlannerEventType, string> = {
  exam: "bg-red-500",
  group: "bg-primary",
  study: "bg-emerald-500",
  deadline: "bg-orange-500",
  personal: "bg-slate-500",
};

const TYPE_ICON: Record<PlannerEventType, React.ReactNode> = {
  exam: <ShieldAlert size={14} />,
  group: <Users size={14} />,
  study: <BookOpen size={14} />,
  deadline: <Flame size={14} />,
  personal: <Calendar size={14} />,
};

const TYPE_LABEL: Record<PlannerEventType, string> = {
  exam: "Mock Exam",
  group: "Study Group",
  study: "Study Session",
  deadline: "Deadline",
  personal: "Personal event",
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const EVENT_COLORS = {
  exam: "#EF4444",
  group: "#4DA6FF",
  study: "#10B981",
  deadline: "#F59E0B",
  personal: "#64748B",
} as const;

const EMPTY_FORM = {
  title: "",
  module: "",
  type: "study" as PlannerEventType,
  date: "",
  time: "18:00",
  duration: 90,
  notes: "",
  reminderMinutes: [60],
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function readStoredEvents() {
  if (typeof window === "undefined") return seedPlannerEvents();
  const raw = window.localStorage.getItem(PLANNER_EVENTS_STORAGE_KEY);
  if (!raw) return seedPlannerEvents();

  try {
    const parsed = JSON.parse(raw) as PlannerEvent[];
    return sortPlannerEvents(parsed);
  } catch {
    return seedPlannerEvents();
  }
}

function readStoredSettings() {
  if (typeof window === "undefined") return DEFAULT_PLANNER_SETTINGS;
  const raw = window.localStorage.getItem(PLANNER_SETTINGS_STORAGE_KEY);
  if (!raw) return DEFAULT_PLANNER_SETTINGS;

  try {
    return {
      ...DEFAULT_PLANNER_SETTINGS,
      ...(JSON.parse(raw) as Partial<PlannerSettings>),
    };
  } catch {
    return DEFAULT_PLANNER_SETTINGS;
  }
}

export default function PlannerPage() {
  const [todayIso, setTodayIso] = useState("2026-04-28");
  const [currentMonth, setCurrentMonth] = useState(3);
  const [currentYear, setCurrentYear] = useState(2026);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [events, setEvents] = useState<PlannerEvent[]>([]);
  const [settings, setSettings] = useState<PlannerSettings>(DEFAULT_PLANNER_SETTINGS);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    const now = new Date();
    setCurrentMonth(now.getMonth());
    setCurrentYear(now.getFullYear());
    setTodayIso(now.toISOString().split("T")[0]);
    setSelectedDate(now.toISOString().split("T")[0]);
    setEvents(readStoredEvents());
    setSettings(readStoredSettings());

    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("new") !== "1") return;
    const type = params.get("type") as PlannerEventType;
    const allowedType = ["exam", "group", "study", "deadline", "personal"].includes(type) ? type : "study";
    const module = params.get("module") || "";
    const date = new Date().toISOString().split("T")[0];
    setSelectedDate(date);
    setForm({ ...EMPTY_FORM, type: allowedType, module, date, duration: allowedType === "deadline" ? 15 : DEFAULT_PLANNER_SETTINGS.defaultStudyDuration });
    setShowAdd(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || events.length === 0) return;
    window.localStorage.setItem(PLANNER_EVENTS_STORAGE_KEY, JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(PLANNER_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !settings.notificationsEnabled ||
      notificationPermission !== "granted"
    ) {
      return;
    }

    const tick = () => {
      const firedRaw = window.localStorage.getItem(PLANNER_FIRED_REMINDERS_STORAGE_KEY);
      const fired = firedRaw ? (JSON.parse(firedRaw) as string[]) : [];
      const now = Date.now();
      const nextFired = [...fired];

      events.forEach((event) => {
        const eventTime = getEventDateTime(event).getTime();
        event.reminderMinutes.forEach((minutes) => {
          const reminderAt = eventTime - minutes * 60_000;
          const notificationId = `${event.id}:${minutes}`;

          if (
            reminderAt <= now &&
            now - reminderAt < 60_000 &&
            !nextFired.includes(notificationId)
          ) {
            new Notification(`Upcoming: ${event.title}`, {
              body: `${formatReminderLabel(minutes)} • ${formatEventDateTime(event.date, event.time)} • ${event.module}`,
            });
            nextFired.push(notificationId);
          }
        });
      });

      window.localStorage.setItem(
        PLANNER_FIRED_REMINDERS_STORAGE_KEY,
        JSON.stringify(nextFired)
      );
    };

    tick();
    const interval = window.setInterval(tick, 30_000);
    return () => window.clearInterval(interval);
  }, [events, notificationPermission, settings.notificationsEnabled]);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const eventsForDate = (dateStr: string) => events.filter((event) => event.date === dateStr);
  const selectedEvents = selectedDate ? eventsForDate(selectedDate) : [];

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return sortPlannerEvents(events)
      .filter((event) => getEventDateTime(event) >= now)
      .slice(0, 6);
  }, [events]);

  const studyBlocks = useMemo(
    () =>
      sortPlannerEvents(events)
        .filter((event) => event.type === "study")
        .slice(0, 4),
    [events]
  );

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((year) => year - 1);
    } else {
      setCurrentMonth((month) => month - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((year) => year + 1);
    } else {
      setCurrentMonth((month) => month + 1);
    }
  };

  const openModal = (type: PlannerEventType = "study") => {
    setForm({
      ...EMPTY_FORM,
      type,
      duration: type === "deadline" ? 15 : settings.defaultStudyDuration,
      reminderMinutes: [...settings.defaultReminderMinutes],
      date: selectedDate || todayIso,
    });
    setShowAdd(true);
  };

  const toggleReminder = (minutes: number) => {
    setForm((current) => ({
      ...current,
      reminderMinutes: current.reminderMinutes.includes(minutes)
        ? current.reminderMinutes.filter((value) => value !== minutes)
        : [...current.reminderMinutes, minutes].sort((a, b) => a - b),
    }));
  };

  const requestNotifications = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    if (permission === "granted") {
      setSettings((current) => ({ ...current, notificationsEnabled: true }));
    }
  };

  const handleSaveEvent = () => {
    if (!form.title.trim() || !form.date || !form.time) {
      return;
    }

    const nextEvent: PlannerEvent = {
      id: `event-${Date.now()}`,
      title: form.title.trim(),
      module: form.module.trim().toUpperCase() || "PERSONAL",
      type: form.type,
      date: form.date,
      time: form.time,
      duration: form.duration,
      notes: form.notes.trim(),
      reminderMinutes:
        form.reminderMinutes.length > 0 ? form.reminderMinutes : [...settings.defaultReminderMinutes],
      color: EVENT_COLORS[form.type],
      syncedToGoogle: false,
    };

    setEvents((current) => sortPlannerEvents([...current, nextEvent]));
    setSelectedDate(form.date);
    setShowAdd(false);

    if (settings.googleSyncEnabled && typeof window !== "undefined") {
      window.open(createGoogleCalendarUrl(nextEvent), "_blank", "noopener,noreferrer");
    }
  };

  const selectedDateLabel = selectedDate
    ? new Date(`${selectedDate}T00:00:00`).toLocaleDateString("en-ZA", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
    : "";

  const downloadIcs = (event: PlannerEvent) => {
    const blob = new Blob([createIcsCalendar(event)], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${event.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "studydesk-event"}.ics`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <section className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div className="space-y-3">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight italic underline decoration-primary decoration-4">
            Academic Calendar
          </h1>
          <p className="text-text-secondary font-bold max-w-2xl">
            One calendar for study time, exams, deadlines, group work, and life outside campus. Add as many events as a day needs, then carry them into the calendar you already use.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => openModal("study")}
            className="px-6 py-4 bg-emerald-500 text-white font-bold rounded-base flex items-center justify-center gap-3 hover:shadow-xl hover:shadow-emerald-500/20 transition-all"
          >
            <BookOpen size={20} /> Add Study Time
          </button>
          <button
            onClick={() => openModal("exam")}
            className="px-6 py-4 bg-primary text-white font-bold rounded-base flex items-center justify-center gap-3 hover:shadow-xl hover:shadow-primary/30 transition-all"
          >
            <Plus size={20} /> Add Event
          </button>
          <button
            onClick={() => openModal("personal")}
            className="px-5 py-4 border border-app bg-app-surface text-app font-bold rounded-base flex items-center justify-center gap-2 hover:border-primary/40 transition-all"
          >
            <Calendar size={18} /> Personal
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Reminder Engine</p>
              <h2 className="text-2xl font-black tracking-tight mt-2">Stay ahead of every session</h2>
            </div>
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <BellRing size={22} />
            </div>
          </div>
          <p className="text-sm font-bold text-text-secondary">
            Choose exactly how early StudyDesk should notify you before exams, deadlines, and study blocks.
          </p>
          <div className="flex flex-wrap gap-2">
            {settings.defaultReminderMinutes.map((minutes) => (
              <span
                key={minutes}
                className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-[11px] font-black uppercase tracking-widest"
              >
                {formatReminderLabel(minutes)}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {REMINDER_OPTIONS.map((minutes) => {
              const active = settings.defaultReminderMinutes.includes(minutes);
              return (
                <button
                  key={minutes}
                  onClick={() =>
                    setSettings((current) => ({
                      ...current,
                      defaultReminderMinutes: active
                        ? current.defaultReminderMinutes.filter((value) => value !== minutes)
                        : [...current.defaultReminderMinutes, minutes].sort((a, b) => a - b),
                    }))
                  }
                  className={cn(
                    "px-3 py-2 rounded-full text-[11px] font-black uppercase tracking-widest border transition-all",
                    active
                      ? "bg-primary text-white border-primary"
                      : "bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700"
                  )}
                >
                  {formatReminderLabel(minutes)}
                </button>
              );
            })}
          </div>
          <button
            onClick={requestNotifications}
            className={cn(
              "w-full py-3 rounded-base font-black uppercase tracking-widest text-xs transition-all",
              notificationPermission === "granted"
                ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
                : "bg-slate-900 text-white hover:bg-slate-800"
            )}
          >
            {notificationPermission === "granted"
              ? "Browser reminders enabled"
              : "Enable browser reminders"}
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Calendar connections</p>
              <h2 className="text-2xl font-black tracking-tight mt-2">Use the calendar you already trust</h2>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-50 text-primary flex items-center justify-center">
              <CalendarPlus size={22} />
            </div>
          </div>
          <p className="text-sm font-bold text-text-secondary">
            Send any event directly to Google Calendar, or download an .ics file for Outlook, Apple Calendar, and other calendar apps.
          </p>
          <label className="flex items-center justify-between gap-4 bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3">
            <div>
              <p className="font-black text-sm">Open Google Calendar after save</p>
              <p className="text-xs font-bold text-text-secondary">Useful when you want your study plan mirrored immediately.</p>
            </div>
            <button
              onClick={() =>
                setSettings((current) => ({
                  ...current,
                  googleSyncEnabled: !current.googleSyncEnabled,
                }))
              }
              className={cn(
                "w-14 h-8 rounded-full transition-all relative",
                settings.googleSyncEnabled ? "bg-primary" : "bg-slate-300 dark:bg-slate-700"
              )}
            >
              <span
                className={cn(
                  "absolute top-1 left-1 w-6 h-6 rounded-full bg-white transition-transform",
                  settings.googleSyncEnabled && "translate-x-6"
                )}
              />
            </button>
          </label>
          {selectedEvents[0] && (
            <a
              href={createGoogleCalendarUrl(selectedEvents[0])}
              target="_blank"
              rel="noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-base bg-primary/10 text-primary font-black uppercase tracking-widest text-xs hover:bg-primary/20 transition-colors"
            >
              Open selected event in Google Calendar <ExternalLink size={14} />
            </a>
          )}
          {selectedEvents[0] && (
            <button
              onClick={() => downloadIcs(selectedEvents[0])}
              className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-base bg-app-muted text-app font-black uppercase tracking-widest text-xs hover:bg-app-surface hover:ring-1 hover:ring-primary/20 transition-colors"
            >
              Download for Outlook / Apple <Download size={14} />
            </button>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Study Rhythm</p>
              <h2 className="text-2xl font-black tracking-tight mt-2">Default study block setup</h2>
            </div>
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center">
              <Clock size={22} />
            </div>
          </div>
          <p className="text-sm font-bold text-text-secondary">
            Shape how new study sessions are created so students can quickly plan consistent revision time.
          </p>
          <div className="space-y-3">
            <label className="text-xs font-black uppercase tracking-widest text-slate-500">Default study duration</label>
            <select
              value={settings.defaultStudyDuration}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  defaultStudyDuration: Number(event.target.value),
                }))
              }
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-base border border-slate-200 dark:border-slate-700 font-bold outline-none"
            >
              {[45, 60, 90, 120, 180].map((duration) => (
                <option key={duration} value={duration}>
                  {duration} minutes
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Upcoming events</p>
              <p className="text-3xl font-black mt-2">{upcomingEvents.length}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Study blocks</p>
              <p className="text-3xl font-black mt-2">{studyBlocks.length}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
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

          <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800">
            {DAYS.map((day) => (
              <div key={day} className="py-3 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 dark:text-slate-400">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {Array.from({ length: firstDay }).map((_, index) => (
              <div key={`empty-${index}`} className="min-h-[90px] border-b border-r border-slate-50 dark:border-slate-800" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1;
              const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const dayEvents = eventsForDate(dateStr);
              const isToday = dateStr === todayIso;
              const isSelected = selectedDate === dateStr;

              return (
                <div
                  key={dateStr}
                  onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                  className={cn(
                    "min-h-[90px] border-b border-r border-slate-50 dark:border-slate-800 p-2 cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50",
                    isSelected && "bg-primary/5 border-primary/20"
                  )}
                >
                  <span
                    className={cn(
                      "w-7 h-7 flex items-center justify-center rounded-full text-sm font-black mb-2",
                      isToday && "bg-primary text-white",
                      !isToday && isSelected && "text-primary",
                      !isToday && !isSelected && "text-slate-700 dark:text-slate-300"
                    )}
                  >
                    {day}
                  </span>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 2).map((event) => (
                      <div
                        key={event.id}
                        className={cn("text-[9px] font-bold text-white px-1.5 py-0.5 rounded-full truncate", TYPE_STYLE[event.type])}
                      >
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">
                        +{dayEvents.length - 2} more
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-8">
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
                    {selectedDateLabel}
                  </h3>
                  <button onClick={() => setSelectedDate(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                    <X size={16} />
                  </button>
                </div>
                {selectedEvents.length === 0 ? (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-text-secondary">No events on this day yet.</p>
                    <button
                      onClick={() => openModal("study")}
                      className="w-full py-3 rounded-base bg-primary/10 text-primary font-black uppercase tracking-widest text-xs"
                    >
                      Add a study block here
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedEvents.map((event) => (
                      <div key={event.id} className="rounded-xl border border-slate-100 dark:border-slate-800 p-4 space-y-3">
                        <div className="flex items-start gap-3">
                          <div className={cn("w-8 h-8 rounded-base flex items-center justify-center text-white shrink-0", TYPE_STYLE[event.type])}>
                            {TYPE_ICON[event.type]}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-sm leading-tight">{event.title}</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary mt-1">
                              {event.time} · {event.duration} min · {event.module}
                            </p>
                          </div>
                        </div>
                        {event.notes && (
                          <p className="text-sm font-medium text-text-secondary">{event.notes}</p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {event.reminderMinutes.map((minutes) => (
                            <span
                              key={`${event.id}-${minutes}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300"
                            >
                              <Bell size={11} /> {formatReminderLabel(minutes)}
                            </span>
                          ))}
                        </div>
                        <a
                          href={createGoogleCalendarUrl(event)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 text-primary font-black uppercase tracking-widest text-[11px]"
                        >
                          Open in Google Calendar <ExternalLink size={12} />
                        </a>
                        <button
                          onClick={() => downloadIcs(event)}
                          className="inline-flex items-center gap-2 text-text-secondary font-black uppercase tracking-widest text-[11px] hover:text-primary"
                        >
                          Download calendar file <Download size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-widest">Upcoming Sessions</h3>
              <button
                onClick={() => openModal("study")}
                className="text-primary hover:bg-primary/10 p-1 rounded-full transition-colors"
              >
                <Plus size={18} />
              </button>
            </div>
            <div className="space-y-5">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="flex gap-4">
                  <div className={cn("w-1 rounded-full shrink-0", TYPE_STYLE[event.type])} />
                  <div className="min-w-0">
                    <p className="font-bold text-sm leading-tight">{event.title}</p>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 mt-1 flex-wrap">
                      <Clock size={11} className="text-primary" />
                      <span>{formatEventDateTime(event.date, event.time)}</span>
                      <span className="w-1 h-1 bg-slate-300 rounded-full" />
                      <span>{event.duration} min</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-sm p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-widest">Planned Study Times</h3>
              <button
                onClick={() => openModal("study")}
                className="text-emerald-500 hover:bg-emerald-500/10 p-1 rounded-full transition-colors"
              >
                <Plus size={18} />
              </button>
            </div>
            <div className="space-y-4">
              {studyBlocks.map((event) => (
                <div key={event.id} className="rounded-xl bg-slate-50 dark:bg-slate-800 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-sm">{event.title}</p>
                      <p className="text-xs font-bold text-text-secondary mt-1">
                        {formatEventDate(event.date)} · {event.time} · {event.duration} min
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                      Study
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-sm p-6 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Legend</h3>
            {(Object.keys(TYPE_LABEL) as PlannerEventType[]).map((type) => (
              <div key={type} className="flex items-center gap-3">
                <div className={cn("w-3 h-3 rounded-full", TYPE_STYLE[type])} />
                <span className="text-sm font-bold">{TYPE_LABEL[type]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

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
              className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-xl shadow-2xl relative z-10 p-8 space-y-6"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Plan an event</h2>
                  <p className="text-sm font-bold text-text-secondary mt-1">
                    Add study times, exam sessions, groups, and reminder timing in one place.
                  </p>
                </div>
                <button onClick={() => setShowAdd(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-text-secondary">Event title</label>
                  <input
                    type="text"
                    aria-label="Event title"
                    value={form.title}
                    onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                    placeholder="e.g. Calculus revision sprint"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary rounded-base outline-none font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-text-secondary">Module or category <span className="normal-case tracking-normal font-medium">(optional)</span></label>
                  <input
                    type="text"
                    aria-label="Module"
                    value={form.module}
                    onChange={(event) => setForm((current) => ({ ...current, module: event.target.value }))}
                    placeholder="e.g. MATH101 or personal"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary rounded-base outline-none font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-text-secondary">Event type</label>
                  <select
                    aria-label="Event type"
                    value={form.type}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        type: event.target.value as PlannerEventType,
                        duration:
                          event.target.value === "deadline" ? 15 : current.duration,
                      }))
                    }
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary rounded-base outline-none font-bold"
                  >
                    {(Object.keys(TYPE_LABEL) as PlannerEventType[]).map((type) => (
                      <option key={type} value={type}>
                        {TYPE_LABEL[type]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-text-secondary">Date</label>
                  <input
                    type="date"
                    aria-label="Date"
                    value={form.date}
                    onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary rounded-base outline-none font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-text-secondary">Start time</label>
                  <input
                    type="time"
                    aria-label="Start time"
                    value={form.time}
                    onChange={(event) => setForm((current) => ({ ...current, time: event.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary rounded-base outline-none font-medium"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-text-secondary">Duration (minutes)</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[30, 45, 60, 90, 120, 150, 180, 240].map((duration) => (
                      <button
                        key={duration}
                        onClick={() => setForm((current) => ({ ...current, duration }))}
                        className={cn(
                          "py-2.5 rounded-base border text-xs font-black uppercase tracking-widest transition-all",
                          form.duration === duration
                            ? "bg-primary text-white border-primary"
                            : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500"
                        )}
                      >
                        {duration}m
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-text-secondary">Remind me</label>
                  <div className="flex flex-wrap gap-2">
                    {REMINDER_OPTIONS.map((minutes) => {
                      const active = form.reminderMinutes.includes(minutes);
                      return (
                        <button
                          key={minutes}
                          onClick={() => toggleReminder(minutes)}
                          className={cn(
                            "px-3 py-2 rounded-full border text-[11px] font-black uppercase tracking-widest transition-all",
                            active
                              ? "bg-primary text-white border-primary"
                              : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500"
                          )}
                        >
                          {formatReminderLabel(minutes)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-text-secondary">Notes</label>
                  <textarea
                    aria-label="Notes"
                    rows={3}
                    value={form.notes}
                    onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                    placeholder="Optional notes for what to revise or bring to the session."
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary rounded-base outline-none font-medium resize-none"
                  />
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <p className="font-black text-sm">Google Calendar handoff</p>
                  <p className="text-xs font-bold text-text-secondary">
                    {settings.googleSyncEnabled
                      ? "Saving will open Google Calendar with this event prefilled."
                      : "Enable Google Calendar handoff above if you want new events to open there automatically."}
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white dark:bg-slate-900 text-primary text-[11px] font-black uppercase tracking-widest">
                  <Calendar size={13} /> Ready
                </div>
              </div>

              <button
                onClick={handleSaveEvent}
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
