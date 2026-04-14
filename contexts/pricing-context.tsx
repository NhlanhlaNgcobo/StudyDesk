"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type PlanType = "free" | "student" | "student_pro" | "tutor";

interface PricingState {
  plan: PlanType;
  billingCycle: "monthly" | "annually";
  isVerifiedStudent: boolean;
  quotas: {
    modules: number;
    aiNotes: number;
    quizzes: number;
    mockExams: number;
    tutorGroupsJoined: number;
    studentsPerGroup: number;
  };
  features: {
    aiChatModel: "none" | "sonnet" | "opus";
    hasVision: boolean;
    hasCollaborativeNotes: boolean;
    hasNoWatermark: boolean;
    hasPastPaperAnalysis: boolean;
    hasSpacedRepetition: boolean;
    hasAnalytics: boolean;
    hasOfflineAccess: boolean;
    canBroadcast: boolean;
  };
}

interface PricingContextType {
  state: PricingState;
  setPlan: (plan: PlanType) => void;
  setBillingCycle: (cycle: "monthly" | "annually") => void;
  verifyStudentEmail: (email: string) => boolean;
  checkAccess: (feature: keyof PricingState["features"] | keyof PricingState["quotas"], currentCount?: number) => boolean;
}

const DEFAULT_STATE: PricingState = {
  plan: "free",
  billingCycle: "monthly",
  isVerifiedStudent: false,
  quotas: {
    modules: 2,
    aiNotes: 10,
    quizzes: 5,
    mockExams: 2,
    tutorGroupsJoined: 1,
    studentsPerGroup: 0,
  },
  features: {
    aiChatModel: "none",
    hasVision: false,
    hasCollaborativeNotes: false,
    hasNoWatermark: false,
    hasPastPaperAnalysis: false,
    hasSpacedRepetition: false,
    hasAnalytics: false,
    hasOfflineAccess: false,
    canBroadcast: false,
  }
};

const PricingContext = createContext<PricingContextType | undefined>(undefined);

export function PricingProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PricingState>(DEFAULT_STATE);

  useEffect(() => {
    // Logic to update state based on plan
    const updateStats = (plan: PlanType): PricingState => {
      switch (plan) {
        case "student":
          return {
            ...DEFAULT_STATE,
            plan: "student",
            quotas: { modules: Infinity, aiNotes: Infinity, quizzes: Infinity, mockExams: Infinity, tutorGroupsJoined: 5, studentsPerGroup: 0 },
            features: { ...DEFAULT_STATE.features, aiChatModel: "sonnet", hasNoWatermark: true, hasPastPaperAnalysis: true, hasSpacedRepetition: true, hasAnalytics: true }
          };
        case "student_pro":
          return {
            ...DEFAULT_STATE,
            plan: "student_pro",
            quotas: { modules: Infinity, aiNotes: Infinity, quizzes: Infinity, mockExams: Infinity, tutorGroupsJoined: Infinity, studentsPerGroup: 0 },
            features: { aiChatModel: "opus", hasVision: true, hasCollaborativeNotes: true, hasNoWatermark: true, hasPastPaperAnalysis: true, hasSpacedRepetition: true, hasAnalytics: true, hasOfflineAccess: true, canBroadcast: false }
          };
        case "tutor":
          return {
            ...DEFAULT_STATE,
            plan: "tutor",
            quotas: { modules: Infinity, aiNotes: Infinity, quizzes: Infinity, mockExams: Infinity, tutorGroupsJoined: Infinity, studentsPerGroup: 50 },
            features: { aiChatModel: "sonnet", hasVision: false, hasCollaborativeNotes: true, hasNoWatermark: true, hasPastPaperAnalysis: false, hasSpacedRepetition: false, hasAnalytics: true, hasOfflineAccess: false, canBroadcast: true }
          };
        default:
          return DEFAULT_STATE;
      }
    };
    setState(prev => ({ ...updateStats(prev.plan), billingCycle: prev.billingCycle, isVerifiedStudent: prev.isVerifiedStudent }));
  }, [state.plan]);

  const verifyStudentEmail = (email: string) => {
    const isVerified = email.endsWith(".ac.za");
    setState(prev => ({ ...prev, isVerifiedStudent: isVerified }));
    return isVerified;
  };

  const checkAccess = (feature: string, currentCount?: number) => {
    if (typeof currentCount === "number") {
      const quota = state.quotas[feature as keyof PricingState["quotas"]];
      return currentCount < quota;
    }
    return !!state.features[feature as keyof PricingState["features"]];
  };

  return (
    <PricingContext.Provider value={{ state, setPlan: (p) => setState(prev => ({ ...prev, plan: p })), setBillingCycle: (c) => setState(prev => ({ ...prev, billingCycle: c })), verifyStudentEmail, checkAccess }}>
      {children}
    </PricingContext.Provider>
  );
}

export const usePricing = () => {
  const context = useContext(PricingContext);
  if (!context) throw new Error("usePricing must be used within a PricingProvider");
  return context;
};
