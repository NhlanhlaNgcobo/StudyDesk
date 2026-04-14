"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
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
  Hash
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { InlineMath, BlockMath } from "react-katex";
import confetti from "canvas-confetti";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import "katex/dist/katex.min.css";
import { cn } from "@/lib/utils";

// --- Mock Questions: Organic Chemistry ---

const QUIZ_DATA = {
  id: "1",
  moduleName: "CHM201: Organic Chemistry I",
  questions: [
    {
      id: "q1",
      text: "What is the primary product of the reaction between ethene and water in the presence of an acid catalyst?",
      options: ["Ethane", "Ethanol", "Ethanoic Acid", "Ethyne"],
      correctIndex: 1,
      explanation: "This is an acid-catalyzed hydration reaction where ethene (alkene) reacts with water to form ethanol (alcohol).",
      topic: "Alkenes"
    },
    {
      id: "q2",
      text: "Represent the general formula for a saturated alkane:",
      options: ["$C_nH_{2n}$", "$C_nH_{2n+2}$", "$C_nH_{2n-2}$", "$C_nH_n$"],
      correctIndex: 1,
      explanation: "Saturated alkanes follow the general formula $C_nH_{2n+2}$, meaning for every carbon atom, there are twice as many plus two hydrogen atoms.",
      topic: "Hydrocarbons"
    },
    {
      id: "q3",
      text: "Identify the name of the following structure in IUPAC nomenclature:",
      hasImage: true,
      options: ["2-Methylpropane", "Butane", "2-Methylbutane", "Isopentane"],
      correctIndex: 0,
      explanation: "The longest chain has 3 carbons (propane) with a methyl group on the second carbon.",
      topic: "IUPAC Naming"
    },
    {
      id: "q4",
      text: "Which of the following is a tertiary alcohol?",
      options: ["Ethanol", "2-Propanol", "2-Methyl-2-propanol", "1-Butanol"],
      correctIndex: 2,
      explanation: "2-Methyl-2-propanol has the OH group attached to a carbon bonded to three other carbons.",
      topic: "Alcohols"
    },
    {
      id: "q5",
      text: "Determine the formal charge of Carbon in the following structure:",
      options: ["0", "+1", "-1", "+2"],
      correctIndex: 0,
      explanation: "Neutral carbon typically has 4 valence electrons and forms 4 bonds.",
      topic: "Bonding"
    },
    {
        id: "q6",
        text: "What is the hybridization of carbon in methane ($CH_4$)?",
        options: ["sp", "sp2", "sp3", "sp3d"],
        correctIndex: 2,
        explanation: "In methane, the carbon atom is bonded to 4 hydrogen atoms via single sigma bonds, leading to $sp^3$ hybridization.",
        topic: "Hybridization"
      },
      {
        id: "q7",
        text: "Which functional group is present in the molecule $CH_3COCH_3$?",
        options: ["Aldehyde", "Ketone", "Carboxylic Acid", "Ester"],
        correctIndex: 1,
        explanation: "The presence of a carbonyl group ($C=O$) between two alkyl groups indicates a ketone (Propanone).",
        topic: "Functional Groups"
      },
      {
        id: "q8",
        text: "Markownikov's rule applies to which of the following?",
        options: ["Addition to symmetrical alkenes", "Addition to unsymmetrical alkenes", "Substitution reactions", "Elimination reactions"],
        correctIndex: 1,
        explanation: "Markownikov's rule predicts settings of addition in unsymmetrical alkenes.",
        topic: "Reaction Mechanisms"
      },
      {
        id: "q9",
        text: "What is the product of the oxidation of a primary alcohol using PCC?",
        options: ["Aldehyde", "Ketone", "Carboxylic Acid", "Alkene"],
        correctIndex: 0,
        explanation: "PCC is a mild oxidizing agent that stops at the aldehyde stage.",
        topic: "Redox"
      },
      {
        id: "q10",
        text: "Calculate the moles of $CO_2$ produced from 1 mole of methane combustion:",
        options: ["1 mol", "2 mol", "0.5 mol", "4 mol"],
        correctIndex: 0,
        explanation: "$CH_4 + 2O_2 \\to CO_2 + 2H_2O$. Ratio is 1:1.",
        topic: "Stoichiometry"
      }
  ]
};

// --- Sub-components ---

