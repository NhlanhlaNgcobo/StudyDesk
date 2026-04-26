"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, Presentation as Chalkboard, Check, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function RoleSelectPage() {
  const [role, setRole] = useState<'student' | 'tutor' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleContinue = async () => {
    if (!role) return;
    const user = auth.currentUser;
    if (!user) {
      setError("Session expired. Please log in again.");
      router.push("/login");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await setDoc(doc(db, "users", user.uid), { role }, { merge: true });
      router.push(role === "student" ? "/onboarding/student" : "/onboarding/tutor");
    } catch (e: any) {
      setError("Failed to save role. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFF] flex flex-col items-center justify-center p-6 space-y-12">
      <div className="text-center space-y-6">
        <Link href="/" className="flex items-center gap-2 mb-8 group justify-center scale-150">
            <div className="w-10 h-10 bg-primary rounded-base flex items-center justify-center text-white font-bold text-xl group-hover:rotate-6 transition-transform">
            S
            </div>
            <span className="font-extrabold text-2xl tracking-tight">StudyDesk</span>
        </Link>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight underline italic decoration-primary decoration-4">What&apos;s your goal?</h1>
        <p className="text-xl text-text-secondary font-medium">Select your primary role to customize your workspace.</p>
      </div>

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Student Card */}
        <motion.div 
          onClick={() => setRole('student')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            "p-10 bg-white rounded-xl shadow-lg border-2 cursor-pointer transition-all relative overflow-hidden group",
            role === 'student' ? "border-primary bg-primary/5 ring-8 ring-primary/5" : "border-slate-100 hover:border-slate-200"
          )}
        >
          <div className={cn(
             "w-16 h-16 rounded-full flex items-center justify-center mb-8 transition-colors",
             role === 'student' ? "bg-primary text-white" : "bg-slate-50 text-slate-400 group-hover:bg-slate-100 group-hover:text-primary"
          )}>
            <GraduationCap size={32} />
          </div>
          
          <h3 className="text-3xl font-extrabold mb-4 group-hover:text-primary transition-colors">Student</h3>
          <p className="text-text-secondary text-lg leading-relaxed font-medium">
            Master modules, take quizzes, and track your syllabus progress with AI-driven notes.
          </p>
          
          <AnimatePresence>
            {role === 'student' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                className="absolute top-6 right-6 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center shadow-lg shadow-primary/20"
              >
                 <Check size={20} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Tutor Card */}
        <motion.div 
          onClick={() => setRole('tutor')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            "p-10 bg-white rounded-xl shadow-lg border-2 cursor-pointer transition-all relative overflow-hidden group",
            role === 'tutor' ? "border-primary bg-primary/5 ring-8 ring-primary/5" : "border-slate-100 hover:border-slate-200"
          )}
        >
          <div className={cn(
             "w-16 h-16 rounded-full flex items-center justify-center mb-8 transition-colors",
             role === 'tutor' ? "bg-primary text-white" : "bg-slate-50 text-slate-400 group-hover:bg-slate-100 group-hover:text-primary"
          )}>
            <Chalkboard size={32} />
          </div>
          
          <h3 className="text-3xl font-extrabold mb-4 group-hover:text-primary transition-colors">Tutor</h3>
          <p className="text-text-secondary text-lg leading-relaxed font-medium">
            Create modules, manage groups, and help students master their materials through analytics.
          </p>

          <AnimatePresence>
            {role === 'tutor' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                className="absolute top-6 right-6 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center shadow-lg shadow-primary/20"
              >
                 <Check size={20} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {error && <p className="text-red-500 font-bold text-center">{error}</p>}

      <div className="w-full max-w-4xl flex justify-center pt-8">
         <button 
            onClick={handleContinue}
            disabled={!role || loading}
            className={cn(
                "px-12 py-5 bg-primary text-white font-black text-xl rounded-base flex items-center gap-3 transition-all",
                !role || loading ? "opacity-30 cursor-not-allowed" : "hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-1 active:scale-95"
            )}
         >
            {loading ? <Loader2 size={24} className="animate-spin" /> : null}
            {loading ? "Saving..." : <>Continue Journey <ArrowRight size={24} /></>}
         </button>
      </div>
    </div>
  );
}
