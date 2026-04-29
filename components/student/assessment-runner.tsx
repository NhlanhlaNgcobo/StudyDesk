"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Award,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Flag,
  Loader2,
  RotateCcw,
  Sparkles,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type AssessmentAttempt,
  type AssessmentBlueprint,
  type AssessmentQuestion,
  type AssessmentQuestionResult,
  getAssessmentById,
  getAttemptsForAssessment,
  getModuleKnowledge,
  getSourceBundle,
  saveAssessmentAttempt,
  useKnowledgeStore,
} from "@/lib/module-knowledge";

interface AssessmentRunnerProps {
  assessmentId: string;
  mode: "quiz" | "exam";
}

type AnswerValue = string | number;

function formatTime(seconds: number) {
  const safe = Math.max(0, seconds);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const remainingSeconds = safe % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  }

  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
    .toString()
    .padStart(2, "0")}`;
}

function getQuestionTypeLabel(type: AssessmentQuestion["type"]) {
  switch (type) {
    case "multiple_choice":
      return "Multiple choice";
    case "short_form":
      return "Short form";
    case "written":
      return "Written";
    case "long_form":
      return "Long form";
    default:
      return "Question";
  }
}

function buildFallbackResults(
  questions: AssessmentQuestion[],
  answers: Record<string, AnswerValue>
) {
  return questions.map<AssessmentQuestionResult>((question) => {
    const studentAnswer = answers[question.id] ?? null;
    const isCorrect =
      question.type === "multiple_choice" ? studentAnswer === question.correctIndex : false;

    return {
      questionId: question.id,
      score: isCorrect ? question.marks : 0,
      maxScore: question.marks,
      isCorrect,
      studentAnswer,
      correctAnswer:
        question.type === "multiple_choice"
          ? question.options?.[question.correctIndex ?? 0] || ""
          : question.sampleAnswer || question.correctAnswer || "",
      correction:
        question.type === "multiple_choice"
          ? isCorrect
            ? "Correct answer selected."
            : question.explanation || "Review the source materials for this concept."
          : "This answer still needs to be marked.",
      explanation: question.explanation || "",
      topic: question.topic,
    };
  });
}

export function AssessmentRunner({ assessmentId, mode }: AssessmentRunnerProps) {
  const knowledge = useKnowledgeStore();
  const assessment = useMemo(
    () => getAssessmentById(assessmentId),
    [assessmentId, knowledge]
  );
  const moduleKnowledge = useMemo(
    () => (assessment ? getModuleKnowledge(assessment.moduleId) : null),
    [assessment, knowledge]
  );
  const attempts = useMemo(
    () => getAttemptsForAssessment(assessmentId),
    [assessmentId, knowledge]
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [startedAt, setStartedAt] = useState(() => new Date().toISOString());
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showSubmitPrompt, setShowSubmitPrompt] = useState(false);
  const [resultState, setResultState] = useState<{
    percentage: number;
    totalScore: number;
    totalMarks: number;
    weakTopics: string[];
    results: AssessmentQuestionResult[];
  } | null>(null);

  useEffect(() => {
    if (!assessment) return;
    setCurrentIndex(0);
    setAnswers({});
    setFlagged({});
    setTimeLeft((assessment.timeLimitMinutes || 20) * 60);
    setStartedAt(new Date().toISOString());
    setSubmitError(null);
    setShowSubmitPrompt(false);
    setResultState(null);
  }, [assessmentId, assessment]);

  useEffect(() => {
    if (!assessment || resultState) return;

    const timer = window.setInterval(() => {
      setTimeLeft((previous) => {
        if (previous <= 1) {
          window.clearInterval(timer);
          void handleSubmit();
          return 0;
        }
        return previous - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [assessment, resultState]);

  if (!assessment || assessment.mode !== mode) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-5 text-center">
        <div className="rounded-full bg-red-50 p-4 text-red-600">
          <AlertCircle size={32} />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tight">Assessment not found</h1>
          <p className="max-w-md text-sm font-medium text-text-secondary">
            This assessment is not available in the current module knowledge library.
          </p>
        </div>
        <Link
          href={mode === "exam" ? "/student/exams" : "/student/quiz"}
          className="rounded-full bg-primary px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-white"
        >
          Back to library
        </Link>
      </div>
    );
  }

  const currentQuestion = assessment.questions[currentIndex];
  const answeredCount = assessment.questions.filter((question) => {
    const value = answers[question.id];
    return value !== undefined && String(value).trim().length > 0;
  }).length;
  const sourceBundle = getSourceBundle(assessment.moduleId, assessment.sourceIds);
  const previousBest = attempts.length > 0 ? Math.max(...attempts.map((attempt) => attempt.percentage)) : null;

  async function handleSubmit() {
    if (!assessment || submitting || resultState) return;

    const activeAssessment = assessment;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch("/api/grade/assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessment: activeAssessment,
          answers,
          sourceSummary: sourceBundle.sourceSummary,
          sourceText: sourceBundle.combinedText,
          subject: moduleKnowledge?.module.subject,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || "Unable to grade this assessment right now.");
      }

      const payload = await response.json();
      const submittedAt = new Date().toISOString();
      const attempt: AssessmentAttempt = {
        id: `attempt-${Date.now()}`,
        assessmentId: activeAssessment.id,
        moduleId: activeAssessment.moduleId,
        mode: activeAssessment.mode,
        startedAt,
        submittedAt,
        timeTakenSeconds: Math.max(
          0,
          Math.round((new Date(submittedAt).getTime() - new Date(startedAt).getTime()) / 1000)
        ),
        percentage: payload.percentage,
        totalScore: payload.totalScore,
        totalMarks: payload.totalMarks,
        answers,
        results: payload.results || buildFallbackResults(activeAssessment.questions, answers),
        weakTopics: payload.weakTopics || [],
      };

      saveAssessmentAttempt(attempt);
      setResultState({
        percentage: attempt.percentage,
        totalScore: attempt.totalScore,
        totalMarks: attempt.totalMarks,
        weakTopics: attempt.weakTopics,
        results: attempt.results,
      });
    } catch (error: any) {
      setSubmitError(error.message || "Unable to submit this assessment.");
    } finally {
      setSubmitting(false);
      setShowSubmitPrompt(false);
    }
  }

  function updateAnswer(questionId: string, value: AnswerValue) {
    setAnswers((previous) => ({ ...previous, [questionId]: value }));
  }

  function renderInput(question: AssessmentQuestion) {
    if (question.type === "multiple_choice") {
      return (
        <div className="grid gap-3">
          {(question.options || []).map((option, optionIndex) => {
            const selected = answers[question.id] === optionIndex;
            return (
              <button
                key={`${question.id}-${optionIndex}`}
                type="button"
                onClick={() => updateAnswer(question.id, optionIndex)}
                className={cn(
                  "flex items-start gap-4 rounded-[22px] border px-5 py-4 text-left transition",
                  selected
                    ? "border-primary bg-primary text-white shadow-lg shadow-blue-500/20"
                    : "border-app bg-app-surface hover:border-primary/40 hover:bg-app-muted"
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-black",
                    selected ? "border-white/30 bg-white/10 text-white" : "border-app text-primary"
                  )}
                >
                  {String.fromCharCode(65 + optionIndex)}
                </span>
                <span className="font-semibold leading-7">{option}</span>
              </button>
            );
          })}
        </div>
      );
    }

    const rows =
      question.type === "short_form" ? 4 : question.type === "written" ? 7 : 10;

    return (
      <div className="space-y-3">
        <textarea
          value={String(answers[question.id] ?? "")}
          onChange={(event) => updateAnswer(question.id, event.target.value)}
          rows={rows}
          placeholder="Write your answer using the module materials you studied."
          className="w-full rounded-[24px] border border-app bg-app-surface px-5 py-4 font-medium leading-7 text-text-primary outline-none transition focus:border-primary focus:ring-4 focus:ring-blue-500/10"
        />
        <div className="rounded-[20px] border border-app bg-app-muted px-4 py-3 text-sm text-text-secondary">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">
            Marking focus
          </p>
          <p className="mt-2 font-medium">
            {question.rubricCriteria?.join(" • ") ||
              "Explain the concept clearly, stay accurate, and use evidence from the module materials."}
          </p>
        </div>
      </div>
    );
  }

  if (resultState) {
    const timeUsed = Math.max(0, assessment.timeLimitMinutes * 60 - timeLeft);

    return (
      <div className="space-y-10">
        <section className="rounded-[32px] border border-app bg-app-surface p-8 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <p className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-white">
                <Award size={14} />
                {mode === "exam" ? "Exam marked" : "Quiz marked"}
              </p>
              <h1 className="text-4xl font-black tracking-tight">{assessment.title}</h1>
              <p className="max-w-2xl text-base font-medium text-text-secondary">
                Your answers were checked against the stored module materials, the generated memo, and the marking rubric.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-[24px] bg-app-muted p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-text-secondary">
                  Percentage
                </p>
                <p className="mt-2 text-3xl font-black text-primary">{resultState.percentage}%</p>
              </div>
              <div className="rounded-[24px] bg-app-muted p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-text-secondary">
                  Score
                </p>
                <p className="mt-2 text-3xl font-black">
                  {resultState.totalScore} / {resultState.totalMarks}
                </p>
              </div>
              <div className="rounded-[24px] bg-app-muted p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-text-secondary">
                  Time used
                </p>
                <p className="mt-2 text-3xl font-black">{formatTime(timeUsed)}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="rounded-[32px] border border-app bg-app-surface p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4 border-b border-app pb-5">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary">
                  Corrections
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight">
                  Question by question feedback
                </h2>
              </div>
              <span className="rounded-full bg-app-muted px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-text-secondary">
                {assessment.questions.length} items
              </span>
            </div>

            <div className="mt-6 space-y-5">
              {assessment.questions.map((question, index) => {
                const result = resultState.results.find((item) => item.questionId === question.id);
                const studentAnswer = result?.studentAnswer;

                return (
                  <article
                    key={question.id}
                    className="rounded-[26px] border border-app bg-app-muted/70 p-5"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">
                          Question {index + 1} • {getQuestionTypeLabel(question.type)}
                        </p>
                        <h3 className="text-lg font-black leading-7">{question.prompt}</h3>
                      </div>
                      <div
                        className={cn(
                          "inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em]",
                          (result?.score || 0) === result?.maxScore
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        )}
                      >
                        {(result?.score || 0) === result?.maxScore ? (
                          <CheckCircle2 size={14} />
                        ) : (
                          <Target size={14} />
                        )}
                        {result?.score || 0} / {result?.maxScore || question.marks}
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4 lg:grid-cols-2">
                      <div className="rounded-[20px] bg-app-surface p-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-text-secondary">
                          Your answer
                        </p>
                        <p className="mt-2 whitespace-pre-wrap font-medium leading-7 text-text-primary">
                          {question.type === "multiple_choice"
                            ? question.options?.[Number(studentAnswer)] || "No answer submitted"
                            : String(studentAnswer || "No answer submitted")}
                        </p>
                      </div>
                      <div className="rounded-[20px] bg-app-surface p-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-text-secondary">
                          Model answer
                        </p>
                        <p className="mt-2 whitespace-pre-wrap font-medium leading-7 text-text-primary">
                          {result?.correctAnswer || question.sampleAnswer || question.correctAnswer}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-[20px] border border-app bg-app-surface p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">
                        Feedback
                      </p>
                      <p className="mt-2 font-medium leading-7 text-text-secondary">
                        {result?.correction || "Review the model answer and compare it with your response."}
                      </p>
                      <p className="mt-3 font-medium leading-7 text-text-secondary">
                        {result?.explanation ||
                          question.explanation ||
                          "Focus on the key idea and strengthen your explanation with evidence from the module sources."}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          <div className="space-y-6">
            <section className="rounded-[32px] border border-app bg-app-surface p-6 shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary">
                Readiness signal
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight">
                What to revise next
              </h2>
              <div className="mt-5 space-y-3">
                {resultState.weakTopics.length > 0 ? (
                  resultState.weakTopics.map((topic) => (
                    <div
                      key={topic}
                      className="rounded-[20px] bg-app-muted px-4 py-3 font-semibold text-text-secondary"
                    >
                      {topic}
                    </div>
                  ))
                ) : (
                  <div className="rounded-[20px] bg-emerald-50 px-4 py-4 text-sm font-semibold text-emerald-700">
                    Strong work. No weak topics were flagged in this attempt.
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-[32px] border border-app bg-app-surface p-6 shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary">
                Attempt history
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight">
                Performance trend
              </h2>
              <div className="mt-5 space-y-3">
                <div className="rounded-[20px] bg-app-muted px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-text-secondary">
                    Attempts
                  </p>
                  <p className="mt-2 text-2xl font-black">{attempts.length}</p>
                </div>
                <div className="rounded-[20px] bg-app-muted px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-text-secondary">
                    Best score
                  </p>
                  <p className="mt-2 text-2xl font-black">
                    {previousBest !== null ? `${previousBest}%` : "No previous score"}
                  </p>
                </div>
              </div>
            </section>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center justify-center gap-3 rounded-full bg-primary px-6 py-4 text-sm font-black uppercase tracking-[0.18em] text-white shadow-xl shadow-blue-500/20 transition hover:bg-primary-strong"
              >
                <RotateCcw size={16} />
                Reattempt
              </button>
              <Link
                href={`/student/modules/${assessment.moduleId}`}
                className="inline-flex items-center justify-center gap-3 rounded-full border border-app bg-app-surface px-6 py-4 text-sm font-black uppercase tracking-[0.18em] text-text-primary transition hover:border-primary/30 hover:text-primary"
              >
                <FileText size={16} />
                Back to module
              </Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
      <main className="space-y-6">
        <section className="rounded-[32px] border border-app bg-app-surface p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary">
                {mode === "exam" ? "Timed exam" : "Timed quiz"}
              </p>
              <h1 className="text-3xl font-black tracking-tight md:text-4xl">
                {assessment.title}
              </h1>
              <p className="max-w-2xl text-base font-medium text-text-secondary">
                This assessment was generated from your stored module materials. Answer in your own words and use the source notes to support your thinking.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[22px] bg-app-muted px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-text-secondary">
                  Timer
                </p>
                <p className="mt-2 flex items-center gap-2 text-xl font-black">
                  <Clock size={18} className="text-primary" />
                  {formatTime(timeLeft)}
                </p>
              </div>
              <div className="rounded-[22px] bg-app-muted px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-text-secondary">
                  Questions
                </p>
                <p className="mt-2 text-xl font-black">{assessment.questions.length}</p>
              </div>
              <div className="rounded-[22px] bg-app-muted px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-text-secondary">
                  Marks
                </p>
                <p className="mt-2 text-xl font-black">{assessment.totalMarks}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-app bg-app-surface p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">
                Question {currentIndex + 1} of {assessment.questions.length}
              </p>
              <h2 className="text-2xl font-black leading-8">{currentQuestion.prompt}</h2>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-app-muted px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-text-secondary">
                  {getQuestionTypeLabel(currentQuestion.type)}
                </span>
                <span className="rounded-full bg-app-muted px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-text-secondary">
                  {currentQuestion.topic}
                </span>
                <span className="rounded-full bg-app-muted px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-text-secondary">
                  {currentQuestion.marks} marks
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setFlagged((previous) => ({
                  ...previous,
                  [currentQuestion.id]: !previous[currentQuestion.id],
                }))
              }
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] transition",
                flagged[currentQuestion.id]
                  ? "bg-amber-50 text-amber-700"
                  : "border border-app bg-app-surface text-text-secondary hover:border-primary/30 hover:text-primary"
              )}
            >
              <Flag size={14} />
              {flagged[currentQuestion.id] ? "Flagged" : "Flag"}
            </button>
          </div>

          <div className="mt-6">{renderInput(currentQuestion)}</div>

          {submitError ? (
            <div className="mt-5 rounded-[20px] bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {submitError}
            </div>
          ) : null}

          <div className="mt-8 flex flex-col gap-3 border-t border-app pt-6 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => setCurrentIndex((value) => Math.max(0, value - 1))}
              disabled={currentIndex === 0}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-app bg-app-surface px-5 py-3 text-sm font-black uppercase tracking-[0.16em] text-text-primary transition hover:border-primary/30 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={16} />
              Previous
            </button>

            {currentIndex === assessment.questions.length - 1 ? (
              <button
                type="button"
                onClick={() => setShowSubmitPrompt(true)}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-black uppercase tracking-[0.16em] text-white shadow-xl shadow-blue-500/20 transition hover:bg-primary-strong"
              >
                Submit for marking
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() =>
                  setCurrentIndex((value) =>
                    Math.min(assessment.questions.length - 1, value + 1)
                  )
                }
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-black uppercase tracking-[0.16em] text-white shadow-xl shadow-blue-500/20 transition hover:bg-primary-strong"
              >
                Next question
                <ChevronRight size={16} />
              </button>
            )}
          </div>
        </section>
      </main>

      <aside className="space-y-6">
        <section className="rounded-[32px] border border-app bg-app-surface p-6 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary">
            Progress
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight">
            Assessment tracker
          </h2>

          <div className="mt-5 space-y-4">
            <div className="h-3 overflow-hidden rounded-full bg-app-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{
                  width: `${Math.round((answeredCount / assessment.questions.length) * 100)}%`,
                }}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-[20px] bg-app-muted px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-text-secondary">
                  Answered
                </p>
                <p className="mt-2 text-2xl font-black">{answeredCount}</p>
              </div>
              <div className="rounded-[20px] bg-app-muted px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-text-secondary">
                  Flagged
                </p>
                <p className="mt-2 text-2xl font-black">
                  {Object.values(flagged).filter(Boolean).length}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-app bg-app-surface p-6 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary">
            Source set
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight">
            What this was built from
          </h2>
          <div className="mt-4 space-y-3">
            {assessment.sourceSummary.map((source) => (
              <div
                key={source}
                className="rounded-[20px] bg-app-muted px-4 py-3 font-semibold text-text-secondary"
              >
                {source}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[32px] border border-app bg-app-surface p-6 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary">
            Question navigator
          </p>
          <div className="mt-4 grid grid-cols-5 gap-2">
            {assessment.questions.map((question, index) => {
              const answered =
                answers[question.id] !== undefined &&
                String(answers[question.id]).trim().length > 0;
              const isCurrent = index === currentIndex;
              return (
                <button
                  key={question.id}
                  type="button"
                  onClick={() => setCurrentIndex(index)}
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-2xl border text-xs font-black transition",
                    isCurrent
                      ? "border-primary bg-primary text-white"
                      : flagged[question.id]
                        ? "border-amber-200 bg-amber-50 text-amber-700"
                        : answered
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-app bg-app-muted text-text-secondary hover:border-primary/30 hover:text-primary"
                  )}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </section>

        <div className="flex flex-col gap-3">
          <Link
            href={mode === "exam" ? "/student/exams" : "/student/quiz"}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-app bg-app-surface px-6 py-3 text-sm font-black uppercase tracking-[0.16em] text-text-primary transition hover:border-primary/30 hover:text-primary"
          >
            <ChevronLeft size={16} />
            Back to library
          </Link>
          <button
            type="button"
            onClick={() => setShowSubmitPrompt(true)}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-black uppercase tracking-[0.16em] text-white transition hover:bg-primary"
          >
            <Sparkles size={16} />
            Mark now
          </button>
        </div>
      </aside>

      {showSubmitPrompt ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[32px] border border-app bg-app-surface p-8 shadow-2xl">
            <div className="space-y-3">
              <p className="inline-flex items-center gap-2 rounded-full bg-app-muted px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-primary">
                <AlertCircle size={14} />
                Ready to submit
              </p>
              <h2 className="text-3xl font-black tracking-tight">
                Send this for AI marking?
              </h2>
              <p className="text-base font-medium leading-7 text-text-secondary">
                Your answers will be marked against the module materials, stored notes, and generated memo. You have answered {answeredCount} of {assessment.questions.length} questions.
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setShowSubmitPrompt(false)}
                className="flex-1 rounded-full border border-app bg-app-surface px-5 py-3 text-sm font-black uppercase tracking-[0.16em] text-text-primary transition hover:border-primary/30 hover:text-primary"
              >
                Keep working
              </button>
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={submitting}
                className="flex-1 rounded-full bg-primary px-5 py-3 text-sm font-black uppercase tracking-[0.16em] text-white shadow-xl shadow-blue-500/20 transition hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Marking
                  </span>
                ) : (
                  "Submit now"
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
