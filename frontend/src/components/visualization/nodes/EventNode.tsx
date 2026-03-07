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
  label?: string;
  eventType?: string;
  delay?: string;
  affectedRegions?: string[];
  isSelectedEvent?: boolean;
  hasFreshIntelligence?: boolean;
  onViewIntelligence?: () => void;
}

interface EventNodeProps {
  data: EventData;
  selected?: boolean;
}

export function EventNode({ data, selected }: EventNodeProps) {
  const severityColor =
    data.severity >= 8
      ? "#EC4899"
      : data.severity >= 5
        ? "#f59e0b"
        : "#3b82f6";

  const eventType = data.eventType ?? data.type;
  const eventLabel = data.label ?? data.region;
  const isSelected = Boolean(data.isSelectedEvent ?? selected);
  const delay = data.delay ?? `+${data.expected_delay_days}d`;

  return (
    <div className="cursor-pointer">
      <motion.div
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="group relative w-[180px] rounded-xl border-2 shadow-sm overflow-hidden"
        style={{
          borderColor: isSelected ? severityColor : severityColor + "40",
          boxShadow: isSelected
            ? `0 0 0 3px ${severityColor}26, 0 8px 18px rgba(15, 23, 42, 0.12)`
            : "0 2px 8px rgba(15, 23, 42, 0.08)",
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
              {eventType}
            </span>
          </div>

          {/* Region */}
          <p className="text-sm font-semibold mb-2 leading-snug" style={{ color: "var(--w-ob-text)" }}>
            {eventLabel}
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
              <p className="font-bold" style={{ color: "var(--w-ob-text-muted)" }}>{delay}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              data.onViewIntelligence?.();
            }}
            className="nodrag nopan mt-2 text-[10px] font-medium text-teal-600 opacity-0 group-hover:opacity-100 transition-opacity hover:text-teal-700"
            style={{ letterSpacing: "0.01em" }}
          >
            View Intelligence →
          </button>
        </div>

        {data.hasFreshIntelligence && (
          <motion.span
            className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: "#14b8a6" }}
            animate={{ opacity: [0.35, 1, 0.35], scale: [0.95, 1.2, 0.95] }}
            transition={{ duration: 1.1, repeat: Infinity }}
          />
        )}
      </motion.div>

      <Handle type="source" position={Position.Right} className="!bg-pink-500 !w-2 !h-2" />
    </div>
  );
}
