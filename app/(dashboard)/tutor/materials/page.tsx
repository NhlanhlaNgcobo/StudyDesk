"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  File,
  Trash2,
  Plus,
  BookOpen,
  CheckCircle2,
  X,
  FileText,
  Image,
  Presentation,
  Brain,
  Timer,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DEMO_MODULES } from "@/lib/mock-data";

const MATERIAL_TYPES = [
  { id: "notes", label: "Notes", icon: FileText },
  { id: "slides", label: "Slides", icon: Presentation },
  { id: "past-papers", label: "Past Papers", icon: BookOpen },
  { id: "resources", label: "Resources", icon: File },
];

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: "uploading" | "done" | "error";
}

export default function TutorMaterialsPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [materialType, setMaterialType] = useState("notes");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const newFiles: UploadedFile[] = Array.from(incoming).map((f) => ({
      id: Math.random().toString(36).slice(2),
      name: f.name,
      size: f.size,
      type: f.type,
      status: "uploading",
    }));
    setFiles((prev) => [...prev, ...newFiles]);

    // Simulate upload progress
    newFiles.forEach((f) => {
      setTimeout(() => {
        setFiles((prev) =>
          prev.map((item) => (item.id === f.id ? { ...item, status: "done" } : item))
        );
      }, 1000 + Math.random() * 1000);
    });
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || files.length === 0) return;
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setTitle("");
      setDescription("");
      setFiles([]);
    }, 3000);
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return Image;
    if (type.includes("presentation") || type.includes("powerpoint")) return Presentation;
    return FileText;
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <p className="eyebrow">Course authoring</p>
          <h1 className="mt-2 text-4xl md:text-5xl font-semibold tracking-[-0.04em]">
            Module libraries
          </h1>
          <p className="text-text-secondary font-medium mt-3 max-w-2xl">
            Each module keeps its source material, tutor notes, quizzes, exams, and deadlines in one place. AI generation only uses the material you select.
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {DEMO_MODULES.map((module) => (
          <Link key={module.id} href={`/tutor/materials/${module.id}`} className="surface-card group rounded-[20px] p-5 transition hover:-translate-y-0.5 hover:border-emerald-500/40 hover:shadow-lg">
            <div className="flex items-start justify-between"><span className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white" style={{ backgroundColor: module.color }}>{module.tags[0]}</span><span className="text-xs font-bold text-text-secondary">{module.fileCount} files</span></div>
            <h2 className="mt-5 text-lg font-semibold tracking-tight group-hover:text-emerald-700">{module.name}</h2>
            <p className="mt-1 text-sm text-text-secondary">{module.subject}</p>
            <div className="mt-5 flex gap-4 text-xs font-semibold text-text-secondary"><span className="inline-flex items-center gap-1"><Brain size={13} /> Build quiz</span><span className="inline-flex items-center gap-1"><Timer size={13} /> Timed exam</span></div>
          </Link>
        ))}
      </section>

      <div className="flex items-center gap-3 border-t border-app pt-8">
        <div><p className="eyebrow">Quick upload</p><h2 className="mt-1 text-2xl font-semibold tracking-tight">Share a resource across groups</h2></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        {/* Upload Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-8">
          {/* Material Type */}
          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-widest text-slate-500">
              Material Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {MATERIAL_TYPES.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setMaterialType(id)}
                  className={cn(
                    "p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all text-center",
                    materialType === id
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-slate-100 bg-white text-slate-500 hover:border-slate-200"
                  )}
                >
                  <Icon size={20} />
                  <span className="text-xs font-black uppercase tracking-widest">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-500">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Week 5 — Sorting Algorithms Slides"
              required
              className="w-full px-5 py-4 bg-white border-2 border-slate-100 rounded-xl font-bold focus:border-emerald-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-500">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description for students..."
              rows={3}
              className="w-full px-5 py-4 bg-white border-2 border-slate-100 rounded-xl font-medium resize-none focus:border-emerald-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Drop Zone */}
          <div
            className={cn(
              "border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all",
              isDragging
                ? "border-emerald-500 bg-emerald-50"
                : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/30"
            )}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              accept=".pdf,.pptx,.ppt,.docx,.doc,.txt,.png,.jpg"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto">
                <Upload size={32} />
              </div>
              <div>
                <p className="text-lg font-black text-slate-700">
                  Drop files here or <span className="text-emerald-500">click to browse</span>
                </p>
                <p className="text-sm font-bold text-slate-400 mt-1">
                  PDF, PPTX, DOCX, TXT, PNG, JPG — Max 50MB per file
                </p>
              </div>
            </div>
          </div>

          {/* File List */}
          <AnimatePresence>
            {files.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-3"
              >
                {files.map((f) => {
                  const Icon = getFileIcon(f.type);
                  return (
                    <motion.div
                      key={f.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-xl shadow-sm"
                    >
                      <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center shrink-0 text-slate-500">
                        <Icon size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{f.name}</p>
                        <p className="text-xs text-slate-400 font-bold">{formatBytes(f.size)}</p>
                      </div>
                      {f.status === "uploading" ? (
                        <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin shrink-0" />
                      ) : (
                        <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
                      )}
                      <button
                        type="button"
                        onClick={() => removeFile(f.id)}
                        className="p-1 hover:bg-red-50 hover:text-red-500 rounded-full transition-all text-slate-400 shrink-0"
                      >
                        <X size={16} />
                      </button>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={!title || files.length === 0}
            className="w-full py-5 bg-emerald-500 text-white font-black uppercase tracking-widest rounded-xl hover:shadow-xl hover:shadow-emerald-500/30 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg"
          >
            <Plus size={22} /> Share Material with Groups
          </button>

          {/* Success toast */}
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex items-center gap-3 p-5 bg-emerald-500 text-white rounded-xl shadow-xl font-black uppercase tracking-widest text-sm"
              >
                <CheckCircle2 size={20} />
                Material shared successfully!
              </motion.div>
            )}
          </AnimatePresence>
        </form>

        {/* Recent Uploads */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-black uppercase tracking-tight">Recent Uploads</h2>
          <div className="space-y-4">
            {[
              { title: "CS201 — Big-O Complexity Slides", type: "Slides", date: "Today", size: "4.2 MB" },
              { title: "LAW201 — Criminal Law Summary", type: "Notes", date: "Yesterday", size: "1.8 MB" },
              { title: "ECO301 — Macro Past Paper 2024", type: "Past Papers", date: "3 days ago", size: "3.1 MB" },
            ].map((item) => (
              <div key={item.title} className="bg-white border border-slate-100 rounded-xl p-5 flex items-center gap-4 hover:shadow-md transition-all">
                <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center shrink-0">
                  <FileText size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-extrabold text-sm truncate">{item.title}</p>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-0.5">
                    {item.type} · {item.date} · {item.size}
                  </p>
                </div>
                <button className="p-2 hover:bg-red-50 hover:text-red-400 rounded-full transition-colors text-slate-300">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
