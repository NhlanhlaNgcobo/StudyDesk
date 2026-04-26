"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Upload,
  FileText,
  Brain,
  ShieldAlert,
  MoreVertical,
  Play,
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
  BookOpen,
  Filter,
  CheckCircle,
  Cloud,
  Loader2,
  CheckCircle2,
  Sparkles,
  Search,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { db, auth, storage } from "@/lib/firebase";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  deleteDoc,
  updateDoc,
  increment,
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { useAuth } from "@/components/auth-provider";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Module {
  id: string;
  name: string;
  subject: string;
  color: string;
  semester: string;
  progress: number;
  fileCount: number;
  ownerId: string;
}

interface StudyFile {
  id: string;
  name: string;
  size: string;
  url: string;
  storagePath: string;
  createdAt: any;
}

interface GeneratedNote {
  id: string;
  topic: string;
  content: string;
  createdAt: any;
}

interface GeneratedQuiz {
  id: string;
  topic: string;
  difficulty: string;
  questions: any[];
  createdAt: any;
}

interface GeneratedExam {
  id: string;
  topic: string;
  questions: any[];
  createdAt: any;
}

const TABS = ["Materials", "Notes", "Quizzes", "Exams"];

// ─── Breadcrumbs ─────────────────────────────────────────────────────────────

