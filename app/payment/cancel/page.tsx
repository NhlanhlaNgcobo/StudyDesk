"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { XCircle, ArrowLeft, RefreshCw, Home } from "lucide-react";

function PaymentCancelContent() {
  const params = useSearchParams();
  const reason = params.get("reason");

  return (
    <div className="min-h-screen bg-[#F8FAFF] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 p-12 space-y-8 text-center"
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="mx-auto w-24 h-24 bg-red-50 rounded-full flex items-center justify-center"
        >
          <XCircle className="text-red-500" size={48} />
        </motion.div>

        <div className="space-y-3">
          <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase italic">
            {reason === "failed" ? "Payment Failed" : "Payment Cancelled"}
          </h1>
          <p className="text-slate-600 font-bold text-lg">
            {reason === "failed"
              ? "Something went wrong with your payment. Please try again."
              : "You cancelled the payment. No charges were made."}
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-100 rounded-xl p-6 text-left space-y-2">
          <p className="text-xs font-black uppercase tracking-widest text-amber-600">
            Need help?
          </p>
          <p className="text-sm font-bold text-slate-700 leading-relaxed">
            If you experienced issues with your payment, try a different payment method or contact
            our support at{" "}
            <a href="mailto:support@studydesk.co.za" className="text-primary underline">
              support@studydesk.co.za
            </a>
            .
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <Link
            href="/pricing"
            className="w-full py-4 bg-primary text-white font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-primary/30 active:scale-95 transition-all"
          >
            <RefreshCw size={18} /> Try Again
          </Link>
          <Link
            href="/student/dashboard"
            className="w-full py-4 bg-slate-100 text-slate-700 font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 hover:bg-slate-200 transition-all"
          >
            <ArrowLeft size={18} /> Back to Dashboard
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

export default function PaymentCancelPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <PaymentCancelContent />
    </Suspense>
  );
}
