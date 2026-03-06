"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
} from "reactflow";
import "reactflow/dist/style.css";

import GlobeExperience from "@/components/globe/GlobeExperience";

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
import SlashTerminal from "@/components/copilot/SlashTerminal";
import { useWardenStore } from "@/lib/store";
import { getCompanyProfile, getOperationsOverview, getPendingActions, getUploadedData, getScannedEvents } from "@/lib/api";
import type { ScannedEvent } from "@/lib/api";
import StockRoom from "@/components/stockroom/StockRoom";
import type { BOMItem } from "@/lib/types";

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

const MOCK_BOM: BOMItem[] = [
  {
    component_id: "MCU-32BIT-AUTO",
    name: "32-bit Automotive Microcontroller",
    category: "Semiconductors",
    criticality: "critical",
    suppliers: {
      primary: { supplier_id: "sup-tsmc-001", name: "TSMC", lead_time_days: 45, cost_per_unit_eur: 8.5 },
      backup: { supplier_id: "sup-infineon-de-001", name: "Infineon Technologies (Dresden)", lead_time_days: 7 },
    },
    inventory: {
      current_stock_units: 18000, daily_consumption_units: 1500, days_of_supply: 12,
      safety_stock_units: 31500, reorder_point_units: 21000, status: "below_reorder", inventory_value_eur: 153000,
    },
    warehouse_location: "Frankfurt Main Warehouse",
    last_replenishment: "2026-02-15",
    next_expected_delivery: "2026-03-18",
    dependent_orders: [
      { order_id: "ORD-DE-8821", customer: "BMW AG", product: "Engine Control Unit v4.2", quantity: 12000, total_value_eur: 2250000, due_date: "2026-03-10", status: "in_production" },
      { order_id: "ORD-DE-9301", customer: "BMW AG", product: "Sensor Interface Board v1.5", quantity: 6000, total_value_eur: 588000, due_date: "2026-03-28", status: "in_production" },
    ],
  },
  {
    component_id: "POWER-MGMT-IC",
    name: "Power Management IC (Automotive Grade)",
    category: "Semiconductors",
    criticality: "critical",
    suppliers: {
      primary: { supplier_id: "sup-tsmc-001", name: "TSMC", lead_time_days: 45, cost_per_unit_eur: 5.2 },
      backup: { supplier_id: "sup-stmicro-001", name: "STMicroelectronics", lead_time_days: 14 },
    },
    inventory: {
      current_stock_units: 22000, daily_consumption_units: 1200, days_of_supply: 18,
      safety_stock_units: 25200, reorder_point_units: 16800, status: "adequate", inventory_value_eur: 114400,
    },
    warehouse_location: "Frankfurt Main Warehouse",
    last_replenishment: "2026-02-20",
    next_expected_delivery: "2026-03-14",
    dependent_orders: [
      { order_id: "ORD-DE-8821", customer: "BMW AG", product: "Engine Control Unit v4.2", quantity: 12000, total_value_eur: 2250000, due_date: "2026-03-10", status: "in_production" },
      { order_id: "ORD-DE-9103", customer: "Volkswagen Group", product: "Power Management Module v3.1", quantity: 8500, total_value_eur: 1989000, due_date: "2026-03-21", status: "in_production" },
    ],
  },
  {
    component_id: "CAN-CONTROLLER",
    name: "CAN Bus Controller Chip",
    category: "Semiconductors",
    criticality: "critical",
    suppliers: {
      primary: { supplier_id: "sup-infineon-my-001", name: "Infineon Technologies (Malaysia)", lead_time_days: 21, cost_per_unit_eur: 3.8 },
      backup: { supplier_id: "sup-infineon-de-001", name: "Infineon Technologies (Dresden)", lead_time_days: 7 },
    },
    inventory: {
      current_stock_units: 35000, daily_consumption_units: 800, days_of_supply: 43,
      safety_stock_units: 16800, reorder_point_units: 11200, status: "healthy", inventory_value_eur: 133000,
    },
    warehouse_location: "Frankfurt Main Warehouse",
    last_replenishment: "2026-02-25",
    next_expected_delivery: "2026-03-10",
    dependent_orders: [
      { order_id: "ORD-DE-8821", customer: "BMW AG", product: "Engine Control Unit v4.2", quantity: 12000, total_value_eur: 2250000, due_date: "2026-03-10", status: "in_production" },
      { order_id: "ORD-DE-9250", customer: "Bosch GmbH", product: "CAN Bus Controller Board v2.0", quantity: 5000, total_value_eur: 710000, due_date: "2026-04-01", status: "awaiting_components" },
    ],
  },
  {
    component_id: "GATE-DRIVER-IC",
    name: "Gate Driver IC (High-Side)",
    category: "Semiconductors",
    criticality: "medium",
    suppliers: {
      primary: { supplier_id: "sup-infineon-my-001", name: "Infineon Technologies (Malaysia)", lead_time_days: 21, cost_per_unit_eur: 2.9 },
      backup: { supplier_id: "sup-infineon-de-001", name: "Infineon Technologies (Dresden)", lead_time_days: 7 },
    },
    inventory: {
      current_stock_units: 15000, daily_consumption_units: 600, days_of_supply: 25,
      safety_stock_units: 12600, reorder_point_units: 8400, status: "healthy", inventory_value_eur: 43500,
    },
    warehouse_location: "Frankfurt Secondary",
    last_replenishment: "2026-02-22",
    next_expected_delivery: "2026-03-15",
    dependent_orders: [
      { order_id: "ORD-DE-9103", customer: "Volkswagen Group", product: "Power Management Module v3.1", quantity: 8500, total_value_eur: 1989000, due_date: "2026-03-21", status: "in_production" },
    ],
  },
  {
    component_id: "BATT-CELL-48V",
    name: "48V Battery Cell Module",
    category: "Battery Components",
    criticality: "medium",
    suppliers: {
      primary: { supplier_id: "sup-samsung-001", name: "Samsung SDI", lead_time_days: 30, cost_per_unit_eur: 45.0 },
      backup: { supplier_id: "sup-lg-001", name: "LG Energy Solution", lead_time_days: 28 },
    },
    inventory: {
      current_stock_units: 4200, daily_consumption_units: 150, days_of_supply: 28,
      safety_stock_units: 3150, reorder_point_units: 2100, status: "healthy", inventory_value_eur: 189000,
    },
    warehouse_location: "Frankfurt Main Warehouse",
    last_replenishment: "2026-02-18",
    next_expected_delivery: "2026-03-20",
    dependent_orders: [],
  },
  {
    component_id: "SENSOR-IC-MEMS",
    name: "MEMS Sensor IC (Automotive)",
    category: "Sensors",
    criticality: "low",
    suppliers: {
      primary: { supplier_id: "sup-stmicro-001", name: "STMicroelectronics", lead_time_days: 14, cost_per_unit_eur: 4.1 },
      backup: null,
    },
    inventory: {
      current_stock_units: 28000, daily_consumption_units: 700, days_of_supply: 40,
      safety_stock_units: 14700, reorder_point_units: 9800, status: "healthy", inventory_value_eur: 114800,
    },
    warehouse_location: "Frankfurt Main Warehouse",
    last_replenishment: "2026-02-28",
    next_expected_delivery: "2026-03-12",
    dependent_orders: [
      { order_id: "ORD-DE-9250", customer: "Bosch GmbH", product: "CAN Bus Controller Board v2.0", quantity: 5000, total_value_eur: 710000, due_date: "2026-04-01", status: "awaiting_components" },
      { order_id: "ORD-DE-9301", customer: "BMW AG", product: "Sensor Interface Board v1.5", quantity: 6000, total_value_eur: 588000, due_date: "2026-03-28", status: "in_production" },
    ],
  },
];

