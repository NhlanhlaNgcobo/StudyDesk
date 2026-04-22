"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Scale, Shield, Eye, Lock, FileText, AlertTriangle } from "lucide-react";

const Section = ({ id, title, icon: Icon, children }: { id: string; title: string; icon: any; children: React.ReactNode }) => (
  <motion.section
    id={id}
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5 }}
    className="space-y-6"
  >
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
        <Icon size={20} />
      </div>
      <h2 className="text-2xl font-black uppercase tracking-tight">{title}</h2>
    </div>
    <div className="bg-white border border-slate-100 rounded-2xl p-8 text-slate-600 space-y-4 shadow-sm">
      {children}
    </div>
  </motion.section>
);

const P = ({ children }: { children: React.ReactNode }) => (
  <p className="leading-relaxed font-medium">{children}</p>
);

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFF]">
      {/* Nav */}
      <nav className="h-20 px-10 flex items-center justify-between bg-white border-b sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center text-white font-bold">S</div>
          <span className="font-extrabold text-xl tracking-tight">StudyDesk</span>
        </Link>
        <div className="flex gap-6 text-sm font-black uppercase tracking-widest">
          <Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
          <Link href="/popia" className="hover:text-primary transition-colors">POPIA</Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-20 space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/5 text-primary rounded-full text-xs font-black uppercase tracking-widest border border-primary/20">
            <Scale size={14} /> Legal Document
          </div>
          <h1 className="text-5xl font-black uppercase tracking-tight">Terms of Service</h1>
          <p className="text-slate-500 font-bold">Last updated: April 2026 · StudyDesk (Pty) Ltd</p>
        </div>

        <Section id="acceptance" title="1. Acceptance of Terms" icon={FileText}>
          <P>By accessing or using StudyDesk ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree, you must not use the Platform.</P>
          <P>StudyDesk is operated by StudyDesk (Pty) Ltd, a company registered in the Republic of South Africa. These terms constitute a legally binding agreement between you and StudyDesk.</P>
        </Section>

        <Section id="services" title="2. Services" icon={Eye}>
          <P>StudyDesk provides AI-powered academic tools including, but not limited to: automated note generation, quiz and exam creation, a spaced-repetition flashcard system, an AI Tutor chat interface, and collaborative Tutor Groups.</P>
          <P>Access to certain features is gated by your active subscription tier. Free-tier users may access limited functionality as described on our Pricing page.</P>
        </Section>

        <Section id="accounts" title="3. User Accounts" icon={Shield}>
          <P>You must be at least 13 years of age to create an account. By registering, you confirm that all information provided is accurate and up to date.</P>
          <P>You are responsible for maintaining the security of your account credentials. StudyDesk will not be liable for any loss arising from unauthorized access to your account where you failed to keep credentials secure.</P>
          <P>Student verification (via .ac.za email) may be required to access discounted institutional pricing.</P>
        </Section>

        <Section id="content" title="4. User Content & AI Output" icon={AlertTriangle}>
          <P>You retain ownership of any content you upload to the Platform (notes, PDFs, study materials). You grant StudyDesk a limited, non-exclusive license to process this content solely to deliver the services to you.</P>
          <P>AI-generated content (notes, quizzes, exam materials) is provided for educational assistance only. StudyDesk does not guarantee the accuracy of AI outputs. You are responsible for verifying all academic information before use in assessments.</P>
          <P>You must not upload content that infringes copyright, contains illegal material, or violates the rights of third parties.</P>
        </Section>

        <Section id="payments" title="5. Payments & Refunds" icon={Lock}>
          <P>Subscription fees are billed in South African Rand (ZAR) on a monthly or annual basis depending on your selected plan. All prices are inclusive of applicable VAT.</P>
          <P>Payments are processed securely via PayFast, Paystack, Yoco, or PayShap. StudyDesk does not store your card or banking details.</P>
          <P>Refunds are considered on a case-by-case basis within 7 days of initial purchase. Subscription cancellations take effect at the end of the current billing period.</P>
        </Section>

        <Section id="termination" title="6. Termination" icon={AlertTriangle}>
          <P>StudyDesk reserves the right to suspend or terminate accounts that violate these Terms, engage in academic dishonesty, misuse AI tools, or engage in fraudulent activity.</P>
          <P>Upon termination, your access to premium features will be revoked immediately. You may request an export of your data within 30 days of termination.</P>
        </Section>

        <Section id="liability" title="7. Limitation of Liability" icon={Scale}>
          <P>To the maximum extent permitted by South African law, StudyDesk shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Platform.</P>
          <P>Our total liability to you for any claim shall not exceed the total subscription fees you paid in the 3 months preceding the event giving rise to the claim.</P>
        </Section>

        <Section id="governing-law" title="8. Governing Law" icon={Scale}>
          <P>These Terms are governed by the laws of the Republic of South Africa. Any disputes shall be resolved in the courts of South Africa, with jurisdiction vested in the Gauteng High Court.</P>
        </Section>

        <div className="flex justify-center gap-6 pt-8">
          <Link href="/privacy" className="px-6 py-3 bg-white border-2 border-slate-100 rounded-xl font-black uppercase tracking-widest text-xs text-slate-600 hover:border-primary hover:text-primary transition-all">Privacy Policy</Link>
          <Link href="/popia" className="px-6 py-3 bg-white border-2 border-slate-100 rounded-xl font-black uppercase tracking-widest text-xs text-slate-600 hover:border-primary hover:text-primary transition-all">POPIA Compliance</Link>
        </div>
      </div>
    </div>
  );
}
