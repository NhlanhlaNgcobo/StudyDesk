"use client";

import { useEffect, useMemo, useState } from "react";
import { appConfig } from "@/lib/app-config";
import { DEMO_EXAMS, DEMO_MODULES, DEMO_NOTES, DEMO_QUIZZES } from "@/lib/mock-data";

export type SourceKind = "pdf" | "docx" | "txt" | "book_excerpt" | "typed_note";
export type ExtractionStatus = "ready" | "unsupported" | "failed" | "processing";
export type NoteKind = "typed" | "generated" | "imported_excerpt";
export type AssessmentMode = "quiz" | "exam";
export type AssessmentQuestionType =
  | "multiple_choice"
  | "short_form"
  | "written"
  | "long_form";

export interface ModuleSourceFile {
  id: string;
  moduleId: string;
  title: string;
  fileName: string;
  mimeType: string;
  size: number;
  sourceKind: SourceKind;
  extractionStatus: ExtractionStatus;
  extractedText: string;
  preview: string;
  storageMode: "local" | "firebase";
  sourceUrl?: string;
  createdAt: string;
  syncedAt?: string;
}

export interface ModuleNote {
  id: string;
  moduleId: string;
  title: string;
  content: string;
  preview: string;
  kind: NoteKind;
  sourceIds: string[];
  createdAt: string;
  updatedAt: string;
  readTimeMinutes: number;
}

export interface KnowledgeChunk {
  id: string;
  moduleId: string;
  sourceId: string;
  noteId?: string;
  content: string;
  order: number;
}

export interface AssessmentQuestion {
  id: string;
  type: AssessmentQuestionType;
  prompt: string;
  topic: string;
  marks: number;
  options?: string[];
  correctIndex?: number;
  correctAnswer?: string;
  sampleAnswer?: string;
  explanation?: string;
  rubricCriteria?: string[];
}

export interface AssessmentBlueprint {
  id: string;
  moduleId: string;
  title: string;
  mode: AssessmentMode;
  difficulty: string;
  status: "Not Started" | "Scheduled" | "Completed";
  questionTypes: AssessmentQuestionType[];
  questions: AssessmentQuestion[];
  sourceIds: string[];
  sourceSummary: string[];
  timeLimitMinutes: number;
  totalMarks: number;
  bestScore: number | null;
  latestScore: number | null;
  attempts: number;
  createdAt: string;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
}

export interface FlashcardDeck {
  id: string;
  moduleId: string;
  title: string;
  sourceIds: string[];
  cards: Flashcard[];
  createdAt: string;
}

/**
 * One rubric line, marked on its own. SA university long-answer questions are
 * marked against a memo criterion by criterion, and a single total hides which
 * criterion lost the marks - which is exactly the thing a student needs.
 */
export interface CriterionMark {
  criterion: string;
  awarded: number;
  max: number;
  comment: string;
}

export interface AssessmentQuestionResult {
  questionId: string;
  score: number;
  maxScore: number;
  isCorrect: boolean;
  studentAnswer: string | number | null;
  correctAnswer: string;
  correction: string;
  explanation: string;
  topic: string;
  /** Per-rubric-line breakdown, for anything that is not multiple choice. */
  criteria?: CriterionMark[];
  /** The single most valuable next action on this question. */
  nextStep?: string;
  /** Short label for the specific error, used by the learner model. */
  misconception?: string;
}

export interface AssessmentAttempt {
  id: string;
  assessmentId: string;
  moduleId: string;
  mode: AssessmentMode;
  startedAt: string;
  submittedAt: string;
  timeTakenSeconds: number;
  percentage: number;
  totalScore: number;
  totalMarks: number;
  answers: Record<string, string | number>;
  results: AssessmentQuestionResult[];
  weakTopics: string[];
}

export interface ModuleKnowledgeState {
  sources: ModuleSourceFile[];
  notes: ModuleNote[];
  chunks: KnowledgeChunk[];
  assessments: AssessmentBlueprint[];
  flashcards: FlashcardDeck[];
  attempts: AssessmentAttempt[];
}

const STORAGE_KEY = "studydesk.module-knowledge.v1";
const UPDATE_EVENT = "studydesk-module-knowledge-updated";

function nowIso() {
  return new Date().toISOString();
}

function wordsToMinutes(content: string) {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 180));
}

function previewOf(content: string) {
  return content.replace(/\s+/g, " ").trim().slice(0, 180);
}

