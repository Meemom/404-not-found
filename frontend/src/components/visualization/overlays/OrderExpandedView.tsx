"use client";

interface OrderExpandedViewProps {
  nodeId: string;
}

export function OrderExpandedView({ nodeId }: OrderExpandedViewProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-700/30 rounded-lg p-4 border border-indigo-500/30">
          <p className="text-xs text-slate-400 mb-1">Active Orders</p>
          <p className="text-2xl font-bold text-indigo-400">12</p>
        </div>
        <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
          <p className="text-xs text-slate-400 mb-1">At Risk</p>
          <p className="text-2xl font-bold text-red-400">2</p>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-white mb-3">
          Critical Orders
        </h3>
        <div className="space-y-2">
          <div className="bg-red-900/20 rounded p-3 border border-red-600/30">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-red-300">ORD-DE-8821</p>
              <span className="text-xs px-2 py-1 rounded bg-red-600/30 text-red-300">
                HIGH RISK
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-2">
              BMW | Engine Control Unit v4.2 | €420K
            </p>
            <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
              <span>Completion: 62%</span>
              <span>Due in 8 days</span>
            </div>
            <div className="h-1.5 bg-slate-700 rounded overflow-hidden">
              <div className="h-full bg-red-500 w-3/5" />
            </div>
          </div>
          <div className="bg-orange-900/20 rounded p-3 border border-orange-600/30">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-orange-300">ORD-VW-4404</p>
              <span className="text-xs px-2 py-1 rounded bg-orange-600/30 text-orange-300">
                MEDIUM RISK
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-2">
              VW | Display Module | €180K
            </p>
            <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
              <span>Completion: 45%</span>
              <span>Due in 12 days</span>
            </div>
            <div className="h-1.5 bg-slate-700 rounded overflow-hidden">
              <div className="h-full bg-orange-500 w-2/5" />
            </div>
          </div>
        </div>
      </div>

      <div className="text-xs text-slate-400">
        <p>
          Detailed order tracking, shipping status, and delivery timeline
          updates coming when order API is ready.
        </p>
      </div>
    </div>
  );
}
