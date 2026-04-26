"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Presentation, Landmark, User, Hash, ArrowRight, ArrowLeft, X, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

const tutorOnboardingSchema = z.object({
  fullName: z.string().min(2, "Full name required"),
  university: z.string().min(1, "Please select an institution"),
  subjects: z.array(z.string()).min(1, "Add at least one subject"),
  bio: z.string().max(250, "Bio too long"),
});

type OnboardingForm = z.infer<typeof tutorOnboardingSchema>;

export default function TutorOnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<OnboardingForm>({
    resolver: zodResolver(tutorOnboardingSchema),
    defaultValues: { fullName: user?.displayName || "", subjects: [] }
  });

  const bioContent = watch("bio", "");
  const fullName = watch("fullName", "Nhlanhla");

  useEffect(() => {
    setValue("subjects", tags);
  }, [tags, setValue]);

  const addTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput("");
    }
  };

  const removeTag = (t: string) => setTags(tags.filter(tag => tag !== t));

  const onSubmit = async (data: OnboardingForm) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      await setDoc(doc(db, "users", user.uid), {
        id: user.uid,
        name: data.fullName,
        email: user.email,
        university: data.university,
        subjects: data.subjects,
        bio: data.bio,
        role: "tutor",
        tier: "Elite",
        points: 0,
        streak: 1,
        rank: "Master",
        createdAt: serverTimestamp(),
      });
      router.push("/tutor/dashboard");
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
            <h1 className="text-3xl font-extrabold tracking-tight underline italic decoration-primary decoration-4">Expert Profile</h1>
            <p className="text-text-secondary mt-2">Ready to help students master their course?</p>
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
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={20} />
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
                    {...register("university")}
                    type="text"
                    placeholder="Search e.g. UCT"
                    className={cn(
                        "w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-base outline-none focus:border-primary focus:bg-white transition-all font-medium",
                        errors.university && "border-red-400"
                    )}
                  />
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
                <label className="text-sm font-bold uppercase tracking-wider text-text-secondary px-1">Subjects Taught</label>
                <div className="relative">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={20} />
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={addTag}
                    type="text"
                    placeholder="Maths, Physics... (Press Enter)"
                    className={cn(
                        "w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-base outline-none focus:border-primary focus:bg-white transition-all font-medium",
                        errors.subjects && !tags.length && "border-red-400"
                    )}
                  />
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {tags.map(t => (
                    <div key={t} className="bg-primary/10 text-primary px-3 py-1.5 rounded-full text-xs font-black flex items-center gap-2 border border-primary/20 shadow-sm animate-in fade-in zoom-in duration-300">
                        {t} <button type="button" onClick={() => removeTag(t)} className="hover:text-red-500"><X size={14}/></button>
                    </div>
                  ))}
                </div>
                {errors.subjects && !tags.length && <p className="text-xs text-red-500 font-bold px-1">{errors.subjects.message}</p>}
              </div>

               <div className="space-y-2">
                <div className="flex justify-between px-1">
                    <label className="text-sm font-bold uppercase tracking-wider text-text-secondary">Short Bio</label>
                    <span className={cn("text-[10px] font-black tracking-widest leading-none", bioContent.length > 200 ? "text-red-500" : "text-primary")}>
                      {bioContent.length} / 250
                    </span>
                </div>
                <textarea
                    {...register("bio")}
                    placeholder="Tell us about your teaching style..."
                    className="w-full px-4 py-4 bg-slate-50 border-2 border-transparent rounded-base outline-none focus:border-primary focus:bg-white transition-all font-medium min-h-32 resize-none"
                />
                {errors.bio && <p className="text-xs text-red-500 font-bold px-1">{errors.bio.message}</p>}
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
                <div className="w-24 h-24 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-8 ring-8 ring-primary/5">
                    <Presentation size={48} />
                </div>
                <h3 className="text-4xl font-extrabold mb-4 italic tracking-tighter">Ready to Mentor?</h3>
                <p className="text-text-secondary text-lg leading-relaxed font-medium">
                   Great to have you, <span className="text-primary font-bold">{fullName.split(' ')[0]}!</span> Your expertise at <span className="text-primary font-bold">{watch("university")}</span> is now ready to empower students.
                </p>
                <div className="mt-8 flex gap-2">
                   {tags.slice(0, 3).map(t => (
                        <div key={t} className="px-3 py-1 bg-slate-50 border rounded-full text-[10px] font-black uppercase text-slate-400">
                            {t}
                        </div>
                   ))}
                </div>
            </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-4 pt-10">
            {step > 1 && (
                <button
                    type="button"
                    onClick={prevStep}
                    className="flex-1 py-4 border-2 border-slate-100 rounded-base font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
                >
                    <ArrowLeft size={18} /> Back
                </button>
            )}
            
            {step < 3 ? (
                 <button
                    type="button"
                    onClick={nextStep}
                    className="flex-[2] py-4 bg-primary text-white font-black text-xl rounded-base flex items-center justify-center gap-2 hover:shadow-2xl hover:shadow-primary/30 active:scale-95 transition-all"
                >
                    Continue <ArrowRight size={20} />
                </button>
            ) : (
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-[2] py-4 bg-primary text-white font-black text-xl rounded-base flex items-center justify-center gap-2 hover:shadow-2xl hover:shadow-primary/30 active:scale-95 transition-all group disabled:opacity-50"
                >
                    {isSubmitting ? (
                        <><Loader2 className="animate-spin" size={20} /> Launching Workspace...</>
                    ) : (
                        <>Launch My Workspace <Sparkles size={20} className="group-hover:rotate-12 transition-transform" /></>
                    )}
                </button>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  );
}
