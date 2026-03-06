"use client";

import { useState, useMemo } from "react";
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
} from "reactflow";
import "reactflow/dist/style.css";

import {
  EventNode,
  SupplierNode,
  PartNode,
  OrderNode,
  CustomerNode,
} from "@/components/visualization/nodes";
import { AnimatedEdge } from "@/components/visualization/edges/AnimatedEdge";
import {
  NodeOverlay,
  EventExpandedView,
  SupplierExpandedView,
  PartExpandedView,
  OrderExpandedView,
  CustomerExpandedView,
} from "@/components/visualization/overlays";
import { VisualizationSidebar } from "@/components/visualization/VisualizationSidebar";
import { NavigationBar, type ViewTab } from "@/components/visualization/NavigationBar";

const nodeTypes = {
  event: EventNode,
  supplier: SupplierNode,
  part: PartNode,
  order: OrderNode,
  customer: CustomerNode,
};

const edgeTypes = {
  animated: AnimatedEdge,
};

// Column X positions for the left-to-right flow
const COL = { event: 0, supplier: 280, part: 560, order: 840, customer: 1120 };
const ROW_GAP = 160;

export default function Home() {
  const [selectedNode, setSelectedNode] = useState<{
    id: string;
    type: string;
    label: string;
  } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<ViewTab>("graph");

  const openOverlay = (id: string, type: string, label: string) => {
    setSelectedNode({ id, type, label });
  };

  // ── NODES ──
  const initialNodes: Node[] = [
    // EVENTS (column 0)
    {
      id: "evt-taiwan",
      type: "event",
      position: { x: COL.event, y: 0 },
      data: {
        id: "EVT-001",
        type: "Geopolitical",
        region: "Taiwan Strait Shipping Congestion",
        severity: 8,
        confidence: 85,
        expected_delay_days: 14,
        start_time: "2026-03-01",
        onClick: () => openOverlay("evt-taiwan", "Event", "Taiwan Strait Disruption"),
      },
    },
    {
      id: "evt-semi",
      type: "event",
      position: { x: COL.event, y: ROW_GAP * 1.5 },
      data: {
        id: "EVT-002",
        type: "Market",
        region: "Semiconductor Price Surge",
        severity: 5,
        confidence: 72,
        expected_delay_days: 7,
        start_time: "2026-02-28",
        onClick: () => openOverlay("evt-semi", "Event", "Semiconductor Price Surge"),
      },
    },

    // SUPPLIERS (column 1)
    {
      id: "sup-tsmc",
      type: "supplier",
      position: { x: COL.supplier, y: 0 },
      data: {
        id: "SUP-001",
        name: "TSMC",
        country: "Taiwan",
        health_score: 35,
        criticality: "critical",
        onClick: () => openOverlay("sup-tsmc", "Supplier", "TSMC"),
      },
    },
    {
      id: "sup-infineon",
      type: "supplier",
      position: { x: COL.supplier, y: ROW_GAP },
      data: {
        id: "SUP-002",
        name: "Infineon",
        country: "Germany",
        health_score: 82,
        criticality: "high",
        onClick: () => openOverlay("sup-infineon", "Supplier", "Infineon Technologies"),
      },
    },
    {
      id: "sup-stmicro",
      type: "supplier",
      position: { x: COL.supplier, y: ROW_GAP * 2 },
      data: {
        id: "SUP-003",
        name: "STMicro",
        country: "Switzerland",
        health_score: 90,
        criticality: "medium",
        onClick: () => openOverlay("sup-stmicro", "Supplier", "STMicroelectronics"),
      },
    },

    // PARTS (column 2)
    {
      id: "part-mcu",
      type: "part",
      position: { x: COL.part, y: 0 },
      data: {
        id: "MCU-32BIT-AUTO",
        name: "MCU-32BIT-AUTO",
        criticality: "critical",
        inventory_days: 8,
        lead_time_days: 21,
        safety_stock_days: 14,
        onClick: () => openOverlay("part-mcu", "Part", "MCU-32BIT-AUTO"),
      },
    },
    {
      id: "part-pmic",
      type: "part",
      position: { x: COL.part, y: ROW_GAP },
      data: {
        id: "POWER-MGMT-IC",
        name: "POWER-MGMT-IC",
        criticality: "high",
        inventory_days: 18,
        lead_time_days: 14,
        safety_stock_days: 10,
        onClick: () => openOverlay("part-pmic", "Part", "POWER-MGMT-IC"),
      },
    },
    {
      id: "part-can",
      type: "part",
      position: { x: COL.part, y: ROW_GAP * 2 },
      data: {
        id: "CAN-CONTROLLER",
        name: "CAN-CONTROLLER",
        criticality: "medium",
        inventory_days: 30,
        lead_time_days: 10,
        safety_stock_days: 7,
        onClick: () => openOverlay("part-can", "Part", "CAN-CONTROLLER"),
      },
    },

    // ORDERS (column 3)
    {
      id: "ord-bmw",
      type: "order",
      position: { x: COL.order, y: 0 },
      data: {
        id: "#DE-8821",
        customer: "BMW AG",
        due_date: "Mar 10",
        revenue: 2_250_000,
        margin: 18,
        status: "at_risk",
        onClick: () => openOverlay("ord-bmw", "Order", "BMW Order #DE-8821"),
      },
    },
    {
      id: "ord-vw",
      type: "order",
      position: { x: COL.order, y: ROW_GAP },
      data: {
        id: "#DE-9103",
        customer: "VW Group",
        due_date: "Mar 21",
        revenue: 1_989_000,
        margin: 15,
        status: "at_risk",
        onClick: () => openOverlay("ord-vw", "Order", "VW Order #DE-9103"),
      },
    },
    {
      id: "ord-bosch",
      type: "order",
      position: { x: COL.order, y: ROW_GAP * 2 },
      data: {
        id: "#DE-9250",
        customer: "Bosch GmbH",
        due_date: "Apr 1",
        revenue: 710_000,
        margin: 22,
        status: "on_track",
        onClick: () => openOverlay("ord-bosch", "Order", "Bosch Order #DE-9250"),
      },
    },

    // CUSTOMERS (column 4)
    {
      id: "cust-bmw",
      type: "customer",
      position: { x: COL.customer, y: 0 },
      data: {
        id: "CUST-001",
        name: "BMW AG",
        annual_revenue: 85_000_000,
        sla_days: 14,
        onClick: () => openOverlay("cust-bmw", "Customer", "BMW AG"),
      },
    },
    {
      id: "cust-vw",
      type: "customer",
      position: { x: COL.customer, y: ROW_GAP },
      data: {
        id: "CUST-002",
        name: "VW Group",
        annual_revenue: 72_000_000,
        sla_days: 21,
        onClick: () => openOverlay("cust-vw", "Customer", "Volkswagen Group"),
      },
    },
    {
      id: "cust-bosch",
      type: "customer",
      position: { x: COL.customer, y: ROW_GAP * 2 },
      data: {
        id: "CUST-003",
        name: "Bosch GmbH",
        annual_revenue: 31_000_000,
        sla_days: 30,
        onClick: () => openOverlay("cust-bosch", "Customer", "Bosch GmbH"),
      },
    },
  ];

  // ── EDGES ──
  const initialEdges: Edge[] = [
    // AFFECTS: event → supplier
    { id: "e-tw-tsmc", source: "evt-taiwan", target: "sup-tsmc", type: "animated", data: { relationship: "affects" } },
    { id: "e-tw-inf", source: "evt-taiwan", target: "sup-infineon", type: "animated", data: { relationship: "affects" } },
    { id: "e-semi-tsmc", source: "evt-semi", target: "sup-tsmc", type: "animated", data: { relationship: "affects" } },

    // SUPPLIES: supplier → part
    { id: "e-tsmc-mcu", source: "sup-tsmc", target: "part-mcu", type: "animated", data: { relationship: "supplies" } },
    { id: "e-tsmc-pmic", source: "sup-tsmc", target: "part-pmic", type: "animated", data: { relationship: "supplies" } },
    { id: "e-inf-can", source: "sup-infineon", target: "part-can", type: "animated", data: { relationship: "supplies" } },
    { id: "e-stm-pmic", source: "sup-stmicro", target: "part-pmic", type: "animated", data: { relationship: "supplies" } },

    // REQUIRED_FOR: part → order
    { id: "e-mcu-bmw", source: "part-mcu", target: "ord-bmw", type: "animated", data: { relationship: "required_for" } },
    { id: "e-mcu-vw", source: "part-mcu", target: "ord-vw", type: "animated", data: { relationship: "required_for" } },
    { id: "e-pmic-vw", source: "part-pmic", target: "ord-vw", type: "animated", data: { relationship: "required_for" } },
    { id: "e-can-bosch", source: "part-can", target: "ord-bosch", type: "animated", data: { relationship: "required_for" } },

    // BELONGS_TO: order → customer
    { id: "e-bmw-ord-cust", source: "ord-bmw", target: "cust-bmw", type: "animated", data: { relationship: "belongs_to" } },
    { id: "e-vw-ord-cust", source: "ord-vw", target: "cust-vw", type: "animated", data: { relationship: "belongs_to" } },
    { id: "e-bosch-ord-cust", source: "ord-bosch", target: "cust-bosch", type: "animated", data: { relationship: "belongs_to" } },

    // ALTERNATIVE_SUPPLIER: supplier → supplier (dashed)
    {
      id: "e-inf-alt-tsmc",
      source: "sup-infineon",
      sourceHandle: "alt-source",
      target: "sup-tsmc",
      targetHandle: "alt-target",
      type: "animated",
      data: { relationship: "alternative_supplier" },
    },
  ];

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const expandedViewComponent = useMemo(() => {
    if (!selectedNode) return null;
    const map: Record<string, React.ComponentType<{ nodeId: string }>> = {
      Event: EventExpandedView,
      Supplier: SupplierExpandedView,
      Part: PartExpandedView,
      Order: OrderExpandedView,
      Customer: CustomerExpandedView,
    };
    const Component = map[selectedNode.type];
    return Component ? <Component nodeId={selectedNode.id} /> : null;
  }, [selectedNode]);

  return (
    <div className="w-full h-screen flex flex-col" style={{ background: "var(--w-ob-bg)" }}>
      {/* Header */}
      <div className="border-b px-6 py-4 shrink-0" style={{ background: "var(--w-ob-surface)", borderColor: "var(--w-ob-border)" }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--w-ob-text)" }}>
                Warden
              </h1>
              <p className="text-xs" style={{ color: "var(--w-ob-text-faint)" }}>
                Supply Chain Resilience
              </p>
            </div>
            <NavigationBar activeTab={activeTab} onTabChange={setActiveTab} />
          </div>

          {/* Legend (only for graph view) */}
          {activeTab === "graph" && (
            <div className="flex items-center gap-4 text-[10px]">
              {[
                { color: "#ef4444", label: "Affects" },
                { color: "#3b82f6", label: "Supplies" },
                { color: "#14b8a6", label: "Required for" },
                { color: "#10b981", label: "Belongs to" },
                { color: "#eab308", label: "Alt. supplier", dashed: true },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-1.5">
                  <div
                    className="w-4 h-0.5 rounded"
                    style={{
                      backgroundColor: item.color,
                      borderBottom: item.dashed ? `2px dashed ${item.color}` : undefined,
                    }}
                  />
                  <span style={{ color: "var(--w-ob-text-muted)" }}>{item.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 relative overflow-hidden">
        {activeTab === "graph" && (
          <div style={{ width: "100%", height: "100%", background: "var(--w-ob-bg)" }}>
            <svg style={{ position: "absolute", width: 0, height: 0 }}>
              <defs>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
            </svg>

            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              fitView
              fitViewOptions={{ padding: 0.15 }}
              minZoom={0.4}
              maxZoom={1.5}
              proOptions={{ hideAttribution: true }}
            >
              <Background color="#CBD5E1" gap={20} size={1} style={{ background: "var(--w-ob-bg)" }} />
              <Controls
                style={{
                  background: "var(--w-ob-surface)",
                  border: "1px solid var(--w-ob-border)",
                  borderRadius: "8px",
                }}
              />
            </ReactFlow>
          </div>
        )}

        {activeTab === "globe" && (
          <div className="w-full h-full flex items-center justify-center" style={{ background: "var(--w-ob-bg)" }}>
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: "var(--w-ob-bg-tint)", border: "1px solid var(--w-ob-border)" }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--w-blue)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                  <path d="M2 12h20" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--w-ob-text)" }}>3D Globe View</h2>
              <p className="text-sm max-w-md" style={{ color: "var(--w-ob-text-muted)" }}>
                Interactive 3D globe showing supplier locations, shipping routes, and disruption zones worldwide.
              </p>
              <p className="text-xs mt-3" style={{ color: "var(--w-ob-text-faint)" }}>Coming soon</p>
            </div>
          </div>
        )}

        {activeTab === "stockroom" && (
          <div className="w-full h-full flex items-center justify-center" style={{ background: "var(--w-ob-bg)" }}>
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: "var(--w-ob-bg-tint)", border: "1px solid var(--w-ob-border)" }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--w-blue)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 8.35V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.35A2 2 0 0 1 3.26 6.5l8-3.2a2 2 0 0 1 1.48 0l8 3.2A2 2 0 0 1 22 8.35Z" />
                  <path d="M6 18h12" />
                  <path d="M6 14h12" />
                  <path d="M6 10h12" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--w-ob-text)" }}>3D Stockroom</h2>
              <p className="text-sm max-w-md" style={{ color: "var(--w-ob-text-muted)" }}>
                Virtual warehouse visualization with real-time inventory levels, shelf layouts, and stock alerts.
              </p>
              <p className="text-xs mt-3" style={{ color: "var(--w-ob-text-faint)" }}>Coming soon</p>
            </div>
          </div>
        )}
      </div>

      {/* Sidebar (graph view only) */}
      {activeTab === "graph" && <VisualizationSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((o) => !o)}
        events={[
          { id: "evt-taiwan", type: "Geopolitical", region: "Taiwan Strait Shipping Congestion", severity: 8, confidence: 85, expected_delay_days: 14 },
          { id: "evt-semi", type: "Market", region: "Semiconductor Price Surge", severity: 5, confidence: 72, expected_delay_days: 7 },
        ]}
        suppliers={[
          { id: "sup-tsmc", name: "TSMC", country: "Taiwan", health_score: 35, criticality: "critical" },
          { id: "sup-infineon", name: "Infineon", country: "Germany", health_score: 82, criticality: "high" },
          { id: "sup-stmicro", name: "STMicro", country: "Switzerland", health_score: 90, criticality: "medium" },
        ]}
        parts={[
          { id: "part-mcu", name: "MCU-32BIT-AUTO", criticality: "critical", inventory_days: 8, safety_stock_days: 14 },
          { id: "part-pmic", name: "POWER-MGMT-IC", criticality: "high", inventory_days: 18, safety_stock_days: 10 },
          { id: "part-can", name: "CAN-CONTROLLER", criticality: "medium", inventory_days: 30, safety_stock_days: 7 },
        ]}
        orders={[
          { id: "ord-bmw", customer: "BMW AG", due_date: "Mar 10", revenue: 2_250_000, status: "at_risk" },
          { id: "ord-vw", customer: "VW Group", due_date: "Mar 21", revenue: 1_989_000, status: "at_risk" },
          { id: "ord-bosch", customer: "Bosch GmbH", due_date: "Apr 1", revenue: 710_000, status: "on_track" },
        ]}
        customers={[
          { id: "cust-bmw", name: "BMW AG", annual_revenue: 85_000_000, sla_days: 14 },
          { id: "cust-vw", name: "VW Group", annual_revenue: 72_000_000, sla_days: 21 },
          { id: "cust-bosch", name: "Bosch GmbH", annual_revenue: 31_000_000, sla_days: 30 },
        ]}
      />}

      {/* Overlay */}
      <NodeOverlay
        isOpen={!!selectedNode}
        nodeId={selectedNode?.id ?? null}
        nodeType={selectedNode?.type ?? ""}
        nodeLabel={selectedNode?.label ?? ""}
        onClose={() => setSelectedNode(null)}
      >
        {expandedViewComponent}
      </NodeOverlay>

      {/* Footer */}
      <div className="border-t px-6 py-2.5 shrink-0" style={{ background: "var(--w-ob-surface)", borderColor: "var(--w-ob-border)" }}>
        <p className="text-[10px]" style={{ color: "var(--w-ob-text-faint)" }}>
          Click any node to expand. Edge colors indicate relationship type. Particle flow shows data direction.
        </p>
      </div>
    </div>
  );
}
