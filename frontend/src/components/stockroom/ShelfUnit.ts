import * as THREE from "three";
import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import type { BOMItem } from "@/lib/types";

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

const STATUS_HEX: Record<string, string> = {
  healthy: "#0d9488",
  adequate: "#f59e0b",
  below_reorder: "#ef4444",
  critical: "#ef4444",
};

export function createShelfUnit(
  category: string,
  items: BOMItem[],
  position: THREE.Vector3,
  rotation: number
): ShelfUnitResult {
  const group = new THREE.Group();
  group.position.copy(position);
  group.rotation.y = rotation;

  const raycastMeshes: THREE.Mesh[] = [];
  const itemBoxes = new Map<string, THREE.Mesh[]>();

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x888888,
    metalness: 0.6,
    roughness: 0.4,
  });

  const slotWidth = 1.2;
  const rackWidth = Math.max(items.length * slotWidth, 1.5);
  const halfWidth = rackWidth / 2;

  // Vertical uprights
  const uprightGeo = new THREE.BoxGeometry(0.08, 4, 0.08);
  const leftUpright = new THREE.Mesh(uprightGeo, metalMat);
  leftUpright.position.set(-halfWidth - 0.05, 2, 0);
  group.add(leftUpright);

  const rightUpright = new THREE.Mesh(uprightGeo, metalMat);
  rightUpright.position.set(halfWidth + 0.05, 2, 0);
  group.add(rightUpright);

  // 4 horizontal shelf planks
  const shelfGeo = new THREE.BoxGeometry(rackWidth + 0.2, 0.04, 0.55);
  for (let s = 0; s < 4; s++) {
    const shelf = new THREE.Mesh(shelfGeo, metalMat);
    shelf.position.set(0, s * 1.0 + 0.5, 0);
    group.add(shelf);
  }

  // One box per BOM item
  items.forEach((item, idx) => {
    const inv = item.inventory;
    const fillRatio = Math.min(1, Math.max(0, inv.current_stock_units / (inv.safety_stock_units * 1.5)));
    const color = STATUS_COLORS[inv.status] || 0x888888;
    const statusHex = STATUS_HEX[inv.status] || "#888";
    const isCritical = inv.status === "critical" || inv.status === "below_reorder";

    const xCenter = -halfWidth + slotWidth * 0.5 + idx * slotWidth;
    const boxH = 0.2 + fillRatio * 0.4;

    const boxMat = new THREE.MeshStandardMaterial({
      color,
      emissive: isCritical ? 0xff0000 : 0x000000,
      emissiveIntensity: isCritical ? 0.3 : 0,
      roughness: 0.6,
    });

    const box = new THREE.Mesh(new THREE.BoxGeometry(0.7, boxH, 0.4), boxMat);
    box.position.set(xCenter, 0.5 + 0.04 + boxH / 2, 0);
    box.userData = { itemId: item.component_id, status: inv.status };
    group.add(box);
    raycastMeshes.push(box);
    itemBoxes.set(item.component_id, [box]);

    // Item label — compact pill with status dot
    const itemDiv = document.createElement("div");
    itemDiv.style.cssText = `
      display: flex;
      align-items: center;
      gap: 5px;
      font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace;
      font-size: 9px;
      font-weight: 600;
      color: #334155;
      background: #fff;
      padding: 3px 8px;
      border-radius: 3px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      white-space: nowrap;
      pointer-events: none;
      letter-spacing: 0.2px;
    `;
    // Status dot + component ID
    const dot = document.createElement("span");
    dot.style.cssText = `
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: ${statusHex};
      flex-shrink: 0;
    `;
    const text = document.createElement("span");
    text.textContent = item.component_id;
    itemDiv.appendChild(dot);
    itemDiv.appendChild(text);

    const itemLabel = new CSS2DObject(itemDiv);
    itemLabel.position.set(xCenter, 0.5 + 0.04 + boxH + 0.15, 0.3);
    group.add(itemLabel);
  });

  // Category label — clean centered header
  const labelDiv = document.createElement("div");
  labelDiv.style.cssText = `
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    color: #1e293b;
    background: #fff;
    padding: 5px 14px;
    border-radius: 6px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.08);
    white-space: nowrap;
    pointer-events: none;
    text-align: center;
  `;
  labelDiv.textContent = category;
  const label = new CSS2DObject(labelDiv);
  label.position.set(0, 4.6, 0);
  group.add(label);

  return { group, raycastMeshes, itemBoxes, label, category };
}
