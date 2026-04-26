import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { selectModel, buildSystemPrompt, ClaudeOptions, ChatMessage } from "@/lib/claude";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

    const client = new Anthropic({ apiKey });
    const model = selectModel(options || {});
    const systemPrompt = buildSystemPrompt(options || {});

    // Stream using the official SDK
    // Stream using the official SDK
    const encoder = new TextEncoder();

    // Helper to start the stream
    const startStream = async (controller: ReadableStreamDefaultController, currentModel: string) => {
      try {
        console.log("Starting Anthropic stream with model:", currentModel);
        const anthropicStream = await client.messages.stream({
          model: currentModel,
          max_tokens: options?.maxTokens || 2048,
          system: systemPrompt,
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        });

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
      } catch (err: any) {
        // If the primary model failed and it's a 404, try falling back to Haiku 4.5
        if (currentModel !== "claude-haiku-4-5-20251001" && err.status === 404) {
          console.warn(`Model ${currentModel} not found, falling back to Haiku 4.5...`);
          await startStream(controller, "claude-haiku-4-5-20251001");
        } else {
          console.error("Stream error caught in ReadableStream:", err);
          const errChunk = JSON.stringify({
            error: err.message || "Stream failed",
          });
          controller.enqueue(encoder.encode(`data: ${errChunk}\n\n`));
          controller.close();
        }
      }
    };

    const stream = new ReadableStream({
      async start(controller) {
        await startStream(controller, model);
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
  } catch (error: any) {
    console.error("Chat route error:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
