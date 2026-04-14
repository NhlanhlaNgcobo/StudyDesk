"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { 
  Users, 
  Search, 
  MoreVertical, 
  Video, 
  Smile, 
  Paperclip, 
  Send, 
  Megaphone, 
  FileText, 
  Plus, 
  Trash2, 
  Pin,
  ChevronLeft,
  X,
  PlusCircle,
  Hash,
  Activity,
  ArrowLeft
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// --- Mock Data ---

const GROUP = { id: "1", name: "CS201: Algorithms Pod", subject: "Engineering", memberCount: 8 };

const MEMBERS = [
  { id: "m1", name: "Nhlanhla Ngcobo", initials: "NN", color: "bg-blue-500", online: true },
  { id: "m2", name: "Sarah Muller", initials: "SM", color: "bg-purple-500", online: true },
  { id: "m3", name: "John Doe", initials: "JD", color: "bg-orange-500", online: false },
  { id: "m4", name: "Grace Khoza", initials: "GK", color: "bg-pink-500", online: true },
  { id: "m5", name: "Tutor Adams", initials: "TA", color: "bg-emerald-500", online: true, role: "Tutor" },
  { id: "m6", name: "Liam Smith", initials: "LS", color: "bg-indigo-500", online: false },
  { id: "m7", name: "Emily Chen", initials: "EC", color: "bg-yellow-500", online: true },
  { id: "m8", name: "David Bekker", initials: "DB", color: "bg-red-500", online: false },
];

const MESSAGES = [
  { id: "1", sender: "TA", senderName: "Tutor Adams", text: "Welcome everyone! Ready for the workshop?", time: "09:00 AM", isTutor: true, date: "April 02" },
  { id: "2", sender: "NN", senderName: "Nhlanhla Ngcobo", text: "Ready! Excited for dynamic programming.", time: "09:05 AM", isTutor: false, date: "April 02" },
  { id: "3", type: "announcement", text: "Workshop starting in 10 minutes!", time: "09:50 AM", date: "April 02" },
  { id: "4", sender: "SM", senderName: "Sarah Muller", text: "Quick question on Big O...", time: "10:15 AM", isTutor: false, date: "April 02" },
  { id: "5", type: "file", sender: "TA", senderName: "Tutor Adams", fileName: "Algorithms_Cheat_Sheet.pdf", time: "10:30 AM", date: "April 02" },
  { id: "6", sender: "TA", senderName: "Tutor Adams", text: "Excellent follow-up. Let's dive in.", time: "10:35 AM", isTutor: true, date: "April 03" },
  { id: "7", sender: "GK", senderName: "Grace Khoza", text: "Is there a recording?", time: "10:40 AM", isTutor: false, date: "April 03" },
  { id: "8", sender: "NN", senderName: "Nhlanhla Ngcobo", text: "I'll double-check.", time: "10:42 AM", isTutor: false, date: "April 03" },
  { id: "9", type: "announcement", text: "Quiz on Sorting Algorithms added to the module.", time: "11:00 AM", date: "April 03" },
  { id: "10", sender: "TA", senderName: "Tutor Adams", text: "Everyone, check the new quiz I just posted.", time: "11:05 AM", isTutor: true, date: "April 03" },
  { id: "11", sender: "SM", senderName: "Sarah Muller", text: "Thanks Tutor!", time: "11:10 AM", isTutor: false, date: "Today" },
  { id: "12", sender: "LS", senderName: "Liam Smith", text: "Can we discuss merge sort?", time: "11:15 AM", isTutor: false, date: "Today" },
  { id: "13", sender: "TA", senderName: "Tutor Adams", text: "Sure thing Liam.", time: "11:20 AM", isTutor: true, date: "Today" },
  { id: "14", type: "file", sender: "NN", senderName: "Nhlanhla Ngcobo", fileName: "Merge_Sort_Analysis.png", time: "11:25 AM", date: "Today" },
  { id: "15", sender: "TA", senderName: "Tutor Adams", text: "Great work Nhlanhla. That diagram is helpful.", time: "11:30 AM", isTutor: true, date: "Today" },
];

const ANNOUNCEMENTS = [
  { id: "a1", text: "Workshop on Recursion tomorrow at 3 PM.", pinned: true },
  { id: "a2", text: "Algorithms cheat sheet uploaded.", pinned: false },
];

