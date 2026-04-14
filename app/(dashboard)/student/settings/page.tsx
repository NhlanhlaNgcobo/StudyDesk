"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  User,
  Bell,
  Shield,
  CreditCard,
  Moon,
  Sun,
  Lock,
  Mail,
  Smartphone,
  Globe,
  ChevronRight,
  Camera,
  Check,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { DEMO_USER } from "@/lib/mock-data";

const TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
  { id: "billing", label: "Billing", icon: CreditCard },
];

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={cn(
        "relative w-12 h-6 rounded-full transition-all duration-300",
        enabled ? "bg-primary" : "bg-slate-200 dark:bg-slate-700"
      )}
    >
      <span
        className={cn(
          "absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300",
          enabled ? "left-7" : "left-1"
        )}
      />
    </button>
  );
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("profile");
  const [saved, setSaved] = useState(false);
  const [notifications, setNotifications] = useState({
    quizReady: true,
    streakReminder: true,
    groupMessages: false,
    emailDigest: true,
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight italic underline decoration-primary decoration-4">
          Settings
        </h1>
        <p className="text-text-secondary font-bold mt-2">
          Manage your account preferences and configurations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Tabs */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-sm p-4 space-y-1 h-max">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-4 px-4 py-3 rounded-base text-left font-bold transition-all group relative",
                activeTab === tab.id
                  ? "text-primary bg-primary/5"
                  : "text-slate-600 dark:text-slate-400 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800"
              )}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="settings-active"
                  className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-primary rounded-r-full"
                />
              )}
              <tab.icon size={20} className={cn(activeTab === tab.id ? "text-primary" : "group-hover:text-primary")} />
              <span>{tab.label}</span>
              {tab.id === "billing" && (
                <span className="ml-auto text-[9px] font-bold uppercase tracking-widest bg-primary text-white px-2 py-0.5 rounded-full">
                  Premium
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content Panel */}
        <div className="lg:col-span-3 space-y-6">
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-sm p-8 space-y-8">
                <h2 className="text-xl font-bold tracking-tight">Personal Information</h2>

                {/* Avatar */}
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 text-primary font-bold text-2xl flex items-center justify-center rounded-full border-4 border-white dark:border-slate-800 shadow-md">
                      {DEMO_USER.initials}
                    </div>
                    <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                      <Camera size={13} />
                    </button>
                  </div>
                  <div>
                    <p className="font-bold text-lg">{DEMO_USER.name}</p>
                    <p className="text-xs font-bold uppercase tracking-widest text-text-secondary">{DEMO_USER.tier}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { label: "Full Name", value: DEMO_USER.name, icon: User },
                    { label: "Email Address", value: DEMO_USER.email, icon: Mail },
                    { label: "Phone Number", value: "+27 71 000 0000", icon: Smartphone },
                    { label: "Language", value: "English (ZA)", icon: Globe },
                  ].map((f) => (
                    <div key={f.label} className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-[0.15em] text-slate-600 dark:text-slate-400 px-1">{f.label}</label>
                      <div className="relative">
                        <f.icon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                          defaultValue={f.value}
                          className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary rounded-base outline-none font-medium transition-all"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Appearance */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-sm p-8 space-y-6">
                <h2 className="text-xl font-bold tracking-tight">Appearance</h2>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {theme === "dark" ? <Moon size={20} className="text-primary" /> : <Sun size={20} className="text-primary" />}
                    <div>
                      <p className="font-bold">Dark Mode</p>
                      <p className="text-xs text-slate-500 font-bold">Switch between light and dark themes</p>
                    </div>
                  </div>
                  <Toggle enabled={theme === "dark"} onChange={() => setTheme(theme === "dark" ? "light" : "dark")} />
                </div>
              </div>

              <button
                onClick={handleSave}
                className={cn(
                  "w-full py-4 font-bold rounded-base flex items-center justify-center gap-2 transition-all active:scale-95",
                  saved ? "bg-emerald-500 text-white" : "bg-primary text-white hover:shadow-xl hover:shadow-primary/30"
                )}
              >
                {saved ? <><Check size={18} /> Saved!</> : "Save Changes"}
              </button>
            </motion.div>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-sm p-8 space-y-8"
            >
              <h2 className="text-xl font-bold tracking-tight">Notification Preferences</h2>
              <div className="space-y-6">
                {[
                  { key: "quizReady", label: "Quiz Ready", desc: "Notify me when an AI quiz is generated." },
                  { key: "streakReminder", label: "Streak Reminder", desc: "Daily reminder to maintain my study streak." },
                  { key: "groupMessages", label: "Group Messages", desc: "Alerts for new messages in Study Pods." },
                  { key: "emailDigest", label: "Weekly Email Digest", desc: "Summary of weekly study activity sent to email." },
                ].map((n) => (
                  <div key={n.key} className="flex items-center justify-between py-4 border-b border-slate-50 dark:border-slate-800 last:border-0">
                    <div>
                      <p className="font-bold">{n.label}</p>
                      <p className="text-xs text-text-secondary font-medium">{n.desc}</p>
                    </div>
                    <Toggle
                      enabled={notifications[n.key as keyof typeof notifications]}
                      onChange={() => setNotifications((prev) => ({ ...prev, [n.key]: !prev[n.key as keyof typeof notifications] }))}
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-sm p-8 space-y-8"
            >
              <h2 className="text-xl font-bold tracking-tight">Security Settings</h2>
              <div className="space-y-6">
                {[
                  { label: "Current Password", placeholder: "••••••••" },
                  { label: "New Password", placeholder: "••••••••" },
                  { label: "Confirm New Password", placeholder: "••••••••" },
                ].map((f) => (
                  <div key={f.label} className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-[0.15em] text-slate-600 dark:text-slate-400 px-1">{f.label}</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        type="password"
                        placeholder={f.placeholder}
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary rounded-base outline-none font-medium transition-all"
                      />
                    </div>
                  </div>
                ))}
                <button onClick={handleSave} className="w-full py-4 bg-primary text-white font-bold rounded-base hover:shadow-xl hover:shadow-primary/30 active:scale-95 transition-all">
                  Update Password
                </button>
              </div>
            </motion.div>
          )}

          {/* Billing Tab */}
          {activeTab === "billing" && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="bg-slate-900 text-white rounded-xl p-8 shadow-xl border-t-4 border-primary relative overflow-hidden">
                <div className="relative z-10 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Current Plan</p>
                      <h3 className="text-3xl font-bold text-primary italic">Premium Student</h3>
                    </div>
                    <CreditCard size={40} className="text-primary opacity-60" />
                  </div>
                  <p className="text-slate-400 font-medium">Next billing date: <span className="text-white font-bold">1 May 2026</span></p>
                  <div className="flex items-center gap-3">
                    <span className="text-4xl font-bold">R149</span>
                    <span className="text-slate-400">/month</span>
                  </div>
                </div>
                <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-primary blur-[80px] opacity-20" />
              </div>

              <Link
                href="/student/settings/billing"
                className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-sm p-6 hover:border-primary/30 hover:shadow-lg transition-all group"
              >
                <div className="flex items-center gap-4">
                  <CreditCard size={22} className="text-primary" />
                  <div>
                    <p className="font-bold">Manage Billing & Invoices</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">View payment history and plan details</p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-slate-400 group-hover:text-primary transition-colors" />
              </Link>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
