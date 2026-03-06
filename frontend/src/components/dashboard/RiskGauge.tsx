"use client";

import { motion } from "framer-motion";

interface RiskGaugeProps {
  score: number;
  label?: string;
}

export function RiskGauge({ score, label }: RiskGaugeProps) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  const color =
    score > 60
      ? "var(--color-warden-pink)"
      : score > 30
      ? "var(--color-warden-amber)"
      : "var(--color-warden-teal)";

  const glowClass =
    score > 60
      ? "drop-shadow-[0_0_8px_rgba(255,107,107,0.5)]"
      : score > 30
      ? "drop-shadow-[0_0_8px_rgba(255,186,73,0.5)]"
      : "drop-shadow-[0_0_8px_rgba(45,212,191,0.5)]";

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-32 h-32">
        <svg
          viewBox="0 0 120 120"
          className={`-rotate-90 ${glowClass}`}
        >
          {/* Background ring */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="8"
          />
          {/* Progress ring */}
          <motion.circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - progress }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="font-data text-3xl font-bold text-warden-text-primary"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            {score}
          </motion.span>
          <span className="text-[10px] text-warden-text-tertiary uppercase tracking-wider">
            / 100
          </span>
        </div>
      </div>
      {label && (
        <span className="text-xs text-warden-text-tertiary font-medium">
          {label}
        </span>
      )}
    </div>
  );
}
