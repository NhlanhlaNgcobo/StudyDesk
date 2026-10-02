"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { useTheme } from "next-themes";
import {
  Target,
  CalendarClock,
  Gauge,
  TrendingDown,
  ArrowRight,
  Info,
  CircleAlert,
  CircleCheck,
  TriangleAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DEMO_MODULES } from "@/lib/mock-data";
import {
  useLearnerModel,
  listSkills,
  dueSkills,
  decayedSkills,
  calibration,
  helpProfile,
  retrievability,
  MASTERY_PROVED,
  MASTERY_WEAK,
  type SkillState,
} from "@/lib/learner-model";

/**
 * The open learner model.
 *
 * This replaces activity counts ("Hours Studied: 47", "Notes Generated: 24").
 * Activity is not learning, and the evidence on open learner models - showing
 * the student the system's own estimate of what they know, weak spots included -
 * is that it builds metacognition rather than flattering it.
 */

// ---------------------------------------------------------------------------
// Palette - validated against this app's card surfaces (#ffffff / #0f172a).
// Mastery colour is a redundant encoding of the number printed on every bar,
// so identity never rests on hue (CVD / tritan relief).
// ---------------------------------------------------------------------------

const VIZ = {
  light: {
    series: "#2a78d6",
    grid: "#e1e0d9",
    axis: "#898781",
    surface: "#ffffff",
    ink: "#0b0b0b",
  },
  dark: {
    series: "#3987e5",
    grid: "#2c2c2a",
    axis: "#898781",
    surface: "#0f172a",
    ink: "#ffffff",
  },
} as const;

const STATUS = {
  proved: "#0ca30c",
  building: "#fab219",
  weak: "#d03b3b",
} as const;

type Band = keyof typeof STATUS;

function bandOf(mastery: number): Band {
  if (mastery >= MASTERY_PROVED) return "proved";
  if (mastery >= MASTERY_WEAK) return "building";
  return "weak";
}

const BAND_COPY: Record<Band, { label: string; Icon: typeof CircleCheck }> = {
  proved: { label: "Proved", Icon: CircleCheck },
  building: { label: "Building", Icon: TriangleAlert },
  weak: { label: "Weak", Icon: CircleAlert },
};

// ---------------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------------

function StatTile({
  label,
  value,
  caption,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: string;
  caption: string;
  icon: typeof Target;
  tone?: "neutral" | "good" | "warn" | "bad";
}) {
  const toneClass =
    tone === "good"
      ? "text-emerald-600 dark:text-emerald-400"
      : tone === "warn"
        ? "text-amber-600 dark:text-amber-400"
        : tone === "bad"
          ? "text-red-600 dark:text-red-400"
          : "text-slate-900 dark:text-white";

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-100 dark:border-slate-800">
      <div className="flex items-center gap-2 mb-3">
        <Icon size={16} className="text-slate-400 shrink-0" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
          {label}
        </p>
      </div>
      <p className={cn("text-3xl font-bold tracking-tight mb-1", toneClass)}>{value}</p>
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-snug">
        {caption}
      </p>
    </div>
  );
}

/**
 * Mastery across skills: one measure, many items, sorted weakest first because
 * the weak end is the part the student can act on. Hand-rolled rather than
 * charted - the labels are the point, and a 2px surface gap keeps adjacent
 * bars from reading as one fill.
 */
function MasteryBars({ skills }: { skills: SkillState[] }) {
  const now = new Date().toISOString();

  return (
    <ul className="space-y-3">
      {skills.map((skill) => {
        const band = bandOf(skill.mastery);
        const { label, Icon } = BAND_COPY[band];
        const pct = Math.round(skill.mastery * 100);
        const recall = skill.lastReviewedAt
          ? retrievability(
              skill.stability,
              (Date.parse(now) - Date.parse(skill.lastReviewedAt)) / 86_400_000
            )
          : null;

        return (
          <li key={skill.id}>
            <div className="flex items-baseline justify-between gap-3 mb-1.5">
              <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                {skill.name}
              </span>
              <span className="flex items-center gap-1.5 shrink-0">
                <Icon size={13} style={{ color: STATUS[band] }} aria-hidden />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  {label}
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                  {pct}%
                </span>
              </span>
            </div>

            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-[width] duration-700"
                style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: STATUS[band] }}
              />
            </div>

            <p className="mt-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              {skill.correct}/{skill.attempts} correct
              {recall !== null && ` · ${Math.round(recall * 100)}% recall right now`}
              {skill.misconceptions.length > 0 && ` · ${skill.misconceptions[0]}`}
            </p>
          </li>
        );
      })}
    </ul>
  );
}

