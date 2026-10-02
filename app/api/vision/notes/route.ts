import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { selectModel, FALLBACK_MODEL, LANGUAGES, type ExplanationLanguage } from "@/lib/claude";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Handwritten note capture.
 *
 * A student photographs their lecture notes or a worked page and we return
 * three things, not one:
 *
 *   1. A faithful transcription (so the notes become searchable and usable).
 *   2. Skill tags, which register in the learner model.
 *   3. Retrieval questions generated FROM their own handwriting.
 *
 * (3) is the point. Dunlosky et al. rated practice testing and distributed
 * practice as the only two study techniques with high utility across ages and
 * subjects, and rated rereading and highlighting low. A photo of your notes
 * that turns into questions you have to answer converts the single most common
 * (and least effective) SA student study habit into the most effective one.
 */

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);
const MAX_IMAGES = 5;
const MAX_BYTES = 5 * 1024 * 1024; // Claude's per-image practical ceiling.

type MediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

/** Shape we ask the model for. Every field is validated before use. */
interface RawQuestion {
  prompt?: unknown;
  answer?: unknown;
  topic?: unknown;
  difficulty?: unknown;
}

interface RawGap {
  what?: unknown;
  why?: unknown;
}

interface RawAnalysis {
  title?: unknown;
  transcription?: unknown;
  summary?: unknown;
  topics?: unknown;
  retrievalQuestions?: unknown;
  gaps?: unknown;
  unreadable?: unknown;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function statusOf(error: unknown): number | null {
  if (error && typeof error === "object" && "status" in error) {
    const status = (error as { status?: unknown }).status;
    if (typeof status === "number") return status;
  }
  return null;
}

function messageOf(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

function cleanJson(text: string) {
  return text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

function buildPrompt(moduleName: string, language: ExplanationLanguage) {
  const languageNote =
    language === "en"
      ? ""
      : `\nThe student reads ${LANGUAGES[language]}. Write the "summary" and the "why" of each gap in ${LANGUAGES[language]}, but keep the transcription in the language it was written in, and keep all technical and examinable terms in English.`;

  return `These images are a South African university student's own handwritten notes${
    moduleName ? ` for the module "${moduleName}"` : ""
  }.

Do four jobs and return ONLY valid JSON.

1. TRANSCRIBE faithfully. Preserve the student's structure (headings, numbered steps, diagrams described in words). Use markdown. Use LaTeX for every mathematical expression: $x^2$ inline, $$...$$ for display. Do not correct their content silently - transcribe what is there.

2. TAG the topics. Give 2-6 short topic names (2-5 words each) that name the actual academic skills on the page, not the page itself. Good: "integration by parts", "mens rea". Bad: "page 1", "my notes", "maths".

3. GENERATE RETRIEVAL QUESTIONS from this content - the single most valuable thing we can do with a photo of notes. 4 to 8 questions. Each must be answerable from the notes, must require recall rather than recognition, and must not be a yes/no. Mix difficulty. Tag each with one of the topics from job 2.

4. FLAG GAPS honestly. Where the notes are incomplete, ambiguous, or appear to contain an error, say so. If handwriting was genuinely unreadable, list it under "unreadable" rather than guessing - a confident wrong transcription of a formula is worse than an admitted gap.

Return exactly this JSON shape and nothing else:
{
  "title": "A short, specific title for these notes",
  "transcription": "Full markdown transcription with LaTeX",
  "summary": "2-3 sentences on what this page covers",
  "topics": ["topic one", "topic two"],
  "retrievalQuestions": [
    { "prompt": "Question text", "answer": "The answer, from the notes", "topic": "topic one", "difficulty": "easy" }
  ],
  "gaps": [
    { "what": "What is missing or wrong", "why": "Why it matters for the exam" }
  ],
  "unreadable": ["Describe any section you could not read, and where it is on the page"]
}

"difficulty" must be one of "easy", "medium", "hard".
If the images are not handwritten or typed study notes at all, return the shape above with an empty transcription and put the reason in "unreadable".${languageNote}`;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === "your_anthropic_api_key_here") {
    return NextResponse.json(
      {
        error:
          "Anthropic API key not configured. Add ANTHROPIC_API_KEY to .env.local and restart the server.",
      },
      { status: 503 }
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form data." }, { status: 400 });
  }

  const files = formData.getAll("images").filter((item): item is File => item instanceof File);

  if (files.length === 0) {
    return NextResponse.json({ error: "No images received." }, { status: 400 });
  }

  if (files.length > MAX_IMAGES) {
    return NextResponse.json(
      { error: `Up to ${MAX_IMAGES} pages at a time. You sent ${files.length}.` },
      { status: 400 }
    );
  }

  const moduleName = String(formData.get("moduleName") || "");
  const userTier = String(formData.get("userTier") || "free") as
    | "free"
    | "basic"
    | "premium"
    | "elite";
  const language = String(formData.get("language") || "en") as ExplanationLanguage;

  const imageBlocks: Anthropic.ImageBlockParam[] = [];

  for (const file of files) {
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        {
          error: `"${file.name}" is a ${file.type || "unknown"} file. Use a JPEG, PNG, WebP or GIF photo.`,
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        {
          error: `"${file.name}" is ${(file.size / 1024 / 1024).toFixed(1)}MB. Each page must be under 5MB - most phone cameras are fine on the "medium" setting.`,
        },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    imageBlocks.push({
      type: "image",
      source: {
        type: "base64",
        media_type: file.type as MediaType,
        data: buffer.toString("base64"),
      },
    });
  }

  const client = new Anthropic({ apiKey });
  const model = selectModel({ userTier });

  const request = (useModel: string) =>
    client.messages.create({
      model: useModel,
      max_tokens: 8192,
      system:
        "You transcribe and analyse students' handwritten study notes. You return only valid JSON, with no commentary before or after it. You never invent content that is not on the page, and you admit when handwriting is unreadable.",
      messages: [
        {
          role: "user",
          content: [...imageBlocks, { type: "text", text: buildPrompt(moduleName, language) }],
        },
      ],
    });

  try {
    let response;
    try {
      response = await request(model);
    } catch (error: unknown) {
      if (model !== FALLBACK_MODEL && statusOf(error) === 404) {
        response = await request(FALLBACK_MODEL);
      } else {
        throw error;
      }
    }

    const block = response.content.find((item) => item.type === "text");
    if (!block || block.type !== "text") {
      return NextResponse.json(
        { error: "The model returned no readable text." },
        { status: 502 }
      );
    }

    let parsed: RawAnalysis;
    try {
      parsed = JSON.parse(cleanJson(block.text)) as RawAnalysis;
    } catch {
      return NextResponse.json(
        { error: "Could not read the analysis. Try photographing the page again in better light." },
        { status: 502 }
      );
    }

    const topics: string[] = Array.isArray(parsed.topics)
      ? parsed.topics.filter((t): t is string => typeof t === "string" && t.trim().length > 0).slice(0, 6)
      : [];

    const retrievalQuestions = Array.isArray(parsed.retrievalQuestions)
      ? (parsed.retrievalQuestions as RawQuestion[])
          .filter((q) => q && typeof q.prompt === "string")
          .slice(0, 8)
          .map((q) => ({
            prompt: asString(q.prompt),
            answer: asString(q.answer),
            topic: asString(q.topic, topics[0] || "General"),
            difficulty:
              q.difficulty === "easy" || q.difficulty === "hard" ? q.difficulty : "medium",
          }))
      : [];

    const gaps = Array.isArray(parsed.gaps)
      ? (parsed.gaps as RawGap[])
          .filter((g) => g && typeof g.what === "string")
          .slice(0, 5)
          .map((g) => ({ what: asString(g.what), why: asString(g.why) }))
      : [];

    return NextResponse.json({
      title: asString(parsed.title, "Captured notes"),
      transcription: asString(parsed.transcription),
      summary: asString(parsed.summary),
      topics,
      retrievalQuestions,
      gaps,
      unreadable: Array.isArray(parsed.unreadable)
        ? parsed.unreadable.filter((u): u is string => typeof u === "string").slice(0, 5)
        : [],
      pages: files.length,
      modelUsed: model,
    });
  } catch (error: unknown) {
    console.error("Vision notes route error:", error);
    const status = statusOf(error);
    return NextResponse.json(
      { error: messageOf(error, "Failed to read the notes.") },
      { status: status === 400 ? 400 : 500 }
    );
  }
}
