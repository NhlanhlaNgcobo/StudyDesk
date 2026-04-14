"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Plus, 
  Search, 
  FileText, 
  Brain, 
  ShieldAlert, 
  Clock, 
  MoreVertical, 
  Play, 
  Upload, 
  FileIcon,
  X,
  PlusCircle,
  Download,
  Trash2,
  ExternalLink,
  ChevronRight,
  HelpCircle,
  BrainCircuit,
  Timer,
  BookOpen
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// --- Mock Data ---

const MODULE = {
  id: "1",
  name: "CS201: Data Structures",
  subject: "Engineering",
  color: "#4DA6FF",
  stats: { files: 12, notes: 24, quizzes: 8, exams: 3, flashcards: 42 }
};

const FILES = [
  { id: "f1", name: "Lecture 1: Intro to Arrays.pdf", size: "2.4 MB", date: "2 days ago" },
  { id: "f2", name: "Lecture 2: Linked Lists.pdf", size: "1.8 MB", date: "Yesterday" },
  { id: "f3", name: "Complexity Analysis Workshop.pdf", size: "1.1 MB", date: "Yesterday" },
  { id: "f4", name: "Problem Set 1.pdf", size: "3.5 MB", date: "Today" },
];

const TABS = ["Materials", "Notes", "Quizzes", "Exams", "Flashcards"];

// --- Sub-components ---

const Breadcrumbs = ({ moduleName }: { moduleName: string }) => (
  <nav className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-text-secondary mb-10">
    <Link href="/student/modules" className="hover:text-primary transition-colors">Modules</Link>
    <ChevronRight size={14} className="text-slate-300" />
    <span className="text-primary">{moduleName}</span>
  </nav>
);

const GenerationButton = ({ icon: Icon, label, variant = "outline" }: any) => {
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <button 
      onClick={handleClick}
      disabled={loading}
      className={cn(
        "flex-1 py-4 rounded-base flex items-center justify-center gap-3 font-black uppercase tracking-widest text-xs transition-all active:scale-95 border-2 group",
        variant === "primary" 
            ? "bg-primary border-primary text-white hover:shadow-xl hover:shadow-primary/30" 
            : "border-slate-100 hover:border-primary hover:text-primary dark:border-slate-800"
      )}
    >
      {loading ? (
        <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <>
            <Icon size={18} className={cn(variant === "outline" && "text-primary group-hover:scale-110 transition-transform")} />
            <span>{label}</span>
        </>
      )}
    </button>
  );
};

