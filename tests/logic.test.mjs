/* Logic tests for StudyDesk's learner model, cohort analytics and planner.
 * Plain node, no framework. Run: node node_modules/.cache/sd-tests/run-tests.js
 */

import { createRequire } from "node:module";
import path from "node:path";

const BUILD = process.env.SD_TEST_BUILD;
if (!BUILD) {
  console.error("Run these through the compile step:  npm test");
  process.exit(1);
}

const require = createRequire(import.meta.url);
const load = (name) => require(path.join(BUILD, name));

const lm = load("learner-model.js");
const cohort = load("cohort.js");
const planner = load("planner.js");
const claude = load("claude.js");

let pass = 0;
const failures = [];

function check(name, fn) {
  try {
    const result = fn();
    if (result === true || result === undefined) {
      pass += 1;
    } else {
      failures.push({ name, detail: String(result) });
    }
  } catch (err) {
    failures.push({ name, detail: `threw: ${err.message}` });
  }
}

function near(actual, expected, tol, label) {
  if (Math.abs(actual - expected) > tol) {
    return `${label}: expected ~${expected} (Â±${tol}), got ${actual}`;
  }
  return true;
}

const DAY = 86_400_000;
const iso = (offsetDays) => new Date(Date.now() + offsetDays * DAY).toISOString();

// ---------------------------------------------------------------------------
// BKT â€” updateMastery
// ---------------------------------------------------------------------------

check("BKT: a correct answer raises mastery", () => {
  const after = lm.updateMastery(0.25, 1);
  return after > 0.25 ? true : `expected > 0.25, got ${after}`;
});

check("BKT: a wrong answer lowers mastery below the prior", () => {
  const after = lm.updateMastery(0.6, 0);
  return after < 0.6 ? true : `expected < 0.6, got ${after}`;
});

check("BKT: monotonically increasing in score", () => {
  const scores = [0, 0.25, 0.5, 0.75, 1];
  const out = scores.map((s) => lm.updateMastery(0.4, s));
  for (let i = 1; i < out.length; i += 1) {
    if (out[i] <= out[i - 1]) return `not monotonic at index ${i}: ${out.join(", ")}`;
  }
  return true;
});

check("BKT: stays inside (0,1) for extreme priors and scores", () => {
  const probes = [
    [0.001, 0], [0.001, 1], [0.999, 0], [0.999, 1],
    [0, 0], [1, 1], [0.5, -5], [0.5, 5],
  ];
  for (const [prior, score] of probes) {
    const out = lm.updateMastery(prior, score);
    if (!(out > 0 && out < 1) || Number.isNaN(out)) {
      return `prior=${prior} score=${score} -> ${out}`;
    }
  }
  return true;
});

check("BKT: ten correct answers converge toward mastery", () => {
  let m = lm.updateMastery(0.25, 1);
  for (let i = 0; i < 9; i += 1) m = lm.updateMastery(m, 1);
  return m > 0.95 ? true : `after 10 correct, mastery = ${m}`;
});

check("BKT: ten wrong answers converge toward non-mastery", () => {
  let m = lm.updateMastery(0.9, 0);
  for (let i = 0; i < 9; i += 1) m = lm.updateMastery(m, 0);
  return m < 0.2 ? true : `after 10 wrong, mastery = ${m}`;
});

check("BKT: partial credit lands between the correct and wrong posteriors", () => {
  const wrong = lm.updateMastery(0.5, 0);
  const right = lm.updateMastery(0.5, 1);
  const half = lm.updateMastery(0.5, 0.5);
  return half > wrong && half < right
    ? true
    : `wrong=${wrong} half=${half} right=${right}`;
});

// ---------------------------------------------------------------------------
// Elo â€” updateElo
// ---------------------------------------------------------------------------

check("Elo: a win raises the student and lowers the item", () => {
  const r = lm.updateElo(1500, 1500, 1);
  return r.student > 1500 && r.item < 1500
    ? true
    : `student=${r.student} item=${r.item}`;
});

check("Elo: a loss lowers the student and raises the item", () => {
  const r = lm.updateElo(1500, 1500, 0);
  return r.student < 1500 && r.item > 1500
    ? true
    : `student=${r.student} item=${r.item}`;
});

check("Elo: the exchange is zero-sum", () => {
  const r = lm.updateElo(1600, 1400, 1);
  const delta = r.student - 1600 + (r.item - 1400);
  return near(delta, 0, 1e-9, "sum of deltas");
});

check("Elo: an even match expects 0.5", () => {
  const r = lm.updateElo(1500, 1500, 1);
  return near(r.expected, 0.5, 1e-9, "expected");
});

check("Elo: a 400-point edge expects ~0.909", () => {
  const r = lm.updateElo(1900, 1500, 1);
  return near(r.expected, 10 / 11, 1e-6, "expected");
});

check("Elo: beating a hard item gains more than beating an easy one", () => {
  const hard = lm.updateElo(1500, 1900, 1).student - 1500;
  const easy = lm.updateElo(1500, 1100, 1).student - 1500;
  return hard > easy ? true : `hard=${hard} easy=${easy}`;
});