export default function QuizPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [answers, setAnswers] = useState<(number | null)[]>(new Array(QUIZ_DATA.questions.length).fill(null));
  const [isFinished, setIsFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [flagged, setFlagged] = useState<boolean[]>(new Array(QUIZ_DATA.questions.length).fill(false));

  const currentQuestion = QUIZ_DATA.questions[currentIndex];

  useEffect(() => {
    if (isFinished) return;
    if (timeLeft === 0) {
        handleNext();
        return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, isFinished]);

  const handleSelect = (idx: number) => {
    if (selectedIdx !== null) return; // Locked after selection
    setSelectedIdx(idx);
    setShowExplanation(true);
    
    const newAnswers = [...answers];
    newAnswers[currentIndex] = idx;
    setAnswers(newAnswers);

    if (idx === currentQuestion.correctIndex) {
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ["#4DA6FF", "#10B981", "#FFFFFF"]
        });
    }
  };

  const handleNext = () => {
    if (currentIndex < QUIZ_DATA.questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setSelectedIdx(null);
        setShowExplanation(false);
        setTimeLeft(60);
    } else {
        setIsFinished(true);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
        setSelectedIdx(answers[currentIndex - 1]);
        setShowExplanation(answers[currentIndex - 1] !== null);
    }
  };

  const toggleFlag = () => {
    const newFlags = [...flagged];
    newFlags[currentIndex] = !newFlags[currentIndex];
    setFlagged(newFlags);
  };

  const score = answers.filter((a, i) => a === QUIZ_DATA.questions[i].correctIndex).length;
  const percent = Math.round((score / QUIZ_DATA.questions.length) * 100);

  if (isFinished) {
    return (
        <div className="max-w-4xl mx-auto py-12 px-6 animate-in fade-in zoom-in duration-500">
            <header className="text-center space-y-4 mb-16">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-xs font-black uppercase tracking-widest border border-emerald-100">
                   <Award size={16} /> Quiz Completed
                </div>
                <h1 className="text-5xl font-black italic tracking-tighter underline decoration-primary decoration-4 uppercase">Academic Audit: Success!</h1>
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
                        <div className="text-2xl font-black text-primary italic underline decoration-2">{score} / {QUIZ_DATA.questions.length}</div>
                     </div>
                     <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-1">Time Invested</p>
                            <p className="font-extrabold text-lg">04m 32s</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-1">Avg per Answer</p>
                            <p className="font-extrabold text-lg">27 Seconds</p>
                        </div>
                     </div>
                     <div className="space-y-3 pt-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Weak Topic Chips</p>
                        <div className="flex flex-wrap gap-2">
                             {["Stoichiometry", "Mechanisms"].map(tag => (
                                 <div key={tag} className="px-3 py-1 bg-red-50 text-red-500 border border-red-100 rounded-full text-[10px] font-black uppercase tracking-widest leading-none">
                                    <Hash size={12}/> {tag}
                                 </div>
                             ))}
                        </div>
                     </div>
                </div>
            </div>

            <section className="space-y-6 mb-16">
                 <h2 className="text-2xl font-black tracking-tight underline decoration-primary decoration-2">Per-Question Breakdown</h2>
                 <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                    {QUIZ_DATA.questions.map((q, i) => (
                        <div key={q.id} className="p-6 flex items-center justify-between group hover:bg-slate-50 transition-colors border-b last:border-0">
                            <div className="flex items-center gap-6">
                                <div className={cn(
                                    "w-10 h-10 rounded-base flex items-center justify-center font-black",
                                    answers[i] === q.correctIndex ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
                                )}>
                                    {answers[i] === q.correctIndex ? <CheckCircle2 size={24}/> : <XCircle size={24}/>}
                                </div>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Question {i+1}</p>
                                    <p className="font-bold text-sm tracking-tight text-text-secondary max-w-md truncate">{q.text.replace(/\$/g, '')}</p>
                                </div>
                            </div>
                            <div className="px-3 py-1 bg-slate-50 border rounded-full text-[10px] font-black uppercase tracking-widest text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">Review Item</div>
                        </div>
                    ))}
                 </div>
            </section>

            <div className="flex flex-col sm:flex-row gap-4">
                <button 
                    onClick={() => window.location.reload()}
                    className="flex-1 py-5 bg-primary text-white font-black text-xl rounded-base flex items-center justify-center gap-3 hover:shadow-2xl hover:shadow-primary/30 active:scale-95 transition-all"
                >
                    <RotateCcw size={24} /> Retry Attempt
                </button>
                <Link 
                    href="/student/modules/1"
                    className="flex-1 py-5 border-2 border-text-primary text-text-primary font-black text-xl rounded-base flex items-center justify-center gap-3 hover:bg-text-primary hover:text-white transition-all"
                >
                    <BookOpen size={24} /> Back to Module
                </Link>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFF] flex flex-col pb-32">
      {/* Quiz Header */}
      <header className="h-20 bg-white border-b sticky top-0 z-50 flex items-center justify-between px-6 md:px-12">
        <div className="flex items-center gap-6">
            <Link href="/student/modules/1" className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X/></Link>
            <div>
                <h2 className="text-sm font-black italic tracking-widest text-primary leading-none mb-1">{QUIZ_DATA.moduleName}</h2>
                <div className="flex items-center gap-4">
                    <div className="h-1.5 w-32 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-primary transition-all duration-500" 
                            style={{ width: `${((currentIndex + 1) / QUIZ_DATA.questions.length) * 100}%` }}
                        />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Q {currentIndex + 1} of {QUIZ_DATA.questions.length}</span>
                </div>
            </div>
        </div>

        <div className="flex items-center gap-4">
            <div className={cn(
                "px-4 py-2 rounded-full border-2 flex items-center gap-2 font-black italic tracking-tighter",
                timeLeft < 10 ? "border-red-400 bg-red-50 text-red-600 animate-pulse" : "border-slate-100 bg-slate-50 text-text-secondary"
            )}>
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

      {/* Main Container */}
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
                    {/* Topic Indicator */}
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <TrendingUp size={120} />
                    </div>

                    <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary italic leading-none">{currentQuestion.topic}</p>
                        <h3 className="text-2xl font-extrabold tracking-tight leading-relaxed">
                            <span dangerouslySetInnerHTML={{ 
                                __html: currentQuestion.text.replace(/\$(.*?)\$/g, (match, p1) => `<span class="italic text-primary">${p1}</span>`) 
                            }} />
                        </h3>
                    </div>

                    {currentQuestion.hasImage && (
                        <div className="w-full h-48 bg-slate-100 rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-slate-200 text-slate-400 group">
                             <TrendingUp size={48} className="group-hover:rotate-12 transition-transform" />
                             <span className="text-[10px] font-black uppercase tracking-widest mt-2 italic decoration-2 decoration-primary underline">Structural Diagram Placeholder</span>
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-4 pt-4">
                        {currentQuestion.options.map((option, idx) => {
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
                                        <div className={cn(
                                            "w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-black transition-all",
                                            !showResult && "border-slate-100 text-slate-400 group-hover:border-primary group-hover:text-primary",
                                            showResult && isCorrect && "border-emerald-500 bg-emerald-500 text-white",
                                            showResult && isSelected && !isCorrect && "border-red-500 bg-red-500 text-white"
                                        )}>
                                            {String.fromCharCode(65 + idx)}
                                        </div>
                                        <span dangerouslySetInnerHTML={{ 
                                            __html: option.replace(/\$(.*?)\$/g, (match, p1) => `<span class='italic'>${p1}</span>`) 
                                        }} />
                                    </div>
                                    {showResult && isCorrect && <CheckCircle2 className="text-emerald-500" size={24}/>}
                                    {showResult && isSelected && !isCorrect && <XCircle className="text-red-500" size={24}/>}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Explanation Card */}
                <AnimatePresence>
                    {showExplanation && (
                        <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl p-8 space-y-4 shadow-inner"
                        >
                            <div className="flex items-center gap-4 text-emerald-600">
                                <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-base flex items-center justify-center shadow-lg"><Lightbulb size={24} /></div>
                                <h4 className="text-lg font-black uppercase tracking-tighter italic">Deep Intelligence Reveal</h4>
                            </div>
                            <p className="text-text-secondary font-medium leading-relaxed" dangerouslySetInnerHTML={{ 
                                __html: currentQuestion.explanation.replace(/\$(.*?)\$/g, (match, p1) => `<span class='font-bold text-primary italic'>${p1}</span>`) 
                            }} />
                            <div className="pt-4 flex justify-end">
                                <button 
                                    onClick={handleNext}
                                    className="px-8 py-3 bg-primary text-white font-black text-sm uppercase tracking-widest rounded-base hover:shadow-xl hover:shadow-primary/30 transition-all flex items-center gap-2"
                                >
                                    {currentIndex === QUIZ_DATA.questions.length - 1 ? "Finish Quiz" : "Next Question"} <ArrowRight size={18}/>
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
          </AnimatePresence>
      </main>

      {/* Persistent Controls */}
      <footer className="fixed bottom-0 left-0 right-0 h-24 bg-white/80 backdrop-blur-md border-t flex items-center justify-center gap-8 px-6 z-40">
          <button 
            onClick={handlePrev} 
            disabled={currentIndex === 0}
            className="p-3 border-2 border-slate-100 rounded-base hover:bg-slate-50 disabled:opacity-30 transition-all"
          >
            <ChevronLeft size={24} />
          </button>
          
          <div className="flex gap-2">
            {QUIZ_DATA.questions.map((_, i) => (
                <button 
                  key={i} 
                  onClick={() => setCurrentIndex(i)}
                  className={cn(
                    "w-3 h-3 rounded-full transition-all border-2",
                    i === currentIndex ? "bg-primary border-primary scale-125 w-8" : 
                    answers[i] !== null ? (answers[i] === QUIZ_DATA.questions[i].correctIndex ? "bg-emerald-400 border-emerald-400" : "bg-red-400 border-red-400") :
                    "bg-slate-200 border-transparent hover:bg-slate-400"
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
