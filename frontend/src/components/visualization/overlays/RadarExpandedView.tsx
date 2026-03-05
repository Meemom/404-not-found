"use client";

interface RadarExpandedViewProps {
  nodeId: string;
}

export function RadarExpandedView({ nodeId }: RadarExpandedViewProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-700/30 rounded-lg p-4 border border-pink-500/30">
          <p className="text-xs text-slate-400 mb-1">Threats Detected</p>
          <p className="text-2xl font-bold text-pink-400">3</p>
        </div>
        <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
          <p className="text-xs text-slate-400 mb-1">Alert Severity</p>
          <p className="text-2xl font-bold text-red-400">HIGH</p>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-white mb-3">
          Active Disruptions
        </h3>
        <div className="space-y-2">
          <div className="bg-pink-900/20 rounded p-3 border border-pink-600/30">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-semibold text-pink-300">
                Taiwan Strait Congestion
              </p>
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            </div>
            <p className="text-xs text-slate-400">14-21 day shipping delays</p>
          </div>
          <div className="bg-pink-900/20 rounded p-3 border border-pink-600/30">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-semibold text-pink-300">
                Semiconductor Supply
              </p>
              <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            </div>
            <p className="text-xs text-slate-400">Price volatility ±12%</p>
          </div>
          <div className="bg-pink-900/20 rounded p-3 border border-pink-600/30">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-semibold text-pink-300">
                Supplier Capacity
              </p>
              <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
            </div>
            <p className="text-xs text-slate-400">Infineon Dresden at 85% capacity</p>
          </div>
        </div>
      </div>

      <div className="text-xs text-slate-400">
        <p>
          Real-time threat radar and early warning system coming when threat
          detection APIs are ready.
        </p>
      </div>
    </div>
  );
}
