"use client";

import Link from "next/link";
import { type ReactNode, useMemo, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Brain,
  CalendarDays,
  FileText,
  Files,
  Loader2,
  Plus,
  Sparkles,
  Timer,
  Upload,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  addAssessment,
  addFlashcardDeck,
  addGeneratedNote,
  addUploadedSource,
  type AssessmentMode,
  type AssessmentQuestionType,
  createTypedNote,
  getModuleKnowledge,
  getSourceBundle,
  ModuleSourceFile,
  useKnowledgeStore,
} from "@/lib/module-knowledge";
import { cn } from "@/lib/utils";

const QUESTION_TYPE_OPTIONS = [
  { id: "multiple_choice", label: "Multiple choice" },
  { id: "short_form", label: "Short form" },
  { id: "written", label: "Written" },
  { id: "long_form", label: "Long form" },
] as const;

export default function ModuleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const workspace = pathname.startsWith("/tutor") ? "tutor" : "student";
  const moduleId = String(params.id);
  const moduleIndexHref = workspace === "tutor" ? "/tutor/materials" : "/student/modules";
  useKnowledgeStore();

  const { module, sources, notes, assessments, flashcards } = getModuleKnowledge(moduleId);
  const [showUpload, setShowUpload] = useState(false);
  const [showTypedNote, setShowTypedNote] = useState(false);
  const [showGenerate, setShowGenerate] = useState<"notes" | "flashcards" | "quiz" | "exam" | null>(null);
  const [uploading, setUploading] = useState(false);
  const [noteSaving, setNoteSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [typedTitle, setTypedTitle] = useState("");
  const [typedContent, setTypedContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [excerptText, setExcerptText] = useState("");
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const [assessmentTitle, setAssessmentTitle] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");
  const [questionCount, setQuestionCount] = useState(8);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(20);
  const [questionTypes, setQuestionTypes] = useState<AssessmentQuestionType[]>(["multiple_choice"]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const moduleSources = useMemo(
    () => sources.filter((source) => source.extractionStatus === "ready"),
    [sources]
  );

  const latestQuiz = assessments.find((item) => item.mode === "quiz");
  const latestExam = assessments.find((item) => item.mode === "exam");

  const toggleSource = (sourceId: string) => {
    setSelectedSourceIds((current) =>
      current.includes(sourceId)
        ? current.filter((item) => item !== sourceId)
        : [...current, sourceId]
    );
  };

  const handleUpload = async () => {
    if (!selectedFile && !excerptText.trim()) {
      setErrorMessage("Add a file or paste a book excerpt before saving.");
      return;
    }

    setUploading(true);
    setErrorMessage(null);

    try {
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        const response = await fetch("/api/extract-text", {
          method: "POST",
          body: formData,
        });
        const payload = await response.json();

        addUploadedSource(moduleId, {
          title: uploadTitle.trim() || selectedFile.name,
          fileName: selectedFile.name,
          mimeType: selectedFile.type || "application/octet-stream",
          size: selectedFile.size,
          sourceKind:
            selectedFile.type === "application/pdf"
              ? "pdf"
              : selectedFile.type.includes("word")
                ? "docx"
                : "txt",
          extractionStatus: payload.status || "failed",
          extractedText: payload.text || "",
          preview: (payload.text || payload.error || "File added to the module library.").slice(0, 180),
          sourceUrl: "",
        });
      }

      if (excerptText.trim()) {
        addUploadedSource(moduleId, {
          title: uploadTitle.trim() || "Book excerpt",
          fileName: "excerpt.txt",
          mimeType: "text/plain",
          size: excerptText.length,
          sourceKind: "book_excerpt",
          extractionStatus: "ready",
          extractedText: excerptText.trim(),
          preview: excerptText.trim().slice(0, 180),
        });
      }

      setShowUpload(false);
      setUploadTitle("");
      setSelectedFile(null);
      setExcerptText("");
    } catch (error: any) {
      setErrorMessage(error.message || "Failed to ingest source material.");
    } finally {
      setUploading(false);
    }
  };

  const handleTypedNote = async () => {
    if (!typedTitle.trim() || !typedContent.trim()) {
      setErrorMessage("Add a title and note content before saving.");
      return;
    }

    setNoteSaving(true);
    setErrorMessage(null);
    try {
      createTypedNote(moduleId, typedTitle.trim(), typedContent.trim());
      setTypedTitle("");
      setTypedContent("");
      setShowTypedNote(false);
    } finally {
      setNoteSaving(false);
    }
  };

  const handleGenerate = async () => {
    if (selectedSourceIds.length === 0) {
      setErrorMessage("Select at least one source or typed note before generating.");
      return;
    }

    setGenerating(true);
    setErrorMessage(null);

    try {
      const sourceBundle = getSourceBundle(moduleId, selectedSourceIds);
      const generationMode = showGenerate;

      if (generationMode === "notes" || generationMode === "flashcards") {
        const response = await fetch("/api/generate/content", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            moduleTitle: module.name,
            sourceSummary: sourceBundle.sourceSummary,
            sourceText: sourceBundle.combinedText,
            mode: generationMode,
            title: assessmentTitle.trim(),
            questionCount,
          }),
        });

        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Generation failed.");

        if (generationMode === "notes") {
          addGeneratedNote(
            moduleId,
            payload.title || `Generated notes for ${module.name}`,
            payload.content,
            selectedSourceIds
          );
          router.push(workspace === "tutor" ? "/tutor/materials" : "/student/notes");
        } else {
          addFlashcardDeck(
            moduleId,
            payload.title || `Flashcards for ${module.name}`,
            payload.cards || [],
            selectedSourceIds
          );
        }
      } else {
        const response = await fetch("/api/generate/quiz", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            moduleId,
            moduleTitle: module.name,
            mode: generationMode,
            sourceSummary: sourceBundle.sourceSummary,
            sourceText: sourceBundle.combinedText,
            questionTypes,
            questionCount,
            difficulty,
            timeLimitMinutes,
          }),
        });

        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Generation failed.");

        const questions = Array.isArray(payload.questions) ? payload.questions : [];
        const totalMarks = questions.reduce((sum: number, question: any) => sum + (question.marks || 0), 0);
        const assessmentMode = generationMode as AssessmentMode;
        const assessment = addAssessment({
          id: `assessment-${Date.now()}`,
          moduleId,
          title:
            payload.title ||
            assessmentTitle.trim() ||
            `${module.tags[0]} ${assessmentMode === "exam" ? "Mock Exam" : "Practice Quiz"}`,
          mode: assessmentMode,
          difficulty,
          status: "Not Started",
          questionTypes,
          questions,
          sourceIds: selectedSourceIds,
          sourceSummary: sourceBundle.sourceSummary,
          timeLimitMinutes,
          totalMarks,
          bestScore: null,
          latestScore: null,
          attempts: 0,
          createdAt: new Date().toISOString(),
        });

        router.push(workspace === "tutor" ? "/tutor/materials" : assessmentMode === "exam" ? `/student/exams/${assessment.id}` : `/student/quiz/${assessment.id}`);
      }

      setShowGenerate(null);
      setAssessmentTitle("");
      setSelectedSourceIds([]);
      setQuestionTypes(["multiple_choice"]);
    } catch (error: any) {
      setErrorMessage(error.message || "Failed to generate from module materials.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center gap-3 text-xs font-black uppercase tracking-[0.18em] text-text-secondary">
        <Link href={moduleIndexHref} className="inline-flex items-center gap-2 text-primary">
          <ArrowLeft size={14} />
          Back to modules
        </Link>
        <span>/</span>
        <span>{module.tags[0]}</span>
      </div>

      <section className="overflow-hidden rounded-[32px] border border-app bg-app-surface shadow-xl shadow-slate-900/5">
        <div className="h-3 w-full" style={{ backgroundColor: module.color }} />
        <div className="grid gap-8 p-8 lg:grid-cols-[1.2fr_0.8fr] lg:p-10">
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary">{module.subject}</p>
              <h1 className="text-4xl font-black tracking-tight md:text-5xl">{module.name}</h1>
              <p className="max-w-2xl text-base font-medium text-text-secondary">
                Store module materials here, turn them into notes and flashcards, and build timed quizzes or exams from the actual study content.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-4">
              <div className="rounded-[24px] bg-app-muted p-5">
                <div className="flex items-center gap-2 text-primary">
                  <Files size={16} />
                  <span className="text-xs font-black uppercase tracking-[0.16em]">Sources</span>
                </div>
                <p className="mt-3 text-3xl font-black">{sources.length}</p>
              </div>
              <div className="rounded-[24px] bg-app-muted p-5">
                <div className="flex items-center gap-2 text-primary">
                  <FileText size={16} />
                  <span className="text-xs font-black uppercase tracking-[0.16em]">Notes</span>
                </div>
                <p className="mt-3 text-3xl font-black">{notes.length}</p>
              </div>
              <div className="rounded-[24px] bg-app-muted p-5">
                <div className="flex items-center gap-2 text-primary">
                  <Brain size={16} />
                  <span className="text-xs font-black uppercase tracking-[0.16em]">Quizzes</span>
                </div>
                <p className="mt-3 text-3xl font-black">{assessments.filter((item) => item.mode === "quiz").length}</p>
              </div>
              <div className="rounded-[24px] bg-app-muted p-5">
                <div className="flex items-center gap-2 text-primary">
                  <Timer size={16} />
                  <span className="text-xs font-black uppercase tracking-[0.16em]">Exams</span>
                </div>
                <p className="mt-3 text-3xl font-black">{assessments.filter((item) => item.mode === "exam").length}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button onClick={() => setShowUpload(true)} className="inline-flex items-center gap-3 rounded-full bg-primary px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-white">
                <Upload size={16} />
                Add source material
              </button>
              <button onClick={() => setShowTypedNote(true)} className="inline-flex items-center gap-3 rounded-full border border-app bg-app-surface px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-primary">
                <FileText size={16} />
                New typed note
              </button>
              <button onClick={() => setShowGenerate("notes")} className="inline-flex items-center gap-3 rounded-full border border-app bg-app-surface px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-primary">
                <Sparkles size={16} />
                Generate notes
              </button>
              <button onClick={() => setShowGenerate("flashcards")} className="inline-flex items-center gap-3 rounded-full border border-app bg-app-surface px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-primary">
                <BookOpen size={16} />
                Generate flashcards
              </button>
              {workspace === "tutor" && (
                <Link href={`/tutor/calendar?new=1&type=deadline&module=${encodeURIComponent(module.tags[0])}`} className="inline-flex items-center gap-3 rounded-full border border-emerald-200 bg-emerald-50 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                  <CalendarDays size={16} />
                  Set deadline
                </Link>
              )}
            </div>
          </div>

          <div className="rounded-[28px] bg-slate-900 p-8 text-white shadow-2xl shadow-slate-900/20">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Assessment builder</p>
            <h2 className="mt-3 text-3xl font-black">Create source-grounded practice.</h2>
            <p className="mt-3 text-sm font-medium text-slate-300">
              Build mixed quizzes or timed exams from uploaded materials, typed notes, and book excerpts stored in this module.
            </p>

            <div className="mt-6 grid gap-3">
              <button
                onClick={() => setShowGenerate("quiz")}
                className="inline-flex items-center justify-center gap-3 rounded-full bg-primary px-6 py-4 text-xs font-black uppercase tracking-[0.18em] text-white"
              >
                <Brain size={16} />
                Build quiz
              </button>
              <button
                onClick={() => setShowGenerate("exam")}
                className="inline-flex items-center justify-center gap-3 rounded-full border border-white/10 px-6 py-4 text-xs font-black uppercase tracking-[0.18em] text-slate-200"
              >
                <Timer size={16} />
                Build exam
              </button>
            </div>

            <div className="mt-8 space-y-4 rounded-[22px] border border-white/10 bg-white/5 p-5">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Latest generated assets</p>
              <div className="space-y-3">
                <div>
                  <p className="font-black">Latest quiz</p>
                  <p className="text-sm text-slate-300">{latestQuiz?.title || "No generated quiz yet"}</p>
                </div>
                <div>
                  <p className="font-black">Latest exam</p>
                  <p className="text-sm text-slate-300">{latestExam?.title || "No generated exam yet"}</p>
                </div>
                <div>
                  <p className="font-black">Flashcard decks</p>
                  <p className="text-sm text-slate-300">{flashcards.length} deck{flashcards.length === 1 ? "" : "s"} ready</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {errorMessage && (
        <div className="rounded-[22px] border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-600">
          {errorMessage}
        </div>
      )}

      <section className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-[28px] border border-app bg-app-surface p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-black">Module source library</h2>
            <span className="rounded-full bg-app-muted px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-text-secondary">
              {sources.length} stored
            </span>
          </div>
          <div className="grid gap-4">
            {sources.map((source) => (
              <div key={source.id} className="rounded-[22px] bg-app-muted p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">{source.sourceKind.replace("_", " ")}</p>
                    <h3 className="mt-2 text-xl font-black">{source.title}</h3>
                    <p className="mt-2 text-sm font-medium text-text-secondary">{source.preview || source.fileName}</p>
                  </div>
                  <span className={cn(
                    "rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em]",
                    source.extractionStatus === "ready"
                      ? "bg-emerald-50 text-emerald-600"
                      : source.extractionStatus === "unsupported"
                        ? "bg-amber-50 text-amber-600"
                        : "bg-red-50 text-red-500"
                  )}>
                    {source.extractionStatus}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[28px] border border-app bg-app-surface p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-black">Module notes</h2>
              <Link href={workspace === "tutor" ? "/tutor/materials" : "/student/notes"} className="text-xs font-black uppercase tracking-[0.18em] text-primary">
                View notes
              </Link>
            </div>
            <div className="space-y-3">
              {notes.slice(0, 4).map((note) => (
                <div key={note.id} className="rounded-[20px] bg-app-muted p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">{note.kind}</p>
                  <p className="mt-1 font-black">{note.title}</p>
                  <p className="mt-2 text-sm font-medium text-text-secondary">{note.preview}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-app bg-app-surface p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-black">Assessment library</h2>
              <div className="flex gap-2">
                <Link href={workspace === "tutor" ? "/tutor/materials" : "/student/quiz"} className="text-xs font-black uppercase tracking-[0.18em] text-primary">
                  Quizzes
                </Link>
                <Link href={workspace === "tutor" ? "/tutor/materials" : "/student/exams"} className="text-xs font-black uppercase tracking-[0.18em] text-primary">
                  Exams
                </Link>
              </div>
            </div>
            <div className="space-y-3">
              {assessments.slice(0, 4).map((assessment) => (
                <Link
                  key={assessment.id}
                  href={workspace === "tutor" ? "/tutor/materials" : assessment.mode === "exam" ? `/student/exams/${assessment.id}` : `/student/quiz/${assessment.id}`}
                  className="block rounded-[20px] bg-app-muted p-4"
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">
                    {assessment.mode} · {assessment.difficulty}
                  </p>
                  <p className="mt-1 font-black">{assessment.title}</p>
                  <p className="mt-2 text-sm font-medium text-text-secondary">
                    {assessment.questions.length} questions · {assessment.timeLimitMinutes} min · {assessment.questionTypes.join(", ")}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <AnimatePresence>
        {showUpload && (
          <ModalShell title="Add module material" onClose={() => setShowUpload(false)}>
            <div className="space-y-4">
              <FieldLabel label="Source title" />
              <input
                value={uploadTitle}
                onChange={(event) => setUploadTitle(event.target.value)}
                placeholder="e.g. Chapter 5 reading"
                className="w-full rounded-[18px] border border-app bg-app-muted px-4 py-3 font-semibold outline-none"
              />
              <FieldLabel label="Upload a PDF, DOCX, or TXT file" />
              <input
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
                className="w-full rounded-[18px] border border-app bg-app-muted px-4 py-3 font-semibold outline-none"
              />
              <FieldLabel label="Or paste a book excerpt" />
              <textarea
                value={excerptText}
                onChange={(event) => setExcerptText(event.target.value)}
                rows={6}
                placeholder="Paste a chapter excerpt or lecture text here."
                className="w-full rounded-[18px] border border-app bg-app-muted px-4 py-3 font-semibold outline-none resize-none"
              />
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full rounded-full bg-primary px-5 py-4 text-xs font-black uppercase tracking-[0.18em] text-white"
              >
                {uploading ? "Saving material..." : "Save material"}
              </button>
            </div>
          </ModalShell>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTypedNote && (
          <ModalShell title="Create typed note" onClose={() => setShowTypedNote(false)}>
            <div className="space-y-4">
              <FieldLabel label="Note title" />
              <input
                value={typedTitle}
                onChange={(event) => setTypedTitle(event.target.value)}
                placeholder="e.g. Thermodynamics summary"
                className="w-full rounded-[18px] border border-app bg-app-muted px-4 py-3 font-semibold outline-none"
              />
              <FieldLabel label="Type your note" />
              <textarea
                value={typedContent}
                onChange={(event) => setTypedContent(event.target.value)}
                rows={10}
                placeholder="Type your revision notes here."
                className="w-full rounded-[18px] border border-app bg-app-muted px-4 py-3 font-semibold outline-none resize-none"
              />
              <button
                onClick={handleTypedNote}
                disabled={noteSaving}
                className="w-full rounded-full bg-primary px-5 py-4 text-xs font-black uppercase tracking-[0.18em] text-white"
              >
                {noteSaving ? "Saving note..." : "Save note"}
              </button>
            </div>
          </ModalShell>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showGenerate && (
          <ModalShell
            title={`Generate ${showGenerate === "flashcards" ? "flashcards" : showGenerate}`}
            onClose={() => setShowGenerate(null)}
          >
            <div className="space-y-5">
              <FieldLabel label="Title" />
              <input
                value={assessmentTitle}
                onChange={(event) => setAssessmentTitle(event.target.value)}
                placeholder={`Name this ${showGenerate}`}
                className="w-full rounded-[18px] border border-app bg-app-muted px-4 py-3 font-semibold outline-none"
              />

              <FieldLabel label="Select source material" />
              <div className="grid gap-2 max-h-56 overflow-y-auto">
                {moduleSources.map((source: ModuleSourceFile) => (
                  <button
                    key={source.id}
                    onClick={() => toggleSource(source.id)}
                    className={cn(
                      "rounded-[18px] border px-4 py-3 text-left transition",
                      selectedSourceIds.includes(source.id)
                        ? "border-primary bg-primary/5"
                        : "border-app bg-app-muted"
                    )}
                  >
                    <p className="text-sm font-black">{source.title}</p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-text-secondary">{source.sourceKind.replace("_", " ")}</p>
                  </button>
                ))}
              </div>

              {(showGenerate === "quiz" || showGenerate === "exam" || showGenerate === "flashcards") && (
                <>
                  <FieldLabel label="Question or card count" />
                  <input
                    type="number"
                    value={questionCount}
                    onChange={(event) => setQuestionCount(Number(event.target.value))}
                    className="w-full rounded-[18px] border border-app bg-app-muted px-4 py-3 font-semibold outline-none"
                  />
                </>
              )}

              {(showGenerate === "quiz" || showGenerate === "exam") && (
                <>
                  <FieldLabel label="Difficulty" />
                  <select
                    value={difficulty}
                    onChange={(event) => setDifficulty(event.target.value)}
                    className="w-full rounded-[18px] border border-app bg-app-muted px-4 py-3 font-semibold outline-none"
                  >
                    {["Easy", "Medium", "Hard"].map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>

                  <FieldLabel label="Time limit in minutes" />
                  <input
                    type="number"
                    value={timeLimitMinutes}
                    onChange={(event) => setTimeLimitMinutes(Number(event.target.value))}
                    className="w-full rounded-[18px] border border-app bg-app-muted px-4 py-3 font-semibold outline-none"
                  />

                  <FieldLabel label="Question types" />
                  <div className="flex flex-wrap gap-2">
                    {QUESTION_TYPE_OPTIONS.map((item) => {
                      const active = questionTypes.includes(item.id);
                      return (
                        <button
                          key={item.id}
                          onClick={() =>
                            setQuestionTypes((current) =>
                              active
                                ? current.filter((value) => value !== item.id)
                                : [...current, item.id]
                            )
                          }
                          className={cn(
                            "rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.18em]",
                            active ? "border-primary bg-primary text-white" : "border-app bg-app-muted text-text-secondary"
                          )}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              <button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full rounded-full bg-primary px-5 py-4 text-xs font-black uppercase tracking-[0.18em] text-white"
              >
                {generating ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Generating
                  </span>
                ) : (
                  `Generate ${showGenerate}`
                )}
              </button>
            </div>
          </ModalShell>
        )}
      </AnimatePresence>
    </div>
  );
}

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 18 }}
        className="relative z-10 w-full max-w-2xl rounded-[30px] border border-app bg-app-surface p-8 shadow-2xl"
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-black capitalize">{title}</h2>
          <button onClick={onClose} className="rounded-full border border-app p-2 text-text-secondary">
            <Plus size={16} className="rotate-45" />
          </button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}

function FieldLabel({ label }: { label: string }) {
  return <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">{label}</p>;
}
