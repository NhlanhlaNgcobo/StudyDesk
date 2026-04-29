"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowRight, GraduationCap, LogIn, Mail, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { cn } from "@/lib/utils";
import { demoRoute, persistDemoSession } from "@/lib/demo-session";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [authError, setAuthError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      const snap = await getDoc(doc(db, "users", user.uid));
      const role = snap.data()?.role;
      if (role === "tutor") router.replace("/tutor/dashboard");
      else if (role === "student") router.replace("/student/dashboard");
      else router.replace("/role-select");
    });

    return () => unsubscribe();
  }, [router]);

  const onSubmit = async (data: LoginForm) => {
    setAuthError("");

    try {
      const credential = await signInWithEmailAndPassword(auth, data.email, data.password);
      const snap = await getDoc(doc(db, "users", credential.user.uid));
      const role = snap.data()?.role;
      const redirect =
        typeof window === "undefined"
          ? null
          : new URLSearchParams(window.location.search).get("redirect");

      if (redirect) {
        router.push(redirect);
      } else if (role === "tutor") {
        router.push("/tutor/dashboard");
      } else if (role === "student") {
        router.push("/student/dashboard");
      } else {
        router.push("/role-select");
      }
    } catch {
      setAuthError("Invalid email or password. Please try again.");
    }
  };

  const demoCards = [
    {
      label: "Student Demo",
      description: "Modules, notes, quizzes, planner, analytics, and AI tutor.",
      href: demoRoute("student"),
      icon: GraduationCap,
      action: () => persistDemoSession("student"),
    },
    {
      label: "Tutor Demo",
      description: "Tutor dashboard, groups, materials, and learner support surfaces.",
      href: demoRoute("tutor"),
      icon: UserRound,
      action: () => persistDemoSession("tutor"),
    },
  ];

  return (
    <div className="min-h-screen bg-app px-6 py-12">
      <div className="mx-auto grid min-h-[calc(100vh-6rem)] max-w-6xl gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <section className="space-y-8 rounded-[32px] border border-app bg-slate-900 p-10 text-white shadow-2xl shadow-slate-900/20">
          <div className="space-y-5">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-base bg-primary text-lg font-black text-white">
                S
              </div>
              <div>
                <p className="text-xl font-black tracking-tight">StudyDesk</p>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                  Academic co-pilot
                </p>
              </div>
            </Link>

            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-blue-200">
              <ShieldCheck size={14} />
              Demo-first local build
            </div>

            <h1 className="text-4xl font-black leading-tight md:text-5xl">
              Test the full product from a single sign-in gateway.
            </h1>
            <p className="max-w-xl text-base font-medium text-slate-300">
              Use the role-specific demos for local testing, or sign in with a configured Firebase account when live services are available.
            </p>
          </div>

          <div className="grid gap-4">
            {demoCards.map((card) => {
              const Icon = card.icon;
              return (
                <Link
                  key={card.label}
                  href={card.href}
                  onClick={card.action}
                  className="group rounded-[24px] border border-white/10 bg-white/5 p-5 transition hover:-translate-y-1 hover:border-blue-300/30 hover:bg-white/10"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-base bg-white/10 text-blue-200">
                        <Icon size={20} />
                      </div>
                      <div>
                        <p className="text-lg font-black">{card.label}</p>
                        <p className="mt-1 text-sm font-medium text-slate-300">{card.description}</p>
                      </div>
                    </div>
                    <ArrowRight size={18} className="mt-1 text-slate-400 transition group-hover:translate-x-1 group-hover:text-white" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="rounded-[32px] border border-app bg-app-surface p-8 shadow-xl shadow-slate-900/5 md:p-10">
          <div className="mb-8 space-y-3">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary">
              Sign in
            </p>
            <h2 className="text-3xl font-black tracking-tight md:text-4xl">Welcome back.</h2>
            <p className="text-sm font-medium text-text-secondary">
              Continue with your real account if you want to test live Firebase-backed flows.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <label className="px-1 text-xs font-black uppercase tracking-[0.18em] text-text-secondary">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                <input
                  {...register("email")}
                  type="email"
                  placeholder="you@university.ac.za"
                  className={cn(
                    "w-full rounded-[18px] border-2 border-transparent bg-app-muted py-4 pl-12 pr-4 font-semibold outline-none transition focus:border-primary",
                    errors.email && "border-red-400"
                  )}
                />
              </div>
              {errors.email && <p className="px-1 text-xs font-bold text-red-500">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="px-1 text-xs font-black uppercase tracking-[0.18em] text-text-secondary">
                Password
              </label>
              <input
                {...register("password")}
                type="password"
                placeholder="Enter your password"
                className={cn(
                  "w-full rounded-[18px] border-2 border-transparent bg-app-muted px-4 py-4 font-semibold outline-none transition focus:border-primary",
                  errors.password && "border-red-400"
                )}
              />
              {errors.password && <p className="px-1 text-xs font-bold text-red-500">{errors.password.message}</p>}
            </div>

            {authError && (
              <div className="rounded-[18px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
                {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center gap-3 rounded-full bg-primary px-6 py-4 text-sm font-black uppercase tracking-[0.18em] text-white shadow-xl shadow-blue-500/20 transition hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-50"
            >
              <LogIn size={16} />
              {isSubmitting ? "Signing in..." : "Login"}
            </button>
          </form>

          <div className="mt-8 rounded-[24px] border border-blue-100 bg-blue-50 p-5 dark:border-blue-900/30 dark:bg-blue-950/20">
            <div className="flex gap-3">
              <Sparkles className="mt-1 text-primary" size={18} />
              <div>
                <p className="font-black text-app">AI tutor note</p>
                <p className="mt-1 text-sm font-medium text-text-secondary">
                  This local build includes Anthropic support for the tutor experience, with graceful demo fallbacks for the rest of the stack.
                </p>
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-sm font-semibold text-text-secondary">
            New here? <Link href="/register" className="font-black text-primary hover:underline">Create an account</Link>
          </p>
        </section>
      </div>
    </div>
  );
}
