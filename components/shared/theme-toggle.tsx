"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={cn("w-10 h-10 rounded-base bg-slate-100 dark:bg-slate-800 animate-pulse", className)} />
    );
  }

  return (
    <button
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className={cn(
        "w-10 h-10 rounded-base flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-200 border border-transparent dark:border-slate-800 backdrop-blur-sm",
        className
      )}
      aria-label="Toggle Theme"
    >
      {resolvedTheme === "dark" ? (
        <Sun size={20} className="text-yellow-400" />
      ) : (
        <Moon size={20} className="text-slate-700" />
      )}
    </button>
  );
}
