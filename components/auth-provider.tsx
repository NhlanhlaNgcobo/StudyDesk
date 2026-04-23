"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";

interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  role?: "student" | "tutor";
  university?: string;
  degree?: string;
  onboardingComplete?: boolean;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isDemo: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isDemo: false,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // 1. Check for demo mode first (bypass Firebase for accessibility)
    const demoActive = typeof window !== "undefined" && localStorage.getItem("studydesk_demo_active") === "true";
    if (demoActive) {
      setIsDemo(true);
      setProfile({
        uid: "demo-user-123",
        email: "demo@studydesk.ac.za",
        displayName: "Demo Student",
        role: "student",
        tier: "Premium Student",
        onboardingComplete: true
      } as any);
      // Create a minimal mock user that looks like a Firebase User
      setUser({
        uid: "demo-user-123",
        email: "demo@studydesk.ac.za",
        displayName: "Demo Student",
        emailVerified: true,
        isAnonymous: true
      } as any);
      setLoading(false);
      return; 
    }

    // 2. Fallback to real Firebase Auth
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Load extended profile from Firestore
        try {
          const docRef = doc(db, "users", firebaseUser.uid);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            setProfile({ uid: firebaseUser.uid, email: firebaseUser.email, displayName: firebaseUser.displayName, ...snap.data() } as UserProfile);
          } else {
            setProfile({ uid: firebaseUser.uid, email: firebaseUser.email, displayName: firebaseUser.displayName });
          }
        } catch {
          setProfile({ uid: firebaseUser.uid, email: firebaseUser.email, displayName: firebaseUser.displayName });
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const logout = async () => {
    if (isDemo) {
      localStorage.removeItem("studydesk_demo_active");
      setIsDemo(false);
      setUser(null);
      setProfile(null);
    } else {
      await signOut(auth);
    }
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, isDemo, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
