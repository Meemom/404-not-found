"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  AlertCircle,
  TrendingDown,
  AlertTriangle,
  Truck,
  Cpu,
  ShoppingCart,
  Users,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EventSummary {
  id: string;
  type: string;
  region: string;
  severity: number;
  confidence: number;
  expected_delay_days: number;
}

interface SupplierSummary {
  id: string;
  name: string;
  country: string;
  health_score: number;
  criticality: string;
}

interface PartSummary {
  id: string;
  name: string;
  criticality: string;
  inventory_days: number;
  safety_stock_days: number;
}

interface OrderSummary {
  id: string;
  customer: string;
  due_date: string;
  revenue: number;
  status: string;
}

interface CustomerSummary {
  id: string;
  name: string;
  annual_revenue: number;
  sla_days: number;
}

interface VisualizationSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  events: EventSummary[];
  suppliers: SupplierSummary[];
  parts: PartSummary[];
  orders: OrderSummary[];
  customers: CustomerSummary[];
  onNodeClick?: (nodeId: string) => void;
}

type Section = "events" | "suppliers" | "parts" | "orders" | "customers" | null;

export function VisualizationSidebar({
  isOpen,
  onToggle,
  events,
  suppliers,
  parts,
  orders,
  customers,
  onNodeClick,
}: VisualizationSidebarProps) {
  const [expandedSection, setExpandedSection] = useState<Section>("events");

  const criticalSuppliers = suppliers.filter((s) => s.health_score < 50);
  const atRiskOrders = orders.filter((o) => o.status === "at_risk" || o.status === "delayed");
  const lowStockParts = parts.filter((p) => p.inventory_days < p.safety_stock_days);
  const totalRevenueAtRisk = atRiskOrders.reduce((sum, o) => sum + o.revenue, 0);
  const avgSupplierHealth = suppliers.length
    ? Math.round(suppliers.reduce((sum, s) => sum + s.health_score, 0) / suppliers.length)
    : 0;

  const getHealthColor = (health: number) => {
    if (health > 70) return "text-green-600";
    if (health > 40) return "text-amber-600";
    return "text-red-600";
  };

  const getHealthBarColor = (health: number) => {
    if (health > 70) return "bg-green-500";
    if (health > 40) return "bg-amber-500";
    return "bg-red-500";
  };

  const getCriticalityColor = (c: string) => {
    if (c === "critical") return "text-red-600 bg-red-50";
    if (c === "high") return "text-orange-600 bg-orange-50";
    return "text-yellow-600 bg-yellow-50";
  };

  const getStatusColor = (s: string) => {
    if (s === "at_risk") return "text-red-600";
    if (s === "delayed") return "text-orange-500";
    return "text-green-600";
  };

  const formatRevenue = (v: number) =>
    v >= 1_000_000 ? `€${(v / 1_000_000).toFixed(1)}M` : `€${(v / 1_000).toFixed(0)}K`;

  const toggleSection = (section: Section) =>
    setExpandedSection(expandedSection === section ? null : section);

  return (
    <>
      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onToggle}
        className="fixed top-1/2 transform -translate-y-1/2 z-40 p-2 rounded-l-lg transition-colors"
        style={{
          right: isOpen ? "320px" : "0px",
          background: "var(--w-ob-surface)",
          border: "1px solid var(--w-ob-border)",
          borderRight: "none",
        }}
      >
        <ChevronLeft
          size={20}
          className={cn(
            "transition-transform",
            !isOpen && "rotate-180"
          )}
          style={{ color: "var(--w-ob-text-muted)" }}
        />
      </motion.button>

      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop (mobile) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onToggle}
              className="fixed inset-0 bg-black/10 z-30 md:hidden"
            />

            {/* Sidebar Panel */}
            <motion.div
              initial={{ x: 320 }}
              animate={{ x: 0 }}
              exit={{ x: 320 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 h-screen w-80 z-30 flex flex-col overflow-hidden"
              style={{
                background: "var(--w-ob-surface)",
                borderLeft: "1px solid var(--w-ob-border)",
              }}
            >
              {/* Header */}
              <div className="px-5 py-4 shrink-0" style={{ borderBottom: "1px solid var(--w-ob-border)" }}>
                <h2 className="text-lg font-bold mb-1" style={{ color: "var(--w-ob-text)" }}>
                  Supply Chain Status
                </h2>
                <p className="text-xs" style={{ color: "var(--w-ob-text-faint)" }}>
                  Real-time overview
                </p>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto space-y-3 px-4 py-4">
                {/* KPI Cards */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg p-3 border" style={{ borderColor: "var(--w-ob-border)", background: "var(--w-ob-bg-tint)" }}>
                    <p className="text-[10px] mb-1" style={{ color: "var(--w-ob-text-faint)" }}>Avg Supplier Health</p>
                    <p className={cn("text-xl font-bold", getHealthColor(avgSupplierHealth))}>
                      {avgSupplierHealth}%
                    </p>
                  </div>
                  <div className="rounded-lg p-3 border border-orange-200 bg-orange-50">
                    <p className="text-[10px] mb-1" style={{ color: "var(--w-ob-text-faint)" }}>Active Disruptions</p>
                    <p className="text-xl font-bold text-orange-500">{events.length}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg p-3 border border-red-200 bg-red-50">
                    <div className="flex items-center gap-1.5 mb-1">
                      <TrendingDown size={12} className="text-red-500" />
                      <p className="text-[10px]" style={{ color: "var(--w-ob-text-faint)" }}>Revenue at Risk</p>
                    </div>
                    <p className="text-lg font-bold text-red-600">
                      {formatRevenue(totalRevenueAtRisk)}
                    </p>
                  </div>
                  <div className="rounded-lg p-3 border" style={{ borderColor: "var(--w-ob-border)", background: "var(--w-ob-bg-tint)" }}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <AlertTriangle size={12} className="text-amber-500" />
                      <p className="text-[10px]" style={{ color: "var(--w-ob-text-faint)" }}>Low Stock Parts</p>
                    </div>
                    <p className="text-lg font-bold text-amber-600">{lowStockParts.length}</p>
                  </div>
                </div>

                {/* Events Section */}
                <SectionHeader
                  icon={<Zap size={16} className="text-red-500" />}
                  label="Events"
                  count={events.length}
                  isOpen={expandedSection === "events"}
                  onToggle={() => toggleSection("events")}
                />
                <AnimatePresence>
                  {expandedSection === "events" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2 overflow-hidden"
                    >
                      {events.map((evt) => (
                        <button
                          key={evt.id}
                          onClick={() => onNodeClick?.(evt.id)}
                          className="w-full text-left px-3 py-2.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium" style={{ color: "var(--w-ob-text)" }}>{evt.region}</span>
                            <span className="text-xs font-bold text-red-600">
                              {evt.severity}/10
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[10px]" style={{ color: "var(--w-ob-text-faint)" }}>
                            <span>{evt.type}</span>
                            <span>{evt.confidence}% confidence</span>
                            <span>+{evt.expected_delay_days}d delay</span>
                          </div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Suppliers Section */}
                <SectionHeader
                  icon={<Truck size={16} className="text-blue-500" />}
                  label="Suppliers"
                  count={suppliers.length}
                  badge={criticalSuppliers.length > 0 ? `${criticalSuppliers.length} critical` : undefined}
                  badgeColor="text-red-600"
                  isOpen={expandedSection === "suppliers"}
                  onToggle={() => toggleSection("suppliers")}
                />
                <AnimatePresence>
                  {expandedSection === "suppliers" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2 overflow-hidden"
                    >
                      {suppliers.map((sup) => (
                        <button
                          key={sup.id}
                          onClick={() => onNodeClick?.(sup.id)}
                          className="w-full text-left px-3 py-2.5 rounded-lg border hover:bg-slate-50 transition-colors"
                          style={{ borderColor: "var(--w-ob-border)" }}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-sm font-medium" style={{ color: "var(--w-ob-text)" }}>{sup.name}</span>
                            <span className={cn("text-xs font-bold", getHealthColor(sup.health_score))}>
                              {sup.health_score}%
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={cn("h-full rounded-full transition-all", getHealthBarColor(sup.health_score))}
                                style={{ width: `${sup.health_score}%` }}
                              />
                            </div>
                            <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-semibold", getCriticalityColor(sup.criticality))}>
                              {sup.criticality}
                            </span>
                          </div>
                          <p className="text-[10px] mt-1" style={{ color: "var(--w-ob-text-faint)" }}>{sup.country}</p>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Parts Section */}
                <SectionHeader
                  icon={<Cpu size={16} className="text-teal-500" />}
                  label="Parts"
                  count={parts.length}
                  badge={lowStockParts.length > 0 ? `${lowStockParts.length} low stock` : undefined}
                  badgeColor="text-amber-600"
                  isOpen={expandedSection === "parts"}
                  onToggle={() => toggleSection("parts")}
                />
                <AnimatePresence>
                  {expandedSection === "parts" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2 overflow-hidden"
                    >
                      {parts.map((part) => {
                        const isLow = part.inventory_days < part.safety_stock_days;
                        return (
                          <button
                            key={part.id}
                            onClick={() => onNodeClick?.(part.id)}
                            className={cn(
                              "w-full text-left px-3 py-2.5 rounded-lg border transition-colors",
                              isLow
                                ? "border-red-200 bg-red-50 hover:bg-red-100"
                                : "hover:bg-slate-50"
                            )}
                            style={!isLow ? { borderColor: "var(--w-ob-border)" } : undefined}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium font-mono" style={{ color: "var(--w-ob-text)" }}>{part.name}</span>
                              <span className={cn("text-xs font-bold", isLow ? "text-red-600" : "text-green-600")}>
                                {part.inventory_days}d stock
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-[10px]" style={{ color: "var(--w-ob-text-faint)" }}>
                              <span>Safety: {part.safety_stock_days}d</span>
                              <span className={cn("font-semibold px-1.5 py-0.5 rounded-full", getCriticalityColor(part.criticality))}>
                                {part.criticality}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Orders Section */}
                <SectionHeader
                  icon={<ShoppingCart size={16} className="text-violet-500" />}
                  label="Orders"
                  count={orders.length}
                  badge={atRiskOrders.length > 0 ? `${atRiskOrders.length} at risk` : undefined}
                  badgeColor="text-red-600"
                  isOpen={expandedSection === "orders"}
                  onToggle={() => toggleSection("orders")}
                />
                <AnimatePresence>
                  {expandedSection === "orders" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2 overflow-hidden"
                    >
                      {orders.map((ord) => {
                        const isRisk = ord.status === "at_risk" || ord.status === "delayed";
                        return (
                          <button
                            key={ord.id}
                            onClick={() => onNodeClick?.(ord.id)}
                            className={cn(
                              "w-full text-left px-3 py-2.5 rounded-lg border transition-colors",
                              isRisk
                                ? "border-red-200 bg-red-50 hover:bg-red-100"
                                : "hover:bg-slate-50"
                            )}
                            style={!isRisk ? { borderColor: "var(--w-ob-border)" } : undefined}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium" style={{ color: "var(--w-ob-text)" }}>
                                {ord.customer} {ord.id}
                              </span>
                              <span className={cn("text-xs font-bold uppercase", getStatusColor(ord.status))}>
                                {ord.status.replace("_", " ")}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-[10px]" style={{ color: "var(--w-ob-text-faint)" }}>
                              <span>{formatRevenue(ord.revenue)}</span>
                              <span>Due {ord.due_date}</span>
                            </div>
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Customers Section */}
                <SectionHeader
                  icon={<Users size={16} className="text-emerald-500" />}
                  label="Customers"
                  count={customers.length}
                  isOpen={expandedSection === "customers"}
                  onToggle={() => toggleSection("customers")}
                />
                <AnimatePresence>
                  {expandedSection === "customers" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2 overflow-hidden"
                    >
                      {customers.map((cust) => (
                        <button
                          key={cust.id}
                          onClick={() => onNodeClick?.(cust.id)}
                          className="w-full text-left px-3 py-2.5 rounded-lg border hover:bg-slate-50 transition-colors"
                          style={{ borderColor: "var(--w-ob-border)" }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium" style={{ color: "var(--w-ob-text)" }}>{cust.name}</span>
                            <span className="text-xs font-bold text-emerald-600">
                              {formatRevenue(cust.annual_revenue)}/yr
                            </span>
                          </div>
                          <p className="text-[10px]" style={{ color: "var(--w-ob-text-faint)" }}>
                            SLA: {cust.sla_days} day delivery window
                          </p>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Footer */}
                <div className="pt-3 pb-4" style={{ borderTop: "1px solid var(--w-ob-border)" }}>
                  <div className="rounded-lg p-3 border" style={{ borderColor: "var(--w-ob-border)", background: "var(--w-ob-bg-tint)" }}>
                    <div className="flex items-start gap-2">
                      <AlertCircle size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
                      <p className="text-[10px]" style={{ color: "var(--w-ob-text-faint)" }}>
                        Click any item to locate it on the graph. Click nodes directly for detailed expanded views.
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

function SectionHeader({
  icon,
  label,
  count,
  badge,
  badgeColor,
  isOpen,
  onToggle,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  badge?: string;
  badgeColor?: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="pt-3" style={{ borderTop: "1px solid var(--w-ob-border)" }}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-semibold" style={{ color: "var(--w-ob-text)" }}>{label}</span>
        </div>
        <div className="flex items-center gap-2">
          {badge && (
            <span className={cn("text-[10px] font-semibold", badgeColor)}>{badge}</span>
          )}
          <span className="text-xs" style={{ color: "var(--w-ob-text-faint)" }}>{count}</span>
          <ChevronLeft
            size={14}
            className={cn(
              "transition-transform",
              isOpen ? "-rotate-90" : "rotate-0"
            )}
            style={{ color: "var(--w-ob-text-faint)" }}
          />
        </div>
      </button>
    </div>
  );
}