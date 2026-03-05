"use client";

import { Handle, Position } from "reactflow";
import { motion } from "framer-motion";
import { BarChart3 } from "lucide-react";

interface GraphNodeProps {
  data: {
    label: string;
    health: number;
    onClick?: (nodeId: string) => void;
  };
  id: string;
}

export function GraphNode({ data, id }: GraphNodeProps) {
  const healthColor =
    data.health > 70 ? "#10b981" : data.health > 40 ? "#f59e0b" : "#ef4444";

  return (
    <div
      onClick={() => data.onClick?.(id)}
      className="cursor-pointer"
    >
      <Handle type="target" position={Position.Top} />

      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="relative w-20 h-20 rounded-xl bg-gradient-to-br from-cyan-900 to-cyan-800 border-2 border-cyan-400 shadow-lg flex items-center justify-center group hover:shadow-xl transition-shadow"
        style={{ borderColor: healthColor }}
      >
        <div
          className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity"
          style={{ backgroundColor: healthColor }}
        />

        <motion.div
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <BarChart3 size={24} style={{ color: healthColor }} />
        </motion.div>

        <div
          className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs font-semibold whitespace-nowrap"
          style={{ color: healthColor }}
        >
          {Math.round(data.health)}%
        </div>
      </motion.div>

      <div className="mt-10 text-center">
        <p className="text-xs font-semibold text-gray-200">{data.label}</p>
      </div>

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
