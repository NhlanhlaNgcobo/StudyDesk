"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  CreditCard, 
  Gift, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight, 
  AlertCircle, 
  ShieldCheck, 
  Zap, 
  Copy,
  History,
  TrendingUp,
  Award,
  Hash,
  Download
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePricing } from "@/contexts/pricing-context";
import { cn } from "@/lib/utils";

// --- Mock Histroy ---
const INVOICES = [
  { id: "INV-001", date: "Mar 15, 2026", amount: "R69.00", status: "Paid" },
  { id: "INV-002", date: "Feb 15, 2026", amount: "R69.00", status: "Paid" },
];

export default function BillingSettingsPage() {
  const { state, setPlan } = usePricing();
  const [copied, setCopied] = useState(false);
  const [referrals, setReferrals] = useState(1); // 1 out of 2

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 max-w-5xl mx-auto">
      <header>
          <h1 className="text-4xl font-black italic tracking-tighter uppercase underline decoration-primary decoration-4">Billing & Subscriptions</h1>
          <p className="text-text-secondary font-bold text-lg mt-2">Manage your academic powerups, referral loops, and payment history.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Current Plan Card */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border-2 border-primary rounded-3xl p-10 shadow-xl shadow-primary/5 space-y-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12"><Zap size={100} className="text-primary"/></div>
                <div className="flex justify-between items-start relative z-10">
                    <div className="space-y-2">
                        <div className="px-3 py-1 bg-primary text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg inline-block">Active Plan</div>
                        <h2 className="text-5xl font-black italic tracking-tighter uppercase">{state.plan.replace("_", " ")}</h2>
                        <p className="text-text-secondary font-bold">R69.00 / month • Renews April 15, 2026</p>
                    </div>
                    <Link href="/pricing" className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-primary transition-all shadow-xl">Upgrade Plan</Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-10 border-t border-slate-50 relative z-10">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Status</p>
                        <div className="flex items-center gap-2 text-emerald-500 font-black italic italic tracking-tighter">
                            <CheckCircle2 size={16}/> Active & Verified
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Method</p>
                        <div className="flex items-center gap-2 text-text-primary font-black italic tracking-tighter">
                            <CreditCard size={16}/> PayFast • Visa 4242
                        </div>
                    </div>
                     <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Billing Cycle</p>
                        <div className="flex items-center gap-2 text-text-primary font-black italic tracking-tighter">
                            <Clock size={16}/> Monthly
                        </div>
                    </div>
                </div>
            </div>

            {/* Referral Progress */}
            <div className="bg-slate-900 text-white rounded-3xl p-10 space-y-8 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10"><Gift size={80}/></div>
                <div className="space-y-2 relative z-10">
                    <h3 className="text-xl font-black italic tracking-tighter uppercase underline decoration-primary decoration-2">Viral Referral Loop</h3>
                    <p className="text-sm font-bold text-slate-400 leading-relaxed italic">Get 1 Month Free for every 2 friends who join.</p>
                </div>

                <div className="space-y-4 relative z-10">
                    <div className="flex justify-between items-center px-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary italic"> {referrals} / 2 Referred</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{Math.round((referrals / 2) * 100)}%</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden shadow-inner">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(referrals / 2) * 100}%` }}
                            className="h-full bg-primary shadow-[0_0_15px_#4DA6FF]"
                        />
                    </div>
                </div>

                <div className="pt-6 relative z-10">
                    <div className="flex gap-2">
                        <div className="bg-slate-950 px-4 py-3 rounded-base border border-white/5 font-black italic tracking-widest text-primary text-lg flex-1">
                            STUDY_G67H9
                        </div>
                        <button 
                            onClick={handleCopy}
                            className="p-3 bg-primary text-white rounded-base shadow-lg shadow-primary/20 active:scale-95 transition-all"
                        >
                            {copied ? <CheckCircle2 size={24}/> : <Copy size={24}/>}
                        </button>
                    </div>
                </div>
                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-primary blur-[60px] opacity-10 group-hover:opacity-20 transition-opacity" />
            </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Quick Pricing Hooks: NSFAS/Deals */}
            <div className="space-y-6">
                <div className="p-8 bg-emerald-50 border-2 border-emerald-100 rounded-3xl flex items-center gap-8 group hover:border-emerald-500/30 transition-all shadow-sm">
                    <div className="w-14 h-14 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"><TrendingUp size={28}/></div>
                    <div className="space-y-1">
                        <h4 className="text-xl font-black italic tracking-tighter uppercase leading-tight italic">NSFAS Optimization</h4>
                        <p className="text-sm font-bold text-emerald-600/70 max-w-sm">We've aligned your next payment with the standard NSFAS disbursement dates (15th or end-of-month).</p>
                    </div>
                </div>
                 <div className="p-8 bg-orange-50 border-2 border-orange-100 rounded-3xl flex items-center gap-8 group hover:border-orange-500/30 transition-all shadow-sm">
                    <div className="w-14 h-14 bg-orange-500 text-white rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"><Award size={28}/></div>
                    <div className="space-y-1">
                        <h4 className="text-xl font-black italic tracking-tighter uppercase leading-tight italic">SRC Institutional Rate</h4>
                        <p className="text-sm font-bold text-orange-600/70 max-w-sm">Is your residence or SRC registered? Apply a campus code to drop your price to R45/month.</p>
                    </div>
                </div>
            </div>

            {/* History Table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-10 shadow-sm space-y-10">
                <div className="flex justify-between items-center px-1">
                     <div className="flex items-center gap-4">
                        <History size={20} className="text-primary"/>
                        <h2 className="text-xl font-black italic tracking-tighter uppercase leading-tight italic underline decoration-primary decoration-4">Billing History</h2>
                    </div>
                    <button className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2 hover:translate-x-1 transition-transform">Download All <Download size={14}/></button>
                </div>
                
                <div className="space-y-4">
                    {INVOICES.map(inv => (
                        <div key={inv.id} className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800 border rounded-xl hover:bg-white transition-all group cursor-pointer shadow-sm">
                            <div className="flex items-center gap-6">
                                <div className="w-10 h-10 bg-white border rounded-base flex items-center justify-center font-black italic text-[10px] text-slate-400">PDF</div>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest italic">{inv.id}</p>
                                    <p className="text-[10px] font-bold text-slate-400">{inv.date}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-black text-text-primary leading-none mb-1">{inv.amount}</p>
                                <span className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-full text-[8px] font-black uppercase tracking-widest leading-none">Paid Sucessfully</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
      </div>
    </div>
  );
}
