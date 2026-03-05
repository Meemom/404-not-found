"use client";

import { memo } from "react";
import {
  EdgeProps,
  getStraightPath,
  MarkerType,
} from "reactflow";
import { motion } from "framer-motion";

interface AnimatedEdgeProps extends EdgeProps {
  data?: {
    health?: number;
  };
}

export const AnimatedEdge = memo(
  ({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
  }: AnimatedEdgeProps) => {
    const [edgePath] = getStraightPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });

    const health = data?.health ?? 75;
    const edgeColor =
      health > 70 ? "#10b981" : health > 40 ? "#f59e0b" : "#ef4444";

    return (
      <g>
        {/* Base edge line */}
        <path
          d={edgePath}
          stroke="#4b5563"
          strokeWidth={2}
          fill="none"
          markerEnd={MarkerType.ArrowClosed}
        />

        {/* Animated health colored line */}
        <motion.path
          d={edgePath}
          stroke={edgeColor}
          strokeWidth={2}
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, repeat: Infinity }}
          opacity={0.6}
        />

        {/* Particle effect - multiple particles flowing along edge */}
        {[0, 0.33, 0.66].map((offset, i) => (
          <motion.circle
            key={i}
            cx={sourceX}
            cy={sourceY}
            r={3}
            fill={edgeColor}
            opacity={0.8}
            animate={{
              cx: [sourceX, targetX],
              cy: [sourceY, targetY],
            }}
            transition={{
              duration: 2,
              delay: offset * 2,
              repeat: Infinity,
              ease: "linear",
            }}
            filter="url(#glow)"
          />
        ))}
      </g>
    );
  }
);

AnimatedEdge.displayName = "AnimatedEdge";
