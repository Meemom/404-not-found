"use client";

interface SupplierExpandedViewProps {
  nodeId: string;
}

export function SupplierExpandedView({
  nodeId,
}: SupplierExpandedViewProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-700/30 rounded-lg p-4 border border-orange-500/30">
          <p className="text-xs text-slate-400 mb-1">Total Suppliers</p>
          <p className="text-2xl font-bold text-orange-400">24</p>
        </div>
        <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
          <p className="text-xs text-slate-400 mb-1">At-Risk</p>
          <p className="text-2xl font-bold text-red-400">3</p>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-white mb-3">
          Supplier Health Dashboard
        </h3>
        <div className="space-y-2">
          <div className="bg-orange-900/20 rounded p-3 border border-orange-600/30">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-orange-300">Infineon</p>
              <span className="text-xs px-2 py-1 rounded bg-orange-600/30 text-orange-300">
                At Risk
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Dresden facility: Backup supply active
            </p>
          </div>
          <div className="bg-green-900/20 rounded p-3 border border-green-600/30">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-green-300">BMW</p>
              <span className="text-xs px-2 py-1 rounded bg-green-600/30 text-green-300">
                Healthy
              </span>
            </div>
            <p className="text-xs text-slate-400">
              On-time delivery: 99.2%
            </p>
          </div>
          <div className="bg-green-900/20 rounded p-3 border border-green-600/30">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-green-300">TSMC</p>
              <span className="text-xs px-2 py-1 rounded bg-green-600/30 text-green-300">
                Healthy
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Taiwan Strait impact: Monitoring closely
            </p>
          </div>
        </div>
      </div>

      <div className="text-xs text-slate-400">
        <p>
          Live supplier status monitoring and relationship metrics coming when
          supplier API is ready.
        </p>
      </div>
    </div>
  );
}