/** Review load over the next 14 days: a count per day, one series. */
function ReviewForecast({ skills }: { skills: SkillState[] }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const viz = resolvedTheme === "dark" ? VIZ.dark : VIZ.light;

  const data = useMemo(() => {
    const days: { day: string; label: string; due: number }[] = [];
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    for (let offset = 0; offset < 14; offset += 1) {
      const date = new Date(start.getTime() + offset * 86_400_000);
      const next = new Date(date.getTime() + 86_400_000);

      const due = skills.filter((skill) => {
        if (!skill.dueAt) return false;
        const dueTime = Date.parse(skill.dueAt);
        // Everything already overdue lands on today's column.
        if (offset === 0) return dueTime < next.getTime();
        return dueTime >= date.getTime() && dueTime < next.getTime();
      }).length;

      days.push({
        day: date.toISOString().slice(0, 10),
        label: offset === 0 ? "Today" : date.toLocaleDateString("en-ZA", { day: "numeric", month: "short" }),
        due,
      });
    }

    return days;
  }, [skills]);

  const total = data.reduce((sum, row) => sum + row.due, 0);

  if (!mounted) {
    return <div className="h-[220px] rounded-xl bg-slate-50 dark:bg-slate-800 animate-pulse" />;
  }

  if (total === 0) {
    return (
      <p className="h-[220px] flex items-center justify-center text-center text-sm font-semibold text-slate-500 dark:text-slate-400 px-6">
        Nothing scheduled yet. Answer a quiz or photograph some notes and your review
        schedule builds itself.
      </p>
    );
  }

  return (
    <div className="h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 16, right: 8, left: -24, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={viz.grid} />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
            tick={{ fontSize: 10, fontWeight: 800, fill: viz.axis }}
            dy={8}
          />
          <YAxis
            allowDecimals={false}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fontWeight: 800, fill: viz.axis }}
          />
          <Tooltip
            cursor={{ fill: viz.grid, fillOpacity: 0.4 }}
            contentStyle={{
              borderRadius: 12,
              border: "none",
              fontWeight: 800,
              fontSize: 12,
              backgroundColor: viz.surface,
              color: viz.ink,
              boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.15)",
            }}
            formatter={((value: unknown) => [
              `${value} skill${Number(value) === 1 ? "" : "s"}`,
              "Due",
            ]) as never}
          />
          <Bar dataKey="due" fill={viz.series} radius={[4, 4, 0, 0]} maxBarSize={28}>
            <LabelList
              dataKey="due"
              position="top"
              formatter={((value: unknown) => (Number(value) > 0 ? String(value) : "")) as never}
              style={{ fontSize: 10, fontWeight: 900, fill: viz.axis }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Exam readiness, per module
// ---------------------------------------------------------------------------

/**
 * Readiness is mastery discounted by current retrievability. A student who
 * aced a topic six weeks ago and has not seen it since is not ready, and a
 * dashboard that says otherwise is lying to them.
 */
export function ExamReadinessBoard() {
  const model = useLearnerModel();

  const modules = useMemo(() => {
    const byModule = new Map<string, SkillState[]>();
    Object.values(model.skills).forEach((skill) => {
      const list = byModule.get(skill.moduleId) || [];
      list.push(skill);
      byModule.set(skill.moduleId, list);
    });

    const now = new Date().toISOString();

    return Array.from(byModule.entries())
      .map(([moduleId, skills]) => {
        const score =
          skills.reduce((sum, skill) => {
            const recall = skill.lastReviewedAt
              ? retrievability(
                  skill.stability,
                  (Date.parse(now) - Date.parse(skill.lastReviewedAt)) / 86_400_000
                )
              : 0;
            return sum + skill.mastery * (0.4 + 0.6 * recall);
          }, 0) / skills.length;

        const name = DEMO_MODULES.find((item) => item.id === moduleId)?.name || `Module ${moduleId}`;
        const weakest = [...skills].sort((a, b) => a.mastery - b.mastery)[0];

        return { moduleId, name, score: Math.round(score * 100), skills: skills.length, weakest };
      })
      .sort((a, b) => a.score - b.score);
  }, [model]);

  if (modules.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-100 dark:border-slate-800">
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
          Readiness appears once you have answered something. It is deliberately harsh: a
          topic you proved weeks ago and have not revisited counts for less.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
      {modules.map((item) => {
        const band: Band = item.score >= 80 ? "proved" : item.score >= 50 ? "building" : "weak";
        return (
          <div key={item.moduleId} className="p-6">
            <div className="flex items-baseline justify-between gap-4 mb-2">
              <Link
                href={`/student/modules/${item.moduleId}`}
                className="font-extrabold tracking-tight text-slate-900 dark:text-white hover:text-primary transition-colors truncate"
              >
                {item.name}
              </Link>
              <span className="shrink-0 flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  {BAND_COPY[band].label}
                </span>
                <span className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
                  {item.score}%
                </span>
              </span>
            </div>

            <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-2">
              <div
                className="h-full rounded-full transition-[width] duration-700"
                style={{ width: `${Math.max(item.score, 2)}%`, backgroundColor: STATUS[band] }}
              />
            </div>

            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              {item.skills} skill{item.skills === 1 ? "" : "s"} tracked
              {item.weakest && ` · weakest: ${item.weakest.name} (${Math.round(item.weakest.mastery * 100)}%)`}
            </p>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Panel
// ---------------------------------------------------------------------------

export function MasteryPanel({ moduleId }: { moduleId?: string }) {
  const model = useLearnerModel();

  const skills = useMemo(() => listSkills(model, moduleId), [model, moduleId]);
  const due = useMemo(() => dueSkills(model), [model]);
  const decayed = useMemo(() => decayedSkills(model), [model]);
  const cal = useMemo(() => calibration(model, moduleId), [model, moduleId]);
  const help = useMemo(() => helpProfile(model, moduleId), [model, moduleId]);

  const proved = skills.filter((skill) => skill.mastery >= MASTERY_PROVED).length;
  const weak = skills.filter((skill) => skill.mastery < MASTERY_WEAK);
  const weakest = weak[0] || skills[0] || null;

  if (skills.length === 0) {
    return (
      <section className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-8">
        <h2 className="text-2xl font-black tracking-tight mb-2">Your knowledge record</h2>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400 max-w-2xl mb-6">
          This is where StudyDesk shows what you actually know — not how many hours you
          logged. It fills in from your own answers. Two ways to start it:
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/student/notes"
            className="px-5 py-3 bg-primary text-white rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2"
          >
            Photograph your notes <ArrowRight size={14} />
          </Link>
          <Link
            href="/student/quiz"
            className="px-5 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2"
          >
            Take a practice quiz <ArrowRight size={14} />
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Your knowledge record</h2>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-1">
            Built from your own answers, across {skills.length} skill
            {skills.length === 1 ? "" : "s"}.
          </p>
        </div>
        <Link
          href="/student/analytics"
          className="text-primary font-black uppercase text-[10px] tracking-widest flex items-center gap-2 bg-primary/5 px-3 py-2 rounded-full"
        >
          Full breakdown <ArrowRight size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          label="Skills proved"
          value={`${proved}/${skills.length}`}
          caption={`Mastery above ${Math.round(MASTERY_PROVED * 100)}% — the tutor stops explaining these and starts asking.`}
          icon={Target}
          tone={proved > 0 ? "good" : "neutral"}
        />
        <StatTile
          label="Due for review"
          value={String(due.length)}
          caption={
            due.length === 0
              ? "Nothing due. Your schedule is clear today."
              : "Scheduled so you review just before you'd forget."
          }
          icon={CalendarClock}
          tone={due.length > 6 ? "warn" : "neutral"}
        />
        <StatTile
          label="Weakest skill"
          value={weakest ? `${Math.round(weakest.mastery * 100)}%` : "—"}
          caption={weakest ? weakest.name : "No weak skills recorded."}
          icon={TrendingDown}
          tone={weakest && weakest.mastery < MASTERY_WEAK ? "bad" : "neutral"}
        />
        <StatTile
          label="Self-assessment"
          value={
            cal.samples === 0
              ? "—"
              : `${cal.gap > 0 ? "+" : ""}${Math.round(cal.gap * 100)}pts`
          }
          caption={
            cal.samples === 0
              ? "Rate your confidence before a quiz result to measure this."
              : cal.verdict === "overconfident"
                ? `You predict ${Math.round(cal.gap * 100)} points higher than you score. That gap is the risk.`
                : cal.verdict === "underconfident"
                  ? "You score better than you expect. Trust yourself more."
                  : "Your predictions match your results closely."
          }
          icon={Gauge}
          tone={cal.verdict === "overconfident" ? "bad" : cal.samples > 0 ? "good" : "neutral"}
        />
      </div>

      {/* Help pattern - surfaced, never punished */}
      {help.flag && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-xl">
          <Info size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
            In your last {help.samples} tutor sessions you went to full solutions without
            attempting first about {Math.round((1 - help.attemptFirstRate) * 100)}% of the time.
            That pattern reliably raises marks in the short term and lowers them by exam. Try
            one line of your own first — it changes what you keep.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-100 dark:border-slate-800">
          <h3 className="font-black tracking-tight mb-1">Weakest skills first</h3>
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-5">
            Mastery estimated from your answers
          </p>
          <MasteryBars skills={skills.slice(0, 6)} />
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-100 dark:border-slate-800">
          <h3 className="font-black tracking-tight mb-1">Review load, next 14 days</h3>
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">
            Spaced so you revisit just before forgetting
          </p>
          <ReviewForecast skills={Object.values(model.skills)} />
        </div>
      </div>

      {/* What's fading - the actionable list */}
      {decayed.length > 0 && decayed[0].recall < 0.9 && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-100 dark:border-slate-800">
          <h3 className="font-black tracking-tight mb-1">Fading fastest</h3>
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-4">
            You knew these. Right now you probably don&apos;t.
          </p>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {decayed.slice(0, 4).map(({ skill, recall }) => (
              <li key={skill.id} className="py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                    {skill.name}
                  </p>
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Peak mastery {Math.round(skill.mastery * 100)}% · {skill.lapses} lapse
                    {skill.lapses === 1 ? "" : "s"}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-bold tabular-nums text-slate-900 dark:text-white">
                  {Math.round(recall * 100)}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
