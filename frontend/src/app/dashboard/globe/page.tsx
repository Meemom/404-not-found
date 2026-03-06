"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle } from "lucide-react";
import { useWardenStore } from "@/lib/store";
import SupplyGlobe, {
  SupplierNode,
  ShipmentArc,
  RiskZone,
  Disruption,
} from "@/components/globe/SupplyGlobe";

type FilterType = "all" | "at_risk" | "shipments" | "risk_zones";

export default function GlobePage() {
  const { company } = useWardenStore();
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierNode | null>(null);
  const [toasts, setToasts] = useState<{ id: string; message: string }[]>([]);

  // Demo data matching the spec
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

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Globe */}
      <SupplyGlobe
        nodes={nodes}
        arcs={arcs}
        riskZones={riskZones}
        disruptions={disruptions}
        activeFilter={activeFilter}
        onSupplierSelect={setSelectedSupplier}
        onDisruptionDetected={handleDisruptionDetected}
      />

      {/* Filter Controls */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {filters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setActiveFilter(filter.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeFilter === filter.value
                ? "bg-warden-amber/20 text-warden-amber border border-warden-amber"
                : "bg-warden-bg-card/80 backdrop-blur-sm text-warden-text-secondary border border-warden-border-default hover:border-warden-border-accent"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Legend Panel */}
      <div className="absolute bottom-8 left-8 card-warden p-4 w-64 backdrop-blur-lg bg-warden-bg-card/80 z-20">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-warden-teal animate-pulse" />
          <span className="text-sm font-medium text-warden-text-primary">
            Live Monitoring
          </span>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#0D9488]" />
            <span className="text-warden-text-secondary">Company HQ</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#F59E0B]" />
            <span className="text-warden-text-secondary">Tier-1 Supplier</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#3B82F6]" />
            <span className="text-warden-text-secondary">Tier-2 Supplier</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#EF4444]" />
            <span className="text-warden-text-secondary">Disrupted</span>
          </div>

          <div className="pt-2 mt-2 border-t border-warden-border-default space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-[#0D9488]" />
              <span className="text-warden-text-secondary">On Track</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-[#F59E0B]" />
              <span className="text-warden-text-secondary">At Risk</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-[#EF4444]" />
              <span className="text-warden-text-secondary">Delayed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Supplier Detail Panel */}
      <AnimatePresence>
        {selectedSupplier && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute top-0 right-0 h-full w-96 card-warden border-l border-warden-border-accent p-6 overflow-y-auto z-20"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-warden-text-primary">
                  {selectedSupplier.name}
                </h3>
                <p className="text-sm text-warden-text-secondary mt-1">
                  {selectedSupplier.lat.toFixed(4)}°, {selectedSupplier.lng.toFixed(4)}°
                </p>
              </div>
              <button
                onClick={() => setSelectedSupplier(null)}
                className="text-warden-text-tertiary hover:text-warden-text-primary transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-xs text-warden-text-tertiary uppercase tracking-wide">
                  Tier
                </span>
                <p className="text-sm text-warden-text-primary mt-1 font-medium">
                  {selectedSupplier.tier === "hq"
                    ? "Headquarters"
                    : selectedSupplier.tier === "tier1"
                    ? "Tier-1 Supplier"
                    : "Tier-2 Supplier"}
                </p>
              </div>

              <div>
                <span className="text-xs text-warden-text-tertiary uppercase tracking-wide">
                  Health Score
                </span>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex-1 h-2 bg-warden-bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        selectedSupplier.health_score >= 80
                          ? "bg-warden-teal"
                          : selectedSupplier.health_score >= 60
                          ? "bg-warden-amber"
                          : "bg-warden-coral"
                      }`}
                      style={{ width: `${selectedSupplier.health_score}%` }}
                    />
                  </div>
                  <span className="text-sm font-mono text-warden-text-primary">
                    {selectedSupplier.health_score}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-xs text-warden-text-tertiary uppercase tracking-wide">
                  Status
                </span>
                <div className="mt-2">
                  <span
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                      selectedSupplier.status === "disrupted"
                        ? "bg-warden-coral/20 text-warden-coral"
                        : selectedSupplier.status === "at_risk"
                        ? "bg-warden-amber/20 text-warden-amber"
                        : "bg-warden-teal/20 text-warden-teal"
                    }`}
                  >
                    {selectedSupplier.status === "disrupted" && <AlertTriangle size={12} />}
                    {selectedSupplier.status.replace("_", " ").toUpperCase()}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-xs text-warden-text-tertiary uppercase tracking-wide">
                  Active Shipments
                </span>
                <p className="text-sm text-warden-text-primary mt-1">
                  {arcs.filter((arc) => arc.source_id === selectedSupplier.id).length} outbound
                </p>
              </div>

              {selectedSupplier.status === "disrupted" && (
                <div className="mt-4 p-3 bg-warden-coral/10 border border-warden-coral/30 rounded">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={16} className="text-warden-coral mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-warden-coral">Active Disruption</p>
                      <p className="text-xs text-warden-text-secondary mt-1">
                        Taiwan Strait shipping congestion affecting deliveries
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notifications */}
      <div className="absolute top-8 right-8 space-y-2 pointer-events-none z-30">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className="card-warden p-4 border border-warden-amber bg-warden-bg-elevated/95 backdrop-blur max-w-sm"
            >
              <p className="text-sm text-warden-text-primary">{toast.message}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
