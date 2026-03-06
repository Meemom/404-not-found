import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import type { InventoryItem } from "@/lib/types";

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

export function createPopupCard(item: InventoryItem): CSS2DObject {
  const statusColor = STATUS_COLORS[item.status] || "#888";
  const statusLabel = STATUS_LABELS[item.status] || item.status;

  const div = document.createElement("div");
  div.style.cssText = `
    font-family: system-ui, -apple-system, sans-serif;
    background: rgba(255, 255, 255, 0.96);
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 14px 18px;
    min-width: 220px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    pointer-events: none;
    opacity: 0;
    transform: translateY(8px);
    transition: opacity 0.3s ease, transform 0.3s ease;
    backdrop-filter: blur(8px);
  `;

  div.innerHTML = `
    <div style="font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 8px;">
      ${item.name}
    </div>
    <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
      <span style="
        display: inline-block;
        padding: 2px 8px;
        border-radius: 9999px;
        font-size: 11px;
        font-weight: 600;
        color: white;
        background: ${statusColor};
      ">${statusLabel}</span>
    </div>
    <div style="font-size: 12px; color: #475569; line-height: 1.6;">
      <div><strong>Days of Supply:</strong> ${item.days_of_supply}</div>
      <div><strong>Stock:</strong> ${item.current_stock_units.toLocaleString()} units</div>
      <div><strong>Last Shipment:</strong> ${item.last_replenishment}</div>
      <div><strong>Next ETA:</strong> ${item.next_expected_delivery}</div>
    </div>
  `;

  const popup = new CSS2DObject(div);
  popup.position.set(0, 3.8, 0);
  popup.visible = false;

  return popup;
}

export function showPopup(popup: CSS2DObject) {
  popup.visible = true;
  const el = popup.element;
  // Force reflow then animate
  requestAnimationFrame(() => {
    el.style.opacity = "1";
    el.style.transform = "translateY(0)";
  });
}

export function hidePopup(popup: CSS2DObject) {
  const el = popup.element;
  el.style.opacity = "0";
  el.style.transform = "translateY(8px)";
  setTimeout(() => {
    popup.visible = false;
  }, 300);
}