// ---------------------------------------------------------------------------
// gradeFor
// ---------------------------------------------------------------------------

check("gradeFor: a failed answer is always grade 1, whatever the help level", () => {
  for (const hint of [0, 1, 2, 3, 4]) {
    const g = lm.gradeFor(0.2, hint);
    if (g !== 1) return `hint=${hint} -> grade ${g}`;
  }
  return true;
});

check("gradeFor: a perfect unaided answer is grade 4", () => {
  const g = lm.gradeFor(1, 0);
  return g === 4 ? true : `got ${g}`;
});

check("gradeFor: deep help caps the grade at 2 even on a perfect answer", () => {
  for (const hint of [3, 4]) {
    const g = lm.gradeFor(1, hint);
    if (g !== 2) return `hint=${hint} -> grade ${g}`;
  }
  return true;
});

check("gradeFor: returns only 1-4", () => {
  for (const score of [0, 0.3, 0.5, 0.7, 0.85, 0.99, 1]) {
    for (const hint of [0, 1, 2, 3, 4]) {
      const g = lm.gradeFor(score, hint);
      if (![1, 2, 3, 4].includes(g)) return `score=${score} hint=${hint} -> ${g}`;
    }
  }
  return true;
});

// ---------------------------------------------------------------------------
// retrievability
// ---------------------------------------------------------------------------

check("retrievability: zero stability means nothing is retained", () => {
  return lm.retrievability(0, 5) === 0 ? true : `got ${lm.retrievability(0, 5)}`;
});

check("retrievability: no elapsed time means full recall", () => {
  return near(lm.retrievability(10, 0), 1, 1e-9, "R(10, 0)");
});

check("retrievability: at elapsed == stability, recall is 0.9 (the design target)", () => {
  return near(lm.retrievability(10, 10), 0.9, 1e-9, "R(10, 10)");
});

check("retrievability: decays monotonically with elapsed time", () => {
  let prev = Infinity;
  for (const days of [0, 1, 5, 10, 30, 100, 365]) {
    const r = lm.retrievability(10, days);
    if (r > prev) return `non-monotonic at ${days} days`;
    prev = r;
  }
  return true;
});

check("retrievability: higher stability retains more at the same elapsed time", () => {
  const low = lm.retrievability(5, 10);
  const high = lm.retrievability(50, 10);
  return high > low ? true : `low=${low} high=${high}`;
});

check("retrievability: negative elapsed is clamped, never above 1", () => {
  const r = lm.retrievability(10, -50);
  return r <= 1 && r > 0 ? true : `got ${r}`;
});

// ---------------------------------------------------------------------------
// scheduleReview (FSRS-style)
// ---------------------------------------------------------------------------

const freshSkill = { difficulty: 5.5, stability: 0, lastReviewedAt: null, reps: 0 };

check("scheduleReview: first review interval rises with the grade", () => {
  const intervals = [1, 2, 3, 4].map(
    (g) => lm.scheduleReview(freshSkill, g).intervalDays
  );
  for (let i = 1; i < intervals.length; i += 1) {
    if (intervals[i] < intervals[i - 1]) {
      return `not ascending: ${intervals.join(", ")}`;
    }
  }
  return true;
});

check("scheduleReview: an easy first review schedules at least a week out", () => {
  const r = lm.scheduleReview(freshSkill, 4);
  return r.intervalDays >= 7 ? true : `got ${r.intervalDays} days`;
});

check("scheduleReview: a failed first review comes back within a day", () => {
  const r = lm.scheduleReview(freshSkill, 1);
  return r.intervalDays <= 1 ? true : `got ${r.intervalDays} days`;
});

check("scheduleReview: difficulty mean-reverts toward 5.5 (no 'ease hell')", () => {
  // Repeated "good" reviews on a maxed-out difficulty should pull it back down.
  let skill = { difficulty: 10, stability: 5, lastReviewedAt: iso(-5), reps: 3 };
  for (let i = 0; i < 20; i += 1) {
    const r = lm.scheduleReview(skill, 3, iso(0));
    skill = { ...skill, difficulty: r.difficulty, stability: r.stability, lastReviewedAt: iso(-r.intervalDays), reps: skill.reps + 1 };
  }
  return skill.difficulty < 7
    ? true
    : `difficulty stuck at ${skill.difficulty} after 20 good reviews`;
});

check("scheduleReview: difficulty stays within 1..10", () => {
  for (const start of [1, 5.5, 10]) {
    for (const g of [1, 2, 3, 4]) {
      const r = lm.scheduleReview(
        { difficulty: start, stability: 4, lastReviewedAt: iso(-4), reps: 2 },
        g
      );
      if (r.difficulty < 1 || r.difficulty > 10 || Number.isNaN(r.difficulty)) {
        return `start=${start} grade=${g} -> difficulty ${r.difficulty}`;
      }
    }
  }
  return true;
});

check("scheduleReview: a lapse shrinks stability but never to zero", () => {
  const before = 40;
  const r = lm.scheduleReview(
    { difficulty: 5.5, stability: before, lastReviewedAt: iso(-40), reps: 6 },
    1
  );
  return r.stability < before && r.stability >= 0.3
    ? true
    : `stability ${before} -> ${r.stability}`;
});

