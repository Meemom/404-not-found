"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { Globe as GlobeIcon, AlertTriangle, MapPin, Info } from "lucide-react";
import { getGlobeData } from "@/lib/api";
import type { GlobeData, GlobeNode, GlobeArc } from "@/lib/types";
import dynamic from "next/dynamic";

const GlobeGL = dynamic(() => import("react-globe.gl"), { ssr: false });

export default function GlobePage() {
  const [data, setData] = useState<GlobeData | null>(null);
  const [selected, setSelected] = useState<GlobeNode | null>(null);
  const globeRef = useRef<any>(null);

  useEffect(() => {
    getGlobeData().then(setData).catch(console.error);
  }, []);

  // Auto-rotate
  useEffect(() => {
    if (globeRef.current) {
      const controls = globeRef.current.controls();
      if (controls) {
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.3;
      }
    }
  }, [data]);

  const pointsData = useMemo(() => {
    if (!data) return [];
    return data.nodes.map((n) => ({
      lat: n.lat,
      lng: n.lng,
      size: n.type === "hq" ? 0.6 : n.type === "supplier" ? 0.4 : 0.3,
      color:
        n.status === "disrupted" || n.status === "at_risk"
          ? n.status === "disrupted" ? "#FF6B6B" : "#FFBA49"
          : n.type === "hq"
          ? "#60A5FA"
          : "#2DD4BF",
      label: n.name,
      node: n,
    }));
  }, [data]);

  const arcsData = useMemo(() => {
    if (!data) return [];
    return data.arcs.map((a) => ({
      startLat: a.startLat,
      startLng: a.startLng,
      endLat: a.endLat,
      endLng: a.endLng,
      color:
        a.status === "disrupted"
          ? ["#FF6B6B", "#FF6B6B"]
          : a.status === "at_risk"
          ? ["#FFBA49", "#FFBA49"]
          : ["rgba(45,212,191,0.4)", "rgba(45,212,191,0.15)"],
      stroke: a.status === "disrupted" ? 1.5 : 0.8,
      dashLength: a.status === "disrupted" ? 0.3 : 1,
      dashGap: a.status === "disrupted" ? 0.15 : 0,
      dashAnimateTime: a.status === "disrupted" ? 2000 : 0,
      arc: a,
    }));
  }, [data]);

  const ringsData = useMemo(() => {
    if (!data?.risk_zones) return [];
    return data.risk_zones.map((z) => ({
      lat: z.lat,
      lng: z.lng,
      maxR: z.radius / 500,
      propagationSpeed: 2,
      repeatPeriod: 800,
      color:
        z.severity > 7
          ? "rgba(255,107,107,0.6)"
          : "rgba(255,186,73,0.4)",
    }));
  }, [data]);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-warden-amber/30 border-t-warden-amber rounded-full animate-spin" />
          <span className="text-xs text-warden-text-tertiary">
            Loading globe data...
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
            <GlobeIcon size={20} className="text-warden-teal" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-warden-text-primary">
              Supply Chain Globe
            </h1>
            <p className="text-[11px] text-warden-text-tertiary">
              {data.nodes.length} nodes — {data.arcs.length} routes
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 px-4 py-2 rounded-xl bg-warden-bg-elevated/80 backdrop-blur-sm border border-warden-border">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#60A5FA]" />
            <span className="text-[10px] text-warden-text-tertiary">HQ</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-warden-teal" />
            <span className="text-[10px] text-warden-text-tertiary">OK</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-warden-amber" />
            <span className="text-[10px] text-warden-text-tertiary">Warning</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-warden-coral" />
            <span className="text-[10px] text-warden-text-tertiary">Critical</span>
          </div>
        </div>
      </motion.div>

      {/* Globe */}
      <div className="absolute inset-0">
        <GlobeGL
          ref={globeRef}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
          backgroundColor="rgba(0,0,0,0)"
          atmosphereColor="#FFBA49"
          atmosphereAltitude={0.15}
          pointsData={pointsData}
          pointLat="lat"
          pointLng="lng"
          pointAltitude={(d: any) => d.size * 0.03}
          pointRadius={(d: any) => d.size}
          pointColor={(d: any) => d.color}
          pointLabel={(d: any) => d.label}
          onPointClick={(point: any) => setSelected(point.node)}
          arcsData={arcsData}
          arcStartLat="startLat"
          arcStartLng="startLng"
          arcEndLat="endLat"
          arcEndLng="endLng"
          arcColor="color"
          arcStroke="stroke"
          arcDashLength="dashLength"
          arcDashGap="dashGap"
          arcDashAnimateTime="dashAnimateTime"
          arcAltitudeAutoScale={0.3}
          ringsData={ringsData}
          ringLat="lat"
          ringLng="lng"
          ringMaxRadius="maxR"
          ringPropagationSpeed="propagationSpeed"
          ringRepeatPeriod="repeatPeriod"
          ringColor="color"
          width={typeof window !== "undefined" ? window.innerWidth - 320 : 1000}
          height={typeof window !== "undefined" ? window.innerHeight - 128 : 700}
        />
      </div>

      {/* Selected Node Panel */}
      {selected && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className="absolute top-20 right-4 w-72 warden-card border border-warden-border p-4 z-20"
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-warden-text-primary">
                {selected.name}
              </h3>
              <p className="text-[10px] text-warden-text-tertiary flex items-center gap-1 mt-0.5">
                <MapPin size={10} /> {(selected.details as any)?.city ?? ""}{(selected.details as any)?.country ? `, ${(selected.details as any).country}` : ""}
              </p>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="text-warden-text-tertiary hover:text-warden-text-primary text-xs"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-warden-text-tertiary">Type</span>
              <span className="text-warden-text-secondary capitalize">
                {selected.type}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-warden-text-tertiary">Status</span>
              <span
                className={`font-medium capitalize ${
                  selected.status === "disrupted"
                    ? "text-warden-coral"
                    : selected.status === "at_risk"
                    ? "text-warden-amber"
                    : "text-warden-teal"
                }`}
              >
                {selected.status ?? "normal"}
              </span>
            </div>
            {selected.health_score !== undefined && (
              <div className="flex justify-between text-xs">
                <span className="text-warden-text-tertiary">Health Score</span>
                <span className="font-data text-warden-text-primary font-medium">
                  {selected.health_score}/100
                </span>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
