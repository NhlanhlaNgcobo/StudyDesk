"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import type { AppRole } from "@/lib/app-config";
import { clearDemoSession, DemoSession, readDemoSession } from "@/lib/demo-session";

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  role?: AppRole;
  university?: string;
  degree?: string;
  onboardingComplete?: boolean;
  tier?: string;
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

function createDemoUser(session: DemoSession): User {
  return {
    uid: `demo-${session.role}-user`,
    email: session.email,
    displayName: session.name,
    emailVerified: true,
    isAnonymous: true,
  } as User;
}

function createDemoProfile(session: DemoSession): UserProfile {
  return {
    uid: `demo-${session.role}-user`,
    email: session.email,
    displayName: session.name,
    role: session.role,
    onboardingComplete: true,
    tier: session.plan,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const demoSession = readDemoSession();
    if (demoSession) {
      setIsDemo(true);
      setUser(createDemoUser(demoSession));
      setProfile(createDemoProfile(demoSession));
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);

        try {
          const snap = await getDoc(doc(db, "users", firebaseUser.uid));
          if (snap.exists()) {
            setProfile({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              ...snap.data(),
            } as UserProfile);
          } else {
            setProfile({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
            });
          }
        } catch {
          setProfile({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
          });
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
      clearDemoSession();
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
