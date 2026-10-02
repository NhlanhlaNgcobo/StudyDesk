"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Camera,
  Upload,
  X,
  Loader2,
  AlertTriangle,
  Check,
  Sparkles,
  Eye,
  EyeOff,
  FileText,
  CircleHelp,
  Plus,
  RotateCcw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { cn, errorMessage, errorName } from "@/lib/utils";
import { createTypedNote, addAssessment, type AssessmentBlueprint } from "@/lib/module-knowledge";
import { registerSkills } from "@/lib/learner-model";
import { LANGUAGES, type ExplanationLanguage } from "@/lib/claude";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CapturedPage {
  id: string;
  /** Downscaled JPEG, ready to upload. */
  blob: Blob;
  previewUrl: string;
  originalBytes: number;
  bytes: number;
}

interface RetrievalQuestion {
  prompt: string;
  answer: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
}

interface NoteAnalysis {
  title: string;
  transcription: string;
  summary: string;
  topics: string[];
  retrievalQuestions: RetrievalQuestion[];
  gaps: { what: string; why: string }[];
  unreadable: string[];
  pages: number;
}

const MAX_PAGES = 5;

// ---------------------------------------------------------------------------
// Client-side downscaling
// ---------------------------------------------------------------------------

/**
 * A modern phone camera produces 3-6MB per photo. At roughly R20/GB, uploading
 * five raw pages costs a student real money, and most of those pixels carry no
 * extra legibility for handwriting. We downscale to 1600px on the long edge and
 * re-encode as JPEG before anything leaves the device, which typically takes a
 * 4MB photo to under 400KB with no loss of readability.
 */
