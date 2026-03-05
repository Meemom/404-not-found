"use client";

interface GraphExpandedViewProps {
  nodeId: string;
}

export function GraphExpandedView({ nodeId }: GraphExpandedViewProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-700/30 rounded-lg p-4 border border-cyan-500/30">
          <p className="text-xs text-slate-400 mb-1">Network Nodes</p>
          <p className="text-2xl font-bold text-cyan-400">52</p>
        </div>
        <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
          <p className="text-xs text-slate-400 mb-1">Connections</p>
          <p className="text-2xl font-bold text-cyan-300">184</p>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-white mb-3">
          Supply Chain Relations
        </h3>
        <div className="space-y-2">
          <div className="bg-cyan-900/20 rounded p-3 border border-cyan-600/30">
            <p className="text-sm font-semibold text-cyan-300 mb-1">
              Supplier Diversity
            </p>
            <p className="text-xs text-slate-400">
              24 suppliers across 8 countries
            </p>
          </div>
          <div className="bg-cyan-900/20 rounded p-3 border border-cyan-600/30">
            <p className="text-sm font-semibold text-cyan-300 mb-1">
              Single-Source Risk
            </p>
            <p className="text-xs text-slate-400">
              4 critical components from single suppliers
            </p>
          </div>
          <div className="bg-cyan-900/20 rounded p-3 border border-cyan-600/30">
            <p className="text-sm font-semibold text-cyan-300 mb-1">
              Network Density
            </p>
            <p className="text-xs text-slate-400">
              91% of supply chain mapped and monitored
            </p>
          </div>
        </div>
      </div>

      <div className="text-xs text-slate-400">
        <p>
          Interactive supply chain graph visualization coming when graph APIs
          are ready.
        </p>
      </div>
    </div>
  );
}
