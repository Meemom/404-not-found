"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import {
  GitBranch,
  AlertTriangle,
  Shield,
  Factory,
  Truck,
  Package,
  Users,
} from "lucide-react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  Handle,
  Position,
} from "reactflow";
import "reactflow/dist/style.css";
import { getCascadeData } from "@/lib/api";
import type { CascadeData, CascadeNode } from "@/lib/types";

/* ---------- Custom node component ---------- */
function CascadeNodeComponent({ data }: { data: any }) {
  const iconMap: Record<string, React.ReactNode> = {
    disruption: <AlertTriangle size={16} className="text-warden-coral" />,
    supplier: <Factory size={16} />,
    logistics: <Truck size={16} />,
    inventory: <Package size={16} />,
    production: <Shield size={16} />,
    customer: <Users size={16} />,
  };

  const borderColor =
    data.impact === "critical"
      ? "border-warden-coral/60"
      : data.impact === "high"
      ? "border-warden-amber/60"
      : data.impact === "medium"
      ? "border-warden-amber/30"
      : "border-warden-border";

  const bgColor =
    data.impact === "critical"
      ? "bg-warden-coral/5"
      : data.impact === "high"
      ? "bg-warden-amber/5"
      : "bg-warden-bg-elevated";

  return (
    <div
      className={`px-4 py-3 rounded-xl border ${borderColor} ${bgColor} backdrop-blur-sm min-w-[180px]`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-warden-text-tertiary !w-2 !h-2 !border-none"
      />
      <div className="flex items-center gap-2 mb-1">
        <div className="text-warden-text-secondary">
          {iconMap[data.type] || <Shield size={16} />}
        </div>
        <span className="text-xs font-semibold text-warden-text-primary truncate">
          {data.label}
        </span>
      </div>
      {data.detail && (
        <p className="text-[10px] text-warden-text-tertiary leading-snug">
          {data.detail}
        </p>
      )}
      {data.probability !== undefined && (
        <div className="mt-1.5 flex items-center gap-2">
          <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                data.probability > 70
                  ? "bg-warden-coral"
                  : data.probability > 40
                  ? "bg-warden-amber"
                  : "bg-warden-teal"
              }`}
              style={{ width: `${data.probability}%` }}
            />
          </div>
          <span className="font-data text-[10px] text-warden-text-secondary">
            {data.probability}%
          </span>
        </div>
      )}
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-warden-text-tertiary !w-2 !h-2 !border-none"
      />
    </div>
  );
}

const nodeTypes = { cascadeNode: CascadeNodeComponent };

/* ---------- Page component ---------- */
export default function CascadePage() {
  const [data, setData] = useState<CascadeData | null>(null);

  useEffect(() => {
    getCascadeData().then(setData).catch(console.error);
  }, []);

  const { nodes, edges } = useMemo(() => {
    if (!data) return { nodes: [], edges: [] };

    const rfNodes: Node[] = data.nodes.map((n, i) => ({
      id: n.id,
      type: "cascadeNode",
      position: { x: n.x ?? i * 260, y: n.y ?? (i % 3) * 120 },
      data: {
        label: n.label,
        type: n.type,
        impact: n.impact,
        detail: n.detail,
        probability: n.probability,
      },
    }));

    const rfEdges: Edge[] = data.edges.map((e) => ({
      id: `${e.source}-${e.target}`,
      source: e.source,
      target: e.target,
      animated: e.animated ?? false,
      style: {
        stroke:
          e.severity === "critical"
            ? "#FF6B6B"
            : e.severity === "high"
            ? "#FFBA49"
            : "rgba(255,255,255,0.15)",
        strokeWidth: e.severity === "critical" ? 2 : 1,
      },
      label: e.label,
      labelStyle: { fill: "rgba(255,255,255,0.5)", fontSize: 10 },
    }));

    return { nodes: rfNodes, edges: rfEdges };
  }, [data]);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-warden-amber/30 border-t-warden-amber rounded-full animate-spin" />
          <span className="text-xs text-warden-text-tertiary">
            Loading cascade model...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[calc(100vh-8rem)]">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-warden-bg-elevated border border-warden-border flex items-center justify-center">
            <GitBranch size={20} className="text-warden-amber" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-warden-text-primary">
              Disruption Cascade
            </h1>
            <p className="text-[11px] text-warden-text-tertiary">
              {data.scenario_name} — {data.nodes.length} impact nodes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-warden-bg-elevated/80 backdrop-blur-sm border border-warden-border">
          <span className="text-[10px] text-warden-text-tertiary">Impact:</span>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-warden-coral" />
            <span className="text-[10px] text-warden-text-tertiary">Critical</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-warden-amber" />
            <span className="text-[10px] text-warden-text-tertiary">High</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-warden-teal" />
            <span className="text-[10px] text-warden-text-tertiary">Low</span>
          </div>
        </div>
      </motion.div>

      {/* React Flow Canvas */}
      <div className="absolute inset-0 pt-16">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          proOptions={{ hideAttribution: true }}
          style={{
            backgroundColor: "transparent",
          }}
        >
          <Background color="rgba(255,255,255,0.03)" gap={32} />
          <Controls
            className="!bg-warden-bg-elevated !border-warden-border !rounded-xl !shadow-none [&>button]:!bg-warden-bg-elevated [&>button]:!border-warden-border [&>button]:!text-warden-text-secondary [&>button:hover]:!bg-warden-bg-primary"
            showInteractive={false}
          />
          <MiniMap
            nodeColor={(n) =>
              n.data?.impact === "critical"
                ? "#FF6B6B"
                : n.data?.impact === "high"
                ? "#FFBA49"
                : "rgba(255,255,255,0.2)"
            }
            style={{
              backgroundColor: "rgba(13,18,36,0.8)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 12,
            }}
            maskColor="rgba(0,0,0,0.5)"
          />
        </ReactFlow>
      </div>
    </div>
  );
}
