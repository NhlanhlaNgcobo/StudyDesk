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

  const { topic, subject, moduleContext, type = "notes", userTier = "free" } = await req.json();

  if (!topic) {
    return NextResponse.json({ error: "topic is required" }, { status: 400 });
  }

  const client = new Anthropic({ apiKey });

  const prompts: Record<string, string> = {
    notes: `Generate comprehensive, well-structured study notes on: "${topic}"
Subject: ${subject || "General"}
${moduleContext ? `Module context: ${moduleContext}` : ""}

Format the notes using:
- Clear headings (##, ###)  
- Bullet points for key facts
- **Bold** for key terms
- LaTeX for formulas ($ inline, $$ display)
- Summary at the end
Make it exam-focused and academically rigorous.`,

    flashcards: `Generate exactly 10 flashcards for: "${topic}"
Subject: ${subject || "General"}

Return ONLY a JSON array, no markdown fences:
[{"front": "Question or term", "back": "Answer or definition"}]

Make each card exam-focused and concise.`,

    exam: `Create a full mock exam for: "${topic}"
Subject: ${subject || "General"}
${moduleContext ? `Module context: ${moduleContext}` : ""}

Return ONLY a JSON array of 15 multiple-choice questions, no markdown fences:
[{
  "id": "q1",
  "text": "Question",
  "options": ["A", "B", "C", "D"],
  "correctIndex": 0,
  "explanation": "Explanation",
  "topic": "Sub-topic",
  "marks": 2
}]`,
  };

  const systemPrompt = type === "notes"
    ? "You are a world-class academic tutor for South African university students. Generate clear, exam-focused study notes in Markdown."
    : "You are StudyDesk AI. Respond with ONLY valid JSON, no markdown, no preamble.";

  const model = selectModel({ userTier, subject });

  const encoder = new TextEncoder();

  if (type === "notes") {
    // Stream notes
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const anthropicStream = await client.messages.stream({
            model,
            max_tokens: 4096,
            system: systemPrompt,
            messages: [{ role: "user", content: prompts.notes }],
          });

          for await (const event of anthropicStream) {
            if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta: event.delta.text })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (e: any) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: e.message })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Model-Used": model,
      },
    });
  }

  // Non-streaming: flashcards or exam
  try {
    const response = await client.messages.create({
      model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: prompts[type] || prompts.flashcards }],
    });


    const content = response.content[0];
    if (content.type !== "text") throw new Error("Bad response from Claude");

    const raw = content.text.trim().replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
    const data = JSON.parse(raw);
    return NextResponse.json({ data, type, topic });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Generation failed" }, { status: 500 });
  }
}
