"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Bot,
  User,
  Sparkles,
  BookOpen,
  X,
  RotateCcw,
  Copy,
  Check,
  FlaskConical,
  Scale,
  Calculator,
  Atom,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { streamChatResponse, type ChatMessage, type ClaudeOptions } from "@/lib/claude";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

const QUICK_PROMPTS = [
  { icon: BookOpen, label: "Explain a concept", prompt: "Explain the key concepts of " },
  { icon: Calculator, label: "Solve a problem", prompt: "Help me solve this step-by-step: " },
  { icon: FlaskConical, label: "Summarise notes", prompt: "Summarise the following into key points: " },
  { icon: Scale, label: "Compare topics", prompt: "Compare and contrast " },
  { icon: Atom, label: "Exam prep", prompt: "Give me 5 likely exam questions and model answers for: " },
  { icon: RotateCcw, label: "Simplify this", prompt: "Simplify this for a first-year student: " },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-100 rounded transition-all text-slate-400 hover:text-slate-700"
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
    </button>
  );
}

export default function AITutorPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const options: ClaudeOptions = {
    userTier: "basic",
    subject: subject || undefined,
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text: string) => {
    const userMsg = text.trim();
    if (!userMsg || loading) return;

    const updated: ChatMessage[] = [...messages, { role: "user", content: userMsg }];
    setMessages(updated);
    setInput("");
    setLoading(true);

    let assistantText = "";
    const placeholder: ChatMessage = { role: "assistant", content: "" };
    setMessages([...updated, placeholder]);

    try {
      await streamChatResponse(
        updated,
        options,
        (chunk) => {
          assistantText += chunk;
          setMessages([...updated, { role: "assistant", content: assistantText }]);
        },
        () => {
          setLoading(false);
        }
      );
    } catch (err: any) {
      setMessages([
        ...updated,
        {
          role: "assistant",
          content: `Warning: **Error:** ${err.message || "Failed to get response. Check your Anthropic API key."}`,
        },
      ]);
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-9rem)] max-h-[900px]">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h1 className="text-4xl font-black tracking-tight italic underline decoration-primary decoration-4 uppercase">
            AI Tutor
          </h1>
          <p className="text-slate-500 font-bold mt-1 flex items-center gap-2">
            <Sparkles size={14} className="text-primary" />
            Powered by Claude - your 24/7 academic co-pilot
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Set subject (e.g. Calculus)..."
            className="px-4 py-2 bg-white border-2 border-slate-100 rounded-xl text-sm font-bold focus:border-primary focus:outline-none transition-colors w-56"
          />
          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              className="p-2 bg-white border-2 border-slate-100 rounded-xl text-slate-500 hover:text-red-500 hover:border-red-200 transition-all"
              title="Clear chat"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 pr-2 pb-4 min-h-0">
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="h-full flex flex-col items-center justify-center gap-10 text-center"
          >
            <div className="space-y-4">
              <div className="mx-auto w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center">
                <Bot size={40} className="text-primary" />
              </div>
              <h2 className="text-2xl font-black uppercase tracking-tight">
                Ask me anything, Scholar
              </h2>
              <p className="text-slate-500 font-bold max-w-md">
                I can explain concepts, solve problems, generate exam questions, summarise notes,
                and much more - in any subject.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full max-w-2xl">
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => setInput(p.prompt)}
                  className="flex items-center gap-3 p-4 bg-white border-2 border-slate-100 rounded-xl text-left hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all group"
                >
                  <p.icon
                    size={18}
                    className="text-primary shrink-0 group-hover:scale-110 transition-transform"
                  />
                  <span className="text-sm font-black text-slate-700">{p.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={cn("flex gap-4 group", m.role === "user" ? "justify-end" : "justify-start")}
            >
              {m.role === "assistant" && (
                <div className="w-9 h-9 shrink-0 bg-primary/10 text-primary rounded-xl flex items-center justify-center mt-1">
                  <Bot size={18} />
                </div>
              )}

              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-5 py-4 text-sm leading-relaxed",
                  m.role === "user"
                    ? "bg-primary text-white rounded-tr-none shadow-lg shadow-primary/20"
                    : "bg-white border border-slate-100 shadow-sm rounded-tl-none text-slate-800"
                )}
              >
                {m.role === "assistant" ? (
                  <>
                    <div className="prose prose-sm max-w-none prose-headings:font-black prose-strong:font-black prose-code:text-primary prose-code:bg-primary/5 prose-code:px-1 prose-code:rounded">
                      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                        {m.content || (loading && i === messages.length - 1 ? "..." : "")}
                      </ReactMarkdown>
                    </div>
                    {m.content && <CopyButton text={m.content} />}
                  </>
                ) : (
                  <p className="font-bold whitespace-pre-wrap">{m.content}</p>
                )}
              </div>

              {m.role === "user" && (
                <div className="w-9 h-9 shrink-0 bg-slate-900 text-white rounded-xl flex items-center justify-center mt-1 font-black text-[10px]">
                  <User size={18} />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      <div className="shrink-0 mt-4 bg-white border-2 border-slate-100 rounded-2xl shadow-xl focus-within:border-primary transition-colors">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about your studies... (Shift + Enter for new line)"
          rows={3}
          className="w-full px-5 pt-4 pb-2 resize-none outline-none font-medium text-slate-800 rounded-t-2xl bg-transparent"
        />
        <div className="flex items-center justify-between px-5 pb-4">
          <span className="text-xs font-black uppercase tracking-widest text-slate-400">
            {subject || "No subject set"} - Claude AI
          </span>
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="px-6 py-2.5 bg-primary text-white font-black uppercase tracking-widest text-xs rounded-xl flex items-center gap-2 hover:shadow-lg hover:shadow-primary/30 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send size={14} />
            )}
            {loading ? "Thinking..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
