"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Bell, BookOpen, LayoutDashboard, LogOut, Moon, Search, Settings, Sun, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { AuthGuard } from "@/components/auth-guard";
import { useAuth } from "@/components/auth-provider";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/tutor/dashboard" },
  { icon: Users, label: "Groups", href: "/tutor/groups" },
  { icon: BookOpen, label: "Materials", href: "/tutor/materials" },
  { icon: Settings, label: "Settings", href: "/tutor/settings" },
];

export default function TutorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const { profile, logout } = useAuth();
  const [search, setSearch] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const initials = profile?.displayName
    ? profile.displayName
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "TA";

  const activeLabel = NAV_ITEMS.find((item) => pathname.startsWith(item.href))?.label || "Tutor";

  return (
    <AuthGuard>
      <div className="min-h-screen bg-app text-app">
        <div className="mx-auto grid min-h-screen max-w-[1600px] gap-0 xl:grid-cols-[260px_1fr]">
          <aside className="border-r border-app bg-app-surface p-6 shadow-sm">
            <Link href="/tutor/dashboard" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-base bg-emerald-500 text-lg font-black text-white shadow-lg shadow-emerald-500/20">
                S
              </div>
              <div>
                <p className="text-xl font-black tracking-tight">StudyDesk</p>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-text-secondary">
                  Tutor workspace
                </p>
              </div>
            </Link>

            <div className="mt-8 rounded-[24px] bg-app-muted p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 font-black text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                  {initials}
                </div>
                <div>
                  <p className="font-black">{profile?.displayName || "Tutor Adams"}</p>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-text-secondary">
                    {profile?.tier || "Tutor Pro"}
                  </p>
                </div>
              </div>
            </div>

            <nav className="mt-8 space-y-2">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-[18px] px-4 py-3 text-sm font-black transition",
                      isActive
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300"
                        : "text-text-secondary hover:bg-app-muted hover:text-primary"
                    )}
                  >
                    <Icon size={18} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <button
              onClick={logout}
              className="mt-8 inline-flex w-full items-center justify-center gap-3 rounded-full bg-slate-900 px-5 py-4 text-xs font-black uppercase tracking-[0.18em] text-white transition hover:bg-emerald-600"
            >
              <LogOut size={14} />
              Logout
            </button>
          </aside>

          <div className="flex min-w-0 flex-col">
            <header className="sticky top-0 z-30 border-b border-app bg-app/80 px-6 py-5 backdrop-blur-xl">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary">Tutor console</p>
                  <h1 className="text-2xl font-black tracking-tight">{activeLabel}</h1>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative min-w-[240px] flex-1 lg:flex-none">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search groups, materials, or students"
                      className="w-full rounded-full border-2 border-transparent bg-app-surface py-3 pl-12 pr-4 font-semibold outline-none transition focus:border-primary"
                    />
                  </div>
                  <button
                    onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-app bg-app-surface"
                  >
                    {!mounted ? (
                      <div className="h-4 w-4 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
                    ) : resolvedTheme === "dark" ? (
                      <Sun size={18} />
                    ) : (
                      <Moon size={18} />
                    )}
                  </button>
                  <button className="relative flex h-11 w-11 items-center justify-center rounded-full border border-app bg-app-surface">
                    <Bell size={18} />
                    <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  </button>
                </div>
              </div>
            </header>

            <main className="flex-1 px-6 py-8 lg:px-8">{children}</main>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