function chunkText(moduleId: string, sourceId: string, content: string, noteId?: string) {
  const normalized = content.replace(/\s+/g, " ").trim();
  const chunkSize = 1200;
  const chunks: KnowledgeChunk[] = [];

  for (let index = 0; index < normalized.length; index += chunkSize) {
    chunks.push({
      id: `${sourceId}-chunk-${index / chunkSize}`,
      moduleId,
      sourceId,
      noteId,
      content: normalized.slice(index, index + chunkSize),
      order: index / chunkSize,
    });
  }

  return chunks;
}

function buildSeedAssessments() {
  const quizAssessments: AssessmentBlueprint[] = DEMO_QUIZZES.map((quiz, index) => ({
    id: quiz.id,
    moduleId: quiz.moduleId,
    title: quiz.title,
    mode: "quiz",
    difficulty: quiz.difficulty,
    status: quiz.status as AssessmentBlueprint["status"],
    questionTypes: ["multiple_choice"],
    sourceIds: [`seed-note-${quiz.moduleId}-1`],
    sourceSummary: [quiz.moduleName],
    timeLimitMinutes: parseInt(quiz.duration, 10),
    totalMarks: 7,
    bestScore: quiz.bestScore,
    latestScore: quiz.bestScore,
    attempts: quiz.attempts,
    createdAt: nowIso(),
    questions: [
      {
        id: `${quiz.id}-mcq-1`,
        type: "multiple_choice",
        prompt: `Which core idea is most central to ${quiz.title}?`,
        topic: quiz.moduleName,
        marks: 2,
        options: [
          "Understanding the core concept and being able to explain it clearly",
          "Memorising only the chapter headings",
          "Ignoring examples and applications",
          "Studying without reviewing source notes",
        ],
        correctIndex: 0,
        correctAnswer: "Understanding the core concept and being able to explain it clearly",
        sampleAnswer: "Understanding the core concept and being able to explain it clearly",
        explanation: "Strong revision starts with conceptual understanding grounded in source material.",
        rubricCriteria: ["Select the most academically sound revision principle."],
      },
      {
        id: `${quiz.id}-short-1`,
        type: index % 2 === 0 ? "short_form" : "written",
        prompt: `Using your module notes, explain one important principle from ${quiz.moduleName}.`,
        topic: quiz.moduleName,
        marks: 5,
        correctAnswer: "A concise explanation using evidence from the stored notes.",
        sampleAnswer: `A high-quality answer should define a core concept from ${quiz.moduleName}, explain why it matters, and reference an example from the learner's notes.`,
        explanation: "This question checks whether the student can express understanding in their own words.",
        rubricCriteria: [
          "Accurate explanation of the principle",
          "Clear structure",
          "Relevant supporting example",
        ],
      },
    ],
  }));

  const examAssessments: AssessmentBlueprint[] = DEMO_EXAMS.map((exam) => ({
    id: exam.id,
    moduleId: exam.moduleId,
    title: exam.title,
    mode: "exam",
    difficulty: exam.difficulty,
    status: exam.status as AssessmentBlueprint["status"],
    questionTypes: ["multiple_choice", "written", "long_form"],
    sourceIds: [`seed-note-${exam.moduleId}-1`],
    sourceSummary: [exam.moduleName],
    timeLimitMinutes: parseInt(exam.duration, 10),
    totalMarks: 22,
    bestScore: exam.bestScore,
    latestScore: exam.bestScore,
    attempts: exam.attempts,
    createdAt: nowIso(),
    questions: [
      {
        id: `${exam.id}-mcq-1`,
        type: "multiple_choice",
        prompt: `Which revision strategy best prepares a student for ${exam.title}?`,
        topic: exam.moduleName,
        marks: 2,
        options: [
          "Using source materials, practising retrieval, and reviewing corrections",
          "Reading titles only and skipping examples",
          "Only revising the night before the assessment",
          "Avoiding timed practice completely",
        ],
        correctIndex: 0,
        correctAnswer: "Using source materials, practising retrieval, and reviewing corrections",
        sampleAnswer: "Using source materials, practising retrieval, and reviewing corrections",
        explanation: "The strongest preparation combines source-grounded revision with feedback loops.",
        rubricCriteria: ["Identify the best evidence-based preparation approach."],
      },
      {
        id: `${exam.id}-written-1`,
        type: "written",
        prompt: `Write a structured response explaining a major concept from ${exam.moduleName} and how it could appear in an exam setting.`,
        topic: exam.moduleName,
        marks: 8,
        correctAnswer: "A clear, structured explanation with application to exam scenarios.",
        sampleAnswer: `A strong answer defines the concept, explains its significance, and applies it to a realistic ${exam.moduleName} problem or question.`,
        explanation: "The answer should combine knowledge, structure, and exam application.",
        rubricCriteria: [
          "Concept accuracy",
          "Clear structure",
          "Application to an exam scenario",
          "Appropriate terminology",
        ],
      },
      {
        id: `${exam.id}-long-1`,
        type: "long_form",
        prompt: `Develop a long-form answer using the module materials to compare key themes, arguments, or problem-solving methods from ${exam.moduleName}.`,
        topic: exam.moduleName,
        marks: 12,
        correctAnswer: "A longer comparative or analytical answer built from module sources.",
        sampleAnswer: `A strong long-form answer should present a thesis, compare at least two major themes from the source materials, and conclude with an exam-ready insight.`,
        explanation: "Long-form responses should show synthesis rather than isolated facts.",
        rubricCriteria: [
          "Strong thesis or main claim",
          "Comparison or synthesis",
          "Evidence from source material",
          "Clear academic writing",
        ],
      },
    ],
  }));

  return [...quizAssessments, ...examAssessments];
}

