"use client";

export function SupplierExpandedView({ nodeId }: { nodeId: string }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg p-4 border border-red-200 bg-red-50">
          <p className="text-xs mb-1" style={{ color: "var(--w-ob-text-muted)" }}>Health Score</p>
          <p className="text-2xl font-bold text-red-600">35%</p>
        </div>
        <div className="rounded-lg p-4 border border-red-200 bg-red-50">
          <p className="text-xs mb-1" style={{ color: "var(--w-ob-text-muted)" }}>Criticality</p>
          <p className="text-2xl font-bold text-red-600">Critical</p>
        </div>
        <div className="rounded-lg p-4 border" style={{ borderColor: "var(--w-ob-border)", background: "var(--w-ob-bg-tint)" }}>
          <p className="text-xs mb-1" style={{ color: "var(--w-ob-text-muted)" }}>Annual Spend</p>
          <p className="text-2xl font-bold text-blue-600">&euro;48M</p>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--w-ob-text)" }}>Parts Supplied</h3>
        <div className="space-y-2">
          <div className="rounded-lg p-3 border border-red-200 bg-red-50">
            <div className="flex items-center justify-between">
              <p className="text-sm font-mono" style={{ color: "var(--w-ob-text)" }}>MCU-32BIT-AUTO</p>
              <span className="text-xs font-bold text-red-600">8d stock</span>
            </div>
            <p className="text-xs mt-1" style={{ color: "var(--w-ob-text-muted)" }}>70% single-sourced &mdash; critical shortage risk</p>
          </div>
          <div className="rounded-lg p-3 border border-orange-200 bg-orange-50">
            <div className="flex items-center justify-between">
              <p className="text-sm font-mono" style={{ color: "var(--w-ob-text)" }}>POWER-MGMT-IC</p>
              <span className="text-xs font-bold text-orange-500">18d stock</span>
            </div>
            <p className="text-xs mt-1" style={{ color: "var(--w-ob-text-muted)" }}>60% sourced here &mdash; STMicro as backup</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--w-ob-text)" }}>Alternative Suppliers</h3>
        <div className="rounded-lg p-3 border border-yellow-200 bg-yellow-50">
          <div className="flex items-center justify-between">
            <p className="text-sm" style={{ color: "var(--w-ob-text)" }}>Infineon (Dresden)</p>
            <span className="text-xs font-bold text-green-600">Available</span>
          </div>
          <p className="text-xs mt-1" style={{ color: "var(--w-ob-text-muted)" }}>Can supply 16K MCU units &mdash; 5 day lead time</p>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--w-ob-text)" }}>Active Disruptions</h3>
        <div className="rounded-lg p-3 border border-red-200 bg-red-50">
          <p className="text-sm" style={{ color: "var(--w-ob-text)" }}>Taiwan Strait Shipping Congestion</p>
          <p className="text-xs mt-1" style={{ color: "var(--w-ob-text-muted)" }}>Severity 8/10 &mdash; 14-21 day delays on outbound shipments</p>
        </div>
      </div>

      <p className="text-xs" style={{ color: "var(--w-ob-text-faint)" }}>Live supplier monitoring will populate when the supplier API is connected.</p>
    </div>
  );
}