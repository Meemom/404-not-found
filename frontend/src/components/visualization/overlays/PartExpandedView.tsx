"use client";

export function PartExpandedView({ nodeId }: { nodeId: string }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg p-4 border border-pink-200 bg-pink-50">
          <p className="text-xs mb-1" style={{ color: "var(--w-ob-text-muted)" }}>Inventory</p>
          <p className="text-2xl font-bold text-pink-600">8 days</p>
        </div>
        <div className="rounded-lg p-4 border" style={{ borderColor: "var(--w-ob-border)", background: "var(--w-ob-bg-tint)" }}>
          <p className="text-xs mb-1" style={{ color: "var(--w-ob-text-muted)" }}>Lead Time</p>
          <p className="text-2xl font-bold text-blue-600">21 days</p>
        </div>
        <div className="rounded-lg p-4 border" style={{ borderColor: "var(--w-ob-border)", background: "var(--w-ob-bg-tint)" }}>
          <p className="text-xs mb-1" style={{ color: "var(--w-ob-text-muted)" }}>Safety Stock</p>
          <p className="text-2xl font-bold text-teal-600">14 days</p>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--w-ob-text)" }}>Supply Sources</h3>
        <div className="space-y-2">
          <div className="rounded-lg p-3 border border-pink-200 bg-pink-50">
            <div className="flex items-center justify-between">
              <p className="text-sm" style={{ color: "var(--w-ob-text)" }}>TSMC &mdash; Primary</p>
              <span className="text-xs font-bold text-pink-600">Disrupted</span>
            </div>
            <p className="text-xs mt-1" style={{ color: "var(--w-ob-text-muted)" }}>70% of supply &mdash; currently delayed 14-21 days</p>
          </div>
          <div className="rounded-lg p-3 border" style={{ borderColor: "var(--w-ob-border)", background: "var(--w-ob-bg-tint)" }}>
            <div className="flex items-center justify-between">
              <p className="text-sm" style={{ color: "var(--w-ob-text)" }}>Infineon Dresden &mdash; Backup</p>
              <span className="text-xs font-bold text-green-600">Available</span>
            </div>
            <p className="text-xs mt-1" style={{ color: "var(--w-ob-text-muted)" }}>30% capacity &mdash; 5 day lead time</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--w-ob-text)" }}>Dependent Orders</h3>
        <div className="space-y-2">
          <div className="rounded-lg p-3 border" style={{ borderColor: "var(--w-ob-border)", background: "var(--w-ob-bg-tint)" }}>
            <div className="flex items-center justify-between">
              <p className="text-sm" style={{ color: "var(--w-ob-text)" }}>BMW #DE-8821</p>
              <span className="text-xs font-bold text-pink-600">At Risk</span>
            </div>
          </div>
          <div className="rounded-lg p-3 border" style={{ borderColor: "var(--w-ob-border)", background: "var(--w-ob-bg-tint)" }}>
            <div className="flex items-center justify-between">
              <p className="text-sm" style={{ color: "var(--w-ob-text)" }}>VW #DE-9103</p>
              <span className="text-xs font-bold text-orange-500">At Risk</span>
            </div>
          </div>
        </div>
      </div>

      <p className="text-xs" style={{ color: "var(--w-ob-text-faint)" }}>Live inventory data will populate when the ERP integration is connected.</p>
    </div>
  );
}