check("scheduleReview: a successful review grows stability", () => {
  const before = 10;
  const r = lm.scheduleReview(
    { difficulty: 5.5, stability: before, lastReviewedAt: iso(-10), reps: 4 },
    3
  );
  return r.stability > before ? true : `stability ${before} -> ${r.stability}`;
});

check("scheduleReview: intervals stay within 1..365 days under stress", () => {
  for (const stability of [0.1, 1, 50, 500, 5000]) {
    for (const g of [1, 2, 3, 4]) {
      const r = lm.scheduleReview(
        { difficulty: 5.5, stability, lastReviewedAt: iso(-stability), reps: 5 },
        g
      );
      if (r.intervalDays < 1 || r.intervalDays > 365 || !Number.isFinite(r.intervalDays)) {
        return `stability=${stability} grade=${g} -> ${r.intervalDays}`;
      }
    }
  }
  return true;
});

check("scheduleReview: dueAt is intervalDays in the future", () => {
  const now = new Date("2026-06-01T12:00:00.000Z").toISOString();
  const r = lm.scheduleReview(freshSkill, 3, now);
  const gapDays = (Date.parse(r.dueAt) - Date.parse(now)) / DAY;
  return near(gapDays, r.intervalDays, 1e-6, "dueAt gap");
});

check("scheduleReview: an easier item schedules further out than a hard one", () => {
  const easy = lm.scheduleReview(
    { difficulty: 2, stability: 10, lastReviewedAt: iso(-10), reps: 4 },
    3
  ).intervalDays;
  const hard = lm.scheduleReview(
    { difficulty: 9, stability: 10, lastReviewedAt: iso(-10), reps: 4 },
    3
  ).intervalDays;
  return easy > hard ? true : `easy=${easy} hard=${hard}`;
});

// ---------------------------------------------------------------------------
// hintCeilingFor â€” scaffold fading
// ---------------------------------------------------------------------------

check("hintCeilingFor: proved skills get only level 1", () => {
  return lm.hintCeilingFor(0.95) === 1 ? true : `got ${lm.hintCeilingFor(0.95)}`;
});

check("hintCeilingFor: unknown skills get the full ladder", () => {
  return lm.hintCeilingFor(0.1) === 4 ? true : `got ${lm.hintCeilingFor(0.1)}`;
});

check("hintCeilingFor: never increases as mastery rises", () => {
  let prev = 5;
  for (let m = 0; m <= 1.0001; m += 0.05) {
    const c = lm.hintCeilingFor(Math.min(m, 1));
    if (c > prev) return `ceiling rose at mastery ${m.toFixed(2)}: ${prev} -> ${c}`;
    prev = c;
  }
  return true;
});

check("hintCeilingFor: boundary at MASTERY_PROVED behaves", () => {
  const at = lm.hintCeilingFor(lm.MASTERY_PROVED);
  const below = lm.hintCeilingFor(lm.MASTERY_PROVED - 0.001);
  return at === 1 && below === 2 ? true : `at=${at} below=${below}`;
});

// ---------------------------------------------------------------------------
// calibration
// ---------------------------------------------------------------------------

const confState = (events) => ({ skills: {}, confidence: events, help: [], activeDays: [] });

check("calibration: no data returns a safe empty verdict", () => {
  const c = lm.calibration(confState([]));
  return c.samples === 0 && c.verdict === "no data" ? true : JSON.stringify(c);
});

check("calibration: predicting high and scoring low reads as overconfident", () => {
  const c = lm.calibration(
    confState([
      { moduleId: "1", predicted: 0.95, actual: 0.3, at: iso(0), skillId: "s", id: "a" },
      { moduleId: "1", predicted: 0.9, actual: 0.4, at: iso(0), skillId: "s", id: "b" },
    ])
  );
  return c.verdict === "overconfident" && c.gap > 0 ? true : JSON.stringify(c);
});

check("calibration: predicting low and scoring high reads as underconfident", () => {
  const c = lm.calibration(
    confState([
      { moduleId: "1", predicted: 0.2, actual: 0.9, at: iso(0), skillId: "s", id: "a" },
    ])
  );
  return c.verdict === "underconfident" && c.gap < 0 ? true : JSON.stringify(c);
});

check("calibration: accurate predictions read as well calibrated", () => {
  const c = lm.calibration(
    confState([
      { moduleId: "1", predicted: 0.7, actual: 0.7, at: iso(0), skillId: "s", id: "a" },
      { moduleId: "1", predicted: 0.4, actual: 0.45, at: iso(0), skillId: "s", id: "b" },
    ])
  );
  return c.verdict === "well calibrated" ? true : JSON.stringify(c);
});

