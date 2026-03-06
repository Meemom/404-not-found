import * as THREE from "three";
import { CSS2DRenderer, CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import type { BOMItem } from "@/lib/types";
import { createWarehouseLighting, flickerShelfLights } from "./StockLighting";
import { createShelfUnit, type ShelfUnitResult } from "./ShelfUnit";

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
  strips: THREE.Mesh[];
  inventory: BOMItem[];
  cameraAngle: number;
  autoRotate: boolean;
  focusedShelf: string | null;
  targetCamPos: THREE.Vector3;
  animationId: number;
  mounted: boolean;
  container: HTMLDivElement;
  onItemClick: ((item: BOMItem) => void) | null;
}

const ORBIT_DIST = 10;
const ORBIT_Y = 4;
const FOCUS_DIST = 6;
const FOCUS_Y = 3;
const LERP_SPEED = 0.04;

export function initScene(
  container: HTMLDivElement,
  inventory: BOMItem[],
  onItemClick?: (item: BOMItem) => void
): StockSceneState {
  const w = container.clientWidth;
  const h = container.clientHeight;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf1f5f9);

  const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
  camera.position.set(0, ORBIT_Y, ORBIT_DIST);
  camera.lookAt(0, 1.5, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(w, h);
  renderer.shadowMap.enabled = false;
  container.appendChild(renderer.domElement);

  const css2dRenderer = new CSS2DRenderer();
  css2dRenderer.setSize(w, h);
  css2dRenderer.domElement.style.position = "absolute";
  css2dRenderer.domElement.style.top = "0";
  css2dRenderer.domElement.style.left = "0";
  css2dRenderer.domElement.style.pointerEvents = "none";
  container.appendChild(css2dRenderer.domElement);

  createRoom(scene);
  const { strips } = createWarehouseLighting(scene);
  const { shelves } = buildShelves(scene, inventory);

  const state: StockSceneState = {
    renderer,
    css2dRenderer,
    scene,
    camera,
    clock: new THREE.Clock(),
    raycaster: new THREE.Raycaster(),
    mouse: new THREE.Vector2(),
    shelves,
    strips,
    inventory,
    cameraAngle: 0,
    autoRotate: true,
    focusedShelf: null,
    targetCamPos: new THREE.Vector3(0, ORBIT_Y, ORBIT_DIST),
    animationId: 0,
    mounted: true,
    container,
    onItemClick: onItemClick || null,
  };

  const onPointerMove = (e: PointerEvent) => {
    const rect = container.getBoundingClientRect();
    state.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    state.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    handleHover(state);
  };

  const onClick = (e: MouseEvent) => {
    const rect = container.getBoundingClientRect();
    state.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    state.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    handleClick(state);
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
  container.addEventListener("click", onClick);
  window.addEventListener("resize", onResize);

  (state as unknown as Record<string, unknown>)._onPointerMove = onPointerMove;
  (state as unknown as Record<string, unknown>)._onClick = onClick;
  (state as unknown as Record<string, unknown>)._onResize = onResize;

  animate(state);
  return state;
}

function buildShelves(scene: THREE.Scene, inventory: BOMItem[]) {
  const categories = new Map<string, BOMItem[]>();
  for (const item of inventory) {
    const list = categories.get(item.category) || [];
    list.push(item);
    categories.set(item.category, list);
  }

  const shelves: ShelfUnitResult[] = [];
  for (const [cat, items] of categories) {
    const layout = SHELF_LAYOUT[cat];
    if (!layout) continue;
    const shelf = createShelfUnit(cat, items, new THREE.Vector3(...layout.pos), layout.rot);
    scene.add(shelf.group);
    shelves.push(shelf);
  }
  return { shelves };
}

function createRoom(scene: THREE.Scene) {
  const floorGeo = new THREE.PlaneGeometry(14, 14);
  const floorMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, roughness: 0.8 });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  const grid = new THREE.GridHelper(14, 28, 0xbbbbbb, 0xcccccc);
  grid.position.y = 0.01;
  scene.add(grid);

  const wallMat = new THREE.MeshStandardMaterial({
    color: 0xe5e7eb, transparent: true, opacity: 0.3, side: THREE.DoubleSide,
  });

  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(14, 5), wallMat);
  backWall.position.set(0, 2.5, -7);
  scene.add(backWall);

  const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(14, 5), wallMat);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.set(-7, 2.5, 0);
  scene.add(leftWall);

  const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(14, 5), wallMat);
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.position.set(7, 2.5, 0);
  scene.add(rightWall);

  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 14),
    new THREE.MeshStandardMaterial({ color: 0xf3f4f6, transparent: true, opacity: 0.2, side: THREE.DoubleSide })
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = 5;
  scene.add(ceiling);
}

