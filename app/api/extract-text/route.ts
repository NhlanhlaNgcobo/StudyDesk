import { writeFile, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUNDLED_PYTHON =
  "C:\\Users\\NhlanhlaNgcobo\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\python\\python.exe";
const SCRIPT_PATH = path.join(process.cwd(), "scripts", "extract_module_text.py");

function runExtractor(filePath: string, mimeType: string) {
  return new Promise<string>((resolve, reject) => {
    const child = spawn(BUNDLED_PYTHON, [SCRIPT_PATH, filePath, mimeType], {
      windowsHide: true,
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0 && !stdout) {
        reject(new Error(stderr || `Extractor exited with code ${code}`));
        return;
      }
      resolve(stdout);
    });
  });
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file received." }, { status: 400 });
  }

  const extension = path.extname(file.name) || ".bin";
  const tempFilePath = path.join(tmpdir(), `studydesk-${Date.now()}${extension}`);

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(tempFilePath, buffer);

    const raw = await runExtractor(tempFilePath, file.type || "application/octet-stream");
    const parsed = JSON.parse(raw || "{}");

    return NextResponse.json({
      status: parsed.status || "failed",
      text: parsed.text || "",
      error: parsed.error || null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: "failed", text: "", error: error.message || "Failed to extract text." },
      { status: 500 }
    );
  } finally {
    await unlink(tempFilePath).catch(() => undefined);
  }
}
