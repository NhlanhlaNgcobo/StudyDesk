"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { 
  X, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  Flame, 
  Star, 
  Zap, 
  Award, 
  Activity,
  History,
  Info,
  ExternalLink,
  Target,
  Brain,
  Hash
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// --- Mock Flashcards Data ---

const FLASHCARDS = [
  { id: "1", question: "What is the primary formula for the **Chain Rule** in differentiation?", answer: "$$\\frac{dy}{dx} = \\frac{dy}{du} \\cdot \\frac{du}{dx}$$", topic: "Calculus", difficulty: "Medium" },
  { id: "2", question: "Define the **Marginal Propensity to Consume (MPC)**.", answer: "The ratio of the change in consumption to the change in income that caused it.\\n\\n$$MPC = \\frac{\\Delta C}{\\Delta Y}$$", topic: "Macroeconomics", difficulty: "Hard" },
  { id: "3", question: "Identify the product of ethene hydration.", answer: "Ethanol ($CH_3CH_2OH$)", topic: "Organic Chemistry", difficulty: "Easy" },
  { id: "4", question: "What does the **SM-2 Algorithm** calculate?", answer: "Optimal intervals for spaced repetition based on user confidence (1-5 range).", topic: "Cognitive Science", difficulty: "Medium" },
];

// --- Sub-components ---

