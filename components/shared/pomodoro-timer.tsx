"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  Timer, 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Coffee, 
  Brain, 
  Bell,
  Maximize2,
  Minimize2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function PomodoroTimer() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<"work" | "break">("work");

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0) {
      const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
      audio.play().catch(() => console.log("Audio play blocked"));
      
      if (mode === "work") {
        setMode("break");
        setTimeLeft(5 * 60);
      } else {
        setMode("work");
        setTimeLeft(25 * 60);
      }
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, mode]);

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === "work" ? 25 * 60 : 5 * 60);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const progress = ((mode === "work" ? 25 * 60 : 5 * 60) - timeLeft) / (mode === "work" ? 25 * 60 : 5 * 60) * 100;

  return (
    <>
      <button 
        onClick={() => { setIsOpen(true); setIsMinimized(false); }}
        className={cn(
          "fixed bottom-8 left-8 w-14 h-14 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all z-50",
          isOpen && "hidden"
        )}
      >
        <Timer size={24} />
        {isActive && <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-ping" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={cn(
               "fixed bottom-8 left-8 z-50 transition-all duration-300",
               isMinimized ? "w-20" : "w-72"
            )}
          >
            <div className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden shadow-black/10">
                <header className="p-4 bg-slate-50 dark:bg-slate-800 flex justify-between items-center border-b">
                     <div className="flex items-center gap-2">
                        {mode === "work" ? <Brain size={16} className="text-primary"/> : <Coffee size={16} className="text-emerald-500"/>}
                        {!isMinimized && <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary">{mode === "work" ? "Study Session" : "Short Break"}</span>}
                     </div>
                     <div className="flex items-center gap-1">
                        <button onClick={() => setIsMinimized(!isMinimized)} className="p-1 hover:bg-white rounded-full transition-colors">
                            {isMinimized ? <Maximize2 size={14}/> : <Minimize2 size={14}/>}
                        </button>
                        <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white rounded-full transition-colors text-red-500"><X size={14}/></button>
                     </div>
                </header>

                <div className="p-6 space-y-6">
                    <div className="relative flex justify-center">
                        <div className="w-32 h-32 rounded-full border-4 border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center relative overflow-hidden">
                            <div 
                                className={cn(
                                    "absolute inset-0 bg-primary/10 transition-all duration-1000 origin-bottom",
                                    mode === "break" && "bg-emerald-500/10"
                                )}
                                style={{ height: `${progress}%` }}
                            />
                            <span className={cn(
                                "text-3xl font-black italic relative z-10",
                                mode === "work" ? "text-primary" : "text-emerald-500"
                            )}>{formatTime(timeLeft)}</span>
                        </div>
                    </div>

                    {!isMinimized && (
                        <>
                            <div className="flex justify-center gap-4">
                                <button 
                                    onClick={toggleTimer}
                                    className={cn(
                                        "w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg active:scale-90 transition-all",
                                        isActive ? "bg-slate-900" : "bg-primary"
                                    )}
                                >
                                    {isActive ? <Pause size={20}/> : <Play size={20} className="ml-1"/>}
                                </button>
                                <button 
                                    onClick={resetTimer}
                                    className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 hover:text-primary transition-all border"
                                >
                                    <RotateCcw size={20}/>
                                </button>
                            </div>
                            
                            <div className="flex justify-center gap-2">
                                <button 
                                    onClick={() => { setMode("work"); setTimeLeft(25 * 60); setIsActive(false); }}
                                    className={cn(
                                        "px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border transition-all",
                                        mode === "work" ? "bg-primary text-white border-primary" : "border-slate-100 text-slate-400"
                                    )}
                                >Work</button>
                                <button 
                                    onClick={() => { setMode("break"); setTimeLeft(5 * 60); setIsActive(false); }}
                                    className={cn(
                                        "px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border transition-all",
                                        mode === "break" ? "bg-emerald-500 text-white border-emerald-500" : "border-slate-100 text-slate-400"
                                    )}
                                >Break</button>
                            </div>
                        </>
                    )}
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
