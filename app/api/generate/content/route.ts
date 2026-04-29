import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { selectModel } from "@/lib/claude";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cleanJson(text: string) {
  return text.trim().replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
}

function buildSourceContext(sourceSummary: string[], sourceText: string) {
  return [
    sourceSummary.length > 0 ? `Selected sources: ${sourceSummary.join(", ")}` : "",
    "Use only the supplied module material as the basis for your output.",
    sourceText,
  ]
    .filter(Boolean)
    .join("\n\n");
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Anthropic API key not configured." }, { status: 503 });
  }

  const {
    moduleTitle,
    sourceSummary = [],
    sourceText,
    mode = "notes",
    title,
    questionCount = 10,
    userTier = "free",
    subject,
  } = await req.json();

  if (!sourceText || typeof sourceText !== "string" || sourceText.trim().length < 80) {
    return NextResponse.json(
      { error: "Source material is required to generate knowledge assets." },
      { status: 400 }
    );
  }

  const client = new Anthropic({ apiKey });
  const model = selectModel({ userTier, subject });
  const sourceContext = buildSourceContext(sourceSummary, sourceText);

  const prompts = {
    notes: `Create structured study notes for module "${moduleTitle}".
Title: "${title || `Study notes for ${moduleTitle}`}"

Rules:
- Use markdown headings and subheadings
- Keep the output grounded in the provided material
- End with a short revision summary
- Include definitions, core ideas, and likely exam angles

Module material:
${sourceContext}`,
    flashcards: `Generate exactly ${questionCount} flashcards grounded in the provided module material.

Return only valid JSON:
{
  "title": "Deck title",
  "cards": [
    { "front": "Prompt", "back": "Answer" }
  ]
}

Module title: ${moduleTitle}
Module material:
${sourceContext}`,
  } as const;

  try {
    if (mode === "notes") {
      const response = await client.messages.create({
        model,
        max_tokens: 4096,
        system:
          "You are StudyDesk AI. Produce academically rigorous study notes in markdown. Do not mention content that is not supported by the supplied material.",
        messages: [{ role: "user", content: prompts.notes }],
      });

      const content = response.content[0];
      if (content.type !== "text") throw new Error("Unexpected response type from Claude");

      return NextResponse.json({
        mode,
        title: title || `Study notes for ${moduleTitle}`,
        content: content.text.trim(),
      });
    }

    const response = await client.messages.create({
      model,
      max_tokens: 4096,
      system:
        "You are StudyDesk AI. Return only valid JSON with no markdown fences or extra commentary.",
      messages: [{ role: "user", content: prompts.flashcards }],
    });

    const content = response.content[0];
    if (content.type !== "text") throw new Error("Unexpected response type from Claude");

    const parsed = JSON.parse(cleanJson(content.text));
    return NextResponse.json({
      mode,
      title: parsed.title || `Flashcards for ${moduleTitle}`,
      cards: parsed.cards || [],
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Generation failed." },
      { status: 500 }
    );
  }
}
