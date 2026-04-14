"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Users, 
  Search, 
  Plus, 
  Hash, 
  ChevronRight, 
  Lock, 
  Play, 
  Activity,
  Award,
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// --- Mock Data ---

const SUBJECTS = ["All", "Engineering", "Law", "Medicine", "Humanities", "Sci-Tech"];

const MY_GROUPS = [
  { id: "1", name: "CS201: Algorithms Pod", subject: "Engineering", tutor: "Tutor Adams", members: 8, activity: "Active Now" },
  { id: "2", name: "Law 101 Exam Prep", subject: "Law", tutor: "Adv. Smith", members: 12, activity: "Yesterday" },
];

const RECOMMENDED_GROUPS = [
  { id: "3", name: "Advanced Macroeconomics", subject: "Humanities", tutor: "Prof. Muller", members: 15, popularity: "High" },
  { id: "4", name: "Organic Chem Workshop", subject: "Medicine", tutor: "Dr. Khoza", members: 20, popularity: "Rising" },
  { id: "5", name: "Structural Analysis Lab", subject: "Engineering", tutor: "Eng. Bekker", members: 6, popularity: "Niche" },
];

// --- Sub-components ---

export default function StudentGroupsPage() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [joinCode, setJoinCode] = useState("");

  return (
    <div className="space-y-16 animate-in fade-in duration-700">
      
      {/* Header Container */}
      <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-12">
          <div className="space-y-4">
               <h1 className="text-5xl font-black italic tracking-tighter uppercase underline decoration-primary decoration-4">Study Pods</h1>
               <p className="text-xl text-text-secondary font-bold max-w-xl leading-relaxed">Collaborate with peers, sync with tutors, and dominate your course material together.</p>
          </div>

          <div className="w-full lg:w-[400px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 rounded-xl shadow-2xl relative overflow-hidden group">
              <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-3">
                    <Lock size={20} className="text-primary" />
                    <h3 className="text-sm font-black uppercase tracking-widest">Join Private Pod</h3>
                </div>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value)}
                        placeholder="Pod Code (e.g. STUDY-01)"
                        className="flex-1 px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-primary rounded-base outline-none font-black text-sm uppercase tracking-widest transition-all shadow-inner"
                    />
                    <button className="px-6 py-3 bg-primary text-white font-black uppercase text-xs tracking-widest rounded-base hover:shadow-xl hover:shadow-primary/30 active:scale-95 transition-all shadow-lg">Enter Pod</button>
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Ask your tutor for a sync code to join specific study groups.</p>
              </div>
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-primary blur-[60px] opacity-10 group-hover:opacity-20 transition-opacity" />
          </div>
      </section>

      {/* Navigation & Search Cluster */}
      <section className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-xl shadow-sm flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                    type="text" 
                    placeholder="Search Pods, Tutors, or Subjects..."
                    className="w-full pl-16 pr-6 py-5 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary rounded-base outline-none transition-all font-medium text-lg shadow-inner"
                />
            </div>
            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar w-full md:w-auto px-2">
                {SUBJECTS.map(s => (
                    <button 
                        key={s} 
                        onClick={() => setActiveFilter(s)}
                        className={cn(
                            "px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border-2",
                            activeFilter === s ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" : "bg-slate-50 border-transparent text-slate-400 hover:border-slate-200"
                        )}
                    >
                        {s}
                    </button>
                ))}
            </div>
      </section>

      {/* My Groups Cluster */}
      <section className="space-y-8">
           <div className="flex items-center gap-4 px-1">
               <Activity className="text-primary" size={24} />
               <h2 className="text-3xl font-black italic tracking-tighter uppercase underline decoration-2 decoration-primary">Active My Syncs</h2>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {MY_GROUPS.map(g => (
                   <div key={g.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-8 space-y-8 group hover:border-primary/50 hover:shadow-2xl hover:shadow-black/5 transition-all flex flex-col h-full border-b-8 border-b-primary shadow-sm">
                       <div className="flex justify-between items-start">
                            <div className="w-14 h-14 bg-primary text-white rounded-base flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"><Users size={28}/></div>
                            <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-widest">{g.activity}</div>
                       </div>
                       
                       <div className="flex-1">
                           <h3 className="text-2xl font-black italic tracking-tight uppercase leading-tight group-hover:text-primary transition-colors mb-2">{g.name}</h3>
                           <p className="text-sm font-bold text-text-secondary flex items-center gap-2"><Award size={16} className="text-primary"/> Lead by {g.tutor}</p>
                       </div>

                       <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex -space-x-2">
                                     <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white shadow-sm" />
                                     <div className="w-8 h-8 rounded-full bg-slate-900 border-2 border-white text-white flex items-center justify-center text-[10px] font-black italic">+{g.members - 1}</div>
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Sync Active</span>
                            </div>
                            <Link 
                                href={`/student/groups/${g.id}`}
                                className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-base flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all shadow-sm active:scale-90"
                            >
                                <Play size={20} fill="currentColor" />
                            </Link>
                       </div>
                   </div>
               ))}
           </div>
      </section>

      {/* Discovery Cluster */}
      <section className="space-y-8">
           <div className="flex items-center gap-4 px-1">
               <Plus className="text-primary" size={24} />
               <h2 className="text-3xl font-black italic tracking-tighter uppercase underline decoration-2 decoration-primary">Discover Academic Pods</h2>
           </div>

           <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead className="bg-slate-50/50 border-b">
                        <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            <th className="px-10 py-5">Pod Information</th>
                            <th className="px-10 py-5">Tutor Lead</th>
                            <th className="px-10 py-5">Subject</th>
                            <th className="px-10 py-5">Community</th>
                            <th className="px-10 py-5 text-right">Access</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {RECOMMENDED_GROUPS.map(g => (
                            <tr key={g.id} className="group hover:bg-slate-50 transition-colors">
                                <td className="px-10 py-6">
                                    <h4 className="font-black italic tracking-tight uppercase group-hover:text-primary transition-colors">{g.name}</h4>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Engagement Score: {g.popularity}</p>
                                </td>
                                <td className="px-10 py-6">
                                     <p className="text-sm font-bold text-text-secondary">{g.tutor}</p>
                                </td>
                                <td className="px-10 py-6">
                                     <span className="px-3 py-1 bg-slate-50 border rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500">{g.subject}</span>
                                </td>
                                <td className="px-10 py-6">
                                     <p className="text-sm font-bold text-text-secondary">{g.members} Students</p>
                                </td>
                                <td className="px-10 py-6 text-right">
                                     <button className="px-6 py-2 border-2 border-primary text-primary font-black uppercase text-[10px] tracking-widest rounded-full hover:bg-primary hover:text-white transition-all shadow-sm">Join Pod</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
           </div>
           
           <div className="flex justify-center pt-8">
                <button className="flex items-center gap-3 text-sm font-black uppercase tracking-widest text-text-secondary hover:text-primary transition-colors translate-y-0 hover:-translate-y-2">Load More Discovery Items <ArrowRight size={18}/></button>
           </div>
      </section>
    </div>
  );
}
