"use client";

/**
 * StudyDesk - Learner Model
 * ---------------------------------------------------------------------------
 * This is the part of StudyDesk that free AI tutors cannot copy: a durable,
 * per-skill record of what a student actually knows, built from their own
 * attempts, quiz items, exam marks and help-seeking behaviour.
 *
 * Three evidence-based models run side by side:
 *
 *  1. BKT (Bayesian Knowledge Tracing) for mastery. Chosen over Deep Knowledge
 *     Tracing deliberately: its parameters map to things a human can read
 *     (mastery, slip, guess), which is required because we show the model to
 *     the student (open learner model) and to their lecturer.
 *
 *  2. Elo for item difficulty, so question selection can target the
 *     ~70-85% success band where desirable difficulty lives (Bjork).
 *
 *  3. An FSRS-style DSR scheduler (Difficulty / Stability / Retrievability)
 *     for review timing. FSRS-6 beats SM-2 for ~99.6% of users on a 700m
 *     review benchmark and buys equal retention with 20-30% fewer reviews -
 *     which for a student paying per megabyte is a real cost saving.
 *
 * Plus two things the research says matter and nobody ships:
 *  - Calibration tracking (predicted vs actual) to expose the fluency illusion.
 *  - A help ledger, so hint escalation is visible and scaffolds can fade.
 */

