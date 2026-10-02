"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  X,
  Sparkles,
  Send,
  Trash2,
  Bot,
  Calculator,
  Copy,
  Check,
  GraduationCap,
  Zap,
  HelpCircle,
  Lock,
  PencilLine,
  Signal,
  ShieldCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { cn, errorMessage } from "@/lib/utils";
import {
  streamChatResponse,
  modelLabel,
  LANGUAGES,
  AI_POLICY_LABELS,
  type ChatMessage,
  type ClaudeOptions,
  type TutorMode,
  type ExplanationLanguage,
  type AiPolicy,
} from "@/lib/claude";
import {
  useLearnerModel,
  learnerSnapshot,
  hintCeilingFor,
  masteryOf,
  listSkills,
  recordHelp,
  recordExplainBack,
  recordAttempt,
  skillIdFor,
  HINT_LADDER,
  type HintLevel,
} from "@/lib/learner-model";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
  /** Help level this assistant turn was released at. */
  hintLevel?: HintLevel;
}

// ---------------------------------------------------------------------------
// Scientific Calculator
// ---------------------------------------------------------------------------

const SCI_BUTTONS = [
  ["sin", "cos", "tan", "π"],
  ["log", "ln", "√", "^"],
  ["(", ")", "%", "÷"],
  ["7", "8", "9", "×"],
  ["4", "5", "6", "−"],
  ["1", "2", "3", "+"],
  ["0", ".", "⌫", "="],
];

