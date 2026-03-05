"use client";

import { motion } from "framer-motion";
import { Bot } from "lucide-react";

export function ThinkingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex gap-3"
    >
      <div className="shrink-0 w-8 h-8 rounded-lg bg-warden-amber/10 border border-warden-amber/30 flex items-center justify-center">
        <Bot size={16} className="text-warden-amber animate-pulse" />
      </div>
      <div className="bg-warden-bg-elevated border border-warden-border rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-warden-text-tertiary mr-1">
            Warden is analyzing
          </span>
          <span className="thinking-dot w-1.5 h-1.5 rounded-full bg-warden-amber" style={{ animationDelay: "0ms" }} />
          <span className="thinking-dot w-1.5 h-1.5 rounded-full bg-warden-amber" style={{ animationDelay: "200ms" }} />
          <span className="thinking-dot w-1.5 h-1.5 rounded-full bg-warden-amber" style={{ animationDelay: "400ms" }} />
        </div>
      </div>
    </motion.div>
  );
}