import { useEffect, useMemo, useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Four-point review grade, as used by SM-2/FSRS family schedulers. */
export type ReviewGrade = 1 | 2 | 3 | 4;

/** How much help the student escalated to before answering. */
export type HintLevel = 0 | 1 | 2 | 3 | 4;

export const HINT_LADDER: Record<Exclude<HintLevel, 0>, { label: string; detail: string }> = {
  1: {
    label: "Clarify",
    detail: "Restate what the question is asking and what you already have.",
  },
  2: {
    label: "Principle",
    detail: "Name the concept, rule or formula that applies - without using it.",
  },
  3: {
    label: "Parallel example",
    detail: "Work a different but analogous problem all the way through.",
  },
  4: {
    label: "Full solution",
    detail: "Show this problem's full working, then require an explain-back.",
  },
};

export interface SkillState {
  id: string;
  moduleId: string;
  /** Human-readable topic this skill came from. */
  name: string;
  /** BKT posterior probability the skill is mastered, 0..1. */
  mastery: number;
  /** Elo rating of the student on this skill (1500 = neutral). */
  rating: number;
  /** Elo rating of the material, so we can pick items in the target band. */
  itemRating: number;
  attempts: number;
  correct: number;
  /** FSRS difficulty, 1 (easy) .. 10 (hard). */
  difficulty: number;
  /** FSRS stability: days until recall probability decays to 0.9. */
  stability: number;
  reps: number;
  lapses: number;
  lastReviewedAt: string | null;
  dueAt: string | null;
  /** Distinct misconceptions observed, newest first, capped. */
  misconceptions: string[];
  /** Highest hint level the student has needed recently. */
  lastHintLevel: HintLevel;
}

export interface ConfidenceEvent {
  id: string;
  skillId: string;
  moduleId: string;
  /** What the student predicted, 0..1. */
  predicted: number;
  /** What actually happened, 0..1 (partial credit allowed). */
  actual: number;
  at: string;
}

export interface HelpEvent {
  id: string;
  skillId: string | null;
  moduleId: string;
  mode: "learn" | "check";
  hintLevel: HintLevel;
  /** Did the student submit an attempt before asking for this? */
  attemptFirst: boolean;
  /** Did they explain the step back afterwards? */
  explainedBack: boolean;
  question: string;
  at: string;
}

export interface LearnerModelState {
  skills: Record<string, SkillState>;
  confidence: ConfidenceEvent[];
  help: HelpEvent[];
  /** ISO dates on which the student did any retrieval work. */
  activeDays: string[];
}

// ---------------------------------------------------------------------------
// BKT parameters
// ---------------------------------------------------------------------------

const BKT = {
  /** Prior probability of mastery before any evidence. */
  init: 0.25,
  /** Probability of learning the skill on an opportunity. */
  transit: 0.12,
  /** Probability of answering wrong despite mastery. */
  slip: 0.1,
  /** Probability of answering right without mastery. */
  guess: 0.2,
} as const;

/** Mastery above this counts as "proved" and scaffolding is withdrawn. */
export const MASTERY_PROVED = 0.85;
/** Mastery below this counts as a weak spot worth surfacing. */
export const MASTERY_WEAK = 0.4;

const STORAGE_KEY = "studydesk.learner-model.v1";
const UPDATE_EVENT = "studydesk-learner-model-updated";
const MAX_MISCONCEPTIONS = 5;
const MAX_EVENTS = 500;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function nowIso() {
  return new Date().toISOString();
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function addDays(from: Date, days: number) {
  const next = new Date(from.getTime());
  next.setTime(next.getTime() + days * 86_400_000);
  return next;
}

function daysBetween(fromIso: string, toIso: string) {
  return (Date.parse(toIso) - Date.parse(fromIso)) / 86_400_000;
}

/** Stable, readable skill id so the same topic always maps to the same skill. */
export function skillIdFor(moduleId: string, topic: string) {
  const slug = topic
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return `${moduleId}:${slug || "general"}`;
}

function blankSkill(moduleId: string, topic: string): SkillState {
  return {
    id: skillIdFor(moduleId, topic),
    moduleId,
    name: topic,
    mastery: BKT.init,
    rating: 1500,
    itemRating: 1500,
    attempts: 0,
    correct: 0,
    difficulty: 5.5,
    stability: 0,
    reps: 0,
    lapses: 0,
    lastReviewedAt: null,
    dueAt: null,
    misconceptions: [],
    lastHintLevel: 0,
  };
}

// ---------------------------------------------------------------------------
// The three models
// ---------------------------------------------------------------------------

/**
 * BKT update. `score` may be fractional (partial credit on a written answer),
 * in which case we interpolate between the correct and incorrect posteriors
 * rather than forcing a binary outcome - exam marking is rarely binary.
 */
export function updateMastery(prior: number, score: number): number {
  const p = clamp(prior, 0.001, 0.999);
  const s = clamp(score, 0, 1);

  const pCorrect = p * (1 - BKT.slip) + (1 - p) * BKT.guess;
  const pWrong = 1 - pCorrect;

  const posteriorIfCorrect = (p * (1 - BKT.slip)) / Math.max(pCorrect, 1e-6);
  const posteriorIfWrong = (p * BKT.slip) / Math.max(pWrong, 1e-6);

  const posterior = s * posteriorIfCorrect + (1 - s) * posteriorIfWrong;
  return clamp(posterior + (1 - posterior) * BKT.transit, 0.001, 0.999);
}

/** Symmetric Elo update for student rating against item rating. */
export function updateElo(studentRating: number, itemRating: number, score: number) {
  const expected = 1 / (1 + Math.pow(10, (itemRating - studentRating) / 400));
  const k = 32;
  return {
    student: studentRating + k * (clamp(score, 0, 1) - expected),
    item: itemRating + k * (expected - clamp(score, 0, 1)),
    expected,
  };
}

/** Map a raw score plus help level onto a four-point review grade. */
export function gradeFor(score: number, hintLevel: HintLevel = 0): ReviewGrade {
  if (score < 0.5) return 1;
  if (hintLevel >= 3) return 2;
  if (score < 0.85 || hintLevel === 2) return 2;
  if (hintLevel === 1) return 3;
  return score >= 0.99 ? 4 : 3;
}

/** Probability of recall now, given stability and days elapsed. */
export function retrievability(stability: number, elapsedDays: number) {
  if (stability <= 0) return 0;
  return Math.exp((Math.log(0.9) * Math.max(0, elapsedDays)) / stability);
}

const INITIAL_STABILITY: Record<ReviewGrade, number> = { 1: 0.4, 2: 1.2, 3: 3.1, 4: 8.2 };

/**
 * FSRS-style DSR step. Returns the next difficulty, stability and interval in
 * days. Simplified from FSRS-6: same Difficulty / Stability / Retrievability
 * structure and the same mean-reversion on difficulty (which is what removes
 * SM-2's "ease hell"), without the 19 fitted weights we have no data for yet.
 */
export function scheduleReview(
  skill: Pick<SkillState, "difficulty" | "stability" | "lastReviewedAt" | "reps">,
  grade: ReviewGrade,
  at: string = nowIso()
) {
  const firstReview = skill.reps === 0 || skill.stability <= 0 || !skill.lastReviewedAt;

  // Difficulty: nudge by how the review went, then revert toward the mean.
  let difficulty = firstReview ? 5.5 - (grade - 3) * 0.9 : skill.difficulty - 0.15 * (grade - 3);
  difficulty = clamp(difficulty + 0.1 * (5.5 - difficulty), 1, 10);

  let stability: number;

  if (firstReview) {
    stability = INITIAL_STABILITY[grade];
  } else {
    const elapsed = daysBetween(skill.lastReviewedAt as string, at);
    const r = retrievability(skill.stability, elapsed);

    if (grade === 1) {
      // Lapse: stability collapses but never to zero.
      stability = Math.max(0.3, skill.stability * 0.35 * ((11 - difficulty) / 10));
    } else {
      const gradeFactor = grade === 2 ? 0.7 : grade === 3 ? 1 : 1.35;
      const growth =
        1 +
        Math.exp(0.4) *
          ((11 - difficulty) / 10) *
          Math.pow(skill.stability, -0.2) *
          (Math.exp((1 - r) * 1.5) - 1) *
          gradeFactor;
      stability = clamp(skill.stability * growth, 0.3, 3650);
    }
  }

  // Target 90% recall at review time, so interval == stability.
  const intervalDays = clamp(Math.round(stability), 1, 365);

  return {
    difficulty,
    stability,
    intervalDays,
    dueAt: addDays(new Date(at), intervalDays).toISOString(),
  };
}

/**
 * Scaffold fading. The ceiling on how much help the tutor will give drops as
 * the student proves the skill - on something they have mastered the tutor
 * asks instead of tells. This is the assistance dilemma made concrete.
 */
export function hintCeilingFor(mastery: number): HintLevel {
  if (mastery >= MASTERY_PROVED) return 1;
  if (mastery >= 0.6) return 2;
  if (mastery >= MASTERY_WEAK) return 3;
  return 4;
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

function emptyState(): LearnerModelState {
  return { skills: {}, confidence: [], help: [], activeDays: [] };
}

export function readLearnerModel(): LearnerModelState {
  if (typeof window === "undefined") return emptyState();

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return emptyState();

  try {
    const parsed = JSON.parse(raw) as LearnerModelState;
    return {
      skills: parsed.skills || {},
      confidence: parsed.confidence || [],
      help: parsed.help || [],
      activeDays: parsed.activeDays || [],
    };
  } catch {
    return emptyState();
  }
}

export function writeLearnerModel(state: LearnerModelState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent(UPDATE_EVENT));
}

export function useLearnerModel() {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const handler = () => setVersion((value) => value + 1);
    window.addEventListener(UPDATE_EVENT, handler);
    return () => window.removeEventListener(UPDATE_EVENT, handler);
  }, []);

  // `version` is the invalidation trigger, not an input: the store lives in
  // localStorage, so a bump is how we know to re-read it.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => readLearnerModel(), [version]);
}

