"use client";

import { Handle, Position } from "reactflow";
import { motion } from "framer-motion";
import { Building2 } from "lucide-react";

export interface CustomerData {
  id: string;
  name: string;
  annual_revenue: number;
  sla_days: number;
  onClick?: (nodeId: string) => void;
}

interface CustomerNodeProps {
  data: CustomerData;
  id: string;
}

export function CustomerNode({ data, id }: CustomerNodeProps) {
  const revenueStr =
    data.annual_revenue >= 1_000_000
      ? `\u20AC${(data.annual_revenue / 1_000_000).toFixed(0)}M`
      : `\u20AC${(data.annual_revenue / 1_000).toFixed(0)}K`;

  return (
    <div onClick={() => data.onClick?.(id)} className="cursor-pointer">
      <Handle type="target" position={Position.Left} className="!bg-emerald-500 !w-2 !h-2" />

      <motion.div
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="relative w-[180px] rounded-xl border shadow-sm overflow-hidden"
        style={{
          borderColor: "var(--w-ob-border)",
          background: "#FFFFFF",
        }}
      >
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center gap-2 mb-3">
            <Building2 size={14} className="text-emerald-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">
              Customer
            </span>
          </div>

          {/* Name */}
          <p className="text-sm font-semibold mb-3" style={{ color: "var(--w-ob-text)" }}>{data.name}</p>

          {/* Metrics */}
          <div className="flex items-center gap-4 text-[10px]">
            <div>
              <span style={{ color: "var(--w-ob-text-faint)" }}>REVENUE</span>
              <p className="font-bold text-emerald-600">{revenueStr}/yr</p>
            </div>
            <div>
              <span style={{ color: "var(--w-ob-text-faint)" }}>SLA</span>
              <p className="font-bold" style={{ color: "var(--w-ob-text-muted)" }}>{data.sla_days}d</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}