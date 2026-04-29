import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { selectModel } from "@/lib/claude";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cleanJson(text: string) {
  return text.trim().replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Anthropic API key not configured." }, { status: 503 });
  }

  const {
    moduleId,
    moduleTitle,
    mode = "quiz",
    sourceSummary = [],
    sourceText,
    questionTypes = ["multiple_choice"],
    questionCount = 8,
    difficulty = "Medium",
    timeLimitMinutes = 20,
    userTier = "free",
    subject,
  } = await req.json();

  if (!moduleId || !moduleTitle || !sourceText || sourceText.trim().length < 80) {
    return NextResponse.json(
      { error: "moduleId, moduleTitle, and sourceText are required." },
      { status: 400 }
    );
  }

  const client = new Anthropic({ apiKey });
  const model = selectModel({ userTier, subject });
  const chosenTypes = Array.isArray(questionTypes) && questionTypes.length > 0
    ? questionTypes
    : ["multiple_choice"];

  const prompt = `Build a ${mode} grounded strictly in the provided module material.

Module id: ${moduleId}
Module title: ${moduleTitle}
Difficulty: ${difficulty}
Question count: ${questionCount}
Time limit: ${timeLimitMinutes} minutes
Question types: ${chosenTypes.join(", ")}
Selected sources: ${sourceSummary.join(", ") || "All selected module materials"}

Return only valid JSON with this exact shape:
{
  "title": "Assessment title",
  "questions": [
    {
      "id": "q1",
      "type": "multiple_choice | short_form | written | long_form",
      "prompt": "Question text",
      "topic": "Topic label",
      "marks": 4,
      "options": ["A", "B", "C", "D"],
      "correctIndex": 0,
      "correctAnswer": "Correct answer or marking target",
      "sampleAnswer": "Model answer",
      "explanation": "Why the answer is correct",
      "rubricCriteria": ["criterion 1", "criterion 2"]
    }
  ]
}

Rules:
- Multiple choice questions must include exactly 4 plausible options
- Short form, written, and long form questions must include correctAnswer, sampleAnswer, explanation, and rubricCriteria
- Mix question types intentionally if more than one type is requested
- Keep all questions faithful to the provided material
- Do not output markdown fences

Module material:
${sourceText}`;

  try {
    const response = await client.messages.create({
      model,
      max_tokens: 4096,
      system:
        "You are StudyDesk AI. Return only valid JSON for source-grounded assessments. Never add extra commentary.",
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Claude");
    }

    const parsed = JSON.parse(cleanJson(content.text));
    return NextResponse.json({
      moduleId,
      title: parsed.title || `${moduleTitle} ${mode === "exam" ? "Mock Exam" : "Practice Quiz"}`,
      questions: parsed.questions || [],
      questionTypes: chosenTypes,
      difficulty,
      timeLimitMinutes,
      mode,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to generate assessment." },
      { status: 500 }
    );
  }
}
