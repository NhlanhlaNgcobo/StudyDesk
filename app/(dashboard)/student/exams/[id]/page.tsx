"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { 
  X, 
  Clock, 
  Flag, 
  ChevronRight, 
  ChevronLeft, 
  AlertCircle, 
  CheckCircle2, 
  Download, 
  RotateCcw, 
  ArrowRight,
  TrendingUp,
  Award,
  Hash,
  Layout
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { InlineMath, BlockMath } from "react-katex";
import "katex/dist/katex.min.css";
import { cn } from "@/lib/utils";

import { useParams, useSearchParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

interface ExamQuestion {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  topic: string;
}

interface ExamData {
  id: string;
  title: string;
  totalQuestions: number;
  timeLimit: number;
  sections: string[];
  questions: ExamQuestion[];
}

export default function MockExamPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const examId = params.id as string;
  const moduleId = searchParams.get("moduleId");

  const [exam, setExam] = useState<ExamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [timeLeft, setTimeLeft] = useState(60 * 60);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ── Load exam from Firestore ────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        if (moduleId) {
          const snap = await getDoc(doc(db, "modules", moduleId, "exams", examId));
          if (snap.exists()) {
            const data = snap.data();
            const questions = data.questions || [];
            const sections = Array.from(new Set(questions.map((q: any) => q.topic))).filter(Boolean) as string[];

            const examData: ExamData = {
              id: snap.id,
              title: data.topic,
              totalQuestions: questions.length,
              timeLimit: questions.length * 2 * 60, // 2 mins per question
              sections: sections.length > 0 ? sections : ["General"],
              questions: questions,
            };
            setExam(examData);
            setTimeLeft(examData.timeLimit);
          } else {
            setError("Exam not found.");
          }
        } else {
          setError("Exam not found.");
        }
      } catch (e: any) {
        setError(e.message || "Failed to load exam.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [examId, moduleId]);

  useEffect(() => {
    if (isSubmitted || !exam) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) {
            handleSubmit();
            return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = "Exam in progress — your progress may be lost!";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
        clearInterval(timer);
        window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isSubmitted, exam]);

  const handleSubmit = () => {
    setIsSubmitted(true);
    setShowConfirm(false);
  };

  const handleNext = () => {
    if (exam) {
        setCurrentIndex(prev => Math.min(prev + 1, exam.totalQuestions - 1));
    }
  };
  const handlePrev = () => setCurrentIndex(prev => Math.max(prev - 1, 0));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6">
        <p className="text-red-500 font-bold text-xl">{error || "Exam not found"}</p>
        <Link href={`/student/modules/${moduleId || ""}`} className="px-6 py-3 bg-primary text-white font-black rounded-base">
          Back to Modules
        </Link>
      </div>
    );
  }

  const currentQuestion = exam.questions[currentIndex];
  const isAnswered = answers[currentQuestion.id] !== undefined && answers[currentQuestion.id] !== "";
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? `${h}:` : ""}${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const timerColor = timeLeft < 300 ? "text-red-500 bg-red-50" : timeLeft < 600 ? "text-amber-500 bg-amber-50" : "text-text-secondary bg-slate-100";

  const score = Object.keys(answers).filter(qId => {
      const q = exam.questions.find(x => x.id === qId);
      return q && answers[qId] === q.correctIndex;
  }).length;
  const accuracy = Math.round((score / exam.totalQuestions) * 100);
  const timeTaken = exam.timeLimit - timeLeft;
  
  if (isSubmitted) {
     return (
        <div className="max-w-6xl mx-auto py-20 px-6 animate-in fade-in zoom-in duration-700">
            <header className="text-center space-y-4 mb-20">
                <div className="inline-flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-full font-black uppercase tracking-widest text-sm shadow-xl shadow-primary/20">
                    <Award size={20} /> Exam Finalized
                </div>
                <h1 className="text-6xl font-black italic tracking-tighter underline decoration-primary decoration-8 uppercase">{exam.title}</h1>
                <p className="text-2xl text-text-secondary font-bold">Your Performance Report Card</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-20">
                <div className="bg-white p-12 rounded-xl shadow-2xl border border-slate-100 flex flex-col items-center justify-center text-center space-y-6">
                    <p className="text-sm font-black uppercase tracking-widest text-text-secondary">Grade Estimate</p>
                    <div className={cn("text-9xl font-black italic", accuracy >= 80 ? "text-primary" : accuracy >= 50 ? "text-amber-500" : "text-red-500")}>
                        {accuracy >= 80 ? "A+" : accuracy >= 70 ? "B" : accuracy >= 60 ? "C" : accuracy >= 50 ? "D" : "F"}
                    </div>
                </div>

                <div className="lg:col-span-3 bg-white p-10 rounded-xl border border-slate-100 shadow-sm space-y-10">
                    <div className="grid grid-cols-3 gap-8 text-center border-b pb-10">
                        <div className="space-y-2">
                             <p className="text-xs font-black uppercase tracking-widest text-text-secondary">Raw Score</p>
                             <p className="text-4xl font-black italic">{score} / {exam.totalQuestions}</p>
                        </div>
                        <div className="space-y-2">
                             <p className="text-xs font-black uppercase tracking-widest text-text-secondary">Time Taken</p>
                             <p className="text-4xl font-black italic">{formatTime(timeTaken)}</p>
                        </div>
                        <div className="space-y-2">
                             <p className="text-xs font-black uppercase tracking-widest text-text-secondary">Accuracy</p>
                             <p className={cn("text-4xl font-black italic", accuracy >= 50 ? "text-emerald-500" : "text-red-500")}>{accuracy}%</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h3 className="text-xl font-black uppercase italic tracking-tight">Section Mastery</h3>
                        <div className="space-y-4">
                            {exam.sections.map(s => {
                                const sectionQs = exam.questions.filter(q => q.topic === s);
                                const sectionScore = sectionQs.filter(q => answers[q.id] === q.correctIndex).length;
                                const sectionAcc = Math.round((sectionScore / (sectionQs.length || 1)) * 100);
                                return (
                                <div key={s} className="space-y-2">
                                    <div className="flex justify-between items-center px-1">
                                        <span className="text-sm font-black uppercase tracking-widest text-text-secondary">{s}</span>
                                        <span className="text-sm font-black text-primary">{sectionAcc}%</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary" style={{ width: `${sectionAcc}%` }} />
                                    </div>
                                </div>
                            )})}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-6">
                 <button className="flex-1 py-6 bg-primary text-white font-black text-2xl rounded-base hover:shadow-2xl hover:shadow-primary/30 transition-all active:scale-95 flex items-center justify-center gap-4 shadow-xl">
                    <Download size={24} /> Download Results PDF
                 </button>
                 <button 
                    onClick={() => window.location.reload()}
                    className="flex-1 py-6 border-4 border-text-primary text-text-primary font-black text-2xl rounded-base hover:bg-text-primary hover:text-white transition-all flex items-center justify-center gap-4"
                >
                    <RotateCcw size={24} /> Reattempt Exam
                 </button>
            </div>
        </div>
     );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFF] flex flex-col pt-20">
      {/* Fixed Top Bar */}
      <header className="fixed top-0 left-0 right-0 h-20 bg-slate-900 text-white z-50 flex items-center justify-between px-10 shadow-2xl">
          <div className="flex items-center gap-8">
              <h1 className="font-black italic text-xl tracking-tighter uppercase border-r border-slate-700 pr-8">{exam.title}</h1>
              <div className="flex items-center gap-4">
                <div className={cn("px-6 py-2 rounded-full font-black flex items-center gap-3 text-lg border-2 border-transparent transition-all", timerColor)}>
                    <Clock size={20} /> {formatTime(timeLeft)}
                </div>
                <div className="text-xs font-black uppercase tracking-widest text-slate-400">
                    <span className="text-white text-lg pr-1 font-black">{currentIndex + 1}</span> / {exam.totalQuestions} Questions
                </div>
              </div>
          </div>

          <div className="flex items-center gap-4">
              <button 
                onClick={() => setShowConfirm(true)}
                className="px-10 py-3 bg-primary hover:bg-white hover:text-primary text-white font-black uppercase tracking-widest rounded-base transition-all shadow-xl shadow-primary/20"
              >
                Submit Exam
              </button>
          </div>
      </header>

      {/* Internal Layout */}
      <div className="flex-1 flex gap-10 p-10 max-w-[1700px] mx-auto w-full">
          {/* Main Question Area (75%) */}
          <main className="w-full lg:w-[75%] space-y-8 animate-in fade-in duration-500">
              <div className="bg-white p-12 rounded-xl shadow-xl border border-slate-100 space-y-12 min-h-[600px] flex flex-col">
                  <div className="flex justify-between items-start">
                    <div className="space-y-4 flex-1">
                        <div className="flex items-center gap-4">
                            <span className="px-4 py-1 bg-primary text-white font-black uppercase text-[10px] tracking-widest rounded-full">Section: {currentQuestion.topic}</span>
                             <button 
                                onClick={() => setFlagged(prev => ({ ...prev, [currentQuestion.id]: !prev[currentQuestion.id] }))}
                                className={cn(
                                    "px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border-2 transition-all flex items-center gap-2",
                                    flagged[currentQuestion.id] ? "bg-amber-100 text-amber-600 border-amber-200" : "border-slate-100 text-slate-400 hover:border-amber-200 hover:text-amber-500"
                                )}
                             >
                                <Flag size={12} fill={flagged[currentQuestion.id] ? "currentColor" : "none"} /> {flagged[currentQuestion.id] ? "Flagged" : "Flag Question"}
                             </button>
                        </div>
                        <h2 className="text-3xl font-extrabold tracking-tight leading-relaxed text-text-primary">
                            <span className="text-primary pr-4 italic font-black">Q{currentIndex + 1}.</span>
                            <span dangerouslySetInnerHTML={{ 
                                __html: currentQuestion.text.replace(/\$(.*?)\$/g, (match, p1) => `<span class='font-bold italic text-primary'>${p1}</span>`) 
                            }} />
                        </h2>
                    </div>
                  </div>

                  {/* Input Selector (MCQ / Short Answer Tab for some) */}
                  <div className="grid grid-cols-1 gap-4 pt-10">
                          {currentQuestion.options.map((option, idx) => (
                              <button 
                                key={idx}
                                onClick={() => setAnswers(prev => ({ ...prev, [currentQuestion.id]: idx }))}
                                className={cn(
                                    "p-6 rounded-base border-2 font-bold text-left transition-all flex items-center gap-6 group",
                                    answers[currentQuestion.id] === idx 
                                        ? "bg-primary border-primary text-white shadow-xl shadow-primary/20 scale-[1.02]" 
                                        : "bg-white border-slate-100 hover:border-primary hover:bg-primary/5 hover:scale-[1.01]"
                                )}
                              >
                                <div className={cn(
                                    "w-8 h-8 rounded-full border-2 flex items-center justify-center font-black",
                                    answers[currentQuestion.id] === idx ? "border-white bg-white/20" : "border-slate-100 group-hover:border-primary"
                                )}>
                                    {String.fromCharCode(65 + idx)}
                                </div>
                                <span className="text-lg tracking-tight">{option}</span>
                              </button>
                          ))}
                  </div>

                  <div className="flex justify-between pt-12 mt-auto border-t border-slate-50">
                     <button 
                        onClick={handlePrev}
                        disabled={currentIndex === 0}
                        className="px-8 py-4 border-2 rounded-base font-black uppercase text-sm tracking-widest flex items-center gap-3 hover:bg-slate-50 disabled:opacity-30 transition-all"
                     >
                        <ChevronLeft size={20} /> Previous
                     </button>
                     <button 
                        onClick={handleNext}
                        disabled={currentIndex === exam.totalQuestions - 1}
                        className="px-12 py-4 bg-slate-900 text-white font-black uppercase text-sm tracking-widest rounded-base hover:bg-primary transition-all flex items-center gap-3 shadow-lg"
                     >
                        Next <ChevronRight size={20} />
                     </button>
                  </div>
              </div>
          </main>

          {/* Right Navigation Sidebar (25%) */}
          <aside className="hidden lg:flex flex-col w-[25%] space-y-8 sticky top-32 h-max">
              <div className="bg-white p-8 rounded-xl border border-slate-100 shadow-xl space-y-8">
                  <div className="flex items-center gap-3">
                      <Layout size={20} className="text-primary" />
                      <h3 className="text-sm font-black uppercase tracking-widest">Question Matrix</h3>
                  </div>

                  <div className="grid grid-cols-5 gap-3">
                      {exam.questions.map((q, i) => {
                          const isCur = i === currentIndex;
                          const isAns = answers[q.id] !== undefined && answers[q.id] !== "";
                          const isFlag = flagged[q.id];

                          return (
                              <button 
                                key={q.id}
                                onClick={() => setCurrentIndex(i)}
                                className={cn(
                                    "w-10 h-10 rounded-base border-2 flex items-center justify-center font-black text-xs transition-all",
                                    isCur ? "border-primary bg-primary/10 text-primary scale-110 shadow-lg shadow-black/5" :
                                    isFlag ? "bg-amber-100 border-amber-400 text-amber-600" :
                                    isAns ? "bg-primary border-primary text-white" :
                                    "bg-white border-slate-100 text-slate-300 hover:border-slate-200"
                                )}
                              >
                                {i + 1}
                              </button>
                          );
                      })}
                  </div>

                  <div className="pt-8 mt-8 border-t border-slate-50 space-y-4">
                      <div className="flex justify-between items-center font-black text-[10px] uppercase tracking-widest text-slate-400">
                          <span>Status Summary</span>
                          <span>Progress</span>
                      </div>
                      <div className="space-y-3">
                          <div className="flex items-center gap-3">
                               <div className="w-3 h-3 rounded-full bg-primary shadow-sm" />
                               <span className="text-sm font-bold text-text-secondary">{Object.keys(answers).length} Answered</span>
                          </div>
                           <div className="flex items-center gap-3">
                               <div className="w-3 h-3 rounded-full bg-amber-400 shadow-sm" />
                               <span className="text-sm font-bold text-text-secondary">{Object.keys(flagged).filter(k => flagged[k]).length} Flagged</span>
                          </div>
                           <div className="flex items-center gap-3 text-slate-300 italic">
                               <div className="w-3 h-3 rounded-full bg-slate-100" />
                               <span className="text-sm font-bold">{exam.totalQuestions - Object.keys(answers).length} Remaining</span>
                          </div>
                      </div>
                  </div>
              </div>
          </aside>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
                 <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowConfirm(false)}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                 />
                 <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white p-12 rounded-xl shadow-2xl max-w-lg w-full relative z-[70] text-center space-y-8 border-4 border-slate-100"
                 >
                    <div className="w-24 h-24 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto ring-8 ring-primary/5">
                        <AlertCircle size={48} />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-3xl font-black italic tracking-tighter">Ready to Submit?</h3>
                        <p className="text-lg text-text-secondary font-medium">You have answered <span className="text-primary font-black">{Object.keys(answers).length}</span> out of <span className="text-primary font-black">{exam.totalQuestions}</span> questions. Action cannot be undone.</p>
                    </div>
                    <div className="flex gap-4 pt-4">
                        <button 
                            onClick={() => setShowConfirm(false)}
                            className="flex-1 py-4 border-2 border-slate-100 rounded-base font-black uppercase text-sm tracking-widest hover:bg-slate-50 transition-all font-black"
                        >Cancel</button>
                        <button 
                            onClick={handleSubmit}
                            className="flex-[2] py-4 bg-primary text-white font-black uppercase text-sm tracking-widest rounded-base hover:shadow-xl hover:shadow-primary/30 transition-all shadow-lg active:scale-95"
                        >Seal & Submit</button>
                    </div>
                 </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
}
