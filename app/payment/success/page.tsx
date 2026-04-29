"use client";

import React, { Suspense, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight, Home, BookOpen, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";

function PaymentSuccessContent() {
  const params = useSearchParams();
  const ref = params.get("ref");
  const sandbox = params.get("sandbox") === "1";
  const provider = params.get("provider");
  const plan = params.get("plan");

  useEffect(() => {
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
      colors: ["#4DA6FF", "#8B5CF6", "#10B981"],
    });
  }, []);

  return (
    <div className="min-h-screen bg-app flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-lg bg-app-surface rounded-2xl shadow-2xl border border-app p-12 space-y-8 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="mx-auto w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center"
        >
          <CheckCircle2 className="text-emerald-500" size={48} />
        </motion.div>

        <div className="space-y-3">
          {sandbox && (
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-primary dark:border-blue-900/30 dark:bg-blue-950/20">
              <Sparkles size={14} />
              Local billing sandbox
            </div>
          )}
          <h1 className="text-4xl font-black tracking-tight text-app uppercase italic">
            Payment Successful!
          </h1>
          <p className="text-text-secondary font-bold text-lg">
            {sandbox
              ? `Sandbox upgrade complete for ${plan || "your selected plan"}. No real payment was processed.`
              : "Welcome to StudyDesk Pro. Your subscription is now active."}
          </p>
          {provider && (
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">
              Provider: {provider}
            </p>
          )}
          {ref && (
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">
              Reference: {ref}
            </p>
          )}
        </div>

        <div className="bg-app-muted rounded-xl p-6 space-y-4 text-left border border-app">
          <p className="text-xs font-black uppercase tracking-widest text-slate-500">
            What&apos;s next
          </p>
          <ul className="space-y-3">
            {[
              "Unlimited AI note generation",
              "Access to advanced mock exams",
              "AI Tutor chat powered by Claude",
              "Spaced-repetition flashcards",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm font-bold text-text-secondary">
                <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                  <CheckCircle2 size={12} />
                </div>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-4">
          <Link
            href="/student/dashboard"
            className="w-full py-4 bg-primary text-white font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-primary/30 active:scale-95 transition-all"
          >
            Go to Dashboard <ArrowRight size={18} />
          </Link>
          <Link
            href="/student/modules"
            className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-100 font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
          >
            <BookOpen size={18} /> Start Studying
          </Link>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors"
        >
          <Home size={14} /> Back to Home
        </Link>
      </motion.div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
