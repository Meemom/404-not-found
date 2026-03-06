import * as THREE from "three";
import { CSS2DRenderer } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import type { InventoryItem } from "@/lib/types";
import { createWarehouseLighting, flickerShelfLights } from "./StockLighting";
import { createShelfUnit, type ShelfUnitResult } from "./ShelfUnit";
import { createPopupCard, showPopup, hidePopup } from "./InventoryPopup";
import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";

// Layout: U-shape around center
const SHELF_LAYOUT: Record<string, { pos: [number, number, number]; rot: number }> = {
  Semiconductors: { pos: [-3, 0, -2], rot: 0 },
  "Battery Components": { pos: [3, 0, -2], rot: Math.PI },
  Sensors: { pos: [0, 0, 3], rot: Math.PI },
};

export interface StockSceneState {
  renderer: THREE.WebGLRenderer;
  css2dRenderer: CSS2DRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  clock: THREE.Clock;
  raycaster: THREE.Raycaster;
  mouse: THREE.Vector2;
  shelves: ShelfUnitResult[];
  popups: Map<string, CSS2DObject>;
  strips: THREE.Mesh[];
  cameraAngle: number;
  autoRotate: boolean;
  hoverTimeout: ReturnType<typeof setTimeout> | null;
  hoveredShelf: string | null;
  animationId: number;
  mounted: boolean;
  container: HTMLDivElement;
}

export function initScene(
  container: HTMLDivElement,
  inventory: InventoryItem[]
): StockSceneState {
  const w = container.clientWidth;
  const h = container.clientHeight;

  // Scene
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf1f5f9);

  // Camera
  const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
  camera.position.set(0, 4, 10);
  camera.lookAt(0, 1.5, 0);

  // WebGL Renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(w, h);
  renderer.shadowMap.enabled = false;
  container.appendChild(renderer.domElement);

  // CSS2D Renderer (overlay)
  const css2dRenderer = new CSS2DRenderer();
  css2dRenderer.setSize(w, h);
  css2dRenderer.domElement.style.position = "absolute";
  css2dRenderer.domElement.style.top = "0";
  css2dRenderer.domElement.style.left = "0";
  css2dRenderer.domElement.style.pointerEvents = "none";
  container.appendChild(css2dRenderer.domElement);

  // Room geometry
  createRoom(scene);

  // Lighting
  const { strips } = createWarehouseLighting(scene);

  // Group items by category
  const categories = new Map<string, InventoryItem[]>();
  for (const item of inventory) {
    const list = categories.get(item.category) || [];
    list.push(item);
    categories.set(item.category, list);
  }

  // Build shelves and popups
  const shelves: ShelfUnitResult[] = [];
  const popups = new Map<string, CSS2DObject>();

  for (const [cat, items] of categories) {
    const layout = SHELF_LAYOUT[cat];
    if (!layout) continue;

    const shelf = createShelfUnit(
      cat,
      items,
      new THREE.Vector3(...layout.pos),
      layout.rot
    );
    scene.add(shelf.group);
    shelves.push(shelf);

    // Create popup per category (shows first item or aggregated)
    const popup = createPopupCard(items[0]);
    shelf.group.add(popup);
    popups.set(cat, popup);
  }

  const state: StockSceneState = {
    renderer,
    css2dRenderer,
    scene,
    camera,
    clock: new THREE.Clock(),
    raycaster: new THREE.Raycaster(),
    mouse: new THREE.Vector2(),
    shelves,
    popups,
    strips,
    cameraAngle: 0,
    autoRotate: true,
    hoverTimeout: null,
    hoveredShelf: null,
    animationId: 0,
    mounted: true,
    container,
  };

  // Events
  const onPointerMove = (e: PointerEvent) => {
    const rect = container.getBoundingClientRect();
    state.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    state.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    handleHover(state);
  };

  const onResize = () => {
    const ww = container.clientWidth;
    const hh = container.clientHeight;
    camera.aspect = ww / hh;
    camera.updateProjectionMatrix();
    renderer.setSize(ww, hh);
    css2dRenderer.setSize(ww, hh);
  };

  container.addEventListener("pointermove", onPointerMove);
  window.addEventListener("resize", onResize);

  // Store cleanup references
  (state as unknown as Record<string, unknown>)._onPointerMove = onPointerMove;
  (state as unknown as Record<string, unknown>)._onResize = onResize;

  // Start animation
  animate(state);

  return state;
}

