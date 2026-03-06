import * as THREE from "three";
import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import type { InventoryItem } from "@/lib/types";

export interface ShelfUnitResult {
  group: THREE.Group;
  raycastMeshes: THREE.Mesh[];
  itemBoxes: Map<string, THREE.Mesh[]>;
  label: CSS2DObject;
  category: string;
}

const STATUS_COLORS: Record<string, number> = {
  healthy: 0x0d9488,
  adequate: 0xf59e0b,
  below_reorder: 0xef4444,
  critical: 0xef4444,
};

export function createShelfUnit(
  category: string,
  items: InventoryItem[],
  position: THREE.Vector3,
  rotation: number
): ShelfUnitResult {
  const group = new THREE.Group();
  group.position.copy(position);
  group.rotation.y = rotation;

  const raycastMeshes: THREE.Mesh[] = [];
  const itemBoxes = new Map<string, THREE.Mesh[]>();

  // Metal material for rack
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x888888,
    metalness: 0.6,
    roughness: 0.4,
  });

  // Two vertical uprights
  const uprightGeo = new THREE.BoxGeometry(0.08, 4, 0.08);
  const rackWidth = Math.max(items.length * 1.0, 1.5);
  const halfWidth = rackWidth / 2;

  const leftUpright = new THREE.Mesh(uprightGeo, metalMat);
  leftUpright.position.set(-halfWidth, 2, 0);
  group.add(leftUpright);

  const rightUpright = new THREE.Mesh(uprightGeo, metalMat);
  rightUpright.position.set(halfWidth, 2, 0);
  group.add(rightUpright);

  // 4 horizontal shelves
  const shelfGeo = new THREE.BoxGeometry(rackWidth + 0.1, 0.05, 0.5);
  for (let s = 0; s < 4; s++) {
    const shelf = new THREE.Mesh(shelfGeo, metalMat);
    shelf.position.set(0, s * 1.0 + 0.5, 0);
    group.add(shelf);
    raycastMeshes.push(shelf);
  }

  // Inventory boxes on shelves
  items.forEach((item, idx) => {
    const fillRatio = Math.min(
      1,
      Math.max(0, item.current_stock_units / (item.safety_stock_units * 1.5))
    );
    const boxCount = Math.max(1, Math.round(fillRatio * 5));
    const color = STATUS_COLORS[item.status] || 0x888888;
    const isCritical = item.status === "critical" || item.status === "below_reorder";

    const boxes: THREE.Mesh[] = [];
    const xOffset = -halfWidth + 0.5 + idx * 1.0;

    for (let b = 0; b < boxCount; b++) {
      const shelfLevel = b < 2 ? 0 : b < 4 ? 1 : 2;
      const bOnShelf = b < 2 ? b : b < 4 ? b - 2 : b - 4;

      const boxMat = new THREE.MeshStandardMaterial({
        color,
        emissive: isCritical ? 0xff0000 : 0x000000,
        emissiveIntensity: isCritical ? 0.3 : 0,
        roughness: 0.7,
      });

      const box = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 0.15, 0.35),
        boxMat
      );
      box.position.set(
        xOffset + bOnShelf * 0.42,
        shelfLevel * 1.0 + 0.5 + 0.125,
        0
      );
      box.userData = { itemId: item.component_id, status: item.status };
      group.add(box);
      raycastMeshes.push(box);
      boxes.push(box);
    }

    itemBoxes.set(item.component_id, boxes);
  });

  // Category label as CSS2DObject
  const labelDiv = document.createElement("div");
  labelDiv.style.cssText = `
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 13px;
    font-weight: 600;
    color: #1e293b;
    background: rgba(255, 255, 255, 0.92);
    padding: 4px 10px;
    border-radius: 6px;
    border: 1px solid #e2e8f0;
    white-space: nowrap;
    pointer-events: none;
    backdrop-filter: blur(4px);
  `;
  labelDiv.textContent = category;
  const label = new CSS2DObject(labelDiv);
  label.position.set(0, 4.5, 0);
  group.add(label);

  return { group, raycastMeshes, itemBoxes, label, category };
}
