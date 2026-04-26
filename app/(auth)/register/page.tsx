"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { User, Mail, Lock, UserPlus, ShieldCheck, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/lib/firebase";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [strength, setStrength] = useState(0);
  const [authError, setAuthError] = useState("");
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const password = watch("password", "");

  useEffect(() => {
    let score = 0;
    if (!password) {
      setStrength(0);
      return;
    }
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    setStrength(score);
  }, [password]);

  const strengthLabels = ["Weak", "Fair", "Good", "Strong"];
  const strengthColors = ["bg-red-400", "bg-yellow-400", "bg-blue-400", "bg-green-500"];

  const getFirebaseErrorMessage = (code: string) => {
    switch (code) {
      case "auth/email-already-in-use": return "An account with this email already exists.";
      case "auth/invalid-email": return "Invalid email address format.";
      case "auth/weak-password": return "Password is too weak. Use at least 8 characters.";
      case "auth/operation-not-allowed": return "Account creation is currently disabled.";
      default: return "An unexpected error occurred. Please try again.";
    }
  };

  const onSubmit = async (data: RegisterForm) => {
    setAuthError("");
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      await updateProfile(userCredential.user, { displayName: data.name });
      router.push("/role-select");
    } catch (err: any) {
      console.error("Register error:", err);
      setAuthError(getFirebaseErrorMessage(err.code));
    }
  };

  const handleGoogleSignup = async () => {
    setAuthError("");
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.push("/role-select");
    } catch (err: any) {
      console.error("Google signup error:", err);
      if (err.code !== "auth/popup-closed-by-user") {
        setAuthError(getFirebaseErrorMessage(err.code));
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFF] flex items-center justify-center p-6 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg bg-white rounded-xl shadow-xl border border-slate-100 p-10 space-y-8"
      >
        <div className="flex flex-col items-center gap-4 text-center">
            <Link href="/" className="flex items-center gap-2 mb-4 group scale-150">
                <div className="w-10 h-10 bg-primary rounded-base flex items-center justify-center text-white font-bold text-xl group-hover:rotate-6 transition-transform">
                S
                </div>
                <span className="font-extrabold text-2xl tracking-tight">StudyDesk</span>
            </Link>
            <h1 className="text-3xl font-extrabold tracking-tight">Join the Academy</h1>
            <p className="text-text-secondary">Start your journey to academic excellence.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-wider text-text-secondary px-1">Full Name</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-primary transition-colors" size={20} />
              <input
                {...register("name")}
                type="text"
                placeholder="Nhlanhla Ngcobo"
                className={cn(
                  "w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-base outline-none focus:border-primary focus:bg-white transition-all font-medium",
                  errors.name && "border-red-400 focus:border-red-400 bg-red-50/10"
                )}
              />
            </div>
            {errors.name && <p className="text-xs text-red-500 font-bold px-1">{errors.name.message}</p>}
          </div>

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
            <label className="text-sm font-bold uppercase tracking-wider text-text-secondary px-1">Password</label>
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
            
            {/* Password Strength Bar */}
            <div className="pt-2 px-1">
               <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-bold uppercase text-text-secondary tracking-widest leading-none">Security Level</span>
                  <span className={cn("text-[10px] font-black uppercase tracking-widest leading-none", strength > 0 ? "text-primary" : "text-slate-300")}>
                    {strength > 0 ? strengthLabels[strength - 1] : "None"}
                  </span>
               </div>
               <div className="h-1.5 w-full bg-slate-100 rounded-full flex gap-1 overflow-hidden">
                  {[1, 2, 3, 4].map((step) => (
                    <motion.div 
                      key={step} 
                      className={cn("h-full flex-1 transition-colors duration-500", step <= strength ? strengthColors[strength - 1] : "bg-transparent")}
                    />
                  ))}
               </div>
               <p className="text-[10px] text-text-secondary mt-2">Use 8+ characters with symbols & numbers for maximum safety.</p>
            </div>
            {errors.password && <p className="text-xs text-red-500 font-bold px-1 mt-1">{errors.password.message}</p>}
          </div>

          {authError && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-base">
              <AlertCircle size={18} className="text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm text-red-600 font-bold">{authError}</p>
            </div>
          )}
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-primary text-white font-bold rounded-base text-lg hover:shadow-lg hover:shadow-primary/20 transition-all flex items-center justify-center gap-2 group border-0 outline-none active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? "Creating Account..." : "Create Account"}
            {!isSubmitting && <UserPlus size={20} className="group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>

        <div className="relative py-4">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t-2 border-slate-100"></span></div>
            <div className="relative flex justify-center text-[10px] uppercase font-black tracking-[0.2em] text-slate-500">
              <span className="bg-white px-4">Or continue with</span>
            </div>
        </div>

        <button 
           type="button"
           onClick={handleGoogleSignup}
           className="w-full py-4 border-2 border-slate-100 rounded-base font-bold flex items-center justify-center gap-3 hover:bg-slate-50 transition-all"
        >
           <svg className="w-5 h-5" viewBox="0 0 24 24">
             <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
             <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
             <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
             <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
           </svg>
           Google Account
        </button>

        <div className="p-4 bg-blue-50/50 rounded-base border border-blue-100 flex gap-4 items-start">
           <div className="mt-1 text-primary"><ShieldCheck size={20} /></div>
           <div className="text-xs text-slate-600 leading-relaxed font-medium">
             By joining, you agree to our <Link href="#" className="font-bold text-primary underline">Terms of Service</Link> and <Link href="#" className="font-bold text-primary underline">POPIA Compliance Notice</Link>.
           </div>
        </div>

        <p className="text-center text-sm font-bold text-text-secondary">
          Already a member? <Link href="/login" className="text-primary hover:underline">Sign into Desk</Link>
        </p>
      </motion.div>
    </div>
  );
}
