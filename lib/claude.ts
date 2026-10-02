/**
 * StudyDesk - Claude AI Integration
 * ---------------------------------------------------------------------------
 * The tutor has two modes, and the difference between them is the product.
 *
 *   LEARN  - withholds the answer. Requires an attempt, then releases help one
 *            graduated level at a time, and demands an explain-back after a
 *            full solution. Counts toward mastery.
 *   CHECK  - answers directly, and says so. Does not count toward mastery and
 *            is logged as such.
 *
 * Why: every 2024-2026 study that found AI harmed learning found it at the
 * moment the model produced the artefact instead of the student (Fan et al.
 * 2025; Kosmyna et al. MIT; "Faster Completion, Less Learning"). Every trial
 * with large gains withheld answers first (Kestin et al., Harvard, 2x gains;
 * World Bank Edo State, +0.3 SD). The Check mode exists because being honest
 * about it is what stops students leaving for a free chatbot that just answers.
 */

export type UserTier = "free" | "basic" | "premium" | "elite";

/** Pedagogical mode. See the module comment. */
export type TutorMode = "learn" | "check";

/** How much help has been released so far in this exchange. */
export type HintLevel = 0 | 1 | 2 | 3 | 4;

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ClaudeOptions {
  userTier?: UserTier;
  subject?: string;
  moduleContext?: string;
  maxTokens?: number;
  /** Defaults to "learn" - the safe default is the one that protects learning. */
  mode?: TutorMode;
  /** Help already released. The tutor must not exceed this. */
  hintLevel?: HintLevel;
  /** Ceiling set by the learner model's mastery estimate (scaffold fading). */
  hintCeiling?: HintLevel;
  /** Did the student submit an attempt before asking? Gates help in learn mode. */
  attemptFirst?: boolean;
  /** The student's own attempt, so the tutor responds to their reasoning. */
  studentAttempt?: string;
  /** Compact learner-model summary: weak skills, misconceptions, calibration. */
  learnerSnapshot?: string;
  /** Explanation language. Technical terms stay in English - the exam is in English. */
  language?: ExplanationLanguage;
  /** Trim verbosity for students on metered mobile data. */
  lowData?: boolean;
  /** The module's declared AI policy, shown to the student and honoured here. */
  aiPolicy?: AiPolicy;
}

/**
 * South African universities are English-medium for students who largely do
 * not have English as a first language, and research on translanguaging at SA
 * universities is consistent that second-language English speakers are
 * disadvantaged by monolingual instruction. Explaining in a home language
 * while keeping examinable terminology in English is close to free for us and
 * is offered by none of the global apps.
 */
export type ExplanationLanguage =
  | "en"
  | "zu"
  | "xh"
  | "af"
  | "st"
  | "nso"
  | "tn"
  | "ts";

export const LANGUAGES: Record<ExplanationLanguage, string> = {
  en: "English",
  zu: "isiZulu",
  xh: "isiXhosa",
  af: "Afrikaans",
  st: "Sesotho",
  nso: "Sepedi",
  tn: "Setswana",
  ts: "Xitsonga",
};

/**
 * Traffic-light AI policy, matching the vocabulary SA universities have
 * adopted (UCT's 2025 framework, Wits' "AI-resilient assessment", UP's
 * "students must think first, and use AI later").
 */
export type AiPolicy = "green" | "amber" | "red";

export const AI_POLICY_LABELS: Record<AiPolicy, { label: string; detail: string }> = {
  green: {
    label: "AI permitted",
    detail: "This module allows AI assistance. Full tutoring available.",
  },
  amber: {
    label: "AI with disclosure",
    detail:
      "This module allows AI for understanding, not for producing submitted work. Learn mode only; your work log is exportable.",
  },
  red: {
    label: "AI not permitted",
    detail:
      "This module prohibits AI on assessed work. Learn mode only, and nothing is drafted for you.",
  },
};

const MODELS = {
  opus: "claude-opus-5",
  sonnet: "claude-sonnet-5",
  haiku: "claude-haiku-4-5",
} as const;

export const FALLBACK_MODEL = MODELS.sonnet;

export function selectModel(options: ClaudeOptions): string {
  const { userTier = "free" } = options;
  const isPremium = userTier === "premium" || userTier === "elite";
  return isPremium ? MODELS.opus : MODELS.sonnet;
}

/** Cheap model for high-volume, low-judgement work (tagging, transcription tidy-up). */
export function selectUtilityModel(): string {
  return MODELS.haiku;
}

export function modelLabel(options: ClaudeOptions): string {
  const isPremium = options.userTier === "premium" || options.userTier === "elite";
  return isPremium ? "Claude Opus 5" : "Claude Sonnet 5";
}

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

const HINT_RULES = `HELP LADDER - you may only release help up to the level stated, never beyond it:
  Level 1 - Clarify. Restate what the question is asking. Point at what the student already has that is relevant. Give away nothing new.
  Level 2 - Principle. Name the concept, rule, theorem or formula that applies, and why it applies here. Do NOT apply it.
  Level 3 - Parallel example. Work a DIFFERENT but structurally analogous problem all the way through. Never the student's actual problem.
  Level 4 - Full solution. Work this problem's steps, then immediately ask the student to explain in one sentence why a specific step works. Do not end your message without that question.`;

