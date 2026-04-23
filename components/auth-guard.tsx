"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

/**
 * AuthGuard — wraps any page/layout that requires an authenticated user.
 * Redirects to /login if the user is not signed in.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Bypass for demo mode
    if (typeof window !== "undefined" && localStorage.getItem("studydesk_demo_active") === "true") {
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        // Not logged in — redirect to login with a return path
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      }
    });
    return () => unsubscribe();
  }, [router, pathname]);

  return <>{children}</>;
}
