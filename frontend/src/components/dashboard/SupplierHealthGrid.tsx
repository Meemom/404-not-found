"use client";

import { motion } from "framer-motion";
import { Shield, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import type { SupplierHealth } from "@/lib/types";

interface SupplierHealthGridProps {
  suppliers: SupplierHealth[];
}

function getHealthIcon(score: number) {
  if (score >= 80) return <CheckCircle size={14} className="text-warden-teal" />;
  if (score >= 50) return <AlertTriangle size={14} className="text-warden-amber" />;
  return <XCircle size={14} className="text-warden-coral" />;
}

function getHealthBar(score: number) {
  const color =
    score >= 80
      ? "bg-warden-teal"
      : score >= 50
      ? "bg-warden-amber"
      : "bg-warden-coral";

  return (
    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
      <motion.div
        className={`h-full rounded-full ${color}`}
        initial={{ width: 0 }}
        animate={{ width: `${score}%` }}
        transition={{ duration: 1, ease: "easeOut" }}
      />
    </div>
  );
}

export function SupplierHealthGrid({ suppliers }: SupplierHealthGridProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="warden-card border border-warden-border p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-warden-blue" />
          <h3 className="text-sm font-semibold text-warden-text-primary">
            Supplier Health
          </h3>
        </div>
        <span className="text-[10px] text-warden-text-tertiary uppercase tracking-wider">
          {suppliers.length} tracked
        </span>
      </div>

      <div className="space-y-3">
        {suppliers.map((supplier, i) => (
          <motion.div
            key={supplier.supplier_id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + i * 0.08 }}
            className="flex items-center gap-3"
          >
            {getHealthIcon(supplier.health_score)}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-warden-text-primary truncate">
                  {supplier.name}
                </span>
                <span className="font-data text-xs text-warden-text-secondary ml-2 shrink-0">
                  {supplier.health_score}
                </span>
              </div>
              {getHealthBar(supplier.health_score)}
            </div>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                supplier.status === "at_risk"
                  ? "bg-warden-coral/10 text-warden-coral"
                  : supplier.status === "warning"
                  ? "bg-warden-amber/10 text-warden-amber"
                  : "bg-warden-teal/10 text-warden-teal"
              }`}
            >
              {supplier.status === "at_risk"
                ? "AT RISK"
                : supplier.status === "warning"
                ? "WARNING"
                : "OK"}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
