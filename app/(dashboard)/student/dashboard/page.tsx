"use client";

import React, { useState } from "react";
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
  TrendingUp,
  Brain,
  Layers,
  Flame,
  Calendar,
  X,
  PlusCircle
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { DEMO_UPCOMING_SESSIONS, DEMO_MODULES } from "@/lib/mock-data";
import { useAuth } from "@/contexts/auth-context";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";

const COLORS = ["#4DA6FF", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444", "#EC4899"];
const SUBJECTS = ["Science", "Maths", "Humanities", "Law", "Engineering", "Medicine"];

// --- Mock Data ---

const METRICS = [
  { label: "Modules Created", value: 8, icon: Layers, color: "text-blue-500", bg: "bg-blue-50" },
  { label: "Notes Generated", value: 24, icon: FileText, color: "text-purple-500", bg: "bg-purple-50" },
  { label: "Quizzes Taken", value: 16, icon: Brain, color: "text-orange-500", bg: "bg-orange-50" },
  { label: "Hours Studied", value: 47, icon: Clock, color: "text-emerald-500", bg: "bg-emerald-50" },
];

const RECENT_MODULES = DEMO_MODULES.slice(0, 3).map((m) => ({
  id: m.id,
  name: m.name,
  tags: m.tags,
  fileCount: m.fileCount,
  progress: m.progress,
  color: m.id === "1" ? "bg-blue-500" : m.id === "2" ? "bg-purple-500" : "bg-emerald-500",
}));

const WEEKLY_ACTIVITY = [
  { day: "Mon", hours: 4.5 },
  { day: "Tue", hours: 6.2 },
  { day: "Wed", hours: 3.8 },
  { day: "Thu", hours: 8.4 },
  { day: "Fri", hours: 5.1 },
  { day: "Sat", hours: 2.3 },
  { day: "Sun", hours: 4.8 },
];

// --- Sub-components ---

const MetricCard = ({ label, value, icon: Icon, color, bg }: any) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-6"
  >
    <div className={cn("w-14 h-14 rounded-base flex items-center justify-center shrink-0", bg, color)}>
      <Icon size={28} />
    </div>
    <div>
      <h3 className="text-3xl font-bold text-text-primary mb-1 tracking-tight">{value}</h3>
      <p className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{label}</p>
    </div>
  </motion.div>
);

const ModuleCard = ({ id, name, tags, fileCount, progress, color }: any) => (
  <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col gap-6 group hover:shadow-xl hover:shadow-slate-200/50 hover:border-primary/50 transition-all">
    <div className="flex justify-between items-start">
      <div className={cn("px-3 py-1 font-black text-[10px] uppercase tracking-widest text-white rounded-full", color)}>
        {tags[0]}
      </div>
      <button className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
        <MoreVertical size={20} />
      </button>
    </div>
    
    <div>
      <h3 className="text-xl font-extrabold mb-2 tracking-tight group-hover:text-primary transition-colors">{name}</h3>
      <p className="text-sm font-bold text-text-secondary">{fileCount} Study Files Attached</p>
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

    <Link href={`/student/modules/${id}`} className="w-full py-4 mt-2 bg-slate-50 dark:bg-slate-800 rounded-base font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-primary hover:text-white transition-all shadow-sm text-center">
       Continue Studying <Play size={14} fill="currentColor" />
    </Link>
  </div>
);