function markActive(state: LearnerModelState) {
  const day = today();
  if (!state.activeDays.includes(day)) state.activeDays.push(day);
  state.activeDays = state.activeDays.slice(-400);
}

// ---------------------------------------------------------------------------
// Recording evidence
// ---------------------------------------------------------------------------

export interface AttemptEvidence {
  moduleId: string;
  topic: string;
  /** Fraction of marks earned, 0..1. */
  score: number;
  hintLevel?: HintLevel;
  /** A short description of the error, if the marker spotted one. */
  misconception?: string | null;
}

/**
 * Fold one answered question into the model. Called once per question from the
 * assessment runner and once per resolved tutor exchange.
 */
export function recordAttempt(evidence: AttemptEvidence): SkillState {
  const state = readLearnerModel();
  const id = skillIdFor(evidence.moduleId, evidence.topic);
  const skill = state.skills[id] || blankSkill(evidence.moduleId, evidence.topic);
  const at = nowIso();
  const score = clamp(evidence.score, 0, 1);
  const hintLevel = (evidence.hintLevel ?? 0) as HintLevel;

  skill.mastery = updateMastery(skill.mastery, score);

  const elo = updateElo(skill.rating, skill.itemRating, score);
  skill.rating = elo.student;
  skill.itemRating = elo.item;

  const grade = gradeFor(score, hintLevel);
  const scheduled = scheduleReview(skill, grade, at);
  skill.difficulty = scheduled.difficulty;
  skill.stability = scheduled.stability;
  skill.dueAt = scheduled.dueAt;
  skill.lastReviewedAt = at;
  skill.reps += 1;
  if (grade === 1) skill.lapses += 1;

  skill.attempts += 1;
  if (score >= 0.5) skill.correct += 1;
  skill.lastHintLevel = hintLevel;
  skill.name = evidence.topic || skill.name;

  if (evidence.misconception) {
    skill.misconceptions = [
      evidence.misconception,
      ...skill.misconceptions.filter((m) => m !== evidence.misconception),
    ].slice(0, MAX_MISCONCEPTIONS);
  }

  state.skills[id] = skill;
  markActive(state);
  writeLearnerModel(state);
  return skill;
}

