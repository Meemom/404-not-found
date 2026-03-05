"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { formatCompact } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  icon?: React.ReactNode;
  accent?: "amber" | "teal" | "coral" | "blue";
  delay?: number;
}

const accentMap = {
  amber: {
    border: "border-warden-amber/20",
    glow: "hover:shadow-[0_0_20px_rgba(255,186,73,0.1)]",
    text: "text-warden-amber",
    bg: "bg-warden-amber/10",
  },
  teal: {
    border: "border-warden-teal/20",
    glow: "hover:shadow-[0_0_20px_rgba(45,212,191,0.1)]",
    text: "text-warden-teal",
    bg: "bg-warden-teal/10",
  },
  coral: {
    border: "border-warden-coral/20",
    glow: "hover:shadow-[0_0_20px_rgba(255,107,107,0.1)]",
    text: "text-warden-coral",
    bg: "bg-warden-coral/10",
  },
  blue: {
    border: "border-warden-blue/20",
    glow: "hover:shadow-[0_0_20px_rgba(96,165,250,0.1)]",
    text: "text-warden-blue",
    bg: "bg-warden-blue/10",
  },
};

export function StatCard({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  icon,
  accent = "amber",
  delay = 0,
}: StatCardProps) {
  const colors = accentMap[accent];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: "easeOut" }}
      className={`warden-card border ${colors.border} ${colors.glow} transition-shadow duration-300 p-5`}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs text-warden-text-tertiary uppercase tracking-wider font-medium">
          {title}
        </span>
        {icon && (
          <div className={`p-2 rounded-lg ${colors.bg}`}>
            <span className={colors.text}>{icon}</span>
          </div>
        )}
      </div>
      <div className="flex items-end gap-2">
        <span className="font-data text-2xl font-bold text-warden-text-primary">
          {value}
        </span>
        {trend && trendValue && (
          <span
            className={`flex items-center gap-0.5 text-xs font-medium mb-1 ${
              trend === "up"
                ? "text-warden-coral"
                : trend === "down"
                ? "text-warden-teal"
                : "text-warden-text-tertiary"
            }`}
          >
            {trend === "up" ? (
              <TrendingUp size={12} />
            ) : (
              <TrendingDown size={12} />
            )}
            {trendValue}
          </span>
        )}
      </div>
      {subtitle && (
        <p className="text-xs text-warden-text-tertiary mt-1">{subtitle}</p>
      )}
    </motion.div>
  );
}
