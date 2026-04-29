"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { demoRoute, persistDemoSession, readDemoSession } from "@/lib/demo-session";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const params =
      typeof window === "undefined"
        ? new URLSearchParams()
        : new URLSearchParams(window.location.search);

    const isDemoEntry = params.get("demo") === "1";
    const role = params.get("role") === "tutor" ? "tutor" : "student";

    if (isDemoEntry) {
      persistDemoSession(role);
      return;
    }

    if (readDemoSession()) {
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        const fallback = pathname.startsWith("/tutor")
          ? demoRoute("tutor")
          : demoRoute("student");

        router.replace(
          `/login?redirect=${encodeURIComponent(pathname)}&demoRedirect=${encodeURIComponent(fallback)}`
        );
      }
    });

    return () => unsubscribe();
  }, [pathname, router]);

  return <>{children}</>;
}