check("calibration: Brier score is 0 for perfect prediction, 1 for maximally wrong", () => {
  const perfect = lm.calibration(
    confState([{ moduleId: "1", predicted: 1, actual: 1, at: iso(0), skillId: "s", id: "a" }])
  );
  const awful = lm.calibration(
    confState([{ moduleId: "1", predicted: 1, actual: 0, at: iso(0), skillId: "s", id: "a" }])
  );
  const a = near(perfect.brier, 0, 1e-9, "perfect brier");
  if (a !== true) return a;
  return near(awful.brier, 1, 1e-9, "awful brier");
});

check("calibration: filters by module", () => {
  const state = confState([
    { moduleId: "1", predicted: 0.95, actual: 0.1, at: iso(0), skillId: "s", id: "a" },
    { moduleId: "2", predicted: 0.5, actual: 0.5, at: iso(0), skillId: "s", id: "b" },
  ]);
  const one = lm.calibration(state, "1");
  const two = lm.calibration(state, "2");
  return one.samples === 1 && two.samples === 1 && one.gap > two.gap
    ? true
    : `one=${JSON.stringify(one)} two=${JSON.stringify(two)}`;
});

// ---------------------------------------------------------------------------
// helpProfile
// ---------------------------------------------------------------------------

const helpEvent = (over) => ({
  id: Math.random().toString(36),
  skillId: "1:x",
  moduleId: "1",
  mode: "learn",
  hintLevel: 1,
  attemptFirst: true,
  explainedBack: false,
  question: "q",
  at: iso(0),
  ...over,
});

const helpState = (events) => ({ skills: {}, confidence: [], help: events, activeDays: [] });

check("helpProfile: no data is treated as healthy, not flagged", () => {
  const p = lm.helpProfile(helpState([]));
  return p.samples === 0 && p.flag === false ? true : JSON.stringify(p);
});

check("helpProfile: flags answer-shopping (no attempt + deep help)", () => {
  const events = Array.from({ length: 10 }, () =>
    helpEvent({ attemptFirst: false, hintLevel: 4 })
  );
  const p = lm.helpProfile(helpState(events));
  return p.flag === true ? true : JSON.stringify(p);
});

check("helpProfile: does not flag a student who attempts first", () => {
  const events = Array.from({ length: 10 }, () =>
    helpEvent({ attemptFirst: true, hintLevel: 4, explainedBack: true })
  );
  const p = lm.helpProfile(helpState(events));
  return p.flag === false ? true : JSON.stringify(p);
});

check("helpProfile: does not flag shallow help without attempts", () => {
  // Asking for clarification without an attempt is not answer-shopping.
  const events = Array.from({ length: 10 }, () =>
    helpEvent({ attemptFirst: false, hintLevel: 1 })
  );
  const p = lm.helpProfile(helpState(events));
  return p.flag === false ? true : JSON.stringify(p);
});

check("helpProfile: explain-back rate only counts revealed solutions", () => {
  const events = [
    helpEvent({ hintLevel: 1 }),
    helpEvent({ hintLevel: 4, explainedBack: true }),
    helpEvent({ hintLevel: 4, explainedBack: false }),
  ];
  const p = lm.helpProfile(helpState(events));
  return near(p.explainBackRate, 0.5, 1e-9, "explainBackRate");
});

check("helpProfile: rates stay within 0..1", () => {
  const events = Array.from({ length: 40 }, (_, i) =>
    helpEvent({ attemptFirst: i % 2 === 0, hintLevel: (i % 4) + 1 })
  );
  const p = lm.helpProfile(helpState(events));
  for (const key of ["attemptFirstRate", "deepHelpRate", "explainBackRate"]) {
    if (p[key] < 0 || p[key] > 1) return `${key} = ${p[key]}`;
  }
  return true;
});

// ---------------------------------------------------------------------------
// skillIdFor
// ---------------------------------------------------------------------------

check("skillIdFor: the same topic always maps to the same id", () => {
  return lm.skillIdFor("1", "Integration by parts") === lm.skillIdFor("1", "Integration by parts");
});

check("skillIdFor: case and punctuation do not fork the id", () => {
  const a = lm.skillIdFor("1", "Big-O Notation");
  const b = lm.skillIdFor("1", "big o notation");
  return a === b ? true : `${a} !== ${b}`;
});

check("skillIdFor: different modules never collide", () => {
  return lm.skillIdFor("1", "Calculus") !== lm.skillIdFor("2", "Calculus");
});

check("skillIdFor: empty or symbol-only topics fall back to 'general'", () => {
  const a = lm.skillIdFor("1", "");
  const b = lm.skillIdFor("1", "!!!");
  return a === "1:general" && b === "1:general" ? true : `a=${a} b=${b}`;
});

check("skillIdFor: id length is bounded", () => {
  const id = lm.skillIdFor("1", "x".repeat(500));
  return id.length <= 52 ? true : `length ${id.length}`;
});

// ---------------------------------------------------------------------------
// examReadiness â€” mastery discounted by recall
// ---------------------------------------------------------------------------

const mkSkill = (over) => ({
  id: "1:x",
  moduleId: "1",
  name: "x",
  mastery: 0.9,
  rating: 1500,
  itemRating: 1500,
  attempts: 5,
  correct: 5,
  difficulty: 5.5,
  stability: 10,
  reps: 3,
  lapses: 0,
  lastReviewedAt: iso(0),
  dueAt: iso(10),
  misconceptions: [],
  lastHintLevel: 0,
  ...over,
});