export default function FlashcardsPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [completed, setCompleted] = useState<number[]>([]);
  const [isReviewFinished, setIsReviewFinished] = useState(false);
  const [confidence, setConfidence] = useState<number | null>(null);

  const currentCard = FLASHCARDS[currentIndex];

  const handleConfidence = (level: number) => {
    setConfidence(level);
    // Simulate SM-2 logic logging
    console.log(`SM-2 Logic: Logging confidence level ${level} for card ${currentCard.id}`);
    
    setTimeout(() => {
        if (currentIndex < FLASHCARDS.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setIsFlipped(false);
            setConfidence(null);
        } else {
            setIsReviewFinished(true);
        }
    }, 400);
  };

  if (isReviewFinished) {
      return (
          <div className="max-w-4xl mx-auto py-20 px-6 animate-in fade-in zoom-in duration-700">
               <header className="text-center space-y-4 mb-20">
                    <div className="inline-flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-full font-black uppercase tracking-widest text-sm shadow-xl shadow-primary/20">
                        <Award size={20} /> Cognitive Audit Done
                    </div>
                    <h1 className="text-6xl font-black italic tracking-tighter underline decoration-primary decoration-8 uppercase">Memory Bank Synchronized</h1>
                    <p className="text-2xl text-text-secondary font-bold">Algorithms updated. Next review scheduled for 09:00 AM Tomorrow.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                     <div className="bg-white p-10 rounded-xl border-4 border-slate-100 shadow-xl flex flex-col items-center justify-center text-center space-y-4">
                         <Star size={40} className="text-orange-400" />
                         <p className="text-xs font-black uppercase tracking-widest text-slate-400">Mastery Retained</p>
                         <h3 className="text-4xl font-black italic">85%</h3>
                     </div>
                     <div className="bg-white p-10 rounded-xl border-4 border-slate-100 shadow-xl flex flex-col items-center justify-center text-center space-y-4">
                         <Zap size={40} className="text-primary" />
                         <p className="text-xs font-black uppercase tracking-widest text-slate-400">Total Cards</p>
                         <h3 className="text-4xl font-black italic">{FLASHCARDS.length} Nodes</h3>
                     </div>
                     <div className="bg-white p-10 rounded-xl border-4 border-slate-100 shadow-xl flex flex-col items-center justify-center text-center space-y-4">
                         <Activity size={40} className="text-emerald-500" />
                         <p className="text-xs font-black uppercase tracking-widest text-slate-400">Efficiency Gain</p>
                         <h3 className="text-4xl font-black italic">+24%</h3>
                     </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-6">
                    <button 
                        onClick={() => window.location.reload()}
                        className="flex-1 py-6 bg-primary text-white font-black text-2xl rounded-base flex items-center justify-center gap-4 hover:shadow-2xl hover:shadow-primary/30 transition-all active:scale-95"
                    >
                        <RotateCcw size={28} /> Replay Session
                    </button>
                    <Link 
                        href="/student/dashboard"
                        className="flex-1 py-6 border-4 border-slate-900 text-slate-900 font-black text-2xl rounded-base flex items-center justify-center gap-4 hover:bg-slate-900 hover:text-white transition-all"
                    >
                        Return Home <ExternalLink size={28} />
                    </Link>
                </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFF] flex flex-col">
      {/* Header Container */}
      <header className="h-20 bg-white border-b sticky top-0 z-50 flex items-center justify-between px-10 shadow-2xl">
          <div className="flex items-center gap-6">
              <Link href="/student/modules/1" className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X/></Link>
              <div>
                  <h2 className="text-xl font-black italic tracking-tighter uppercase leading-none mb-1">CHM201: Organic Basics</h2>
                  <div className="flex items-center gap-4">
                        <div className="h-1.5 w-32 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-primary transition-all duration-500 shadow-[0_0_10px_#4DA6FF]" 
                                style={{ width: `${((currentIndex + 1) / FLASHCARDS.length) * 100}%` }}
                            />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Node {currentIndex + 1} of {FLASHCARDS.length}</span>
                  </div>
              </div>
          </div>
          
          <div className="flex items-center gap-6">
               <div className="flex items-center gap-2 bg-orange-50 text-orange-500 px-6 py-2 rounded-full border border-orange-100 font-black italic tracking-tighter">
                   <Flame size={18} fill="currentColor"/> 7 DAY STREAK
               </div>
               <button className="px-6 py-2 bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest rounded-base hover:bg-primary shadow-xl transition-all">Review Mode: SM-2</button>
          </div>
      </header>

      {/* Main Review Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 pt-12 relative overflow-hidden">
          {/* Animated Background Gradients */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 blur-[120px] rounded-full" />
          
          <div className="w-full max-w-[800px] flex flex-col items-center space-y-12 relative z-10">
              
              {/* Flashcard Container */}
              <div 
                className="w-full h-[480px] perspective-1000 group cursor-pointer"
                onClick={() => setIsFlipped(!isFlipped)}
              >
                  <motion.div 
                    initial={false}
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    className="w-full h-full relative preserve-3d"
                  >
                      {/* Front: Question */}
                      <div className="absolute inset-0 backface-hidden bg-white rounded-3xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] border-8 border-slate-50 flex flex-col p-12 space-y-10 group-hover:border-primary/20 transition-colors">
                            <div className="flex justify-between items-start">
                                <div className="px-4 py-1.5 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">Mastery Node</div>
                                <div className="flex items-center gap-2">
                                     <Hash size={14} className="text-primary"/>
                                     <span className="text-sm font-black uppercase tracking-widest text-slate-400">{currentCard.topic}</span>
                                </div>
                            </div>
                            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8">
                                <div className="p-4 bg-primary/5 text-primary rounded-full ring-8 ring-primary/5"><Brain size={48} /></div>
                                <h3 className="text-4xl font-black italic tracking-tighter leading-tight uppercase underline decoration-primary decoration-4 px-10">
                                    <span dangerouslySetInnerHTML={{ 
                                        __html: currentCard.question.replace(/\*\*(.*?)\*\*/g, '<span class="text-primary">$1</span>') 
                                    }} />
                                </h3>
                            </div>
                            <div className="text-center pt-8 border-t border-slate-50">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 animate-pulse">Click card to reveal deep knowledge</p>
                            </div>
                      </div>

                      {/* Back: Answer */}
                      <div 
                        className="absolute inset-0 backface-hidden bg-slate-900 text-white rounded-3xl shadow-2xl border-8 border-slate-800 flex flex-col p-12 space-y-10"
                        style={{ transform: "rotateY(180deg)" }}
                      >
                             <div className="flex justify-between items-start">
                                <div className="px-4 py-1.5 bg-primary text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">Verified Explanation</div>
                                <div className="text-sm font-black uppercase tracking-widest text-slate-500">Correct Response</div>
                            </div>
                            <div className="flex-1 flex flex-col items-center justify-center text-center">
                                <div className="text-3xl font-bold leading-relaxed tracking-tight text-slate-200">
                                    <span dangerouslySetInnerHTML={{ 
                                        __html: currentCard.answer
                                            .replace(/\$\$(.*?)\$\$/g, '<div class="py-10 text-primary scale-150 transform">$$1</div>')
                                            .replace(/\$(.*?)\$/g, '<span class="text-primary italic font-black">$$1</span>')
                                            .replace(/\n/g, '<br/>')
                                    }} />
                                </div>
                            </div>
                             <div className="text-center pt-8 border-t border-slate-800">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Node analysis localized. Select confidence below.</p>
                            </div>
                      </div>
                  </motion.div>
              </div>

              {/* Confidence Rating Buttons (SM-2 Logic) */}
              <AnimatePresence>
                {isFlipped && (
                  <motion.div 
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full space-y-8 animate-in"
                  >
                        <div className="text-center">
                            <h4 className="text-xl font-black italic uppercase tracking-tighter decoration-primary decoration-2 underline">Rate Confidence (Algorithm Training)</h4>
                        </div>
                        <div className="grid grid-cols-5 gap-4">
                             {[1, 2, 3, 4, 5].map(level => (
                                 <button 
                                    key={level}
                                    onClick={() => handleConfidence(level)}
                                    className={cn(
                                        "flex flex-col items-center gap-3 p-6 rounded-2xl border-4 transition-all hover:scale-110 active:scale-95 group shadow-xl shadow-black/5",
                                        level === 1 ? "bg-red-50 border-red-200 text-red-500 hover:bg-red-500 hover:text-white" :
                                        level === 5 ? "bg-emerald-50 border-emerald-200 text-emerald-500 hover:bg-emerald-500 hover:text-white" :
                                        "bg-white border-slate-100 text-slate-400 hover:bg-primary hover:text-white hover:border-primary"
                                    )}
                                 >
                                     <span className="text-3xl font-black italic">{level}</span>
                                     <span className="text-[8px] font-black uppercase tracking-widest opacity-60 group-hover:opacity-100">
                                         {level === 1 ? "Again" : level === 2 ? "Hard" : level === 3 ? "Good" : level === 4 ? "Easy" : "Mastered"}
                                     </span>
                                 </button>
                             ))}
                        </div>
                  </motion.div>
                )}
              </AnimatePresence>
          </div>
      </main>

      {/* Global Style for 3D Flashcard */}
      <style jsx global>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
      `}</style>
    </div>
  );
}
