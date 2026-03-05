"use client";

import { useState, useRef } from "react";
import { Send, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

const SUGGESTIONS = [
  "What's our biggest risk right now?",
  "Simulate TSMC going offline for 2 weeks",
  "Draft an email to TSMC about delays",
  "Which orders might breach SLA?",
  "How exposed are we to semiconductor shortage?",
];

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    setShowSuggestions(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  return (
    <div className="space-y-3">
      {/* Suggestion chips */}
      {showSuggestions && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap gap-2"
        >
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => {
                onSend(s);
                setShowSuggestions(false);
              }}
              disabled={disabled}
              className="px-3 py-1.5 text-[11px] text-warden-text-secondary bg-warden-bg-elevated border border-warden-border rounded-full hover:border-warden-amber/40 hover:text-warden-amber transition-all disabled:opacity-50"
            >
              <Sparkles size={10} className="inline mr-1 -mt-0.5" />
              {s}
            </button>
          ))}
        </motion.div>
      )}

      {/* Input Area */}
      <div className="flex items-end gap-2">
        <div className="flex-1 bg-warden-bg-elevated border border-warden-border rounded-xl focus-within:border-warden-amber/50 transition-colors">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            placeholder="Ask Warden anything about your supply chain..."
            disabled={disabled}
            rows={1}
            className="w-full bg-transparent text-sm text-warden-text-primary placeholder:text-warden-text-tertiary p-3 resize-none focus:outline-none"
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={!value.trim() || disabled}
          className="shrink-0 w-10 h-10 rounded-xl bg-warden-amber text-warden-bg-primary flex items-center justify-center hover:bg-warden-amber-glow transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
