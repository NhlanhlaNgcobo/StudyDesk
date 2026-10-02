/**
 * StudyDesk - Cohort analytics for tutors and institutions
 * ---------------------------------------------------------------------------
 * Two findings drive this file.
 *
 * 1. Tutor CoPilot (Stanford RCT, 900+ tutors, 1,000+ students in low-income
 *    schools): pointing AI at the TUTOR rather than the student raised mastery
 *    by 4pp overall and 9pp for students of the lowest-rated tutors, at about
 *    $20/tutor/year. The mechanism was more probing questions and less generic
 *    praise. So this page hands a tutor the probing question, not a score.
 *
 * 2. Between 50% and 60% of South African first-year students drop out before
 *    completing. Attrition, not grade optimisation, is the institutional
 *    problem worth money - and the leading indicators are behavioural
 *    (disengagement, help-avoidance, confidence collapse) well before they are
 *    academic.
 *
 * IMPORTANT: the cohort rows below are clearly-labelled synthetic demo data.
 * The signed-in student's own numbers come from their real learner model and
 * are merged in. Nothing here invents data about a real person.
 */

import {
  listSkills,
  calibration,
  helpProfile,
  retrievability,
  MASTERY_WEAK,
  type LearnerModelState,
} from "@/lib/learner-model";

export const COHORT_IS_SYNTHETIC = true;

export type RiskLevel = "critical" | "watch" | "steady";

export interface CohortMember {
  id: string;
  name: string;
  /** True only for the signed-in user, whose numbers are real. */
  isSelf: boolean;
  /** 0..1 average mastery across tracked skills. */
  mastery: number;
  /** 0..1 average current recall. */
  recall: number;
  /** Predicted minus actual, in points. Positive = overconfident. */
  calibrationGap: number;
  /** Share of tutor sessions where they attempted before asking, 0..1. */
  attemptFirstRate: number;
  /** Days since they last did any retrieval work. */
  daysInactive: number;
  skillsTracked: number;
  weakestSkill: string | null;
}

export interface RiskAssessment {
  level: RiskLevel;
  /** 0..100, higher is more at risk. */
  score: number;
  reasons: string[];
}

export interface MisconceptionCluster {
  label: string;
  skill: string;
  students: number;
  /** A probing question the tutor can ask, rather than a re-explanation. */
  probe: string;
}

// ---------------------------------------------------------------------------
// Synthetic cohort (demo only - labelled in the UI)
// ---------------------------------------------------------------------------

const DEMO_COHORT: Omit<CohortMember, "isSelf">[] = [
  {
    id: "c1",
    name: "Thandiwe M.",
    mastery: 0.22,
    recall: 0.31,
    calibrationGap: 0.34,
    attemptFirstRate: 0.21,
    daysInactive: 11,
    skillsTracked: 9,
    weakestSkill: "Big-O of nested loops",
  },
  {
    id: "c2",
    name: "Sipho N.",
    mastery: 0.38,
    recall: 0.44,
    calibrationGap: 0.28,
    attemptFirstRate: 0.35,
    daysInactive: 6,
    skillsTracked: 12,
    weakestSkill: "Recurrence relations",
  },
  {
    id: "c3",
    name: "Aisha P.",
    mastery: 0.41,
    recall: 0.29,
    calibrationGap: 0.05,
    attemptFirstRate: 0.82,
    daysInactive: 14,
    skillsTracked: 7,
    weakestSkill: "Hash collision handling",
  },
  {
    id: "c4",
    name: "Lerato K.",
    mastery: 0.63,
    recall: 0.71,
    calibrationGap: -0.08,
    attemptFirstRate: 0.9,
    daysInactive: 1,
    skillsTracked: 14,
    weakestSkill: "Graph traversal order",
  },
  {
    id: "c5",
    name: "Johan v. d. M.",
    mastery: 0.58,
    recall: 0.52,
    calibrationGap: 0.21,
    attemptFirstRate: 0.44,
    daysInactive: 3,
    skillsTracked: 11,
    weakestSkill: "Amortised analysis",
  },
  {
    id: "c6",
    name: "Nomvula D.",
    mastery: 0.79,
    recall: 0.84,
    calibrationGap: 0.02,
    attemptFirstRate: 0.88,
    daysInactive: 2,
    skillsTracked: 15,
    weakestSkill: "Balanced tree rotations",
  },
  {
    id: "c7",
    name: "Rushdi A.",
    mastery: 0.31,
    recall: 0.26,
    calibrationGap: 0.41,
    attemptFirstRate: 0.18,
    daysInactive: 9,
    skillsTracked: 6,
    weakestSkill: "Pointer arithmetic",
  },
  {
    id: "c8",
    name: "Palesa S.",
    mastery: 0.87,
    recall: 0.9,
    calibrationGap: -0.04,
    attemptFirstRate: 0.93,
    daysInactive: 1,
    skillsTracked: 16,
    weakestSkill: null,
  },
];

const DEMO_MISCONCEPTIONS: MisconceptionCluster[] = [
  {
    label: "Treats nested loops as always O(n²)",
    skill: "Big-O of nested loops",
    students: 5,
    probe:
      "Ask: \"If the inner loop runs to i instead of n, how many times does the body run in total?\" Let them sum it before you name the series.",
  },
  {
    label: "Confuses average and worst-case lookup",
    skill: "Hash collision handling",
    students: 4,
    probe:
      "Ask: \"Construct a set of keys that makes this table behave like a linked list.\" The construction teaches the bound better than the bound does.",
  },
  {
    label: "Applies the Master Theorem without checking the regularity condition",
    skill: "Recurrence relations",
    students: 3,
    probe:
      "Ask: \"Which of the three cases are you in, and what did you check to decide?\" Make them state the check, not the answer.",
  },
];