export default function ModuleDetailPage() {
  const [activeTab, setActiveTab] = useState("Materials");

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      <Breadcrumbs moduleName={MODULE.name} />

      {/* Header Container */}
      <section className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="h-6" style={{ backgroundColor: MODULE.color }} />
        <div className="p-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-4">
                <div className="flex gap-4 items-center">
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight underline italic decoration-primary decoration-4">
                       {MODULE.name}
                    </h1>
                     <span className="px-4 py-1.5 bg-slate-50 dark:bg-slate-800 border rounded-full text-xs font-black uppercase tracking-widest text-slate-500">
                        {MODULE.subject}
                    </span>
                </div>
                <div className="flex flex-wrap gap-8 pt-2">
                    {[
                        { icon: FileIcon, label: "Materials", val: MODULE.stats.files },
                        { icon: FileText, label: "Notes", val: MODULE.stats.notes },
                        { icon: Brain, label: "Quizzes", val: MODULE.stats.quizzes },
                        { icon: HelpCircle, label: "Flashcards", val: MODULE.stats.flashcards },
                    ].map(s => (
                        <div key={s.label} className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-base flex items-center justify-center text-primary border border-slate-100 dark:border-slate-700 shadow-sm"><s.icon size={20}/></div>
                            <div>
                                <p className="text-lg font-black leading-none">{s.val}</p>
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">{s.label}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex flex-col gap-4 shrink-0">
                <button className="px-8 py-4 bg-primary text-white font-black text-lg rounded-base flex items-center justify-center gap-3 hover:shadow-2xl hover:shadow-primary/30 active:scale-95 transition-all">
                  <Upload size={20} /> Upload Study Materials
                </button>
                <div className="flex gap-2">
                    <button className="flex-1 py-3 border border-slate-100 rounded-base font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2"><Play size={14}/> Start Learning</button>
                    <button className="px-4 py-3 border border-slate-100 rounded-base font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all"><MoreVertical size={16}/></button>
                </div>
            </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex px-10 border-t overflow-x-auto no-scrollbar bg-slate-50/50">
             {TABS.map(tab => (
                 <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                      "px-8 py-5 text-sm font-black uppercase tracking-widest transition-all relative border-b-4",
                      activeTab === tab ? "text-primary border-primary bg-white" : "text-slate-400 border-transparent hover:text-slate-600 hover:bg-white/50"
                  )}
                 >
                    {tab}
                    {activeTab === tab && (
                        <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />
                    )}
                 </button>
             ))}
        </div>
      </section>

      {/* Dynamic Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === "Materials" && (
            <motion.div 
                key="materials"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-12"
            >
                {/* PDF Drag & Drop */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-center py-20 group hover:border-primary hover:bg-primary/5 transition-all cursor-pointer shadow-sm">
                        <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <Upload size={36} />
                        </div>
                        <h3 className="text-2xl font-black mb-2 tracking-tight">Drop your PDFs here</h3>
                        <p className="text-text-secondary font-medium max-w-xs mx-auto">Upload lecture notes, slides, or chapters to start generating AI study kits.</p>
                        <button className="mt-8 px-6 py-3 bg-white border border-slate-100 rounded-base font-black uppercase text-xs tracking-widest shadow-lg shadow-slate-200/20 group-hover:bg-primary group-hover:text-white transition-all">Browse Local Files</button>
                    </div>

                    <div className="space-y-6">
                        <h2 className="text-2xl font-black tracking-tight">Generate Power-ups</h2>
                        <p className="text-text-secondary font-bold">Pick an output Format to begin AI processing.</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <GenerationButton icon={FileText} label="Generate Notes" variant="primary" />
                            <GenerationButton icon={BrainCircuit} label="Generate Quiz" />
                            <GenerationButton icon={Timer} label="Generate Exam" />
                            <GenerationButton icon={PlusCircle} label="Generate Flashcards" />
                        </div>

                        {/* Science Badge Wrapper */}
                        <div className="p-6 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl flex items-start gap-4">
                            <div className="mt-1 text-primary shrink-0"><ShieldAlert size={20} /></div>
                            <div>
                                <h4 className="text-sm font-black uppercase tracking-widest text-primary mb-2 italic">LaTeX Detectors ON</h4>
                                <p className="text-xs text-slate-600 font-medium leading-relaxed">Our AI detected high-density mathematical notation in this module. Notes and quizzes will include perfectly formatted LaTeX equations.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* File List */}
                <section className="space-y-6">
                    <div className="flex justify-between items-center px-1">
                        <h2 className="text-2xl font-black tracking-tight">Study Files <span className="text-text-secondary font-medium ml-2">({FILES.length})</span></h2>
                        <div className="flex items-center gap-2">
                             <button className="p-2.5 rounded-base hover:bg-slate-100 transition-colors border"><Search size={18}/></button>
                             <button className="p-2.5 rounded-base hover:bg-slate-100 transition-colors border"><Filter size={18}/></button>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50 border-b">
                                <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    <th className="px-8 py-5">Filename</th>
                                    <th className="px-8 py-5">Size</th>
                                    <th className="px-8 py-5">Upload Date</th>
                                    <th className="px-8 py-5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {FILES.map(file => (
                                    <tr key={file.id} className="group hover:bg-slate-50 transition-colors">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-red-100 text-red-500 rounded-base flex items-center justify-center shrink-0 border border-red-50"><FileIcon size={20}/></div>
                                                <div>
                                                    <p className="font-black tracking-tight text-sm group-hover:text-primary transition-colors">{file.name}</p>
                                                    <p className="text-xs font-bold text-text-secondary">PDF Document</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <p className="text-xs font-black uppercase tracking-widest text-slate-500">{file.size}</p>
                                        </td>
                                        <td className="px-8 py-5">
                                            <p className="text-xs font-bold text-text-secondary">{file.date}</p>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="p-2 hover:text-primary transition-colors hover:bg-white rounded-base shadow-sm border border-transparent hover:border-slate-100"><ExternalLink size={16}/></button>
                                                <button className="p-2 hover:text-primary transition-colors hover:bg-white rounded-base shadow-sm border border-transparent hover:border-slate-100"><Download size={16}/></button>
                                                <button className="p-2 hover:text-red-500 transition-colors hover:bg-white rounded-base shadow-sm border border-transparent hover:border-slate-100"><Trash2 size={16}/></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