function buildSeedState(): ModuleKnowledgeState {
  const sources: ModuleSourceFile[] = [];
  const notes: ModuleNote[] = [];
  const chunks: KnowledgeChunk[] = [];

  DEMO_NOTES.forEach((note, index) => {
    const content = `${note.title}\n\n${note.preview}\n\nKey tags: ${note.tags.join(", ")}.`;
    const sourceId = `seed-note-${note.moduleId}-${index + 1}`;
    const createdAt = nowIso();

    const source: ModuleSourceFile = {
      id: sourceId,
      moduleId: note.moduleId,
      title: note.title,
      fileName: `${note.title}.txt`,
      mimeType: "text/plain",
      size: content.length,
      sourceKind: "typed_note",
      extractionStatus: "ready",
      extractedText: content,
      preview: note.preview,
      storageMode: "local",
      createdAt,
    };

    const storedNote: ModuleNote = {
      id: note.id,
      moduleId: note.moduleId,
      title: note.title,
      content,
      preview: note.preview,
      kind: "generated",
      sourceIds: [sourceId],
      createdAt,
      updatedAt: createdAt,
      readTimeMinutes: wordsToMinutes(content),
    };

    sources.push(source);
    notes.push(storedNote);
    chunks.push(...chunkText(note.moduleId, sourceId, content, storedNote.id));
  });

  return {
    sources,
    notes,
    chunks,
    assessments: buildSeedAssessments(),
    flashcards: [],
    attempts: [],
  };
}

export function readKnowledgeState(): ModuleKnowledgeState {
  if (typeof window === "undefined") {
    return buildSeedState();
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seeded = buildSeedState();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }

  try {
    const parsed = JSON.parse(raw) as ModuleKnowledgeState;
    return {
      sources: parsed.sources || [],
      notes: parsed.notes || [],
      chunks: parsed.chunks || [],
      assessments: parsed.assessments || [],
      flashcards: parsed.flashcards || [],
      attempts: parsed.attempts || [],
    };
  } catch {
    const seeded = buildSeedState();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
}

export function writeKnowledgeState(state: ModuleKnowledgeState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent(UPDATE_EVENT));
}

export function useKnowledgeStore() {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const handler = () => setVersion((value) => value + 1);
    window.addEventListener(UPDATE_EVENT, handler);
    return () => window.removeEventListener(UPDATE_EVENT, handler);
  }, []);

  return useMemo(() => readKnowledgeState(), [version]);
}

export function createTypedNote(moduleId: string, title: string, content: string, kind: NoteKind = "typed") {
  const state = readKnowledgeState();
  const createdAt = nowIso();
  const sourceId = `source-${Date.now()}`;
  const noteId = `note-${Date.now()}`;
  const preview = previewOf(content);

  const source: ModuleSourceFile = {
    id: sourceId,
    moduleId,
    title,
    fileName: `${title}.txt`,
    mimeType: "text/plain",
    size: content.length,
    sourceKind: "typed_note",
    extractionStatus: "ready",
    extractedText: content,
    preview,
    storageMode: appConfig.hasFirebase ? "firebase" : "local",
    createdAt,
  };

  const note: ModuleNote = {
    id: noteId,
    moduleId,
    title,
    content,
    preview,
    kind,
    sourceIds: [sourceId],
    createdAt,
    updatedAt: createdAt,
    readTimeMinutes: wordsToMinutes(content),
  };

  state.sources.unshift(source);
  state.notes.unshift(note);
  state.chunks.push(...chunkText(moduleId, sourceId, content, noteId));
  writeKnowledgeState(state);

  return { source, note };
}

