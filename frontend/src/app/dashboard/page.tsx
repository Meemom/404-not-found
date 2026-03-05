"use client";

import { useWardenStore } from "@/lib/store";
import { RiskGauge } from "@/components/dashboard/RiskGauge";
import { StatCard } from "@/components/dashboard/StatCard";
import { SupplierHealthGrid } from "@/components/dashboard/SupplierHealthGrid";
import { ActiveAlerts } from "@/components/dashboard/ActiveAlerts";
import { SLACountdown } from "@/components/dashboard/SLACountdown";
import { InventoryWatch } from "@/components/dashboard/InventoryWatch";
import {
  DollarSign,
  Users,
  Package,
  Truck,
  Shield,
  Globe,
} from "lucide-react";
import { formatCompact, formatEUR } from "@/lib/utils";
import { motion } from "framer-motion";
import Link from "next/link";

export default function DashboardPage() {
  const { dashboard, company } = useWardenStore();

  if (!dashboard) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-warden-amber/30 border-t-warden-amber rounded-full animate-spin" />
          <span className="text-xs text-warden-text-tertiary">
            Loading dashboard...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto">
      {/* Header Row */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-xl font-bold text-warden-text-primary">
            Operations Overview
          </h1>
          <p className="text-xs text-warden-text-tertiary mt-0.5">
            {company?.name ?? "Company"} — Real-time supply chain intelligence
          </p>
        </div>
        <Link
          href="/dashboard/globe"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-warden-bg-elevated border border-warden-border hover:border-warden-amber/30 transition-all group"
        >
          <Globe size={14} className="text-warden-text-secondary group-hover:text-warden-amber transition-colors" />
          <span className="text-xs text-warden-text-secondary group-hover:text-warden-amber transition-colors">
            View Globe
          </span>
        </Link>
      </motion.div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="warden-card border border-warden-amber/20 p-5 flex items-center gap-5">
          <RiskGauge score={dashboard.risk_score} />
          <div>
            <p className="text-xs text-warden-text-tertiary mb-1">
              Overall Portfolio Risk
            </p>
            <p className="text-sm text-warden-text-secondary leading-relaxed">
              {dashboard.risk_score > 60
                ? "Critical — immediate action required"
                : dashboard.risk_score > 30
                ? "Elevated — monitoring closely"
                : "Stable — no immediate concerns"}
            </p>
          </div>
        </div>

        <StatCard
          title="Revenue at Risk"
          value={formatCompact(dashboard.revenue_at_risk_eur)}
          subtitle={`${dashboard.sla_at_risk_orders?.length ?? 0} orders at risk`}
          icon={<DollarSign size={16} />}
          accent="coral"
          delay={0.1}
        />

        <StatCard
          title="Suppliers Monitored"
          value={dashboard.supplier_health?.length ?? 0}
          subtitle={`${dashboard.supplier_health?.filter((s) => s.status === "at_risk").length ?? 0} at risk`}
          icon={<Users size={16} />}
          accent="blue"
          delay={0.15}
        />

        <StatCard
          title="Active Disruptions"
          value={dashboard.active_alerts ?? 0}
          subtitle="Currently being monitored"
          trend={
            (dashboard.active_alerts ?? 0) > 0 ? "up" : "neutral"
          }
          trendValue={
            (dashboard.active_alerts ?? 0) > 0
              ? `${dashboard.active_alerts} active`
              : "Clear"
          }
          icon={<Shield size={16} />}
          accent={
            (dashboard.active_alerts ?? 0) > 0 ? "coral" : "teal"
          }
          delay={0.2}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Alerts + SLA */}
        <div className="lg:col-span-1 space-y-4">
          <ActiveAlerts disruptions={dashboard.disruptions ?? []} />
          <SLACountdown orders={dashboard.sla_at_risk_orders ?? []} />
        </div>

        {/* Middle Column: Supplier Health */}
        <div className="lg:col-span-1">
          <SupplierHealthGrid
            suppliers={dashboard.supplier_health ?? []}
          />
        </div>

        {/* Right Column: Inventory */}
        <div className="lg:col-span-1">
          <InventoryWatch
            items={dashboard.critical_inventory ?? []}
          />
        </div>
      </div>

      {/* Quick Actions Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="warden-glass border border-warden-amber/10 p-4 flex items-center justify-between rounded-xl"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-warden-amber/10 flex items-center justify-center">
            <Truck size={16} className="text-warden-amber" />
          </div>
          <div>
            <p className="text-sm font-medium text-warden-text-primary">
              Warden has{" "}
              <span className="text-warden-amber font-bold">
                {dashboard.pending_actions ?? 0} pending actions
              </span>{" "}
              ready for your approval
            </p>
            <p className="text-[10px] text-warden-text-tertiary">
              Including expedited shipping and alternative sourcing
              recommendations
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/actions"
          className="px-4 py-2 bg-warden-amber text-warden-bg-primary text-xs font-bold rounded-lg hover:bg-warden-amber-glow transition-colors"
        >
          Review Actions
        </Link>
      </motion.div>
    </div>
  );
}
