"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  AlertCircle,
  TrendingDown,
  Package,
  Activity,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarNode {
  id: string;
  label: string;
  type: string;
  health: number;
}

interface SidebarDisruption {
  id: string;
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  affectedSuppliers: number;
}

interface SidebarAction {
  id: string;
  title: string;
  urgency: "critical" | "high" | "medium" | "low";
  type: "email" | "escalation" | "po_adjustment";
}

interface VisualizationSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  nodes: SidebarNode[];
  disruptions: SidebarDisruption[];
  actions: SidebarAction[];
  onNodeClick?: (nodeId: string) => void;
  overallHealth?: number;
  revenueAtRisk?: number;
  activeAlerts?: number;
}

export function VisualizationSidebar({
  isOpen,
  onToggle,
  nodes,
  disruptions,
  actions,
  onNodeClick,
  overallHealth = 72,
  revenueAtRisk = 4200000,
  activeAlerts = 3,
}: VisualizationSidebarProps) {
  const [expandedSection, setExpandedSection] = useState<
    "nodes" | "disruptions" | "actions" | null
  >("nodes");

  const getSeverityColor = (
    severity: "critical" | "high" | "medium" | "low"
  ) => {
    switch (severity) {
      case "critical":
        return "bg-red-900/20 border-red-600/30 text-red-400";
      case "high":
        return "bg-orange-900/20 border-orange-600/30 text-orange-400";
      case "medium":
        return "bg-yellow-900/20 border-yellow-600/30 text-yellow-400";
      case "low":
        return "bg-green-900/20 border-green-600/30 text-green-400";
    }
  };

  const getSeverityBadgeColor = (
    severity: "critical" | "high" | "medium" | "low"
  ) => {
    switch (severity) {
      case "critical":
        return "bg-red-600/30 text-red-300";
      case "high":
        return "bg-orange-600/30 text-orange-300";
      case "medium":
        return "bg-yellow-600/30 text-yellow-300";
      case "low":
        return "bg-green-600/30 text-green-300";
    }
  };

  const getUrgencyColor = (urgency: "critical" | "high" | "medium" | "low") => {
    switch (urgency) {
      case "critical":
        return "bg-red-900/20 border-red-600/30";
      case "high":
        return "bg-orange-900/20 border-orange-600/30";
      case "medium":
        return "bg-yellow-900/20 border-yellow-600/30";
      case "low":
        return "bg-blue-900/20 border-blue-600/30";
    }
  };

  const getHealthColor = (health: number) => {
    if (health > 70) return "text-green-400";
    if (health > 40) return "text-amber-400";
    return "text-red-400";
  };

  const getHealthBgColor = (health: number) => {
    if (health > 70) return "from-green-900/20 to-transparent";
    if (health > 40) return "from-amber-900/20 to-transparent";
    return "from-red-900/20 to-transparent";
  };

  return (
    <>
      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onToggle}
        className="fixed right-4 top-1/2 transform -translate-y-1/2 z-40 p-2 rounded-l-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 border-r-0 transition-colors"
      >
        <ChevronLeft
          size={20}
          className={cn(
            "text-slate-400 transition-transform",
            !isOpen && "rotate-180"
          )}
        />
      </motion.button>

      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onToggle}
              className="fixed inset-0 bg-black/40 z-30 md:hidden"
            />

            {/* Sidebar Panel */}
            <motion.div
              initial={{ x: 380 }}
              animate={{ x: 0 }}
              exit={{ x: 380 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 h-screen w-80 bg-gradient-to-b from-slate-900 to-slate-800 border-l border-slate-700 z-30 flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-b from-slate-800 to-slate-800/50 px-6 py-4 border-b border-slate-700 shrink-0">
                <h2 className="text-lg font-bold text-white mb-1">
                  Supply Chain Status
                </h2>
                <p className="text-xs text-slate-400">
                  Real-time visualization summary
                </p>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto space-y-4 px-4 py-4">
                {/* Overall Stats */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    {/* Overall Health */}
                    <div className={cn(
                      "rounded-lg p-3 border border-slate-600 bg-gradient-to-br",
                      getHealthBgColor(overallHealth)
                    )}>
                      <p className="text-xs text-slate-400 mb-1">
                        Overall Health
                      </p>
                      <p className={cn("text-xl font-bold", getHealthColor(overallHealth))}>
                        {Math.round(overallHealth)}%
                      </p>
                    </div>

                    {/* Active Alerts */}
                    <div className="rounded-lg p-3 border border-slate-600 bg-gradient-to-br from-orange-900/20 to-transparent">
                      <p className="text-xs text-slate-400 mb-1">
                        Active Alerts
                      </p>
                      <p className="text-xl font-bold text-orange-400">
                        {activeAlerts}
                      </p>
                    </div>
                  </div>

                  {/* Revenue at Risk */}
                  <div className="rounded-lg p-3 border border-red-600/30 bg-red-900/20">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingDown size={14} className="text-red-400" />
                      <p className="text-xs text-slate-400">Revenue at Risk</p>
                    </div>
                    <p className="text-sm font-bold text-red-400">
                      €{(revenueAtRisk / 1000000).toFixed(1)}M
                    </p>
                  </div>
                </div>

                {/* Nodes Section */}
                <div className="border-t border-slate-700 pt-4">
                  <motion.button
                    onClick={() =>
                      setExpandedSection(
                        expandedSection === "nodes" ? null : "nodes"
                      )
                    }
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Activity size={16} className="text-blue-400" />
                      <span className="text-sm font-semibold text-white">
                        Agent Nodes
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">
                      {nodes.length}
                    </span>
                  </motion.button>

                  <AnimatePresence>
                    {expandedSection === "nodes" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-2 mt-2"
                      >
                        {nodes.map((node) => (
                          <motion.button
                            key={node.id}
                            whileHover={{ scale: 1.02 }}
                            onClick={() => onNodeClick?.(node.id)}
                            className={cn(
                              "w-full text-left px-3 py-2 rounded-lg border border-slate-600 transition-all hover:border-slate-500",
                              getHealthBgColor(node.health)
                            )}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-slate-100">
                                {node.label}
                              </span>
                              <span
                                className={cn(
                                  "text-xs font-bold",
                                  getHealthColor(node.health)
                                )}
                              >
                                {Math.round(node.health)}%
                              </span>
                            </div>
                            <p className="text-xs text-slate-400">
                              {node.type}
                            </p>
                          </motion.button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Disruptions Section */}
                {disruptions.length > 0 && (
                  <div className="border-t border-slate-700 pt-4">
                    <motion.button
                      onClick={() =>
                        setExpandedSection(
                          expandedSection === "disruptions" ? null : "disruptions"
                        )
                      }
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-700/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <AlertTriangle size={16} className="text-orange-400" />
                        <span className="text-sm font-semibold text-white">
                          Disruptions
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">
                        {disruptions.length}
                      </span>
                    </motion.button>

                    <AnimatePresence>
                      {expandedSection === "disruptions" && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-2 mt-2"
                        >
                          {disruptions.map((disruption) => (
                            <div
                              key={disruption.id}
                              className={cn(
                                "px-3 py-2 rounded-lg border",
                                getSeverityColor(disruption.severity)
                              )}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm font-medium">
                                  {disruption.title}
                                </p>
                                <span
                                  className={cn(
                                    "text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap",
                                    getSeverityBadgeColor(disruption.severity)
                                  )}
                                >
                                  {disruption.severity}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 mt-1">
                                {disruption.affectedSuppliers} supplier
                                {disruption.affectedSuppliers !== 1
                                  ? "s"
                                  : ""}{" "}
                                affected
                              </p>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Pending Actions Section */}
                {actions.length > 0 && (
                  <div className="border-t border-slate-700 pt-4">
                    <motion.button
                      onClick={() =>
                        setExpandedSection(
                          expandedSection === "actions" ? null : "actions"
                        )
                      }
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-700/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-purple-400" />
                        <span className="text-sm font-semibold text-white">
                          Pending Actions
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">
                        {actions.length}
                      </span>
                    </motion.button>

                    <AnimatePresence>
                      {expandedSection === "actions" && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-2 mt-2"
                        >
                          {actions.map((action) => (
                            <div
                              key={action.id}
                              className={cn(
                                "px-3 py-2 rounded-lg border",
                                getUrgencyColor(action.urgency)
                              )}
                            >
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <p className="text-sm font-medium text-slate-100">
                                  {action.title}
                                </p>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 whitespace-nowrap">
                                  {action.type.replace("_", " ")}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span
                                  className={cn(
                                    "text-xs font-semibold",
                                    action.urgency === "critical"
                                      ? "text-red-400"
                                      : action.urgency === "high"
                                        ? "text-orange-400"
                                        : "text-yellow-400"
                                  )}
                                >
                                  {action.urgency} urgency
                                </span>
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Footer Info */}
                <div className="border-t border-slate-700 pt-4 pb-4">
                  <div className="rounded-lg bg-slate-800/50 border border-slate-700 p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle size={14} className="text-blue-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-slate-400">
                        Click on nodes to view detailed metrics and expanded information.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
