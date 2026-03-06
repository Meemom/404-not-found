"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { BOMItem } from "@/lib/types";
import { initScene, updateInventory, dispose, type StockSceneState } from "./StockScene";
import WardenAvatar from "@/components/WardenAvatar";
import { streamChat, approveAction, dismissAction, type SSEEvent } from "@/lib/api";

interface StockRoomProps {
  inventory: BOMItem[];
}

interface Recommendation {
  action_id: string;
  action_type: string;
  preview: string;
  content: any;
  status: "pending" | "approved" | "dismissed";
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

const URGENCY_COLORS: Record<string, string> = {
  emergency: "#EF4444",
  urgent: "#F59E0B",
  standard: "#3b82f6",
};

export default function StockRoom({ inventory }: StockRoomProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<StockSceneState | null>(null);
  const [selectedItem, setSelectedItem] = useState<BOMItem | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const sessionIdRef = useRef(crypto.randomUUID());
  const abortRef = useRef<AbortController | null>(null);
  const panelContentRef = useRef<HTMLDivElement>(null);

  const hasCritical = useMemo(() => {
    return inventory.some((i) => i.inventory.status === "below_reorder" || i.inventory.status === "critical");
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
    if (stateRef.current && inventory !== initialInventoryRef.current) {
      updateInventory(stateRef.current, inventory);
    }
  }, [inventory]);

  useEffect(() => {
    if (stateRef.current) {
      stateRef.current.onItemClick = onItemClick;
    }
  }, [onItemClick]);

  const runAnalysis = useCallback(() => {
    // Abort any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    // Reset state for fresh analysis
    setStreamingText("");
    setRecommendations([]);
    setIsLoading(true);

    // New session per analysis run
    sessionIdRef.current = crypto.randomUUID();

    const prompt =
      "Analyze current inventory levels. For any components below reorder point or critical, recommend reorder quantities and flag them.";

    streamChat(
      prompt,
      sessionIdRef.current,
      (token) => {
        setStreamingText((prev) => prev + token);
      },
      controller.signal,
      (event: SSEEvent) => {
        if (event.event === "action_generated" || event.type === "action_generated") {
          setRecommendations((prev) => [
            ...prev,
            {
              action_id: event.action_id || "",
              action_type: event.action_type || "",
              preview: event.preview || "",
              content: event.content,
              status: "pending",
            },
          ]);
        }
        if (event.event === "done" || event.type === "done") {
          setIsLoading(false);
        }
      },
    ).catch((err) => {
      if (err.name !== "AbortError") {
        setStreamingText((prev) => prev + "\n\nFailed to connect to Warden agent.");
        setIsLoading(false);
      }
    });
  }, []);

  const handleTogglePanel = useCallback(() => {
    setPanelOpen((prev) => {
      const opening = !prev;
      if (opening) {
        // Run analysis when opening
        setTimeout(runAnalysis, 0);
      } else {
        // Abort if closing
        abortRef.current?.abort();
      }
      return opening;
    });
  }, [runAnalysis]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const handleApprove = async (actionId: string) => {
    try {
      await approveAction(actionId);
      setRecommendations((prev) =>
        prev.map((r) => (r.action_id === actionId ? { ...r, status: "approved" } : r)),
      );
    } catch {
      // Silently fail — user can retry
    }
  };

  const handleDismiss = async (actionId: string) => {
    try {
      await dismissAction(actionId, "User dismissed from stockroom");
      setRecommendations((prev) =>
        prev.map((r) => (r.action_id === actionId ? { ...r, status: "dismissed" } : r)),
      );
    } catch {
      // Silently fail
    }
  };

  // Auto-scroll panel as streaming text arrives
  useEffect(() => {
    if (panelContentRef.current) {
      panelContentRef.current.scrollTop = panelContentRef.current.scrollHeight;
    }
  }, [streamingText, recommendations]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full"
      style={{ background: "var(--w-ob-bg)" }}
    >
      {/* Warden avatar + recommendations panel - bottom right corner */}
      <div
        className="absolute z-40"
        style={{ bottom: 24, right: 24 }}
      >
        {panelOpen && (
          <div
            style={{
              position: "absolute",
              bottom: "100%",
              right: 0,
              marginBottom: 8,
              background: "#fff",
              borderRadius: 14,
              width: 350,
              maxHeight: "60vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 12px 40px rgba(0,0,0,0.18)",
              border: "1px solid #e2e8f0",
              animation: "chatBubbleIn 0.2s ease-out",
              overflow: "hidden",
            }}
          >
            {/* Panel header */}
            <div
              style={{
                padding: "12px 16px",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexShrink: 0,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--w-blue, #3b82f6)" }}>
                Warden Inventory Analysis
              </div>
              <button
                onClick={handleTogglePanel}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 18,
                  cursor: "pointer",
                  color: "#94a3b8",
                  lineHeight: 1,
                  padding: "0 2px",
                }}
              >
                &times;
              </button>
            </div>

            {/* Scrollable content */}
            <div
              ref={panelContentRef}
              style={{
                padding: "12px 16px",
                overflowY: "auto",
                flex: 1,
              }}
            >
              {/* Loading indicator */}
              {isLoading && !streamingText && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "var(--w-blue, #3b82f6)",
                      animation: "pulse 1s ease-in-out infinite",
                    }}
                  />
                  <span style={{ fontSize: 12, color: "#64748b" }}>Analyzing inventory levels...</span>
                </div>
              )}

              {/* Streaming agent text */}
              {streamingText && (
                <div
                  style={{
                    fontSize: 13,
                    color: "#334155",
                    lineHeight: 1.6,
                    marginBottom: 14,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {streamingText}
                  {isLoading && (
                    <span
                      style={{
                        display: "inline-block",
                        width: 6,
                        height: 14,
                        background: "var(--w-blue, #3b82f6)",
                        marginLeft: 2,
                        animation: "blink 0.8s step-end infinite",
                        verticalAlign: "text-bottom",
                      }}
                    />
                  )}
                </div>
              )}

              {/* Recommendation cards */}
              {recommendations.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#64748b",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Recommendations ({recommendations.length})
                  </div>
                  {recommendations.map((rec) => (
                    <div
                      key={rec.action_id}
                      style={{
                        background: rec.status === "approved" ? "#f0fdf4" : rec.status === "dismissed" ? "#fafafa" : "#f8fafc",
                        borderRadius: 10,
                        padding: "10px 12px",
                        border: `1px solid ${rec.status === "approved" ? "#bbf7d0" : rec.status === "dismissed" ? "#e2e8f0" : "#e2e8f0"}`,
                        opacity: rec.status === "dismissed" ? 0.5 : 1,
                      }}
                    >
                      {/* Card header */}
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "2px 8px",
                            borderRadius: "9999px",
                            fontSize: 10,
                            fontWeight: 600,
                            color: "#fff",
                            background: URGENCY_COLORS[rec.content?.urgency] || "#64748b",
                          }}
                        >
                          {(rec.content?.urgency || rec.action_type || "action").toUpperCase()}
                        </span>
                        {rec.status === "approved" && (
                          <span style={{ fontSize: 11, color: "#16a34a", fontWeight: 600 }}>Approved</span>
                        )}
                        {rec.status === "dismissed" && (
                          <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>Dismissed</span>
                        )}
                      </div>

                      {/* Card body */}
                      <div style={{ fontSize: 12, color: "#334155", lineHeight: 1.5, marginBottom: 8 }}>
                        {rec.preview || rec.content?.title || rec.content?.message || "Reorder recommendation"}
                      </div>

                      {/* Action buttons */}
                      {rec.status === "pending" && (
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            onClick={() => handleApprove(rec.action_id)}
                            style={{
                              flex: 1,
                              padding: "5px 10px",
                              borderRadius: 7,
                              border: "none",
                              background: "var(--w-blue, #3b82f6)",
                              color: "#fff",
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleDismiss(rec.action_id)}
                            style={{
                              flex: 1,
                              padding: "5px 10px",
                              borderRadius: 7,
                              border: "1px solid #e2e8f0",
                              background: "#fff",
                              color: "#64748b",
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            Dismiss
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Done indicator + link to full dashboard */}
              {!isLoading && streamingText && (
                <div
                  style={{
                    textAlign: "center",
                    padding: "10px 0 4px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: 11, color: "#94a3b8" }}>Analysis complete</span>
                  <Link
                    href="/inventory"
                    style={{
                      display: "inline-block",
                      padding: "7px 16px",
                      borderRadius: 8,
                      background: "var(--w-blue, #3b82f6)",
                      color: "#fff",
                      fontSize: 12,
                      fontWeight: 600,
                      textDecoration: "none",
                      transition: "opacity 0.15s",
                    }}
                  >
                    View Full Inventory Dashboard &rarr;
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
        <button
          onClick={handleTogglePanel}
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
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
