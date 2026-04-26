"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Check, 
  X, 
  Info, 
  ChevronRight, 
  ChevronLeft, 
  Users, 
  Star, 
  Zap, 
  Award, 
  Lock, 
  Unlock, 
  ShieldCheck,
  CreditCard,
  Gift,
  Copy,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { PaymentProvider } from "@/lib/payments";
import { auth } from "@/lib/firebase";

const PROVIDERS: { id: PaymentProvider; label: string; logo: string; desc: string }[] = [
  { id: "payfast", label: "PayFast", logo: "PF", desc: "Card, EFT, SnapScan" },
  { id: "paystack", label: "Paystack", logo: "PS", desc: "Card, Mobile Money" },
  { id: "yoco", label: "Yoco", logo: "YC", desc: "Card, QR Pay" },
  { id: "payshap", label: "PayShap", logo: "SH", desc: "Instant Bank Transfer" },
];

// --- Pricing Context Mock ---

const PACKAGES = [
  {
    id: "free",
    name: "Free",
    price: "R0",
    features: [
      "2 Modules",
      "10 AI Note generations/month",
      "5 Quizzes/month",
      "2 Mock Exams/month",
      "Join 1 Tutor Group",
      "Basic flashcards",
      "Watermarked PDF exports",
    ],
    notIncluded: [
        "AI Tutor Chat",
        "Spaced repetition",
        "Study Planner",
        "No watermarks",
        "Vision recognition"
    ]
  },
  {
    id: "student",
    name: "Student",
    price: "R69",
    annualPrice: "R690",
    popular: true,
    features: [
      "Unlimited Modules",
      "Unlimited AI Notes",
      "Unlimited Quizzes & Exams",
      "AI Tutor Chat (Sonnet)",
      "Join up to 5 Tutor Groups",
      "Spaced repetition flashcards",
      "Study Planner + Analytics",
      "PDF exports (no watermark)",
      "Past Paper analysis",
    ],
    notIncluded: [
        "Opus 4.6 AI Model",
        "Diagram recognition",
        "Offline note access"
    ]
  },
  {
    id: "student_pro",
    name: "Student Pro",
    price: "R129",
    annualPrice: "R1290",
    features: [
      "Everything in Student",
      "Opus 4.6 for all AI output",
      "Diagram recognition (Vision)",
      "Collaborative notes sharing",
      "Priority generation queue",
      "Advanced weak-topic targeting",
      "Unlimited Tutor Groups",
      "Offline note access",
    ],
  },
  {
    id: "tutor",
    name: "Tutor",
    price: "R199",
    annualPrice: "R1990",
    features: [
      "Create unlimited Groups",
      "Up to 50 students/group",
      "Share AI-generated materials",
      "Group analytics dashboard",
      "Branded group page",
      "Announcement broadcasts",
      "Student progress tracking",
      "Tutor profile page (SEO)",
    ],
  },
];

// --- Sub-components ---

const PackageCard = ({ pkg, billingCycle, onCheckout, isLoading }: any) => {
    const isFree = pkg.id === "free";
    const currentPrice = billingCycle === "monthly" ? pkg.price : pkg.annualPrice;
    const effectivePrice = billingCycle === "monthly" ? pkg.price : `R${Math.round(parseInt(pkg.annualPrice.slice(1)) / 12)}`;

    return (
        <div className={cn(
            "relative bg-white dark:bg-slate-900 border-2 rounded-3xl p-10 flex flex-col h-full transition-all group hover:shadow-2xl hover:-translate-y-2",
            pkg.popular ? "border-primary shadow-xl shadow-primary/10 z-10 scale-[1.05]" : "border-slate-100 dark:border-slate-800"
        )}>
            {pkg.popular && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-primary text-white px-6 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg">
                    Most Popular
                </div>
            )}
            
            <div className="space-y-4 mb-8">
                <h3 className="text-2xl font-bold italic tracking-tighter uppercase">{pkg.name}</h3>
                <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold italic tracking-tighter text-primary">{currentPrice}</span>
                    <span className="text-slate-600 dark:text-slate-400 font-bold">/ {billingCycle === "monthly" ? "month" : "year"}</span>
                </div>
                {!isFree && billingCycle === "annually" && (
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 italic">Save 2 Months (Effective {effectivePrice}/mo)</p>
                )}
            </div>

            <div className="flex-1 space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Core Features</p>
                <div className="space-y-3">
                    {pkg.features.map((f: string) => (
                        <div key={f} className="flex items-start gap-3">
                            <div className="w-5 h-5 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center shrink-0 mt-0.5"><Check size={12} strokeWidth={4}/></div>
                            <span className="text-sm font-bold text-slate-600 dark:text-slate-400 leading-tight">{f}</span>
                        </div>
                    ))}
                    {pkg.notIncluded?.map((f: string) => (
                        <div key={f} className="flex items-start gap-3 opacity-30">
                            <div className="w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-slate-400"><X size={12} strokeWidth={4}/></div>
                            <span className="text-sm font-bold text-slate-400 leading-tight">{f}</span>
                        </div>
                    ))}
                </div>
            </div>

            <button 
                onClick={() => onCheckout(pkg.id)}
                disabled={isLoading}
                className={cn(
                    "w-full py-5 rounded-xl font-black uppercase text-xs tracking-widest mt-12 transition-all active:scale-95 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed",
                    pkg.popular 
                        ? "bg-primary text-white shadow-primary/20 hover:shadow-primary/40" 
                        : "bg-slate-900 dark:bg-slate-800 text-white hover:bg-primary shadow-slate-900/20"
                )}
            >
                {isLoading ? "Redirecting..." : isFree ? "Get Started" : "Upgrade Now"}
            </button>
        </div>
    );
};

