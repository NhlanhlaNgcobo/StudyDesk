"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  X,
  Clock,
  ChevronRight,
  ChevronLeft,
  Flag,
  CheckCircle2,
  XCircle,
  Lightbulb,
  RotateCcw,
  BookOpen,
  ArrowRight,
  TrendingUp,
  Award,
  Hash,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import "katex/dist/katex.min.css";
import { cn } from "@/lib/utils";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Question {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  topic: string;
}

interface QuizData {
  id: string;
  topic: string;
  moduleName?: string;
  difficulty?: string;
  questions: Question[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function renderLatex(text: string) {
  // Wrap $ math $ in a styled span (lightweight, no re-parse)
  return text.replace(
    /\$(.*?)\$/g,
    (_, p1) => `<span class="italic text-primary font-mono">${p1}</span>`
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function QuizEnginePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const quizId = params.id as string;
  const moduleId = searchParams.get("moduleId");

  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Quiz state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [flagged, setFlagged] = useState<boolean[]>([]);

  // ── Load quiz from Firestore ────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        // If we have a moduleId, this is an AI-generated quiz in a module subcollection
        if (moduleId) {
          const snap = await getDoc(doc(db, "modules", moduleId, "quizzes", quizId));
          if (snap.exists()) {
            const data = snap.data();
            const quizData: QuizData = {
              id: snap.id,
              topic: data.topic,
              difficulty: data.difficulty,
              questions: data.questions || [],
            };
            setQuiz(quizData);
            setAnswers(new Array(quizData.questions.length).fill(null));
            setFlagged(new Array(quizData.questions.length).fill(false));
          } else {
            setError("Quiz not found.");
          }
        } else {
          // Could be a top-level quiz document (future use)
          setError("Quiz not found.");
        }
      } catch (e: any) {
        setError(e.message || "Failed to load quiz.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [quizId, moduleId]);

  // ── Timer ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!quiz || isFinished) return;
    if (timeLeft === 0) { handleNext(); return; }
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, isFinished, quiz]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6">
        <p className="text-red-500 font-bold text-xl">{error || "Quiz not found"}</p>
        <Link href="/student/modules" className="px-6 py-3 bg-primary text-white font-black rounded-base">
          Back to Modules
        </Link>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentIndex];

  const handleSelect = (idx: number) => {
    if (selectedIdx !== null) return;
    setSelectedIdx(idx);
    setShowExplanation(true);
    const newAnswers = [...answers];
    newAnswers[currentIndex] = idx;
    setAnswers(newAnswers);

    if (idx === currentQuestion.correctIndex) {
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ["#4DA6FF", "#10B981", "#FFFFFF"] });
    }
  };

  const handleNext = () => {
    if (currentIndex < quiz.questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedIdx(null);
      setShowExplanation(false);
      setTimeLeft(60);
    } else {
      setIsFinished(true);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setSelectedIdx(answers[currentIndex - 1]);
      setShowExplanation(answers[currentIndex - 1] !== null);
    }
  };

  const toggleFlag = () => {
    const f = [...flagged];
    f[currentIndex] = !f[currentIndex];
    setFlagged(f);
  };

  const score = answers.filter((a, i) => a === quiz.questions[i]?.correctIndex).length;
  const percent = Math.round((score / quiz.questions.length) * 100);
  const backHref = moduleId ? `/student/modules/${moduleId}` : "/student/quiz";

