import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { selectModel } from "@/lib/claude";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Anthropic API key not configured." }, { status: 503 });
  }

  const { topic, subject, numQuestions = 5, difficulty = "Medium", moduleContext, userTier = "free" } = await req.json();

  if (!topic) {
    return NextResponse.json({ error: "topic is required" }, { status: 400 });
  }

  const client = new Anthropic({ apiKey });
  const model = selectModel({ userTier, subject });

  const systemPrompt = `You are StudyDesk AI Tutor — a world-class exam question generator for South African university students.
You MUST respond with ONLY a valid JSON array. No preamble, no explanation, no markdown fences. Pure JSON only.`;

  const userPrompt = `Generate exactly ${numQuestions} multiple-choice questions about: "${topic}"
Subject area: ${subject || "General"}
Difficulty: ${difficulty}
${moduleContext ? `Module context: ${moduleContext}` : ""}

Return a JSON array of objects, each with this exact shape:
{
  "id": "q1",
  "text": "Question text here (use $ for inline LaTeX like $x^2$)",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctIndex": 0,
  "explanation": "Why this answer is correct",
  "topic": "Sub-topic label"
}

Rules:
- correctIndex must be 0, 1, 2, or 3
- All 4 options must be plausible
- Explanations must be academically rigorous
- Use LaTeX notation for math ($formula$)
- Return ONLY the JSON array, nothing else`;

  try {
    const response = await client.messages.create({
      model,
      max_tokens: 4096,
      messages: [{ role: "user", content: userPrompt }],
      system: systemPrompt,
    });

    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Claude");
    }

    // Strip any accidental markdown fences
    const raw = content.text.trim().replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
    const questions = JSON.parse(raw);

    if (!Array.isArray(questions)) throw new Error("Claude did not return an array");

    return NextResponse.json({ questions, topic, subject, difficulty });
  } catch (e: any) {
    console.error("Quiz generation error:", e);
    return NextResponse.json({ error: e.message || "Failed to generate quiz" }, { status: 500 });
  }
}