const FILES = [
  { id: "f1", name: "Recursion_Guide.pdf", type: "pdf", date: "April 02" },
  { id: "f2", name: "Complexity_Reference.xlsx", type: "sheet", date: "April 03" },
  { id: "f3", name: "Sorting_Quiz_Summary.pdf", type: "pdf", date: "Today" },
];

// --- Sub-components ---

export default function TutorGroupChatPage() {
  const [showInvite, setShowInvite] = useState(false);
  const [msgInput, setMsgInput] = useState("");
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatRef.current) {
        chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, []);

  return (
    <div className="h-full flex flex-col md:flex-row bg-white dark:bg-slate-950 border rounded-xl overflow-hidden shadow-2xl animate-in fade-in duration-700">
      
      {/* Column 1: Members (220px) */}
      <aside className="w-full md:w-[260px] border-r border-slate-100 dark:border-slate-800 flex flex-col bg-slate-50/30 dark:bg-slate-900/10">
          <div className="p-8 border-b bg-white dark:bg-slate-900">
              <Link href="/tutor/dashboard" className="flex items-center gap-2 text-text-secondary hover:text-emerald-500 font-black uppercase text-[8px] tracking-widest mb-4 transition-colors"><ArrowLeft size={10}/> Back to Pods</Link>
              <h2 className="text-xl font-black italic tracking-tighter leading-tight uppercase underline decoration-emerald-500 decoration-4">{GROUP.name}</h2>
              <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mt-2 flex items-center gap-2"><Hash size={10} className="text-emerald-500"/> {GROUP.subject}</p>
          </div>

          <div className="p-4 border-b">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input 
                    type="text" 
                    placeholder="Search Peers..."
                    className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-slate-900 border-2 border-transparent focus:border-emerald-500/30 rounded-base outline-none transition-all text-xs font-bold shadow-sm"
                />
              </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-1">
               {MEMBERS.map(m => (
                   <div key={m.id} className="flex items-center justify-between p-3 hover:bg-white dark:hover:bg-slate-900 rounded-base cursor-pointer group transition-all">
                       <div className="flex items-center gap-3">
                           <div className={cn("w-10 h-10 rounded-full flex items-center justify-center font-black text-[10px] text-white border-2 border-white dark:border-slate-800 shadow-sm relative", m.color)}>
                               {m.initials}
                               {m.online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full" />}
                           </div>
                           <div>
                               <div className="flex items-center gap-2">
                                <p className="text-xs font-extrabold tracking-tight truncate max-w-[100px]">{m.name}</p>
                                {m.role === "Tutor" && <span className="text-[8px] font-black uppercase tracking-widest px-1 bg-emerald-50 text-emerald-600 rounded">T</span>}
                               </div>
                               <p className="text-[8px] font-bold text-text-secondary">{m.online ? "Online Now" : "Sleeping"}</p>
                           </div>
                       </div>
                       <button className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 p-1.5 rounded-full"><X size={14}/></button>
                   </div>
               ))}
          </div>

          <div className="p-4 border-t bg-white dark:bg-slate-900">
               <button 
                onClick={() => setShowInvite(true)}
                className="w-full py-3 bg-emerald-500 text-white font-black text-xs uppercase tracking-widest rounded-base hover:shadow-lg hover:shadow-emerald-500/20 active:scale-95 transition-all shadow-xl"
               >
                 Invite Link
               </button>
          </div>
      </aside>

      {/* Column 2: Chat (Flex-1) */}
      <main className="flex-1 flex flex-col h-[calc(100vh-140px)] md:h-auto overflow-hidden bg-white dark:bg-slate-950">
          <header className="h-20 px-8 border-b flex items-center justify-between bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shrink-0">
               <div className="flex items-center gap-4">
                   <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-base flex items-center justify-center border border-emerald-100 shadow-sm"><Users size={20}/></div>
                   <div>
                       <h3 className="font-extrabold tracking-tight">Project Pod Discussion</h3>
                       <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {GROUP.memberCount} Students Synchronizing</p>
                   </div>
               </div>
               <div className="flex items-center gap-2">
                   <button className="p-3 bg-emerald-50 text-emerald-600 rounded-full hover:bg-emerald-500 hover:text-white transition-all shadow-sm"><Video size={18} /></button>
                   <button className="p-3 hover:bg-slate-50 rounded-full text-slate-400 transition-all"><MoreVertical size={20} /></button>
               </div>
          </header>

          <div ref={chatRef} className="flex-1 overflow-y-auto p-8 space-y-10 scrollbar-hide">
               {MESSAGES.map((msg, i) => {
                   const isNewDate = i === 0 || MESSAGES[i-1].date !== msg.date;
                   
                   return (
                       <React.Fragment key={msg.id}>
                           {isNewDate && (
                               <div className="flex justify-center my-10">
                                   <span className="px-6 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-400 shadow-sm">{msg.date}</span>
                               </div>
                           )}

                           {msg.type === "announcement" ? (
                               <div className="bg-yellow-50 dark:bg-yellow-900/10 border-2 border-yellow-100 dark:border-yellow-900/30 p-8 rounded-xl flex items-start gap-6 shadow-xl shadow-yellow-200/20 max-w-2xl mx-auto w-full group animate-in slide-in-from-bottom-2">
                                   <div className="w-14 h-14 bg-white dark:bg-slate-900 text-yellow-600 rounded-base shrink-0 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"><Megaphone size={28}/></div>
                                   <div className="space-y-1">
                                       <p className="text-xs font-black uppercase tracking-widest text-yellow-600 italic">Academic Alert</p>
                                       <p className="text-lg font-black text-yellow-900 dark:text-yellow-100 tracking-tight">{msg.text}</p>
                                       <p className="text-[10px] font-bold text-yellow-600 opacity-60 uppercase">{msg.time}</p>
                                   </div>
                               </div>
                           ) : (
                               <div className={cn(
                                   "flex flex-col gap-2 max-w-[85%] animate-in fade-in slide-in-from-bottom-1",
                                   msg.isTutor ? "items-end ml-auto" : "items-start"
                               )}>
                                   <div className="flex items-center gap-2 px-1">
                                       <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary">{msg.senderName}</span>
                                       <span className="text-[10px] font-bold text-slate-300 italic">{msg.time}</span>
                                   </div>
                                   
                                   {msg.type === "file" ? (
                                       <div className={cn(
                                           "p-6 rounded-xl border-2 flex items-center gap-4 transition-all hover:shadow-lg cursor-pointer group",
                                           msg.isTutor ? "bg-emerald-500 border-emerald-400 text-white" : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800"
                                       )}>
                                           <div className={cn("w-10 h-10 rounded-base flex items-center justify-center shadow-lg", msg.isTutor ? "bg-white text-emerald-500" : "bg-emerald-50 text-emerald-500")}><FileText size={20}/></div>
                                           <div>
                                               <p className="font-black tracking-tight underline decoration-2">{msg.fileName}</p>
                                               <p className={cn("text-[8px] font-black uppercase tracking-widest", msg.isTutor ? "text-emerald-100" : "text-text-secondary")}>Audited PDF • 2.4 MB</p>
                                           </div>
                                       </div>
                                   ) : (
                                        <div className={cn(
                                            "p-6 rounded-2xl font-medium tracking-tight text-md shadow-sm border",
                                            msg.isTutor 
                                                ? "bg-emerald-500 text-white rounded-tr-none border-emerald-400 shadow-emerald-500/10" 
                                                : "bg-slate-100 dark:bg-slate-800 text-text-primary rounded-tl-none border-transparent"
                                        )}>
                                            {msg.text}
                                        </div>
                                   )}
                               </div>
                           )}
                       </React.Fragment>
                   );
               })}
          </div>

          <footer className="p-8 border-t bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800">
               <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl flex items-end gap-2 border-2 border-transparent focus-within:border-emerald-500/20 transition-all shadow-inner">
                    <button className="p-3 text-slate-400 hover:text-emerald-500 transition-colors"><Smile size={24}/></button>
                    <button className="p-3 text-slate-400 hover:text-emerald-500 transition-colors"><Paperclip size={24}/></button>
                    <textarea 
                        value={msgInput}
                        onChange={(e) => setMsgInput(e.target.value)}
                        placeholder="Sync message with pod..."
                        className="flex-1 bg-transparent border-none outline-none resize-none py-3 font-medium text-lg min-h-[60px]"
                    />
                    <button className="w-14 h-14 bg-emerald-500 text-white rounded-xl flex items-center justify-center hover:shadow-xl hover:shadow-emerald-500/30 active:scale-95 transition-all shadow-lg shrink-0"><Send size={24}/></button>
               </div>
          </footer>
      </main>

      {/* Column 3: Files & Announcements (260px) */}
      <aside className="hidden xl:flex flex-col w-[300px] border-l border-slate-100 dark:border-slate-800 p-8 space-y-12 bg-slate-50/20">
          <section className="space-y-6">
              <div className="flex justify-between items-center px-1">
                <div className="flex items-center gap-3">
                  <Megaphone className="text-emerald-500" size={20} />
                  <h3 className="text-sm font-black uppercase tracking-widest">Broadcasts</h3>
                </div>
                <button className="p-1 px-3 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100 hover:bg-emerald-500 hover:text-white transition-all shadow-sm leading-none">New</button>
              </div>
              <div className="space-y-4">
                  {ANNOUNCEMENTS.map(a => (
                      <div key={a.id} className="p-5 bg-white dark:bg-slate-900 rounded-xl border-2 border-slate-50 dark:border-slate-800 shadow-sm relative group hover:border-emerald-500/30 transition-all">
                          <p className="text-xs font-black tracking-tight text-text-secondary leading-relaxed pr-6">{a.text}</p>
                          {a.pinned && <div className="absolute top-4 right-4 text-emerald-500"><Pin size={12} fill="currentColor"/></div>}
                      </div>
                  ))}
              </div>
          </section>

          <section className="space-y-6">
              <div className="flex justify-between items-center px-1">
                <div className="flex items-center gap-3">
                  <FileText className="text-emerald-500" size={20} />
                  <h3 className="text-sm font-black uppercase tracking-widest">Pod Archive</h3>
                </div>
                <button className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"><Plus size={16}/></button>
              </div>
              <div className="space-y-4">
                   {FILES.map(f => (
                       <div key={f.id} className="p-5 bg-white dark:bg-slate-900 border rounded-xl flex items-center gap-4 group hover:bg-emerald-50 transition-all cursor-pointer shadow-sm">
                           <div className="w-10 h-10 bg-slate-50 border rounded-base flex items-center justify-center text-emerald-500 group-hover:bg-white transition-colors shadow-sm"><FileText size={20}/></div>
                           <div>
                               <p className="text-xs font-black tracking-tight group-hover:text-emerald-600 truncate max-w-[120px] underline decoration-emerald-200">{f.name}</p>
                               <p className="text-[10px] font-bold text-text-secondary uppercase">{f.date}</p>
                           </div>
                       </div>
                   ))}
              </div>
              <button className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary bg-slate-50 dark:bg-slate-800 rounded-base hover:text-emerald-500 transition-colors shadow-sm">Audit All Assets</button>
          </section>

          <section className="bg-slate-900 text-white p-8 rounded-xl space-y-4 relative overflow-hidden shadow-2xl">
              <Activity className="text-emerald-500" size={32} />
              <h4 className="text-lg font-black italic tracking-tighter uppercase leading-tight italic underline decoration-emerald-500 decoration-2">Engagement Pulse</h4>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">85% Activity Increase in 24h</p>
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-emerald-500 blur-[60px] opacity-20" />
          </section>
      </aside>

      {/* Invite Modal */}
      <AnimatePresence>
        {showInvite && (
             <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
                 <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white p-12 rounded-xl shadow-2xl max-w-md w-full relative space-y-8 border-4 border-slate-50"
                 >
                    <button onClick={() => setShowInvite(false)} className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-colors"><X/></button>
                    <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-50/50"><Users size={36}/></div>
                    <div className="text-center space-y-2">
                        <h3 className="text-3xl font-black italic tracking-tighter underline decoration-emerald-500 decoration-4">Invite Sync Code</h3>
                        <p className="text-text-secondary font-medium">Forward this pod access terminal to your students.</p>
                    </div>
                    <div className="p-6 bg-slate-50 border-2 border-dashed border-emerald-500/30 rounded-xl flex items-center justify-between group shadow-inner">
                        <span className="text-2xl font-black italic tracking-widest text-emerald-600">STUDY-ALG-01</span>
                        <button className="px-4 py-2 bg-emerald-500 text-white font-black uppercase text-[10px] tracking-widest rounded-base hover:shadow-lg transition-all active:scale-95">Copy</button>
                    </div>
                 </motion.div>
             </div>
        )}
      </AnimatePresence>
    </div>
  );
}