async function downscale(file: File, maxEdge = 1600, quality = 0.82): Promise<Blob> {
  const bitmap = await loadBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) return file;

  ctx.drawImage(bitmap as CanvasImageSource, 0, 0, width, height);
  if ("close" in bitmap && typeof bitmap.close === "function") bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((result) => resolve(result), "image/jpeg", quality)
  );

  // If re-encoding somehow made it bigger, keep the original.
  return blob && blob.size < file.size ? blob : file;
}

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch {
      // Fall through to the <img> path (older Safari, odd EXIF).
    }
  }

  const url = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Could not read that image."));
      img.src = url;
    });
  } finally {
    // Revoked after decode; the canvas already holds the pixels.
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

// ---------------------------------------------------------------------------
// Live camera
// ---------------------------------------------------------------------------

function CameraSheet({
  onCapture,
  onClose,
}: {
  onCapture: (file: File) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("This browser cannot open the camera. Use 'Upload a photo' instead.");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 } },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
        setReady(true);
      } catch (err: unknown) {
        setError(
          errorName(err) === "NotAllowedError"
            ? "Camera permission was declined. You can still upload a photo from your gallery."
            : "Could not start the camera. Use 'Upload a photo' instead."
        );
      }
    }

    start();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, []);

  const shoot = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        onCapture(new File([blob], `page-${Date.now()}.jpg`, { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.92
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-slate-950 flex flex-col"
    >
      <div className="flex items-center justify-between p-4 text-white">
        <p className="text-[10px] font-black uppercase tracking-widest">Photograph your notes</p>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full" aria-label="Close camera">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {error ? (
          <div className="max-w-sm text-center p-6">
            <AlertTriangle className="mx-auto mb-3 text-amber-400" size={28} />
            <p className="text-white font-semibold text-sm">{error}</p>
          </div>
        ) : (
          <>
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video ref={videoRef} playsInline muted className="max-h-full max-w-full object-contain" />
            <div className="pointer-events-none absolute inset-6 border-2 border-white/30 rounded-xl" />
          </>
        )}
      </div>

      <div className="p-6 flex items-center justify-center">
        <button
          onClick={shoot}
          disabled={!ready || !!error}
          className="w-[72px] h-[72px] rounded-full bg-white disabled:opacity-30 flex items-center justify-center active:scale-95 transition-transform"
          aria-label="Take photo"
        >
          <span className="w-16 h-16 rounded-full border-4 border-slate-900" />
        </button>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function NoteCapture({
  moduleId,
  moduleName = "",
  userTier = "free",
  onSaved,
}: {
  moduleId: string;
  moduleName?: string;
  userTier?: "free" | "basic" | "premium" | "elite";
  onSaved?: (noteId: string) => void;
}) {
  const [pages, setPages] = useState<CapturedPage[]>([]);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<NoteAnalysis | null>(null);
  const [language, setLanguage] = useState<ExplanationLanguage>("en");
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  const [showTranscript, setShowTranscript] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Release object URLs when pages are dropped or the component unmounts.
  useEffect(() => {
    return () => {
      pages.forEach((page) => URL.revokeObjectURL(page.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addFiles = useCallback(
    async (incoming: File[]) => {
      setError(null);
      const room = MAX_PAGES - pages.length;

      if (room <= 0) {
        setError(`You can send ${MAX_PAGES} pages at a time.`);
        return;
      }

      const accepted = incoming.filter((file) => file.type.startsWith("image/")).slice(0, room);
      if (accepted.length === 0) {
        setError("Those files are not images. Photograph the page, or upload a JPEG or PNG.");
        return;
      }

      setBusy(true);
      try {
        const next: CapturedPage[] = [];
        for (const file of accepted) {
          const blob = await downscale(file);
          next.push({
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            blob,
            previewUrl: URL.createObjectURL(blob),
            originalBytes: file.size,
            bytes: blob.size,
          });
        }
        setPages((prev) => [...prev, ...next]);
      } catch (err: unknown) {
        setError(errorMessage(err, "Could not read that image."));
      } finally {
        setBusy(false);
      }
    },
    [pages.length]
  );

  const removePage = (id: string) => {
    setPages((prev) => {
      const target = prev.find((page) => page.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((page) => page.id !== id);
    });
  };

  const reset = () => {
    pages.forEach((page) => URL.revokeObjectURL(page.previewUrl));
    setPages([]);
    setAnalysis(null);
    setRevealed({});
    setShowTranscript(false);
    setSaved(false);
    setError(null);
  };

  const analyse = async () => {
    if (pages.length === 0 || busy) return;

    setBusy(true);
    setError(null);

    try {
      const form = new FormData();
      pages.forEach((page, index) => {
        form.append("images", page.blob, `page-${index + 1}.jpg`);
      });
      form.append("moduleName", moduleName);
      form.append("userTier", userTier);
      form.append("language", language);

      const response = await fetch("/api/vision/notes", { method: "POST", body: form });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Could not read the notes.");
      }

      setAnalysis(payload as NoteAnalysis);
      setRevealed({});
    } catch (err: unknown) {
      setError(errorMessage(err, "Could not read the notes."));
    } finally {
      setBusy(false);
    }
  };

  const save = () => {
    if (!analysis) return;

    const body = [
      analysis.summary ? `_${analysis.summary}_` : "",
      analysis.transcription,
      analysis.gaps.length > 0
        ? `\n\n## Gaps to close\n\n${analysis.gaps.map((g) => `- **${g.what}** - ${g.why}`).join("\n")}`
        : "",
      analysis.unreadable.length > 0
        ? `\n\n## Could not be read\n\n${analysis.unreadable.map((u) => `- ${u}`).join("\n")}`
        : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    const { note } = createTypedNote(moduleId, analysis.title, body, "imported_excerpt");

    // Register the skills so they appear in the learner model immediately,
    // even before the student answers anything on them.
    registerSkills(moduleId, analysis.topics);

    // Turn the notes into retrieval practice. This is the whole reason the
    // photo is worth taking: rereading is low-utility, practice testing is not.
    if (analysis.retrievalQuestions.length > 0) {
      const blueprint: AssessmentBlueprint = {
        id: `capture-${Date.now()}`,
        moduleId,
        title: `Recall: ${analysis.title}`,
        mode: "quiz",
        difficulty: "Adaptive",
        status: "Not Started",
        questionTypes: ["short_form"],
        sourceIds: note.sourceIds,
        sourceSummary: [analysis.title],
        timeLimitMinutes: Math.max(5, analysis.retrievalQuestions.length * 2),
        totalMarks: analysis.retrievalQuestions.length * 3,
        bestScore: null,
        latestScore: null,
        attempts: 0,
        createdAt: new Date().toISOString(),
        questions: analysis.retrievalQuestions.map((question, index) => ({
          id: `capture-${Date.now()}-q${index}`,
          type: "short_form",
          prompt: question.prompt,
          topic: question.topic,
          marks: 3,
          correctAnswer: question.answer,
          sampleAnswer: question.answer,
          explanation: `From your own notes: ${analysis.title}.`,
          rubricCriteria: ["Recalls the key idea", "Uses correct terminology"],
        })),
      };

      addAssessment(blueprint);
    }

    setSaved(true);
    onSaved?.(note.id);
  };

  const savedBytes = pages.reduce((sum, page) => sum + (page.originalBytes - page.bytes), 0);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h3 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Camera size={20} className="text-primary" />
              Capture handwritten notes
            </h3>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-1 max-w-xl">
              Photograph your notes. StudyDesk transcribes them, tags the skills, and turns them
              into recall questions - because rereading notes is one of the weakest ways to study,
              and being tested on them is one of the strongest.
            </p>
          </div>

          <label className="shrink-0">
            <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
              Explain in
            </span>
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value as ExplanationLanguage)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20"
            >
              {(Object.keys(LANGUAGES) as ExplanationLanguage[]).map((code) => (
                <option key={code} value={code}>
                  {LANGUAGES[code]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Capture controls */}
        {!analysis && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => setCameraOpen(true)}
                disabled={pages.length >= MAX_PAGES}
                className="flex items-center justify-center gap-3 py-4 bg-primary text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20 hover:-translate-y-0.5 active:scale-[0.98] transition-all disabled:opacity-40 disabled:translate-y-0"
              >
                <Camera size={18} />
                Take a photo
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={pages.length >= MAX_PAGES}
                className="flex items-center justify-center gap-3 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl font-black uppercase tracking-widest text-xs hover:border-primary/30 transition-all disabled:opacity-40"
              >
                <Upload size={18} />
                Upload a photo
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              className="hidden"
              onChange={(event) => {
                const files = Array.from(event.target.files || []);
                if (files.length > 0) addFiles(files);
                event.target.value = "";
              }}
            />

            {pages.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {pages.length} of {MAX_PAGES} pages
                  </p>
                  {savedBytes > 0 && (
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">
                      Compressed · {formatBytes(savedBytes)} of data saved
                    </p>
                  )}
                </div>

                <div className="flex gap-3 overflow-x-auto pb-2">
                  {pages.map((page, index) => (
                    <div key={page.id} className="relative shrink-0 group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={page.previewUrl}
                        alt={`Captured page ${index + 1}`}
                        className="w-24 h-32 object-cover rounded-lg border-2 border-slate-100 dark:border-slate-700"
                      />
                      <button
                        onClick={() => removePage(page.id)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md"
                        aria-label={`Remove page ${index + 1}`}
                      >
                        <X size={13} />
                      </button>
                      <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-slate-900/70 text-white text-[9px] font-black rounded">
                        {formatBytes(page.bytes)}
                      </span>
                    </div>
                  ))}

                  {pages.length < MAX_PAGES && (
                    <button
                      onClick={() => setCameraOpen(true)}
                      className="shrink-0 w-24 h-32 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center gap-1 text-slate-400 hover:border-primary/40 hover:text-primary transition-colors"
                      aria-label="Add another page"
                    >
                      <Plus size={20} />
                      <span className="text-[9px] font-black uppercase tracking-widest">Page</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {pages.length > 0 && (
              <button
                onClick={analyse}
                disabled={busy}
                className="w-full py-4 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:opacity-90 disabled:opacity-50 transition-all"
              >
                {busy ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Reading your handwriting...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    Turn into study material
                  </>
                )}
              </button>
            )}
          </>
        )}

        {error && (
          <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-xl">
            <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm font-semibold text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Results */}
        {analysis && (
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  {analysis.title}
                </h4>
                {analysis.summary && (
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-1">
                    {analysis.summary}
                  </p>
                )}
              </div>
              <button
                onClick={reset}
                className="shrink-0 flex items-center gap-2 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-primary transition-colors"
              >
                <RotateCcw size={14} />
                Start over
              </button>
            </div>

            {analysis.topics.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {analysis.topics.map((topic) => (
                  <span
                    key={topic}
                    className="px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-widest"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            )}

            {/* Retrieval questions - the point of the whole feature */}
            {analysis.retrievalQuestions.length > 0 && (
              <div className="rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 flex items-center gap-2">
                  <CircleHelp size={16} className="text-primary" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    {analysis.retrievalQuestions.length} recall questions from your own notes
                  </p>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {analysis.retrievalQuestions.map((question, index) => (
                    <div key={index} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-bold text-sm text-slate-900 dark:text-white flex-1">
                          {question.prompt}
                        </p>
                        <span
                          className={cn(
                            "shrink-0 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest",
                            question.difficulty === "hard"
                              ? "bg-red-50 text-red-500 dark:bg-red-900/20"
                              : question.difficulty === "medium"
                                ? "bg-amber-50 text-amber-600 dark:bg-amber-900/20"
                                : "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20"
                          )}
                        >
                          {question.difficulty}
                        </span>
                      </div>

                      <button
                        onClick={() =>
                          setRevealed((prev) => ({ ...prev, [index]: !prev[index] }))
                        }
                        className="mt-2 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors"
                      >
                        {revealed[index] ? <EyeOff size={13} /> : <Eye size={13} />}
                        {revealed[index] ? "Hide answer" : "Try it first, then reveal"}
                      </button>

                      {revealed[index] && (
                        <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                            {question.answer}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Gaps */}
            {analysis.gaps.length > 0 && (
              <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-xl">
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-400 mb-2">
                  Gaps in these notes
                </p>
                <ul className="space-y-2">
                  {analysis.gaps.map((gap, index) => (
                    <li key={index} className="text-sm font-medium text-amber-900 dark:text-amber-200">
                      <span className="font-black">{gap.what}</span>
                      {gap.why ? ` - ${gap.why}` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Honest about what it could not read */}
            {analysis.unreadable.length > 0 && (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                  Could not be read - check these yourself
                </p>
                <ul className="space-y-1">
                  {analysis.unreadable.map((item, index) => (
                    <li key={index} className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Transcription */}
            {analysis.transcription && (
              <div className="rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                <button
                  onClick={() => setShowTranscript((value) => !value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between"
                >
                  <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <FileText size={16} />
                    Transcription
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                    {showTranscript ? "Hide" : "Show"}
                  </span>
                </button>
                {showTranscript && (
                  <div className="p-4 prose prose-sm dark:prose-invert max-w-none overflow-x-auto">
                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                      {analysis.transcription}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={save}
              disabled={saved}
              className={cn(
                "w-full py-4 rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all",
                saved
                  ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600"
                  : "bg-primary text-white shadow-lg shadow-primary/20 hover:-translate-y-0.5"
              )}
            >
              {saved ? (
                <>
                  <Check size={18} />
                  Saved to your notes and practice queue
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Save notes + {analysis.retrievalQuestions.length} question practice set
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {cameraOpen && (
          <CameraSheet
            onClose={() => setCameraOpen(false)}
            onCapture={(file) => {
              setCameraOpen(false);
              addFiles([file]);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
