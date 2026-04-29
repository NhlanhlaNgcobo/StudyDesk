import { DEMO_PLANNER_EVENTS } from "@/lib/mock-data";

export type PlannerEventType = "exam" | "group" | "study" | "deadline";

export interface PlannerEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  duration: number;
  type: PlannerEventType;
  module: string;
  color: string;
  notes?: string;
  reminderMinutes: number[];
  syncedToGoogle?: boolean;
}

export interface PlannerSettings {
  notificationsEnabled: boolean;
  googleSyncEnabled: boolean;
  defaultReminderMinutes: number[];
  defaultStudyDuration: number;
}

export const REMINDER_OPTIONS = [10, 30, 60, 180, 1440] as const;

export const DEFAULT_PLANNER_SETTINGS: PlannerSettings = {
  notificationsEnabled: false,
  googleSyncEnabled: false,
  defaultReminderMinutes: [60],
  defaultStudyDuration: 90,
};

export const PLANNER_EVENTS_STORAGE_KEY = "studydesk.planner.events";
export const PLANNER_SETTINGS_STORAGE_KEY = "studydesk.planner.settings";
export const PLANNER_FIRED_REMINDERS_STORAGE_KEY = "studydesk.planner.fired-reminders";

export function seedPlannerEvents(): PlannerEvent[] {
  return DEMO_PLANNER_EVENTS.map((event) => ({
    ...event,
    type: event.type as PlannerEventType,
    reminderMinutes:
      event.type === "exam"
        ? [1440, 60]
        : event.type === "deadline"
          ? [1440, 180]
          : [60],
    notes:
      event.type === "study"
        ? "Focused revision block created for the demo workspace."
        : event.type === "group"
          ? "Join your tutor pod with your notes ready."
          : undefined,
    syncedToGoogle: false,
  }));
}

export function sortPlannerEvents(events: PlannerEvent[]) {
  return [...events].sort(
    (a, b) =>
      new Date(`${a.date}T${a.time || "00:00"}:00`).getTime() -
      new Date(`${b.date}T${b.time || "00:00"}:00`).getTime()
  );
}

export function getEventDateTime(event: PlannerEvent) {
  return new Date(`${event.date}T${event.time || "00:00"}:00`);
}

export function formatReminderLabel(minutes: number) {
  if (minutes >= 1440) {
    const days = Math.round(minutes / 1440);
    return `${days} day${days === 1 ? "" : "s"} before`;
  }

  if (minutes >= 60) {
    const hours = Math.round(minutes / 60);
    return `${hours} hour${hours === 1 ? "" : "s"} before`;
  }

  return `${minutes} min before`;
}

export function formatEventDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-ZA", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function formatEventDateTime(date: string, time: string) {
  return new Date(`${date}T${time || "00:00"}:00`).toLocaleDateString("en-ZA", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toGoogleCalendarDate(date: string, time: string) {
  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = (time || "00:00").split(":").map(Number);
  const localDate = new Date(year, month - 1, day, hours, minutes, 0);

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(localDate);

  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${map.year}${map.month}${map.day}T${map.hour}${map.minute}${map.second}Z`;
}

export function createGoogleCalendarUrl(event: PlannerEvent) {
  const end = new Date(getEventDateTime(event).getTime() + event.duration * 60000);
  const startValue = toGoogleCalendarDate(event.date, event.time);
  const endValue = toGoogleCalendarDate(
    `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`,
    `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`
  );

  const details = [
    event.notes || "Created in StudyDesk planner.",
    event.reminderMinutes.length > 0
      ? `StudyDesk reminder preferences: ${event.reminderMinutes.map(formatReminderLabel).join(", ")}.`
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${startValue}/${endValue}`,
    details,
  });

  if (event.module) {
    params.set("location", event.module);
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
