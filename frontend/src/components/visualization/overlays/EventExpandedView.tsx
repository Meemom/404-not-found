"use client";

export function EventExpandedView({ nodeId }: { nodeId: string }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg p-4 border border-red-200 bg-red-50">
          <p className="text-xs mb-1" style={{ color: "var(--w-ob-text-muted)" }}>Severity</p>
          <p className="text-2xl font-bold text-red-600">8/10</p>
        </div>
        <div className="rounded-lg p-4 border" style={{ borderColor: "var(--w-ob-border)", background: "var(--w-ob-bg-tint)" }}>
          <p className="text-xs mb-1" style={{ color: "var(--w-ob-text-muted)" }}>Confidence</p>
          <p className="text-2xl font-bold text-blue-600">85%</p>
        </div>
        <div className="rounded-lg p-4 border" style={{ borderColor: "var(--w-ob-border)", background: "var(--w-ob-bg-tint)" }}>
          <p className="text-xs mb-1" style={{ color: "var(--w-ob-text-muted)" }}>Expected Delay</p>
          <p className="text-2xl font-bold text-orange-500">+14d</p>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--w-ob-text)" }}>Affected Suppliers</h3>
        <div className="space-y-2">
          <div className="rounded-lg p-3 border border-red-200 bg-red-50">
            <div className="flex items-center justify-between">
              <p className="text-sm" style={{ color: "var(--w-ob-text)" }}>TSMC (Taiwan)</p>
              <span className="text-xs font-bold text-red-600">Direct</span>
            </div>
            <p className="text-xs mt-1" style={{ color: "var(--w-ob-text-muted)" }}>Primary semiconductor supplier &mdash; shipments halted</p>
          </div>
          <div className="rounded-lg p-3 border border-orange-200 bg-orange-50">
            <div className="flex items-center justify-between">
              <p className="text-sm" style={{ color: "var(--w-ob-text)" }}>Infineon (Malaysia)</p>
              <span className="text-xs font-bold text-orange-500">Indirect</span>
            </div>
            <p className="text-xs mt-1" style={{ color: "var(--w-ob-text-muted)" }}>Some shared shipping routes affected</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg p-4 border" style={{ borderColor: "var(--w-ob-border)", background: "var(--w-ob-bg-tint)" }}>
        <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--w-ob-text)" }}>Timeline</h3>
        <p className="text-xs" style={{ color: "var(--w-ob-text-muted)" }}>Started: March 1, 2026</p>
        <p className="text-xs" style={{ color: "var(--w-ob-text-muted)" }}>Expected resolution: 14-21 days</p>
      </div>

      <p className="text-xs" style={{ color: "var(--w-ob-text-faint)" }}>Real-time event data will populate when the perception agent API is connected.</p>
    </div>
  );
}