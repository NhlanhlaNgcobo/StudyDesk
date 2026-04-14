"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  PlusCircle, 
  BookOpen, 
  Settings, 
  ChevronLeft,
  Bell,
  Search,
  LogOut,
  User as UserIcon,
  Sun,
  Moon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/tutor/dashboard" },
  { icon: Users, label: "My Groups", href: "/tutor/groups" },
  { icon: PlusCircle, label: "Create Group", href: "/tutor/groups/create" },
  { icon: BookOpen, label: "Materials", href: "/tutor/materials" },
  { icon: Settings, label: "Settings", href: "/tutor/settings" },
];

export default function TutorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { theme, setTheme } = useTheme();

  const activeLabel = NAV_ITEMS.find((item) => pathname.startsWith(item.href))?.label || "Dashboard";

  return (
    <div className="min-h-screen bg-[#F8FAFF] dark:bg-slate-950 flex font-inter selection:bg-emerald-100 selection:text-emerald-700">
      {/* Sidebar - Desktop */}
      <aside 
        className={cn(
          "hidden md:flex flex-col bg-white dark:bg-slate-900 border-r border-[#E5E7EB] dark:border-slate-800 transition-all duration-300 relative z-40 h-screen sticky top-0",
          collapsed ? "w-20" : "w-[240px]"
        )}
      >
        <div className="p-6 flex items-center justify-between">
          <Link href="/tutor/dashboard" className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 bg-emerald-500 rounded-base shrink-0 flex items-center justify-center text-white font-bold text-xl">
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
              className="absolute -right-4 top-8 w-8 h-8 bg-white dark:bg-slate-800 border rounded-full flex items-center justify-center text-slate-400 hover:text-emerald-500 shadow-sm hover:shadow-md transition-all z-50"
          >
            <ChevronLeft size={16} className={cn("transition-transform", collapsed && "rotate-180")} />
          </button>
        </div>

        {/* User Profile Info */}
        <div className={cn("px-6 py-8 flex flex-col items-center gap-4", collapsed ? "items-center" : "items-start")}>
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 font-black flex items-center justify-center rounded-full text-lg border-2 border-white dark:border-slate-800 shadow-sm relative">
                TA
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
            </div>
            {!collapsed && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center gap-2">
                         <p className="font-black text-sm text-text-primary">Tutor Adams</p>
                         <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full text-[8px] font-black uppercase tracking-widest leading-none">Tutor</span>
                    </div>
                    <p className="text-[10px] uppercase tracking-widest font-black text-text-secondary">Official Educator</p>
                </div>
            )}
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link 
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-4 px-4 py-3 rounded-base transition-all group relative",
                  isActive 
                    ? "text-emerald-600 font-bold bg-emerald-50" 
                    : "text-slate-500 hover:text-emerald-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                )}
              >
                {isActive && (
                  <motion.div 
                    layoutId="active-sidebar-tutor"
                    className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-emerald-500 rounded-r-full"
                  />
                )}
                <item.icon size={22} className={cn("shrink-0 transition-colors", isActive ? "text-emerald-600" : "group-hover:text-emerald-500")} />
                {!collapsed && (
                    <span className="animate-in fade-in slide-in-from-left-2 duration-200">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-6 border-t mt-auto">
             {!collapsed ? (
                <button className="w-full py-3 bg-slate-900 dark:bg-slate-800 text-white font-black text-xs uppercase tracking-widest rounded-base flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all">
                    <LogOut size={14} /> Power Down
                </button>
             ) : (
                <button className="w-full flex justify-center text-slate-400 hover:text-emerald-500 transition-colors"><LogOut size={20}/></button>
             )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b sticky top-0 z-30 px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
              <h1 className="text-xl font-extrabold tracking-tight hidden md:block italic decoration-emerald-500 underline decoration-2">{activeLabel}</h1>
              <div className="relative w-64 lg:w-96 hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Search materials, student pods..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-base border-none outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium text-sm"
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
                <span className="absolute top-2 right-2 w-4 h-4 bg-emerald-500 text-[10px] text-white font-black flex items-center justify-center rounded-full">5</span>
            </button>

            <div className="relative">
              <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-10 h-10 rounded-full overflow-hidden border-2 border-emerald-50 hover:border-emerald-500 transition-all flex items-center justify-center bg-emerald-50 text-emerald-600 font-bold text-sm"
              >
                TA
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 md:p-8 lg:p-12 max-w-[1700px] mx-auto w-full pb-32 md:pb-12 h-[calc(100vh-80px)] overflow-y-auto">
            {children}
        </main>
      </div>
    </div>
  );
}