export default function PricingPage() {
    const [billingCycle, setBillingCycle] = useState<"monthly" | "annually">("monthly");
    const [referralCode, setReferralCode] = useState("STUDY_G67H9");
    const [copied, setCopied] = useState(false);
    const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
    const [selectedProvider, setSelectedProvider] = useState<PaymentProvider>("payfast");

    const handleCopy = () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleCheckout = async (planId: string) => {
        try {
            setLoadingPlan(planId);
            const response = await fetch("/api/checkout/payfast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    planId,
                    billingCycle,
                    provider: selectedProvider,
                    userEmail: auth.currentUser?.email || "",
                    userName: auth.currentUser?.displayName || "",
                    userId: auth.currentUser?.uid || "",
                }),
            });

            const data = await response.json();

            if (data.url) {
                window.location.href = data.url;
            } else {
                alert(data.error || "Failed to initiate checkout");
            }
        } catch (error) {
            console.error("Checkout Error:", error);
            alert("Something went wrong. Please try again.");
        } finally {
            setLoadingPlan(null);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFF] dark:bg-slate-950 font-inter">
            {/* Nav */}
            <nav className="h-24 px-10 flex items-center justify-between bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-50 border-b">
                 <Link href="/" className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary rounded-base shrink-0 flex items-center justify-center text-white font-bold text-xl">S</div>
                    <span className="font-extrabold text-xl tracking-tight">StudyDesk</span>
                </Link>
                <div className="flex items-center gap-8">
                    <Link href="/login" className="font-black uppercase text-[10px] tracking-widest hover:text-primary transition-colors">Login</Link>
                    <Link href="/register" className="px-6 py-3 bg-primary text-white font-black uppercase text-[10px] tracking-widest rounded-base hover:shadow-xl hover:shadow-primary/30 transition-all shadow-lg shadow-primary/10">Get Started Free</Link>
                </div>
            </nav>

            {/* Hero */}
            <section className="max-w-7xl mx-auto py-24 px-6 text-center space-y-8">
                <div className="inline-flex items-center gap-2 px-6 py-2 bg-primary/5 text-primary rounded-full text-xs font-black uppercase tracking-widest border border-primary/20">
                    Pricing Transparency
                </div>
                <h1 className="text-6xl md:text-8xl font-bold tracking-tight uppercase leading-tight italic">
                  Studying, <span className="text-primary underline decoration-primary decoration-8">Supercharged.</span><br/>
                  Your Ultimate AI Co-Pilot.
                </h1>
                <p className="text-2xl text-slate-600 dark:text-slate-400 font-bold max-w-3xl mx-auto">Flexible academic powerups designed for the South African student life.</p>
                
                {/* Payment Provider Selector */}
                <div className="flex flex-wrap justify-center gap-3 pt-6">
                    {PROVIDERS.map(p => (
                        <button
                            key={p.id}
                            onClick={() => setSelectedProvider(p.id)}
                            className={cn(
                                "flex items-center gap-3 px-5 py-3 rounded-xl border-2 font-black text-sm transition-all",
                                selectedProvider === p.id
                                    ? "border-primary bg-primary/5 text-primary shadow-lg shadow-primary/10"
                                    : "border-slate-100 bg-white text-slate-500 hover:border-slate-200"
                            )}
                        >
                            <div className="w-7 h-7 rounded-lg bg-slate-900 text-white text-[9px] font-black flex items-center justify-center shrink-0">{p.logo}</div>
                            <div className="text-left">
                                <p className="text-xs font-black uppercase tracking-widest">{p.label}</p>
                                <p className="text-[10px] font-bold text-slate-400">{p.desc}</p>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Billing Toggle */}
                <div className="flex items-center justify-center gap-6 pt-8">
                    <span className={cn("text-sm font-black uppercase tracking-widest", billingCycle === "monthly" ? "text-primary" : "text-slate-400")}>Monthly</span>
                    <button 
                        onClick={() => setBillingCycle(c => c === "monthly" ? "annually" : "monthly")}
                        className="w-20 h-10 bg-slate-900 dark:bg-slate-800 rounded-full relative p-1 shadow-inner"
                    >
                        <motion.div 
                            animate={{ x: billingCycle === "monthly" ? 0 : 40 }}
                            className="w-8 h-8 bg-white rounded-full shadow-lg"
                        />
                    </button>
                    <div className="flex items-center gap-3">
                        <span className={cn("text-sm font-black uppercase tracking-widest", billingCycle === "annually" ? "text-primary" : "text-slate-400")}>Annually</span>
                        <span className="px-3 py-1 bg-emerald-500 text-white rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg">2 Months Free</span>
                    </div>
                </div>
            </section>

            {/* Pricing Grid */}
            <section className="max-w-7xl mx-auto px-6 pb-32">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-start">
                    {PACKAGES.map(pkg => (
                        <PackageCard 
                            key={pkg.id} 
                            pkg={pkg} 
                            billingCycle={billingCycle} 
                            onCheckout={handleCheckout}
                            isLoading={loadingPlan === pkg.id}
                        />
                    ))}
                </div>
            </section>

            {/* Verification Banner */}
            <section className="max-w-7xl mx-auto px-6 pb-32">
                 <div className="bg-slate-900 text-white p-12 rounded-[40px] shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-12">
                    <div className="space-y-6 relative z-10 text-center md:text-left">
                        <div className="flex items-center gap-3 justify-center md:justify-start">
                           <ShieldCheck className="text-primary" size={32} />
                           <h2 className="text-3xl font-black italic tracking-tighter uppercase">Student verification ON</h2>
                        </div>
                        <p className="text-lg text-slate-400 font-medium max-w-xl">Register with your <span className="text-primary font-black italic underline">.ac.za</span> email (UCT, Wits, UKZN, etc.) to unlock student-tier pricing and 14-day free trials.</p>
                        <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                           {["@uct.ac.za", "@wits.ac.za", "@ukzn.ac.za", "@up.ac.za"].map(d => (
                               <div key={d} className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-black tracking-widest text-slate-500 uppercase">{d}</div>
                           ))}
                        </div>
                    </div>
                    <div className="shrink-0 relative z-10 w-full md:w-auto">
                        <div className="bg-white/5 p-8 rounded-3xl border border-white/10 space-y-6">
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary text-center">Refer 2 friends → Get 1 Month Free</p>
                            <div className="flex gap-2">
                                <div className="bg-slate-950 px-6 py-4 rounded-xl border border-white/5 font-black italic tracking-widest text-primary text-2xl">
                                    {referralCode}
                                </div>
                                <button 
                                    onClick={handleCopy}
                                    className="p-4 bg-primary text-white rounded-xl shadow-lg active:scale-90 transition-all"
                                >
                                    {copied ? <CheckCircle2 /> : <Copy />}
                                </button>
                            </div>
                            <p className="text-[10px] font-medium text-slate-500 text-center uppercase tracking-widest">Share code to create a viral loop</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Payment Operations */}
            <section className="max-w-7xl mx-auto px-6 pb-32 space-y-16">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                    <div className="space-y-6">
                        <div className="w-16 h-16 bg-white shadow-xl rounded-2xl flex items-center justify-center text-primary"><CreditCard size={32}/></div>
                        <h3 className="text-2xl font-black italic uppercase tracking-tighter">Native SA Payments</h3>
                        <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed italic">Fully integrated with <span className="text-primary font-black">PayFast</span> and <span className="text-slate-900 dark:text-slate-200 font-black">SnapScan</span>. Support for EFT, Visa, and Mastercard natively.</p>
                    </div>
                     <div className="space-y-6">
                        <div className="w-16 h-16 bg-white shadow-xl rounded-2xl flex items-center justify-center text-emerald-500"><AlertCircle size={32}/></div>
                        <h3 className="text-2xl font-black italic uppercase tracking-tighter">NSFAS-Friendly Billing</h3>
                        <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed italic">Month-end billing cycles aligned with <span className="text-emerald-500 font-black underline">NSFAS disbursement dates</span>. Pay when you receive your allowance.</p>
                    </div>
                     <div className="space-y-6">
                        <div className="w-16 h-16 bg-white shadow-xl rounded-2xl flex items-center justify-center text-orange-500"><Gift size={32}/></div>
                        <h3 className="text-2xl font-black italic uppercase tracking-tighter">Campus/SRC Deals</h3>
                        <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed italic">Institutional rates available for SRCs and Res associations at <span className="text-orange-500 font-black underline">R45/month bulk pricing</span>.</p>
                    </div>
                 </div>
            </section>

            <footer className="py-20 border-t border-slate-100 bg-white">
                 <div className="max-w-7xl mx-auto px-6 text-center space-y-8">
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">© 2026 StudyDesk. Academic Sovereignty for South Africa.</p>
                     <div className="flex justify-center gap-12 font-black uppercase text-[10px] tracking-widest text-slate-600 dark:text-slate-400">
                        <Link href="/terms" className="hover:text-primary transition-all">Terms</Link>
                        <Link href="/privacy" className="hover:text-primary transition-all">Privacy</Link>
                        <Link href="/popia" className="hover:text-primary transition-all">POPIA</Link>
                        <Link href="mailto:support@studydesk.co.za" className="hover:text-primary transition-all">Support</Link>
                      </div>
                 </div>
            </footer>
        </div>
    );
}
