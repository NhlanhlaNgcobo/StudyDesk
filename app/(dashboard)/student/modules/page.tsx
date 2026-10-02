"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, BookOpen, Brain, Calendar, FileText, PlusCircle, Search, Sparkles, Timer } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { DEMO_MODULES } from "@/lib/mock-data";
import { useKnowledgeStore } from "@/lib/module-knowledge";

const FILTERS = ["All", ...Array.from(new Set(DEMO_MODULES.map((module) => module.subject)))];

export default function ModulesPage() {
  const knowledge = useKnowledgeStore();
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const filteredModules = useMemo(
    () =>
      DEMO_MODULES.filter((module) => {
        const matchesFilter = filter === "All" || module.subject === filter;
        const query = search.trim().toLowerCase();
        const matchesSearch =
          query.length === 0 ||
          module.name.toLowerCase().includes(query) ||
          module.tags.some((tag) => tag.toLowerCase().includes(query));
        return matchesFilter && matchesSearch;
      }).map((module) => {
        const sourceCount = knowledge.sources.filter((item) => item.moduleId === module.id).length;
        const noteCount = knowledge.notes.filter((item) => item.moduleId === module.id).length;
        const assessmentCount = knowledge.assessments.filter((item) => item.moduleId === module.id).length;
        const completedAttempts = knowledge.attempts.filter((item) => item.moduleId === module.id);
        const latestScore =
          completedAttempts.length > 0 ? completedAttempts[0].percentage : module.progress;

        return {
          ...module,
          fileCount: sourceCount,
          notes: noteCount,
          assessmentCount,
          progress: latestScore,
        };
      }),
    [filter, knowledge.assessments, knowledge.attempts, knowledge.notes, knowledge.sources, search]
  );

  return (
    <div className="space-y-10">
      <section className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary">Student workspace</p>
          <h1 className="text-4xl font-black tracking-tight md:text-5xl">Your modules</h1>
          <p className="max-w-2xl text-base font-medium text-text-secondary">
            Each module is your working hub for materials, AI notes, practice quizzes, and timed revision.
          </p>
        </div>

        <button className="inline-flex items-center gap-3 rounded-full bg-primary px-6 py-4 text-sm font-black uppercase tracking-[0.18em] text-white shadow-xl shadow-blue-500/20 transition hover:bg-primary-strong">
          <PlusCircle size={18} />
          Add module
        </button>
      </section>

      <section className="rounded-[28px] border border-app bg-app-surface p-4 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by module name or code"
              className="w-full rounded-full border-2 border-transparent bg-app-muted py-4 pl-12 pr-4 font-semibold outline-none transition focus:border-primary"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 xl:pb-0">
            {FILTERS.map((item) => (
              <button
                key={item}
                onClick={() => setFilter(item)}
                className={cn(
                  "rounded-full border px-4 py-3 text-xs font-black uppercase tracking-[0.18em] transition",
                  filter === item
                    ? "border-primary bg-primary text-white"
                    : "border-app bg-app-surface text-text-secondary hover:border-primary/30 hover:text-primary"
                )}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="surface-card rounded-[24px] p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="eyebrow">Make your own study tools</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">Build from your module material.</h2>
            <p className="mt-2 max-w-2xl text-sm font-medium text-text-secondary">Upload readings or slides, write your own notes, then generate flashcards, a practice quiz, or a timed mock exam from the sources you choose.</p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-semibold text-text-secondary"><span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-2 text-violet-700"><Sparkles size={14} /> Flashcards</span><span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-2 text-blue-700"><Brain size={14} /> Quizzes</span><span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-2 text-emerald-700"><Timer size={14} /> Timed exams</span></div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {DEMO_MODULES.map((module) => <Link key={module.id} href={`/student/modules/${module.id}`} className="rounded-full border border-app bg-app-muted px-4 py-2 text-xs font-bold text-app transition hover:border-primary/30 hover:bg-app-surface hover:text-primary">Create for {module.tags[0]}</Link>)}
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filteredModules.map((module, index) => (
          <motion.article
            key={module.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            className="overflow-hidden rounded-[28px] border border-app bg-app-surface shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/5"
          >
            <div className="h-2 w-full" style={{ backgroundColor: module.color }} />
            <div className="space-y-6 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary">{module.tags[0]}</p>
                  <h2 className="mt-2 text-2xl font-black leading-tight">{module.name}</h2>
                </div>
                <span className="rounded-full bg-app-muted px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-text-secondary">
                  {module.subject}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-[20px] bg-app-muted p-4">
                  <div className="flex items-center gap-2 text-primary">
                    <FileText size={16} />
                    <span className="text-xs font-black uppercase tracking-[0.16em]">Files</span>
                  </div>
                  <p className="mt-2 text-2xl font-black">{module.fileCount}</p>
                </div>
                <div className="rounded-[20px] bg-app-muted p-4">
                  <div className="flex items-center gap-2 text-primary">
                    <BookOpen size={16} />
                    <span className="text-xs font-black uppercase tracking-[0.16em]">Notes</span>
                  </div>
                  <p className="mt-2 text-2xl font-black">{module.notes}</p>
                </div>
              </div>

              <div className="rounded-[20px] bg-app-muted px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] font-black uppercase tracking-[0.16em] text-text-secondary">
                    Assessments ready
                  </span>
                  <span className="rounded-full bg-app-surface px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-primary">
                    {module.assessmentCount}
                  </span>
                </div>
                <p className="mt-3 text-sm font-semibold text-text-secondary">
                  Source files, typed notes, quizzes, and exams now live inside the same module workspace.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-[0.2em] text-text-secondary">
                  <span>Progress</span>
                  <span className="text-primary">{module.progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-app-muted">
                  <div className="h-full rounded-full" style={{ width: `${module.progress}%`, backgroundColor: module.color }} />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-[20px] bg-app-muted px-4 py-3">
                <div className="flex items-center gap-2 text-text-secondary">
                  <Calendar size={16} className="text-primary" />
                  <span className="text-xs font-black uppercase tracking-[0.16em]">{module.lastAccessed}</span>
                </div>
                <Link
                  href={`/student/modules/${module.id}`}
                  className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-primary transition hover:gap-3"
                >
                  Open workspace
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </motion.article>
        ))}
      </section>
    </div>
  );
}
