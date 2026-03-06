"use client";

import { useEffect, useRef } from "react";
import type { InventoryItem } from "@/lib/types";
import { initScene, updateInventory, dispose, type StockSceneState } from "./StockScene";

interface StockRoomProps {
  inventory: InventoryItem[];
}

export default function StockRoom({ inventory }: StockRoomProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<StockSceneState | null>(null);

  // Init / dispose
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const state = initScene(container, inventory);
    stateRef.current = state;

    return () => {
      dispose(state);
      stateRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync inventory changes
  useEffect(() => {
    if (stateRef.current) {
      updateInventory(stateRef.current, inventory);
    }
  }, [inventory]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full"
      style={{ background: "var(--w-ob-bg)" }}
    />
  );
}