export function addUploadedSource(
  moduleId: string,
  payload: Omit<ModuleSourceFile, "id" | "moduleId" | "createdAt" | "storageMode">
) {
  const state = readKnowledgeState();
  const source: ModuleSourceFile = {
    ...payload,
    id: `source-${Date.now()}`,
    moduleId,
    createdAt: nowIso(),
    storageMode: appConfig.hasFirebase ? "firebase" : "local",
  };

  state.sources.unshift(source);
  if (source.extractionStatus === "ready" && source.extractedText.trim().length > 0) {
    state.chunks.push(...chunkText(moduleId, source.id, source.extractedText));
  }

  writeKnowledgeState(state);
  return source;
}

export function addGeneratedNote(
  moduleId: string,
  title: string,
  content: string,
  sourceIds: string[]
) {
  const state = readKnowledgeState();
  const note: ModuleNote = {
    id: `note-${Date.now()}`,
    moduleId,
    title,
    content,
    preview: previewOf(content),
    kind: "generated",
    sourceIds,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    readTimeMinutes: wordsToMinutes(content),
  };

  state.notes.unshift(note);
  writeKnowledgeState(state);
  return note;
}

export function addFlashcardDeck(moduleId: string, title: string, cards: Flashcard[], sourceIds: string[]) {
  const state = readKnowledgeState();
  const deck: FlashcardDeck = {
    id: `deck-${Date.now()}`,
    moduleId,
    title,
    cards,
    sourceIds,
    createdAt: nowIso(),
  };

  state.flashcards.unshift(deck);
  writeKnowledgeState(state);
  return deck;
}

export function addAssessment(assessment: AssessmentBlueprint) {
  const state = readKnowledgeState();
  state.assessments.unshift(assessment);
  writeKnowledgeState(state);
  return assessment;
}

export function saveAssessmentAttempt(attempt: AssessmentAttempt) {
  const state = readKnowledgeState();
  state.attempts.unshift(attempt);

  const assessment = state.assessments.find((item) => item.id === attempt.assessmentId);
  if (assessment) {
    assessment.attempts += 1;
    assessment.latestScore = attempt.percentage;
    assessment.bestScore =
      assessment.bestScore === null
        ? attempt.percentage
        : Math.max(assessment.bestScore, attempt.percentage);
    assessment.status = "Completed";
  }

  writeKnowledgeState(state);
}

export function getModuleKnowledge(moduleId: string) {
  const state = readKnowledgeState();
  return {
    module: DEMO_MODULES.find((item) => item.id === moduleId) || DEMO_MODULES[0],
    sources: state.sources.filter((item) => item.moduleId === moduleId),
    notes: state.notes.filter((item) => item.moduleId === moduleId),
    assessments: state.assessments.filter((item) => item.moduleId === moduleId),
    flashcards: state.flashcards.filter((item) => item.moduleId === moduleId),
    attempts: state.attempts.filter((item) => item.moduleId === moduleId),
  };
}

export function getSourceBundle(moduleId: string, sourceIds: string[]) {
  const state = readKnowledgeState();
  const selectedSources = state.sources.filter(
    (item) => item.moduleId === moduleId && sourceIds.includes(item.id)
  );
  const selectedNotes = state.notes.filter(
    (item) => item.moduleId === moduleId && sourceIds.includes(item.id)
  );

  const fragments = [
    ...selectedSources.map((item) => `SOURCE: ${item.title}\n${item.extractedText}`),
    ...selectedNotes.map((item) => `NOTE: ${item.title}\n${item.content}`),
  ].filter(Boolean);

  return {
    sourceIds,
    sourceSummary: [
      ...selectedSources.map((item) => item.title),
      ...selectedNotes.map((item) => item.title),
    ],
    combinedText: fragments.join("\n\n"),
  };
}

export function getAssessmentById(assessmentId: string) {
  return readKnowledgeState().assessments.find((item) => item.id === assessmentId) || null;
}

export function getAttemptsForAssessment(assessmentId: string) {
  return readKnowledgeState().attempts.filter((item) => item.assessmentId === assessmentId);
}
