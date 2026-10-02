import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import {
  selectModel,
  buildSystemPrompt,
  modelLabel,
  FALLBACK_MODEL,
  ClaudeOptions,
  ChatMessage,
} from "@/lib/claude";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isModelUnavailable(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const maybeError = error as {
    status?: number;
    error?: { error?: { type?: string } };
    type?: string;
  };

  return (
    maybeError.status === 404 ||
    maybeError.type === "not_found_error" ||
    maybeError.error?.error?.type === "not_found_error"
  );
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey || apiKey === "your_anthropic_api_key_here") {
      return NextResponse.json(
        {
          message:
            "Anthropic API key not configured. Add your ANTHROPIC_API_KEY to .env.local and restart the server.",
        },
        { status: 503 }
      );
    }

    const body = await req.json();
    const {
      messages,
      options,
    }: { messages: ChatMessage[]; options: ClaudeOptions } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { message: "Invalid messages format" },
        { status: 400 }
      );
    }

    const resolvedOptions: ClaudeOptions = { mode: "learn", ...(options || {}) };

    const client = new Anthropic({ apiKey });
    const preferredModel = selectModel(resolvedOptions);
    const systemPrompt = buildSystemPrompt(resolvedOptions);

    // In learn mode the tutor is meant to be short. Capping output is both a
    // pedagogical lever and a data-cost lever for students on mobile data.
    const maxTokens =
      resolvedOptions.maxTokens ??
      (resolvedOptions.lowData ? 512 : resolvedOptions.mode === "learn" ? 1024 : 2048);

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const streamWithModel = (model: string) =>
          client.messages.stream({
            model,
            max_tokens: maxTokens,
            system: systemPrompt,
            messages: messages.map((m) => ({ role: m.role, content: m.content })),
          });

        try {
          let modelUsed = preferredModel;
          let anthropicStream;

          try {
            anthropicStream = streamWithModel(modelUsed);
          } catch (error) {
            if (modelUsed !== FALLBACK_MODEL && isModelUnavailable(error)) {
              modelUsed = FALLBACK_MODEL;
              anthropicStream = streamWithModel(modelUsed);
            } else {
              throw error;
            }
          }

          for await (const event of anthropicStream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              const chunk = JSON.stringify({ delta: event.delta.text });
              controller.enqueue(encoder.encode(`data: ${chunk}\n\n`));
            }
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err: unknown) {
          console.error("Stream error:", err);
          const errChunk = JSON.stringify({
            error: err instanceof Error ? err.message : "Stream failed",
          });
          controller.enqueue(encoder.encode(`data: ${errChunk}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Model-Used": preferredModel,
        "X-Model-Label": modelLabel(resolvedOptions),
        "X-Tutor-Mode": resolvedOptions.mode || "learn",
      },
    });
  } catch (error: unknown) {
    console.error("Chat route error:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
