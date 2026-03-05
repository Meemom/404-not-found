"use client";

interface PlanningExpandedViewProps {
  nodeId: string;
}

export function PlanningExpandedView({
  nodeId,
}: PlanningExpandedViewProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-700/30 rounded-lg p-4 border border-blue-500/30">
          <p className="text-xs text-slate-400 mb-1">Plans Active</p>
          <p className="text-2xl font-bold text-blue-400">3</p>
        </div>
        <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
          <p className="text-xs text-slate-400 mb-1">Feasibility</p>
          <p className="text-2xl font-bold text-green-400">92%</p>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-white mb-3">
          Mitigation Plans
        </h3>
        <div className="space-y-2">
          <div className="bg-blue-900/20 rounded p-3 border border-blue-600/30">
            <p className="text-sm font-semibold text-blue-300">
              Infineon Dresden Backup
            </p>
            <p className="text-xs text-slate-400 mt-1">
              16,000 MCU-32BIT units, 5-day lead time
            </p>
            <div className="mt-2 h-1.5 bg-slate-700 rounded overflow-hidden">
              <div className="h-full bg-blue-500 w-3/4" />
            </div>
          </div>
          <div className="bg-blue-900/20 rounded p-3 border border-blue-600/30">
            <p className="text-sm font-semibold text-blue-300">
              Customer Communication
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Proactive BMW outreach + timeline updates
            </p>
            <div className="mt-2 h-1.5 bg-slate-700 rounded overflow-hidden">
              <div className="h-full bg-blue-500 w-1/2" />
            </div>
          </div>
        </div>
      </div>

      <div className="text-xs text-slate-400">
        <p>
          Detailed mitigation strategies and scenario analysis coming when
          planning agent API is ready.
        </p>
      </div>
    </div>
  );
}