  // ── Results Screen ──────────────────────────────────────────────────────
  if (isFinished) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-6 animate-in fade-in zoom-in duration-500">
        <header className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-xs font-black uppercase tracking-widest border border-emerald-100">
            <Award size={16} /> Quiz Completed
          </div>
          <h1 className="text-5xl font-black italic tracking-tighter underline decoration-primary decoration-4 uppercase">
            {quiz.topic}
          </h1>
          <p className="text-text-secondary font-bold text-lg">Great effort! Review your metrics below.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-10 rounded-xl shadow-sm flex flex-col items-center">
            <div className="w-32 mb-6">
              <CircularProgressbar
                value={percent}
                text={`${percent}%`}
                strokeWidth={12}
                styles={buildStyles({
                  pathColor: percent >= 70 ? "#10B981" : percent >= 40 ? "#4DA6FF" : "#EF4444",
                  textColor: "#000000",
                  trailColor: "#F1F5F9",
                  textSize: "20px",
                })}
              />
            </div>
            <p className="text-xs font-black uppercase tracking-widest text-text-secondary">Mastery Score</p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-10 rounded-xl shadow-sm md:col-span-2 space-y-6">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-xl font-black italic tracking-tight">Performance Summary</h3>
              <div className="text-2xl font-black text-primary italic underline decoration-2">
                {score} / {quiz.questions.length}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-1">Correct Answers</p>
                <p className="font-extrabold text-lg text-emerald-600">{score}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-1">Incorrect</p>
                <p className="font-extrabold text-lg text-red-500">{quiz.questions.length - score}</p>
              </div>
            </div>
            <div className="space-y-3 pt-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Difficulty</p>
              <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-black uppercase tracking-widest">
                {quiz.difficulty || "Mixed"}
              </span>
            </div>
          </div>
        </div>

