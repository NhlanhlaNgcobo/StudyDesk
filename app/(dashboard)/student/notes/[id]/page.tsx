"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  FileText, 
  ChevronRight, 
  Download, 
  Copy, 
  RefreshCw, 
  List, 
  Hash, 
  PlusCircle, 
  Type, 
  Highlighter, 
  Maximize2, 
  Info,
  ExternalLink,
  ChevronLeft
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { InlineMath, BlockMath } from "react-katex";
import "katex/dist/katex.min.css";
import { cn } from "@/lib/utils";

// --- Mock Content ---

const NOTE_CONTENT = {
  title: "Derivatives of Trigonometric Functions",
  module: "Calculus 101",
  tags: ["Calculus", "Differentiation", "Maths"],
  keyConcepts: [
    "Fundamental derivative rules for sin, cos, and tan.",
    "Application of the Chain Rule in trigonometric contexts.",
    "Limits as $x \to 0$ for trigonometric ratios."
  ],
  sections: [
    {
      id: "sec1",
      title: "1. Basic Trigger Identities",
      content: [
        "Before differentiating, recall the primary trigonometric identities.",
        "The most critical limit for derivates of trigonometric functions is:",
        "$$\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1$$",
        "This limit is essential for proving that $\\frac{d}{dx}[\\sin x] = \\cos x$."
      ]
    },
    {
      id: "sec2",
      title: "2. The Power Rule & Trig Functions",
      content: [
        "The Power Rule can be applied to trigonometric functions using the Chain Rule.",
        "General form of the Power Rule for $x^n$:",
        "$$\\frac{d}{dx}[x^n] = nx^{n-1}$$",
        "If $y = \\sin^n(x)$, then $\\frac{dy}{dx} = n \\sin^{n-1}(x) \\cdot \\cos(x)$."
      ]
    },
    {
      id: "sec3",
      title: "3. Integration & Differentiation",
      content: [
        "Integration is the inverse process of differentiation. The standard Power Rule for integration is:",
        "$$\\int x^n\\,dx = \\frac{x^{n+1}}{n+1} + C$$",
        "**Anti-derivatives** of trigonometric functions follow similar patterns."
      ]
    }
  ]
};

// --- Sub-components ---

const LoadingSkeleton = () => (
    <div className="flex gap-8 px-1">
        <div className="w-[65%] space-y-8">
            <div className="h-40 bg-blue-50/50 rounded-xl animate-pulse" />
            <div className="space-y-4">
                <div className="h-8 w-1/3 bg-slate-100 rounded-base animate-pulse" />
                <div className="h-32 bg-slate-50 rounded-xl animate-pulse" />
            </div>
            <div className="space-y-4">
                <div className="h-40 bg-slate-50 rounded-xl animate-pulse" />
            </div>
        </div>
        <div className="w-[35%] space-y-6">
            <div className="h-12 bg-slate-100 rounded-xl animate-pulse" />
            <div className="h-48 bg-slate-50 rounded-xl animate-pulse" />
        </div>
    </div>
);

