"use client";

interface StockExpandedViewProps {
  nodeId: string;
}

export function StockExpandedView({ nodeId }: StockExpandedViewProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-700/30 rounded-lg p-4 border border-amber-500/30">
          <p className="text-xs text-slate-400 mb-1">Critical Items</p>
          <p className="text-2xl font-bold text-amber-400">3</p>
        </div>
        <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
          <p className="text-xs text-slate-400 mb-1">Inventory Value</p>
          <p className="text-2xl font-bold text-amber-300">€2.1M</p>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-white mb-3">
          Low-Stock Components
        </h3>
        <div className="space-y-2">
          <div className="bg-amber-900/20 rounded p-3 border border-amber-600/30">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-amber-300">
                MCU-32BIT-AUTO
              </p>
              <span className="text-xs text-red-400 font-bold">CRITICAL</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-300 mb-2">
              <span>12 days of supply</span>
              <span>Reorder: 15 days</span>
            </div>
            <div className="h-1.5 bg-slate-700 rounded overflow-hidden">
              <div className="h-full bg-red-500 w-1/3" />
            </div>
          </div>
          <div className="bg-amber-900/20 rounded p-3 border border-amber-600/30">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-amber-300">
                EFLASH-512K-W
              </p>
              <span className="text-xs text-orange-400 font-bold">WARNING</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-300 mb-2">
              <span>8 days of supply</span>
              <span>Reorder: 10 days</span>
            </div>
            <div className="h-1.5 bg-slate-700 rounded overflow-hidden">
              <div className="h-full bg-orange-500 w-1/4" />
            </div>
          </div>
        </div>
      </div>

      <div className="text-xs text-slate-400">
        <p>
          Real-time inventory data and replenishment recommendations coming
          when ERP integration is ready.
        </p>
      </div>
    </div>
  );
}
