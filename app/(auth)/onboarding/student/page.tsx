"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, Landmark, BookOpen, Calendar, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

const universities = ["UCT", "Wits", "UKZN", "UP", "SU", "UJ", "NWU", "RU", "UWC", "UL", "MUT", "DUT", "CPUT", "TUT", "VUT", "UFH", "WSU", "UNIVEN", "SMU", "UZ"];

const studentOnboardingSchema = z.object({
  fullName: z.string().min(2, "Full name required"),
  university: z.string().min(1, "Please select an institution"),
  degree: z.string().min(2, "Course/Degree is required"),
  year: z.string().min(1, "Select study year"),
});

type OnboardingForm = z.infer<typeof studentOnboardingSchema>;

export default function StudentOnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<OnboardingForm>({
    resolver: zodResolver(studentOnboardingSchema),
    defaultValues: { fullName: user?.displayName || "" }
  });

  const selectedUniv = watch("university");
  const [query, setQuery] = useState("");
  const [showUnivs, setShowUnivs] = useState(false);

  const filteredUnivs = universities.filter(u => u.toLowerCase().includes(query.toLowerCase()));

  const onSubmit = async (data: OnboardingForm) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      await setDoc(doc(db, "users", user.uid), {
        id: user.uid,
        name: data.fullName,
        fullName: data.fullName,
        email: user.email,
        university: data.university,
        degree: data.degree,
        year: data.year,
        role: "student",
        tier: "Premium Student",
        points: 0,
        streak: 1,
        rank: "Scholar",
        onboardingComplete: true,
        createdAt: serverTimestamp(),
      }, { merge: true });
      router.push("/student/dashboard");
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => setStep(s => Math.min(s + 1, 3));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const Progress = () => (
    <div className="flex gap-2 max-w-xs mx-auto mb-10 w-full px-1">
      {[1, 2, 3].map(i => (
        <div 
            key={i} 
            className={cn(
                "h-2 flex-1 rounded-full bg-slate-100 transition-colors duration-500",
                i <= step ? "bg-primary" : "bg-slate-100"
            )}
        />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFF] flex items-center justify-center p-6 py-20">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-xl bg-white rounded-xl shadow-xl border border-slate-100 p-10 space-y-8"
      >
        <div className="text-center">
            <Progress />
            <h1 className="text-3xl font-extrabold tracking-tight">Complete Profile</h1>
            <p className="text-text-secondary mt-2">Tailor your StudyDesk for your university.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 min-h-[400px] flex flex-col justify-between">
          <AnimatePresence mode="wait">
            {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-wider text-text-secondary px-1">Full Name</label>
                <div className="relative">
                  <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={20} />
                  <input
                    {...register("fullName")}
                    type="text"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-base outline-none focus:border-primary focus:bg-white transition-all font-medium"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-wider text-text-secondary px-1">Institution / University</label>
                <div className="relative">
                  <Landmark className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={20} />
                  <input
                    type="text"
                    placeholder="Search e.g. UCT"
                    value={selectedUniv || query}
                    onFocus={() => setShowUnivs(true)}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setValue("university", "");
                    }}
                    className={cn(
                        "w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-base outline-none focus:border-primary focus:bg-white transition-all font-medium",
                        errors.university && "border-red-400"
                    )}
                  />
                  {showUnivs && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-base shadow-xl z-20 max-h-48 overflow-y-auto">
                        {filteredUnivs.map(univ => (
                            <div 
                                key={univ}
                                onClick={() => {
                                    setValue("university", univ);
                                    setQuery(univ);
                                    setShowUnivs(false);
                                }}
                                className="px-6 py-3 hover:bg-primary/5 cursor-pointer font-bold border-b border-slate-50 last:border-0"
                            >
                                {univ}
                            </div>
                        ))}
                    </div>
                  )}
                </div>
                {errors.university && <p className="text-xs text-red-500 font-bold px-1">{errors.university.message}</p>}
              </div>
            </motion.div>
            )}

            {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-wider text-text-secondary px-1">Degree / Course</label>
                <div className="relative">
                  <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={20} />
                  <input
                    {...register("degree")}
                    type="text"
                    placeholder="BSc Computer Science"
                    className={cn(
                        "w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-base outline-none focus:border-primary focus:bg-white transition-all font-medium",
                        errors.degree && "border-red-400"
                    )}
                  />
                </div>
                {errors.degree && <p className="text-xs text-red-500 font-bold px-1">{errors.degree.message}</p>}
              </div>

               <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-wider text-text-secondary px-1">Year of Study</label>
                <div className="grid grid-cols-4 gap-2">
                  {["1", "2", "3", "4", "5", "6", "Master", "PhD"].map(y => (
                    <div 
                        key={y}
                        onClick={() => setValue("year", y)}
                        className={cn(
                            "py-4 border-2 rounded-base flex items-center justify-center cursor-pointer transition-all font-black",
                            watch("year") === y ? "bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-105" : "border-slate-50 bg-slate-50 text-slate-400 hover:border-slate-200"
                        )}
                    >
                        {y}
                    </div>
                  ))}
                </div>
                {errors.year && <p className="text-xs text-red-500 font-bold px-1">{errors.year.message}</p>}
              </div>
            </motion.div>
            )}

            {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center text-center py-10"
            >
                <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-8 ring-8 ring-green-50/50">
                    <Calendar size={48} />
                </div>
                <h3 className="text-3xl font-extrabold mb-4 italic tracking-tighter">Ready to Rock?</h3>
                <p className="text-text-secondary text-lg leading-relaxed font-medium">
                   Everything is set, <span className="text-primary font-bold">{watch("fullName").split(' ')[0]}!</span> We're preparing your personal study desk at <span className="text-primary font-bold">{watch("university")}</span>.
                </p>
            </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-4 pt-10">
            {step > 1 && (
                <button
                    type="button"
                    onClick={prevStep}
                    className="flex-1 py-4 border-2 border-slate-100 rounded-base font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-all active:scale-95"
                >
                    <ArrowLeft size={18} /> Back
                </button>
            )}
            
            {step < 3 ? (
                 <button
                    type="button"
                    onClick={nextStep}
                    className="flex-[2] py-4 bg-primary text-white font-black text-lg rounded-base flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-primary/20 active:scale-95 transition-all text-xl"
                >
                    Continue <ArrowRight size={20} />
                </button>
            ) : (
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-[2] py-4 bg-primary text-white font-black text-lg rounded-base flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-primary/20 active:scale-95 transition-all text-xl disabled:opacity-50"
                >
                    {isSubmitting ? (
                        <><Loader2 className="animate-spin" size={20} /> Entering Desk...</>
                    ) : (
                        <>Enter My Desk <ArrowRight size={20} /></>
                    )}
                </button>
            )}
          </div>
        </form>Form
      </motion.div>
    </div>
  );
}
