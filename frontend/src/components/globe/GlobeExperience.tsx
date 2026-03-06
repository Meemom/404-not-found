"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, MapPin, Activity, Package, Shield } from "lucide-react";
import SupplyGlobe, {
  SupplierNode,
  ShipmentArc,
  RiskZone,
  Disruption,
} from "@/components/globe/SupplyGlobe";

type FilterType = "all" | "at_risk" | "shipments" | "risk_zones";

export default function GlobeExperience() {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierNode | null>(null);
  const [toasts, setToasts] = useState<{ id: string; message: string }[]>([]);

  const nodes: SupplierNode[] = [
    {
      id: "hq",
      name: "AutoParts GmbH HQ",
      lat: 50.1109,
      lng: 8.6821,
      tier: "hq",
      status: "healthy",
      health_score: 95,
    },
    {
      id: "tsmc",
      name: "TSMC",
      lat: 24.7881,
      lng: 120.9969,
      tier: "tier1",
      status: "disrupted",
      health_score: 42,
    },
    {
      id: "samsung",
      name: "Samsung SDI",
      lat: 37.5665,
      lng: 126.978,
      tier: "tier1",
      status: "at_risk",
      health_score: 78,
    },
    {
      id: "infineon_my",
      name: "Infineon Malaysia",
      lat: 3.139,
      lng: 101.6869,
      tier: "tier1",
      status: "healthy",
      health_score: 85,
    },
    {
      id: "continental",
      name: "Continental AG",
      lat: 52.3759,
      lng: 9.732,
      tier: "tier2",
      status: "healthy",
      health_score: 92,
    },
    {
      id: "valeo",
      name: "Valeo",
      lat: 48.8566,
      lng: 2.3522,
      tier: "tier2",
      status: "healthy",
      health_score: 88,
    },
  ];

  const arcs: ShipmentArc[] = [
    {
      id: "arc1",
      source_id: "tsmc",
      dest_id: "hq",
      status: "delayed",
      speed: 0.25,
    },
    {
      id: "arc2",
      source_id: "samsung",
      dest_id: "hq",
      status: "at_risk",
      speed: 0.15,
    },
    {
      id: "arc3",
      source_id: "infineon_my",
      dest_id: "hq",
      status: "on_track",
      speed: 0.1,
    },
    {
      id: "arc4",
      source_id: "continental",
      dest_id: "hq",
      status: "on_track",
      speed: 0.1,
    },
    {
      id: "arc5",
      source_id: "valeo",
      dest_id: "hq",
      status: "on_track",
      speed: 0.1,
    },
  ];

  const riskZones: RiskZone[] = [
    {
      id: "taiwan_strait",
      name: "Taiwan Strait Disruption",
      lat_min: 22,
      lat_max: 26,
      lng_min: 118,
      lng_max: 122,
    },
  ];

  const disruptions: Disruption[] = [
    {
      id: "disruption1",
      zone_id: "taiwan_strait",
      affected_suppliers: ["tsmc"],
    },
  ];

  const handleDisruptionDetected = (disruption: Disruption) => {
    const affectedCount = disruption.affected_suppliers.length;
    const zone = riskZones.find((z) => z.id === disruption.zone_id);
    const message = `⚠ Disruption detected affecting ${affectedCount} supplier${
      affectedCount > 1 ? "s" : ""
    } — ${zone?.name || "Unknown Region"}`;

    const toastId = `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { id: toastId, message }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toastId));
    }, 8000);
  };

  const filters: { value: FilterType; label: string }[] = [
    { value: "all", label: "All" },
    { value: "at_risk", label: "At Risk" },
    { value: "shipments", label: "Active Shipments" },
    { value: "risk_zones", label: "Risk Zones" },
  ];

  const supplierArcs = selectedSupplier
    ? arcs.filter(
        (arc) =>
          arc.source_id === selectedSupplier.id || arc.dest_id === selectedSupplier.id
      )
    : [];

  const supplierDisruptions = selectedSupplier
    ? disruptions.filter((d) =>
        d.affected_suppliers.includes(selectedSupplier.id)
      )
    : [];

  const tierLabel = (tier: string) =>
    tier === "hq" ? "Headquarters" : tier === "tier1" ? "Tier-1 Supplier" : "Tier-2 Supplier";

  const statusColor = (status: string) => {
    switch (status) {
      case "disrupted":
        return "bg-warden-pink/20 text-warden-pink border-warden-pink/40";
      case "at_risk":
        return "bg-warden-pink/10 text-warden-pink-light border-warden-pink-light/30";
      default:
        return "bg-warden-blue/15 text-warden-blue border-warden-blue/30";
    }
  };

  const healthColor = (score: number) => {
    if (score >= 80) return "bg-warden-blue";
    if (score >= 60) return "bg-warden-purple-light";
    return "bg-warden-pink";
  };

  const arcStatusLabel = (status: string) => {
    switch (status) {
      case "delayed": return "Delayed";
      case "at_risk": return "At Risk";
      default: return "On Track";
    }
  };

  const arcStatusColor = (status: string) => {
    switch (status) {
      case "delayed": return "text-warden-pink";
      case "at_risk": return "text-warden-purple-light";
      default: return "text-warden-blue";
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      <SupplyGlobe
        nodes={nodes}
        arcs={arcs}
        riskZones={riskZones}
        disruptions={disruptions}
        activeFilter={activeFilter}
        onSupplierSelect={setSelectedSupplier}
        onDisruptionDetected={handleDisruptionDetected}
      />

      <div className="absolute top-4 sm:top-8 left-1/2 -translate-x-1/2 flex flex-wrap justify-center gap-1.5 sm:gap-2 z-20 max-w-[90vw]">
        {filters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setActiveFilter(filter.value)}
            className={`px-4 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${
              activeFilter === filter.value
                ? "bg-warden-purple/20 text-warden-purple border border-warden-purple"
                : "bg-warden-bg-card/80 backdrop-blur-sm text-warden-text-secondary border border-warden-border hover:border-warden-border-accent"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="absolute bottom-4 left-4 sm:bottom-8 sm:left-8 rounded-xl border border-warden-border p-3 sm:p-4 w-48 sm:w-56 backdrop-blur-lg bg-warden-bg-card/85 z-20">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-warden-purple animate-pulse" />
          <span className="text-xs sm:text-sm font-medium text-warden-text-primary">
            Live Monitoring
          </span>
        </div>

        <div className="space-y-1.5 sm:space-y-2 text-[10px] sm:text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#3B82F6] shrink-0" />
            <span className="text-warden-text-secondary">Company HQ</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#14b8a6] shrink-0" />
            <span className="text-warden-text-secondary">Tier-1 Supplier</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#A78BFA] shrink-0" />
            <span className="text-warden-text-secondary">Tier-2 Supplier</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#EC4899] shrink-0" />
            <span className="text-warden-text-secondary">Disrupted / At Risk</span>
          </div>

          <div className="pt-2 mt-2 border-t border-warden-border space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-6 sm:w-8 h-0.5 bg-[#818CF8] shrink-0" />
              <span className="text-warden-text-secondary">On Track</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 sm:w-8 h-0.5 bg-[#D946EF] shrink-0" />
              <span className="text-warden-text-secondary">At Risk</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 sm:w-8 h-0.5 bg-[#EC4899] shrink-0" />
              <span className="text-warden-text-secondary">Delayed</span>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedSupplier && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute top-0 right-0 h-full w-full sm:w-80 md:w-96 border-l border-warden-border-accent bg-warden-bg-card/95 backdrop-blur-xl overflow-y-auto z-20"
          >
            <div className="sticky top-0 bg-warden-bg-card/95 backdrop-blur-xl border-b border-warden-border p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold text-warden-text-primary truncate">
                    {selectedSupplier.name}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1 text-warden-text-secondary">
                    <MapPin size={12} className="shrink-0" />
                    <span className="text-xs">
                      {selectedSupplier.lat.toFixed(2)}°, {selectedSupplier.lng.toFixed(2)}°
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSupplier(null)}
                  className="p-1.5 rounded-lg text-warden-text-tertiary hover:text-warden-text-primary hover:bg-warden-bg-elevated transition-all shrink-0"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-3">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusColor(
                    selectedSupplier.status
                  )}`}
                >
                  {(selectedSupplier.status === "disrupted" || selectedSupplier.status === "at_risk") && (
                    <AlertTriangle size={11} />
                  )}
                  {selectedSupplier.status.replace("_", " ").toUpperCase()}
                </span>
              </div>
            </div>

            <div className="p-4 sm:p-5 space-y-5">
              <div>
                <span className="text-[10px] text-warden-text-tertiary uppercase tracking-widest font-medium">
                  Classification
                </span>
                <div className="flex items-center gap-2 mt-1.5">
                  <Shield size={14} className="text-warden-purple" />
                  <p className="text-sm text-warden-text-primary font-medium">
                    {tierLabel(selectedSupplier.tier)}
                  </p>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-warden-text-tertiary uppercase tracking-widest font-medium">
                  Health Score
                </span>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex-1 h-2.5 bg-warden-bg-elevated rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${selectedSupplier.health_score}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className={`h-full rounded-full ${healthColor(selectedSupplier.health_score)}`}
                    />
                  </div>
                  <span className="text-sm font-mono text-warden-text-primary w-8 text-right">
                    {selectedSupplier.health_score}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-warden-text-tertiary uppercase tracking-widest font-medium">
                  Shipments
                </span>
                {supplierArcs.length === 0 ? (
                  <p className="text-xs text-warden-text-tertiary mt-2">No active shipments</p>
                ) : (
                  <div className="mt-2 space-y-2">
                    {supplierArcs.map((arc) => {
                      const from = nodes.find((n) => n.id === arc.source_id);
                      const to = nodes.find((n) => n.id === arc.dest_id);
                      return (
                        <div
                          key={arc.id}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-warden-bg-elevated/60 border border-warden-border"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Package size={13} className="text-warden-purple-light shrink-0" />
                            <span className="text-xs text-warden-text-primary truncate">
                              {from?.name ?? arc.source_id} → {to?.name ?? arc.dest_id}
                            </span>
                          </div>
                          <span className={`text-[10px] font-medium shrink-0 ml-2 ${arcStatusColor(arc.status)}`}>
                            {arcStatusLabel(arc.status)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {supplierDisruptions.length > 0 && (
                <div className="p-3 bg-warden-pink/10 border border-warden-pink/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={15} className="text-warden-pink mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-warden-pink">Active Disruption</p>
                      {supplierDisruptions.map((d) => {
                        const zone = riskZones.find((z) => z.id === d.zone_id);
                        return (
                          <p key={d.id} className="text-xs text-warden-text-secondary mt-1">
                            {zone?.name || "Unknown region"} — affecting {d.affected_suppliers.length} supplier
                            {d.affected_suppliers.length > 1 ? "s" : ""}
                          </p>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-lg bg-warden-bg-elevated/60 border border-warden-border">
                  <Activity size={13} className="text-warden-purple-light mb-1" />
                  <p className="text-lg font-mono font-semibold text-warden-text-primary">
                    {supplierArcs.length}
                  </p>
                  <p className="text-[10px] text-warden-text-tertiary">Active Routes</p>
                </div>
                <div className="p-3 rounded-lg bg-warden-bg-elevated/60 border border-warden-border">
                  <AlertTriangle size={13} className="text-warden-pink-light mb-1" />
                  <p className="text-lg font-mono font-semibold text-warden-text-primary">
                    {supplierArcs.filter((a) => a.status !== "on_track").length}
                  </p>
                  <p className="text-[10px] text-warden-text-tertiary">Issues</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute top-4 right-4 sm:top-8 sm:right-8 space-y-2 pointer-events-none z-30 max-w-[85vw] sm:max-w-sm">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className="rounded-xl p-3 sm:p-4 border border-warden-pink/40 bg-warden-bg-elevated/95 backdrop-blur"
            >
              <p className="text-xs sm:text-sm text-warden-text-primary">{toast.message}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}