export default function StudentDashboard() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [showNewModule, setShowNewModule] = useState(false);
  const [moduleName, setModuleName] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("Engineering");
  const [selectedColor, setSelectedColor] = useState("#4DA6FF");
  const [generating, setGenerating] = useState<string | null>(null);

  const [recentNotes, setRecentNotes] = useState<any[]>([]);
  const [totalGenerated, setTotalGenerated] = useState(0);
  const [dataLoading, setDataLoading] = useState(true);

  React.useEffect(() => {
    if (!user) return;
    const fetchDashboardData = async () => {
      try {
        const q = query(
          collection(db, "notes"), 
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        const fetchedNotes = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setRecentNotes(fetchedNotes.slice(0, 3));
        setTotalGenerated(fetchedNotes.length);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setDataLoading(false);
      }
    };
    fetchDashboardData();
  }, [user]);

  const dynamicMetrics = [
    { label: "Modules Created", value: 0, icon: Layers, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "Notes Generated", value: totalGenerated, icon: FileText, color: "text-purple-500", bg: "bg-purple-50" },
    { label: "Quizzes Taken", value: 0, icon: Brain, color: "text-orange-500", bg: "bg-orange-50" },
    { label: "Hours Studied", value: 0, icon: Clock, color: "text-emerald-500", bg: "bg-emerald-50" },
  ];

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const dateStr = now.toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const handleQuickAction = (path: string, key: string) => {
    setGenerating(key);
    setTimeout(() => {
      setGenerating(null);
      router.push(path);
    }, 1200);
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      {/* Header */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight italic decoration-primary decoration-4 underline">
             {greeting}, {profile?.name?.split(' ')[0] || "Student"}
          </h1>
          <div className="flex items-center gap-4 mt-3 text-slate-600 dark:text-slate-300 font-bold">
             <Calendar size={18} className="text-primary" />
             <span>{dateStr}</span>
             <span className="w-1.5 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full" />
             <div className="flex items-center gap-1.5 px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full text-xs font-black uppercase tracking-widest">
                <Flame size={14} /> {profile?.streak || 1} Day Streak
             </div>
          </div>
        </div>

        <button
          onClick={() => setShowNewModule(true)}
          className="px-8 py-4 bg-primary text-white font-black text-lg rounded-base flex items-center justify-center gap-3 hover:shadow-2xl hover:shadow-primary/30 active:scale-95 transition-all"
        >
          <Plus size={24} /> New Study Module
        </button>
      </section>

      {/* Metrics Row */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {dynamicMetrics.map(metric => <MetricCard key={metric.label} {...metric} />)}
      </section>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Modules & Activity */}
        <div className="lg:col-span-2 space-y-12">
            
            {dataLoading ? (
               <div className="h-[500px] flex items-center justify-center bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 flex-1">
                   <div className="flex flex-col items-center gap-6">
                       <span className="w-10 h-10 border-4 border-slate-200 dark:border-slate-800 border-t-primary rounded-full animate-spin" />
                       <p className="text-xs font-black text-slate-500 uppercase tracking-widest animate-pulse">Syncing Databank...</p>
                   </div>
               </div>
            ) : totalGenerated === 0 ? (
               <div className="h-[500px] bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-16 flex flex-col items-center justify-center text-center shadow-sm">
                    <div className="w-24 h-24 bg-primary/5 text-primary rounded-full flex items-center justify-center mb-8 border-4 border-white dark:border-slate-900 shadow-xl">
                         <FileText size={48} />
                    </div>
                    <h3 className="text-3xl font-extrabold mb-3 tracking-tight">Your Databank is Empty</h3>
                    <p className="text-slate-500 dark:text-slate-400 font-medium max-w-md mb-10 leading-relaxed text-sm">
                       Upload your study materials, lecture slides, and PDF readings to begin generating smart study notes, quizzes, and exams.
                    </p>
                    <Link href="/student/modules" className="px-8 py-4 bg-primary text-white font-black uppercase text-xs tracking-widest rounded-base hover:shadow-xl hover:shadow-primary/30 active:scale-95 transition-all flex items-center gap-3">
                       <Plus size={18} /> Upload First Document
                    </Link>
               </div>
            ) : (
                <>
                    {/* Quick Actions */}
                    <section className="space-y-6">
                        <h2 className="text-2xl font-black tracking-tight">Quick Actions</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                           <button
                             onClick={() => handleQuickAction("/student/notes", "notes")}
                             className="p-8 bg-blue-100/50 dark:bg-blue-900/10 border-2 border-blue-100 dark:border-blue-900/30 rounded-xl flex flex-col items-center gap-4 text-center group hover:bg-blue-100 transition-all active:scale-95 shadow-sm relative overflow-hidden"
                           >
                             {generating === "notes" && <div className="absolute inset-0 flex items-center justify-center bg-blue-50/80"><span className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>}
                             <div className="w-14 h-14 bg-white dark:bg-slate-900 text-blue-500 rounded-base flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"><FileText size={28} /></div>
                             <span className="font-extrabold text-blue-600 tracking-tight">Generate Notes</span>
                           </button>
                           <button
                             onClick={() => handleQuickAction("/student/quiz", "quiz")}
                             className="p-8 bg-purple-100/50 dark:bg-purple-900/10 border-2 border-purple-100 dark:border-purple-900/30 rounded-xl flex flex-col items-center gap-4 text-center group hover:bg-purple-100 transition-all active:scale-95 shadow-sm relative overflow-hidden"
                           >
                             {generating === "quiz" && <div className="absolute inset-0 flex items-center justify-center bg-purple-50/80"><span className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>}
                             <div className="w-14 h-14 bg-white dark:bg-slate-900 text-purple-500 rounded-base flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"><Brain size={28} /></div>
                             <span className="font-extrabold text-purple-600 tracking-tight">Practice Quiz</span>
                           </button>
                           <button
                             onClick={() => handleQuickAction("/student/exams", "exams")}
                             className="p-8 bg-emerald-100/50 dark:bg-emerald-900/10 border-2 border-emerald-100 dark:border-emerald-900/30 rounded-xl flex flex-col items-center gap-4 text-center group hover:bg-emerald-100 transition-all active:scale-95 shadow-sm relative overflow-hidden"
                           >
                             {generating === "exams" && <div className="absolute inset-0 flex items-center justify-center bg-emerald-50/80"><span className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>}
                             <div className="w-14 h-14 bg-white dark:bg-slate-900 text-emerald-500 rounded-base flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"><Zap size={28} /></div>
                             <span className="font-extrabold text-emerald-600 tracking-tight text-balance">Launch Mock Exam</span>
                           </button>
                        </div>
                    </section>

                    {/* Recent Notes Grid */}
                    <section className="space-y-6">
                        <div className="flex justify-between items-center px-1">
                           <h2 className="text-2xl font-black tracking-tight">Recent Notes</h2>
                           <Link href="/student/notes" className="text-primary font-black uppercase text-[11px] tracking-widest flex items-center gap-2 hover:translate-x-2 transition-transform bg-primary/5 px-3 py-1.5 rounded-full">See All <ArrowRight size={16}/></Link>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                           {recentNotes.map((note, idx) => (
                             <div key={note.id} className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col gap-6 group hover:shadow-xl hover:shadow-slate-200/50 hover:border-primary/50 transition-all h-full">
                               <div className="flex justify-between items-start">
                                 <div className={cn("px-3 py-1 font-black text-[10px] uppercase tracking-widest text-white rounded-full", ["bg-blue-500", "bg-purple-500", "bg-emerald-500"][idx % 3])}>
                                   Module {note.moduleId}
                                 </div>
                                 <button className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                   <MoreVertical size={20} />
                                 </button>
                               </div>
                               
                               <div className="flex-1">
                                 <h3 className="text-lg font-extrabold mb-2 tracking-tight group-hover:text-primary transition-colors line-clamp-1">AI Study Guide</h3>
                                 <p className="text-xs font-medium text-text-secondary line-clamp-3 leading-relaxed">
                                   {note.content ? note.content.slice(0, 100) + "..." : "No preview available"}
                                 </p>
                               </div>

                               <Link href={`/student/notes`} className="w-full py-4 mt-2 bg-slate-50 dark:bg-slate-800 rounded-base font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-primary hover:text-white transition-all shadow-sm text-center">
                                  Review <Play size={14} fill="currentColor" />
                               </Link>
                             </div>
                           ))}
                        </div>
                    </section>

                    {/* Weekly Activity */}
                    <section className="space-y-6">
                        <div className="flex justify-between items-center px-1">
                            <h2 className="text-2xl font-black tracking-tight">Weekly Activity</h2>
                            <div className="flex items-center gap-2 text-emerald-500 font-bold text-sm bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-widest leading-none">
                                <TrendingUp size={14} /> +12% vs Last Week
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm h-[320px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={WEEKLY_ACTIVITY}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis 
                                        dataKey="day" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fontSize: 12, fontWeight: 900, fill: "#94A3B8" }}
                                        dy={10}
                                    />
                                    <YAxis 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fontSize: 12, fontWeight: 900, fill: "#94A3B8" }}
                                    />
                                    <Tooltip 
                                        cursor={{ fill: '#F8FAFF' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', fontWeight: 900, boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="hours" radius={[8, 8, 0, 0]} barSize={40}>
                                        {WEEKLY_ACTIVITY.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === 3 ? "#4DA6FF" : "#CBD5E1"} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </section>
                </>
            )}
        </div>

        {/* Sidebar Widgets - Upcoming & Progress */}
        <div className="space-y-8">
            <section className="bg-slate-900 text-white p-8 rounded-xl space-y-8 relative overflow-hidden shadow-2xl">
                 <div className="relative z-10">
                    <h3 className="text-xl font-bold uppercase tracking-widest text-primary mb-4 italic">Next Level Prep</h3>
                    <p className="text-slate-400 font-medium leading-relaxed">You've mastered <span className="text-white font-black">65%</span> of your syllabus. Complete 2 more quizzes to unlock the <span className="text-primary font-black">Elite Student</span> badge.</p>
                 </div>
                 <div className="relative z-10 p-6 bg-white/5 border border-white/10 rounded-base flex items-center gap-6 group hover:bg-white/10 transition-colors">
                    <div className="w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center font-black text-xl shadow-lg ring-4 ring-primary/20 group-hover:scale-110 transition-transform">
                        {profile?.name?.[0] || "S"}
                    </div>
                    <div>
                        <p className="font-black text-lg tracking-tight leading-tight mb-1">{profile?.rank || "Scholar"} Tier</p>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{profile?.points || 0} Points gained</p>
                    </div>
                 </div>
                 <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary opacity-20 blur-[80px]" />
            </section>

            <section className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-8 space-y-8 shadow-sm">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-black tracking-tight">Upcoming Sessions</h3>
                    <Link href="/student/planner" className="text-primary hover:bg-primary/10 p-1 rounded-full transition-colors"><Plus size={20} /></Link>
                </div>
                <div className="space-y-6">
                    {DEMO_UPCOMING_SESSIONS.map(session => (
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
                <Link href="/student/planner" className="block w-full py-4 text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 rounded-base hover:bg-primary/10 hover:text-primary transition-all text-center">View All Planner</Link>
            </section>
        </div>
      </div>

      {/* New Module Modal */}
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
                  <label className="text-xs font-bold uppercase tracking-widest text-text-secondary">Module Name / Code</label>
                  <input
                    type="text"
                    value={moduleName}
                    onChange={(e) => setModuleName(e.target.value)}
                    placeholder="e.g. CS201: Data Structures"
                    className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary rounded-base outline-none transition-all font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-text-secondary">Subject Area</label>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary rounded-base outline-none font-bold appearance-none"
                  >
                    {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-text-secondary">Colour Accent</label>
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
