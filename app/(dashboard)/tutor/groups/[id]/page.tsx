"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, CalendarClock, FileText, Megaphone, MessagesSquare, Users } from "lucide-react";
import { DEMO_TUTOR_GROUPS } from "@/lib/mock-data";

export default function TutorGroupDetailPage() {
  const params = useParams();
  const groupId = String(params.id);
  const group = DEMO_TUTOR_GROUPS.find((item) => item.id === groupId) || DEMO_TUTOR_GROUPS[0];

  const messages = useMemo(
    () => [
      "Share this week’s tutor agenda and goals.",
      "Post one revision summary before the next session.",
      "Highlight two students who need targeted follow-up.",
    ],
    []
  );

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center gap-3 text-xs font-black uppercase tracking-[0.18em] text-text-secondary">
        <Link href="/tutor/groups" className="inline-flex items-center gap-2 text-primary">
          <ArrowLeft size={14} />
          Back to groups
        </Link>
        <span>/</span>
        <span>{group.subject}</span>
      </div>

      <section className="rounded-[32px] border border-app bg-app-surface p-8 shadow-xl shadow-slate-900/5">
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary">{group.subject}</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">{group.name}</h1>
        <p className="mt-3 max-w-2xl text-base font-medium text-text-secondary">
          This is the tutor command surface for group momentum, resource sharing, and targeted academic support.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-[24px] bg-app-muted p-5">
            <div className="flex items-center gap-2 text-primary">
              <Users size={16} />
              <span className="text-xs font-black uppercase tracking-[0.16em]">Members</span>
            </div>
            <p className="mt-3 text-3xl font-black">{group.memberCount}</p>
          </div>
          <div className="rounded-[24px] bg-app-muted p-5">
            <div className="flex items-center gap-2 text-primary">
              <MessagesSquare size={16} />
              <span className="text-xs font-black uppercase tracking-[0.16em]">Weekly activity</span>
            </div>
            <p className="mt-3 text-2xl font-black">{group.weeklyActivity}</p>
          </div>
          <div className="rounded-[24px] bg-app-muted p-5">
            <div className="flex items-center gap-2 text-primary">
              <CalendarClock size={16} />
              <span className="text-xs font-black uppercase tracking-[0.16em]">Next session</span>
            </div>
            <p className="mt-3 text-sm font-black uppercase tracking-[0.16em] text-text-secondary">{group.nextSession}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[28px] border border-app bg-app-surface p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <Megaphone className="text-primary" size={18} />
            <h2 className="text-2xl font-black">Tutor broadcast checklist</h2>
          </div>
          <div className="grid gap-4">
            {messages.map((message) => (
              <div key={message} className="rounded-[20px] bg-app-muted p-5">
                <p className="text-sm font-semibold text-text-secondary">{message}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-app bg-app-surface p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <FileText className="text-primary" size={18} />
            <h2 className="text-2xl font-black">Shared resources</h2>
          </div>
          <div className="space-y-3">
            {[
              "Algorithms_Cheat_Sheet.pdf",
              "Workshop_Slides_Week_5.pptx",
              "Revision_Questions_Set_A.docx",
            ].map((resource) => (
              <div key={resource} className="rounded-[20px] bg-app-muted px-4 py-4 text-sm font-black text-text-secondary">
                {resource}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