export function recordConfidence(
  moduleId: string,
  topic: string,
  predicted: number,
  actual: number
) {
  const state = readLearnerModel();
  state.confidence.unshift({
    id: `conf-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    skillId: skillIdFor(moduleId, topic),
    moduleId,
    predicted: clamp(predicted, 0, 1),
    actual: clamp(actual, 0, 1),
    at: nowIso(),
  });
  state.confidence = state.confidence.slice(0, MAX_EVENTS);
  writeLearnerModel(state);
}

export function recordHelp(event: Omit<HelpEvent, "id" | "at">) {
  const state = readLearnerModel();
  state.help.unshift({
    ...event,
    id: `help-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    at: nowIso(),
  });
  state.help = state.help.slice(0, MAX_EVENTS);

  if (event.skillId && state.skills[event.skillId]) {
    state.skills[event.skillId].lastHintLevel = event.hintLevel;
  }

  markActive(state);
  writeLearnerModel(state);
}

/** Mark the most recent help event on a skill as explained back. */
export function recordExplainBack(skillId: string | null) {
  const state = readLearnerModel();
  const target = state.help.find((e) => e.skillId === skillId && !e.explainedBack);
  if (!target) return;
  target.explainedBack = true;
  writeLearnerModel(state);
}

/** Register a skill we know exists before any evidence (e.g. from new notes). */
export function registerSkills(moduleId: string, topics: string[]) {
  if (topics.length === 0) return;
  const state = readLearnerModel();
  let changed = false;

  topics.forEach((topic) => {
    const id = skillIdFor(moduleId, topic);
    if (!state.skills[id]) {
      state.skills[id] = blankSkill(moduleId, topic);
      changed = true;
    }
  });

  if (changed) writeLearnerModel(state);
}

// ---------------------------------------------------------------------------
// Reading the model
// ---------------------------------------------------------------------------

