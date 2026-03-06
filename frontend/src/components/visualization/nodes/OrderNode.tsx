"use client";

import { Handle, Position } from "reactflow";
import { motion } from "framer-motion";
import { ClipboardList } from "lucide-react";

export interface OrderData {
  id: string;
  customer: string;
  due_date: string;
  revenue: number;
  margin: number;
  status: string;
  onClick?: (nodeId: string) => void;
}

interface OrderNodeProps {
  data: OrderData;
  id: string;
}

export function OrderNode({ data, id }: OrderNodeProps) {
  const statusColor =
    data.status === "at_risk"
      ? "#EC4899"
      : data.status === "delayed"
        ? "#f59e0b"
        : "#10b981";

  const statusLabel =
    data.status === "at_risk"
      ? "AT RISK"
      : data.status === "delayed"
        ? "DELAYED"
        : "ON TRACK";

  const revenueStr =
    data.revenue >= 1_000_000
      ? `\u20AC${(data.revenue / 1_000_000).toFixed(2)}M`
      : `\u20AC${(data.revenue / 1_000).toFixed(0)}K`;

  return (
    <div onClick={() => data.onClick?.(id)} className="cursor-pointer">
      <Handle type="target" position={Position.Left} className="!bg-violet-500 !w-2 !h-2" />

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
              <ClipboardList size={14} className="text-violet-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-violet-500">
                Order
              </span>
            </div>
            <span
              className="text-[9px] font-bold px-1.5 py-0.5 rounded border"
              style={{
                color: statusColor,
                borderColor: statusColor + "40",
                backgroundColor: statusColor + "10",
              }}
            >
              {statusLabel}
            </span>
          </div>

          {/* Order ID + Customer */}
          <p className="text-xs font-semibold font-mono mb-0.5" style={{ color: "var(--w-ob-text)" }}>{data.id}</p>
          <p className="text-[10px] mb-3" style={{ color: "var(--w-ob-text-faint)" }}>{data.customer}</p>

          {/* Metrics */}
          <div className="flex items-center gap-3 text-[10px]">
            <div>
              <span style={{ color: "var(--w-ob-text-faint)" }}>VALUE</span>
              <p className="font-bold" style={{ color: "var(--w-ob-text)" }}>{revenueStr}</p>
            </div>
            <div>
              <span style={{ color: "var(--w-ob-text-faint)" }}>MARGIN</span>
              <p className="font-bold" style={{ color: "var(--w-ob-text-muted)" }}>{data.margin}%</p>
            </div>
            <div>
              <span style={{ color: "var(--w-ob-text-faint)" }}>DUE</span>
              <p className="font-bold" style={{ color: statusColor }}>
                {data.due_date}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <Handle type="source" position={Position.Right} className="!bg-violet-500 !w-2 !h-2" />
    </div>
  );
}