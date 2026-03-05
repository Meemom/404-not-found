"use client";

interface ActionExpandedViewProps {
  nodeId: string;
}

export function ActionExpandedView({ nodeId }: ActionExpandedViewProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-700/30 rounded-lg p-4 border border-green-500/30">
          <p className="text-xs text-slate-400 mb-1">Actions Pending</p>
          <p className="text-2xl font-bold text-green-400">4</p>
        </div>
        <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
          <p className="text-xs text-slate-400 mb-1">Est. Impact</p>
          <p className="text-2xl font-bold text-emerald-400">€180K</p>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-white mb-3">
          Drafted Actions
        </h3>
        <div className="space-y-2">
          <div className="bg-green-900/20 rounded p-3 border border-green-600/30">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-200">Supplier Outreach Email</p>
              <span className="text-xs px-2 py-1 rounded bg-green-600/30 text-green-300">
                Email
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Klaus Richter, Infineon</p>
          </div>
          <div className="bg-yellow-900/20 rounded p-3 border border-yellow-600/30">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-200">Executive Escalation</p>
              <span className="text-xs px-2 py-1 rounded bg-yellow-600/30 text-yellow-300">
                Escalation
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Max Mueller, VP Operations
            </p>
          </div>
          <div className="bg-blue-900/20 rounded p-3 border border-blue-600/30">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-200">BMW Proactive Comms</p>
              <span className="text-xs px-2 py-1 rounded bg-blue-600/30 text-blue-300">
                Email
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Customer Account Manager</p>
          </div>
        </div>
      </div>

      <div className="text-xs text-slate-400">
        <p>
          Full action drafts and approval workflow coming when action agent API
          is ready.
        </p>
      </div>
    </div>
  );
}
