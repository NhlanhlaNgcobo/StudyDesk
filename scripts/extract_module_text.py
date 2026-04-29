from __future__ import annotations

import json
import sys
from pathlib import Path

from docx import Document
from pypdf import PdfReader


def extract_txt(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="ignore")


def extract_docx(path: Path) -> str:
    document = Document(path)
    paragraphs = [paragraph.text.strip() for paragraph in document.paragraphs if paragraph.text.strip()]
    return "\n".join(paragraphs)


def extract_pdf(path: Path) -> str:
    reader = PdfReader(str(path))
    pages = []
    for page in reader.pages:
        pages.append((page.extract_text() or "").strip())
    return "\n".join(filter(None, pages))


def main() -> int:
    if len(sys.argv) < 3:
        print(json.dumps({"status": "failed", "error": "Missing file path or mime type"}))
        return 1

    file_path = Path(sys.argv[1])
    mime_type = sys.argv[2]

    try:
        if mime_type == "text/plain":
            text = extract_txt(file_path)
        elif mime_type in {
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/msword",
        }:
            text = extract_docx(file_path)
        elif mime_type == "application/pdf":
            text = extract_pdf(file_path)
        else:
            print(json.dumps({"status": "unsupported", "text": "", "error": f"Unsupported type: {mime_type}"}))
            return 0

        cleaned = " ".join(text.split())
        if len(cleaned) < 40:
            print(
                json.dumps(
                    {
                        "status": "unsupported",
                        "text": "",
                        "error": "This file did not expose enough readable text for reliable AI generation.",
                    }
                )
            )
            return 0

        print(json.dumps({"status": "ready", "text": text}))
        return 0
    except Exception as error:  # noqa: BLE001
        print(json.dumps({"status": "failed", "text": "", "error": str(error)}))
        return 0


if __name__ == "__main__":
    raise SystemExit(main())