function createRoom(scene: THREE.Scene) {
  // Floor
  const floorGeo = new THREE.PlaneGeometry(14, 14);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0xd1d5db,
    roughness: 0.8,
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0;
  scene.add(floor);

  // Grid
  const grid = new THREE.GridHelper(14, 28, 0xbbbbbb, 0xcccccc);
  grid.position.y = 0.01;
  scene.add(grid);

  // Semi-transparent walls
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0xe5e7eb,
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide,
  });

  // Back wall
  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(14, 5), wallMat);
  backWall.position.set(0, 2.5, -7);
  scene.add(backWall);

  // Left wall
  const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(14, 5), wallMat);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.set(-7, 2.5, 0);
  scene.add(leftWall);

  // Right wall
  const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(14, 5), wallMat);
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.position.set(7, 2.5, 0);
  scene.add(rightWall);

  // Ceiling
  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 14),
    new THREE.MeshStandardMaterial({
      color: 0xf3f4f6,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide,
    })
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = 5;
  scene.add(ceiling);
}

function animate(state: StockSceneState) {
  if (!state.mounted) return;
  state.animationId = requestAnimationFrame(() => animate(state));

  const elapsed = state.clock.getElapsedTime();

  // Auto-rotation: camera orbits
  if (state.autoRotate) {
    state.cameraAngle += 0.002;
  }

  // Camera position from angle
  if (state.autoRotate || !state.hoveredShelf) {
    const dist = state.hoveredShelf ? 6 : 10;
    const camY = state.hoveredShelf ? 3 : 4;
    const targetX = Math.sin(state.cameraAngle) * dist;
    const targetZ = Math.cos(state.cameraAngle) * dist;

    // Lerp camera
    state.camera.position.x += (targetX - state.camera.position.x) * 0.05;
    state.camera.position.y += (camY - state.camera.position.y) * 0.05;
    state.camera.position.z += (targetZ - state.camera.position.z) * 0.05;
  }

  state.camera.lookAt(0, 1.5, 0);

  // Critical item box pulsing
  const criticalCategories = new Set<string>();
  for (const shelf of state.shelves) {
    shelf.itemBoxes.forEach((boxes) => {
      for (const box of boxes) {
        if (
          box.userData.status === "critical" ||
          box.userData.status === "below_reorder"
        ) {
          criticalCategories.add(shelf.category);
          const mat = box.material as THREE.MeshStandardMaterial;
          mat.emissiveIntensity = 0.3 + Math.sin(elapsed * 3) * 0.3;
        }
      }
    });
  }

  // Flicker ceiling strips near critical shelves
  flickerShelfLights(state.strips, criticalCategories, elapsed);

  // Proximity popups during auto-rotate
  if (state.autoRotate) {
    for (const shelf of state.shelves) {
      const popup = state.popups.get(shelf.category);
      if (!popup) continue;

      // Angle between camera direction and shelf position
      const camDir = new THREE.Vector3()
        .subVectors(shelf.group.position, state.camera.position)
        .normalize();
      const lookDir = new THREE.Vector3(0, 0, -1).applyQuaternion(
        state.camera.quaternion
      );
      const angle = Math.acos(Math.min(1, camDir.dot(lookDir)));

      if (angle < (30 * Math.PI) / 180) {
        showPopup(popup);
      } else {
        hidePopup(popup);
      }
    }
  }

  state.renderer.render(state.scene, state.camera);
  state.css2dRenderer.render(state.scene, state.camera);
}

