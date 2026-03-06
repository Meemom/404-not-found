"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

// TYPES

export interface SupplierNode {
  id: string;
  name: string;
  lat: number;
  lng: number;
  tier: "hq" | "tier1" | "tier2";
  status: "healthy" | "at_risk" | "disrupted";
  health_score: number;
}

export interface ShipmentArc {
  id: string;
  source_id: string;
  dest_id: string;
  status: "on_track" | "at_risk" | "delayed";
  speed: number;
}

export interface RiskZone {
  id: string;
  name: string;
  lat_min: number;
  lat_max: number;
  lng_min: number;
  lng_max: number;
}

export interface Disruption {
  id: string;
  zone_id: string;
  affected_suppliers: string[];
}

export interface SupplyGlobeProps {
  nodes: SupplierNode[];
  arcs: ShipmentArc[];
  riskZones: RiskZone[];
  disruptions: Disruption[];
  activeFilter: "all" | "at_risk" | "shipments" | "risk_zones";
  onSupplierSelect?: (supplier: SupplierNode) => void;
  onDisruptionDetected?: (disruption: Disruption) => void;
}

// CONSTANTS

const NODE_COLORS = {
  hq: 0x3B82F6,
  tier1: 0x14b8a6,
  tier2: 0xA78BFA,
  disrupted: 0xEC4899,
};

const NODE_SIZES = {
  hq: 0.022,
  tier1: 0.018,
  tier2: 0.012,
};

const ARC_COLORS = {
  on_track: 0x818CF8,
  at_risk: 0xD946EF,
  delayed: 0xEC4899,
};

const ARC_OPACITY = {
  on_track: 0.7,
  at_risk: 0.85,
  delayed: 0.9,
};

const INITIAL_FOCUS_LONGITUDE = 270;
const INITIAL_GLOBE_ROTATION_Y = THREE.MathUtils.degToRad(INITIAL_FOCUS_LONGITUDE - 90);

// UTILITIES

function latLngToVector3(lat: number, lng: number, radius = 1.001): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

// LAYER BUILDERS

function createStarfield(): THREE.Points {
  const count = 2000;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);
    const r = 50;
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return new THREE.Points(
    geo,
    new THREE.PointsMaterial({
      color: 0x1E293B,
      size: 0.05,
      transparent: true,
      opacity: 0.7,
      sizeAttenuation: true,
    })
  );
}

