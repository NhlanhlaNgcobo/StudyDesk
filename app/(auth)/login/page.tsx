"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { LogIn, Mail, Lock, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export default function LoginPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const [authError, setAuthError] = useState("");

  // Auto-redirect if already logged in
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const snap = await getDoc(doc(db, "users", user.uid));
        const role = snap.data()?.role;
        if (role === "tutor") router.replace("/tutor/dashboard");
        else if (role === "student") router.replace("/student/dashboard");
        else router.replace("/role-select");
      }
    });
    return () => unsub();
  }, [router]);

  const onSubmit = async (data: LoginForm) => {
    setAuthError("");
    try {
      const cred = await signInWithEmailAndPassword(auth, data.email, data.password);
      const snap = await getDoc(doc(db, "users", cred.user.uid));
      const role = snap.data()?.role;
      if (role === "tutor") router.push("/tutor/dashboard");
      else if (role === "student") router.push("/student/dashboard");
      else router.push("/role-select");
    } catch (error: any) {
      console.error("Login error:", error);
      setAuthError("Invalid email or password. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFF] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-100 p-10 space-y-8"
      >
        <div className="flex flex-col items-center gap-4 text-center">
            <Link href="/" className="flex items-center gap-2 mb-4 group scale-150">
                <div className="w-10 h-10 bg-primary rounded-base flex items-center justify-center text-white font-bold text-xl group-hover:rotate-6 transition-transform">
                S
                </div>
                <span className="font-extrabold text-2xl tracking-tight">StudyDesk</span>
            </Link>
            <h1 className="text-3xl font-extrabold tracking-tight">Welcome back!</h1>
            <p className="text-slate-600 font-bold">Ready to dominate your syllabus?</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-wider text-text-secondary px-1">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-primary transition-colors" size={20} />
              <input
                {...register("email")}
                type="email"
                placeholder="you@university.ac.za"
                className={cn(
                  "w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-base outline-none focus:border-primary focus:bg-white transition-all font-medium",
                  errors.email && "border-red-400 focus:border-red-400 bg-red-50/10"
                )}
              />
            </div>
            {errors.email && <p className="text-xs text-red-500 font-bold px-1">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between px-1">
                <label className="text-sm font-bold uppercase tracking-wider text-slate-700">Password</label>
                <Link href="#" className="text-xs font-black text-primary hover:underline uppercase tracking-widest">Forgot password?</Link>
            </div>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-primary transition-colors" size={20} />
              <input
                {...register("password")}
                type="password"
                placeholder="••••••••"
                className={cn(
                  "w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-base outline-none focus:border-primary focus:bg-white transition-all font-medium",
                  errors.password && "border-red-400 focus:border-red-400 bg-red-50/10"
                )}
              />
            </div>
            {errors.password && <p className="text-xs text-red-500 font-bold px-1">{errors.password.message}</p>}
          </div>

            {authError && <p className="text-sm text-red-500 font-bold px-1 text-center bg-red-50 p-2 rounded-md">{authError}</p>}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-primary text-white font-bold rounded-base text-lg hover:shadow-lg hover:shadow-primary/20 transition-all flex items-center justify-center gap-2 group border-0 outline-none active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? "Logging in..." : "Login"}
            {!isSubmitting && <LogIn size={20} className="group-hover:translate-x-1 transition-transform" />}
          </button>

          <button
            type="button"
            onClick={() => {
              // Pre-fill and submit or just redirect
              router.push("/student/dashboard");
            }}
            className="w-full py-4 bg-slate-900 text-white font-bold rounded-base text-lg hover:shadow-xl hover:bg-black transition-all flex items-center justify-center gap-2 group border-0 outline-none active:scale-95 shadow-lg"
          >
            Login with Demo Account
            <Zap size={20} className="text-primary group-hover:scale-125 transition-transform" fill="currentColor" />
          </button>
        </form>

         <div className="relative py-4">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t-2 border-slate-100"></span></div>
            <div className="relative flex justify-center text-[10px] uppercase font-black tracking-[0.2em] text-slate-500">
              <span className="bg-white px-4">Or continue with</span>
            </div>
         </div>

        <button className="w-full py-4 border-2 border-slate-100 rounded-base font-bold flex items-center justify-center gap-3 hover:bg-slate-50 transition-all">
           <svg className="w-5 h-5" viewBox="0 0 24 24">
             <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
             <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
             <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
             <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
           </svg>
           Google Account
        </button>

         <p className="text-center text-sm font-bold text-slate-600">
           New here? <Link href="/register" className="text-primary hover:underline font-black">Create an account</Link>
         </p>
      </motion.div>
    </div>
  );
}
