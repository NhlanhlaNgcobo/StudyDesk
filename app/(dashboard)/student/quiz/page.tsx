"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Brain, CheckCircle2, Clock, Search, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { DEMO_MODULES } from "@/lib/mock-data";
import { useKnowledgeStore } from "@/lib/module-knowledge";

export default function QuizPage() {
  const knowledge = useKnowledgeStore();
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("All");

  const quizzes = knowledge.assessments.filter((assessment) => assessment.mode === "quiz");
  const moduleFilters = ["All", ...DEMO_MODULES.map((module) => module.tags[0])];

  const filtered = useMemo(() => {
    return quizzes.filter((quiz) => {
      const query = search.trim().toLowerCase();
      const matchSearch = quiz.title.toLowerCase().includes(query);
      const moduleTag = DEMO_MODULES.find((module) => module.id === quiz.moduleId)?.tags[0];
      const matchModule = moduleFilter === "All" || moduleTag === moduleFilter;
      return matchSearch && matchModule;
    });
  }, [moduleFilter, quizzes, search]);

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight italic underline decoration-primary decoration-4">
            Practice Quizzes
          </h1>
          <p className="text-text-secondary font-bold mt-2">
            Source-grounded quizzes built from stored module notes and files.
          </p>
        </div>
      </section>

      <section className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-xl shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search quizzes..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary rounded-base outline-none transition-all font-medium"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full lg:w-auto px-1">
            {moduleFilters.map((filter) => (
              <button
                key={filter}
                onClick={() => setModuleFilter(filter)}
                className={cn(
                  "px-5 py-3 rounded-full text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all border-2",
                  moduleFilter === filter
                    ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                    : "bg-slate-50 border-transparent text-slate-400 hover:border-slate-200"
                )}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.map((quiz, index) => (
          <motion.div
            key={quiz.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col"
          >
            <div className="p-6 flex-1 space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border bg-slate-100 text-slate-500">
                  {quiz.difficulty}
                </span>
                <span
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full",
                    quiz.status === "Completed"
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-slate-100 text-slate-500"
                  )}
                >
                  {quiz.status === "Completed" ? (
                    <span className="flex items-center gap-1">
                      <CheckCircle2 size={12} /> Completed
                    </span>
                  ) : (
                    quiz.status
                  )}
                </span>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">
                  {DEMO_MODULES.find((module) => module.id === quiz.moduleId)?.name || quiz.moduleId}
                </p>
                <h3 className="text-lg font-bold tracking-tight leading-snug">{quiz.title}</h3>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="text-center bg-slate-50 dark:bg-slate-800 rounded-base p-3 space-y-1">
                  <p className="text-lg font-bold text-primary">{quiz.questions.length}</p>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-text-secondary">Questions</p>
                </div>
                <div className="text-center bg-slate-50 dark:bg-slate-800 rounded-base p-3 space-y-1">
                  <p className="text-lg font-bold text-primary flex items-center justify-center gap-1">
                    <Clock size={14} /> {quiz.timeLimitMinutes}
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

              <div className="flex flex-wrap gap-2">
                {quiz.questionTypes.map((type) => (
                  <span key={type} className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                    {type.replace("_", " ")}
                  </span>
                ))}
              </div>
            </div>

            <Link
              href={`/student/quiz/${quiz.id}`}
              className="w-full py-4 bg-slate-50 dark:bg-slate-800 hover:bg-primary hover:text-white transition-all text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2 border-t border-slate-100 dark:border-slate-800"
            >
              {quiz.status === "Completed" ? (
                <>
                  <Zap size={16} fill="currentColor" /> Review Quiz
                </>
              ) : (
                <>
                  <Brain size={16} /> Start Quiz
                </>
              )}
            </Link>
          </motion.div>
        ))}
      </section>
    </div>
  );
}
