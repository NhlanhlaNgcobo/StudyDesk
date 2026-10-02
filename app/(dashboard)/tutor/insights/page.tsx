"use client";

import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  Users,
  Gauge,
  HandHelping,
  MoonStar,
  Lightbulb,
  FlaskConical,
  ChevronDown,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth-provider";
import { useLearnerModel } from "@/lib/learner-model";
import {
  buildCohort,
  cohortMisconceptions,
  cohortSummary,
  assessRisk,
  suggestedAction,
  COHORT_IS_SYNTHETIC,
  type CohortMember,
  type RiskLevel,
} from "@/lib/cohort";

const RISK_STYLE: Record<RiskLevel, { chip: string; bar: string; label: string }> = {
  critical: {
    chip: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300",
    bar: "bg-red-500",
    label: "At risk",
  },
  watch: {
    chip: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300",
    bar: "bg-amber-500",
    label: "Watch",
  },
  steady: {
    chip: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300",
    bar: "bg-emerald-500",
    label: "Steady",
  },
};

function SummaryTile({
  label,
  value,
  caption,
  icon: Icon,
  alarm = false,
}: {
  label: string;
  value: string;
  caption: string;
  icon: typeof Users;
  alarm?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3 flex items-center gap-2">
        <Icon size={16} className={alarm ? "text-red-500" : "text-slate-400"} />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
          {label}
        </p>
      </div>
      <p
        className={cn(
          "mb-1 text-3xl font-bold tracking-tight",
          alarm ? "text-red-600 dark:text-red-400" : "text-slate-900 dark:text-white"
        )}
      >
        {value}
      </p>
      <p className="text-xs font-semibold leading-snug text-slate-500 dark:text-slate-400">
        {caption}
      </p>
    </div>
  );
}

