"use client";

import { Handle, Position } from "reactflow";
import { motion } from "framer-motion";
import { Cpu } from "lucide-react";

export interface PartData {
  id: string;
  name: string;
  criticality: string;
  inventory_days: number;
  lead_time_days: number;
  safety_stock_days: number;
  onClick?: (nodeId: string) => void;
}

interface PartNodeProps {
  data: PartData;
  id: string;
}

export function PartNode({ data, id }: PartNodeProps) {
  const stockRatio = data.inventory_days / Math.max(data.safety_stock_days, 1);
  const stockColor =
    stockRatio > 1.5
      ? "#10b981"
      : stockRatio > 1
        ? "#f59e0b"
        : "#ef4444";

  const critBadge =
    data.criticality === "critical"
      ? "bg-red-50 text-red-600 border-red-200"
      : data.criticality === "high"
        ? "bg-orange-50 text-orange-600 border-orange-200"
        : "bg-teal-50 text-teal-600 border-teal-200";

  return (
    <div onClick={() => data.onClick?.(id)} className="cursor-pointer">
      <Handle type="target" position={Position.Left} className="!bg-teal-500 !w-2 !h-2" />

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
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Cpu size={14} className="text-teal-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-500">
                Part
              </span>
            </div>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${critBadge}`}>
              {data.criticality}
            </span>
          </div>

          {/* Name */}
          <p className="text-xs font-semibold mb-3 font-mono" style={{ color: "var(--w-ob-text)" }}>{data.name}</p>

          {/* Metrics */}
          <div className="grid grid-cols-3 gap-2 text-[10px]">
            <div>
              <span style={{ color: "var(--w-ob-text-faint)" }}>STOCK</span>
              <p className="font-bold" style={{ color: stockColor }}>
                {data.inventory_days}d
              </p>
            </div>
            <div>
              <span style={{ color: "var(--w-ob-text-faint)" }}>LEAD</span>
              <p className="font-bold" style={{ color: "var(--w-ob-text-muted)" }}>{data.lead_time_days}d</p>
            </div>
            <div>
              <span style={{ color: "var(--w-ob-text-faint)" }}>SAFETY</span>
              <p className="font-bold" style={{ color: "var(--w-ob-text-muted)" }}>{data.safety_stock_days}d</p>
            </div>
          </div>

          {/* Inventory bar */}
          <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: stockColor }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(stockRatio * 50, 100)}%` }}
              transition={{ duration: 1, delay: 0.3 }}
            />
          </div>
        </div>
      </motion.div>

      <Handle type="source" position={Position.Right} className="!bg-teal-500 !w-2 !h-2" />
    </div>
  );
}