        {/* Question Breakdown */}
        <section className="space-y-6 mb-16">
          <h2 className="text-2xl font-black tracking-tight underline decoration-primary decoration-2">Per-Question Breakdown</h2>
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
            {quiz.questions.map((q, i) => (
              <div key={q.id} className="p-6 flex items-center justify-between group hover:bg-slate-50 transition-colors border-b last:border-0">
                <div className="flex items-center gap-6">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-base flex items-center justify-center font-black",
                      answers[i] === q.correctIndex ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
                    )}
                  >
                    {answers[i] === q.correctIndex ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Question {i + 1}</p>
                    <p className="font-bold text-sm tracking-tight text-text-secondary max-w-md truncate">
                      {q.text.replace(/\$/g, "")}
                    </p>
                  </div>
                </div>
                <span className="px-2 py-1 bg-slate-50 border rounded-full text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {q.topic}
                </span>
              </div>
            ))}
          </div>
        </section>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => window.location.reload()}
            className="flex-1 py-5 bg-primary text-white font-black text-xl rounded-base flex items-center justify-center gap-3 hover:shadow-2xl hover:shadow-primary/30 active:scale-95 transition-all"
          >
            <RotateCcw size={24} /> Retry Quiz
          </button>
          <Link
            href={backHref}
            className="flex-1 py-5 border-2 border-slate-900 text-slate-900 font-black text-xl rounded-base flex items-center justify-center gap-3 hover:bg-slate-900 hover:text-white transition-all"
          >
            <BookOpen size={24} /> Back to Module
          </Link>
        </div>
      </div>
    );
  }

  // ── Quiz UI ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F8FAFF] flex flex-col pb-32">
      {/* Header */}
      <header className="h-20 bg-white border-b sticky top-0 z-50 flex items-center justify-between px-6 md:px-12">
        <div className="flex items-center gap-6">
          <Link href={backHref} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X />
          </Link>
          <div>
            <h2 className="text-sm font-black italic tracking-widest text-primary leading-none mb-1">{quiz.topic}</h2>
            <div className="flex items-center gap-4">
              <div className="h-1.5 w-32 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${((currentIndex + 1) / quiz.questions.length) * 100}%` }}
                />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary">
                Q {currentIndex + 1} of {quiz.questions.length}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div
            className={cn(
              "px-4 py-2 rounded-full border-2 flex items-center gap-2 font-black italic tracking-tighter",
              timeLeft < 10
                ? "border-red-400 bg-red-50 text-red-600 animate-pulse"
                : "border-slate-100 bg-slate-50 text-text-secondary"
            )}
          >
            <Clock size={16} /> 00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
          </div>
          <button
            onClick={toggleFlag}
            className={cn(
              "p-3 rounded-base transition-all",
              flagged[currentIndex] ? "bg-orange-100 text-orange-600 border-orange-200" : "hover:bg-slate-50 text-slate-400"
            )}
          >
            <Flag size={20} fill={flagged[currentIndex] ? "currentColor" : "none"} />
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 pt-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full max-w-[720px] space-y-8"
          >
            {/* Question Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-xl p-10 space-y-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <TrendingUp size={120} />
              </div>

              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary italic">
                  {currentQuestion?.topic}
                </p>
                <h3
                  className="text-2xl font-extrabold tracking-tight leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: renderLatex(currentQuestion?.text || "") }}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 pt-4">
                {currentQuestion?.options.map((option, idx) => {
                  const isSelected = selectedIdx === idx;
                  const isCorrect = currentQuestion.correctIndex === idx;
                  const showResult = selectedIdx !== null;

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelect(idx)}
                      className={cn(
                        "w-full p-5 rounded-base border-2 font-bold text-left transition-all relative flex items-center justify-between group",
                        !showResult && "bg-white hover:border-primary hover:bg-primary/5",
                        showResult && isCorrect && "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-lg shadow-emerald-500/10",
                        showResult && isSelected && !isCorrect && "bg-red-50 border-red-500 text-red-700",
                        showResult && !isSelected && !isCorrect && "bg-slate-50 border-transparent opacity-50"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={cn(
                            "w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-black transition-all",
                            !showResult && "border-slate-100 text-slate-400 group-hover:border-primary group-hover:text-primary",
                            showResult && isCorrect && "border-emerald-500 bg-emerald-500 text-white",
                            showResult && isSelected && !isCorrect && "border-red-500 bg-red-500 text-white"
                          )}
                        >
                          {String.fromCharCode(65 + idx)}
                        </div>
                        <span dangerouslySetInnerHTML={{ __html: renderLatex(option) }} />
                      </div>
                      {showResult && isCorrect && <CheckCircle2 className="text-emerald-500" size={24} />}
                      {showResult && isSelected && !isCorrect && <XCircle className="text-red-500" size={24} />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Explanation */}
            <AnimatePresence>
              {showExplanation && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl p-8 space-y-4 shadow-inner"
                >
                  <div className="flex items-center gap-4 text-emerald-600">
                    <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-base flex items-center justify-center shadow-lg">
                      <Lightbulb size={24} />
                    </div>
                    <h4 className="text-lg font-black uppercase tracking-tighter italic">
                      Explanation
                    </h4>
                  </div>
                  <p
                    className="text-text-secondary font-medium leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: renderLatex(currentQuestion?.explanation || "") }}
                  />
                  <div className="pt-4 flex justify-end">
                    <button
                      onClick={handleNext}
                      className="px-8 py-3 bg-primary text-white font-black text-sm uppercase tracking-widest rounded-base hover:shadow-xl hover:shadow-primary/30 transition-all flex items-center gap-2"
                    >
                      {currentIndex === quiz.questions.length - 1 ? "Finish Quiz" : "Next Question"}{" "}
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer nav */}
      <footer className="fixed bottom-0 left-0 right-0 h-24 bg-white/80 backdrop-blur-md border-t flex items-center justify-center gap-8 px-6 z-40">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="p-3 border-2 border-slate-100 rounded-base hover:bg-slate-50 disabled:opacity-30 transition-all"
        >
          <ChevronLeft size={24} />
        </button>

        <div className="flex gap-2">
          {quiz.questions.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={cn(
                "w-3 h-3 rounded-full transition-all border-2",
                i === currentIndex
                  ? "bg-primary border-primary scale-125 w-8"
                  : answers[i] !== null
                    ? answers[i] === quiz.questions[i]?.correctIndex
                      ? "bg-emerald-400 border-emerald-400"
                      : "bg-red-400 border-red-400"
                    : "bg-slate-200 border-transparent hover:bg-slate-400"
              )}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          className="p-3 border-2 border-slate-100 rounded-base hover:bg-primary hover:text-white hover:border-primary transition-all"
        >
          <ChevronRight size={24} />
        </button>
      </footer>
    </div>
  );
}
