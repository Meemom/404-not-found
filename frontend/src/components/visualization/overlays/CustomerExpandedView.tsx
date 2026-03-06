"use client";

export function CustomerExpandedView({ nodeId }: { nodeId: string }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg p-4 border border-emerald-200 bg-emerald-50">
          <p className="text-xs mb-1" style={{ color: "var(--w-ob-text-muted)" }}>Annual Revenue</p>
          <p className="text-2xl font-bold text-emerald-600">&euro;85M</p>
        </div>
        <div className="rounded-lg p-4 border" style={{ borderColor: "var(--w-ob-border)", background: "var(--w-ob-bg-tint)" }}>
          <p className="text-xs mb-1" style={{ color: "var(--w-ob-text-muted)" }}>SLA Requirement</p>
          <p className="text-2xl font-bold text-blue-600">14 days</p>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--w-ob-text)" }}>Active Orders</h3>
        <div className="space-y-2">
          <div className="rounded-lg p-3 border border-pink-200 bg-pink-50">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm" style={{ color: "var(--w-ob-text)" }}>#DE-8821</p>
              <span className="text-xs font-bold text-pink-600">SLA at risk</span>
            </div>
            <p className="text-xs" style={{ color: "var(--w-ob-text-muted)" }}>&euro;2.25M &mdash; Due Mar 10 &mdash; 6 days remaining</p>
          </div>
          <div className="rounded-lg p-3 border" style={{ borderColor: "var(--w-ob-border)", background: "var(--w-ob-bg-tint)" }}>
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm" style={{ color: "var(--w-ob-text)" }}>#DE-9301</p>
              <span className="text-xs font-bold text-green-600">On track</span>
            </div>
            <p className="text-xs" style={{ color: "var(--w-ob-text-muted)" }}>&euro;588K &mdash; Due Mar 28 &mdash; 24 days remaining</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg p-4 border" style={{ borderColor: "var(--w-ob-border)", background: "var(--w-ob-bg-tint)" }}>
        <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--w-ob-text)" }}>Relationship</h3>
        <p className="text-xs" style={{ color: "var(--w-ob-text-muted)" }}>Tier 1 customer since 2019. Penalty clause: &euro;180K per SLA breach.</p>
      </div>

      <p className="text-xs" style={{ color: "var(--w-ob-text-faint)" }}>Customer CRM data will populate when the integration is connected.</p>
    </div>
  );
}