"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MOCK_BOM } from "@/lib/mock-bom";
import { formatCompact, formatEUR } from "@/lib/utils";
import { getOperationsOverview, getPendingActions, approveAction, dismissAction } from "@/lib/api";
import { useWardenStore } from "@/lib/store";
import WardenAvatar from "@/components/WardenAvatar";
import type { PendingAction, DashboardOverview } from "@/lib/types";

const STATUS_COLORS: Record<string, string> = {
  healthy: "#0D9488",
  adequate: "#F59E0B",
  below_reorder: "#EF4444",
  critical: "#EF4444",
};

const STATUS_LABELS: Record<string, string> = {
  healthy: "Healthy",
  adequate: "Adequate",
  below_reorder: "Below Reorder",
  critical: "Critical",
};

const URGENCY_COLORS: Record<string, string> = {
  emergency: "#EF4444",
  critical: "#EF4444",
  high: "#F59E0B",
  medium: "#3b82f6",
  low: "#0D9488",
};

const STATUS_ORDER: Record<string, number> = {
  critical: 0,
  below_reorder: 1,
  adequate: 2,
  healthy: 3,
};

export default function InventoryPage() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [actions, setActions] = useState<PendingAction[]>([]);
  const [loading, setLoading] = useState(true);
  const { setPendingActions, updateActionStatus } = useWardenStore();

  useEffect(() => {
    Promise.all([getOperationsOverview(), getPendingActions()])
      .then(([ov, acts]) => {
        setOverview(ov);
        setActions(acts);
        setPendingActions(acts);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [setPendingActions]);

  const sortedBOM = useMemo(() => {
    return [...MOCK_BOM].sort(
      (a, b) => (STATUS_ORDER[a.inventory.status] ?? 9) - (STATUS_ORDER[b.inventory.status] ?? 9),
    );
  }, []);

  const criticalCount = useMemo(() => {
    return MOCK_BOM.filter(
      (i) => i.inventory.status === "below_reorder" || i.inventory.status === "critical",
    ).length;
  }, []);

  const riskScore = overview?.risk_score ?? 0;
  const revenueAtRisk = overview?.revenue_at_risk_eur ?? 0;

  const handleApprove = async (id: string) => {
    try {
      await approveAction(id);
      setActions((prev) => prev.map((a) => (a.action_id === id || a.id === id ? { ...a, status: "approved" as const } : a)));
      updateActionStatus(id, "approved");
    } catch {}
  };

  const handleDismiss = async (id: string) => {
    try {
      await dismissAction(id, "Dismissed from inventory dashboard");
      setActions((prev) => prev.map((a) => (a.action_id === id || a.id === id ? { ...a, status: "dismissed" as const } : a)));
      updateActionStatus(id, "dismissed");
    } catch {}
  };

  const pendingActions = actions.filter((a) => a.status === "pending");

  return (
    <div style={{ minHeight: "100vh", background: "var(--w-ob-bg, #f8fafc)" }}>
      {/* Header */}
      <header
        style={{
          background: "var(--w-ob-surface, #fff)",
          borderBottom: "1px solid var(--w-ob-border, #e2e8f0)",
          padding: "14px 24px",
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 36,
            height: 36,
            borderRadius: 8,
            border: "1px solid var(--w-ob-border, #e2e8f0)",
            color: "var(--w-ob-text, #0f172a)",
            textDecoration: "none",
          }}
        >
          <ArrowLeft size={18} />
        </Link>
        <WardenAvatar size={50} animation="idle" />
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--w-ob-text, #0f172a)", margin: 0 }}>
          Inventory Management
        </h1>
      </header>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 24px 48px" }}>
        {/* Metrics Row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 16,
            marginBottom: 28,
          }}
        >
          <MetricCard
            label="Risk Score"
            value={loading ? "..." : `${riskScore}`}
            color={riskScore > 60 ? "#EF4444" : riskScore > 30 ? "#F59E0B" : "#0D9488"}
          />
          <MetricCard
            label="Revenue at Risk"
            value={loading ? "..." : formatCompact(revenueAtRisk)}
            color="#F59E0B"
          />
          <MetricCard
            label="Critical Items"
            value={`${criticalCount}`}
            color={criticalCount > 0 ? "#EF4444" : "#0D9488"}
          />
          <MetricCard
            label="Pending Actions"
            value={loading ? "..." : `${pendingActions.length}`}
            color="var(--w-blue, #3b82f6)"
          />
        </div>

        {/* Main content: Table + Actions sidebar */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 24, alignItems: "start" }}>
          {/* Inventory Table */}
          <div
            style={{
              background: "var(--w-ob-surface, #fff)",
              borderRadius: 12,
              border: "1px solid var(--w-ob-border, #e2e8f0)",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--w-ob-border, #e2e8f0)" }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--w-ob-text, #0f172a)", margin: 0 }}>
                All Components ({MOCK_BOM.length})
              </h2>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--w-ob-border, #e2e8f0)" }}>
                    {["Component", "Category", "Status", "Stock", "Daily Usage", "Days of Supply", "Safety Stock", "Value"].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "10px 14px",
                          textAlign: "left",
                          fontSize: 11,
                          fontWeight: 600,
                          color: "#64748b",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedBOM.map((item) => {
                    const inv = item.inventory;
                    const maxDays = inv.reorder_point_units / inv.daily_consumption_units;
                    const progressPct = Math.min((inv.days_of_supply / maxDays) * 100, 100);
                    const barColor = STATUS_COLORS[inv.status];

                    return (
                      <tr
                        key={item.component_id}
                        style={{ borderBottom: "1px solid #f1f5f9" }}
                      >
                        <td style={{ padding: "12px 14px" }}>
                          <div style={{ fontWeight: 600, color: "var(--w-ob-text, #0f172a)" }}>{item.name}</div>
                          <div style={{ fontSize: 11, color: "#94a3b8" }}>{item.component_id}</div>
                        </td>
                        <td style={{ padding: "12px 14px", color: "#64748b" }}>{item.category}</td>
                        <td style={{ padding: "12px 14px" }}>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "3px 10px",
                              borderRadius: 9999,
                              fontSize: 11,
                              fontWeight: 600,
                              color: "#fff",
                              background: STATUS_COLORS[inv.status],
                            }}
                          >
                            {STATUS_LABELS[inv.status]}
                          </span>
                        </td>
                        <td style={{ padding: "12px 14px", fontVariantNumeric: "tabular-nums" }}>
                          {inv.current_stock_units.toLocaleString()}
                        </td>
                        <td style={{ padding: "12px 14px", fontVariantNumeric: "tabular-nums" }}>
                          {inv.daily_consumption_units.toLocaleString()}
                        </td>
                        <td style={{ padding: "12px 14px", minWidth: 140 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontVariantNumeric: "tabular-nums", minWidth: 28 }}>{inv.days_of_supply}</span>
                            <div
                              style={{
                                flex: 1,
                                height: 6,
                                borderRadius: 3,
                                background: "#f1f5f9",
                                overflow: "hidden",
                              }}
                            >
                              <div
                                style={{
                                  width: `${progressPct}%`,
                                  height: "100%",
                                  borderRadius: 3,
                                  background: barColor,
                                  transition: "width 0.3s ease",
                                }}
                              />
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "12px 14px", fontVariantNumeric: "tabular-nums" }}>
                          {inv.safety_stock_units.toLocaleString()}
                        </td>
                        <td style={{ padding: "12px 14px", fontVariantNumeric: "tabular-nums" }}>
                          {formatEUR(inv.inventory_value_eur)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pending Actions Panel */}
          <div
            style={{
              background: "var(--w-ob-surface, #fff)",
              borderRadius: 12,
              border: "1px solid var(--w-ob-border, #e2e8f0)",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--w-ob-border, #e2e8f0)" }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--w-ob-text, #0f172a)", margin: 0 }}>
                Pending Actions
              </h2>
            </div>
            <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              {loading ? (
                <div style={{ textAlign: "center", padding: 20, fontSize: 13, color: "#94a3b8" }}>
                  Loading actions...
                </div>
              ) : actions.length === 0 ? (
                <div style={{ textAlign: "center", padding: 20, fontSize: 13, color: "#94a3b8" }}>
                  No pending actions
                </div>
              ) : (
                actions.map((action) => (
                  <div
                    key={action.action_id || action.id}
                    style={{
                      background:
                        action.status === "approved"
                          ? "#f0fdf4"
                          : action.status === "dismissed"
                            ? "#fafafa"
                            : "#f8fafc",
                      borderRadius: 10,
                      padding: "12px 14px",
                      border: `1px solid ${action.status === "approved" ? "#bbf7d0" : "#e2e8f0"}`,
                      opacity: action.status === "dismissed" ? 0.5 : 1,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "2px 8px",
                          borderRadius: 9999,
                          fontSize: 10,
                          fontWeight: 600,
                          color: "#fff",
                          background: URGENCY_COLORS[action.urgency] || "#64748b",
                        }}
                      >
                        {action.urgency?.toUpperCase() || action.type?.toUpperCase()}
                      </span>
                      {action.status === "approved" && (
                        <span style={{ fontSize: 11, color: "#16a34a", fontWeight: 600 }}>Approved</span>
                      )}
                      {action.status === "dismissed" && (
                        <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>Dismissed</span>
                      )}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 4 }}>
                      {action.title}
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5, marginBottom: 10 }}>
                      {action.description}
                    </div>
                    {action.status === "pending" && (
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() => handleApprove(action.action_id || action.id)}
                          style={{
                            flex: 1,
                            padding: "6px 12px",
                            borderRadius: 7,
                            border: "none",
                            background: "var(--w-blue, #3b82f6)",
                            color: "#fff",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleDismiss(action.action_id || action.id)}
                          style={{
                            flex: 1,
                            padding: "6px 12px",
                            borderRadius: 7,
                            border: "1px solid #e2e8f0",
                            background: "#fff",
                            color: "#64748b",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Dismiss
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      style={{
        background: "var(--w-ob-surface, #fff)",
        borderRadius: 12,
        border: "1px solid var(--w-ob-border, #e2e8f0)",
        padding: "18px 20px",
      }}
    >
      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color, fontVariantNumeric: "tabular-nums" }}>{value}</div>
    </div>
  );
}