export function listSkills(state: LearnerModelState, moduleId?: string) {
  return Object.values(state.skills)
    .filter((skill) => !moduleId || skill.moduleId === moduleId)
    .sort((a, b) => a.mastery - b.mastery);
}

export function dueSkills(state: LearnerModelState, at: string = nowIso()) {
  return Object.values(state.skills)
    .filter((skill) => skill.dueAt !== null && Date.parse(skill.dueAt) <= Date.parse(at))
    .sort((a, b) => Date.parse(a.dueAt as string) - Date.parse(b.dueAt as string));
}

/** Skills whose recall probability has decayed furthest below target. */
export function decayedSkills(state: LearnerModelState, at: string = nowIso()) {
  return Object.values(state.skills)
    .filter((skill) => skill.lastReviewedAt && skill.stability > 0)
    .map((skill) => ({
      skill,
      recall: retrievability(
        skill.stability,
        daysBetween(skill.lastReviewedAt as string, at)
      ),
    }))
    .sort((a, b) => a.recall - b.recall);
}

/**
 * Calibration: the gap between how well a student thinks they did and how well
 * they did. A positive gap is overconfidence, which is the fluency illusion
 * showing up in data. Brier score is the standard accuracy measure.
 */
export function calibration(state: LearnerModelState, moduleId?: string) {
  const events = state.confidence.filter((e) => !moduleId || e.moduleId === moduleId);
  if (events.length === 0) {
    return { samples: 0, gap: 0, brier: 0, verdict: "no data" as const };
  }

  const gap =
    events.reduce((sum, e) => sum + (e.predicted - e.actual), 0) / events.length;
  const brier =
    events.reduce((sum, e) => sum + Math.pow(e.predicted - e.actual, 2), 0) / events.length;

  const verdict =
    gap > 0.15 ? ("overconfident" as const)
    : gap < -0.15 ? ("underconfident" as const)
    : ("well calibrated" as const);

  return { samples: events.length, gap, brier, verdict };
}

/**
 * Help-seeking health. The research link is hint abuse / "gaming the system",
 * which is consistently associated with lower learning gains. We surface it to
 * the student rather than penalising them for it.
 */
export function helpProfile(state: LearnerModelState, moduleId?: string) {
  const events = state.help.filter((e) => !moduleId || e.moduleId === moduleId);
  const recent = events.slice(0, 30);

  if (recent.length === 0) {
    return { samples: 0, attemptFirstRate: 1, deepHelpRate: 0, explainBackRate: 1, flag: false };
  }

  const attemptFirstRate = recent.filter((e) => e.attemptFirst).length / recent.length;
  const deepHelpRate = recent.filter((e) => e.hintLevel >= 3).length / recent.length;
  const revealed = recent.filter((e) => e.hintLevel >= 3);
  const explainBackRate =
    revealed.length === 0 ? 1 : revealed.filter((e) => e.explainedBack).length / revealed.length;

  return {
    samples: recent.length,
    attemptFirstRate,
    deepHelpRate,
    explainBackRate,
    // Jumping to full solutions without attempting first, repeatedly.
    flag: attemptFirstRate < 0.5 && deepHelpRate > 0.4,
  };
}

export function masteryOf(state: LearnerModelState, moduleId: string, topic: string) {
  return state.skills[skillIdFor(moduleId, topic)]?.mastery ?? BKT.init;
}

/** Exam readiness per module: mastery weighted by how recently it was proved. */
export function examReadiness(state: LearnerModelState, moduleId: string, at: string = nowIso()) {
  const skills = listSkills(state, moduleId);
  if (skills.length === 0) return { score: 0, skills: 0, weakest: [] as SkillState[] };

  const score =
    skills.reduce((sum, skill) => {
      const recall = skill.lastReviewedAt
        ? retrievability(skill.stability, daysBetween(skill.lastReviewedAt, at))
        : 0;
      // Knowing it once is not readiness; it has to still be retrievable.
      return sum + skill.mastery * (0.4 + 0.6 * recall);
    }, 0) / skills.length;

  return {
    score: Math.round(score * 100),
    skills: skills.length,
    weakest: skills.slice(0, 3),
  };
}

