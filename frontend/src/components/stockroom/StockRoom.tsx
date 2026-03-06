"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BOMItem } from "@/lib/types";
import { initScene, updateInventory, dispose, type StockSceneState } from "./StockScene";
import WardenAvatar from "@/components/WardenAvatar";

interface StockRoomProps {
  inventory: BOMItem[];
}

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

const CRITICALITY_COLORS: Record<string, string> = {
  critical: "#EF4444",
  medium: "#F59E0B",
  low: "#0D9488",
};

export default function StockRoom({ inventory }: StockRoomProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<StockSceneState | null>(null);
  const [selectedItem, setSelectedItem] = useState<BOMItem | null>(null);
  const [showChat, setShowChat] = useState(false);

  const { stockSummary, hasCritical } = useMemo(() => {
    const total = inventory.length;
    const critical = inventory.filter((i) => i.inventory.status === "below_reorder" || i.inventory.status === "critical").length;
    const healthy = inventory.filter((i) => i.inventory.status === "healthy").length;
    const totalValue = inventory.reduce((sum, i) => sum + i.inventory.inventory_value_eur, 0);

    if (critical > 0) {
      const names = inventory
        .filter((i) => i.inventory.status === "below_reorder" || i.inventory.status === "critical")
        .map((i) => i.name)
        .join(", ");
      return { stockSummary: `Heads up! ${critical} of ${total} components need attention: ${names}. Total inventory value is \u20AC${totalValue.toLocaleString()}. ${healthy} items are healthy.`, hasCritical: true };
    }
    return { stockSummary: `Looking good! All ${total} components are well-stocked. Total inventory value: \u20AC${totalValue.toLocaleString()}.`, hasCritical: false };
  }, [inventory]);

  const onItemClick = useCallback((item: BOMItem) => {
    setSelectedItem(item);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const state = initScene(container, inventory, onItemClick);
    stateRef.current = state;

    return () => {
      dispose(state);
      stateRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initialInventoryRef = useRef(inventory);
  useEffect(() => {
    // Skip the first render — initScene already built shelves with this data
    if (stateRef.current && inventory !== initialInventoryRef.current) {
      updateInventory(stateRef.current, inventory);
    }
  }, [inventory]);

  // Keep callback ref in sync
  useEffect(() => {
    if (stateRef.current) {
      stateRef.current.onItemClick = onItemClick;
    }
  }, [onItemClick]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full"
      style={{ background: "var(--w-ob-bg)" }}
    >
      {/* Warden avatar - bottom right corner */}
      <div
        className="absolute z-40"
        style={{ bottom: 24, right: 24 }}
      >
        {showChat && (
          <div
            style={{
              position: "absolute",
              bottom: "100%",
              right: 0,
              marginBottom: 8,
              background: "#fff",
              borderRadius: 12,
              padding: "12px 16px",
              width: 280,
              boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
              border: "1px solid #e2e8f0",
              fontSize: 13,
              color: "#334155",
              lineHeight: 1.5,
              animation: "chatBubbleIn 0.2s ease-out",
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--w-blue, #3b82f6)", marginBottom: 4 }}>
              Warden
            </div>
            {stockSummary}
          </div>
        )}
        <button
          onClick={() => setShowChat((v) => !v)}
          className={hasCritical ? "warden-critical-glow" : undefined}
          style={{
            cursor: "pointer",
            background: "none",
            border: "none",
            padding: 0,
            display: "block",
            borderRadius: "50%",
          }}
          title="Ask Warden about stock"
        >
          <WardenAvatar size={200} animation="jumping" />
        </button>
      </div>

      {/* Centered popup modal */}
      {selectedItem && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.3)" }}
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="relative"
            style={{
              background: "#fff",
              borderRadius: "14px",
              padding: "28px 32px",
              minWidth: "380px",
              maxWidth: "460px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
              border: "1px solid #e2e8f0",
              animation: "popupIn 0.2s ease-out",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setSelectedItem(null)}
              style={{
                position: "absolute",
                top: "14px",
                right: "16px",
                background: "none",
                border: "none",
                fontSize: "20px",
                cursor: "pointer",
                color: "#94a3b8",
                lineHeight: 1,
              }}
            >
              &times;
            </button>

            {/* Component name */}
            <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#0f172a", marginBottom: "4px" }}>
              {selectedItem.name}
            </h3>
            <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "14px" }}>
              {selectedItem.component_id}
            </p>

            {/* Badges */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "18px", flexWrap: "wrap" }}>
              <span style={{
                display: "inline-block", padding: "3px 10px", borderRadius: "9999px",
                fontSize: "11px", fontWeight: 600, color: "#fff",
                background: STATUS_COLORS[selectedItem.inventory.status],
              }}>
                {STATUS_LABELS[selectedItem.inventory.status]}
              </span>
              <span style={{
                display: "inline-block", padding: "3px 10px", borderRadius: "9999px",
                fontSize: "11px", fontWeight: 600, color: "#fff",
                background: CRITICALITY_COLORS[selectedItem.criticality],
              }}>
                {selectedItem.criticality.toUpperCase()}
              </span>
            </div>

            {/* Details grid */}
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 24px",
              fontSize: "13px", color: "#334155", marginBottom: "18px",
            }}>
              <div>
                <span style={{ color: "#94a3b8", fontSize: "11px", display: "block" }}>Days of Supply</span>
                <strong>{selectedItem.inventory.days_of_supply}</strong>
              </div>
              <div>
                <span style={{ color: "#94a3b8", fontSize: "11px", display: "block" }}>Stock</span>
                <strong>{selectedItem.inventory.current_stock_units.toLocaleString()}</strong> units
              </div>
              <div>
                <span style={{ color: "#94a3b8", fontSize: "11px", display: "block" }}>Inventory Value</span>
                <strong>&euro;{selectedItem.inventory.inventory_value_eur.toLocaleString()}</strong>
              </div>
              <div>
                <span style={{ color: "#94a3b8", fontSize: "11px", display: "block" }}>Safety Stock</span>
                <strong>{selectedItem.inventory.safety_stock_units.toLocaleString()}</strong> units
              </div>
            </div>

            {/* Supplier info */}
            <div style={{
              background: "#f8fafc", borderRadius: "8px", padding: "12px 14px",
              marginBottom: "14px", border: "1px solid #f1f5f9",
            }}>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "#64748b", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Suppliers
              </div>
              <div style={{ fontSize: "13px", color: "#334155" }}>
                <div style={{ marginBottom: "4px" }}>
                  <strong>{selectedItem.suppliers.primary.name}</strong>
                  <span style={{ color: "#94a3b8", marginLeft: "6px" }}>
                    {selectedItem.suppliers.primary.lead_time_days}d lead
                  </span>
                </div>
                {selectedItem.suppliers.backup && (
                  <div style={{ color: "#64748b" }}>
                    Backup: {selectedItem.suppliers.backup.name}
                    <span style={{ color: "#94a3b8", marginLeft: "6px" }}>
                      {selectedItem.suppliers.backup.lead_time_days}d lead
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Shipment dates */}
            <div style={{
              display: "flex", gap: "16px", fontSize: "12px", color: "#475569", marginBottom: "14px",
            }}>
              <div>
                <span style={{ color: "#94a3b8" }}>Last Shipment: </span>
                {selectedItem.last_replenishment}
              </div>
              <div>
                <span style={{ color: "#94a3b8" }}>Next ETA: </span>
                {selectedItem.next_expected_delivery}
              </div>
            </div>

            {/* Dependent orders */}
            {selectedItem.dependent_orders.length > 0 && (
              <div style={{
                borderTop: "1px solid #e2e8f0", paddingTop: "14px",
              }}>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "#64748b", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Dependent Orders ({selectedItem.dependent_orders.length})
                </div>
                {selectedItem.dependent_orders.map((order) => (
                  <div
                    key={order.order_id}
                    style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      fontSize: "12px", color: "#334155", padding: "6px 0",
                      borderBottom: "1px solid #f1f5f9",
                    }}
                  >
                    <div>
                      <strong>{order.order_id}</strong>
                      <span style={{ color: "#64748b", marginLeft: "8px" }}>{order.customer}</span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div>&euro;{order.total_value_eur.toLocaleString()}</div>
                      <div style={{ fontSize: "10px", color: "#94a3b8" }}>
                        Due {order.due_date} &middot; {order.status.replace(/_/g, " ")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Animation keyframes */}
      <style>{`
        @keyframes popupIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes chatBubbleIn {
          from { opacity: 0; transform: scale(0.9) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes criticalGlow {
          0%, 100% { box-shadow: 0 0 4px 5px rgba(239, 68, 68, 0.25); }
          50% { box-shadow: 0 0 10px 4px rgba(239, 68, 68, 0.45); }
        }
        .warden-critical-glow {
          animation: criticalGlow 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