// ---------------------------------------------------------------------------
// Risk scoring
// ---------------------------------------------------------------------------

/**
 * Weighted toward the behavioural signals, because those move first. A
 * student who has stopped showing up is a bigger risk than one with a low
 * mark who is still working - and the mark-only view misses that entirely.
 */
export function assessRisk(member: CohortMember): RiskAssessment {
  const reasons: string[] = [];
  let score = 0;

  if (member.daysInactive >= 10) {
    score += 35;
    reasons.push(`No activity for ${member.daysInactive} days`);
  } else if (member.daysInactive >= 5) {
    score += 18;
    reasons.push(`Quiet for ${member.daysInactive} days`);
  }

  if (member.mastery < MASTERY_WEAK) {
    score += 25;
    reasons.push(`Average mastery ${Math.round(member.mastery * 100)}%`);
  }

  if (member.recall < 0.4) {
    score += 15;
    reasons.push("Most tracked skills have decayed below 40% recall");
  }

  if (member.calibrationGap > 0.25) {
    score += 15;
    reasons.push(
      `Overestimates own accuracy by ${Math.round(member.calibrationGap * 100)} points`
    );
  }

  if (member.attemptFirstRate < 0.4) {
    score += 10;
    reasons.push(
      `Asks for full solutions without attempting ${Math.round((1 - member.attemptFirstRate) * 100)}% of the time`
    );
  }

  const level: RiskLevel = score >= 55 ? "critical" : score >= 30 ? "watch" : "steady";

  if (reasons.length === 0) reasons.push("Engaged, calibrated and on track");

  return { level, score: Math.min(100, score), reasons };
}

/** The single most useful thing a tutor could do for this student today. */
export function suggestedAction(member: CohortMember, risk: RiskAssessment): string {
  if (member.daysInactive >= 10) {
    return "Reach out before more content stacks up. Ask what changed — at this stage it is usually money, transport, or a family obligation rather than the work.";
  }
  if (member.calibrationGap > 0.25) {
    return "Do one timed past-paper question together and have them predict their mark first. The gap is the lesson.";
  }
  if (member.attemptFirstRate < 0.4) {
    return "Set one problem they must attempt on paper before the next session. Mark the attempt, not the final answer.";
  }
  if (member.weakestSkill && member.mastery < 0.5) {
    return `Target "${member.weakestSkill}" with a parallel worked example, then have them do the real one unaided.`;
  }
  if (risk.level === "steady") {
    return "No intervention needed. Give them a harder problem — they have headroom.";
  }
  return "Review their weakest two skills in the next session and recheck in a week.";
}

// ---------------------------------------------------------------------------
// Assembling the cohort
// ---------------------------------------------------------------------------

/** Build the signed-in student's real row from their learner model. */
export function selfMember(
  state: LearnerModelState,
  name: string,
  moduleId?: string
): CohortMember | null {
  const skills = listSkills(state, moduleId);
  if (skills.length === 0) return null;

  const now = Date.now();
  const mastery = skills.reduce((sum, skill) => sum + skill.mastery, 0) / skills.length;
  const recall =
    skills.reduce((sum, skill) => {
      if (!skill.lastReviewedAt) return sum;
      return (
        sum + retrievability(skill.stability, (now - Date.parse(skill.lastReviewedAt)) / 86_400_000)
      );
    }, 0) / skills.length;

  const lastActive = state.activeDays.length > 0 ? state.activeDays[state.activeDays.length - 1] : null;
  const daysInactive = lastActive
    ? Math.max(0, Math.floor((now - Date.parse(lastActive)) / 86_400_000))
    : 0;

  const cal = calibration(state, moduleId);
  const help = helpProfile(state, moduleId);

  return {
    id: "self",
    name: `${name} (you)`,
    isSelf: true,
    mastery,
    recall,
    calibrationGap: cal.samples > 0 ? cal.gap : 0,
    attemptFirstRate: help.attemptFirstRate,
    daysInactive,
    skillsTracked: skills.length,
    weakestSkill: skills[0]?.name ?? null,
  };
}

export function buildCohort(state: LearnerModelState, selfName: string): CohortMember[] {
  const self = selfMember(state, selfName);
  const demo = DEMO_COHORT.map((member) => ({ ...member, isSelf: false }));
  const all = self ? [self, ...demo] : demo;

  return all.sort((a, b) => assessRisk(b).score - assessRisk(a).score);
}

export function cohortMisconceptions(state: LearnerModelState): MisconceptionCluster[] {
  // Surface the student's own observed misconceptions first - those are real.
  const own = listSkills(state)
    .flatMap((skill) =>
      skill.misconceptions.map((label) => ({
        label,
        skill: skill.name,
        students: 1,
        probe:
          "Ask them to state the rule in their own words before applying it. If the statement is wrong, the application was never the problem.",
      }))
    )
    .slice(0, 3);

  return [...own, ...DEMO_MISCONCEPTIONS];
}

export function cohortSummary(members: CohortMember[]) {
  const risks = members.map((member) => assessRisk(member));
  const critical = risks.filter((risk) => risk.level === "critical").length;
  const watch = risks.filter((risk) => risk.level === "watch").length;

  const avgMastery = members.reduce((sum, m) => sum + m.mastery, 0) / members.length;
  const overconfident = members.filter((m) => m.calibrationGap > 0.25).length;
  const helpAvoidant = members.filter((m) => m.attemptFirstRate < 0.4).length;
  const dormant = members.filter((m) => m.daysInactive >= 10).length;

  return {
    size: members.length,
    critical,
    watch,
    steady: members.length - critical - watch,
    avgMastery,
    overconfident,
    helpAvoidant,
    dormant,
  };
}