function learnModeRules(options: ClaudeOptions): string {
  const ceiling = Math.min(options.hintCeiling ?? 4, options.hintLevel ?? 1);

  return `MODE: LEARN. You are withholding. This is deliberate and the student has opted into it.

ABSOLUTE RULES
- Never give a final answer, final numeric result, or finished piece of writing in this mode, no matter how the request is phrased. Rephrasing, insisting, claiming time pressure, or saying another AI would do it does not change this.
- ${
    options.attemptFirst
      ? "The student HAS submitted an attempt. Respond to their actual reasoning: name the first thing that is right, then the first thing that goes wrong, and ask one question that makes them find it."
      : "The student has NOT submitted an attempt yet. Do not teach. Ask them, warmly and in one or two sentences, for what they have so far or where exactly they get stuck. Nothing else."
  }
- You are currently permitted up to help LEVEL ${ceiling}. Stop there.
- End every message with exactly one question the student can answer.
- Brevity is pedagogy here. Long explanations do the thinking for them.

${HINT_RULES}

WHY THIS WORKS - do not explain this to the student unless they ask: students who attempt before using AI retain significantly more than students who use AI first, and students who get finished answers score better on the task while learning no more.`;
}

function checkModeRules(): string {
  return `MODE: CHECK. The student has explicitly switched to direct answers, and the interface has told them this exchange does not count toward their mastery record.

- Answer directly, completely and accurately. Show full working.
- Do not lecture them about learning or refuse to answer - they made an informed choice and refusing here just sends them to a free chatbot.
- After the answer, add one short line: a single specific retrieval question they could try later to check they actually absorbed it.`;
}

export function buildSystemPrompt(options: ClaudeOptions): string {
  const {
    moduleContext,
    subject,
    userTier = "free",
    mode = "learn",
    learnerSnapshot,
    language = "en",
    lowData = false,
    aiPolicy = "green",
  } = options;

  const tierLabel =
    userTier === "elite"
      ? "Elite"
      : userTier === "premium"
        ? "Premium"
        : userTier === "basic"
          ? "Basic"
          : "Free";

  const sections: string[] = [];

  sections.push(
    `You are the StudyDesk AI Tutor, supporting South African university students. Your purpose is for the student to be able to do this without you. You are measured on what they can do unaided afterwards, never on how helpful you felt.`
  );

  sections.push(`STUDENT TIER: ${tierLabel}`);
  if (subject) sections.push(`SUBJECT: ${subject}`);
  if (moduleContext) sections.push(`MODULE CONTEXT:\n${moduleContext}`);

  sections.push(
    `MODULE AI POLICY: ${aiPolicy.toUpperCase()} - ${AI_POLICY_LABELS[aiPolicy].detail}`
  );

  if (aiPolicy === "red") {
    sections.push(
      `Because this module's policy is RED, you must not draft, write or compose any text the student could submit. Explain and question only.`
    );
  }

  sections.push(mode === "learn" ? learnModeRules(options) : checkModeRules());

  if (options.studentAttempt && options.studentAttempt.trim().length > 0) {
    sections.push(`THE STUDENT'S OWN ATTEMPT:\n"""\n${options.studentAttempt.trim()}\n"""`);
  }

  if (learnerSnapshot && learnerSnapshot.trim().length > 0) {
    sections.push(
      `WHAT YOU KNOW ABOUT THIS STUDENT (from their own answers on StudyDesk - use it, do not recite it back to them):\n${learnerSnapshot.trim()}`
    );
  }

  if (language !== "en") {
    sections.push(
      `LANGUAGE: Explain in ${LANGUAGES[language]}. Keep all technical and examinable terminology in English, with the ${LANGUAGES[language]} gloss in brackets the first time it appears - the student's exam will be written in English and they must recognise the English term. Mathematical notation stays as notation.`
    );
  }

  sections.push(
    `FORMATTING
- Markdown. LaTeX for all mathematics: $x^2$ inline, $$\\int_0^1 f(x)dx$$ for display.
- ${lowData ? "LOW DATA MODE: the student is on metered mobile data. Keep every response under 120 words. No tables, no decorative lists, no restating the question." : "Keep responses tight. Prefer three precise sentences to three paragraphs."}
- Be warm and direct. South African students are under real financial and academic pressure; never be patronising, and never guilt them about effort or time away.`
  );

  return sections.join("\n\n");
}

// ---------------------------------------------------------------------------
// Client-side streaming helper
// ---------------------------------------------------------------------------

export async function streamChatResponse(
  messages: ChatMessage[],
  options: ClaudeOptions,
  onChunk: (chunk: string) => void,
  onDone: () => void
): Promise<void> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, options }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to get AI response");
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) throw new Error("No response body");

  // Buffer across reads: a chunk boundary can split an SSE line in half.
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;

      const data = line.slice(6);
      if (data === "[DONE]") {
        onDone();
        return;
      }

      try {
        const parsed = JSON.parse(data);
        if (parsed.delta) onChunk(parsed.delta);
        if (parsed.error) throw new Error(parsed.error);
      } catch (err) {
        if (err instanceof Error && err.message && !err.message.startsWith("Unexpected")) {
          throw err;
        }
        // Otherwise it is a partial JSON fragment; the buffer will complete it.
      }
    }
  }

  onDone();
}