check("examReadiness: a skill proved today scores higher than the same skill left to decay", () => {
  const fresh = lm.examReadiness(
    { skills: { "1:x": mkSkill({ lastReviewedAt: iso(0) }) }, confidence: [], help: [], activeDays: [] },
    "1"
  );
  const stale = lm.examReadiness(
    { skills: { "1:x": mkSkill({ lastReviewedAt: iso(-200) }) }, confidence: [], help: [], activeDays: [] },
    "1"
  );
  return fresh.score > stale.score ? true : `fresh=${fresh.score} stale=${stale.score}`;
});

check("examReadiness: never claims readiness for a skill never reviewed", () => {
  const r = lm.examReadiness(
    {
      skills: { "1:x": mkSkill({ mastery: 1, lastReviewedAt: null, stability: 0 }) },
      confidence: [], help: [], activeDays: [],
    },
    "1"
  );
  // mastery 1 with zero recall -> 0.4 weighting only
  return r.score <= 40 ? true : `score ${r.score}`;
});

check("examReadiness: empty module returns zero, not NaN", () => {
  const r = lm.examReadiness({ skills: {}, confidence: [], help: [], activeDays: [] }, "1");
  return r.score === 0 && r.skills === 0 ? true : JSON.stringify(r);
});

check("examReadiness: score is a 0..100 integer", () => {
  const r = lm.examReadiness(
    { skills: { "1:x": mkSkill({}) }, confidence: [], help: [], activeDays: [] },
    "1"
  );
  return Number.isInteger(r.score) && r.score >= 0 && r.score <= 100
    ? true
    : `score ${r.score}`;
});

check("examReadiness: weakest skills come back weakest-first", () => {
  const state = {
    skills: {
      "1:a": mkSkill({ id: "1:a", name: "a", mastery: 0.9 }),
      "1:b": mkSkill({ id: "1:b", name: "b", mastery: 0.2 }),
      "1:c": mkSkill({ id: "1:c", name: "c", mastery: 0.5 }),
    },
    confidence: [], help: [], activeDays: [],
  };
  const r = lm.examReadiness(state, "1");
  return r.weakest[0].name === "b" ? true : `first weakest = ${r.weakest[0].name}`;
});

// ---------------------------------------------------------------------------
// learnerSnapshot â€” the string injected into the tutor prompt
// ---------------------------------------------------------------------------

check("learnerSnapshot: empty model produces an empty string (no prompt bloat)", () => {
  const s = lm.learnerSnapshot({ skills: {}, confidence: [], help: [], activeDays: [] }, "1");
  return s === "" ? true : `got "${s}"`;
});

check("learnerSnapshot: names weak skills and tells the tutor to scaffold them", () => {
  const state = {
    skills: { "1:a": mkSkill({ id: "1:a", name: "Recursion", mastery: 0.15 }) },
    confidence: [], help: [], activeDays: [],
  };
  const s = lm.learnerSnapshot(state, "1");
  return s.includes("Recursion") && s.includes("WEAK") ? true : `got "${s}"`;
});

check("learnerSnapshot: tells the tutor NOT to re-explain proved skills", () => {
  const state = {
    skills: { "1:a": mkSkill({ id: "1:a", name: "Loops", mastery: 0.95 }) },
    confidence: [], help: [], activeDays: [],
  };
  const s = lm.learnerSnapshot(state, "1");
  return s.includes("PROVED") && s.includes("ask instead") ? true : `got "${s}"`;
});

check("learnerSnapshot: surfaces an overconfidence warning once there is evidence", () => {
  const state = {
    skills: { "1:a": mkSkill({ id: "1:a", name: "Loops", mastery: 0.5 }) },
    confidence: Array.from({ length: 4 }, (_, i) => ({
      id: `c${i}`, skillId: "1:a", moduleId: "1", predicted: 0.95, actual: 0.2, at: iso(0),
    })),
    help: [], activeDays: [],
  };
  const s = lm.learnerSnapshot(state, "1");
  return s.includes("CALIBRATION") ? true : `got "${s}"`;
});

check("learnerSnapshot: stays compact enough to ride on every message", () => {
  const skills = {};
  for (let i = 0; i < 40; i += 1) {
    skills[`1:s${i}`] = mkSkill({
      id: `1:s${i}`,
      name: `Skill number ${i} with a fairly long descriptive name`,
      mastery: i / 40,
      misconceptions: ["a misconception that is quite wordy indeed", "another one"],
    });
  }
  const s = lm.learnerSnapshot({ skills, confidence: [], help: [], activeDays: [] }, "1");
  return s.length < 1200 ? true : `snapshot length ${s.length}`;
});

