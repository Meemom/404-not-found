"use client";

import { Handle, Position } from "reactflow";
import { motion } from "framer-motion";
import { Factory } from "lucide-react";

export interface SupplierData {
  id: string;
  name: string;
  country: string;
  health_score: number;
  criticality: string;
  onClick?: (nodeId: string) => void;
}

interface SupplierNodeProps {
  data: SupplierData;
  id: string;
}

export function SupplierNode({ data, id }: SupplierNodeProps) {
  const healthColor =
    data.health_score > 70
      ? "#10b981"
      : data.health_score > 40
        ? "#f59e0b"
        : "#EC4899";

  const critBadge =
    data.criticality === "critical"
      ? "bg-pink-50 text-pink-600 border-pink-200"
      : data.criticality === "high"
        ? "bg-orange-50 text-orange-600 border-orange-200"
        : "bg-blue-50 text-blue-600 border-blue-200";

  return (
    <div onClick={() => data.onClick?.(id)} className="cursor-pointer">
      <Handle type="target" position={Position.Left} className="!bg-blue-500 !w-2 !h-2" />

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
              <Factory size={14} className="text-blue-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500">
                Supplier
              </span>
            </div>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${critBadge}`}>
              {data.criticality}
            </span>
          </div>

          {/* Name */}
          <p className="text-sm font-semibold mb-1" style={{ color: "var(--w-ob-text)" }}>{data.name}</p>
          <p className="text-[10px] mb-3" style={{ color: "var(--w-ob-text-faint)" }}>{data.country}</p>

          {/* Health bar */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: healthColor }}
                initial={{ width: 0 }}
                animate={{ width: `${data.health_score}%` }}
                transition={{ duration: 1, delay: 0.3 }}
              />
            </div>
            <span className="text-[10px] font-bold" style={{ color: healthColor }}>
              {data.health_score}%
            </span>
          </div>
        </div>
      </motion.div>

      <Handle type="source" position={Position.Right} className="!bg-blue-500 !w-2 !h-2" />
      <Handle
        type="target"
        position={Position.Bottom}
        id="alt-target"
        className="!bg-yellow-500 !w-2 !h-2"
      />
      <Handle
        type="source"
        position={Position.Top}
        id="alt-source"
        className="!bg-yellow-500 !w-2 !h-2"
      />
    </div>
  );
}