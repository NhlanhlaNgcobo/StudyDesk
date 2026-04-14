export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'tutor' | 'admin';
  image?: string;
  createdAt: Date;
}

export interface Student extends User {
  role: 'student';
  enrolledModules: string[];
  totalPoints: number;
}

export interface Tutor extends User {
  role: 'tutor';
  specialization: string[];
  createdGroups: string[];
}

export interface Module {
  id: string;
  title: string;
  description: string;
  tutorId: string;
  files: PDFFile[];
  notes: Note[];
  quizzes: Quiz[];
}

export interface PDFFile {
  id: string;
  name: string;
  url: string;
  uploadedAt: Date;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  authorId: string;
  updatedAt: Date;
}

export interface Quiz {
  id: string;
  title: string;
  questions: Question[];
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
}

export interface Exam {
  id: string;
  title: string;
  durationInMinutes: number;
  totalMarks: number;
}

export interface Group {
  id: string;
  name: string;
  moduleIds: string[];
  memberIds: string[];
  tutorId: string;
}

export interface Message {
  id: string;
  groupId: string;
  senderId: string;
  text: string;
  timestamp: Date;
}

export interface Subscription {
  id: string;
  userId: string;
  plan: 'free' | 'premium';
  expiresAt: Date;
}