/**
 * The compact summary injected into the tutor's system prompt. This is what
 * turns a generic chatbot into a tutor that knows this specific student.
 * Kept short on purpose - it rides on every message.
 */
export function learnerSnapshot(
  state: LearnerModelState,
  moduleId: string,
  topic?: string
): string {
  const skills = listSkills(state, moduleId);
  if (skills.length === 0) return "";

  const lines: string[] = [];
  const weak = skills.filter((s) => s.mastery < MASTERY_WEAK).slice(0, 4);
  const proved = skills.filter((s) => s.mastery >= MASTERY_PROVED).slice(0, 4);

  if (weak.length > 0) {
    lines.push(`WEAK SKILLS (scaffold these): ${weak.map((s) => s.name).join("; ")}`);
  }
  if (proved.length > 0) {
    lines.push(
      `PROVED SKILLS (do not re-explain, ask instead): ${proved.map((s) => s.name).join("; ")}`
    );
  }

  const misconceptions = skills
    .flatMap((s) => s.misconceptions.map((m) => `${s.name}: ${m}`))
    .slice(0, 3);
  if (misconceptions.length > 0) {
    lines.push(`OBSERVED MISCONCEPTIONS: ${misconceptions.join(" | ")}`);
  }

  const cal = calibration(state, moduleId);
  if (cal.samples >= 3 && cal.verdict === "overconfident") {
    lines.push(
      "CALIBRATION: this student consistently overestimates their accuracy. Check understanding before accepting a confident answer."
    );
  }

  const help = helpProfile(state, moduleId);
  if (help.flag) {
    lines.push(
      "HELP PATTERN: this student tends to request full solutions without attempting first. Hold the line on the attempt-first rule."
    );
  }

  if (topic) {
    const current = state.skills[skillIdFor(moduleId, topic)];
    if (current) {
      lines.push(
        `CURRENT TOPIC "${current.name}": mastery ${(current.mastery * 100).toFixed(0)}%, ` +
          `${current.correct}/${current.attempts} correct, max help allowed = level ${hintCeilingFor(current.mastery)}.`
      );
    }
  }

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Integrity: the exportable work log
// ---------------------------------------------------------------------------

export interface WorkLogEntry {
  at: string;
  kind: "help" | "attempt";
  moduleId: string;
  skill: string;
  detail: string;
}

/**
 * An auditable record a student can hand a lecturer. SA universities are
 * moving away from AI detectors (UCT dropped Turnitin's AI score in Oct 2025
 * over false positives) and toward evidence of process - which is exactly
 * what this is.
 */
export function buildWorkLog(state: LearnerModelState, moduleId?: string): WorkLogEntry[] {
  const entries: WorkLogEntry[] = state.help
    .filter((e) => !moduleId || e.moduleId === moduleId)
    .map((e) => ({
      at: e.at,
      kind: "help" as const,
      moduleId: e.moduleId,
      skill: e.skillId ? state.skills[e.skillId]?.name || e.skillId : "unassigned",
      detail:
        `${e.mode} mode, help level ${e.hintLevel}` +
        `${e.attemptFirst ? ", attempted first" : ", no prior attempt"}` +
        `${e.hintLevel >= 3 ? (e.explainedBack ? ", explained back" : ", not explained back") : ""}` +
        ` - "${e.question.slice(0, 120)}"`,
    }));

  return entries.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
}

export function workLogToCsv(entries: WorkLogEntry[]) {
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const header = "timestamp,type,module,skill,detail";
  const rows = entries.map((e) =>
    [e.at, e.kind, e.moduleId, e.skill, e.detail].map(escape).join(",")
  );
  return [header, ...rows].join("\n");
}

export function resetLearnerModel() {
  writeLearnerModel(emptyState());
}
