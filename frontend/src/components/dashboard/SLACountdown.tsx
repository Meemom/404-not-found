"use client";

import { motion } from "framer-motion";
import { Timer, AlertTriangle, ArrowRight } from "lucide-react";
import { formatEUR, daysUntil } from "@/lib/utils";
import type { SLAAtRiskOrder } from "@/lib/types";

interface SLACountdownProps {
  orders: SLAAtRiskOrder[];
}

export function SLACountdown({ orders }: SLACountdownProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35, duration: 0.4 }}
      className="warden-card border border-warden-border p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Timer size={16} className="text-warden-amber" />
          <h3 className="text-sm font-semibold text-warden-text-primary">
            SLA Countdown
          </h3>
        </div>
        <span className="text-[10px] text-warden-text-tertiary uppercase tracking-wider">
          At risk
        </span>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-xs text-warden-text-tertiary">
            All SLAs on track
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order, i) => {
            const daysLeft = daysUntil(order.sla_deadline);
            const urgency =
              daysLeft <= 3
                ? "coral"
                : daysLeft <= 7
                ? "amber"
                : "teal";
            const urgencyBg = {
              coral: "bg-warden-coral/10 border-warden-coral/30",
              amber: "bg-warden-amber/10 border-warden-amber/30",
              teal: "bg-warden-teal/10 border-warden-teal/30",
            }[urgency];
            const urgencyText = {
              coral: "text-warden-coral",
              amber: "text-warden-amber",
              teal: "text-warden-teal",
            }[urgency];

            return (
              <motion.div
                key={order.order_id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.45 + i * 0.08 }}
                className="flex items-center gap-3 p-3 rounded-lg bg-warden-bg-elevated border border-warden-border"
              >
                {/* Days countdown */}
                <div
                  className={`shrink-0 w-12 h-12 rounded-lg border ${urgencyBg} flex flex-col items-center justify-center`}
                >
                  <span className={`font-data text-lg font-bold ${urgencyText}`}>
                    {daysLeft}
                  </span>
                  <span className="text-[8px] text-warden-text-tertiary uppercase">
                    days
                  </span>
                </div>

                {/* Order info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-data text-xs text-warden-text-primary font-medium">
                      {order.order_id}
                    </span>
                    {daysLeft <= 3 && (
                      <AlertTriangle
                        size={10}
                        className="text-warden-coral animate-pulse"
                      />
                    )}
                  </div>
                  <p className="text-[10px] text-warden-text-tertiary truncate">
                    {order.customer_name} — {formatEUR(order.value_eur)}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className={`text-[10px] font-data font-medium ${urgencyText}`}>
                      {order.breach_probability}% breach risk
                    </span>
                  </div>
                </div>

                <ArrowRight size={14} className="text-warden-text-tertiary shrink-0" />
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
