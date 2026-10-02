"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  FileText,
  Zap,
  Clock,
  MoreVertical,
  Play,
  ArrowRight,
  Brain,
  Calendar,
  X,
} from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { DEMO_UPCOMING_SESSIONS, DEMO_MODULES } from "@/lib/mock-data";
import { MasteryPanel, ExamReadinessBoard } from "@/components/student/mastery-panel";
import { useLearnerModel, dueSkills } from "@/lib/learner-model";

const COLORS = ["#4DA6FF", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444", "#EC4899"];
const SUBJECTS = ["Science", "Maths", "Humanities", "Law", "Engineering", "Medicine"];

const RECENT_MODULES = DEMO_MODULES.slice(0, 3).map((m) => ({
  id: m.id,
  name: m.name,
  tags: m.tags,
  fileCount: m.fileCount,
  progress: m.progress,
  color: m.id === "1" ? "bg-blue-500" : m.id === "2" ? "bg-purple-500" : "bg-emerald-500",
}));

const ModuleCard = ({ id, name, tags, fileCount, progress, color }: any) => (
  <div className="surface-card rounded-[20px] p-6 flex flex-col gap-6 group transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg">
    <div className="flex justify-between items-start">
      <div className={cn("px-3 py-1 font-black text-[10px] uppercase tracking-widest text-white rounded-full", color)}>
        {tags[0]}
      </div>
      <button className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
        <MoreVertical size={20} />
      </button>
    </div>

    <div>
      <h3 className="text-xl font-extrabold mb-2 tracking-tight group-hover:text-primary transition-colors text-slate-900 dark:text-white">{name}</h3>
      <p className="text-sm font-medium text-text-secondary">{fileCount} study files attached</p>
    </div>

    <div className="space-y-3">
      <div className="flex justify-between text-xs font-black uppercase tracking-widest">
        <span>Course Progress</span>
        <span className="text-primary">{progress}%</span>
      </div>
      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${progress}%` }}
          transition={{ duration: 1 }}
          className={cn("h-full rounded-full", color)}
        />
      </div>
    </div>

    <Link href={`/student/modules/${id}`} className="w-full py-3 mt-2 bg-app-muted rounded-base font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary hover:text-white transition-all text-center">
      Continue Studying <Play size={14} fill="currentColor" />
    </Link>
  </div>
);

export default function StudentDashboard() {
  const router = useRouter();
  const [showNewModule, setShowNewModule] = useState(false);
  const [moduleName, setModuleName] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("Engineering");
  const [selectedColor, setSelectedColor] = useState("#4DA6FF");
  const [generating, setGenerating] = useState<string | null>(null);
  const [greeting, setGreeting] = useState("Welcome back");
  const [dateStr, setDateStr] = useState("South Africa study workspace");

  const { profile } = useAuth();
  const firstName = profile?.displayName ? profile.displayName.split(" ")[0] : "Student";

  const learnerModel = useLearnerModel();
  const dueCount = dueSkills(learnerModel).length;

  useEffect(() => {
    const now = new Date();
    const hour = now.getHours();
    setGreeting(hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening");
    setDateStr(
      now.toLocaleDateString("en-ZA", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    );
  }, []);

  const handleQuickAction = (path: string, key: string) => {
    setGenerating(key);
    setTimeout(() => {
      setGenerating(null);
      router.push(path);
    }, 1200);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <p className="eyebrow mb-3">Your learning desk</p>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-[-0.04em]">
            {greeting}, {firstName}
          </h1>
          <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-text-secondary font-medium">
            <Calendar size={18} className="text-primary" />
            <span>{dateStr}</span>
            {dueCount > 0 && (
              <>
                <span className="w-1.5 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full" />
                <Link
                  href="/student/quiz"
                  className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-black uppercase tracking-widest hover:bg-primary/20 transition-colors"
                >
                  <Brain size={14} /> {dueCount} due for review
                </Link>
              </>
            )}
          </div>
        </div>

        <button
          onClick={() => setShowNewModule(true)}
          className="px-6 py-3.5 bg-primary text-white font-bold rounded-base flex items-center justify-center gap-3 hover:bg-primary-strong hover:shadow-lg hover:shadow-primary/20 active:scale-95 transition-all"
        >
          <Plus size={24} /> New Study Module
        </button>
      </section>

      <MasteryPanel />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-12">
          <section className="space-y-6">
            <div><p className="eyebrow">Get started</p><h2 className="mt-1 text-2xl font-semibold tracking-tight">Pick up where you left off</h2></div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                onClick={() => handleQuickAction("/student/notes", "notes")}
                className="surface-card p-6 rounded-[20px] flex flex-col items-start gap-4 text-left group hover:border-primary/30 transition-all active:scale-[0.98] relative overflow-hidden"
              >
                {generating === "notes" && <div className="absolute inset-0 flex items-center justify-center bg-blue-100/80 dark:bg-blue-950/80 z-20"><span className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>}
                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/30 text-primary rounded-base flex items-center justify-center group-hover:scale-105 transition-transform relative z-10"><FileText size={22} /></div>
                <span className="font-semibold tracking-tight relative z-10">Create notes</span><span className="text-xs text-text-secondary -mt-2">Organise material into clear revision notes</span>
              </button>
              <button
                onClick={() => handleQuickAction("/student/quiz", "quiz")}
                className="surface-card p-6 rounded-[20px] flex flex-col items-start gap-4 text-left group hover:border-primary/30 transition-all active:scale-[0.98] relative overflow-hidden"
              >
                {generating === "quiz" && <div className="absolute inset-0 flex items-center justify-center bg-purple-100/80 dark:bg-purple-950/80 z-20"><span className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>}
                <div className="w-12 h-12 bg-violet-50 dark:bg-violet-950/30 text-violet-600 rounded-base flex items-center justify-center group-hover:scale-105 transition-transform relative z-10"><Brain size={22} /></div>
                <span className="font-semibold tracking-tight relative z-10">Practice recall</span><span className="text-xs text-text-secondary -mt-2">Test your understanding before the exam</span>
              </button>
              <button
                onClick={() => handleQuickAction("/student/exams", "exams")}
                className="surface-card p-6 rounded-[20px] flex flex-col items-start gap-4 text-left group hover:border-primary/30 transition-all active:scale-[0.98] relative overflow-hidden"
              >
                {generating === "exams" && <div className="absolute inset-0 flex items-center justify-center bg-emerald-100/80 dark:bg-emerald-950/80 z-20"><span className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>}
                <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 rounded-base flex items-center justify-center group-hover:scale-105 transition-transform relative z-10"><Zap size={22} /></div>
                <span className="font-semibold tracking-tight relative z-10">Run a mock exam</span><span className="text-xs text-text-secondary -mt-2">Build confidence under timed conditions</span>
              </button>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex justify-between items-center px-1">
              <div><p className="eyebrow">Continue learning</p><h2 className="mt-1 text-2xl font-semibold tracking-tight">Recent modules</h2></div>
              <Link href="/student/modules" className="text-primary font-black uppercase text-[11px] tracking-widest flex items-center gap-2 hover:translate-x-2 transition-transform bg-primary/5 px-3 py-1.5 rounded-full">See All <ArrowRight size={16} /></Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {RECENT_MODULES.map((m) => <ModuleCard key={m.id} {...m} />)}
            </div>
          </section>

          <section className="space-y-6">
            <div className="px-1">
              <h2 className="text-2xl font-black tracking-tight">Exam readiness</h2>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-1">
                Mastery discounted by how much you&apos;d still recall today — knowing it once
                is not readiness.
              </p>
            </div>
            <ExamReadinessBoard />
          </section>
        </div>

        <div className="space-y-8">
          <section className="bg-[#1c2638] text-white p-7 rounded-[20px] space-y-6 relative overflow-hidden shadow-lg">
            <div className="relative z-10">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-blue-200 mb-3">
                Today&apos;s one thing
              </p>
              {dueCount > 0 ? (
                <p className="text-slate-300 font-medium leading-relaxed">
                  <span className="text-white font-black">{dueCount} skill{dueCount === 1 ? "" : "s"}</span>{" "}
                  are scheduled for review right now — timed so you revisit them just before
                  you&apos;d forget. Twenty minutes here is worth more than two hours of
                  rereading.
                </p>
              ) : (
                <p className="text-slate-300 font-medium leading-relaxed">
                  Nothing is due for review. Good place to be. Photograph a page of notes and
                  StudyDesk will turn it into questions and schedule them for you.
                </p>
              )}
            </div>

            <Link
              href={dueCount > 0 ? "/student/quiz" : "/student/notes"}
              className="relative z-10 w-full py-4 bg-primary text-white rounded-base font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-primary/30 transition-all"
            >
              {dueCount > 0 ? "Start the review" : "Capture notes"}
              <ArrowRight size={16} />
            </Link>

            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary opacity-20 blur-[80px]" />
          </section>

          <section className="surface-card rounded-[20px] p-7 space-y-7">
            <div className="flex justify-between items-center">
              <div><p className="eyebrow">Keep momentum</p><h3 className="mt-1 text-xl font-semibold tracking-tight">Upcoming sessions</h3></div>
              <Link href="/student/planner" className="text-primary hover:bg-primary/10 p-1 rounded-full transition-colors"><Plus size={20} /></Link>
            </div>
            <div className="space-y-6">
              {DEMO_UPCOMING_SESSIONS.map((session) => (
                <div key={session.id} className="flex gap-4">
                  <div className={cn(
                    "w-1 h-12 rounded-full",
                    session.type === "exam" ? "bg-red-500 shadow-md shadow-red-500/20" : session.type === "group" ? "bg-primary shadow-md shadow-primary/20" : "bg-emerald-500"
                  )} />
                  <div>
                    <h4 className="font-extrabold tracking-tight mb-1">{session.title}</h4>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
                      <Clock size={12} className="text-primary" />
                      <span>{session.time}</span>
                      <span className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
                      <span>{session.duration}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/student/planner" className="block w-full py-4 text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 rounded-base hover:bg-primary/10 hover:text-primary transition-all text-center">Open calendar</Link>
          </section>
        </div>
      </div>

      <AnimatePresence>
        {showNewModule && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNewModule(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-xl shadow-2xl relative z-10 p-8 space-y-8"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold italic tracking-tighter underline decoration-primary decoration-4">New Module</h2>
                <button onClick={() => setShowNewModule(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X /></button>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Module Name / Code</label>
                  <input
                    type="text"
                    value={moduleName}
                    onChange={(e) => setModuleName(e.target.value)}
                    placeholder="e.g. CS201: Data Structures"
                    className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary rounded-base outline-none transition-all font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Subject Area</label>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary rounded-base outline-none font-bold appearance-none"
                  >
                    {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Colour Accent</label>
                  <div className="flex gap-3">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setSelectedColor(c)}
                        className="w-10 h-10 rounded-full border-4 transition-all"
                        style={{ backgroundColor: c, borderColor: selectedColor === c ? c : "transparent", boxShadow: selectedColor === c ? `0 0 0 2px white, 0 0 0 4px ${c}` : undefined }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <button
                onClick={() => { setShowNewModule(false); router.push("/student/modules"); }}
                className="w-full py-5 bg-primary text-white font-bold text-lg rounded-base hover:shadow-2xl hover:shadow-primary/30 active:scale-95 transition-all"
              >
                Create Module
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
