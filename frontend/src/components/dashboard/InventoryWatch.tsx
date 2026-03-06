"use client";

import { motion } from "framer-motion";
import { Package, AlertTriangle } from "lucide-react";
import type { CriticalInventory } from "@/lib/types";

interface InventoryWatchProps {
  items: CriticalInventory[];
}

export function InventoryWatch({ items }: InventoryWatchProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.4 }}
      className="warden-card border border-warden-border p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Package size={16} className="text-warden-teal" />
          <h3 className="text-sm font-semibold text-warden-text-primary">
            Critical Inventory
          </h3>
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item, i) => {
          const ratio = Math.min(item.days_of_supply / item.reorder_point_days, 1);
          const isCritical = item.days_of_supply < item.reorder_point_days;

          return (
            <motion.div
              key={item.component_id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.08 }}
              className="space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {isCritical && (
                    <AlertTriangle size={10} className="text-warden-pink" />
                  )}
                  <span className="text-xs text-warden-text-primary font-medium">
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-data text-xs text-warden-text-secondary">
                    {item.days_of_supply}d
                  </span>
                  <span className="text-[9px] text-warden-text-tertiary">
                    / {item.reorder_point_days}d min
                  </span>
                </div>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${
                    isCritical ? "bg-warden-pink" : "bg-warden-teal"
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${ratio * 100}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