function createAtmosphere(): THREE.Group {
  const group = new THREE.Group();

  // outer halo glow (BackSide)
  const outerGeo = new THREE.SphereGeometry(1.08, 64, 64);
  const outerMat = new THREE.ShaderMaterial({
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vWorldPos;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      void main() {
        float intensity = pow(0.72 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 4.0);
        gl_FragColor = vec4(0.7, 0.96, 1.0, 1.0) * intensity * 1.4;
      }
    `,
    side: THREE.BackSide,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  group.add(new THREE.Mesh(outerGeo, outerMat));

  // inner rim glow (FrontSide)
  const innerGeo = new THREE.SphereGeometry(1.01, 64, 64);
  const innerMat = new THREE.ShaderMaterial({
    vertexShader: `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      void main() {
        float intensity = pow(0.55 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.5);
        gl_FragColor = vec4(0.35, 0.6, 1.0, 1.0) * intensity * 0.6;
      }
    `,
    side: THREE.FrontSide,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  group.add(new THREE.Mesh(innerGeo, innerMat));

  return group;
}

function createGlobe(): THREE.Mesh {
  const geo = new THREE.SphereGeometry(1.0, 64, 64);
  const mat = new THREE.MeshPhongMaterial({
    color: 0xe8ecf1,
    emissive: 0x1a2035,
    emissiveIntensity: 0.3,
    specular: 0x445577,
    shininess: 50,
  });
  return new THREE.Mesh(geo, mat);
}

/** geojson borders **/
interface GeoJSONFeature {
  type: "Feature";
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: number[][][] | number[][][][];
  };
}

interface GeoJSONCollection {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
}

async function loadGeoJSONBorders(globeGroup: THREE.Group) {
  const res = await fetch("/countries.geojson");
  const data: GeoJSONCollection = await res.json();

  const mat = new THREE.LineBasicMaterial({
    color: 0x8a95a5,
    transparent: true,
    opacity: 0.6,
  });

  const r = 1.002;

  function addRing(coords: number[][]) {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < coords.length; i++) {
      const [lng, lat] = coords[i];
      pts.push(latLngToVector3(lat, lng, r));
    }
    if (pts.length > 1) {
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      globeGroup.add(new THREE.Line(geo, mat));
    }
  }

  data.features.forEach((feature) => {
    const geom = feature.geometry;
    if (geom.type === "Polygon") {
      (geom.coordinates as number[][][]).forEach((ring) => addRing(ring));
    } else if (geom.type === "MultiPolygon") {
      (geom.coordinates as number[][][][]).forEach((polygon) =>
        polygon.forEach((ring) => addRing(ring))
      );
    }
  });
}

// MAIN COMPONENT

export default function SupplyGlobe({
  nodes,
  arcs,
  riskZones,
  disruptions,
  activeFilter,
  onSupplierSelect,
  onDisruptionDetected,
}: SupplyGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const internals = useRef<{
    scene: THREE.Scene;
    renderer: THREE.WebGLRenderer;
    camera: THREE.PerspectiveCamera;
    globeGroup: THREE.Group;
    clock: THREE.Clock;
    raycaster: THREE.Raycaster;
    mouse: THREE.Vector2;
    nodeObjects: Map<string, THREE.Group>;
    arcObjects: Map<string, { line: THREE.Line; dots: THREE.Mesh[]; curve: THREE.Curve<THREE.Vector3> }>;
    riskZoneObjects: Map<string, THREE.Mesh[]>;
    autoRotate: boolean;
    isDragging: boolean;
    prevPointer: { x: number; y: number };
    autoRotateTimer: ReturnType<typeof setTimeout> | null;
    animationId: number;
    mounted: boolean;
  } | null>(null);

  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // stable refs for props used inside event handlers & animation loop
  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;
  const arcsRef = useRef(arcs);
  arcsRef.current = arcs;
  const onSupplierSelectRef = useRef(onSupplierSelect);
  onSupplierSelectRef.current = onSupplierSelect;

  // SCENE INIT (runs once)

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const w = container.clientWidth;
    const h = container.clientHeight;

    // --- Scene ---
    const scene = new THREE.Scene();

    // --- Camera ---
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
    camera.position.set(0, 0, 2.5);

    // --- Renderer ---
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4;
    container.appendChild(renderer.domElement);

    // --- Lighting ---
    scene.add(new THREE.AmbientLight(0x8899bb, 1.0));

    const sun = new THREE.DirectionalLight(0xffffff, 1.8);
    sun.position.set(5, 3, 5);
    scene.add(sun);

    const fill = new THREE.DirectionalLight(0xd9e9ff, 0.9);
    fill.position.set(-3, -1, 2);
    scene.add(fill);

    const back = new THREE.DirectionalLight(0x6688bb, 0.5);
    back.position.set(0, -2, -5);
    scene.add(back);

    // globe group holds all rotating parts so they rotate together
    const globeGroup = new THREE.Group();
    globeGroup.rotation.y = INITIAL_GLOBE_ROTATION_Y;
    globeGroup.rotation.x = THREE.MathUtils.degToRad(20);
    scene.add(globeGroup);

    scene.add(createStarfield());          // layer 1: starfield, scene level 
    globeGroup.add(createAtmosphere());    // layer 2: atmosphere glow
    globeGroup.add(createGlobe());         // layer 3: globe sphere
    loadGeoJSONBorders(globeGroup);        // layer 4: country borders


    // --- Internal mutable state (no React re-renders) ---
    const state = {
      scene,
      renderer,
      camera,
      globeGroup,
      clock: new THREE.Clock(),
      raycaster: new THREE.Raycaster(),
      mouse: new THREE.Vector2(),
      nodeObjects: new Map<string, THREE.Group>(),
      arcObjects: new Map<string, { line: THREE.Line; dots: THREE.Mesh[]; curve: THREE.Curve<THREE.Vector3> }>(),
      riskZoneObjects: new Map<string, THREE.Mesh[]>(),
      autoRotate: true,
      isDragging: false,
      prevPointer: { x: 0, y: 0 },
      autoRotateTimer: null as ReturnType<typeof setTimeout> | null,
      animationId: 0,
      mounted: true,
    };
    internals.current = state;

    // ─── Animation loop ───
    const animate = () => {
      if (!state.mounted) return;
      state.animationId = requestAnimationFrame(animate);

      const elapsed = state.clock.getElapsedTime();

      // Auto-rotate
      if (state.autoRotate && !state.isDragging) {
        state.globeGroup.rotation.y += 0.001;
      }

      // Animate arc dots
      state.arcObjects.forEach((arcData, id) => {
        const arc = arcsRef.current.find((a) => a.id === id);
        if (!arc) return;
        const speed = arc.speed || 0.1;
        const t = (elapsed * speed) % 1.0;
        arcData.dots.forEach((dot, idx) => {
          let dotT = t - idx * 0.02;
          if (dotT < 0) dotT += 1;
          const pt = arcData.curve.getPoint(dotT);
          dot.position.copy(pt);
          if (dot.material instanceof THREE.MeshBasicMaterial) {
            dot.material.opacity = Math.max(0, 1 - idx * 0.3);
          }
        });
      });

      // Pulse rings
      state.nodeObjects.forEach((group, id) => {
        const node = nodesRef.current.find((n) => n.id === id);
        if (!node || (node.status !== "disrupted" && node.status !== "at_risk")) return;
        const pulse = group.getObjectByName("pulseRing") as THREE.Mesh | undefined;
        if (!pulse) return;
        const phase = (elapsed % 2) / 2;
        pulse.scale.setScalar(1 + phase * 2.5);
        if (pulse.material instanceof THREE.MeshBasicMaterial) {
          pulse.material.opacity = 0.6 * (1 - phase);
        }
      });

      // Risk zone pulsing opacity
      state.riskZoneObjects.forEach((meshes) => {
        meshes.forEach((mesh, idx) => {
          if (mesh.material instanceof THREE.MeshBasicMaterial) {
            const base = idx === 0 ? 0.15 : 0.05;
            mesh.material.opacity = base + Math.sin(elapsed * 2) * 0.05;
          }
        });
      });

      // Billboard rings toward camera
      state.nodeObjects.forEach((group) => {
        const ring = group.getObjectByName("ring") as THREE.Mesh | undefined;
        if (ring) ring.lookAt(camera.position);
        const pulse = group.getObjectByName("pulseRing") as THREE.Mesh | undefined;
        if (pulse) pulse.lookAt(camera.position);
      });

      renderer.render(scene, camera);
    };
    animate();

    // ─── Pointer drag rotation ───
    const onPointerDown = (e: PointerEvent) => {
      state.isDragging = true;
      state.prevPointer = { x: e.clientX, y: e.clientY };
      if (state.autoRotateTimer) clearTimeout(state.autoRotateTimer);
      state.autoRotate = false;
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();

      // Update mouse NDC for raycasting
      state.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      state.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      // rotate globe if drag
      if (state.isDragging) {
        const dx = e.clientX - state.prevPointer.x;
        const dy = e.clientY - state.prevPointer.y;
        state.globeGroup.rotation.y += dx * 0.005;
        state.globeGroup.rotation.x += dy * 0.005;
        // Clamp vertical rotation
        state.globeGroup.rotation.x = Math.max(
          -Math.PI / 2,
          Math.min(Math.PI / 2, state.globeGroup.rotation.x)
        );
        state.prevPointer = { x: e.clientX, y: e.clientY };
        return; // skip hover detection while dragging
      }

      // hover raycasting
      state.raycaster.setFromCamera(state.mouse, camera);
      const cores = Array.from(state.nodeObjects.values())
        .map((g) => g.getObjectByName("core"))
        .filter(Boolean) as THREE.Mesh[];
      const hits = state.raycaster.intersectObjects(cores);
      if (hits.length > 0) {
        const hit = hits[0].object;
        const entry = Array.from(state.nodeObjects.entries()).find(
          ([, g]) => g.getObjectByName("core") === hit
        );
        if (entry) {
          setHoveredNode(entry[0]);
          container.style.cursor = "pointer";
          return;
        }
      }
      setHoveredNode(null);
      container.style.cursor = "grab";
    };

    const onPointerUp = () => {
      state.isDragging = false;
      container.style.cursor = "grab";
      state.autoRotateTimer = setTimeout(() => {
        state.autoRotate = true;
      }, 3000);
    };

    const onClick = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      state.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      state.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      state.raycaster.setFromCamera(state.mouse, camera);
      const cores = Array.from(state.nodeObjects.values())
        .map((g) => g.getObjectByName("core"))
        .filter(Boolean) as THREE.Mesh[];
      const hits = state.raycaster.intersectObjects(cores);
      if (hits.length > 0) {
        const hit = hits[0].object;
        const entry = Array.from(state.nodeObjects.entries()).find(
          ([, g]) => g.getObjectByName("core") === hit
        );
        if (entry) {
          const node = nodesRef.current.find((n) => n.id === entry[0]);
          if (node && onSupplierSelectRef.current) {
            onSupplierSelectRef.current(node);
          }
        }
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      camera.position.z = Math.max(1.5, Math.min(5, camera.position.z + e.deltaY * 0.002));
    };

    // resize
    let resizeTimer: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (!container) return;
        const ww = container.clientWidth;
        const hh = container.clientHeight;
        camera.aspect = ww / hh;
        camera.updateProjectionMatrix();
        renderer.setSize(ww, hh);
      }, 100);
    };

    container.addEventListener("pointerdown", onPointerDown);
    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerup", onPointerUp);
    container.addEventListener("pointerleave", onPointerUp);
    container.addEventListener("click", onClick);
    container.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("resize", onResize);
    container.style.cursor = "grab";

    // clean up
    return () => {
      state.mounted = false;
      cancelAnimationFrame(state.animationId);
      container.removeEventListener("pointerdown", onPointerDown);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerup", onPointerUp);
      container.removeEventListener("pointerleave", onPointerUp);
      container.removeEventListener("click", onClick);
      container.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", onResize);
      if (state.autoRotateTimer) clearTimeout(state.autoRotateTimer);
      scene.traverse((obj: THREE.Object3D) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Line || obj instanceof THREE.Points) {
          obj.geometry?.dispose();
          const m = obj.material;
          if (Array.isArray(m)) m.forEach((mm) => mm.dispose());
          else if (m) m.dispose();
        }
      });
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      internals.current = null;
    };
  }, []); // runs once

  // SYNC NODES into Three.js

  useEffect(() => {
    const s = internals.current;
    if (!s) return;

    // remove old
    s.nodeObjects.forEach((g) => s.globeGroup.remove(g));
    s.nodeObjects.clear();

    // add new
    nodes.forEach((node) => {
      const g = buildNode(node);
      s.globeGroup.add(g);
      s.nodeObjects.set(node.id, g);
    });
  }, [nodes]);

  // SYNC ARCS

  useEffect(() => {
    const s = internals.current;
    if (!s) return;

    s.arcObjects.forEach((a) => {
      s.globeGroup.remove(a.line);
      a.dots.forEach((d) => s.globeGroup.remove(d));
    });
    s.arcObjects.clear();

    arcs.forEach((arc) => {
      const src = nodes.find((n) => n.id === arc.source_id);
      const dst = nodes.find((n) => n.id === arc.dest_id);
      if (!src || !dst) return;
      const data = buildArc(src, dst, arc);
      s.globeGroup.add(data.line);
      data.dots.forEach((d) => s.globeGroup.add(d));
      s.arcObjects.set(arc.id, data);
    });
  }, [arcs, nodes]);

  // SYNC RISK ZONES

  useEffect(() => {
    const s = internals.current;
    if (!s) return;

    s.riskZoneObjects.forEach((ms) => ms.forEach((m) => s.globeGroup.remove(m)));
    s.riskZoneObjects.clear();

    riskZones.forEach((zone) => {
      const ms = buildRiskZone(zone);
      ms.forEach((m) => s.globeGroup.add(m));
      s.riskZoneObjects.set(zone.id, ms);
    });
  }, [riskZones]);

  // DISRUPTION NOTIFICATIONS

  useEffect(() => {
    if (disruptions.length > 0 && onDisruptionDetected) {
      disruptions.forEach((d) => onDisruptionDetected(d));
    }
  }, [disruptions, onDisruptionDetected]);

  // FILTER VISIBILITY

  useEffect(() => {
    const s = internals.current;
    if (!s) return;

    s.nodeObjects.forEach((group, id) => {
      const n = nodes.find((nn) => nn.id === id);
      if (!n) return;
      let vis = true;
      switch (activeFilter) {
        case "at_risk": vis = n.status === "at_risk" || n.status === "disrupted"; break;
        case "risk_zones": vis = true; break;
        case "shipments": vis = true; break;
      }
      group.visible = vis;
    });

    s.arcObjects.forEach((ad, id) => {
      const a = arcs.find((aa) => aa.id === id);
      if (!a) return;
      let vis = true;
      if (activeFilter === "at_risk") vis = a.status !== "on_track";
      if (activeFilter === "risk_zones") vis = false;
      ad.line.visible = vis;
      ad.dots.forEach((d) => (d.visible = vis));
    });

    s.riskZoneObjects.forEach((ms) => {
      const vis = activeFilter === "all" || activeFilter === "risk_zones";
      ms.forEach((m) => (m.visible = vis));
    });
  }, [activeFilter, nodes, arcs]);

  // HOVER SCALE

  useEffect(() => {
    const s = internals.current;
    if (!s) return;
    s.nodeObjects.forEach((group, id) => {
      const core = group.getObjectByName("core") as THREE.Mesh | undefined;
      if (!core) return;
      core.scale.setScalar(id === hoveredNode ? 1.4 : 1.0);
    });
  }, [hoveredNode]);

  // BUILDERS (pure functions that create Three objects)

  function buildNode(node: SupplierNode): THREE.Group {
    const group = new THREE.Group();
    group.position.copy(latLngToVector3(node.lat, node.lng, 1.0));

    const size = NODE_SIZES[node.tier];
    const color = node.status === "disrupted" ? NODE_COLORS.disrupted : NODE_COLORS[node.tier];

    // Core
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(size, 16, 16),
      new THREE.MeshBasicMaterial({ color })
    );
    core.name = "core";
    group.add(core);

    // Glow ring
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(size + 0.005, size + 0.015, 32),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1, side: THREE.DoubleSide })
    );
    ring.name = "ring";
    group.add(ring);

    // Pulse ring for at-risk / disrupted
    if (node.status === "disrupted" || node.status === "at_risk") {
      const pc = NODE_COLORS.disrupted; // unified pink for all risk states
      const pulse = new THREE.Mesh(
        new THREE.RingGeometry(size + 0.005, size + 0.025, 32),
        new THREE.MeshBasicMaterial({ color: pc, transparent: true, opacity: 0.5, side: THREE.DoubleSide })
      );
      pulse.name = "pulseRing";
      group.add(pulse);
    }

    return group;
  }

  function buildArc(
    src: SupplierNode,
    dst: SupplierNode,
    arc: ShipmentArc
  ): { line: THREE.Line; dots: THREE.Mesh[]; curve: THREE.Curve<THREE.Vector3> } {
    const start = latLngToVector3(src.lat, src.lng, 1.001);
    const end = latLngToVector3(dst.lat, dst.lng, 1.001);
    const dist = start.distanceTo(end);
    const mid = start.clone().add(end).multiplyScalar(0.5).normalize();
    const ctrl = mid.multiplyScalar(1.0 + 0.3 + (dist / 10) * 0.3);

    const curve = new THREE.QuadraticBezierCurve3(start, ctrl, end);
    const pts = curve.getPoints(60);
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const col = ARC_COLORS[arc.status];
    const line = new THREE.Line(
      geo,
      new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: ARC_OPACITY[arc.status] })
    );

    const dots: THREE.Mesh[] = [];
    for (let i = 0; i < 4; i++) {
      dots.push(
        new THREE.Mesh(
          new THREE.SphereGeometry(0.008, 8, 8),
          new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 1 - i * 0.25 })
        )
      );
    }

    return { line, dots, curve };
  }

  function buildRiskZone(zone: RiskZone): THREE.Mesh[] {
    const meshes: THREE.Mesh[] = [];
    [0.15, 0.05].forEach((opacity, idx) => {
      const r = 1.002 + idx * 0.005;
      const phiStart = (90 - zone.lat_max) * (Math.PI / 180);
      const phiLen = (zone.lat_max - zone.lat_min) * (Math.PI / 180);
      const thetaStart = (zone.lng_min + 180) * (Math.PI / 180);
      const thetaLen = (zone.lng_max - zone.lng_min) * (Math.PI / 180);
      const geo = new THREE.SphereGeometry(r, 32, 32, thetaStart, thetaLen, phiStart, phiLen);
      meshes.push(
        new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xEC4899, transparent: true, opacity, side: THREE.DoubleSide }))
      );
    });
    return meshes;
  }

  // RENDER

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />

      {/* Hover tooltip */}
      {hoveredNode && (() => {
        const node = nodes.find((n) => n.id === hoveredNode);
        if (!node) return null;
        return (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none z-10 px-3 py-1.5 rounded-md bg-[rgba(10,15,30,0.9)] border border-warden-border-accent text-xs text-warden-text-primary font-medium backdrop-blur-sm">
            {node.name}
          </div>
        );
      })()}
    </div>
  );
}
