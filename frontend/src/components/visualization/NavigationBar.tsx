"use client";

import { motion } from "framer-motion";
import { Network, Globe, Warehouse } from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewTab = "graph" | "globe" | "stockroom";

interface NavigationBarProps {
  activeTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
}

const tabs: { id: ViewTab; label: string; icon: React.ReactNode }[] = [
  { id: "graph", label: "Supply Chain", icon: <Network size={16} /> },
  { id: "globe", label: "3D Globe", icon: <Globe size={16} /> },
  { id: "stockroom", label: "3D Stockroom", icon: <Warehouse size={16} /> },
];

export function NavigationBar({ activeTab, onTabChange }: NavigationBarProps) {
  return (
    <nav
      className="flex items-center gap-1 px-2 py-1.5 rounded-lg"
      style={{ background: "var(--w-ob-bg-tint)", border: "1px solid var(--w-ob-border)" }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "relative flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
              isActive
                ? "text-blue-600"
                : "hover:bg-white/60"
            )}
            style={!isActive ? { color: "var(--w-ob-text-muted)" } : undefined}
          >
            {isActive && (
              <motion.div
                layoutId="nav-active-bg"
                className="absolute inset-0 rounded-md bg-white shadow-sm"
                style={{ border: "1px solid var(--w-ob-border)" }}
                transition={{ type: "spring", duration: 0.35, bounce: 0.15 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              {tab.icon}
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
