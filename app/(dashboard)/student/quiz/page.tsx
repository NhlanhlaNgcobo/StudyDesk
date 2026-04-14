"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Brain,
  Search,
  Play,
  CheckCircle2,
  Clock,
  BarChart2,
  Zap,
  ChevronRight,
  Trophy,
  AlertCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { DEMO_QUIZZES, DEMO_MODULES } from "@/lib/mock-data";

const DIFFICULTY_STYLE: Record<string, string> = {
  Easy: "bg-green-100 text-green-600 border-green-200",
  Medium: "bg-amber-100 text-amber-600 border-amber-200",
  Hard: "bg-red-100 text-red-600 border-red-200",
};

const STATUS_STYLE: Record<string, string> = {
  Completed: "bg-emerald-50 text-emerald-600",
  "Not Started": "bg-slate-100 text-slate-500",
  "In Progress": "bg-blue-50 text-blue-600",
};

const MODULE_FILTERS = ["All", ...DEMO_MODULES.map((m) => m.tags[0])];

export default function QuizPage() {
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("All");

  const filtered = DEMO_QUIZZES.filter((q) => {
    const matchSearch = q.title.toLowerCase().includes(search.toLowerCase());
    const matchModule =
      moduleFilter === "All" ||
      DEMO_MODULES.find((m) => m.id === q.moduleId)?.tags[0] === moduleFilter;
    return matchSearch && matchModule;
  });

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      {/* Header */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight italic underline decoration-primary decoration-4">
            Practice Quizzes
          </h1>
          <p className="text-text-secondary font-bold mt-2">
            AI-generated quizzes aligned to your module syllabus.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-primary/10 border border-primary/20 px-6 py-4 rounded-xl">
          <Trophy size={24} className="text-primary" />
          <div>
            <p className="text-2xl font-bold tracking-tight text-primary">87%</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Avg. Quiz Score</p>
          </div>
        </div>
      </section>

      {/* Toolbar */}
      <section className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-xl shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search quizzes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary rounded-base outline-none transition-all font-medium"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full lg:w-auto px-1">
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

      {/* Quiz Cards Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.map((quiz, i) => (
          <motion.div
            key={quiz.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            whileHover={{ y: -4 }}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-primary/30 transition-all flex flex-col group overflow-hidden"
          >
            <div className="p-6 flex-1 space-y-5">
              {/* Status and Difficulty */}
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border",
                    DIFFICULTY_STYLE[quiz.difficulty] || "bg-slate-100 text-slate-500"
                  )}
                >
                  {quiz.difficulty}
                </span>
                <span
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full",
                    STATUS_STYLE[quiz.status]
                  )}
                >
                  {quiz.status === "Completed" ? (
                    <span className="flex items-center gap-1">
                      <CheckCircle2 size={12} /> {quiz.status}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <AlertCircle size={12} /> {quiz.status}
                    </span>
                  )}
                </span>
              </div>

              {/* Module + Title */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">{quiz.moduleName}</p>
                <h3 className="text-lg font-bold tracking-tight leading-snug group-hover:text-primary transition-colors">
                  {quiz.title}
                </h3>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center bg-slate-50 dark:bg-slate-800 rounded-base p-3 space-y-1">
                  <p className="text-lg font-bold text-primary">{quiz.questions}</p>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-text-secondary">Questions</p>
                </div>
                <div className="text-center bg-slate-50 dark:bg-slate-800 rounded-base p-3 space-y-1">
                  <p className="text-lg font-bold text-primary flex items-center justify-center gap-1">
                    <Clock size={14} /> {quiz.duration.split(" ")[0]}
                  </p>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-text-secondary">Minutes</p>
                </div>
                <div className="text-center bg-slate-50 dark:bg-slate-800 rounded-base p-3 space-y-1">
                  <p className="text-lg font-bold text-emerald-500">
                    {quiz.bestScore !== null ? `${quiz.bestScore}%` : "—"}
                  </p>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-text-secondary">Best</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-text-secondary">
                <BarChart2 size={14} className="text-primary" />
                <span>{quiz.attempts} attempt{quiz.attempts !== 1 ? "s" : ""}</span>
                <span className="w-1 h-1 bg-slate-300 rounded-full" />
                <span>{quiz.date}</span>
              </div>
            </div>

            <Link
              href={`/student/quiz/${quiz.id}`}
              className="w-full py-4 bg-slate-50 dark:bg-slate-800 group-hover:bg-primary group-hover:text-white transition-all text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2 border-t border-slate-100 dark:border-slate-800"
            >
              {quiz.status === "Completed" ? (
                <><Zap size={16} fill="currentColor" /> Retake Quiz</>
              ) : (
                <><Play size={16} fill="currentColor" /> Start Quiz</>
              )}
            </Link>
          </motion.div>
        ))}
      </section>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-6">
          <div className="w-56 h-56 bg-slate-50 rounded-full flex items-center justify-center border-4 border-dashed border-slate-200">
            <Brain size={70} className="text-slate-200" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight">No quizzes found</h2>
          <p className="text-text-secondary font-medium">
            Generate quizzes from a module's study materials.
          </p>
        </div>
      )}
    </div>
  );
}
