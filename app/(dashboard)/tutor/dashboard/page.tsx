"use client";

import Link from "next/link";
import { Activity, ArrowUpRight, BookOpen, ChevronRight, Clock3, Plus, Users } from "lucide-react";

const groups = [
  { id: "1", name: "CS201 · Algorithms", course: "Engineering", members: 12, activity: "2 min ago", tone: "bg-blue-600", progress: 76 },
  { id: "2", name: "Macroeconomics review", course: "Humanities", members: 8, activity: "Yesterday", tone: "bg-violet-600", progress: 54 },
  { id: "3", name: "Legal theory workshop", course: "Law", members: 15, activity: "3 days ago", tone: "bg-emerald-600", progress: 68 },
  { id: "4", name: "Pre-med physics", course: "Medicine", members: 10, activity: "1 week ago", tone: "bg-amber-500", progress: 42 },
];

const activity = [
  ["Sarah M.", "completed the Physics Quiz", "10 min ago", "bg-emerald-100 text-emerald-700"],
  ["John D.", "added Calculus notes", "45 min ago", "bg-blue-100 text-blue-700"],
  ["Grace K.", "asked a question in Legal Theory", "2 hr ago", "bg-violet-100 text-violet-700"],
];

export default function TutorDashboard() {
  return (
    <div className="mx-auto max-w-7xl space-y-10 animate-in fade-in duration-500">
      <section className="flex flex-col gap-5 border-b border-app pb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow">Tutor workspace</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-[-0.045em] md:text-5xl">A clear view of your cohorts.</h1>
          <p className="mt-3 max-w-xl text-base font-medium text-text-secondary">Guide the work that needs you, without losing the thread of every group.</p>
        </div>
        <Link href="/tutor/groups" className="inline-flex items-center justify-center gap-2 rounded-base bg-emerald-600 px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"><Plus size={18} /> Create a group</Link>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[["47", "Active students", Users, "text-emerald-700 bg-emerald-50"], ["4", "Learning groups", Activity, "text-blue-700 bg-blue-50"], ["23", "Shared materials", BookOpen, "text-violet-700 bg-violet-50"]].map(([value, label, Icon, tone]: any) => (
          <div key={label} className="surface-card flex items-center gap-4 rounded-[18px] p-5"><div className={`flex h-11 w-11 items-center justify-center rounded-xl ${tone}`}><Icon size={20} /></div><div><p className="text-2xl font-semibold tracking-tight text-app">{value}</p><p className="text-sm font-medium text-text-secondary">{label}</p></div></div>
        ))}
      </section>

      <section>
        <div className="mb-5 flex items-end justify-between"><div><p className="eyebrow">Current cohorts</p><h2 className="mt-1 text-2xl font-semibold tracking-tight">Active study groups</h2></div><Link href="/tutor/groups" className="hidden items-center gap-1 text-sm font-semibold text-emerald-700 hover:text-emerald-800 sm:flex">View all <ChevronRight size={16} /></Link></div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {groups.map((group) => <Link key={group.id} href={`/tutor/groups/${group.id}`} className="surface-card group rounded-[18px] p-5 transition duration-300 hover:-translate-y-0.5 hover:border-emerald-500/40 hover:shadow-lg">
            <div className="flex items-start justify-between"><div className={`flex h-10 w-10 items-center justify-center rounded-xl text-white ${group.tone}`}><Users size={18} /></div><ArrowUpRight size={17} className="text-text-secondary transition group-hover:text-emerald-600" /></div>
            <h3 className="mt-5 text-lg font-semibold tracking-tight">{group.name}</h3><p className="mt-1 text-xs font-semibold uppercase tracking-[0.1em] text-text-secondary">{group.course}</p>
            <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-app-muted"><div className={`h-full rounded-full ${group.tone}`} style={{ width: `${group.progress}%` }} /></div><div className="mt-4 flex items-center justify-between text-xs font-medium text-text-secondary"><span>{group.members} students</span><span>{group.activity}</span></div>
          </Link>)}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="surface-card rounded-[20px] p-6"><div className="flex items-center justify-between"><div><p className="eyebrow">Activity</p><h2 className="mt-1 text-xl font-semibold">Recent learning signals</h2></div><Activity size={19} className="text-emerald-600" /></div><div className="mt-5 divide-y divide-app">
          {activity.map(([student, action, time, tone]) => <div key={student} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0"><div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${tone}`}>{student.split(" ").map(part => part[0]).join("")}</div><p className="min-w-0 flex-1 text-sm"><span className="font-semibold text-app">{student}</span> <span className="text-text-secondary">{action}</span></p><span className="whitespace-nowrap text-xs font-medium text-text-secondary">{time}</span></div>)}
        </div></div>
        <aside className="rounded-[20px] bg-[#18332d] p-6 text-white"><p className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-200">Teaching focus</p><h2 className="mt-3 text-2xl font-semibold tracking-tight">Three students need a check-in.</h2><p className="mt-3 text-sm leading-6 text-emerald-50/75">Their quiz attempts slowed this week. A short nudge or a targeted resource can get them moving again.</p><Link href="/tutor/insights" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-white hover:text-emerald-200">Open cohort insights <Clock3 size={16} /></Link></aside>
      </section>
    </div>
  );
}
