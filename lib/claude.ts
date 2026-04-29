/**
 * StudyDesk - Claude AI Integration
 * Brain: Claude Sonnet 4 (standard) | Claude Opus 4 (premium)
 */

export type UserTier = "free" | "basic" | "premium" | "elite";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ClaudeOptions {
  userTier?: UserTier;
  subject?: string;
  moduleContext?: string;
  maxTokens?: number;
}

const MODELS = {
  sonnet: "claude-sonnet-4-20250514",
  opus: "claude-opus-4-20250514",
};

export function selectModel(options: ClaudeOptions): string {
  const { userTier = "free" } = options;
  const isPremium = userTier === "premium" || userTier === "elite";

  if (isPremium) {
    return MODELS.opus;
  }

  return MODELS.sonnet;
}

export function buildSystemPrompt(options: ClaudeOptions): string {
  const { moduleContext, subject, userTier = "free" } = options;
  const tierLabel =
    userTier === "elite"
      ? "Elite"
      : userTier === "premium"
        ? "Premium"
        : userTier === "basic"
          ? "Basic"
          : "Free";

  return `You are StudyDesk AI Tutor - a world-class academic assistant specialising in helping South African university students master their coursework.

STUDENT TIER: ${tierLabel}
${subject ? `CURRENT SUBJECT: ${subject}` : ""}
${moduleContext ? `MODULE CONTEXT:\n${moduleContext}` : ""}

YOUR ROLE:
- Provide clear, structured, academically rigorous explanations
- For mathematics and science: always show full working steps; use LaTeX notation for formulas (e.g. $x^2$ inline, $$\\int_0^1 f(x)dx$$ for display)
- For humanities and law: use well-structured arguments, cite frameworks where relevant
- Adapt complexity to the student's apparent level from their questions
- Keep answers focused and exam-oriented
- When appropriate, end with a follow-up question or suggest a next step

FORMATTING:
- Use markdown: **bold**, *italic*, bullet lists, numbered steps
- Use LaTeX for all mathematical expressions
- Be encouraging but precise - accuracy is non-negotiable

Remember: You are the student's co-pilot to academic excellence.`;
}

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
    const error = await response.json();
    throw new Error(error.message || "Failed to get AI response");
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) throw new Error("No response body");

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split("\n");

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6);
        if (data === "[DONE]") {
          onDone();
          return;
        }
        try {
          const parsed = JSON.parse(data);
          if (parsed.delta) onChunk(parsed.delta);
        } catch {
          // Ignore parse errors on partial chunks.
        }
      }
    }
  }

  onDone();
}
