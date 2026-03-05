"use client";

import { useRef, useEffect, useCallback } from "react";
import { useWardenStore } from "@/lib/store";
import { streamChat } from "@/lib/api";
import { ChatBubble } from "@/components/copilot/ChatBubble";
import { ChatInput } from "@/components/copilot/ChatInput";
import { ThinkingIndicator } from "@/components/copilot/ThinkingIndicator";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Sparkles } from "lucide-react";
import type { ChatMessage } from "@/lib/types";

export default function CopilotPage() {
  const {
    messages,
    addMessage,
    updateLastAssistantMessage,
    isThinking,
    setIsThinking,
    sessionId,
    setAgentActive,
  } = useWardenStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  const handleSend = useCallback(
    async (content: string) => {
      // Add user message
      const userMsg: ChatMessage = {
        role: "user",
        content,
        timestamp: new Date().toISOString(),
      };
      addMessage(userMsg);
      setIsThinking(true);
      setAgentActive(true);

      // Add placeholder assistant message
      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: "",
        timestamp: new Date().toISOString(),
      };
      addMessage(assistantMsg);

      // Abort any previous stream
      if (abortRef.current) {
        abortRef.current.abort();
      }
      abortRef.current = new AbortController();

      try {
        await streamChat(
          content,
          sessionId,
          (token) => {
            updateLastAssistantMessage(token);
            setIsThinking(false);
          },
          abortRef.current.signal
        );
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== "AbortError") {
          updateLastAssistantMessage(
            "I encountered an error processing your request. The backend may not be running. Please try again."
          );
        }
      } finally {
        setIsThinking(false);
        setAgentActive(false);
      }
    },
    [
      addMessage,
      updateLastAssistantMessage,
      setIsThinking,
      sessionId,
      setAgentActive,
    ]
  );

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-4"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-warden-amber/20 to-warden-amber/5 border border-warden-amber/30 flex items-center justify-center">
          <Bot size={20} className="text-warden-amber" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-warden-text-primary">
            Warden Co-Pilot
          </h1>
          <p className="text-[11px] text-warden-text-tertiary">
            AI-powered supply chain intelligence — ask anything about your
            operations
          </p>
        </div>
      </motion.div>

      {/* Messages Area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin"
      >
        {messages.length === 0 && !isThinking ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center h-full gap-4"
          >
            <div className="w-16 h-16 rounded-2xl bg-warden-amber/10 border border-warden-amber/20 flex items-center justify-center">
              <Sparkles size={28} className="text-warden-amber" />
            </div>
            <div className="text-center">
              <h2 className="text-sm font-semibold text-warden-text-primary mb-1">
                Welcome to Warden Co-Pilot
              </h2>
              <p className="text-xs text-warden-text-tertiary max-w-sm">
                I can analyze risks, simulate disruptions, draft supplier
                communications, and recommend mitigation strategies. Try one of
                the suggestions below.
              </p>
            </div>
          </motion.div>
        ) : (
          <>
            <AnimatePresence mode="popLayout">
              {messages
                .filter((m) => m.content || m.role === "user")
                .map((msg, i) => (
                  <ChatBubble key={`${msg.role}-${i}`} message={msg} />
                ))}
            </AnimatePresence>
            <AnimatePresence>
              {isThinking && <ThinkingIndicator />}
            </AnimatePresence>
          </>
        )}
      </div>

      {/* Input */}
      <div className="pt-4 border-t border-warden-border mt-2">
        <ChatInput onSend={handleSend} disabled={isThinking} />
      </div>
    </div>
  );
}
