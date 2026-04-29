import Link from "next/link";
import { ArrowRight, BookOpen, BrainCircuit, CalendarClock, GraduationCap, ShieldCheck, Users } from "lucide-react";
import { demoRoute } from "@/lib/demo-session";

const featureCards = [
  {
    title: "AI notes and summaries",
    description: "Turn lecture slides, readings, and past papers into structured notes with one workspace per module.",
    icon: BrainCircuit,
  },
  {
    title: "Quiz and exam prep",
    description: "Generate revision quizzes, track weak spots, and prepare with timed mock exams before test day.",
    icon: BookOpen,
  },
  {
    title: "Planner and study rhythm",
    description: "See sessions, deadlines, and streaks in one place so revision stays realistic and consistent.",
    icon: CalendarClock,
  },
  {
    title: "Tutor-led collaboration",
    description: "Create tutor pods, share resources, and guide students with context-aware academic support.",
    icon: Users,
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen text-app">
      <section className="sticky top-0 z-40 border-b border-app bg-app/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-base bg-primary text-lg font-black text-white shadow-lg shadow-blue-500/20">
              S
            </div>
            <div>
              <p className="text-xl font-black tracking-tight">StudyDesk</p>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-text-secondary">
                Academic co-pilot
              </p>
            </div>
          </Link>

          <div className="hidden items-center gap-3 md:flex">
            <Link href="/pricing" className="rounded-full px-4 py-2 text-sm font-bold text-text-secondary transition hover:text-primary">
              Pricing
            </Link>
            <Link href="/login" className="rounded-full border border-app bg-app-surface px-5 py-2.5 text-sm font-bold shadow-sm transition hover:border-primary/30 hover:text-primary">
              Login
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-12 px-6 pb-24 pt-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:pt-24">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-primary shadow-sm dark:border-blue-900/40 dark:bg-blue-950/30">
            <ShieldCheck size={14} />
            Built for South African student life
          </div>

          <div className="space-y-5">
            <h1 className="max-w-4xl text-5xl font-black leading-[0.95] tracking-tight md:text-7xl">
              One AI-powered desk for learning, revision, and tutor support.
            </h1>
            <p className="max-w-2xl text-lg font-medium text-text-secondary md:text-xl">
              StudyDesk helps students and tutors turn dense course material into notes, quizzes,
              revision plans, and collaborative learning spaces that actually feel usable day to day.
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <Link
              href={demoRoute("student")}
              className="inline-flex items-center gap-3 rounded-full bg-primary px-7 py-4 text-sm font-black uppercase tracking-[0.18em] text-white shadow-2xl shadow-blue-500/25 transition hover:-translate-y-0.5 hover:bg-primary-strong"
            >
              Open Student Demo
              <ArrowRight size={16} />
            </Link>
            <Link
              href={demoRoute("tutor")}
              className="inline-flex items-center gap-3 rounded-full border border-app bg-app-surface px-7 py-4 text-sm font-black uppercase tracking-[0.18em] shadow-sm transition hover:border-primary/30 hover:text-primary"
            >
              Open Tutor Demo
              <GraduationCap size={16} />
            </Link>
          </div>
        </div>

        <div className="rounded-[32px] border border-app bg-app-surface p-8 shadow-2xl shadow-slate-900/5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[24px] bg-app-muted p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-text-secondary">
                Student flow
              </p>
              <h2 className="mt-3 text-2xl font-black">Import. Ask. Practise.</h2>
              <p className="mt-2 text-sm font-medium text-text-secondary">
                Move from course material to notes, quiz practice, planner events, and AI help without jumping tools.
              </p>
            </div>
            <div className="rounded-[24px] bg-slate-900 p-5 text-white dark:bg-slate-950">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                Tutor flow
              </p>
              <h2 className="mt-3 text-2xl font-black">Guide pods with context.</h2>
              <p className="mt-2 text-sm font-medium text-slate-300">
                Run group learning spaces, share resources, and support exam readiness with clearer structure.
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-[28px] border border-app bg-white/70 p-6 dark:bg-slate-900/60">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-text-secondary">
              What works locally now
            </p>
            <div className="mt-5 grid gap-4">
              {[
                "Student and tutor demo entry points",
                "Dashboard, modules, notes, quiz, exams, planner, analytics, and settings routes",
                "Anthropic-backed AI tutor once the local server restarts with the configured key",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <div className="mt-1 h-2.5 w-2.5 rounded-full bg-primary" />
                  <p className="text-sm font-semibold text-text-secondary">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="mb-8 flex items-end justify-between gap-6">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-primary">Product surface</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">
              Designed around real study behaviour, not just AI novelty.
            </h2>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {featureCards.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="rounded-[28px] border border-app bg-app-surface p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/5">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-base bg-blue-50 text-primary dark:bg-blue-950/40">
                  <Icon size={22} />
                </div>
                <h3 className="text-xl font-black">{feature.title}</h3>
                <p className="mt-3 text-sm font-medium text-text-secondary">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