check("learnerSnapshot: includes the current topic's mastery and help ceiling", () => {
  const state = {
    skills: { [lm.skillIdFor("1", "Vectors")]: mkSkill({ id: lm.skillIdFor("1", "Vectors"), name: "Vectors", mastery: 0.5 }) },
    confidence: [], help: [], activeDays: [],
  };
  const s = lm.learnerSnapshot(state, "1", "Vectors");
  return s.includes("CURRENT TOPIC") && s.includes("max help allowed")
    ? true
    : `got "${s}"`;
});

// ---------------------------------------------------------------------------
// Work log / CSV
// ---------------------------------------------------------------------------

check("buildWorkLog: returns newest entries first", () => {
  const state = helpState([
    helpEvent({ at: iso(-5), question: "old" }),
    helpEvent({ at: iso(-1), question: "new" }),
  ]);
  const log = lm.buildWorkLog(state);
  return log[0].detail.includes("new") ? true : JSON.stringify(log.map((l) => l.detail));
});

check("buildWorkLog: records whether the student attempted first", () => {
  const withAttempt = lm.buildWorkLog(helpState([helpEvent({ attemptFirst: true })]));
  const without = lm.buildWorkLog(helpState([helpEvent({ attemptFirst: false })]));
  return withAttempt[0].detail.includes("attempted first") &&
    without[0].detail.includes("no prior attempt")
    ? true
    : `${withAttempt[0].detail} | ${without[0].detail}`;
});

check("workLogToCsv: escapes embedded quotes and commas so the CSV stays parseable", () => {
  const csv = lm.workLogToCsv([
    { at: "2026-01-01T00:00:00.000Z", kind: "help", moduleId: "1", skill: 'He said "hi", loudly', detail: "a,b" },
  ]);
  const lines = csv.split("\n");
  // Header + one row; the row must have exactly 5 fields once quotes are honoured.
  const fields = lines[1].match(/"(?:[^"]|"")*"/g);
  return lines.length === 2 && fields && fields.length === 5
    ? true
    : `csv=${csv}`;
});

check("workLogToCsv: newlines inside a field do not create a phantom row", () => {
  const csv = lm.workLogToCsv([
    { at: "2026-01-01T00:00:00.000Z", kind: "help", moduleId: "1", skill: "s", detail: "line1\nline2" },
  ]);
  // Quoted newline is legal CSV; just assert the header is intact and quoting applied.
  return csv.startsWith("timestamp,type,module,skill,detail") && csv.includes('"line1\nline2"')
    ? true
    : `csv=${JSON.stringify(csv)}`;
});

// ---------------------------------------------------------------------------
// Cohort risk scoring
// ---------------------------------------------------------------------------

const member = (over) => ({
  id: "m",
  name: "m",
  isSelf: false,
  mastery: 0.7,
  recall: 0.8,
  calibrationGap: 0,
  attemptFirstRate: 0.9,
  daysInactive: 0,
  skillsTracked: 10,
  weakestSkill: "x",
  ...over,
});

check("assessRisk: an engaged, calibrated student is steady", () => {
  const r = cohort.assessRisk(member({}));
  return r.level === "steady" ? true : JSON.stringify(r);
});

check("assessRisk: a dormant, weak, overconfident student is critical", () => {
  const r = cohort.assessRisk(
    member({ daysInactive: 20, mastery: 0.2, recall: 0.2, calibrationGap: 0.4, attemptFirstRate: 0.1 })
  );
  return r.level === "critical" ? true : JSON.stringify(r);
});

check("assessRisk: going quiet alone is enough to escalate off 'steady'", () => {
  const r = cohort.assessRisk(member({ daysInactive: 12 }));
  return r.level !== "steady" ? true : JSON.stringify(r);
});

check("assessRisk: score is bounded 0..100", () => {
  const worst = cohort.assessRisk(
    member({ daysInactive: 999, mastery: 0, recall: 0, calibrationGap: 1, attemptFirstRate: 0 })
  );
  const best = cohort.assessRisk(member({ mastery: 1, recall: 1 }));
  return worst.score <= 100 && best.score >= 0 ? true : `worst=${worst.score} best=${best.score}`;
});

check("assessRisk: risk is monotonic in days inactive", () => {
  let prev = -1;
  for (const days of [0, 4, 5, 9, 10, 30]) {
    const s = cohort.assessRisk(member({ daysInactive: days })).score;
    if (s < prev) return `score dropped at ${days} days: ${prev} -> ${s}`;
    prev = s;
  }
  return true;
});

check("assessRisk: always gives at least one reason", () => {
  const steady = cohort.assessRisk(member({}));
  const bad = cohort.assessRisk(member({ daysInactive: 30 }));
  return steady.reasons.length > 0 && bad.reasons.length > 0
    ? true
    : `steady=${steady.reasons.length} bad=${bad.reasons.length}`;
});

check("suggestedAction: a dormant student gets an outreach action, not a study tip", () => {
  const m = member({ daysInactive: 20 });
  const a = cohort.suggestedAction(m, cohort.assessRisk(m));
  return /reach out/i.test(a) ? true : `got "${a}"`;
});

check("suggestedAction: an overconfident student gets a prediction exercise", () => {
  const m = member({ calibrationGap: 0.4 });
  const a = cohort.suggestedAction(m, cohort.assessRisk(m));
  return /predict/i.test(a) ? true : `got "${a}"`;
});

