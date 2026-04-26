import { NextResponse } from "next/server";
import pdfParse from "pdf-parse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/extract
 *
 * Accepts a JSON body with `fileUrl` (a Cloudinary secure_url pointing to a PDF).
 * Fetches the remote file, extracts raw text via pdf-parse, and returns it.
 *
 * Request body:  { fileUrl: string }
 * Response body: { text: string }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fileUrl } = body;

    if (!fileUrl || typeof fileUrl !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid `fileUrl` in request body." },
        { status: 400 }
      );
    }

    // ── 1. Fetch the remote PDF as binary ────────────────────
    const fileRes = await fetch(fileUrl);

    if (!fileRes.ok) {
      return NextResponse.json(
        {
          error: `Failed to fetch file from URL. Status: ${fileRes.status} ${fileRes.statusText}`,
        },
        { status: 502 }
      );
    }

    const arrayBuffer = await fileRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length === 0) {
      return NextResponse.json(
        { error: "Fetched file is empty (0 bytes)." },
        { status: 422 }
      );
    }

    // ── 2. Parse PDF text ────────────────────────────────────
    const parsed = await pdfParse(buffer);
    const extractedText = parsed.text;

    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json(
        {
          error:
            "PDF parsed successfully but contains no extractable text. The file may be image-based or scanned.",
        },
        { status: 422 }
      );
    }

    // ── 3. Return extracted text ─────────────────────────────
    return NextResponse.json({ text: extractedText });
  } catch (error: any) {
    console.error("PDF extraction error:", error);

    // Distinguish pdf-parse failures from general errors
    const isPdfError =
      error.message?.includes("Invalid") ||
      error.message?.includes("pdf") ||
      error.message?.includes("PDF");

    return NextResponse.json(
      {
        error: isPdfError
          ? "The file could not be parsed as a valid PDF document."
          : error.message || "An unexpected error occurred during extraction.",
      },
      { status: isPdfError ? 422 : 500 }
    );
  }
}
