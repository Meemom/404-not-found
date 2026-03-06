"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bot,
  CheckSquare,
  Command,
  CornerDownLeft,
  Globe2,
  GitBranch,
  Home,
  Loader2,
  MessageSquareText,
  Send,
  TerminalSquare,
  Warehouse,
  X,
} from "lucide-react";
import { useWardenStore } from "@/lib/store";
import {
  approveAction,
  dismissAction,
  getPendingActions,
  streamChat,
  triggerMonitor,
} from "@/lib/api";
import type { ViewTab } from "@/components/visualization/NavigationBar";
import type { PendingAction } from "@/lib/types";

interface SlashTerminalProps {
  onTabChange: (tab: ViewTab) => void;
}

interface TerminalLine {
  id: string;
  kind: "system" | "user" | "assistant" | "error";
  content: string;
}

interface SuggestionItem {
  cmd: string;
  desc: string;
}

const TAB_COMMANDS: Array<{ cmd: string; tab: ViewTab; desc: string }> = [
  { cmd: "/go graph", tab: "graph", desc: "Open supply chain graph" },
  { cmd: "/go globe", tab: "globe", desc: "Open 3D globe" },
  { cmd: "/go stockroom", tab: "stockroom", desc: "Open stockroom" }
];

export default function SlashTerminal({ onTabChange }: SlashTerminalProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [running, setRunning] = useState(false);
  const [lines, setLines] = useState<TerminalLine[]>([
    {
      id: "boot-1",
      kind: "system",
      content: "Warden Terminal ready. Type /help for commands, or ask Copilot a question.",
    },
  ]);

  const { sessionId, updateLastAssistantMessage, addMessage, setIsThinking, setAgentActive } = useWardenStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const MODE_SUGGESTIONS: SuggestionItem[] = [
    { cmd: "/go graph", desc: "Navigate to supply chain graph" },
    { cmd: "/go globe", desc: "Open 3D supply globe" },
    { cmd: "/go stockroom", desc: "Open stockroom visualization" },
    { cmd: "/actions list", desc: "List pending actions" },
    { cmd: "/actions approve <id>", desc: "Approve an action" },
    { cmd: "/actions dismiss <id> [reason]", desc: "Dismiss an action" },
    { cmd: "/monitor", desc: "Run monitoring cycle" },
  ];

  const appendLine = useCallback((kind: TerminalLine["kind"], content: string) => {
    setLines((prev) => [...prev, { id: `${Date.now()}-${Math.random()}`, kind, content }]);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTypingTarget =
        !!target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey && !isTypingTarget) {
        e.preventDefault();
        setOpen(true);
      }

      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  useEffect(() => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
    }
  }, [lines, running]);

  const runCommand = useCallback(
    async (raw: string) => {
      const cmd = raw.trim();
      const lower = cmd.toLowerCase();

      appendLine("user", cmd);

      if (lower === "/help") {
        appendLine("system", "Commands: /go [graph|globe|stockroom], /actions list, /actions approve <id>, /actions dismiss <id> [reason], /monitor");
        return;
      }

      const nav = TAB_COMMANDS.find((c) => c.cmd === lower);
      if (nav) {
        onTabChange(nav.tab);
        appendLine("system", `Navigated to ${nav.tab}.`);
        setOpen(false);
        return;
      }

      if (lower === "/actions list") {
        const actions = await getPendingActions();
        if (!actions.length) {
          appendLine("system", "No pending actions.");
          return;
        }
        appendLine(
          "system",
          `Pending actions:\n${actions
            .map((a: PendingAction) => `${a.id} | ${a.urgency.toUpperCase()} | ${a.title}`)
            .join("\n")}`,
        );
        return;
      }

      if (lower.startsWith("/actions approve ")) {
        const actionId = cmd.split(" ")[2];
        if (!actionId) {
          appendLine("error", "Usage: /actions approve <actionId>");
          return;
        }
        await approveAction(actionId);
        appendLine("system", `Approved action ${actionId}.`);
        return;
      }

      if (lower.startsWith("/actions dismiss ")) {
        const parts = cmd.split(" ");
        const actionId = parts[2];
        const reason = parts.slice(3).join(" ");
        if (!actionId) {
          appendLine("error", "Usage: /actions dismiss <actionId> [reason]");
          return;
        }
        await dismissAction(actionId, reason);
        appendLine("system", `Dismissed action ${actionId}.`);
        return;
      }

      if (lower === "/monitor") {
        await triggerMonitor();
        appendLine("system", "Triggered monitoring cycle.");
        return;
      }

      appendLine("error", `Unknown command: ${cmd}. Use /help.`);
    },
    [appendLine, onTabChange],
  );

  const runChat = useCallback(
    async (prompt: string) => {
      appendLine("user", prompt);
      setRunning(true);
      setIsThinking(true);
      setAgentActive(true);

      addMessage({ role: "user", content: prompt, timestamp: new Date().toISOString() });
      addMessage({ role: "assistant", content: "", timestamp: new Date().toISOString() });
      appendLine("assistant", "");

      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();

      try {
        let buffer = "";
        await streamChat(
          prompt,
          sessionId,
          (token) => {
            buffer += token;
            setLines((prev) => {
              const next = [...prev];
              const idx = [...next].reverse().findIndex((l) => l.kind === "assistant");
              if (idx >= 0) {
                const actualIndex = next.length - 1 - idx;
                next[actualIndex] = { ...next[actualIndex], content: buffer };
              }
              return next;
            });
            updateLastAssistantMessage(token);
          },
          abortRef.current.signal,
        );
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== "AbortError") {
          appendLine("error", "Copilot stream failed. Check backend availability.");
        }
      } finally {
        setRunning(false);
        setIsThinking(false);
        setAgentActive(false);
      }
    },
    [addMessage, appendLine, sessionId, setAgentActive, setIsThinking, updateLastAssistantMessage],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const value = input.trim();
      if (!value || running) return;
      setInput("");

      try {
        if (value.startsWith("/")) {
          await runCommand(value);
        } else {
          await runChat(value);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown terminal failure";
        appendLine("error", message);
        setRunning(false);
      }
    },
    [appendLine, input, runChat, runCommand, running],
  );

  const suggestions = useMemo(() => {
    if (!input.startsWith("/")) return [];
    const term = input.toLowerCase();
    const base: SuggestionItem[] = [
      ...TAB_COMMANDS.map((c) => ({ cmd: c.cmd, desc: c.desc })),
      { cmd: "/actions list", desc: "List pending actions" },
      { cmd: "/actions approve <id>", desc: "Approve action by id" },
      { cmd: "/actions dismiss <id> [reason]", desc: "Dismiss action" },
      { cmd: "/monitor", desc: "Trigger monitoring cycle" },
      { cmd: "/help", desc: "Show command help" },
    ];

    return base.filter((s) => s.cmd.includes(term)).slice(0, 6);
  }, [input]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-40 flex items-center gap-2 px-3 py-2 rounded-xl border text-xs shadow-sm transition-all"
        style={{
          background: "var(--w-ob-surface)",
          borderColor: "var(--w-ob-border)",
          color: "var(--w-ob-text-muted)",
        }}
      >
        <TerminalSquare size={14} />
        <span>Command</span>
        <kbd
          className="text-[10px] px-1.5 py-0.5 rounded"
          style={{ background: "var(--w-ob-bg-tint)", color: "var(--w-ob-text-faint)" }}
        >
          /
        </kbd>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/25 backdrop-blur-[2px] flex items-start justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              className="w-full max-w-6xl mt-14 h-[52vh] rounded-2xl border flex flex-col overflow-hidden"
              style={{
                background: "var(--w-ob-surface)",
                borderColor: "var(--w-ob-border)",
                boxShadow: "0 18px 45px rgba(15, 23, 42, 0.2)",
              }}
            >
              <div
                className="h-12 px-4 flex items-center justify-between border-b"
                style={{ borderColor: "var(--w-ob-border)" }}
              >
                <div className="flex items-center gap-2 text-xs">
                  <Command size={14} style={{ color: "var(--w-blue)" }} />
                  <span className="font-medium" style={{ color: "var(--w-ob-text)" }}>
                    Warden Command Palette
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px]" style={{ color: "var(--w-ob-text-faint)" }}>
                    Esc to close
                  </span>
                  <kbd
                    className="text-[10px] px-1.5 py-0.5 rounded"
                    style={{ background: "var(--w-ob-bg-tint)", color: "var(--w-ob-text-muted)" }}
                  >
                    /
                  </kbd>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1 rounded"
                  style={{ color: "var(--w-ob-text-faint)" }}
                >
                  <X size={14} />
                </button>
              </div>

              <form
                onSubmit={handleSubmit}
                className="px-3 pt-3 pb-2 border-b"
                style={{ borderColor: "var(--w-ob-border)" }}
              >
                <div
                  className="h-11 rounded-xl border flex items-center gap-2 px-3"
                  style={{ background: "var(--w-ob-bg)", borderColor: "var(--w-ob-border)" }}
                >
                  {input.startsWith("/") ? (
                    <Command size={15} style={{ color: "var(--w-ob-text-muted)" }} />
                  ) : (
                    <MessageSquareText size={15} style={{ color: "var(--w-ob-text-muted)" }} />
                  )}
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-sm"
                    style={{ color: "var(--w-ob-text)" }}
                    placeholder="Type / for commands, or ask Warden for analysis"
                  />
                  <button
                    type="submit"
                    disabled={running || !input.trim()}
                    className="h-7 px-2 rounded-md text-[11px] border disabled:opacity-40 inline-flex items-center gap-1"
                    style={{
                      borderColor: "var(--w-ob-border)",
                      color: "var(--w-ob-text-muted)",
                      background: "var(--w-ob-surface)",
                    }}
                    title="Submit"
                  >
                    {running ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                    Submit
                  </button>
                </div>

                <div className="mt-2 flex items-center gap-2 overflow-x-auto">
                  <span className="text-[10px] uppercase tracking-wide" style={{ color: "var(--w-ob-text-faint)" }}>
                    Modes
                  </span>
                  <span className="text-[11px] px-2 py-1 rounded-full" style={{ background: "var(--w-ob-bg-tint)", color: "var(--w-ob-text-muted)" }}>
                    Navigate
                  </span>
                  <span className="text-[11px] px-2 py-1 rounded-full" style={{ background: "var(--w-ob-bg-tint)", color: "var(--w-ob-text-muted)" }}>
                    Ask Warden
                  </span>
                  <span className="text-[11px] px-2 py-1 rounded-full" style={{ background: "var(--w-ob-bg-tint)", color: "var(--w-ob-text-muted)" }}>
                    Actions
                  </span>
                  <span className="ml-auto inline-flex items-center gap-1 text-[10px]" style={{ color: "var(--w-ob-text-faint)" }}>
                    <CornerDownLeft size={11} /> Enter submits
                  </span>
                </div>
              </form>

              <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr] min-h-0 flex-1">
                <div
                  className="border-r min-h-0 flex flex-col"
                  style={{ borderColor: "var(--w-ob-border)" }}
                >
                  <div
                    className="px-3 py-2 text-[10px] uppercase tracking-wide border-b"
                    style={{ color: "var(--w-ob-text-faint)", borderColor: "var(--w-ob-border)" }}
                  >
                    {input.startsWith("/") ? "Command Matches" : "Quick Actions"}
                  </div>

                  <div className="overflow-y-auto p-2 space-y-1">
                    {(input.startsWith("/") ? suggestions : MODE_SUGGESTIONS).map((s) => {
                      const icon = s.cmd.includes("graph")
                        ? <GitBranch size={13} />
                        : s.cmd.includes("globe")
                        ? <Globe2 size={13} />
                        : s.cmd.includes("stockroom")
                        ? <Warehouse size={13} />
                        : s.cmd.includes("actions")
                        ? <CheckSquare size={13} />
                        : s.cmd.includes("monitor")
                        ? <Home size={13} />
                        : <Bot size={13} />;

                      return (
                        <button
                          key={s.cmd}
                          onClick={() => setInput(s.cmd)}
                          className="w-full text-left px-2.5 py-2 rounded-lg border flex items-start gap-2 transition-colors"
                          style={{ background: "var(--w-ob-surface)", borderColor: "var(--w-ob-border)" }}
                        >
                          <span className="mt-0.5" style={{ color: "var(--w-ob-text-faint)" }}>{icon}</span>
                          <span className="min-w-0">
                            <span className="text-xs block truncate" style={{ color: "var(--w-ob-text)" }}>{s.cmd}</span>
                            <span className="text-[11px] block truncate" style={{ color: "var(--w-ob-text-muted)" }}>{s.desc}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="min-h-0 flex flex-col">
                  <div
                    className="px-3 py-2 text-[10px] uppercase tracking-wide border-b"
                    style={{ color: "var(--w-ob-text-faint)", borderColor: "var(--w-ob-border)" }}
                  >
                    Session Output
                  </div>

                  <div ref={scrollerRef} className="flex-1 overflow-y-auto p-2.5 space-y-1.5 font-data">
                    {lines.map((line) => {
                      const label =
                        line.kind === "system"
                          ? "system"
                          : line.kind === "user"
                          ? "you"
                          : line.kind === "assistant"
                          ? "warden"
                          : "error";

                      const bg =
                        line.kind === "system"
                          ? "rgba(59,130,246,0.08)"
                          : line.kind === "user"
                          ? "rgba(59,130,246,0.05)"
                          : line.kind === "assistant"
                          ? "rgba(15,23,42,0.04)"
                          : "rgba(236,72,153,0.08)";

                      const textColor =
                        line.kind === "error" ? "var(--w-pink)" : "var(--w-ob-text)";

                      return (
                        <div
                          key={line.id}
                          className="rounded-lg px-2.5 py-2 border text-xs whitespace-pre-wrap break-words"
                          style={{ background: bg, borderColor: "var(--w-ob-border)", color: textColor }}
                        >
                          <div className="mb-1 text-[10px] uppercase tracking-wide" style={{ color: "var(--w-ob-text-faint)" }}>
                            {label}
                          </div>
                          <div>{line.content || (line.kind === "assistant" && running ? "Thinking..." : "")}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="h-1 border-t" style={{ borderColor: "var(--w-ob-border)" }} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
