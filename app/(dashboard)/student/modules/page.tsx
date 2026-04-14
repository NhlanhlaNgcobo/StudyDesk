"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  BookOpen, 
  FileText, 
  Calendar, 
  ArrowRight,
  ChevronRight,
  PlusCircle,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// --- Mock Data ---

const SUBJECTS = [
  "All", "Science", "Maths", "Humanities", "Law", "Engineering", "Medicine"
];

const MODULES = [
  { id: "1", name: "CS201: Data Structures", subject: "Engineering", fileCount: 12, progress: 65, color: "#4DA6FF", lastAccessed: "2 hours ago" },
  { id: "2", name: "ECO301: Macroeconomics", subject: "Humanities", fileCount: 8, progress: 42, color: "#8B5CF6", lastAccessed: "Yesterday" },
  { id: "3", name: "LAW201: Criminal Law", subject: "Law", fileCount: 15, progress: 88, color: "#10B981", lastAccessed: "3 days ago" },
  { id: "4", name: "MATH101: Calculus", subject: "Maths", fileCount: 4, progress: 12, color: "#F59E0B", lastAccessed: "1 week ago" },
];

const COLORS = ["#4DA6FF", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444", "#EC4899"];

// --- Sub-components ---

const ModuleCard = ({ module }: { module: typeof MODULES[0] }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden group hover:shadow-xl hover:shadow-slate-200/50 hover:border-primary/50 transition-all flex flex-col h-full"
  >
    <div className="p-6 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-6">
            <div className="flex gap-2">
                <div className="w-1.5 h-10 rounded-full" style={{ backgroundColor: module.color }} />
                <div>
                   <h3 className="text-xl font-extrabold tracking-tight group-hover:text-primary transition-colors leading-tight mb-2">{module.name}</h3>
                   <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200/50">{module.subject}</span>
                </div>
            </div>
            <button className="text-slate-400 p-1 hover:bg-slate-50 rounded-full transition-colors"><MoreVertical size={20}/></button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8 mt-auto">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <FileText size={16} className="text-primary"/>
                <span className="text-xs font-black uppercase tracking-widest">{module.fileCount} Files</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Calendar size={16} className="text-primary"/>
                <span className="text-[10px] font-black uppercase tracking-widest">{module.lastAccessed}</span>
            </div>
        </div>

        <div className="space-y-3">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-1.5">
                <span className="text-slate-500 italic">Progress</span>
                <span className="text-primary font-black">{module.progress}%</span>
            </div>
            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-50 dark:border-slate-700">
                <motion.div 
                    initial={{ width: 0 }}
                    whileInView={{ width: `${module.progress}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: module.color }}
                />
            </div>
        </div>
    </div>
    
    <Link 
        href={`/student/modules/${module.id}`}
        className="w-full py-4 bg-slate-50 dark:bg-slate-800 group-hover:bg-primary group-hover:text-white transition-all text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 border-t border-slate-100 dark:border-slate-800"
    >
        Open Workspace <ArrowRight size={16} />
    </Link>
  </motion.div>
);

// --- Main Page ---

export default function ModulesPage() {
  const [filter, setFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");

  const filteredModules = MODULES.filter(m => 
    (filter === "All" || m.subject === filter) &&
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      {/* Header Container */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight underline italic decoration-primary decoration-4">
              My Modules
           </h1>
           <p className="text-text-secondary font-bold mt-2">Manage your academic syllabus and AI power-ups.</p>
        </div>

        <button 
           onClick={() => setShowModal(true)}
           className="px-8 py-4 bg-primary text-white font-black text-lg rounded-base flex items-center justify-center gap-3 hover:shadow-2xl hover:shadow-primary/30 active:scale-95 transition-all"
        >
          <PlusCircle size={24} /> Add New Module
        </button>
      </section>

      {/* Toolbar */}
      <section className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-xl shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                    type="text"
                    placeholder="Search by module name or code..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary rounded-base outline-none transition-all font-medium"
                />
            </div>
            
            <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 w-full lg:w-auto px-1 no-scrollbar">
               {SUBJECTS.map(s => (
                  <button 
                    key={s}
                    onClick={() => setFilter(s)}
                    className={cn(
                        "px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all border-2",
                        filter === s ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary/30"
                    )}
                  >
                    {s}
                  </button>
               ))}
            </div>
        </div>
      </section>

      {/* Grid */}
      {filteredModules.length > 0 ? (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredModules.map(m => (
                <ModuleCard key={m.id} module={m} />
            ))}
        </section>
      ) : (
        <section className="flex flex-col items-center justify-center py-20 text-center space-y-8 animate-in zoom-in duration-500">
            <div className="w-64 h-64 bg-slate-50 rounded-full flex items-center justify-center border-4 border-dashed border-slate-200">
               <BookOpen size={80} className="text-slate-200" />
            </div>
            <div className="space-y-2">
                <h2 className="text-3xl font-extrabold tracking-tight">No modules found</h2>
                <p className="text-text-secondary font-medium">Add your first module to start generating AI study notes.</p>
            </div>
            <button 
                onClick={() => setShowModal(true)}
                className="px-8 py-4 bg-primary text-white font-black text-lg rounded-base flex items-center justify-center gap-3 hover:shadow-2xl hover:shadow-primary/30 active:scale-95 transition-all"
            >
                <PlusCircle size={24} /> Add First Module
            </button>
        </section>
      )}

      {/* Add Module Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-0">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setShowModal(false)}
               className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
             />
             <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-xl shadow-2xl relative z-60 overflow-hidden"
             >
                <div className="p-8 space-y-8">
                    <div className="flex justify-between items-center">
                        <h2 className="text-3xl font-black italic tracking-tighter underline decoration-primary decoration-4">Add Module</h2>
                        <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X/></button>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-text-secondary px-1">Module Name / Code</label>
                            <input 
                                type="text"
                                placeholder="e.g. CS201: Data Structures"
                                className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary rounded-base outline-none transition-all font-medium"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-text-secondary px-1">Subject Area</label>
                                <select className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary rounded-base outline-none transition-all font-bold appearance-none">
                                    {SUBJECTS.filter(s => s !== "All").map(s => <option key={s}>{s}</option>)}
                                </select>
                            </div>
                             <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-text-secondary px-1">Semester</label>
                                <select className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary rounded-base outline-none transition-all font-bold appearance-none">
                                    <option>Semester 1</option>
                                    <option>Semester 2</option>
                                    <option>Year Long</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-text-secondary px-1">Module Colour Accent</label>
                            <div className="flex gap-3">
                                {COLORS.map(c => (
                                    <button 
                                        key={c}
                                        onClick={() => {}}
                                        className="w-10 h-10 rounded-full border-4 border-transparent hover:border-white ring-2 ring-slate-100 transition-all flex items-center justify-center"
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    <button className="w-full py-5 bg-primary text-white font-black text-xl rounded-base hover:shadow-2xl hover:shadow-primary/30 active:scale-95 transition-all shadow-lg">
                        Create Module
                    </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
