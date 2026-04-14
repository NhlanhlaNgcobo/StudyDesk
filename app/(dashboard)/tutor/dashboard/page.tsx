"use client";

import React from "react";
import Link from "next/link";
import { 
  Plus, 
  Users, 
  BookOpen, 
  MoreVertical, 
  Clock, 
  ChevronRight, 
  Activity,
  ArrowUpRight,
  PlusCircle,
  Hash
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// --- Mock Data ---

const STATS = [
  { label: "Total Students", value: 47, icon: Users, color: "text-emerald-500", bg: "bg-emerald-50" },
  { label: "Active Groups", value: 4, icon: Activity, color: "text-blue-500", bg: "bg-blue-50" },
  { label: "Materials Shared", value: 23, icon: BookOpen, color: "text-purple-500", bg: "bg-purple-50" },
];

const GROUPS = [
  { id: "1", name: "CS201: Algorithms Pod", subject: "Engineering", members: 12, lastActivity: "2 mins ago", color: "bg-blue-500" },
  { id: "2", name: "High-Density Macro", subject: "Humanities", members: 8, lastActivity: "Yesterday", color: "bg-purple-500" },
  { id: "3", name: "Legal Theory Workshop", subject: "Law", members: 15, lastActivity: "3 days ago", color: "bg-emerald-500" },
  { id: "4", name: "Pre-Med Physics Study", subject: "Medicine", members: 10, lastActivity: "1 week ago", color: "bg-orange-500" },
];

// --- Sub-components ---

const StatCard = ({ label, value, icon: Icon, color, bg }: any) => (
  <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-8 group hover:shadow-xl hover:shadow-black/5 transition-all">
    <div className={cn("w-16 h-16 rounded-base flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-transform", bg, color)}>
      <Icon size={32} />
    </div>
    <div>
      <h3 className="text-4xl font-black text-text-primary mb-1 italic tracking-tighter">{value}</h3>
      <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">{label}</p>
    </div>
  </div>
);

const GroupCard = ({ group }: any) => (
  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-8 space-y-6 group hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/5 transition-all">
    <div className="flex justify-between items-start">
        <div className={cn("p-4 rounded-base text-white shadow-lg", group.color)}>
           <Users size={24} />
        </div>
        <button className="p-2 hover:bg-slate-50 rounded-full transition-colors"><MoreVertical size={18} /></button>
    </div>
    
    <div>
        <h3 className="text-xl font-extrabold tracking-tight mb-2 group-hover:text-emerald-500 transition-colors uppercase italic">{group.name}</h3>
        <div className="flex items-center gap-2 text-text-secondary">
             <Hash size={14} className="text-emerald-500"/>
             <span className="text-[10px] font-black uppercase tracking-widest">{group.subject}</span>
        </div>
    </div>

    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
        <div className="flex items-center gap-4">
            <div className="flex -space-x-3">
               {[1, 2, 3].map(i => (
                   <div key={i} className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white dark:border-slate-800 flex items-center justify-center font-black text-[10px] text-slate-400">U</div>
               ))}
               <div className="w-8 h-8 rounded-full bg-slate-900 border-2 border-white text-white flex items-center justify-center font-black text-[10px]">+{group.members - 3}</div>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary">{group.members} Members</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-secondary">
            <Clock size={12} className="text-emerald-500"/> {group.lastActivity}
        </div>
    </div>

    <Link 
        href={`/tutor/groups/${group.id}`}
        className="w-full py-4 bg-slate-50 dark:bg-slate-800 rounded-base font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-sm active:scale-95 border-0"
    >
        Open Workspace <ArrowUpRight size={14} />
    </Link>
  </div>
);

// --- Main Page ---

export default function TutorDashboard() {
  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* Header Container */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight underline italic decoration-emerald-500 decoration-4 uppercase">
              Tutor Dashboard
           </h1>
           <p className="text-text-secondary font-bold text-lg mt-2 font-inter">Welcome back, Tutor Adams. Your students are ready to master.</p>
        </div>

        <button 
           className="px-10 py-5 bg-emerald-500 text-white font-black text-xl rounded-base flex items-center justify-center gap-4 hover:shadow-2xl hover:shadow-emerald-500/30 active:scale-95 transition-all shadow-xl"
        >
          <PlusCircle size={28} /> Create New Group
        </button>
      </section>

      {/* Stats Cluster */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {STATS.map(s => <StatCard key={s.label} {...s} />)}
      </section>

      {/* Active Groups Archive */}
      <section className="space-y-8">
           <div className="flex justify-between items-center px-1">
               <h2 className="text-3xl font-black italic tracking-tighter uppercase underline decoration-2 decoration-emerald-500">Active Study Pods</h2>
               <button className="text-emerald-500 font-black uppercase text-xs tracking-widest flex items-center gap-2 hover:translate-x-2 transition-transform">Audit All <ChevronRight size={16}/></button>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
               {GROUPS.map(g => <GroupCard key={g.id} group={g} />)}
           </div>
      </section>
      
      {/* Recent Activity Mini-audits */}
      <section className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-10 shadow-sm space-y-6">
          <div className="flex items-center gap-4 mb-4">
              <Activity className="text-emerald-500" size={24} />
              <h2 className="text-xl font-black uppercase tracking-tight italic">Real-Time Insight Feed</h2>
          </div>
          <div className="space-y-4">
               {[
                   { user: "Sarah M.", action: "Aced the Physics Quiz", time: "10 mins ago", color: "text-emerald-600" },
                   { user: "John D.", action: "Uploaded Calculus Notes", time: "45 mins ago", color: "text-blue-600" },
                   { user: "Grace K.", action: "Asked a question in Law Pod", time: "2 hours ago", color: "text-purple-600" }
               ].map((act, i) => (
                   <div key={i} className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800 border rounded-base group hover:border-emerald-500/30 transition-all">
                       <div className="flex items-center gap-6">
                           <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border-2 border-emerald-500 flex items-center justify-center font-extrabold text-[10px] shadow-sm italic">UN</div>
                           <div>
                               <p className="font-extrabold tracking-tight"> {act.user} <span className={cn("font-black", act.color)}>{act.action}</span></p>
                               <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">{act.time}</p>
                           </div>
                       </div>
                       <button className="px-4 py-2 bg-white text-[10px] font-black uppercase tracking-widest border rounded-full hover:bg-emerald-500 hover:text-white transition-all">Review</button>
                   </div>
               ))}
          </div>
      </section>
    </div>
  );
}
