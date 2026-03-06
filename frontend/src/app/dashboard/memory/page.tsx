"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  Clock,
  MapPin,
  TrendingUp,
  ChevronRight,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { getDisruptionHistory } from "@/lib/api";
import { formatEUR, timeAgo } from "@/lib/utils";
import type { Disruption, PatternInsight, MemoryResponse } from "@/lib/types";

function DisruptionCard({ disruption }: { disruption: Disruption }) {
  const isActive = disruption.status === "active";

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`relative pl-6 pb-8 border-l-2 ${
        isActive ? "border-warden-pink/40" : "border-warden-border"
      }`}
    >
      {/* Timeline dot */}
      <div
        className={`absolute -left-[7px] top-0 w-3 h-3 rounded-full border-2 ${
          isActive
            ? "bg-warden-pink border-warden-pink/40 animate-pulse"
            : disruption.status === "resolved"
            ? "bg-warden-teal border-warden-teal/40"
            : "bg-warden-text-tertiary border-warden-border"
        }`}
      />

      <div
        className={`warden-card border p-4 ${
          isActive ? "border-warden-pink/20" : "border-warden-border"
        }`}
      >
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-warden-text-primary">
                {disruption.title}
              </h3>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                  isActive
                    ? "bg-warden-pink/10 text-warden-pink"
                    : disruption.status === "resolved"
                    ? "bg-warden-teal/10 text-warden-teal"
                    : "bg-white/5 text-warden-text-tertiary"
                }`}
              >
                {disruption.status}
              </span>
            </div>
            <p className="text-[10px] text-warden-text-tertiary mt-0.5">
              {disruption.id}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span className="font-data text-lg font-bold text-warden-text-primary">
              {disruption.severity}
            </span>
            <span className="text-[9px] text-warden-text-tertiary">/10</span>
          </div>
        </div>

        <p className="text-xs text-warden-text-secondary leading-relaxed mb-3">
          {disruption.description}
        </p>

        <div className="flex flex-wrap items-center gap-3 text-[10px] text-warden-text-tertiary">
          <span className="flex items-center gap-1">
            <MapPin size={10} /> {disruption.affected_region}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={10} />{" "}
            {disruption.detected_at
              ? timeAgo(disruption.detected_at)
              : "Unknown"}
          </span>
          {disruption.financial_impact_eur && (
            <span className="flex items-center gap-1">
              <TrendingUp size={10} />{" "}
              <span className="font-data text-warden-amber">
                {formatEUR(disruption.financial_impact_eur)}
              </span>
            </span>
          )}
        </div>

        {/* Affected suppliers */}
        {disruption.affected_suppliers && disruption.affected_suppliers.length > 0 && (
          <div className="mt-3 pt-2 border-t border-warden-border/50">
            <span className="text-[10px] text-warden-text-tertiary">
              Affected:{" "}
            </span>
            {disruption.affected_suppliers.map((s, i) => (
              <span key={s} className="text-[10px] text-warden-text-secondary">
                {s}
                {i < disruption.affected_suppliers!.length - 1 ? ", " : ""}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function PatternCard({ pattern }: { pattern: PatternInsight }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="warden-card border border-warden-amber/10 p-4"
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-warden-amber/10 flex items-center justify-center shrink-0">
          <Lightbulb size={14} className="text-warden-amber" />
        </div>
        <div>
          <h4 className="text-xs font-semibold text-warden-text-primary mb-1">
            {pattern.title}
          </h4>
          <p className="text-[11px] text-warden-text-secondary leading-relaxed">
            {pattern.description}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-warden-amber/10 text-warden-amber font-medium">
              {pattern.confidence}% confidence
            </span>
            <span className="text-[9px] text-warden-text-tertiary">
              Based on {pattern.occurrences} events
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function MemoryPage() {
  const [data, setData] = useState<MemoryResponse | null>(null);

  useEffect(() => {
    getDisruptionHistory().then(setData).catch(console.error);
  }, []);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-warden-amber/30 border-t-warden-amber rounded-full animate-spin" />
          <span className="text-xs text-warden-text-tertiary">
            Loading disruption memory...
          </span>
        </div>
      </div>
    );
  }

  const active = data.disruptions.filter((d) => d.status === "active");
  const resolved = data.disruptions.filter((d) => d.status !== "active");

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="w-10 h-10 rounded-xl bg-warden-bg-elevated border border-warden-border flex items-center justify-center">
          <Brain size={20} className="text-warden-blue" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-warden-text-primary">
            Disruption Memory
          </h1>
          <p className="text-[11px] text-warden-text-tertiary">
            {data.disruptions.length} events tracked — {data.patterns.length}{" "}
            patterns identified
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline - left 2 columns */}
        <div className="lg:col-span-2 space-y-0">
          {/* Active section */}
          {active.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={14} className="text-warden-pink" />
                <h2 className="text-xs font-semibold text-warden-pink uppercase tracking-wider">
                  Active ({active.length})
                </h2>
              </div>
              {active.map((d) => (
                <DisruptionCard key={d.id} disruption={d} />
              ))}
            </div>
          )}

          {/* Resolved section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle size={14} className="text-warden-teal" />
              <h2 className="text-xs font-semibold text-warden-text-tertiary uppercase tracking-wider">
                Resolved ({resolved.length})
              </h2>
            </div>
            {resolved.map((d, i) => (
              <motion.div
                key={d.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
              >
                <DisruptionCard disruption={d} />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Patterns - right column */}
        <div className="space-y-4">
          <h2 className="text-xs font-semibold text-warden-text-tertiary uppercase tracking-wider flex items-center gap-2">
            <Lightbulb size={14} className="text-warden-amber" />
            Identified Patterns
          </h2>
          {data.patterns.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 + i * 0.1 }}
            >
              <PatternCard pattern={p} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
