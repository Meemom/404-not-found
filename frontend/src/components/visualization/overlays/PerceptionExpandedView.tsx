"use client";

interface PerceptionExpandedViewProps {
  nodeId: string;
}

export function PerceptionExpandedView({
  nodeId,
}: PerceptionExpandedViewProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
          <p className="text-xs text-slate-400 mb-1">Supply Health</p>
          <p className="text-2xl font-bold text-green-400">87%</p>
        </div>
        <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
          <p className="text-xs text-slate-400 mb-1">Active Signals</p>
          <p className="text-2xl font-bold text-blue-400">12</p>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-white mb-3">
          Monitored Disruptions
        </h3>
        <div className="space-y-2">
          <div className="bg-slate-700/20 rounded p-3 border border-slate-600">
            <p className="text-sm text-slate-200">Taiwan Strait Shipping</p>
            <p className="text-xs text-slate-400 mt-1">14-21 day delays detected</p>
          </div>
          <div className="bg-slate-700/20 rounded p-3 border border-slate-600">
            <p className="text-sm text-slate-200">Semiconductor Volatility</p>
            <p className="text-xs text-slate-400 mt-1">Pricing fluctuations ±12%</p>
          </div>
        </div>
      </div>

      <div className="text-xs text-slate-400">
        <p>
          Real data integration coming when perception agent API is ready.
        </p>
      </div>
    </div>
  );
}
