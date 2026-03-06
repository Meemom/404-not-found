"use client";

import { Handle, Position } from "reactflow";
import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";

export interface EventData {
  id: string;
  type: string;
  region: string;
  severity: number;
  confidence: number;
  expected_delay_days: number;
  start_time: string;
  onClick?: (nodeId: string) => void;
}

interface EventNodeProps {
  data: EventData;
  id: string;
}

export function EventNode({ data, id }: EventNodeProps) {
  const severityColor =
    data.severity >= 8
      ? "#ef4444"
      : data.severity >= 5
        ? "#f59e0b"
        : "#3b82f6";

  return (
    <div onClick={() => data.onClick?.(id)} className="cursor-pointer">
      <motion.div
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="relative w-[180px] rounded-xl border-2 shadow-sm overflow-hidden"
        style={{
          borderColor: severityColor + "40",
          background: "#FFFFFF",
        }}
      >
        {/* Severity pulse */}
        <motion.div
          className="absolute inset-0 rounded-xl"
          style={{ backgroundColor: severityColor }}
          animate={{ opacity: [0.03, 0.08, 0.03] }}
          transition={{ duration: 2, repeat: Infinity }}
        />

        <div className="relative p-4">
          {/* Header */}
          <div className="flex items-center gap-2 mb-3">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <AlertTriangle size={16} style={{ color: severityColor }} />
            </motion.div>
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: severityColor }}>
              {data.type}
            </span>
          </div>

          {/* Region */}
          <p className="text-sm font-semibold mb-2 leading-snug" style={{ color: "var(--w-ob-text)" }}>
            {data.region}
          </p>

          {/* Metrics row */}
          <div className="flex items-center gap-3 text-[10px]">
            <div>
              <span style={{ color: "var(--w-ob-text-faint)" }}>SEV</span>
              <p className="font-bold" style={{ color: severityColor }}>
                {data.severity}/10
              </p>
            </div>
            <div>
              <span style={{ color: "var(--w-ob-text-faint)" }}>CONF</span>
              <p className="font-bold" style={{ color: "var(--w-ob-text-muted)" }}>{data.confidence}%</p>
            </div>
            <div>
              <span style={{ color: "var(--w-ob-text-faint)" }}>DELAY</span>
              <p className="font-bold" style={{ color: "var(--w-ob-text-muted)" }}>+{data.expected_delay_days}d</p>
            </div>
          </div>
        </div>
      </motion.div>

      <Handle type="source" position={Position.Right} className="!bg-red-500 !w-2 !h-2" />
    </div>
  );
}
