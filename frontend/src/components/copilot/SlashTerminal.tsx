"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Command, CornerDownLeft, TerminalSquare, X } from "lucide-react";
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
        appendLine("system", "Commands: /go [graph|globe|stockroom|operations|cascade|actions|memory], /actions list, /actions approve <id>, /actions dismiss <id> [reason], /monitor");
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
    const base = [
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
        className="fixed bottom-4 right-4 z-40 flex items-center gap-2 px-3 py-2 rounded-lg bg-warden-bg-elevated border border-warden-border text-warden-text-secondary hover:text-warden-text-primary hover:border-warden-border-accent"
      >
        <TerminalSquare size={14} />
        <span className="text-xs">Open Terminal</span>
        <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-black/30 text-warden-text-tertiary">/</kbd>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-start justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              className="w-full max-w-4xl mt-8 h-[70vh] rounded-xl border border-warden-border bg-[#0A1220] shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="h-11 border-b border-warden-border px-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-warden-text-secondary">
                  <Command size={14} className="text-warden-amber" />
                  <span className="font-data">WARDEN TERMINAL</span>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1 rounded text-warden-text-tertiary hover:text-warden-text-primary"
                >
                  <X size={14} />
                </button>
              </div>

              <div ref={scrollerRef} className="flex-1 overflow-y-auto p-4 font-data text-sm space-y-2">
                {lines.map((line) => (
                  <div key={line.id} className="whitespace-pre-wrap break-words">
                    <span
                      className={
                        line.kind === "system"
                          ? "text-warden-blue"
                          : line.kind === "user"
                          ? "text-warden-amber"
                          : line.kind === "assistant"
                          ? "text-warden-text-primary"
                          : "text-warden-pink"
                      }
                    >
                      {line.kind === "system"
                        ? "sys"
                        : line.kind === "user"
                        ? "you"
                        : line.kind === "assistant"
                        ? "copilot"
                        : "err"}
                    </span>
                    <span className="text-warden-text-tertiary"> {">"} </span>
                    <span>{line.content || (line.kind === "assistant" && running ? "..." : "")}</span>
                  </div>
                ))}
              </div>

              {suggestions.length > 0 && (
                <div className="px-4 py-2 border-t border-warden-border bg-[#0E1728] grid grid-cols-1 md:grid-cols-2 gap-2">
                  {suggestions.map((s) => (
                    <button
                      key={s.cmd}
                      onClick={() => setInput(s.cmd)}
                      className="text-left text-xs px-2 py-1.5 rounded border border-warden-border text-warden-text-secondary hover:border-warden-border-accent"
                    >
                      <span className="text-warden-text-primary">{s.cmd}</span>
                      <span className="text-warden-text-tertiary"> - {s.desc}</span>
                    </button>
                  ))}
                </div>
              )}

              <form onSubmit={handleSubmit} className="h-14 border-t border-warden-border px-4 flex items-center gap-2">
                <span className="text-warden-amber font-data">$</span>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="flex-1 bg-transparent outline-none font-data text-sm text-warden-text-primary placeholder:text-warden-text-tertiary"
                  placeholder="Type a command (/help) or ask Copilot anything about this app..."
                />
                <button
                  type="submit"
                  disabled={running || !input.trim()}
                  className="px-3 py-1.5 rounded-md text-xs border border-warden-border text-warden-text-secondary disabled:opacity-40"
                >
                  <CornerDownLeft size={13} />
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
