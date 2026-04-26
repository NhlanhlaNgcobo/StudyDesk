// ============================================================
// StudyDesk — Firebase Client SDK Initialization
// Uses singleton pattern to prevent duplicate instances during
// Next.js HMR (Hot Module Replacement) cycles.
// File storage is handled by Cloudinary (see /api/upload/sign).
// ============================================================

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore, Timestamp } from "firebase/firestore";

// ── Firebase Config (from environment variables) ─────────────
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// ── Singleton Initialization ─────────────────────────────────
const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

export { app, auth, db };

// ============================================================
// Firestore Schema — TypeScript Interfaces
// These mirror the data shapes the UI currently consumes from
// mock-data.ts. Each interface maps to a top-level Firestore
// collection of the same name.
// ============================================================

/** Firestore: `users/{uid}` */
export interface UserDoc {
  id: string;
  name: string;
  initials: string;
  email: string;
  tier: "Free" | "Basic" | "Premium Student" | "Elite";
  points: number;
  streak: number;
  rank: string;
  role: "student" | "tutor" | "admin";
  image?: string;
  createdAt: Timestamp;
}

/** Firestore: `modules/{moduleId}` */
export interface ModuleDoc {
  id: string;
  userId: string;
  name: string;
  subject: string;
  fileCount: number;
  progress: number;
  color: string;
  lastAccessed: Timestamp;
  tags: string[];
  notes: number;
  quizzes: number;
  exams: number;
  flashcards: number;
}

/** Firestore: `notes/{noteId}` */
export interface NoteDoc {
  id: string;
  userId: string;
  moduleId: string;
  moduleName: string;
  title: string;
  content: string;
  preview: string;
  wordCount: number;
  readTime: string;
  tags: string[];
  createdAt: Timestamp;
}

/** Firestore: `quizzes/{quizId}` */
export interface QuizDoc {
  id: string;
  userId: string;
  moduleId: string;
  moduleName: string;
  title: string;
  questions: number;
  duration: string;
  difficulty: "Easy" | "Medium" | "Hard";
  bestScore: number | null;
  attempts: number;
  status: "Not Started" | "In Progress" | "Completed";
  createdAt: Timestamp;
}

/** Firestore: `exams/{examId}` */
export interface ExamDoc {
  id: string;
  userId: string;
  moduleId: string;
  moduleName: string;
  title: string;
  questions: number;
  duration: string;
  difficulty: "Easy" | "Medium" | "Hard";
  bestScore: number | null;
  attempts: number;
  status: "Not Started" | "Scheduled" | "In Progress" | "Completed";
  scheduledAt: Timestamp;
}

/** Firestore: `sessions/{sessionId}` */
export interface SessionDoc {
  id: string;
  userId: string;
  title: string;
  time: string;
  duration: string;
  tag: "Exam" | "Group" | "Solo";
  type: "exam" | "group" | "study";
}

/** Firestore: `plannerEvents/{eventId}` */
export interface PlannerEventDoc {
  id: string;
  userId: string;
  title: string;
  date: string;
  time: string;
  duration: number;
  type: "exam" | "group" | "study" | "deadline";
  module: string;
  color: string;
}

/** Firestore: `notifications/{notifId}` */
export interface NotificationDoc {
  id: string;
  userId: string;
  title: string;
  body: string;
  time: Timestamp;
  read: boolean;
  type: "quiz" | "achievement" | "reminder" | "system";
}