const Breadcrumbs = ({ moduleName }: { moduleName: string }) => (
  <nav className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-slate-500 mb-10">
    <Link href="/student/modules" className="hover:text-primary transition-colors">
      Modules
    </Link>
    <ChevronRight size={14} className="text-slate-300" />
    <span className="text-primary">{moduleName}</span>
  </nav>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

type ProcessState = "idle" | "extracting" | "generating" | "complete" | "error";

export default function ModuleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, profile } = useAuth();
  const moduleId = params.id as string;

  const [module, setModule] = useState<Module | null>(null);
  const [activeTab, setActiveTab] = useState("Materials");
  const [files, setFiles] = useState<StudyFile[]>([]);
  const [notes, setNotes] = useState<GeneratedNote[]>([]);
  const [quizzes, setQuizzes] = useState<GeneratedQuiz[]>([]);
  const [exams, setExams] = useState<GeneratedExam[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [generating, setGenerating] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [genTopic, setGenTopic] = useState("");
  const [showGenModal, setShowGenModal] = useState<"notes" | "quiz" | "exam" | null>(null);
  const [genDifficulty, setGenDifficulty] = useState("Medium");
  const [genNumQ, setGenNumQ] = useState(5);
  const [processState, setProcessState] = useState<ProcessState>("idle");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const userTier = profile?.tier || "free";

  // ── Load module ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!moduleId) return;
    getDoc(doc(db, "modules", moduleId)).then((snap) => {
      if (snap.exists()) {
        setModule({ id: snap.id, ...snap.data() } as Module);
      } else {
        router.push("/student/modules");
      }
    });
  }, [moduleId, router]);

  // ── Load files ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!moduleId) return;
    const q = query(
      collection(db, "modules", moduleId, "files"),
      orderBy("createdAt", "desc")
    );
    return onSnapshot(q, (snap) => {
      setFiles(snap.docs.map((d) => ({ id: d.id, ...d.data() } as StudyFile)));
    });
  }, [moduleId]);

  // ── Load notes ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!moduleId) return;
    const q = query(
      collection(db, "modules", moduleId, "notes"),
      orderBy("createdAt", "desc")
    );
    return onSnapshot(q, (snap) => {
      setNotes(snap.docs.map((d) => ({ id: d.id, ...d.data() } as GeneratedNote)));
    });
  }, [moduleId]);

  // ── Load quizzes ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!moduleId) return;
    const q = query(
      collection(db, "modules", moduleId, "quizzes"),
      orderBy("createdAt", "desc")
    );
    return onSnapshot(q, (snap) => {
      setQuizzes(snap.docs.map((d) => ({ id: d.id, ...d.data() } as GeneratedQuiz)));
    });
  }, [moduleId]);

  // ── Load exams ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!moduleId) return;
    const q = query(
      collection(db, "modules", moduleId, "exams"),
      orderBy("createdAt", "desc")
    );
    return onSnapshot(q, (snap) => {
      setExams(snap.docs.map((d) => ({ id: d.id, ...d.data() } as GeneratedExam)));
    });
  }, [moduleId]);


  // ── Upload file ─────────────────────────────────────────────────────────
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !moduleId) return;

    setUploading(true);
    setUploadProgress(0);

    const storagePath = `modules/${moduleId}/files/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, storagePath);
    const task = uploadBytesResumable(storageRef, file);

    task.on(
      "state_changed",
      (snap) => setUploadProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      (err) => { console.error(err); setUploading(false); },
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        await addDoc(collection(db, "modules", moduleId, "files"), {
          name: file.name,
          size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
          url,
          storagePath,
          createdAt: serverTimestamp(),
        });
        await updateDoc(doc(db, "modules", moduleId), { fileCount: increment(1) });
        setUploading(false);
        setUploadProgress(0);
        // Set gen topic from filename
        setGenTopic(file.name.replace(/\.[^/.]+$/, ""));
      }
    );
  };

  const handleDeleteFile = async (file: StudyFile) => {
    try {
      await deleteDoc(doc(db, "modules", moduleId, "files", file.id));
      await deleteObject(ref(storage, file.storagePath));
      await updateDoc(doc(db, "modules", moduleId), { fileCount: increment(-1) });
    } catch (e) {
      console.error("Delete failed:", e);
    }
  };

  // ── Generate Notes (streaming) ──────────────────────────────────────────
  const generateNotes = async () => {
    if (!genTopic.trim() || !module) return;
    setGenerating("notes");
    setGeneratedContent("");
    setGenerateError(null);

    try {
      const res = await fetch("/api/generate/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: genTopic,
          subject: module.subject,
          type: "notes",
          userTier,
        }),
      });

      if (!res.ok) throw new Error("Generation failed");

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = decoder.decode(value, { stream: true }).split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") break;
            try {
              const parsed = JSON.parse(data);
              if (parsed.delta) {
                fullText += parsed.delta;
                setGeneratedContent(fullText);
              }
            } catch {}
          }
        }
      }

      // Save to Firestore
      if (fullText) {
        const wordCount = fullText.split(/\s+/).length;
        const readTime = `${Math.ceil(wordCount / 200)} min`;
        await addDoc(collection(db, "modules", moduleId, "notes"), {
          topic: genTopic,
          content: fullText,
          preview: fullText.slice(0, 200) + "...",
          wordCount,
          readTime,
          moduleName: module.name,
          moduleId: module.id,
          createdAt: serverTimestamp(),
        });
      }

    } catch (e: any) {
      setGenerateError(e.message || "Generation failed");
    } finally {
      setGenerating(null);
      setShowGenModal(null);
    }
  };

  // ── Generate Quiz ───────────────────────────────────────────────────────
  const generateQuiz = async () => {
    if (!genTopic.trim() || !module) return;
    setGenerating("quiz");
    setGenerateError(null);

    try {
      const res = await fetch("/api/generate/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: genTopic,
          subject: module.subject,
          numQuestions: genNumQ,
          difficulty: genDifficulty,
          userTier,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Quiz generation failed");

      await addDoc(collection(db, "modules", moduleId, "quizzes"), {
        topic: genTopic,
        difficulty: genDifficulty,
        questions: data.questions,
        createdAt: serverTimestamp(),
      });

      setActiveTab("Quizzes");
    } catch (e: any) {
      setGenerateError(e.message || "Quiz generation failed");
    } finally {
      setGenerating(null);
      setShowGenModal(null);
    }
  };

  // ── Generate Exam ───────────────────────────────────────────────────────
  const generateExam = async () => {
    if (!genTopic.trim() || !module) return;
    setGenerating("exam");
    setGenerateError(null);

    try {
      const res = await fetch("/api/generate/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: genTopic,
          subject: module.subject,
          type: "exam",
          userTier,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Exam generation failed");

      const data = json.data;

      if (!Array.isArray(data)) {
        throw new Error("Invalid output received from AI");
      }

      await addDoc(collection(db, "modules", moduleId, "exams"), {
        topic: genTopic,
        questions: data,
        createdAt: serverTimestamp(),
      });

      setActiveTab("Exams");
    } catch (e: any) {
      setGenerateError(e.message || "Exam generation failed");
    } finally {
      setGenerating(null);
      setShowGenModal(null);
    }
  };

  if (!module) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      <Breadcrumbs moduleName={module.name} />

      {/* ── Module Header ─────────────────────────────────────────────────── */}
      <section className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="h-6" style={{ backgroundColor: module.color }} />
        <div className="p-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="flex gap-4 items-center flex-wrap">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight underline italic decoration-primary decoration-4">
                {module.name}
              </h1>
              <span className="px-4 py-1.5 bg-slate-50 dark:bg-slate-800 border rounded-full text-xs font-black uppercase tracking-widest text-slate-500">
                {module.subject}
              </span>
            </div>
            <div className="flex flex-wrap gap-8 pt-2">
              {[
                { icon: FileIcon, label: "Materials", val: files.length },
                { icon: FileText, label: "Notes", val: notes.length },
                { icon: Brain, label: "Quizzes", val: quizzes.length },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-base flex items-center justify-center text-primary border border-slate-100 dark:border-slate-700 shadow-sm">
                    <s.icon size={20} />
                  </div>
                  <div>
                    <p className="text-lg font-black leading-none">{s.val}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      {s.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4 shrink-0">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-8 py-4 bg-primary text-white font-black text-lg rounded-base flex items-center justify-center gap-3 hover:shadow-2xl hover:shadow-primary/30 active:scale-95 transition-all disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <Loader2 size={20} className="animate-spin" /> Uploading {uploadProgress}%
                </>
              ) : (
                <>
                  <Upload size={20} /> Upload Study Materials
                </>
              )}
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
              onChange={handleFileUpload}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex px-10 border-t overflow-x-auto no-scrollbar bg-slate-50/50 dark:bg-slate-800/50 dark:border-slate-800">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-8 py-5 text-sm font-black uppercase tracking-widest transition-all relative border-b-4 whitespace-nowrap",
                activeTab === tab
                  ? "text-primary border-primary bg-white dark:bg-slate-900"
                  : "text-slate-400 border-transparent hover:text-slate-600 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/50"
              )}
            >
              {tab}
              {activeTab === tab && (
                <motion.div
                  layoutId="tab-underline"
                  className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full"
                />
              )}
            </button>
          ))}
        </div>
      </section>

      {/* ── Tab Content ───────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {/* MATERIALS TAB */}
        {activeTab === "Materials" && (
          <motion.div
            key="materials"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-12"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              {/* Upload zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-center py-20 group hover:border-primary hover:bg-primary/5 transition-all cursor-pointer shadow-sm"
              >
                {uploading ? (
                  <>
                    <Loader2 size={48} className="text-primary animate-spin mb-4" />
                    <p className="font-black text-primary">{uploadProgress}% uploaded...</p>
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <Upload size={36} />
                    </div>
                    <h3 className="text-2xl font-black mb-2 tracking-tight">Drop your files here</h3>
                    <p className="text-slate-500 dark:text-slate-400 font-medium max-w-xs mx-auto">
                      Upload PDFs, notes, or slides. Our AI will index them for quiz and note generation.
                    </p>
                    <button className="mt-8 px-6 py-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-base font-black uppercase text-xs tracking-widest shadow-lg shadow-slate-200/20 group-hover:bg-primary group-hover:text-white transition-all">
                      Browse Local Files
                    </button>
                  </>
                )}
              </div>

              {/* AI Generation Buttons */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-black tracking-tight">Generate AI Power-ups</h2>
                  <p className="text-slate-500 dark:text-slate-400 font-bold mt-1">Pick a topic or module, then fire up the AI.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Topic / Chapter *
                  </label>
                  <input
                    type="text"
                    value={genTopic}
                    onChange={(e) => setGenTopic(e.target.value)}
                    placeholder="e.g. Linked Lists, Keynesian Economics..."
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary rounded-base outline-none font-medium transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { icon: FileText, label: "Generate Notes", action: () => setShowGenModal("notes"), variant: "primary" },
                    { icon: BrainCircuit, label: "Generate Quiz", action: () => setShowGenModal("quiz"), variant: "outline" },
                    { icon: Timer, label: "Generate Mock Exam", action: () => setShowGenModal("exam"), variant: "outline" },
                    { icon: HelpCircle, label: "Go to AI Tutor", action: () => router.push("/student/ai-tutor"), variant: "outline" },
                  ].map((btn) => (
                    <button
                      key={btn.label}
                      onClick={btn.action}
                      disabled={generating !== null || (!genTopic.trim() && btn.label !== "Go to AI Tutor")}
                      className={cn(
                        "flex-1 py-4 rounded-base flex items-center justify-center gap-3 font-black uppercase tracking-widest text-xs transition-all active:scale-95 border-2 group disabled:opacity-40 disabled:cursor-not-allowed",
                        btn.variant === "primary"
                          ? "bg-primary border-primary text-white hover:shadow-xl hover:shadow-primary/30"
                          : "border-slate-100 dark:border-slate-800 hover:border-primary hover:text-primary"
                      )}
                    >
                      <btn.icon size={18} className={cn(btn.variant === "outline" && "text-primary group-hover:scale-110 transition-transform")} />
                      {btn.label}
                    </button>
                  ))}
                </div>

                {generateError && (
                  <p className="text-red-500 font-bold text-sm">{generateError}</p>
                )}

                <div className="p-6 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl flex items-start gap-4">
                  <div className="mt-1 text-primary shrink-0">
                    <ShieldAlert size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-widest text-primary mb-2 italic">
                      AI-Powered Content
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                      Generated content is saved to your module workspace automatically. Enter a topic and hit Generate.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* File List */}
            {files.length > 0 && (
              <section className="space-y-6">
                <h2 className="text-2xl font-black tracking-tight">
                  Study Files <span className="text-slate-500 dark:text-slate-400 font-medium ml-2">({files.length})</span>
                </h2>
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 dark:bg-slate-800/50 border-b dark:border-slate-800">
                        <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          <th className="px-8 py-5">Filename</th>
                          <th className="px-8 py-5">Size</th>
                          <th className="px-8 py-5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {files.map((file) => (
                          <tr key={file.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="px-8 py-5">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 text-red-500 rounded-base flex items-center justify-center shrink-0 border border-red-50 dark:border-red-900/30">
                                  <FileIcon size={20} />
                                </div>
                                <div>
                                  <p className="font-black tracking-tight text-sm group-hover:text-primary transition-colors text-slate-900 dark:text-white">
                                    {file.name}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-5">
                              <p className="text-xs font-black uppercase tracking-widest text-slate-500">{file.size}</p>
                            </td>
                            <td className="px-8 py-5">
                              <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <a href={file.url} target="_blank" rel="noopener noreferrer" className="p-2 hover:text-primary transition-colors hover:bg-white dark:hover:bg-slate-800 rounded-base shadow-sm border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
                                  <ExternalLink size={16} />
                                </a>
                                <button onClick={() => handleDeleteFile(file)} className="p-2 hover:text-red-500 transition-colors hover:bg-white dark:hover:bg-slate-800 rounded-base shadow-sm border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}
          </motion.div>
        )}

        {/* NOTES TAB */}
        {activeTab === "Notes" && (
          <motion.div
            key="notes"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            {notes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center space-y-6">
                <div className="w-48 h-48 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center border-4 border-dashed border-slate-200 dark:border-slate-800">
                  <FileText size={60} className="text-slate-200 dark:text-slate-800" />
                </div>
                <h2 className="text-2xl font-bold">No notes generated yet</h2>
                <p className="text-slate-500 dark:text-slate-400">Go to Materials, enter a topic and click Generate Notes.</p>
                <button onClick={() => setActiveTab("Materials")} className="px-6 py-3 bg-primary text-white font-black rounded-base uppercase tracking-widest text-sm">
                  Generate Notes
                </button>
              </div>
            ) : (
              notes.map((note) => (
                <div key={note.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                  <div className="px-8 py-5 border-b dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-3">
                      <Sparkles size={16} className="text-primary" />
                      <h3 className="font-black text-lg tracking-tight text-slate-900 dark:text-white">{note.topic}</h3>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">AI Generated</span>
                  </div>
                  <div className="p-8 prose prose-sm max-w-none dark:prose-invert prose-headings:font-black prose-strong:font-black prose-code:text-primary prose-code:bg-primary/5 prose-code:px-1 prose-code:rounded">
                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                      {note.content}
                    </ReactMarkdown>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}

        {/* QUIZZES TAB */}
        {activeTab === "Quizzes" && (
          <motion.div
            key="quizzes"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {quizzes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center space-y-6">
                <div className="w-48 h-48 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center border-4 border-dashed border-slate-200 dark:border-slate-800">
                  <Brain size={60} className="text-slate-200 dark:text-slate-800" />
                </div>
                <h2 className="text-2xl font-bold">No quizzes generated yet</h2>
                <p className="text-slate-500 dark:text-slate-400">Go to Materials, enter a topic and click Generate Quiz.</p>
                <button onClick={() => setActiveTab("Materials")} className="px-6 py-3 bg-primary text-white font-black rounded-base uppercase tracking-widest text-sm">
                  Generate Quiz
                </button>
              </div>
            ) : (
              quizzes.map((quiz) => (
                <div key={quiz.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all group">
                  <div className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-base flex items-center justify-center">
                        <Brain size={24} className="text-primary" />
                      </div>
                      <div>
                        <h3 className="font-black tracking-tight group-hover:text-primary transition-colors text-slate-900 dark:text-white">
                          {quiz.topic}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                            {quiz.questions?.length || 0} questions
                          </span>
                          <span className="w-1 h-1 bg-slate-300 rounded-full" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                            {quiz.difficulty}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Link
                      href={`/student/quiz/${quiz.id}?moduleId=${moduleId}`}
                      className="px-6 py-3 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-base flex items-center gap-2 hover:shadow-lg hover:shadow-primary/30 transition-all"
                    >
                      <Play size={14} fill="currentColor" /> Start Quiz
                    </Link>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}

      {/* EXAMS TAB */}
        {activeTab === "Exams" && (
          <motion.div
            key="exams"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {exams.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center space-y-6">
                <div className="w-48 h-48 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center border-4 border-dashed border-slate-200 dark:border-slate-800">
                  <Timer size={60} className="text-slate-200 dark:text-slate-800" />
                </div>
                <h2 className="text-2xl font-bold">No exams generated yet</h2>
                <p className="text-slate-500 dark:text-slate-400">Go to Materials, enter a topic and click Generate Mock Exam.</p>
                <button onClick={() => setActiveTab("Materials")} className="px-6 py-3 bg-primary text-white font-black rounded-base uppercase tracking-widest text-sm">
                  Generate Exam
                </button>
              </div>
            ) : (
              exams.map((exam) => (
                <div key={exam.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all group">
                  <div className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-base flex items-center justify-center">
                        <Timer size={24} className="text-primary" />
                      </div>
                      <div>
                        <h3 className="font-black tracking-tight group-hover:text-primary transition-colors text-slate-900 dark:text-white">
                          {exam.topic}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                            {exam.questions?.length || 0} questions
                          </span>
                          <span className="w-1 h-1 bg-slate-300 rounded-full" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                            Mock Exam
                          </span>
                        </div>
                      </div>
                    </div>
                    <Link
                      href={`/student/exams/${exam.id}?moduleId=${moduleId}`}
                      className="px-6 py-3 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-base flex items-center gap-2 hover:shadow-lg hover:shadow-primary/30 transition-all"
                    >
                      <Play size={14} fill="currentColor" /> Take Exam
                    </Link>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Generation Modals ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {showGenModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !generating && setShowGenModal(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-900 w-full max-w-md rounded-xl shadow-2xl relative z-60 p-8 space-y-6"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black italic tracking-tight underline decoration-primary decoration-4">
                  {showGenModal === "notes" ? "Generate Notes" : showGenModal === "quiz" ? "Generate Quiz" : "Generate Exam"}
                </h2>
                {!generating && (
                  <button onClick={() => setShowGenModal(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                    <X size={18} />
                  </button>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Topic *</label>
                <input
                  type="text"
                  value={genTopic}
                  onChange={(e) => setGenTopic(e.target.value)}
                  placeholder="e.g. Sorting Algorithms, Keynesian Theory..."
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary rounded-base outline-none font-medium"
                />
              </div>

              {(showGenModal === "quiz" || showGenModal === "exam") && (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Difficulty</label>
                    <div className="flex gap-2">
                      {["Easy", "Medium", "Hard"].map((d) => (
                        <button
                          key={d}
                          onClick={() => setGenDifficulty(d)}
                          className={cn(
                            "flex-1 py-2.5 rounded-base text-xs font-black uppercase tracking-widest border-2 transition-all",
                            genDifficulty === d ? "bg-primary border-primary text-white" : "border-slate-100 dark:border-slate-800 text-slate-500 hover:border-primary/40"
                          )}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                      Number of Questions: {genNumQ}
                    </label>
                    <input
                      type="range"
                      min={3}
                      max={20}
                      value={genNumQ}
                      onChange={(e) => setGenNumQ(Number(e.target.value))}
                      className="w-full accent-primary"
                    />
                  </div>
                </>
              )}

              {generateError && (
                <p className="text-red-500 font-bold text-sm">{generateError}</p>
              )}

              {generating && (
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl flex items-center gap-4">
                  <Loader2 size={24} className="animate-spin text-primary shrink-0" />
                  <div>
                    <p className="font-black text-primary text-sm">Claude is generating...</p>
                    <p className="text-slate-500 dark:text-slate-400 text-xs">This may take 10–30 seconds.</p>
                  </div>
                </div>
              )}

              <button
                onClick={showGenModal === "notes" ? generateNotes : showGenModal === "exam" ? generateExam : generateQuiz}
                disabled={!!generating || !genTopic.trim()}
                className="w-full py-4 bg-primary text-white font-black uppercase tracking-widest rounded-base flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl hover:shadow-primary/30 transition-all"
              >
                {generating ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <Sparkles size={20} />
                )}
                {generating ? "Generating..." : "Generate with AI"}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
