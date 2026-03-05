"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  User,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import type { ChatMessage } from "@/lib/types";

interface ChatBubbleProps {
  message: ChatMessage;
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const isAssistant = message.role === "assistant";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`flex gap-3 ${isAssistant ? "" : "flex-row-reverse"}`}
    >
      {/* Avatar */}
      <div
        className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
          isAssistant
            ? "bg-warden-amber/10 border border-warden-amber/30"
            : "bg-warden-blue/10 border border-warden-blue/30"
        }`}
      >
        {isAssistant ? (
          <Bot size={16} className="text-warden-amber" />
        ) : (
          <User size={16} className="text-warden-blue" />
        )}
      </div>

      {/* Content */}
      <div
        className={`flex-1 max-w-[85%] ${
          isAssistant ? "" : "flex flex-col items-end"
        }`}
      >
        <div
          className={`rounded-2xl px-4 py-3 ${
            isAssistant
              ? "bg-warden-bg-elevated border border-warden-border rounded-tl-sm"
              : "bg-warden-amber/10 border border-warden-amber/20 rounded-tr-sm"
          }`}
        >
          <div className="text-sm text-warden-text-primary leading-relaxed whitespace-pre-wrap">
            {message.content}
          </div>

          {/* Actions from message */}
          {message.actions && message.actions.length > 0 && (
            <div className="mt-3 pt-3 border-t border-warden-border/50 space-y-2">
              {message.actions.map((action, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-xs text-warden-text-secondary p-2 rounded-lg bg-warden-bg-primary/50"
                >
                  {action.status === "pending" ? (
                    <AlertTriangle size={12} className="text-warden-amber shrink-0" />
                  ) : (
                    <CheckCircle size={12} className="text-warden-teal shrink-0" />
                  )}
                  <span className="flex-1">{action.title}</span>
                  <ArrowRight size={10} className="text-warden-text-tertiary" />
                </div>
              ))}
            </div>
          )}
        </div>

        <span className="text-[10px] text-warden-text-tertiary mt-1 px-1">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </motion.div>
  );
}
