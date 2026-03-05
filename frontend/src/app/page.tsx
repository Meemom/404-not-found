"use client";

import { useState, useCallback, useMemo } from "react";
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";

import {
  PerceptionNode,
  RiskNode,
  PlanningNode,
  ActionNode,
  StockNode,
  SupplierNode,
  OrderNode,
  GraphNode,
  RadarNode,
} from "@/components/visualization/nodes";
import { AnimatedEdge } from "@/components/visualization/edges/AnimatedEdge";
import {
  NodeOverlay,
  PerceptionExpandedView,
  RiskExpandedView,
  PlanningExpandedView,
  ActionExpandedView,
  StockExpandedView,
  SupplierExpandedView,
  OrderExpandedView,
  GraphExpandedView,
  RadarExpandedView,
} from "@/components/visualization/overlays";

const nodeTypes = {
  perception: PerceptionNode,
  risk: RiskNode,
  planning: PlanningNode,
  action: ActionNode,
  stock: StockNode,
  supplier: SupplierNode,
  order: OrderNode,
  graph: GraphNode,
  radar: RadarNode,
};

const edgeTypes = {
  animated: AnimatedEdge,
};

export default function Home() {
  const [selectedNode, setSelectedNode] = useState<{
    id: string;
    type: string;
    label: string;
  } | null>(null);

  // Define nodes for the supply chain visualization
  const initialNodes: Node[] = [
    // Top layer: Perception & Risk
    {
      id: "perception",
      data: {
        label: "Perception",
        health: 87,
        onClick: (nodeId) => {
          setSelectedNode({
            id: nodeId,
            type: "Perception Agent",
            label: "Supply Chain Perception",
          });
        },
      },
      position: { x: 100, y: 0 },
      type: "perception",
    },
    {
      id: "risk",
      data: {
        label: "Risk Engine",
        health: 64,
        onClick: (nodeId) => {
          setSelectedNode({
            id: nodeId,
            type: "Risk Engine",
            label: "Risk Assessment",
          });
        },
      },
      position: { x: 450, y: 0 },
      type: "risk",
    },

    // Middle layer: Planning & Stock & Supplier
    {
      id: "planning",
      data: {
        label: "Planning",
        health: 92,
        onClick: (nodeId) => {
          setSelectedNode({
            id: nodeId,
            type: "Planning Agent",
            label: "Mitigation Planning",
          });
        },
      },
      position: { x: 0, y: 150 },
      type: "planning",
    },
    {
      id: "stock",
      data: {
        label: "Stock Monitor",
        health: 45,
        onClick: (nodeId) => {
          setSelectedNode({
            id: nodeId,
            type: "Inventory",
            label: "Inventory Status",
          });
        },
      },
      position: { x: 200, y: 150 },
      type: "stock",
    },
    {
      id: "supplier",
      data: {
        label: "Supplier Health",
        health: 72,
        onClick: (nodeId) => {
          setSelectedNode({
            id: nodeId,
            type: "Supplier Network",
            label: "Supplier Status",
          });
        },
      },
      position: { x: 400, y: 150 },
      type: "supplier",
    },
    {
      id: "graph",
      data: {
        label: "Supply Graph",
        health: 75,
        onClick: (nodeId) => {
          setSelectedNode({
            id: nodeId,
            type: "Network Graph",
            label: "Supply Chain Network",
          });
        },
      },
      position: { x: 600, y: 150 },
      type: "graph",
    },

    // Bottom layer: Action & Order & Radar
    {
      id: "action",
      data: {
        label: "Action Agent",
        health: 88,
        onClick: (nodeId) => {
          setSelectedNode({
            id: nodeId,
            type: "Action Agent",
            label: "Action Generation",
          });
        },
      },
      position: { x: 100, y: 300 },
      type: "action",
    },
    {
      id: "order",
      data: {
        label: "Orders",
        health: 58,
        onClick: (nodeId) => {
          setSelectedNode({
            id: nodeId,
            type: "Order Tracking",
            label: "Customer Orders",
          });
        },
      },
      position: { x: 350, y: 300 },
      type: "order",
    },
    {
      id: "radar",
      data: {
        label: "Threat Radar",
        health: 72,
        onClick: (nodeId) => {
          setSelectedNode({
            id: nodeId,
            type: "Early Warning",
            label: "Disruption Radar",
          });
        },
      },
      position: { x: 600, y: 300 },
      type: "radar",
    },
  ];

  const initialEdges: Edge[] = [
    // Perception and Risk edges
    {
      id: "perception-planning",
      source: "perception",
      target: "planning",
      type: "animated",
      data: { health: 87 },
      markerEnd: MarkerType.ArrowClosed,
      animated: true,
    },
    {
      id: "perception-stock",
      source: "perception",
      target: "stock",
      type: "animated",
      data: { health: 75 },
      markerEnd: MarkerType.ArrowClosed,
      animated: true,
    },
    {
      id: "perception-supplier",
      source: "perception",
      target: "supplier",
      type: "animated",
      data: { health: 80 },
      markerEnd: MarkerType.ArrowClosed,
      animated: true,
    },

    // Risk edges
    {
      id: "risk-planning",
      source: "risk",
      target: "planning",
      type: "animated",
      data: { health: 64 },
      markerEnd: MarkerType.ArrowClosed,
      animated: true,
    },
    {
      id: "risk-order",
      source: "risk",
      target: "order",
      type: "animated",
      data: { health: 58 },
      markerEnd: MarkerType.ArrowClosed,
      animated: true,
    },
    {
      id: "risk-radar",
      source: "risk",
      target: "radar",
      type: "animated",
      data: { health: 72 },
      markerEnd: MarkerType.ArrowClosed,
      animated: true,
    },

    // Middle layer edges
    {
      id: "stock-graph",
      source: "stock",
      target: "graph",
      type: "animated",
      data: { health: 70 },
      markerEnd: MarkerType.ArrowClosed,
      animated: true,
    },
    {
      id: "supplier-graph",
      source: "supplier",
      target: "graph",
      type: "animated",
      data: { health: 75 },
      markerEnd: MarkerType.ArrowClosed,
      animated: true,
    },

    // Planning to Action
    {
      id: "planning-action",
      source: "planning",
      target: "action",
      type: "animated",
      data: { health: 92 },
      markerEnd: MarkerType.ArrowClosed,
      animated: true,
    },

    // Action to Order and Outputs
    {
      id: "action-order",
      source: "action",
      target: "order",
      type: "animated",
      data: { health: 80 },
      markerEnd: MarkerType.ArrowClosed,
      animated: true,
    },
    {
      id: "graph-radar",
      source: "graph",
      target: "radar",
      type: "animated",
      data: { health: 75 },
      markerEnd: MarkerType.ArrowClosed,
      animated: true,
    },
  ];

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const expandedViewComponent = useMemo(() => {
    if (!selectedNode) return null;

    const componentMap: Record<string, React.ComponentType<any>> = {
      "Perception Agent": PerceptionExpandedView,
      "Risk Engine": RiskExpandedView,
      "Planning Agent": PlanningExpandedView,
      "Action Agent": ActionExpandedView,
      Inventory: StockExpandedView,
      "Supplier Network": SupplierExpandedView,
      "Order Tracking": OrderExpandedView,
      "Network Graph": GraphExpandedView,
      "Early Warning": RadarExpandedView,
    };

    const Component = componentMap[selectedNode.type];
    return Component ? (
      <Component nodeId={selectedNode.id} />
    ) : null;
  }, [selectedNode]);

  return (
    <div className="w-full h-screen flex flex-col bg-slate-950">
      {/* Header */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-900/50 border-b border-slate-700 px-6 py-4 backdrop-blur">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-1">
            Supply Chain Visualization
          </h1>
          <p className="text-sm text-slate-400">
            Real-time monitoring of AutoParts GmbH supply chain health and risk
            factors
          </p>
        </div>
      </div>

      {/* Flow Container */}
      <div className="flex-1 relative overflow-hidden">
        <div
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: "rgb(15, 23, 42)",
          }}
        >
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
          >
            <Background
              color="#334155"
              gap={16}
              size={1}
              style={{
                backgroundColor: "rgb(15, 23, 42)",
              }}
            />
            <Controls
              style={{
                backgroundColor: "rgba(15, 23, 42, 0.8)",
                border: "1px solid rgb(51, 65, 85)",
                borderRadius: "8px",
              }}
            />
          </ReactFlow>
        </div>
      </div>

      {/* Overlay for expanded node view */}
      <NodeOverlay
        isOpen={!!selectedNode}
        nodeId={selectedNode?.id ?? null}
        nodeType={selectedNode?.type ?? ""}
        nodeLabel={selectedNode?.label ?? ""}
        onClose={() => setSelectedNode(null)}
      >
        {expandedViewComponent}
      </NodeOverlay>

      {/* Footer info */}
      <div className="bg-slate-900 border-t border-slate-700 px-6 py-3">
        <p className="text-xs text-slate-500">
          Click on any node to view detailed metrics. Edge colors and particle
          flow indicate health status.
        </p>
      </div>
    </div>
  );
}