function handleHover(state: StockSceneState) {
  state.raycaster.setFromCamera(state.mouse, state.camera);

  // Collect all raycast meshes
  const allMeshes: THREE.Mesh[] = [];
  const meshToShelf = new Map<THREE.Mesh, ShelfUnitResult>();

  for (const shelf of state.shelves) {
    for (const mesh of shelf.raycastMeshes) {
      allMeshes.push(mesh);
      meshToShelf.set(mesh, shelf);
    }
  }

  const hits = state.raycaster.intersectObjects(allMeshes);

  if (hits.length > 0) {
    const hitMesh = hits[0].object as THREE.Mesh;
    const shelf = meshToShelf.get(hitMesh);

    if (shelf && shelf.category !== state.hoveredShelf) {
      // New hover
      if (state.hoverTimeout) clearTimeout(state.hoverTimeout);
      state.hoveredShelf = shelf.category;
      state.autoRotate = false;

      // Lerp camera toward shelf
      const shelfPos = shelf.group.position;
      const dir = new THREE.Vector3()
        .subVectors(shelfPos, new THREE.Vector3(0, 0, 0))
        .normalize();
      const camTarget = shelfPos
        .clone()
        .add(dir.multiplyScalar(4))
        .setY(3);

      // Set camera angle to face this shelf
      state.cameraAngle = Math.atan2(camTarget.x, camTarget.z);

      // Show popup
      const popup = state.popups.get(shelf.category);
      if (popup) showPopup(popup);

      // Hide other popups
      for (const [cat, p] of state.popups) {
        if (cat !== shelf.category) hidePopup(p);
      }

      state.container.style.cursor = "pointer";
    }
  } else if (state.hoveredShelf) {
    // Unhover: delay then resume
    state.container.style.cursor = "default";
    if (state.hoverTimeout) clearTimeout(state.hoverTimeout);
    state.hoverTimeout = setTimeout(() => {
      state.hoveredShelf = null;
      state.autoRotate = true;
      // Hide all popups
      for (const popup of state.popups.values()) {
        hidePopup(popup);
      }
    }, 2000);
  }
}

export function updateInventory(
  state: StockSceneState,
  inventory: InventoryItem[]
) {
  // Remove old shelves
  for (const shelf of state.shelves) {
    state.scene.remove(shelf.group);
  }
  state.shelves.length = 0;
  state.popups.clear();

  // Group items by category
  const categories = new Map<string, InventoryItem[]>();
  for (const item of inventory) {
    const list = categories.get(item.category) || [];
    list.push(item);
    categories.set(item.category, list);
  }

  // Rebuild
  for (const [cat, items] of categories) {
    const layout = SHELF_LAYOUT[cat];
    if (!layout) continue;

    const shelf = createShelfUnit(
      cat,
      items,
      new THREE.Vector3(...layout.pos),
      layout.rot
    );
    state.scene.add(shelf.group);
    state.shelves.push(shelf);

    const popup = createPopupCard(items[0]);
    shelf.group.add(popup);
    state.popups.set(cat, popup);
  }
}

export function dispose(state: StockSceneState) {
  state.mounted = false;
  cancelAnimationFrame(state.animationId);

  if (state.hoverTimeout) clearTimeout(state.hoverTimeout);

  // Remove event listeners
  const onPointerMove = (state as unknown as Record<string, unknown>)
    ._onPointerMove as EventListener;
  const onResize = (state as unknown as Record<string, unknown>)
    ._onResize as EventListener;
  if (onPointerMove)
    state.container.removeEventListener("pointermove", onPointerMove);
  if (onResize) window.removeEventListener("resize", onResize);

  // Dispose Three.js resources
  state.scene.traverse((obj: THREE.Object3D) => {
    if (
      obj instanceof THREE.Mesh ||
      obj instanceof THREE.Line ||
      obj instanceof THREE.Points
    ) {
      obj.geometry?.dispose();
      const m = obj.material;
      if (Array.isArray(m)) m.forEach((mm) => mm.dispose());
      else if (m) m.dispose();
    }
  });

  state.renderer.dispose();
  if (state.container.contains(state.renderer.domElement)) {
    state.container.removeChild(state.renderer.domElement);
  }
  if (state.container.contains(state.css2dRenderer.domElement)) {
    state.container.removeChild(state.css2dRenderer.domElement);
  }
}
