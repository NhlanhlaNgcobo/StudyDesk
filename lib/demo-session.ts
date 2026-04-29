import type { AppRole } from "@/lib/app-config";

export const DEMO_SESSION_KEY = "studydesk_demo_session";

export interface DemoSession {
  role: AppRole;
  name: string;
  email: string;
  plan: string;
}

const DEFAULT_DEMO_SESSIONS: Record<AppRole, DemoSession> = {
  student: {
    role: "student",
    name: "Nhlanhla Ngcobo",
    email: "demo.student@studydesk.ac.za",
    plan: "Premium Student",
  },
  tutor: {
    role: "tutor",
    name: "Tutor Adams",
    email: "demo.tutor@studydesk.ac.za",
    plan: "Tutor Pro",
  },
};

export function getDefaultDemoSession(role: AppRole): DemoSession {
  return DEFAULT_DEMO_SESSIONS[role];
}

export function readDemoSession(): DemoSession | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(DEMO_SESSION_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as DemoSession;
  } catch {
    localStorage.removeItem(DEMO_SESSION_KEY);
    return null;
  }
}

export function persistDemoSession(role: AppRole): DemoSession {
  const session = getDefaultDemoSession(role);
  localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(session));
  return session;
}

export function clearDemoSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(DEMO_SESSION_KEY);
}

export function demoRoute(role: AppRole) {
  return role === "student"
    ? "/student/dashboard?demo=1&role=student"
    : "/tutor/dashboard?demo=1&role=tutor";
}
