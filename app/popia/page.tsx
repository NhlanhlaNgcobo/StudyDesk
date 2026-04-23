"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShieldCheck, UserCheck, Bell, Database, FileText, Lock, Phone } from "lucide-react";

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
      <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
        <Icon size={20} />
      </div>
      <h2 className="text-2xl font-black uppercase tracking-tight">{title}</h2>
    </div>
    <div className="bg-white border border-slate-100 rounded-2xl p-8 text-slate-600 space-y-4 shadow-sm">
      {children}
    </div>
  </motion.section>
);

const P = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <p className={`leading-relaxed font-medium ${className || ""}`}>{children}</p>
);

const CheckItem = ({ children }: { children: React.ReactNode }) => (
  <li className="flex items-start gap-3">
    <div className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center shrink-0 mt-0.5">
      <ShieldCheck size={11} />
    </div>
    <span className="font-medium text-slate-700">{children}</span>
  </li>
);

export default function PopiaPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFF]">
      <nav className="h-20 px-10 flex items-center justify-between bg-white border-b sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center text-white font-bold">S</div>
          <span className="font-extrabold text-xl tracking-tight">StudyDesk</span>
        </Link>
        <div className="flex gap-6 text-sm font-black uppercase tracking-widest">
          <Link href="/terms" className="hover:text-primary transition-colors">Terms</Link>
          <Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-20 space-y-12">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-xs font-black uppercase tracking-widest border border-blue-200">
            <ShieldCheck size={14} /> POPIA Compliance
          </div>
          <h1 className="text-5xl font-black uppercase tracking-tight">POPIA Notice</h1>
          <p className="text-slate-500 font-bold">Protection of Personal Information Act 4 of 2013 · South Africa</p>
        </div>

        {/* What is POPIA */}
        <Section id="what" title="What is POPIA?" icon={FileText}>
          <P>The Protection of Personal Information Act (POPIA) is South Africa's primary data privacy legislation, enacted under Act 4 of 2013 and fully effective from 1 July 2021. POPIA governs how organisations collect, store, use, and share personal information of data subjects (individuals).</P>
          <P>StudyDesk is a Responsible Party under POPIA, meaning we determine the purpose and means of processing personal information collected through our platform.</P>
        </Section>

        {/* Lawful Basis */}
        <Section id="basis" title="Lawful Basis for Processing" icon={ShieldCheck}>
          <P>We process personal information on the following lawful bases as defined by POPIA Section 11:</P>
          <ul className="space-y-3 mt-2">
            <CheckItem><strong>Contract:</strong> Processing necessary to deliver the StudyDesk subscription service you signed up for.</CheckItem>
            <CheckItem><strong>Consent:</strong> For optional features such as marketing communications and analytics.</CheckItem>
            <CheckItem><strong>Legitimate Interest:</strong> To detect fraud, improve platform security, and conduct analytics to improve the service.</CheckItem>
            <CheckItem><strong>Legal Obligation:</strong> Compliance with South African tax (SARS) and financial record-keeping laws.</CheckItem>
          </ul>
        </Section>

        {/* Data Subject Rights */}
        <Section id="rights" title="Your Rights as a Data Subject" icon={UserCheck}>
          <P>Under POPIA Sections 23–25, you have the following rights:</P>
          <ul className="space-y-3 mt-2">
            <CheckItem><strong>Right of Access:</strong> Request a copy of all personal information we hold about you.</CheckItem>
            <CheckItem><strong>Right to Correction:</strong> Request that inaccurate, misleading, or outdated information be corrected.</CheckItem>
            <CheckItem><strong>Right to Deletion:</strong> Request deletion of your personal information where processing is no longer justified.</CheckItem>
            <CheckItem><strong>Right to Object:</strong> Object to the processing of your personal information for direct marketing or where we rely on legitimate interests.</CheckItem>
            <CheckItem><strong>Right to Complaint:</strong> Lodge a complaint with the Information Regulator of South Africa.</CheckItem>
          </ul>
          <P className="mt-4">To exercise your rights, email: <a href="mailto:privacy@studydesk.co.za" className="text-blue-600 underline font-black">privacy@studydesk.co.za</a>. We will respond within 30 days as required by POPIA.</P>
        </Section>

        {/* Information Officer */}
        <Section id="officer" title="Information Officer" icon={Lock}>
          <P>StudyDesk has appointed an Information Officer as required by POPIA Section 55. Our Information Officer is responsible for ensuring compliance with this Act across all processing activities.</P>
          <P><strong>Information Officer Contact:</strong></P>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 space-y-2">
            <p className="font-black text-blue-800">StudyDesk (Pty) Ltd</p>
            <p className="font-bold text-blue-700">Johannesburg, Gauteng, South Africa</p>
            <p className="font-bold text-blue-700">Email: <a href="mailto:io@studydesk.co.za" className="underline">io@studydesk.co.za</a></p>
          </div>
        </Section>

        {/* Cross-border Transfers */}
        <Section id="transfers" title="Cross-Border Data Transfers" icon={Database}>
          <P>StudyDesk uses services from providers based outside South Africa, including Google Firebase (USA), Anthropic (USA), and our payment processors. All cross-border transfers are subject to POPIA Section 72 requirements, including ensuring the recipient country provides adequate protection, or binding data processing agreements are in place.</P>
          <P>Your study content processed by Anthropic's AI models is governed by Anthropic's data processing addendum and is not retained for model training without explicit consent.</P>
        </Section>

        {/* Complaints */}
        <Section id="complaints" title="Filing a Complaint" icon={Bell}>
          <P>If you believe StudyDesk has violated your POPIA rights, you may lodge a complaint with the Information Regulator of South Africa:</P>
          <div className="bg-slate-100 rounded-xl p-6 space-y-2 font-bold text-slate-700">
            <p>Information Regulator (South Africa)</p>
            <p>JD House, 27 Stiemens Street, Braamfontein, Johannesburg</p>
            <p>Email: <a href="mailto:inforeg@justice.gov.za" className="text-primary underline">inforeg@justice.gov.za</a></p>
            <p>Telephone: 010 023 5207</p>
          </div>
        </Section>

        <div className="flex justify-center gap-6 pt-8">
          <Link href="/terms" className="px-6 py-3 bg-white border-2 border-slate-100 rounded-xl font-black uppercase tracking-widest text-xs text-slate-600 hover:border-primary hover:text-primary transition-all">Terms of Service</Link>
          <Link href="/privacy" className="px-6 py-3 bg-white border-2 border-slate-100 rounded-xl font-black uppercase tracking-widest text-xs text-slate-600 hover:border-primary hover:text-primary transition-all">Privacy Policy</Link>
        </div>
      </div>
    </div>
  );
}