check("suggestedAction: a steady student is explicitly left alone", () => {
  const m = member({});
  const a = cohort.suggestedAction(m, cohort.assessRisk(m));
  return /no intervention/i.test(a) ? true : `got "${a}"`;
});

check("cohortSummary: buckets add up to the cohort size", () => {
  const members = [
    member({ id: "a" }),
    member({ id: "b", daysInactive: 20, mastery: 0.1, recall: 0.1, calibrationGap: 0.5, attemptFirstRate: 0.1 }),
    member({ id: "c", daysInactive: 6 }),
  ];
  const s = cohort.cohortSummary(members);
  return s.critical + s.watch + s.steady === s.size
    ? true
    : JSON.stringify(s);
});

check("buildCohort: sorts highest risk first", () => {
  const list = cohort.buildCohort({ skills: {}, confidence: [], help: [], activeDays: [] }, "Me");
  const scores = list.map((m) => cohort.assessRisk(m).score);
  for (let i = 1; i < scores.length; i += 1) {
    if (scores[i] > scores[i - 1]) return `not descending: ${scores.join(", ")}`;
  }
  return true;
});

check("buildCohort: omits the real row when the student has no data yet", () => {
  const list = cohort.buildCohort({ skills: {}, confidence: [], help: [], activeDays: [] }, "Me");
  return list.every((m) => !m.isSelf) ? true : "self row present with no data";
});

check("buildCohort: includes a real row once the student has answered something", () => {
  const state = {
    skills: { "1:a": mkSkill({}) },
    confidence: [], help: [], activeDays: [new Date().toISOString().slice(0, 10)],
  };
  const list = cohort.buildCohort(state, "Nhlanhla");
  const self = list.find((m) => m.isSelf);
  return self && self.name.includes("Nhlanhla") ? true : "self row missing";
});

check("selfMember: no NaN when skills exist but none were ever reviewed", () => {
  const state = {
    skills: { "1:a": mkSkill({ lastReviewedAt: null, stability: 0 }) },
    confidence: [], help: [], activeDays: [],
  };
  const self = cohort.selfMember(state, "Me");
  for (const key of ["mastery", "recall", "calibrationGap", "attemptFirstRate", "daysInactive"]) {
    if (Number.isNaN(self[key])) return `${key} is NaN`;
  }
  return true;
});

// ---------------------------------------------------------------------------
// Planner â€” ICS export (new this round)
// ---------------------------------------------------------------------------

const plannerEvent = {
  id: "evt-1",
  title: "CS201 Exam; Hall A, seat 4",
  date: "2026-11-10",
  time: "09:00",
  duration: 120,
  type: "exam",
  module: "CS201",
  notes: "Bring ID, calculator",
};

check("createIcsCalendar: emits a well-formed VCALENDAR", () => {
  const ics = planner.createIcsCalendar(plannerEvent);
  const required = ["BEGIN:VCALENDAR", "VERSION:2.0", "BEGIN:VEVENT", "UID:", "DTSTART:", "DTEND:", "SUMMARY:", "END:VEVENT", "END:VCALENDAR"];
  for (const token of required) {
    if (!ics.includes(token)) return `missing ${token}`;
  }
  return true;
});

check("createIcsCalendar: uses CRLF line endings as the spec requires", () => {
  const ics = planner.createIcsCalendar(plannerEvent);
  return ics.includes("\r\n") && !/[^\r]\n/.test(ics)
    ? true
    : "found a bare LF line ending";
});

check("createIcsCalendar: DTEND is after DTSTART by the event duration", () => {
  const ics = planner.createIcsCalendar(plannerEvent);
  const start = ics.match(/DTSTART:(\S+)/)[1];
  const end = ics.match(/DTEND:(\S+)/)[1];
  const parse = (v) => {
    const m = v.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?$/);
    if (!m) return null;
    return Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
  };
  const s = parse(start), e = parse(end);
  if (s === null || e === null) return `unparseable DTSTART=${start} DTEND=${end}`;
  const minutes = (e - s) / 60000;
  return near(minutes, plannerEvent.duration, 1, "duration in minutes");
});

check("createIcsCalendar: escapes semicolons and commas in SUMMARY", () => {
  const ics = planner.createIcsCalendar(plannerEvent);
  const summary = ics.match(/SUMMARY:(.*)/)[1];
  return summary.includes("\\;") && summary.includes("\\,")
    ? true
    : `SUMMARY not escaped: ${summary}`;
});

check("createIcsCalendar: a local event crossing midnight keeps the right duration", () => {
  // Note: DTSTART/DTEND are emitted in UTC, so in UTC+2 a 23:30 local start is
  // 21:30Z and the end legitimately stays on the same UTC date. What must hold
  // is the delta, not the calendar date.
  const ics = planner.createIcsCalendar({ ...plannerEvent, time: "23:30", duration: 120 });
  const parse = (v) => {
    const m = v.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
    return m ? Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]) : null;
  };
  const s = parse(ics.match(/DTSTART:(\S+)/)[1]);
  const e = parse(ics.match(/DTEND:(\S+)/)[1]);
  if (s === null || e === null) return "unparseable DTSTART/DTEND";
  return near((e - s) / 60000, 120, 1, "duration across midnight");
});