function ScientificCalculator() {
  const [display, setDisplay] = useState("0");
  const [expression, setExpression] = useState("");
  const [justEvaluated, setJustEvaluated] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleButton = (val: string) => {
    if (val === "=") {
      try {
        // Replace display symbols with JS-evaluable equivalents
        const expr = expression
          .replace(/÷/g, "/")
          .replace(/×/g, "*")
          .replace(/−/g, "-")
          .replace(/π/g, String(Math.PI))
          .replace(/√\(([^)]+)\)/g, "Math.sqrt($1)")
          .replace(/√(\d+)/g, "Math.sqrt($1)")
          .replace(/sin\(/g, "Math.sin(")
          .replace(/cos\(/g, "Math.cos(")
          .replace(/tan\(/g, "Math.tan(")
          .replace(/log\(/g, "Math.log10(")
          .replace(/ln\(/g, "Math.log(")
          .replace(/\^/g, "**");
        // eslint-disable-next-line no-eval
        const result = eval(expr);
        const formatted = Number.isInteger(result)
          ? result.toString()
          : parseFloat(result.toFixed(10)).toString();
        setDisplay(formatted);
        setExpression(formatted);
        setJustEvaluated(true);
      } catch {
        setDisplay("Error");
        setExpression("");
        setJustEvaluated(true);
      }
      return;
    }

    if (val === "⌫") {
      const next = expression.slice(0, -1) || "0";
      setExpression(next === "0" ? "" : next);
      setDisplay(next || "0");
      setJustEvaluated(false);
      return;
    }

    const funcVals = ["sin", "cos", "tan", "log", "ln", "√"];
    const isFunc = funcVals.includes(val);

    if (justEvaluated && !isFunc && !["+", "−", "×", "÷", "^"].includes(val)) {
      setExpression(val === "π" ? val : val);
      setDisplay(val === "π" ? "π" : val);
      setJustEvaluated(false);
      return;
    }

    const next = (justEvaluated ? "" : expression) + (isFunc ? `${val}(` : val);
    setExpression(next);
    setDisplay(next || "0");
    setJustEvaluated(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(display);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const buttonColor = (val: string) => {
    if (val === "=") return "bg-primary text-white hover:bg-blue-500 shadow-lg shadow-primary/30";
    if (["÷", "×", "−", "+", "^", "%"].includes(val))
      return "bg-blue-50 dark:bg-blue-900/20 text-primary font-bold border border-blue-100 dark:border-blue-900/30 hover:bg-blue-100";
    if (["sin", "cos", "tan", "log", "ln", "√", "π", "(", ")"].includes(val))
      return "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs hover:bg-slate-200 dark:hover:bg-slate-600";
    if (val === "⌫")
      return "bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100";
    return "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-700 hover:bg-slate-50";
  };

  return (
    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
      {/* Display */}
      <div className="bg-slate-900 dark:bg-slate-950 rounded-xl p-4 mb-4 min-h-[72px] flex flex-col justify-end items-end relative overflow-hidden">
        <div className="absolute top-2 left-3 text-[10px] font-black uppercase tracking-widest text-slate-500">
          Calculator
        </div>
        <p className="text-slate-400 text-xs font-mono truncate w-full text-right pr-6">
          {expression || "0"}
        </p>
        <p className="text-white text-2xl font-bold font-mono truncate w-full text-right">
          {display}
        </p>
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 text-slate-500 hover:text-white transition-colors"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-4 gap-1.5">
        {SCI_BUTTONS.flat().map((btn, i) => (
          <button
            key={`${btn}-${i}`}
            onClick={() => handleButton(btn)}
            className={cn(
              "h-10 rounded-lg text-sm font-bold transition-all active:scale-95",
              buttonColor(btn)
            )}
          >
            {btn}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Markdown renderer
// ---------------------------------------------------------------------------

function StreamingMessage({ content }: { content: string }) {
  return (
    <div className="prose dark:prose-invert prose-sm font-medium tracking-tight overflow-x-auto max-w-none">
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main AI Tutor Chat
// ---------------------------------------------------------------------------

const MODE_COPY: Record<TutorMode, { label: string; icon: typeof GraduationCap; blurb: string }> = {
  learn: {
    label: "Learn",
    icon: GraduationCap,
    blurb: "Withholds answers. Counts toward your mastery record.",
  },
  check: {
    label: "Check",
    icon: Zap,
    blurb: "Answers directly. Does not count toward mastery.",
  },
};

const LEARN_OPENER =
  "I'm your tutor, and I'm in **Learn mode** — which means I won't hand you answers. That's on purpose: students who attempt something first and *then* use AI remember substantially more than students who read a finished answer.\n\nAsk me anything from your coursework. I'll ask what you've got first.";

/** Per-module AI policy, set by the student on the Work log page. */
const POLICY_STORAGE_KEY = "studydesk.module-ai-policy.v1";

function readPolicy(moduleId: string): AiPolicy {
  if (typeof window === "undefined") return "green";
  try {
    const map = JSON.parse(window.localStorage.getItem(POLICY_STORAGE_KEY) || "{}");
    const value = map?.[moduleId];
    return value === "amber" || value === "red" ? value : "green";
  } catch {
    return "green";
  }
}

export function AITutorChat({
  moduleId = "global",
  subject = "",
  userTier = "free",
  aiPolicy: aiPolicyProp,
}: {
  moduleId?: string;
  subject?: string;
  userTier?: "free" | "basic" | "premium" | "elite";
  aiPolicy?: AiPolicy;
}) {
  const model = useLearnerModel();

  // The stored per-module policy wins unless a caller passes one explicitly.
  const [storedPolicy, setStoredPolicy] = useState<AiPolicy>("green");
  useEffect(() => setStoredPolicy(readPolicy(moduleId)), [moduleId]);
  const aiPolicy = aiPolicyProp ?? storedPolicy;

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "calculator">("chat");
  const [messages, setMessages] = useState<Message[]>([
    { id: "0", role: "assistant", content: LEARN_OPENER },
  ]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  // Pedagogy state
  const [mode, setMode] = useState<TutorMode>("learn");
  const [language, setLanguage] = useState<ExplanationLanguage>("en");
  const [lowData, setLowData] = useState(false);
  const [topic, setTopic] = useState("");
  const [hintLevel, setHintLevel] = useState<HintLevel>(0);
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const [attempt, setAttempt] = useState("");
  const [submittedAttempt, setSubmittedAttempt] = useState("");
  const [explainBack, setExplainBack] = useState("");
  const [needsExplainBack, setNeedsExplainBack] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  // A red-policy module cannot use Check mode at all.
  const checkAllowed = aiPolicy === "green";

  useEffect(() => {
    if (!checkAllowed && mode === "check") setMode("learn");
  }, [checkAllowed, mode]);

  const knownSkills = useMemo(() => listSkills(model, moduleId), [model, moduleId]);
  const activeTopic = topic || subject || "General";

  const mastery = useMemo(
    () => masteryOf(model, moduleId, activeTopic),
    [model, moduleId, activeTopic]
  );
  const ceiling = hintCeilingFor(mastery);
  const snapshot = useMemo(
    () => learnerSnapshot(model, moduleId, activeTopic),
    [model, moduleId, activeTopic]
  );

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming, pendingQuestion, needsExplainBack, scrollToBottom]);

  const baseOptions = useCallback(
    (overrides: Partial<ClaudeOptions> = {}): ClaudeOptions => ({
      userTier,
      subject,
      mode,
      language,
      lowData,
      aiPolicy,
      learnerSnapshot: snapshot,
      hintCeiling: ceiling,
      moduleContext:
        moduleId !== "global" ? `Student is studying module ${moduleId}` : undefined,
      ...overrides,
    }),
    [userTier, subject, mode, language, lowData, aiPolicy, snapshot, ceiling, moduleId]
  );

  /** Push a streaming assistant turn and run it. */
  const run = useCallback(
    async (history: ChatMessage[], options: ClaudeOptions, level: HintLevel) => {
      const assistantId = `${Date.now()}-a`;
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "", streaming: true, hintLevel: level },
      ]);
      setIsStreaming(true);

      try {
        let accumulated = "";
        await streamChatResponse(
          history,
          options,
          (chunk) => {
            accumulated += chunk;
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantId ? { ...m, content: accumulated } : m))
            );
            scrollToBottom();
          },
          () => {
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantId ? { ...m, streaming: false } : m))
            );
            setIsStreaming(false);
          }
        );
      } catch (err: unknown) {
        const message = errorMessage(err, "Could not reach the tutor. Try again.");
        const errorMsg = message.includes("not configured")
          ? "⚠️ **API key required** — add your `ANTHROPIC_API_KEY` to `.env.local` and restart the dev server."
          : `⚠️ **Error:** ${message}`;

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: errorMsg, streaming: false } : m
          )
        );
        setIsStreaming(false);
      }
    },
    [scrollToBottom]
  );

  const historyFor = useCallback(
    (extra: ChatMessage[]) =>
      [
        ...messages
          .filter((m) => !m.streaming && m.id !== "0")
          .map((m) => ({ role: m.role, content: m.content }) as ChatMessage),
        ...extra,
      ].slice(-12),
    [messages]
  );

  // -------------------------------------------------------------------------
  // Send
  // -------------------------------------------------------------------------

  const handleSend = async () => {
    const question = input.trim();
    if (!question || isStreaming) return;

    setInput("");
    setMessages((prev) => [...prev, { id: `${Date.now()}-u`, role: "user", content: question }]);

    if (mode === "check") {
      recordHelp({
        skillId: skillIdFor(moduleId, activeTopic),
        moduleId,
        mode: "check",
        hintLevel: 4,
        attemptFirst: false,
        explainedBack: false,
        question,
      });

      await run(historyFor([{ role: "user", content: question }]), baseOptions(), 4);
      return;
    }

    // Learn mode: gate on an attempt before any help is released.
    setPendingQuestion(question);
    setHintLevel(0);
    setSubmittedAttempt("");
    setAttempt("");
    setMessages((prev) => [
      ...prev,
      {
        id: `${Date.now()}-gate`,
        role: "assistant",
        content:
          "Before I help — **what have you got so far, or where exactly do you get stuck?** Even one line is enough. I'll work from your reasoning rather than talking over it.",
        hintLevel: 0,
      },
    ]);
  };

  // -------------------------------------------------------------------------
  // Attempt → first hint
  // -------------------------------------------------------------------------

  const submitAttempt = async () => {
    const text = attempt.trim();
    if (text.length < 4 || !pendingQuestion || isStreaming) return;

    setSubmittedAttempt(text);
    setAttempt("");
    setMessages((prev) => [...prev, { id: `${Date.now()}-at`, role: "user", content: text }]);

    const level: HintLevel = 1;
    setHintLevel(level);

    recordHelp({
      skillId: skillIdFor(moduleId, activeTopic),
      moduleId,
      mode: "learn",
      hintLevel: level,
      attemptFirst: true,
      explainedBack: false,
      question: pendingQuestion,
    });

    await run(
      historyFor([
        { role: "user", content: `My question: ${pendingQuestion}\n\nMy attempt: ${text}` },
      ]),
      baseOptions({ hintLevel: level, attemptFirst: true, studentAttempt: text }),
      level
    );
  };

  /** Skip the attempt. Allowed, but logged honestly and capped at level 1. */
  const skipAttempt = async () => {
    if (!pendingQuestion || isStreaming) return;

    const level: HintLevel = 1;
    setHintLevel(level);
    setSubmittedAttempt("");

    recordHelp({
      skillId: skillIdFor(moduleId, activeTopic),
      moduleId,
      mode: "learn",
      hintLevel: level,
      attemptFirst: false,
      explainedBack: false,
      question: pendingQuestion,
    });

    setMessages((prev) => [
      ...prev,
      { id: `${Date.now()}-skip`, role: "user", content: "I don't know where to start." },
    ]);

    await run(
      historyFor([
        {
          role: "user",
          content: `My question: ${pendingQuestion}\n\nI genuinely don't know where to start.`,
        },
      ]),
      baseOptions({ hintLevel: level, attemptFirst: false }),
      level
    );
  };

  // -------------------------------------------------------------------------
  // Escalate
  // -------------------------------------------------------------------------

  const escalate = async () => {
    if (!pendingQuestion || isStreaming) return;

    const next = Math.min(hintLevel + 1, ceiling) as HintLevel;
    if (next === hintLevel) return;

    setHintLevel(next);

    recordHelp({
      skillId: skillIdFor(moduleId, activeTopic),
      moduleId,
      mode: "learn",
      hintLevel: next,
      attemptFirst: submittedAttempt.length > 0,
      explainedBack: false,
      question: pendingQuestion,
    });

    if (next === 4) setNeedsExplainBack(true);

    setMessages((prev) => [
      ...prev,
      {
        id: `${Date.now()}-esc`,
        role: "user",
        content: `I'm still stuck. Give me help level ${next}: ${HINT_LADDER[next as 1 | 2 | 3 | 4].label}.`,
      },
    ]);

    await run(
      historyFor([
        {
          role: "user",
          content: `I'm still stuck. Release help level ${next} (${HINT_LADDER[next as 1 | 2 | 3 | 4].label}) and no more.`,
        },
      ]),
      baseOptions({
        hintLevel: next,
        attemptFirst: submittedAttempt.length > 0,
        studentAttempt: submittedAttempt || undefined,
      }),
      next
    );
  };

  // -------------------------------------------------------------------------
  // Explain-back closes the loop
  // -------------------------------------------------------------------------

  const submitExplainBack = async () => {
    const text = explainBack.trim();
    if (text.length < 4 || isStreaming) return;

    setExplainBack("");
    setNeedsExplainBack(false);
    setMessages((prev) => [...prev, { id: `${Date.now()}-eb`, role: "user", content: text }]);

    recordExplainBack(skillIdFor(moduleId, activeTopic));

    // A full solution that was explained back is weak evidence of partial
    // mastery - recorded at low weight, with the hint level attached so the
    // scheduler treats it as a hard review rather than a clean success.
    recordAttempt({
      moduleId,
      topic: activeTopic,
      score: 0.5,
      hintLevel: 4,
    });

    await run(
      historyFor([
        {
          role: "user",
          content: `Here is my explanation of why that step works: ${text}\n\nTell me in two sentences whether my explanation is right, and name the one thing I still have wrong if anything.`,
        },
      ]),
      baseOptions({ hintLevel: 4, attemptFirst: true, mode: "check" }),
      4
    );

    setPendingQuestion(null);
    setHintLevel(0);
  };

  const clearHistory = () => {
    setMessages([{ id: "0", role: "assistant", content: LEARN_OPENER }]);
    setPendingQuestion(null);
    setHintLevel(0);
    setAttempt("");
    setSubmittedAttempt("");
    setNeedsExplainBack(false);
    setExplainBack("");
  };

  const awaitingAttempt = mode === "learn" && pendingQuestion !== null && hintLevel === 0;
  const canEscalate =
    mode === "learn" && pendingQuestion !== null && hintLevel > 0 && hintLevel < ceiling;
  const nextLevel = Math.min(hintLevel + 1, 4) as 1 | 2 | 3 | 4;

  return (
    <>
      {/* Floating trigger */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 md:bottom-8 right-6 md:right-8 w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center shadow-2xl hover:shadow-primary/40 hover:-translate-y-2 active:scale-95 transition-all z-[100] group"
        title="Open AI Tutor"
      >
        <Sparkles size={28} className="group-hover:rotate-12 transition-transform" />
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full shadow-sm animate-pulse" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/10 z-[100] lg:hidden"
            />

            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
              className="fixed top-0 right-0 h-full w-full sm:w-[460px] bg-white dark:bg-slate-900 shadow-[-20px_0_60px_-15px_rgba(0,0,0,0.12)] border-l border-slate-100 dark:border-slate-800 z-[110] flex flex-col overflow-hidden"
            >
              {/* Header */}
              <header className="p-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center border border-primary/20">
                      <Bot size={22} />
                    </div>
                    <div>
                      <h2 className="text-base font-black tracking-tight">AI Smart Tutor</h2>
                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                        {modelLabel({ userTier })}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors"
                    aria-label="Close tutor"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Mode switch - the core of the product */}
                <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 gap-1 mb-3">
                  {(["learn", "check"] as const).map((value) => {
                    const Icon = MODE_COPY[value].icon;
                    const disabled = value === "check" && !checkAllowed;
                    return (
                      <button
                        key={value}
                        onClick={() => !disabled && setMode(value)}
                        disabled={disabled}
                        title={
                          disabled
                            ? "This module's AI policy does not permit direct answers."
                            : MODE_COPY[value].blurb
                        }
                        className={cn(
                          "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all",
                          mode === value
                            ? "bg-white dark:bg-slate-900 text-primary shadow-sm"
                            : "text-slate-400 hover:text-slate-600",
                          disabled && "opacity-40 cursor-not-allowed"
                        )}
                      >
                        {disabled ? <Lock size={13} /> : <Icon size={14} />}
                        {MODE_COPY[value].label}
                      </button>
                    );
                  })}
                </div>

                <p
                  className={cn(
                    "px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2",
                    mode === "learn"
                      ? "bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400"
                      : "bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400"
                  )}
                >
                  <ShieldCheck size={14} className="shrink-0" />
                  {MODE_COPY[mode].blurb}
                </p>

                {/* Context + controls */}
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <select
                    value={topic}
                    onChange={(event) => setTopic(event.target.value)}
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-2 text-[11px] font-bold outline-none focus:ring-2 focus:ring-primary/20 truncate"
                    aria-label="Topic"
                  >
                    <option value="">{subject ? `Topic: ${subject}` : "Topic: General"}</option>
                    {knownSkills.map((skill) => (
                      <option key={skill.id} value={skill.name}>
                        {skill.name} · {(skill.mastery * 100).toFixed(0)}%
                      </option>
                    ))}
                  </select>

                  <select
                    value={language}
                    onChange={(event) => setLanguage(event.target.value as ExplanationLanguage)}
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-2 text-[11px] font-bold outline-none focus:ring-2 focus:ring-primary/20"
                    aria-label="Explanation language"
                  >
                    {(Object.keys(LANGUAGES) as ExplanationLanguage[]).map((code) => (
                      <option key={code} value={code}>
                        {LANGUAGES[code]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between mt-3 gap-3">
                  <button
                    onClick={() => setLowData((value) => !value)}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors",
                      lowData
                        ? "bg-primary/10 text-primary"
                        : "text-slate-400 hover:text-slate-600"
                    )}
                    title="Shorter answers, less data used"
                  >
                    <Signal size={13} />
                    Low data {lowData ? "on" : "off"}
                  </button>

                  {mode === "learn" && (
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Help up to level {ceiling}
                      {ceiling < 4 ? " · scaffold faded" : ""}
                    </span>
                  )}
                </div>

                {aiPolicy !== "green" && (
                  <p className="mt-3 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-[10px] font-bold text-slate-600 dark:text-slate-300">
                    {AI_POLICY_LABELS[aiPolicy].label}: {AI_POLICY_LABELS[aiPolicy].detail}
                  </p>
                )}

                {/* Tabs */}
                <div className="flex mt-3 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 gap-1">
                  {(["chat", "calculator"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all",
                        activeTab === tab
                          ? "bg-white dark:bg-slate-900 text-primary shadow-sm"
                          : "text-slate-400 hover:text-slate-600"
                      )}
                    >
                      {tab === "chat" ? <Bot size={14} /> : <Calculator size={14} />}
                      {tab}
                    </button>
                  ))}
                </div>
              </header>

              {activeTab === "chat" && (
                <>
                  <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-hide">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex flex-col gap-1.5 max-w-[90%] animate-in fade-in slide-in-from-bottom-2",
                          msg.role === "user" ? "ml-auto items-end" : "items-start"
                        )}
                      >
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                          {msg.role === "user"
                            ? "Me"
                            : msg.hintLevel && msg.hintLevel > 0
                              ? `Tutor · level ${msg.hintLevel} ${HINT_LADDER[msg.hintLevel as 1 | 2 | 3 | 4].label}`
                              : "Tutor"}
                        </p>
                        <div
                          className={cn(
                            "p-4 rounded-2xl shadow-sm border text-sm",
                            msg.role === "user"
                              ? "bg-primary text-white border-primary/20 rounded-tr-none"
                              : "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-100 dark:border-slate-700 rounded-tl-none"
                          )}
                        >
                          {msg.role === "user" ? (
                            <p className="font-medium !text-white whitespace-pre-wrap">{msg.content}</p>
                          ) : msg.content ? (
                            <StreamingMessage content={msg.content} />
                          ) : null}

                          {msg.streaming && !msg.content && (
                            <div className="flex gap-1.5 items-center h-5">
                              {[0, 0.2, 0.4].map((delay) => (
                                <motion.div
                                  key={delay}
                                  animate={{ scale: [1, 1.4, 1] }}
                                  transition={{ repeat: Infinity, duration: 0.9, delay }}
                                  className="w-1.5 h-1.5 rounded-full bg-primary"
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Footer: attempt gate, escalation, explain-back, or input */}
                  <footer className="p-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
                    {awaitingAttempt ? (
                      <div className="space-y-3">
                        <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
                          <PencilLine size={14} />
                          Your attempt unlocks the first hint
                        </p>
                        <textarea
                          value={attempt}
                          onChange={(event) => setAttempt(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" && !event.shiftKey) {
                              event.preventDefault();
                              submitAttempt();
                            }
                          }}
                          placeholder="What have you tried, or what's the part you can't get past?"
                          rows={3}
                          autoFocus
                          className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-primary/20 rounded-xl p-3 outline-none focus:border-primary/40 resize-none font-semibold text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={submitAttempt}
                            disabled={attempt.trim().length < 4}
                            className="flex-1 py-3 bg-primary text-white rounded-xl font-black uppercase tracking-widest text-[10px] disabled:opacity-40 transition-all"
                          >
                            Submit my attempt
                          </button>
                          <button
                            onClick={skipAttempt}
                            className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
                            title="Logged honestly in your work log"
                          >
                            Truly stuck
                          </button>
                        </div>
                      </div>
                    ) : needsExplainBack ? (
                      <div className="space-y-3">
                        <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-600">
                          <HelpCircle size={14} />
                          One sentence back, then we&apos;re done
                        </p>
                        <textarea
                          value={explainBack}
                          onChange={(event) => setExplainBack(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" && !event.shiftKey) {
                              event.preventDefault();
                              submitExplainBack();
                            }
                          }}
                          placeholder="In your own words: why does that step work?"
                          rows={2}
                          autoFocus
                          className="w-full bg-amber-50 dark:bg-amber-900/10 border-2 border-amber-200 dark:border-amber-900/30 rounded-xl p-3 outline-none resize-none font-semibold text-sm text-slate-800 dark:text-slate-100 placeholder:text-amber-700/40"
                        />
                        <button
                          onClick={submitExplainBack}
                          disabled={explainBack.trim().length < 4}
                          className="w-full py-3 bg-amber-500 text-white rounded-xl font-black uppercase tracking-widest text-[10px] disabled:opacity-40"
                        >
                          Check my explanation
                        </button>
                      </div>
                    ) : (
                      <>
                        {canEscalate && (
                          <button
                            onClick={escalate}
                            disabled={isStreaming}
                            className="w-full mb-3 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-black uppercase tracking-widest text-[10px] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
                          >
                            <HelpCircle size={14} />
                            Still stuck · unlock level {nextLevel}: {HINT_LADDER[nextLevel].label}
                          </button>
                        )}

                        {mode === "learn" && pendingQuestion && hintLevel >= ceiling && (
                          <p className="mb-3 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-[10px] font-bold text-slate-500 text-center">
                            You&apos;ve proved this topic before ({(mastery * 100).toFixed(0)}% mastery), so
                            I&apos;m holding at level {ceiling}. Switch to Check mode if you need the answer.
                          </p>
                        )}

                        <div
                          className={cn(
                            "bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl border-2 transition-all flex items-end gap-3",
                            isStreaming
                              ? "border-primary/20"
                              : "border-transparent focus-within:border-primary/30"
                          )}
                        >
                          <button
                            onClick={clearHistory}
                            className="p-2 text-slate-300 hover:text-red-400 transition-colors shrink-0"
                            title="Clear chat"
                          >
                            <Trash2 size={20} />
                          </button>
                          <textarea
                            value={input}
                            onChange={(event) => setInput(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" && !event.shiftKey) {
                                event.preventDefault();
                                handleSend();
                              }
                            }}
                            placeholder={
                              mode === "learn"
                                ? "Ask a question — I'll ask what you've got first..."
                                : "Ask for a direct answer..."
                            }
                            rows={2}
                            className="flex-1 bg-transparent border-none outline-none resize-none font-semibold text-sm placeholder:text-slate-400 text-slate-800 dark:text-slate-100"
                          />
                          <button
                            onClick={handleSend}
                            disabled={isStreaming || !input.trim()}
                            className={cn(
                              "w-10 h-10 text-white rounded-xl shadow-md transition-all flex items-center justify-center shrink-0",
                              isStreaming
                                ? "bg-primary/80 cursor-wait"
                                : "bg-primary hover:shadow-primary/30 active:scale-90",
                              !input.trim() && !isStreaming && "opacity-40 cursor-not-allowed"
                            )}
                            aria-label="Send"
                          >
                            <Send size={18} />
                          </button>
                        </div>
                      </>
                    )}
                  </footer>
                </>
              )}

              {activeTab === "calculator" && (
                <div className="flex-1 overflow-y-auto p-5">
                  <ScientificCalculator />
                  <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-4">
                    Scientific Calculator · For Maths &amp; Science Work
                  </p>
                </div>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
