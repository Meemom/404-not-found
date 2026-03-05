"use client";

interface RiskExpandedViewProps {
  nodeId: string;
}

export function RiskExpandedView({ nodeId }: RiskExpandedViewProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-700/30 rounded-lg p-4 border border-red-500/30">
          <p className="text-xs text-slate-400 mb-1">Overall Risk Score</p>
          <p className="text-2xl font-bold text-red-400">6.4/10</p>
        </div>
        <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
          <p className="text-xs text-slate-400 mb-1">Risk Level</p>
          <p className="text-2xl font-bold text-orange-400">HIGH</p>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-white mb-3">
          Critical Risk Factors
        </h3>
        <div className="space-y-2">
          <div className="bg-red-900/20 rounded p-3 border border-red-600/30">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm text-slate-200">Revenue at Risk</p>
              <p className="text-sm font-bold text-red-400">€4.2M</p>
            </div>
            <p className="text-xs text-slate-400">From 2 orders</p>
          </div>
          <div className="bg-orange-900/20 rounded p-3 border border-orange-600/30">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm text-slate-200">SLA Breach Risk</p>
              <p className="text-sm font-bold text-orange-400">65%</p>
            </div>
            <p className="text-xs text-slate-400">In next 7 days</p>
          </div>
        </div>
      </div>

      <div className="text-xs text-slate-400">
        <p>
          Detailed risk metrics and mitigation recommendations coming when risk
          engine API is ready.
        </p>
      </div>
    </div>
  );
}
