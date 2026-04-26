import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ── Configure Cloudinary (server-side only) ──────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * GET /api/upload/sign
 *
 * Generates a one-time Cloudinary upload signature.
 * The client uses this to upload files directly to Cloudinary
 * without our server ever handling the file bytes.
 *
 * Query params (optional):
 *   ?folder=studydesk/modules   — target folder in Cloudinary
 *
 * Returns: { signature, timestamp, cloudName, apiKey, folder }
 */
export async function GET(req: Request) {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json(
        {
          error:
            "Cloudinary credentials not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to .env.local.",
        },
        { status: 503 }
      );
    }

    // Allow the client to specify a target folder
    const { searchParams } = new URL(req.url);
    const folder = searchParams.get("folder") || "studydesk/uploads";

    const timestamp = Math.round(Date.now() / 1000);

    // Generate the signature using the Cloudinary SDK
    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder },
      apiSecret
    );

    return NextResponse.json({
      signature,
      timestamp,
      cloudName,
      apiKey,
      folder,
    });
  } catch (error: any) {
    console.error("Upload sign error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate upload signature" },
      { status: 500 }
    );
  }
}
