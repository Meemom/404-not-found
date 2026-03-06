"use client";

import { AlertTriangle, ShieldCheck, Clock3 } from "lucide-react";
import { useWardenStore } from "@/lib/store";
import { useShallow } from "zustand/react/shallow";

export function EventExpandedView({ nodeId }: { nodeId: string }) {
  const { selectedEvent } = useWardenStore(
    useShallow((s) => ({
      selectedEvent: s.selectedEvent,
    }))
  );

  const event = selectedEvent?.id === nodeId ? selectedEvent : null;

  if (!event) {
    return (
      <div className="space-y-3">
        <p className="text-sm" style={{ color: "var(--w-ob-text-faint)" }}>
          Select an event to see its core metrics.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg p-3 border border-pink-200 bg-pink-50">
          <div className="flex items-center gap-1.5 mb-1">
            <AlertTriangle size={14} className="text-pink-600" />
            <p className="text-[10px] uppercase tracking-wide" style={{ color: "var(--w-ob-text-muted)" }}>
              Severity
            </p>
          </div>
          <p className="text-xl font-bold text-pink-600">{event.data.severity}/10</p>
        </div>

        <div className="rounded-lg p-3 border" style={{ borderColor: "var(--w-ob-border)", background: "var(--w-ob-bg-tint)" }}>
          <div className="flex items-center gap-1.5 mb-1">
            <ShieldCheck size={14} className="text-blue-600" />
            <p className="text-[10px] uppercase tracking-wide" style={{ color: "var(--w-ob-text-muted)" }}>
              Confidence
            </p>
          </div>
          <p className="text-xl font-bold text-blue-600">{event.data.confidence}%</p>
        </div>

        <div className="rounded-lg p-3 border" style={{ borderColor: "var(--w-ob-border)", background: "var(--w-ob-bg-tint)" }}>
          <div className="flex items-center gap-1.5 mb-1">
            <Clock3 size={14} className="text-amber-500" />
            <p className="text-[10px] uppercase tracking-wide" style={{ color: "var(--w-ob-text-muted)" }}>
              Expected Delay
            </p>
          </div>
          <p className="text-xl font-bold text-amber-500">{event.data.delay}</p>
        </div>
      </div>

      <div className="rounded-lg border p-3" style={{ borderColor: "var(--w-ob-border)", background: "var(--w-ob-surface)" }}>
        <p className="text-xs uppercase tracking-wide mb-2" style={{ color: "var(--w-ob-text-faint)" }}>
          Event Type
        </p>
        <p className="text-sm font-semibold" style={{ color: "var(--w-ob-text)" }}>
          {event.data.eventType}
        </p>
      </div>

      <div className="rounded-lg border p-3" style={{ borderColor: "var(--w-ob-border)", background: "var(--w-ob-surface)" }}>
        <p className="text-xs uppercase tracking-wide mb-2" style={{ color: "var(--w-ob-text-faint)" }}>
          Affected Regions
        </p>
        <div className="flex flex-wrap gap-1.5">
          {event.data.affectedRegions.length === 0 && (
            <span className="text-xs" style={{ color: "var(--w-ob-text-faint)" }}>
              No regions listed
            </span>
          )}
          {event.data.affectedRegions.map((region) => (
            <span key={region} className="rounded-full px-2 py-0.5 text-xs bg-slate-100 text-slate-600">
              {region}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