check("createIcsCalendar: local wall-clock time round-trips through UTC", () => {
  // A 09:00 local event must come back as 09:00 local after the UTC hop.
  const ics = planner.createIcsCalendar({ ...plannerEvent, date: "2026-07-15", time: "09:00" });
  const m = ics.match(/DTSTART:(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/);
  const asUtc = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
  const local = new Date(asUtc);
  return local.getHours() === 9 && local.getMinutes() === 0 && local.getDate() === 15
    ? true
    : `round-tripped to ${local.toString()}`;
});

check("createIcsCalendar: 'personal' is an accepted event type", () => {
  const ics = planner.createIcsCalendar({ ...plannerEvent, type: "personal" });
  return ics.includes("BEGIN:VEVENT") ? true : "failed on personal type";
});

// ---------------------------------------------------------------------------
// Tutor prompt construction
// ---------------------------------------------------------------------------

check("buildSystemPrompt: learn mode forbids giving the final answer", () => {
  const p = claude.buildSystemPrompt({ mode: "learn" });
  return /Never give a final answer/i.test(p) ? true : "missing the withholding rule";
});

check("buildSystemPrompt: learn mode without an attempt refuses to teach yet", () => {
  const p = claude.buildSystemPrompt({ mode: "learn", attemptFirst: false });
  return /Do not teach/i.test(p) ? true : "missing the attempt gate";
});

check("buildSystemPrompt: learn mode with an attempt responds to their reasoning", () => {
  const p = claude.buildSystemPrompt({ mode: "learn", attemptFirst: true });
  return /HAS submitted an attempt/i.test(p) ? true : "missing the attempt acknowledgement";
});

check("buildSystemPrompt: the hint ceiling caps the stated permitted level", () => {
  const p = claude.buildSystemPrompt({ mode: "learn", hintCeiling: 2, hintLevel: 4 });
  return /up to help LEVEL 2/.test(p) ? true : "ceiling not enforced in prompt";
});

check("buildSystemPrompt: hintLevel also caps it (never releases more than asked)", () => {
  const p = claude.buildSystemPrompt({ mode: "learn", hintCeiling: 4, hintLevel: 1 });
  return /up to help LEVEL 1/.test(p) ? true : "hintLevel not respected";
});

check("buildSystemPrompt: check mode answers directly and does not lecture", () => {
  const p = claude.buildSystemPrompt({ mode: "check" });
  return /Answer directly/i.test(p) && /does not count/i.test(p)
    ? true
    : "check mode prompt wrong";
});

check("buildSystemPrompt: a red AI policy forbids drafting submittable text", () => {
  const p = claude.buildSystemPrompt({ mode: "learn", aiPolicy: "red" });
  return /must not draft, write or compose/i.test(p) ? true : "red policy not enforced";
});

check("buildSystemPrompt: a non-English language keeps technical terms in English", () => {
  const p = claude.buildSystemPrompt({ mode: "learn", language: "zu" });
  return /isiZulu/.test(p) && /terminology in English/i.test(p)
    ? true
    : "language instruction wrong";
});

check("buildSystemPrompt: low-data mode asks for short answers", () => {
  const p = claude.buildSystemPrompt({ mode: "learn", lowData: true });
  return /LOW DATA MODE/.test(p) && /under 120 words/.test(p)
    ? true
    : "low data instruction missing";
});

check("buildSystemPrompt: the learner snapshot is injected when present", () => {
  const p = claude.buildSystemPrompt({ mode: "learn", learnerSnapshot: "WEAK SKILLS: recursion" });
  return p.includes("WEAK SKILLS: recursion") ? true : "snapshot not injected";
});

check("buildSystemPrompt: defaults to learn mode when none is given", () => {
  const p = claude.buildSystemPrompt({});
  return /MODE: LEARN/.test(p) ? true : "default mode is not learn";
});

check("selectModel: premium tiers get Opus 5, others Sonnet 5", () => {
  const checks = [
    ["free", "claude-sonnet-5"],
    ["basic", "claude-sonnet-5"],
    ["premium", "claude-opus-5"],
    ["elite", "claude-opus-5"],
  ];
  for (const [tier, expected] of checks) {
    const got = claude.selectModel({ userTier: tier });
    if (got !== expected) return `${tier} -> ${got}, expected ${expected}`;
  }
  return true;
});

check("selectModel: model ids carry no date suffix", () => {
  for (const tier of ["free", "premium"]) {
    const id = claude.selectModel({ userTier: tier });
    if (/-\d{8}$/.test(id)) return `${id} has a date suffix`;
  }
  return true;
});

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

console.log("");
console.log(`  ${pass} passed, ${failures.length} failed`);
console.log("");

if (failures.length > 0) {
  for (const f of failures) {
    console.log(`  FAIL  ${f.name}`);
    console.log(`        ${f.detail}`);
  }
  console.log("");
  process.exit(1);
}
