"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  Clock,
  MapPin,
  ChevronRight,
  Zap,
} from "lucide-react";
import type { Disruption } from "@/lib/types";
import Link from "next/link";

interface ActiveAlertsProps {
  disruptions: Disruption[];
}

export function ActiveAlerts({ disruptions }: ActiveAlertsProps) {
  const active = disruptions.filter((d) => d.status === "active");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
      className="warden-card border border-warden-pink/20 p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-warden-pink/10">
            <Zap size={14} className="text-warden-pink" />
          </div>
          <h3 className="text-sm font-semibold text-warden-text-primary">
            Active Disruptions
          </h3>
          {active.length > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-warden-pink text-white rounded-full">
              {active.length}
            </span>
          )}
        </div>
        <Link
          href="/dashboard/memory"
          className="text-[10px] text-warden-text-tertiary hover:text-warden-amber transition-colors flex items-center gap-1"
        >
          History <ChevronRight size={10} />
        </Link>
      </div>

      {active.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-10 h-10 rounded-full bg-warden-teal/10 flex items-center justify-center mx-auto mb-2">
            <AlertTriangle size={18} className="text-warden-teal" />
          </div>
          <p className="text-xs text-warden-text-tertiary">
            No active disruptions
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {active.map((disruption, i) => (
            <motion.div
              key={disruption.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="p-3 rounded-lg bg-warden-bg-elevated border border-warden-border hover:border-warden-pink/30 transition-colors group cursor-pointer"
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="text-xs font-semibold text-warden-text-primary group-hover:text-warden-pink transition-colors leading-tight">
                  {disruption.title}
                </h4>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <span className="font-data text-lg font-bold text-warden-pink">
                    {disruption.severity}
                  </span>
                  <span className="text-[9px] text-warden-text-tertiary">/10</span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-[10px] text-warden-text-tertiary">
                <span className="flex items-center gap-1">
                  <MapPin size={10} />
                  {disruption.affected_region}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={10} />
                  {disruption.detected_at
                    ? new Date(disruption.detected_at).toLocaleDateString()
                    : "Unknown"}
                </span>
              </div>

              {disruption.financial_impact_eur && (
                <div className="mt-2 pt-2 border-t border-warden-border/50">
                  <span className="text-[10px] text-warden-text-tertiary">
                    Est. Impact:{" "}
                    <span className="font-data text-warden-amber font-medium">
                      €{(disruption.financial_impact_eur / 1_000_000).toFixed(1)}M
                    </span>
                  </span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