function MemberRow({ member }: { member: CohortMember }) {
  const [open, setOpen] = useState(false);
  const risk = assessRisk(member);
  const style = RISK_STYLE[risk.level];

  return (
    <li>
      <button
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-4 px-6 py-4 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
      >
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 truncate font-extrabold tracking-tight text-slate-900 dark:text-white">
            {member.name}
            {member.isSelf && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-primary">
                Real data
              </span>
            )}
          </p>
          <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            {Math.round(member.mastery * 100)}% mastery · {member.skillsTracked} skills ·{" "}
            {member.daysInactive === 0 ? "active today" : `${member.daysInactive}d quiet`}
          </p>
        </div>

        <div className="hidden w-32 sm:block">
          <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className={cn("h-full rounded-full", style.bar)}
              style={{ width: `${Math.max(risk.score, 3)}%` }}
            />
          </div>
        </div>

        <span
          className={cn(
            "shrink-0 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest",
            style.chip
          )}
        >
          {style.label}
        </span>

        <ChevronDown
          size={18}
          className={cn("shrink-0 text-slate-400 transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="space-y-4 border-t border-slate-100 bg-slate-50 px-6 py-5 dark:border-slate-800 dark:bg-slate-800/30">
          <div>
            <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
              Why this flag
            </p>
            <ul className="space-y-1">
              {risk.reasons.map((reason) => (
                <li
                  key={reason}
                  className="text-sm font-semibold text-slate-700 dark:text-slate-300"
                >
                  · {reason}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
            <Lightbulb size={18} className="mt-0.5 shrink-0 text-primary" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-primary">
                Do this next
              </p>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-800 dark:text-slate-200">
                {suggestedAction(member, risk)}
              </p>
            </div>
          </div>
        </div>
      )}
    </li>
  );
}

export default function TutorInsightsPage() {
  const { profile } = useAuth();
  const model = useLearnerModel();

  const cohort = useMemo(
    () => buildCohort(model, profile?.displayName || "You"),
    [model, profile?.displayName]
  );
  const summary = useMemo(() => cohortSummary(cohort), [cohort]);
  const misconceptions = useMemo(() => cohortMisconceptions(model), [model]);

  const exportCsv = () => {
    const header =
      "student,mastery_pct,recall_pct,calibration_gap_pts,attempt_first_pct,days_inactive,skills,risk_score,risk_level";
    const rows = cohort.map((member) => {
      const risk = assessRisk(member);
      return [
        `"${member.name.replace(/"/g, '""')}"`,
        Math.round(member.mastery * 100),
        Math.round(member.recall * 100),
        Math.round(member.calibrationGap * 100),
        Math.round(member.attemptFirstRate * 100),
        member.daysInactive,
        member.skillsTracked,
        risk.score,
        risk.level,
      ].join(",");
    });

    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `studydesk-cohort-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-10">
      <section className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary">
            Cohort intelligence
          </p>
          <h1 className="text-4xl font-black tracking-tight md:text-5xl">
            Who needs you, and what to say
          </h1>
          <p className="max-w-2xl text-base font-medium text-slate-600 dark:text-slate-400">
            Ranked by risk of falling away, not by mark. Between 50% and 60% of South African
            first-years leave before completing, and the signals that predict it — going quiet,
            avoiding attempts, confidence detaching from results — move weeks before the marks do.
          </p>
        </div>

        <button
          onClick={exportCsv}
          className="flex shrink-0 items-center justify-center gap-3 rounded-full border-2 border-slate-100 bg-white px-6 py-4 text-xs font-black uppercase tracking-[0.18em] transition-all hover:border-primary/30 dark:border-slate-800 dark:bg-slate-900"
        >
          <Download size={18} />
          Export for faculty
        </button>
      </section>

      {COHORT_IS_SYNTHETIC && (
        <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
          <FlaskConical size={18} className="mt-0.5 shrink-0 text-slate-500" />
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
            <span className="font-black">Demo cohort.</span> Every student below except the row
            marked <span className="font-black">Real data</span> is synthetic sample data, so you
            can see the view before any real class is loaded. The real row is computed from this
            account&apos;s own answers.
          </p>
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryTile
          label="At risk"
          value={String(summary.critical)}
          caption={`Of ${summary.size} students. These need contact this week, not next.`}
          icon={AlertTriangle}
          alarm={summary.critical > 0}
        />
        <SummaryTile
          label="Gone quiet"
          value={String(summary.dormant)}
          caption="No retrieval activity for 10 days or more — the earliest reliable dropout signal."
          icon={MoonStar}
          alarm={summary.dormant > 0}
        />
        <SummaryTile
          label="Overconfident"
          value={String(summary.overconfident)}
          caption="Predict their marks more than 25 points above what they score."
          icon={Gauge}
        />
        <SummaryTile
          label="Avoiding the work"
          value={String(summary.helpAvoidant)}
          caption="Request full solutions without attempting first most of the time."
          icon={HandHelping}
        />
      </section>

      <section className="grid gap-8 lg:grid-cols-[1.3fr_0.9fr]">
        <div className="overflow-hidden rounded-xl border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-100 px-6 py-5 dark:border-slate-800">
            <h2 className="text-xl font-black tracking-tight">Students by risk</h2>
            <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
              Tap a row for the reason and the next move.
            </p>
          </div>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {cohort.map((member) => (
              <MemberRow key={member.id} member={member} />
            ))}
          </ul>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-slate-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-xl font-black tracking-tight">Shared misconceptions</h2>
            <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
              Each comes with a probing question, not a re-explanation. In the Stanford trial,
              prompting tutors toward probing questions raised mastery most for the tutors who
              were struggling.
            </p>

            <ul className="mt-5 space-y-5">
              {misconceptions.map((cluster, index) => (
                <li
                  key={`${cluster.label}-${index}`}
                  className="border-l-2 border-primary/30 pl-4"
                >
                  <p className="font-extrabold leading-snug tracking-tight text-slate-900 dark:text-white">
                    {cluster.label}
                  </p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {cluster.skill} · {cluster.students} student
                    {cluster.students === 1 ? "" : "s"}
                  </p>
                  <p className="mt-2 text-sm font-medium leading-6 text-slate-600 dark:text-slate-300">
                    {cluster.probe}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl bg-slate-900 p-6 text-white">
            <h2 className="text-lg font-black tracking-tight">For the faculty report</h2>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-300">
              Average cohort mastery is{" "}
              <span className="font-black text-white">
                {Math.round(summary.avgMastery * 100)}%
              </span>
              , with {summary.critical} student{summary.critical === 1 ? "" : "s"} flagged at risk
              and {summary.dormant} dormant. Export the CSV for your at-risk reporting — it carries
              the behavioural columns, which is what an early-warning system actually needs.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
