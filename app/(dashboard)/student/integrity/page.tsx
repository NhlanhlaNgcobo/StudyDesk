"use client";

import React, { useMemo, useState } from "react";
import { Download, ShieldCheck, Info, FileCheck2, CircleSlash } from "lucide-react";
import { cn } from "@/lib/utils";
import { DEMO_MODULES } from "@/lib/mock-data";
import { AI_POLICY_LABELS, type AiPolicy } from "@/lib/claude";
import {
  useLearnerModel,
  buildWorkLog,
  workLogToCsv,
  helpProfile,
} from "@/lib/learner-model";

/**
 * The integrity surface.
 *
 * South African universities have moved away from AI detectors - UCT
 * discontinued Turnitin's AI score in October 2025 over false positives - and
 * toward evidence of process. Wits requires "AI-resilient assessment"; UP's
 * line is "students must think first, and use AI later". The traffic-light
 * vocabulary below is the one lecturers are being encouraged to use.
 *
 * So instead of pretending to be undetectable, StudyDesk gives the student the
 * thing a detector can never give them: a record of how they worked, which
 * they own and can hand over voluntarily.
 */

const POLICY_STORAGE_KEY = "studydesk.module-ai-policy.v1";

type PolicyMap = Record<string, AiPolicy>;

function readPolicies(): PolicyMap {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(POLICY_STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

const POLICY_STYLE: Record<AiPolicy, string> = {
  green: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-900/15 dark:text-emerald-300",
  amber: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/15 dark:text-amber-300",
  red: "border-red-200 bg-red-50 text-red-800 dark:border-red-900/40 dark:bg-red-900/15 dark:text-red-300",
};

export default function IntegrityPage() {
  const model = useLearnerModel();
  const [policies, setPolicies] = useState<PolicyMap>(() => readPolicies());
  const [moduleFilter, setModuleFilter] = useState<string>("all");

  const entries = useMemo(
    () => buildWorkLog(model, moduleFilter === "all" ? undefined : moduleFilter),
    [model, moduleFilter]
  );

  const help = useMemo(
    () => helpProfile(model, moduleFilter === "all" ? undefined : moduleFilter),
    [model, moduleFilter]
  );

  const setPolicy = (moduleId: string, policy: AiPolicy) => {
    const next = { ...policies, [moduleId]: policy };
    setPolicies(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(POLICY_STORAGE_KEY, JSON.stringify(next));
    }
  };

  const download = () => {
    const blob = new Blob([workLogToCsv(entries)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `studydesk-work-log-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-10">
      <section className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary">
            Academic integrity
          </p>
          <h1 className="text-4xl font-black tracking-tight md:text-5xl">Your work log</h1>
          <p className="max-w-2xl text-base font-medium text-slate-600 dark:text-slate-400">
            Every time you used the tutor, at what help level, and whether you attempted it
            yourself first. You own this record and you choose who sees it. If a lecturer ever
            questions your work, process evidence is far stronger than any detector score — and
            universities have been retiring those because they flag innocent students.
          </p>
        </div>

        <button
          onClick={download}
          disabled={entries.length === 0}
          className="flex shrink-0 items-center justify-center gap-3 rounded-full bg-primary px-7 py-4 text-xs font-black uppercase tracking-[0.18em] text-white shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:translate-y-0"
        >
          <Download size={18} />
          Download as CSV
        </button>
      </section>

      {/* Per-module policy */}
      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Module AI rules</h2>
          <p className="mt-1 max-w-2xl text-sm font-medium text-slate-600 dark:text-slate-400">
            Set what each module&apos;s lecturer permits. The tutor honours it — on an amber or
            red module it will not draft anything you could submit, and Check mode is switched
            off entirely on red.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {DEMO_MODULES.map((module) => {
            const policy = policies[module.id] || "green";
            return (
              <div
                key={module.id}
                className="rounded-xl border border-slate-100 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
              >
                <p className="font-extrabold tracking-tight text-slate-900 dark:text-white">
                  {module.name}
                </p>

                <div className="mt-4 flex gap-2">
                  {(["green", "amber", "red"] as AiPolicy[]).map((value) => (
                    <button
                      key={value}
                      onClick={() => setPolicy(module.id, value)}
                      className={cn(
                        "flex-1 rounded-lg border-2 px-2 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all",
                        policy === value
                          ? POLICY_STYLE[value]
                          : "border-slate-100 text-slate-400 hover:border-slate-200 dark:border-slate-800"
                      )}
                    >
                      {value}
                    </button>
                  ))}
                </div>

                <p className="mt-3 text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">
                  {AI_POLICY_LABELS[policy].detail}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Honest summary */}
      {help.samples > 0 && (
        <section
          className={cn(
            "flex items-start gap-3 rounded-xl border p-5",
            help.flag
              ? "border-amber-200 bg-amber-50 dark:border-amber-900/30 dark:bg-amber-900/10"
              : "border-emerald-200 bg-emerald-50 dark:border-emerald-900/30 dark:bg-emerald-900/10"
          )}
        >
          {help.flag ? (
            <Info size={20} className="mt-0.5 shrink-0 text-amber-600" />
          ) : (
            <ShieldCheck size={20} className="mt-0.5 shrink-0 text-emerald-600" />
          )}
          <div>
            <p className="font-black tracking-tight text-slate-900 dark:text-white">
              {help.flag
                ? "Your pattern would not read well to a lecturer"
                : "Your pattern shows genuine work"}
            </p>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-700 dark:text-slate-300">
              Across your last {help.samples} tutor sessions you attempted the problem yourself
              first {Math.round(help.attemptFirstRate * 100)}% of the time, went to a full
              solution {Math.round(help.deepHelpRate * 100)}% of the time, and explained the step
              back {Math.round(help.explainBackRate * 100)}% of the times a solution was revealed.
            </p>
          </div>
        </section>
      )}

      {/* The log */}
      <section className="overflow-hidden rounded-xl border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-6 py-5 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-black tracking-tight">Session record</h2>
            <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
              {entries.length} entr{entries.length === 1 ? "y" : "ies"}, newest first
            </p>
          </div>

          <select
            value={moduleFilter}
            onChange={(event) => setModuleFilter(event.target.value)}
            className="rounded-full bg-slate-50 px-4 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20 dark:bg-slate-800"
          >
            <option value="all">All modules</option>
            {DEMO_MODULES.map((module) => (
              <option key={module.id} value={module.id}>
                {module.name}
              </option>
            ))}
          </select>
        </div>

        {entries.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <CircleSlash size={28} className="text-slate-300" />
            <p className="max-w-sm text-sm font-semibold text-slate-500 dark:text-slate-400">
              Nothing logged yet. Ask the tutor a question and this record starts building
              itself — including whether you attempted it first.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {entries.slice(0, 50).map((entry, index) => (
              <li key={`${entry.at}-${index}`} className="flex items-start gap-4 px-6 py-4">
                <FileCheck2 size={16} className="mt-1 shrink-0 text-slate-400" />
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {new Date(entry.at).toLocaleString("en-ZA", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    · {entry.skill}
                  </p>
                  <p className="mt-1 break-words text-sm font-semibold leading-6 text-slate-700 dark:text-slate-300">
                    {entry.detail}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
