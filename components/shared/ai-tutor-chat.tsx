"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  X,
  Sparkles,
  Send,
  Trash2,
  Info,
  Bot,
  Calculator,
  ChevronDown,
  Copy,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { cn } from "@/lib/utils";
import { streamChatResponse, ChatMessage, ClaudeOptions } from "@/lib/claude";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
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
// Typewriter component for streaming
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
// Main AI Tutor Chat Component
// ---------------------------------------------------------------------------

const PROMPT_CHIPS = [
  "Summarise this topic",
  "Give me an example",
  "Explain step by step",
  "Test me on this",
  "Help me with a formula",
];

export function AITutorChat({
  moduleId = "global",
  subject = "",
  userTier = "free",
}: {
  moduleId?: string;
  subject?: string;
  userTier?: "free" | "basic" | "premium" | "elite";
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "calculator">("chat");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "0",
      role: "assistant",
      content:
        "Hello! I'm your **AI Academic Tutor**, powered by Claude. Ask me anything about your coursework — I can explain concepts, solve equations step-by-step, and quiz you.\n\nFor maths and science, I'll render formulas like $E = mc^2$ beautifully. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming, scrollToBottom]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;

    const userContent = input.trim();
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userContent,
    };

    // Anthropic requires the first message to be "user". 
    // If our history starts with the assistant greeting, we skip it for the API call.
    const history: ChatMessage[] = messages
      .filter((m) => !m.streaming)
      .map((m) => ({ role: m.role, content: m.content }));

    if (history.length > 0 && history[0].role === "assistant") {
      history.shift();
    }

    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    // Add placeholder assistant message for streaming
    const assistantId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: "assistant", content: "", streaming: true },
    ]);
    setIsStreaming(true);

    const options: ClaudeOptions = {
      userTier,
      subject,
      moduleContext:
        moduleId !== "global" ? `Student is studying module ID: ${moduleId}` : undefined,
    };

    try {
      let accumulated = "";

      await streamChatResponse(
        [...history, { role: "user", content: userContent }],
        options,
        (chunk) => {
          accumulated += chunk;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: accumulated } : m
            )
          );
          scrollToBottom();
        },
        () => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, streaming: false } : m
            )
          );
          setIsStreaming(false);
        }
      );
    } catch (err: any) {
      // Fallback: show error message
      const errorMsg =
        err.message?.includes("not configured")
          ? "⚠️ **API Key Required** — Add your `ANTHROPIC_API_KEY` to `.env.local` to enable AI responses."
          : `⚠️ **Error:** ${err.message || "Failed to get AI response. Please try again."}`;

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: errorMsg, streaming: false }
            : m
        )
      );
      setIsStreaming(false);
    }
  };

  const clearHistory = () => {
    setMessages([
      {
        id: "0",
        role: "assistant",
        content: "Chat cleared. What would you like to study?",
      },
    ]);
  };

  const isElite = userTier === "elite";
  const modelLabel = isElite ? "Claude Opus 4.1" : "Claude Sonnet 4";

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center shadow-2xl hover:shadow-primary/40 hover:-translate-y-2 active:scale-95 transition-all z-[100] group"
        title="Open AI Tutor"
      >
        <Sparkles size={28} className="group-hover:rotate-12 transition-transform" />
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full shadow-sm animate-pulse" />
      </button>

      {/* Chat / Calculator Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Mobile backdrop */}
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
              className="fixed top-0 right-0 h-full w-full sm:w-[440px] bg-white dark:bg-slate-900 shadow-[-20px_0_60px_-15px_rgba(0,0,0,0.12)] border-l border-slate-100 dark:border-slate-800 z-[110] flex flex-col overflow-hidden"
            >
              {/* Header */}
              <header className="p-5 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center border border-primary/20">
                      <Bot size={22} />
                    </div>
                    <div>
                      <h2 className="text-base font-black tracking-tight">AI Smart Tutor</h2>
                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                        {modelLabel} · Active
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Context badge */}
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 rounded-xl">
                  <Info size={14} className="text-primary shrink-0" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 truncate">
                    {subject
                      ? `Subject: ${subject}`
                      : moduleId !== "global"
                      ? `Module ${moduleId} loaded`
                      : "Active workspace context"}
                  </span>
                </div>

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

              {/* Chat Tab */}
              {activeTab === "chat" && (
                <>
                  <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-hide"
                  >
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex flex-col gap-1.5 max-w-[88%] animate-in fade-in slide-in-from-bottom-2",
                          msg.role === "user" ? "ml-auto items-end" : "items-start"
                        )}
                      >
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                          {msg.role === "user" ? "Me" : "AI Tutor"}
                        </p>
                        <div
                          className={cn(
                            "p-4 rounded-2xl shadow-sm border text-sm",
                            msg.role === "user"
                              ? "bg-primary text-white border-primary/20 rounded-tr-none shadow-primary/10"
                              : "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-100 dark:border-slate-700 rounded-tl-none"
                          )}
                        >
                          {msg.role === "user" ? (
                            <p className="font-medium">{msg.content}</p>
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

                  {/* Input footer */}
                  <footer className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                    {/* Prompt chips */}
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3">
                      {PROMPT_CHIPS.map((chip) => (
                        <button
                          key={chip}
                          onClick={() => setInput(chip)}
                          className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border-2 border-transparent hover:border-primary/20 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap transition-all"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl border-2 border-transparent focus-within:border-primary/30 transition-all flex items-end gap-3">
                      <button
                        onClick={clearHistory}
                        className="p-2 text-slate-300 hover:text-red-400 transition-colors shrink-0"
                        title="Clear chat"
                      >
                        <Trash2 size={20} />
                      </button>
                      <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                          }
                        }}
                        placeholder="Ask anything about your coursework..."
                        rows={2}
                        disabled={isStreaming}
                        className="flex-1 bg-transparent border-none outline-none resize-none font-semibold text-sm placeholder:text-slate-300 disabled:opacity-50"
                      />
                      <button
                        onClick={handleSend}
                        disabled={isStreaming || !input.trim()}
                        className="w-10 h-10 bg-primary text-white rounded-xl shadow-md hover:shadow-primary/30 active:scale-90 transition-all flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Send size={18} />
                      </button>
                    </div>
                  </footer>
                </>
              )}

              {/* Calculator Tab */}
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
