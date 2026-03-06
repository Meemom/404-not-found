"use client";

import { memo } from "react";
import { EdgeProps, getBezierPath } from "reactflow";
import { motion } from "framer-motion";

const EDGE_COLORS: Record<string, string> = {
  affects: "#ef4444",
  supplies: "#3b82f6",
  required_for: "#14b8a6",
  belongs_to: "#10b981",
  alternative_supplier: "#eab308",
};

interface AnimatedEdgeData {
  relationship?: string;
  health?: number;
}

export const AnimatedEdge = memo(
  ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
  }: EdgeProps<AnimatedEdgeData>) => {
    const relationship = data?.relationship ?? "supplies";
    const edgeColor = EDGE_COLORS[relationship] ?? "#94A3B8";
    const isDashed = relationship === "alternative_supplier";

    const [edgePath] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });

    return (
      <g>
        {/* Base edge */}
        <path
          d={edgePath}
          stroke="#CBD5E1"
          strokeWidth={isDashed ? 1.5 : 2}
          strokeDasharray={isDashed ? "6 4" : undefined}
          fill="none"
        />

        {/* Animated colored overlay */}
        <motion.path
          d={edgePath}
          stroke={edgeColor}
          strokeWidth={isDashed ? 1.5 : 2}
          strokeDasharray={isDashed ? "6 4" : undefined}
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.7 }}
          transition={{ duration: 2, repeat: Infinity }}
        />

        {/* Flowing particles */}
        {[0, 0.33, 0.66].map((offset, i) => (
          <motion.circle
            key={i}
            r={isDashed ? 2 : 3}
            fill={edgeColor}
            opacity={0.85}
            filter="url(#glow)"
            initial={{ offsetDistance: `${offset * 100}%` }}
            animate={{ offsetDistance: ["0%", "100%"] }}
            transition={{
              duration: 2.5,
              delay: offset * 2.5,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{
              offsetPath: `path("${edgePath}")`,
            }}
          />
        ))}

        {/* Relationship label */}
        <text>
          <textPath
            href={`#${id}`}
            startOffset="50%"
            textAnchor="middle"
            className="text-[8px] uppercase"
            style={{ fill: "#94A3B8" }}
            dy={-8}
          >
            {relationship.replace("_", " ")}
          </textPath>
        </text>
        <path id={id} d={edgePath} fill="none" stroke="none" />
      </g>
    );
  }
);

AnimatedEdge.displayName = "AnimatedEdge";