// Column X positions for the left-to-right flow
const COL = { event: 0, supplier: 280, part: 560, order: 840, customer: 1120 };
const ROW_GAP = 160;

export default function Home() {
  const router = useRouter();
  const { setCompany, setDashboard, setPendingActions, onboarded } = useWardenStore();
  const [selectedNode, setSelectedNode] = useState<{
    id: string;
    type: string;
    label: string;
  } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<ViewTab>("graph");
  const [uploadedSuppliers, setUploadedSuppliers] = useState<any[]>([]);
  const [uploadedSLA, setUploadedSLA] = useState<any[]>([]);
  const [uploadedBOM, setUploadedBOM] = useState<any[]>([]);
  const [scannedEvents, setScannedEvents] = useState<ScannedEvent[]>([]);

  useEffect(() => {
    if (!onboarded) {
      router.replace("/onboarding");
    }
  }, [onboarded, router]);

  useEffect(() => {
    if (!onboarded) return;

    async function loadInitialData() {
      try {
        const [company, overview, actions, uploaded, events] = await Promise.all([
          getCompanyProfile(),
          getOperationsOverview(),
          getPendingActions(),
          getUploadedData(),
          getScannedEvents().catch(() => []),
        ]);
        setCompany(company);
        setDashboard(overview);
        setPendingActions(actions);
        if (uploaded.suppliers?.length) setUploadedSuppliers(uploaded.suppliers);
        if (uploaded.sla?.length) setUploadedSLA(uploaded.sla);
        if (uploaded.bom?.length) setUploadedBOM(uploaded.bom);
        if (events?.length) setScannedEvents(events);
      } catch (err) {
        console.error("Failed to load root data:", err);
      }
    }

    loadInitialData();

    const interval = setInterval(async () => {
      try {
        const [overview, actions] = await Promise.all([
          getOperationsOverview(),
          getPendingActions(),
        ]);
        setDashboard(overview);
        setPendingActions(actions);
      } catch (err) {
        console.error("Failed to poll root data:", err);
      }
    }, 30_000);

    return () => clearInterval(interval);
  }, [onboarded, setCompany, setDashboard, setPendingActions]);

  const openOverlay = useCallback((id: string, type: string, label: string) => {
    setSelectedNode({ id, type, label });
  }, []);

  // ── Build graph nodes & edges, merging hardcoded + uploaded data ──
  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Track existing IDs to avoid duplicates when merging uploaded data
    const supplierIds = new Set<string>();
    const partIds = new Set<string>();
    const customerIds = new Set<string>();

    // Helper to make safe IDs from names
    const toId = (prefix: string, name: string) =>
      `${prefix}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "")}`;

    // ── EVENTS (from scan or fallback) ──
    const eventsList = scannedEvents.length > 0
      ? scannedEvents.map((evt, i) => ({
          id: toId("evt", evt.region || `event-${i}`),
          evtId: `EVT-${String(i + 1).padStart(3, "0")}`,
          type: evt.type,
          region: evt.region,
          severity: evt.severity,
          confidence: evt.confidence ?? 75,
          expected_delay_days: evt.expected_delay_days ?? 7,
        }))
      : [
          { id: "evt-taiwan", evtId: "EVT-001", type: "Geopolitical", region: "Taiwan Strait Shipping Congestion", severity: 8, confidence: 85, expected_delay_days: 14 },
          { id: "evt-semi", evtId: "EVT-002", type: "Market", region: "Semiconductor Price Surge", severity: 5, confidence: 72, expected_delay_days: 7 },
        ];

    let eventY = 0;
    for (const evt of eventsList) {
      nodes.push({
        id: evt.id, type: "event",
        position: { x: COL.event, y: eventY },
        data: {
          id: evt.evtId, type: evt.type, region: evt.region,
          severity: evt.severity, confidence: evt.confidence,
          expected_delay_days: evt.expected_delay_days,
          start_time: new Date().toISOString().split("T")[0],
          onClick: () => openOverlay(evt.id, "Event", evt.region),
        },
      });
      eventY += ROW_GAP;
    }

    // ── DEFAULT SUPPLIERS ──
    const hardcodedSuppliers = [
      { id: "sup-tsmc", supId: "SUP-001", name: "TSMC", country: "Taiwan", health_score: 35, criticality: "critical" },
      { id: "sup-infineon", supId: "SUP-002", name: "Infineon", country: "Germany", health_score: 82, criticality: "high" },
      { id: "sup-stmicro", supId: "SUP-003", name: "STMicro", country: "Switzerland", health_score: 90, criticality: "medium" },
    ];
    let supplierY = 0;
    for (const s of hardcodedSuppliers) {
      supplierIds.add(s.id);
      nodes.push({
        id: s.id, type: "supplier",
        position: { x: COL.supplier, y: supplierY },
        data: { id: s.supId, name: s.name, country: s.country, health_score: s.health_score, criticality: s.criticality,
          onClick: () => openOverlay(s.id, "Supplier", s.name) },
      });
      supplierY += ROW_GAP;
    }

    // ── UPLOADED SUPPLIERS ──
    for (const s of uploadedSuppliers) {
      const id = toId("sup", s.name);
      if (supplierIds.has(id)) continue;
      supplierIds.add(id);
      nodes.push({
        id, type: "supplier",
        position: { x: COL.supplier, y: supplierY },
        data: {
          id: id.toUpperCase(), name: s.name, country: s.country || "Unknown",
          health_score: 70, criticality: "medium",
          onClick: () => openOverlay(id, "Supplier", s.name),
        },
      });
      supplierY += ROW_GAP;
    }

    // ── DEFAULT PARTS ──
    const hardcodedParts = [
      { id: "part-mcu", partId: "MCU-32BIT-AUTO", name: "MCU-32BIT-AUTO", criticality: "critical", inventory_days: 8, lead_time_days: 21, safety_stock_days: 14 },
      { id: "part-pmic", partId: "POWER-MGMT-IC", name: "POWER-MGMT-IC", criticality: "high", inventory_days: 18, lead_time_days: 14, safety_stock_days: 10 },
      { id: "part-can", partId: "CAN-CONTROLLER", name: "CAN-CONTROLLER", criticality: "medium", inventory_days: 30, lead_time_days: 10, safety_stock_days: 7 },
    ];
    let partY = 0;
    for (const p of hardcodedParts) {
      partIds.add(p.id);
      nodes.push({
        id: p.id, type: "part",
        position: { x: COL.part, y: partY },
        data: { id: p.partId, name: p.name, criticality: p.criticality, inventory_days: p.inventory_days,
          lead_time_days: p.lead_time_days, safety_stock_days: p.safety_stock_days,
          onClick: () => openOverlay(p.id, "Part", p.name) },
      });
      partY += ROW_GAP;
    }

    // ── UPLOADED BOM (parts) ──
    for (const b of uploadedBOM) {
      const name = b.description || b.stock_keeping_unit || "Unknown Part";
      const id = toId("part", b.stock_keeping_unit || name);
      if (partIds.has(id)) continue;
      partIds.add(id);
      nodes.push({
        id, type: "part",
        position: { x: COL.part, y: partY },
        data: {
          id: b.stock_keeping_unit || id.toUpperCase(), name: name.length > 30 ? name.slice(0, 30) + "..." : name,
          criticality: "medium", inventory_days: b.lead_time_days || 14,
          lead_time_days: b.lead_time_days || 14, safety_stock_days: 7,
          onClick: () => openOverlay(id, "Part", name),
        },
      });

      // Auto-link uploaded BOM part to its supplier if we have the supplier node
      if (b.supplier_name) {
        const supId = toId("sup", b.supplier_name);
        if (supplierIds.has(supId)) {
          edges.push({
            id: `e-${supId}-${id}`, source: supId, target: id,
            type: "animated", data: { relationship: "supplies" },
          });
        }
      }

      partY += ROW_GAP;
    }

    // ── DEFAULT ORDERS ──
    const hardcodedOrders = [
      { id: "ord-bmw", ordId: "#DE-8821", customer: "BMW AG", due_date: "Mar 10", revenue: 2_250_000, margin: 18, status: "at_risk" },
      { id: "ord-vw", ordId: "#DE-9103", customer: "VW Group", due_date: "Mar 21", revenue: 1_989_000, margin: 15, status: "at_risk" },
      { id: "ord-bosch", ordId: "#DE-9250", customer: "Bosch GmbH", due_date: "Apr 1", revenue: 710_000, margin: 22, status: "on_track" },
    ];
    let orderY = 0;
    for (const o of hardcodedOrders) {
      nodes.push({
        id: o.id, type: "order",
        position: { x: COL.order, y: orderY },
        data: { id: o.ordId, customer: o.customer, due_date: o.due_date, revenue: o.revenue, margin: o.margin, status: o.status,
          onClick: () => openOverlay(o.id, "Order", `${o.customer} Order ${o.ordId}`) },
      });
      orderY += ROW_GAP;
    }

    // ── DEFAULT CUSTOMERS ──
    const hardcodedCustomers = [
      { id: "cust-bmw", custId: "CUST-001", name: "BMW AG", annual_revenue: 85_000_000, sla_days: 14 },
      { id: "cust-vw", custId: "CUST-002", name: "VW Group", annual_revenue: 72_000_000, sla_days: 21 },
      { id: "cust-bosch", custId: "CUST-003", name: "Bosch GmbH", annual_revenue: 31_000_000, sla_days: 30 },
    ];
    let customerY = 0;
    for (const c of hardcodedCustomers) {
      customerIds.add(c.id);
      nodes.push({
        id: c.id, type: "customer",
        position: { x: COL.customer, y: customerY },
        data: { id: c.custId, name: c.name, annual_revenue: c.annual_revenue, sla_days: c.sla_days,
          onClick: () => openOverlay(c.id, "Customer", c.name) },
      });
      customerY += ROW_GAP;
    }

    // ── UPLOADED SLA (customers) ──
    for (const s of uploadedSLA) {
      const name = s.customer || "Unknown Customer";
      const id = toId("cust", name);
      if (customerIds.has(id)) continue;
      customerIds.add(id);
      nodes.push({
        id, type: "customer",
        position: { x: COL.customer, y: customerY },
        data: {
          id: id.toUpperCase(), name, annual_revenue: s.annual_revenue || 0,
          sla_days: s.sla_days || 30,
          onClick: () => openOverlay(id, "Customer", name),
        },
      });
      customerY += ROW_GAP;
    }

    // ── EDGES ──

    // AFFECTS: connect each event to a subset of suppliers (round-robin)
    const supplierNodeIds = Array.from(supplierIds);
    for (let i = 0; i < eventsList.length; i++) {
      const evt = eventsList[i];
      // Connect to 1-2 suppliers based on severity
      const connectCount = evt.severity >= 7 ? 2 : 1;
      for (let j = 0; j < connectCount && j < supplierNodeIds.length; j++) {
        const targetSup = supplierNodeIds[(i + j) % supplierNodeIds.length];
        edges.push({
          id: `e-${evt.id}-${targetSup}`, source: evt.id, target: targetSup,
          type: "animated", data: { relationship: "affects" },
        });
      }
    }

    edges.push(
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
      // ALTERNATIVE_SUPPLIER
      { id: "e-inf-alt-tsmc", source: "sup-infineon", sourceHandle: "alt-source", target: "sup-tsmc", targetHandle: "alt-target", type: "animated", data: { relationship: "alternative_supplier" } },
    );

    return { initialNodes: nodes, initialEdges: edges };
  }, [uploadedSuppliers, uploadedSLA, uploadedBOM, scannedEvents, openOverlay]);

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

  if (!onboarded) return null;

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
                { color: "#EC4899", label: "Affects" },
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
          <GlobeExperience />
        )}

        {activeTab === "stockroom" && (
          <StockRoom inventory={MOCK_BOM} />
        )}
      </div>

      {/* Sidebar (graph view only) */}
      {activeTab === "graph" && <VisualizationSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((o) => !o)}
        onTabChange={setActiveTab}
        events={scannedEvents.length > 0
          ? scannedEvents.map((evt, i) => ({
              id: `evt-${evt.region?.toLowerCase().replace(/[^a-z0-9]+/g, "-") || `event-${i}`}`,
              type: evt.type, region: evt.region, severity: evt.severity,
              confidence: evt.confidence ?? 75, expected_delay_days: evt.expected_delay_days ?? 7,
            }))
          : [
              { id: "evt-taiwan", type: "Geopolitical", region: "Taiwan Strait Shipping Congestion", severity: 8, confidence: 85, expected_delay_days: 14 },
              { id: "evt-semi", type: "Market", region: "Semiconductor Price Surge", severity: 5, confidence: 72, expected_delay_days: 7 },
            ]
        }
        suppliers={[
          { id: "sup-tsmc", name: "TSMC", country: "Taiwan", health_score: 35, criticality: "critical" },
          { id: "sup-infineon", name: "Infineon", country: "Germany", health_score: 82, criticality: "high" },
          { id: "sup-stmicro", name: "STMicro", country: "Switzerland", health_score: 90, criticality: "medium" },
          ...uploadedSuppliers.map((s) => ({
            id: `sup-${s.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
            name: s.name, country: s.country || "Unknown", health_score: 70, criticality: "medium" as const,
          })),
        ]}
        parts={[
          { id: "part-mcu", name: "MCU-32BIT-AUTO", criticality: "critical", inventory_days: 8, safety_stock_days: 14 },
          { id: "part-pmic", name: "POWER-MGMT-IC", criticality: "high", inventory_days: 18, safety_stock_days: 10 },
          { id: "part-can", name: "CAN-CONTROLLER", criticality: "medium", inventory_days: 30, safety_stock_days: 7 },
          ...uploadedBOM.map((b) => ({
            id: `part-${(b.stock_keeping_unit || b.description || "").toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
            name: b.description || b.stock_keeping_unit || "Unknown", criticality: "medium" as const,
            inventory_days: b.lead_time_days || 14, safety_stock_days: 7,
          })),
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
          ...uploadedSLA.map((s) => ({
            id: `cust-${(s.customer || "").toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
            name: s.customer || "Unknown", annual_revenue: s.annual_revenue || 0, sla_days: s.sla_days || 30,
          })),
        ]}
      />}

      {/* Overlay - uses memoized sidebar lists */}
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
          Click any node to expand. Press &quot;/&quot; to open the Warden terminal.
        </p>
      </div>

      <SlashTerminal onTabChange={setActiveTab} />
    </div>
  );
}
