"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BookOpen, Calendar, Clock, Search, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { DEMO_MODULES } from "@/lib/mock-data";
import { useKnowledgeStore } from "@/lib/module-knowledge";

export default function ExamsPage() {
  const knowledge = useKnowledgeStore();
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("All");

  const exams = knowledge.assessments.filter((assessment) => assessment.mode === "exam");
  const moduleFilters = ["All", ...DEMO_MODULES.map((module) => module.tags[0])];

  const filtered = useMemo(() => {
    return exams.filter((exam) => {
      const query = search.trim().toLowerCase();
      const matchSearch = exam.title.toLowerCase().includes(query);
      const moduleTag = DEMO_MODULES.find((module) => module.id === exam.moduleId)?.tags[0];
      const matchModule = moduleFilter === "All" || moduleTag === moduleFilter;
      return matchSearch && matchModule;
    });
  }, [exams, moduleFilter, search]);

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight italic underline decoration-primary decoration-4">
            Mock Exams
          </h1>
          <p className="text-text-secondary font-bold mt-2">
            Timed mixed-format exams grounded in your module knowledge library.
          </p>
        </div>
      </section>

      <section className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-xl shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search exams..."
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
        {filtered.map((exam, index) => (
          <motion.div
            key={exam.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col"
          >
            <div className="p-6 flex-1 space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border bg-red-100 text-red-600 border-red-200">
                  {exam.difficulty}
                </span>
                <span
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full",
                    exam.status === "Completed" ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                  )}
                >
                  {exam.status}
                </span>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">
                  {DEMO_MODULES.find((module) => module.id === exam.moduleId)?.name || exam.moduleId}
                </p>
                <h3 className="text-lg font-bold tracking-tight leading-snug">{exam.title}</h3>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="text-center bg-slate-50 dark:bg-slate-800 rounded-base p-3 space-y-1">
                  <p className="text-lg font-bold text-primary">{exam.questions.length}</p>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-text-secondary">Questions</p>
                </div>
                <div className="text-center bg-slate-50 dark:bg-slate-800 rounded-base p-3 space-y-1">
                  <p className="text-lg font-bold text-primary flex items-center justify-center gap-1">
                    <Clock size={14} /> {exam.timeLimitMinutes}
                  </p>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-text-secondary">Minutes</p>
                </div>
                <div className="text-center bg-slate-50 dark:bg-slate-800 rounded-base p-3 space-y-1">
                  <p className="text-lg font-bold text-emerald-500">
                    {exam.bestScore !== null ? `${exam.bestScore}%` : "—"}
                  </p>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-text-secondary">Best</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-text-secondary">
                <Calendar size={14} className="text-primary" />
                <span>{new Date(exam.createdAt).toLocaleDateString("en-ZA")}</span>
                <span className="w-1 h-1 bg-slate-300 rounded-full" />
                <span>{exam.attempts} attempt{exam.attempts !== 1 ? "s" : ""}</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {exam.questionTypes.map((type) => (
                  <span key={type} className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                    {type.replace("_", " ")}
                  </span>
                ))}
              </div>
            </div>

            <Link
              href={`/student/exams/${exam.id}`}
              className="w-full py-4 bg-slate-50 dark:bg-slate-800 hover:bg-primary hover:text-white transition-all text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2 border-t border-slate-100 dark:border-slate-800"
            >
              <ShieldAlert size={16} />
              {exam.status === "Completed" ? "Review Exam" : "Start Exam"}
            </Link>
          </motion.div>
        ))}
      </section>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-6">
          <div className="w-56 h-56 bg-slate-50 rounded-full flex items-center justify-center border-4 border-dashed border-slate-200">
            <BookOpen size={70} className="text-slate-200" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight">No exams found</h2>
          <p className="text-text-secondary font-medium">
            Build a timed exam from a module workspace.
          </p>
        </div>
      )}
    </div>
  );
}
