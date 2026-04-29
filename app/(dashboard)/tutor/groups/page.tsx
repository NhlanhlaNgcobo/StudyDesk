"use client";

import Link from "next/link";
import { ArrowRight, CalendarClock, MessagesSquare, PlusCircle, Users } from "lucide-react";
import { DEMO_TUTOR_GROUPS } from "@/lib/mock-data";

export default function TutorGroupsPage() {
  return (
    <div className="space-y-10">
      <section className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary">Tutor pods</p>
          <h1 className="text-4xl font-black tracking-tight md:text-5xl">Study groups</h1>
          <p className="max-w-2xl text-base font-medium text-text-secondary">
            Coordinate active learning spaces, monitor participation, and keep the next session visible.
          </p>
        </div>

        <button className="inline-flex items-center gap-3 rounded-full bg-emerald-500 px-6 py-4 text-sm font-black uppercase tracking-[0.18em] text-white shadow-xl shadow-emerald-500/20 transition hover:bg-emerald-600">
          <PlusCircle size={18} />
          Create group
        </button>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {DEMO_TUTOR_GROUPS.map((group) => (
          <article key={group.id} className="rounded-[28px] border border-app bg-app-surface p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary">{group.subject}</p>
                <h2 className="mt-2 text-2xl font-black">{group.name}</h2>
              </div>
              <div className="rounded-full bg-app-muted px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-text-secondary">
                Active
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[22px] bg-app-muted p-4">
                <div className="flex items-center gap-2 text-primary">
                  <Users size={16} />
                  <span className="text-xs font-black uppercase tracking-[0.16em]">Members</span>
                </div>
                <p className="mt-3 text-3xl font-black">{group.memberCount}</p>
              </div>
              <div className="rounded-[22px] bg-app-muted p-4">
                <div className="flex items-center gap-2 text-primary">
                  <MessagesSquare size={16} />
                  <span className="text-xs font-black uppercase tracking-[0.16em]">Weekly activity</span>
                </div>
                <p className="mt-3 text-lg font-black">{group.weeklyActivity}</p>
              </div>
            </div>

            <div className="mt-4 rounded-[22px] bg-app-muted p-4">
              <div className="flex items-center gap-2 text-primary">
                <CalendarClock size={16} />
                <span className="text-xs font-black uppercase tracking-[0.16em]">Next session</span>
              </div>
              <p className="mt-2 text-sm font-bold text-text-secondary">{group.nextSession}</p>
            </div>

            <Link
              href={`/tutor/groups/${group.id}`}
              className="mt-6 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-primary"
            >
              Open group workspace
              <ArrowRight size={14} />
            </Link>
          </article>
        ))}
      </section>
    </div>
  );
}
