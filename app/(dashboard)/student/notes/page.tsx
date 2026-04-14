"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FileText, Search, Plus, Clock, Tag, BookOpen, ArrowRight, Zap, SlidersHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { DEMO_NOTES, DEMO_MODULES } from "@/lib/mock-data";

const DIFFICULTY_COLORS: Record<string, string> = {
  Arrays: "bg-blue-100 text-blue-600",
  Memory: "bg-purple-100 text-purple-600",
  "Big-O": "bg-orange-100 text-orange-600",
  LIFO: "bg-green-100 text-green-600",
  FIFO: "bg-teal-100 text-teal-600",
  Recursion: "bg-pink-100 text-pink-600",
  "Actus Reus": "bg-red-100 text-red-600",
  "Mens Rea": "bg-yellow-100 text-yellow-600",
  Causation: "bg-emerald-100 text-emerald-600",
  AD: "bg-violet-100 text-violet-600",
  "AS Model": "bg-cyan-100 text-cyan-600",
  Equilibrium: "bg-indigo-100 text-indigo-600",
};

const MODULE_FILTERS = ["All", ...DEMO_MODULES.map((m) => m.tags[0])];

export default function NotesPage() {
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("All");
  const [generating, setGenerating] = useState(false);

  const filtered = DEMO_NOTES.filter((n) => {
    const matchSearch =
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.preview.toLowerCase().includes(search.toLowerCase());
    const matchModule =
      moduleFilter === "All" ||
      DEMO_MODULES.find((m) => m.id === n.moduleId)?.tags[0] === moduleFilter;
    return matchSearch && matchModule;
  });

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => setGenerating(false), 2000);
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      {/* Header */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight italic underline decoration-primary decoration-4">
            My Notes
          </h1>
          <p className="text-text-secondary font-bold mt-2">
            AI-generated study notes from your uploaded materials.
          </p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="px-8 py-4 bg-primary text-white font-bold text-lg rounded-base flex items-center justify-center gap-3 hover:shadow-2xl hover:shadow-primary/30 active:scale-95 transition-all disabled:opacity-60"
        >
          {generating ? (
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Zap size={22} fill="currentColor" />
          )}
          {generating ? "Generating..." : "Generate New Notes"}
        </button>
      </section>

      {/* Toolbar */}
      <section className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-xl shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search notes by title or content..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary rounded-base outline-none transition-all font-medium"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 w-full lg:w-auto px-1 no-scrollbar">
            {MODULE_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setModuleFilter(f)}
                className={cn(
                  "px-5 py-3 rounded-full text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all border-2",
                  moduleFilter === f
                    ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                    : "bg-slate-50 border-transparent text-slate-400 hover:border-slate-200"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Notes Grid */}
      {filtered.length > 0 ? (
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence>
            {filtered.map((note, i) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -4 }}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-primary/30 transition-all flex flex-col group"
              >
                <div className="p-6 flex-1 flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-10 h-10 bg-primary/10 text-primary rounded-base flex items-center justify-center shrink-0">
                      <FileText size={20} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-full border">
                      {note.date}
                    </span>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">{note.moduleName}</p>
                    <h3 className="text-lg font-bold tracking-tight group-hover:text-primary transition-colors leading-snug">
                      {note.title}
                    </h3>
                  </div>

                  <p className="text-sm text-text-secondary font-medium leading-relaxed line-clamp-3">{note.preview}</p>

                  <div className="flex flex-wrap gap-2 mt-auto pt-2">
                    {note.tags.map((t) => (
                      <span
                        key={t}
                        className={cn(
                          "text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full",
                          DIFFICULTY_COLORS[t] || "bg-slate-100 text-slate-500"
                        )}
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 text-xs font-bold text-text-secondary border-t pt-4">
                    <span className="flex items-center gap-1.5"><Clock size={13} /> {note.readTime} read</span>
                    <span className="flex items-center gap-1.5"><Tag size={13} /> {note.wordCount.toLocaleString()} words</span>
                  </div>
                </div>

                <Link
                  href={`/student/notes/${note.id}`}
                  className="w-full py-4 bg-slate-50 dark:bg-slate-800 group-hover:bg-primary group-hover:text-white transition-all text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2 border-t border-slate-100 dark:border-slate-800 rounded-b-xl"
                >
                  Read Note <ArrowRight size={16} />
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </section>
      ) : (
        <section className="flex flex-col items-center justify-center py-24 text-center space-y-6">
          <div className="w-56 h-56 bg-slate-50 rounded-full flex items-center justify-center border-4 border-dashed border-slate-200 dark:border-slate-700">
            <BookOpen size={70} className="text-slate-200" />
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">No notes found</h2>
            <p className="text-text-secondary font-medium mt-2">
              Upload materials in a module to generate notes automatically.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