function animate(state: StockSceneState) {
  if (!state.mounted) return;
  state.animationId = requestAnimationFrame(() => animate(state));

  const elapsed = state.clock.getElapsedTime();

  // Steady 360 auto-rotation
  if (state.autoRotate) {
    state.cameraAngle += 0.002;
    state.targetCamPos.set(
      Math.sin(state.cameraAngle) * ORBIT_DIST,
      ORBIT_Y,
      Math.cos(state.cameraAngle) * ORBIT_DIST
    );
  }

  // Smooth lerp camera toward target
  state.camera.position.x += (state.targetCamPos.x - state.camera.position.x) * LERP_SPEED;
  state.camera.position.y += (state.targetCamPos.y - state.camera.position.y) * LERP_SPEED;
  state.camera.position.z += (state.targetCamPos.z - state.camera.position.z) * LERP_SPEED;

  state.camera.lookAt(0, 1.5, 0);

  // Critical item box pulsing
  const criticalCategories = new Set<string>();
  for (const shelf of state.shelves) {
    shelf.itemBoxes.forEach((boxes) => {
      for (const box of boxes) {
        if (box.userData.status === "critical" || box.userData.status === "below_reorder") {
          criticalCategories.add(shelf.category);
          const mat = box.material as THREE.MeshStandardMaterial;
          mat.emissiveIntensity = 0.3 + Math.sin(elapsed * 3) * 0.3;
        }
      }
    });
  }

  flickerShelfLights(state.strips, criticalCategories, elapsed);

  state.renderer.render(state.scene, state.camera);
  state.css2dRenderer.render(state.scene, state.camera);
}

function getAllBoxMeshes(state: StockSceneState) {
  const meshes: THREE.Mesh[] = [];
  for (const shelf of state.shelves) {
    for (const mesh of shelf.raycastMeshes) {
      meshes.push(mesh);
    }
  }
  return meshes;
}

function focusOnShelf(state: StockSceneState, shelf: ShelfUnitResult) {
  state.autoRotate = false;
  state.focusedShelf = shelf.category;

  // Position camera facing the shelf from the outside
  const shelfPos = shelf.group.position;
  const dir = new THREE.Vector3().subVectors(shelfPos, new THREE.Vector3(0, 0, 0)).normalize();
  const camTarget = shelfPos.clone().add(dir.multiplyScalar(FOCUS_DIST));
  camTarget.y = FOCUS_Y;

  state.targetCamPos.copy(camTarget);
  state.cameraAngle = Math.atan2(camTarget.x, camTarget.z);
}

function returnToOrbit(state: StockSceneState) {
  state.focusedShelf = null;
  state.autoRotate = true;
}

function handleHover(state: StockSceneState) {
  state.raycaster.setFromCamera(state.mouse, state.camera);
  const hits = state.raycaster.intersectObjects(getAllBoxMeshes(state));

  if (hits.length > 0 && (hits[0].object as THREE.Mesh).userData.itemId) {
    state.container.style.cursor = "pointer";
  } else {
    state.container.style.cursor = "default";
  }
}

function handleClick(state: StockSceneState) {
  state.raycaster.setFromCamera(state.mouse, state.camera);
  const hits = state.raycaster.intersectObjects(getAllBoxMeshes(state));

  if (hits.length > 0) {
    const itemId = (hits[0].object as THREE.Mesh).userData.itemId;
    if (itemId) {
      // Find which shelf this item belongs to and focus on it
      for (const shelf of state.shelves) {
        if (shelf.itemBoxes.has(itemId)) {
          focusOnShelf(state, shelf);
          break;
        }
      }

      // Fire the item click callback for the popup
      if (state.onItemClick) {
        const item = state.inventory.find((i) => i.component_id === itemId);
        if (item) state.onItemClick(item);
      }
      return;
    }
  }

  // Clicked empty space — return to 360 orbit
  if (state.focusedShelf) {
    returnToOrbit(state);
  }
}

function removeShelfGroups(state: StockSceneState) {
  for (const shelf of state.shelves) {
    // Remove all CSS2DObjects so their DOM elements are cleaned up
    const toRemove: CSS2DObject[] = [];
    shelf.group.traverse((obj) => {
      if (obj instanceof CSS2DObject) {
        toRemove.push(obj);
      }
    });
    for (const obj of toRemove) {
      obj.removeFromParent();
      if (obj.element.parentNode) {
        obj.element.parentNode.removeChild(obj.element);
      }
    }
    state.scene.remove(shelf.group);
  }
  state.shelves.length = 0;
}

export function updateInventory(state: StockSceneState, inventory: BOMItem[]) {
  removeShelfGroups(state);
  state.inventory = inventory;

  const { shelves } = buildShelves(state.scene, inventory);
  state.shelves = shelves;
}

export function dispose(state: StockSceneState) {
  state.mounted = false;
  cancelAnimationFrame(state.animationId);

  const refs = state as unknown as Record<string, unknown>;
  if (refs._onPointerMove) state.container.removeEventListener("pointermove", refs._onPointerMove as EventListener);
  if (refs._onClick) state.container.removeEventListener("click", refs._onClick as EventListener);
  if (refs._onResize) window.removeEventListener("resize", refs._onResize as EventListener);

  state.scene.traverse((obj: THREE.Object3D) => {
    if (obj instanceof THREE.Mesh || obj instanceof THREE.Line || obj instanceof THREE.Points) {
      obj.geometry?.dispose();
      const m = obj.material;
      if (Array.isArray(m)) m.forEach((mm) => mm.dispose());
      else if (m) m.dispose();
    }
  });

  state.renderer.dispose();
  if (state.container.contains(state.renderer.domElement)) state.container.removeChild(state.renderer.domElement);
  if (state.container.contains(state.css2dRenderer.domElement)) state.container.removeChild(state.css2dRenderer.domElement);
}
