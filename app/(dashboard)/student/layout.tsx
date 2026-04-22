"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  BookOpen, 
  FileText, 
  Brain, 
  Clock, 
  MessageSquare, 
  Calendar, 
  BarChart2, 
  Settings, 
  Menu, 
  Bell, 
  Search, 
  LogOut, 
  User as UserIcon, 
  ChevronLeft,
  Sun,
  Moon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { AITutorChat } from "@/components/shared/ai-tutor-chat";
import { PomodoroTimer } from "@/components/shared/pomodoro-timer";
import { useAuth } from "@/components/auth-provider";
import { AuthGuard } from "@/components/auth-guard";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/student/dashboard" },
  { icon: BookOpen, label: "Modules", href: "/student/modules" },
  { icon: FileText, label: "Notes", href: "/student/notes" },
  { icon: Brain, label: "Quiz", href: "/student/quiz" },
  { icon: Clock, label: "Exams", href: "/student/exams" },
  { icon: MessageSquare, label: "AI Tutor", href: "/student/ai-tutor" },
  { icon: MessageSquare, label: "Groups", href: "/student/groups" },
  { icon: Calendar, label: "Planner", href: "/student/planner" },
  { icon: BarChart2, label: "Analytics", href: "/student/analytics" },
  { icon: Settings, label: "Settings", href: "/student/settings" },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { theme, setTheme } = useTheme();
  const { profile, logout } = useAuth();

  const initials = profile?.displayName
    ? profile.displayName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";
  const displayName = profile?.displayName || profile?.email || "Student";

  const activeLabel = NAV_ITEMS.find((item) => pathname.startsWith(item.href))?.label || "Dashboard";
  const isImmersive = pathname.includes("/exams/") || pathname.includes("/quiz/");

  if (isImmersive) {
    return <AuthGuard><div className="min-h-screen bg-[#F8FAFF]">{children}</div></AuthGuard>;
  }

  return (
    <AuthGuard>
    <div className="min-h-screen bg-[#F8FAFF] dark:bg-slate-950 flex">
      {/* Sidebar - Desktop */}
      <aside 
        className={cn(
          "hidden md:flex flex-col bg-white dark:bg-slate-900 border-r border-[#E5E7EB] dark:border-slate-800 transition-all duration-300 relative z-40 h-screen sticky top-0",
          collapsed ? "w-20" : "w-[240px]"
        )}
      >
        <div className="p-6 flex items-center justify-between">
          <Link href="/student/dashboard" className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 bg-primary rounded-base shrink-0 flex items-center justify-center text-white font-bold text-xl">
              S
            </div>
            {!collapsed && (
              <span className="font-extrabold text-xl tracking-tight animate-in fade-in slide-in-from-left-4 duration-300">
                StudyDesk
              </span>
            )}
          </Link>
          <button 
              onClick={() => setCollapsed(!collapsed)}
              className="absolute -right-4 top-8 w-8 h-8 bg-white dark:bg-slate-800 border rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-primary shadow-sm hover:shadow-md transition-all z-50"
          >
            <ChevronLeft size={16} className={cn("transition-transform", collapsed && "rotate-180")} />
          </button>
        </div>

        {/* User Profile Info */}
        <div className={cn("px-6 py-8 flex flex-col items-center gap-4", collapsed ? "items-center" : "items-start")}>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-primary font-black flex items-center justify-center rounded-full text-lg border-2 border-white dark:border-slate-800 shadow-sm">
                {initials}
            </div>
            {!collapsed && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <p className="font-black text-sm text-text-primary">{displayName}</p>
                    <p className="text-[10px] uppercase tracking-widest font-black text-text-secondary">{profile?.role === "tutor" ? "Tutor" : "Student"}</p>
                </div>
            )}
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link 
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-4 px-4 py-3 rounded-base transition-all group relative",
                  isActive 
                    ? "text-primary font-bold bg-primary/5" 
                    : "text-slate-600 dark:text-slate-300 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800 font-medium"
                )}
              >
                {isActive && (
                  <motion.div 
                    layoutId="active-sidebar"
                    className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-primary rounded-r-full"
                  />
                )}
                <item.icon size={22} className={cn("shrink-0 transition-colors", isActive ? "text-primary" : "group-hover:text-primary")} />
                {!collapsed && (
                    <span className="animate-in fade-in slide-in-from-left-2 duration-200">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b sticky top-0 z-30 px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
              <h1 className="text-xl font-extrabold tracking-tight hidden md:block">{activeLabel}</h1>
              <div className="relative w-64 lg:w-96 hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Search your notes, quizzes..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-base border-none outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm"
                />
              </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="w-10 h-10 rounded-base flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
                {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <button className="relative w-10 h-10 rounded-base flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <Bell size={20} />
                <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 text-[10px] text-white font-black flex items-center justify-center rounded-full">3</span>
            </button>

            <div className="relative">
              <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-10 h-10 rounded-full overflow-hidden border-2 border-slate-100 hover:border-primary transition-all flex items-center justify-center bg-blue-50 text-primary font-bold text-sm"
              >
                {initials}
              </button>
              
              <AnimatePresence>
                {showProfileMenu && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border p-2 z-50 overflow-hidden"
                  >
                    {[
                      { icon: UserIcon, label: "Profile", href: "/student/settings", action: undefined },
                      { icon: Settings, label: "Settings", href: "/student/settings", action: undefined },
                    ].map((item) => (
                      <Link 
                        key={item.label}
                        href={item.href}
                        onClick={() => setShowProfileMenu(false)}
                        className={cn(
                            "flex items-center gap-3 px-4 py-3 rounded-base hover:bg-slate-50 dark:hover:bg-slate-800 font-bold transition-colors"
                        )}
                      >
                        <item.icon size={18} />
                        <span>{item.label}</span>
                      </Link>
                    ))}
                    <button
                      onClick={() => { setShowProfileMenu(false); logout(); }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-base hover:bg-red-50 font-bold transition-colors text-red-500"
                    >
                      <LogOut size={18} />
                      <span>Logout</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 md:p-8 lg:p-12 max-w-[1600px] mx-auto w-full pb-32 md:pb-12">
            {children}
        </main>

        <AITutorChat />
        <PomodoroTimer />

        {/* Mobile Bottom Bar */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-white dark:bg-slate-900 border-t flex items-center justify-around px-2 z-50 pb-safe">
            {[NAV_ITEMS[0], NAV_ITEMS[1], NAV_ITEMS[2], NAV_ITEMS[3], NAV_ITEMS[8]].map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                    <Link 
                        key={item.href} 
                        href={item.href} 
                        className={cn("flex flex-col items-center gap-1", isActive ? "text-primary" : "text-slate-600 dark:text-slate-400")}
                    >
                        <item.icon size={24} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                    </Link>
                );
            })}
        </nav>
      </div>
    </div>
    </AuthGuard>
  );
}
