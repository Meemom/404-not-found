"use client";

export function OrderExpandedView({ nodeId }: { nodeId: string }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg p-4 border border-pink-200 bg-pink-50">
          <p className="text-xs mb-1" style={{ color: "var(--w-ob-text-muted)" }}>Revenue</p>
          <p className="text-2xl font-bold text-violet-600">&euro;2.25M</p>
        </div>
        <div className="rounded-lg p-4 border" style={{ borderColor: "var(--w-ob-border)", background: "var(--w-ob-bg-tint)" }}>
          <p className="text-xs mb-1" style={{ color: "var(--w-ob-text-muted)" }}>Margin</p>
          <p className="text-2xl font-bold text-blue-600">18%</p>
        </div>
        <div className="rounded-lg p-4 border border-pink-200 bg-pink-50">
          <p className="text-xs mb-1" style={{ color: "var(--w-ob-text-muted)" }}>SLA Breach Risk</p>
          <p className="text-2xl font-bold text-pink-600">73%</p>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--w-ob-text)" }}>Required Parts</h3>
        <div className="space-y-2">
          <div className="rounded-lg p-3 border border-pink-200 bg-pink-50">
            <div className="flex items-center justify-between">
              <p className="text-sm font-mono" style={{ color: "var(--w-ob-text)" }}>MCU-32BIT-AUTO</p>
              <span className="text-xs font-bold text-pink-600">Shortage</span>
            </div>
            <p className="text-xs mt-1" style={{ color: "var(--w-ob-text-muted)" }}>12,000 units needed &mdash; 8 days of stock remaining</p>
          </div>
          <div className="rounded-lg p-3 border" style={{ borderColor: "var(--w-ob-border)", background: "var(--w-ob-bg-tint)" }}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-mono" style={{ color: "var(--w-ob-text)" }}>CAN-CONTROLLER</p>
              <span className="text-xs font-bold text-green-600">OK</span>
            </div>
            <p className="text-xs mt-1" style={{ color: "var(--w-ob-text-muted)" }}>Sufficient stock &mdash; no supply issues</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg p-4 border" style={{ borderColor: "var(--w-ob-border)", background: "var(--w-ob-bg-tint)" }}>
        <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--w-ob-text)" }}>Delivery Timeline</h3>
        <div className="flex items-center justify-between text-xs" style={{ color: "var(--w-ob-text-muted)" }}>
          <span>Order date: Feb 24, 2026</span>
          <span>Due: Mar 10, 2026</span>
        </div>
        <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-violet-500 to-pink-500 w-[45%] rounded-full" />
        </div>
        <p className="text-xs mt-1" style={{ color: "var(--w-ob-text-faint)" }}>45% complete &mdash; 6 days remaining</p>
      </div>

      <p className="text-xs" style={{ color: "var(--w-ob-text-faint)" }}>Real-time order tracking will populate when the ERP integration is connected.</p>
    </div>
  );
}