export default function NotesDetailPage() {
  const [loading, setLoading] = useState(true);
  const [fontSize, setFontSize] = useState(16);
  const [isHighlighted, setIsHighlighted] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
     return <div className="animate-in fade-in py-12"><LoadingSkeleton /></div>;
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-text-secondary">
        <Link href="/student/modules" className="hover:text-primary transition-colors">Modules</Link>
        <ChevronRight size={14} className="text-slate-300" />
        <Link href="/student/modules/1" className="hover:text-primary transition-colors">{NOTE_CONTENT.module}</Link>
        <ChevronRight size={14} className="text-slate-300" />
        <span className="text-primary">{NOTE_CONTENT.title}</span>
      </nav>

      {/* Main Container */}
      <div className="flex flex-col lg:flex-row gap-12 items-start relative">
        
        {/* Left Panel: Content (65%) */}
        <section className="w-full lg:w-[65%] space-y-10">
            
            {/* Toolbar */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-2 rounded-full shadow-sm flex items-center gap-2 w-max">
                <div className="flex items-center gap-1 border-r pr-2 shadow-inner bg-slate-50 dark:bg-slate-800 rounded-full">
                    <button 
                        onClick={() => setFontSize(s => Math.max(s - 2, 12))}
                        className="p-2 hover:bg-white rounded-full transition-all text-xs font-black uppercase px-3"
                    >A-</button>
                    <span className="text-sm font-black text-primary px-1">{fontSize}px</span>
                    <button 
                        onClick={() => setFontSize(s => Math.min(s + 2, 24))}
                        className="p-2 hover:bg-white rounded-full transition-all text-xs font-black uppercase px-3"
                    >A+</button>
                </div>
                <button 
                    onClick={() => setIsHighlighted(!isHighlighted)}
                    className={cn(
                        "p-2 rounded-full transition-all flex items-center gap-2 group px-4",
                        isHighlighted ? "bg-primary text-white" : "hover:bg-slate-50 text-slate-400"
                    )}
                >
                    <Highlighter size={18} />
                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">Highlights</span>
                </button>
                <div className="w-[1px] h-6 bg-slate-100 mx-1" />
                <button className="p-3 hover:bg-slate-50 rounded-full transition-all text-slate-400">
                    <Maximize2 size={18} />
                </button>
            </div>

            {/* Title & Key Concepts */}
            <header className="space-y-8">
                <h1 className="text-5xl font-extrabold tracking-tight italic decoration-primary decoration-4 underline">
                    {NOTE_CONTENT.title}
                </h1>
                <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 p-8 rounded-xl space-y-4">
                    <div className="flex items-center gap-3 text-primary">
                        <Info size={24} />
                        <h2 className="text-xl font-black italic tracking-tighter">Key Concepts Summary</h2>
                    </div>
                    <ul className="space-y-3">
                         {NOTE_CONTENT.keyConcepts.map((concept, i) => (
                             <li key={i} className="flex gap-4 items-start text-text-secondary font-medium leading-relaxed">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 shrink-0" />
                                <div>
                                    {/* Use InlineMath for LaTeX in concepts */}
                                    <span dangerouslySetInnerHTML={{ 
                                        __html: concept.replace(/\$(.*?)\$/g, '<span class="math-inline">$1</span>') 
                                    }} />
                                </div>
                             </li>
                         ))}
                    </ul>
                </div>
            </header>

            {/* Note Sections */}
            <div className="space-y-16" style={{ fontSize: `${fontSize}px` }}>
                {NOTE_CONTENT.sections.map((section) => (
                    <div key={section.id} id={section.id} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h2 className="text-2xl font-black tracking-tight text-primary uppercase group flex items-center gap-4">
                            {section.title}
                            <span className="h-[2px] flex-1 bg-slate-50 dark:bg-slate-800" />
                        </h2>
                        <div className="space-y-6 text-text-secondary font-medium leading-relaxed">
                            {section.content.map((line, idx) => {
                                if (line.startsWith("$$")) {
                                    return (
                                        <div key={idx} className="bg-slate-50 dark:bg-slate-800 p-8 rounded-xl border border-slate-100 dark:border-slate-800 my-8 shadow-sm text-center">
                                            <BlockMath math={line.replace(/\$\$/g, "")} />
                                        </div>
                                    );
                                }
                                
                                return (
                                    <p key={idx} className="relative">
                                        <span dangerouslySetInnerHTML={{ 
                                            __html: line
                                                .replace(/\$(.*?)\$/g, '<span class="font-bold text-primary italic">$1</span>')
                                                .replace(/\*\*(.*?)\*\*/g, '<span class="font-black text-text-primary">$1</span>')
                                        }} />
                                    </p>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </section>

        {/* Right Panel: Sticky Toolbar (35%) */}
        <aside className="w-full lg:w-[35%] lg:sticky lg:top-32 space-y-8 pb-32 lg:pb-0">
            
            {/* Action Buttons */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                 <button className="w-full py-4 bg-primary text-white font-black text-md rounded-base flex items-center justify-center gap-3 hover:shadow-2xl hover:shadow-primary/30 transition-all active:scale-95">
                    <Download size={20} /> Export PDF
                 </button>
                 <div className="grid grid-cols-2 gap-3">
                    <button className="py-3 border-2 border-slate-100 rounded-base font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2"><Copy size={14}/> Copy All</button>
                    <button className="py-3 border-2 border-slate-100 rounded-base font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2"><RefreshCw size={14}/> Regenerate</button>
                 </div>
                 <button className="w-full py-4 bg-emerald-100 text-emerald-600 font-black text-md rounded-base flex items-center justify-center gap-3 hover:bg-emerald-200 transition-all active:scale-95 mt-4">
                    <PlusCircle size={20} /> Add to Flashcards
                 </button>
            </div>

            {/* Note Outline */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
                <div className="flex items-center gap-3">
                    <List size={20} className="text-primary" />
                    <h3 className="text-sm font-black uppercase tracking-widest">Note Outline</h3>
                </div>
                <div className="space-y-4 border-l-2 border-slate-50">
                    {NOTE_CONTENT.sections.map(s => (
                        <a 
                            key={s.id} 
                            href={`#${s.id}`} 
                            className="block px-6 py-2 text-sm font-bold text-text-secondary hover:text-primary hover:translate-x-1 transition-all border-l-2 border-transparent -ml-[2px] hover:border-primary"
                        >
                            {s.title}
                        </a>
                    ))}
                </div>
            </div>

            {/* Topic Chips */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
                 <div className="flex items-center gap-3">
                    <Hash size={20} className="text-primary" />
                    <h3 className="text-sm font-black uppercase tracking-widest">Auto-Detected Tags</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                    {NOTE_CONTENT.tags.map(tag => (
                        <div key={tag} className="px-3 py-1 bg-slate-50 border rounded-full text-[10px] font-black uppercase tracking-widest text-slate-400">
                             {tag}
                        </div>
                    ))}
                </div>
                <div className="pt-4 mt-4 border-t flex flex-col gap-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Related Resource</p>
                    <Link href="#" className="p-4 bg-slate-50 rounded-xl flex items-center gap-4 group">
                        <div className="w-10 h-10 bg-white rounded-base flex items-center justify-center text-primary shadow-sm"><FileText size={20}/></div>
                        <div>
                            <p className="text-xs font-black tracking-tight group-hover:text-primary transition-colors">Integration Guide.pdf</p>
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Study Resource</p>
                        </div>
                    </Link>
                </div>
            </div>
        </aside>

      </div>
      
      {/* Global Style for Math Inline Highlight */}
      <style jsx global>{`
        .math-inline {
           font-style: italic;
           font-weight: 700;
           color: #4DA6FF;
        }
      `}</style>
    </div>
  );
}
