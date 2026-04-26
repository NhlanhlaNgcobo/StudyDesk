"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Shield, Lock, Eye, Database, UserCheck, Bell, Mail } from "lucide-react";

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
      <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
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

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFF]">
      <nav className="h-20 px-10 flex items-center justify-between bg-white border-b sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center text-white font-bold">S</div>
          <span className="font-extrabold text-xl tracking-tight">StudyDesk</span>
        </Link>
        <div className="flex gap-6 text-sm font-black uppercase tracking-widest">
          <Link href="/terms" className="hover:text-primary transition-colors">Terms</Link>
          <Link href="/popia" className="hover:text-primary transition-colors">POPIA</Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-20 space-y-12">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-xs font-black uppercase tracking-widest border border-emerald-200">
            <Shield size={14} /> Privacy Policy
          </div>
          <h1 className="text-5xl font-black uppercase tracking-tight">Your Privacy Matters</h1>
          <p className="text-slate-500 font-bold">Last updated: April 2026 · StudyDesk (Pty) Ltd</p>
        </div>

        <Section id="overview" title="1. Overview" icon={Shield}>
          <P>StudyDesk is committed to protecting the privacy and personal information of our users. This Privacy Policy explains what data we collect, why we collect it, how it is used, and your rights as a data subject under South African law.</P>
          <P>This policy applies to all users of the StudyDesk platform, including students and tutors.</P>
        </Section>

        <Section id="data-collected" title="2. Information We Collect" icon={Database}>
          <P><strong>Account Information:</strong> Name, email address, university affiliation, and profile photo when you register.</P>
          <P><strong>Study Content:</strong> Files and documents you upload, AI-generated notes, quiz results, and module data. This data is used solely to deliver the service to you.</P>
          <P><strong>Usage Data:</strong> Session duration, pages visited, features used, and interaction logs to improve the platform.</P>
          <P><strong>Payment Information:</strong> We do not store your payment card or bank details. These are handled securely by our payment processors (PayFast, Paystack, Yoco, PayShap).</P>
          <P><strong>Device & Technical Data:</strong> IP address, browser type, device identifiers, and operating system for security and analytics purposes.</P>
        </Section>

        <Section id="use" title="3. How We Use Your Data" icon={Eye}>
          <P>We use your information to: deliver and improve the StudyDesk platform; personalise AI-tutor responses and study recommendations; process subscription payments; send important service notifications; detect and prevent fraud or abuse; and comply with applicable law.</P>
          <P>We do not sell, rent, or trade your personal information to third parties for marketing purposes.</P>
        </Section>

        <Section id="sharing" title="4. Data Sharing" icon={Lock}>
          <P>We may share your data with: Anthropic (for AI processing), Firebase (authentication, storage), and our payment processors — strictly for the purpose of delivering the service.</P>
          <P>All third-party processors are bound by data processing agreements and are required to implement appropriate security measures.</P>
          <P>We may disclose data if required to do so by law or a valid court order.</P>
        </Section>

        <Section id="retention" title="5. Data Retention" icon={Database}>
          <P>We retain your personal data for as long as your account is active. Upon account deletion, your personal data is removed within 30 days, except where we are legally required to retain it.</P>
          <P>AI-generated content and study materials are stored for the duration of your subscription and deleted 90 days after account closure.</P>
        </Section>

        <Section id="rights" title="6. Your Rights" icon={UserCheck}>
          <P>Under South Africa's POPIA (Protection of Personal Information Act), you have the right to: access your personal information; correct inaccurate data; object to processing; request deletion; and lodge a complaint with the Information Regulator.</P>
          <P>To exercise any of these rights, contact us at <a href="mailto:privacy@studydesk.co.za" className="text-emerald-600 underline font-black">privacy@studydesk.co.za</a>.</P>
        </Section>

        <Section id="security" title="7. Security" icon={Lock}>
          <P>We implement industry-standard security measures including TLS encryption in transit, AES-256 data at rest, and role-based access controls. Our infrastructure is hosted on Google Cloud (Firebase) with SOC2-compliant data centres.</P>
          <P>Despite our efforts, no system is 100% secure. If you believe your account has been compromised, please contact us immediately.</P>
        </Section>

        <Section id="contact" title="8. Contact Us" icon={Mail}>
          <P>For privacy-related queries: <a href="mailto:privacy@studydesk.co.za" className="text-emerald-600 underline font-black">privacy@studydesk.co.za</a></P>
          <P>Information Officer: StudyDesk (Pty) Ltd, Johannesburg, Gauteng, South Africa.</P>
        </Section>

        <div className="flex justify-center gap-6 pt-8">
          <Link href="/terms" className="px-6 py-3 bg-white border-2 border-slate-100 rounded-xl font-black uppercase tracking-widest text-xs text-slate-600 hover:border-primary hover:text-primary transition-all">Terms of Service</Link>
          <Link href="/popia" className="px-6 py-3 bg-white border-2 border-slate-100 rounded-xl font-black uppercase tracking-widest text-xs text-slate-600 hover:border-primary hover:text-primary transition-all">POPIA Compliance</Link>
        </div>
      </div>
    </div>
  );
}
