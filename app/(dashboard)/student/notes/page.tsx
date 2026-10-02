"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FileText, Search, Tag, Camera, X } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { DEMO_MODULES } from "@/lib/mock-data";
import { useKnowledgeStore } from "@/lib/module-knowledge";
import { NoteCapture } from "@/components/student/note-capture";

export default function NotesPage() {
  const knowledge = useKnowledgeStore();
  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState<"All" | "typed" | "generated" | "imported_excerpt">("All");
  const [capturing, setCapturing] = useState(false);
  const [captureModuleId, setCaptureModuleId] = useState(DEMO_MODULES[0]?.id || "1");

  const captureModule = DEMO_MODULES.find((item) => item.id === captureModuleId);

  const filteredNotes = useMemo(() => {
    return knowledge.notes.filter((note) => {
      const matchesKind = kindFilter === "All" || note.kind === kindFilter;
      const query = search.trim().toLowerCase();
      const matchesQuery =
        query.length === 0 ||
        note.title.toLowerCase().includes(query) ||
        note.preview.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query);
      return matchesKind && matchesQuery;
    });
  }, [knowledge.notes, kindFilter, search]);

  const sourceMaterial = knowledge.sources.filter((item) => item.extractionStatus === "ready");

  return (
    <div className="space-y-10">
      <section className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary">Knowledge library</p>
          <h1 className="text-4xl font-black tracking-tight md:text-5xl">Module notes and sources</h1>
          <p className="max-w-2xl text-base font-medium text-text-secondary">
            Review typed notes, generated note packs, and the stored source material used to build quizzes, exams, and flashcards.
          </p>
        </div>

        <button
          onClick={() => setCapturing((value) => !value)}
          className="flex shrink-0 items-center justify-center gap-3 rounded-full bg-primary px-7 py-4 text-xs font-black uppercase tracking-[0.18em] text-white shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 active:scale-95"
        >
          {capturing ? <X size={18} /> : <Camera size={18} />}
          {capturing ? "Close capture" : "Photograph notes"}
        </button>
      </section>

      {capturing && (
        <section className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-text-secondary">
              Which module are these notes for?
            </span>
            <select
              value={captureModuleId}
              onChange={(event) => setCaptureModuleId(event.target.value)}
              className="w-full max-w-md rounded-full border-2 border-transparent bg-app-muted px-5 py-3.5 font-bold outline-none transition focus:border-primary"
            >
              {DEMO_MODULES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          <NoteCapture
            moduleId={captureModuleId}
            moduleName={captureModule?.name || ""}
            onSaved={() => setCapturing(false)}
          />
        </section>
      )}

      <section className="rounded-[28px] border border-app bg-app-surface p-4 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search notes and source material"
              className="w-full rounded-full border-2 border-transparent bg-app-muted py-4 pl-12 pr-4 font-semibold outline-none transition focus:border-primary"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 xl:pb-0">
            {["All", "typed", "generated", "imported_excerpt"].map((item) => (
              <button
                key={item}
                onClick={() => setKindFilter(item as typeof kindFilter)}
                className={cn(
                  "rounded-full border px-4 py-3 text-xs font-black uppercase tracking-[0.18em] transition",
                  kindFilter === item
                    ? "border-primary bg-primary text-white"
                    : "border-app bg-app-surface text-text-secondary hover:border-primary/30 hover:text-primary"
                )}
              >
                {item === "imported_excerpt" ? "Excerpt" : item}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <h2 className="text-2xl font-black">Study notes</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {filteredNotes.map((note, index) => {
              const noteModule = DEMO_MODULES.find((item) => item.id === note.moduleId);
              return (
                <motion.article
                  key={note.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="rounded-[28px] border border-app bg-app-surface p-6 shadow-sm"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary">
                          {noteModule?.tags[0] || note.moduleId}
                        </p>
                        <h2 className="mt-2 text-2xl font-black leading-tight">{note.title}</h2>
                      </div>
                      <div className="rounded-full bg-app-muted px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-text-secondary">
                        {note.kind}
                      </div>
                    </div>

                    <p className="text-sm font-medium leading-7 text-text-secondary">{note.preview}</p>

                    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-[20px] bg-app-muted px-4 py-3">
                      <div className="flex items-center gap-2 text-text-secondary">
                        <FileText size={16} className="text-primary" />
                        <span className="text-xs font-black uppercase tracking-[0.16em]">
                          {note.readTimeMinutes} min read
                        </span>
                      </div>
                      <Link
                        href={`/student/modules/${note.moduleId}`}
                        className="shrink-0 text-xs font-black uppercase tracking-[0.18em] text-primary"
                      >
                        Open module
                      </Link>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-black">Stored source material</h2>
          <div className="space-y-4">
            {sourceMaterial.map((source) => (
              <div key={source.id} className="rounded-[24px] border border-app bg-app-surface p-5 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">{source.sourceKind.replace("_", " ")}</p>
                <p className="mt-2 text-lg font-black">{source.title}</p>
                <p className="mt-2 text-sm font-medium text-text-secondary">{source.preview}</p>
                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-app-muted px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-text-secondary">
                  <Tag size={12} className="text-primary" />
                  Ready for AI generation
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
