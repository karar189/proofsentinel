"use client"

import { useProtocols, useAlerts } from "@/lib/hooks"
import { RatioChart } from "@/components/dashboard/RatioChart"

export default function DashboardPage() {
  const { data: protocols, loading: protocolsLoading } = useProtocols()
  const { data: alerts, loading: alertsLoading } = useAlerts()

  const criticalCount = alerts?.filter((a) => a.severity === "critical").length ?? 0
  const avgRatio =
    protocols?.length && alerts?.length
      ? 1.18 // Would come from monitoring snapshots in a real impl
      : protocols?.length
        ? 1.18
        : null

  // Placeholder ratio history (backend doesn't store history yet)
  const ratioHistory = [
    { time: "10:00", ratio: 1.22 },
    { time: "10:15", ratio: 1.2 },
    { time: "10:30", ratio: 1.18 },
    { time: "10:45", ratio: 1.15 },
    { time: "11:00", ratio: 1.18 },
    { time: "11:15", ratio: 1.16 },
    { time: "11:30", ratio: 1.18 },
  ]

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-[#1E293B] mb-6">Dashboard</h1>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm">
          <p className="text-sm text-[#64748B] font-medium">Protocols</p>
          <p className="text-2xl font-bold text-[#1E293B] mt-1">
            {protocolsLoading ? "—" : protocols?.length ?? 0}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm">
          <p className="text-sm text-[#64748B] font-medium">Active Alerts</p>
          <p className="text-2xl font-bold text-[#1E293B] mt-1">
            {alertsLoading ? "—" : criticalCount > 0 ? `${criticalCount} Critical` : "0"}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm">
          <p className="text-sm text-[#64748B] font-medium">Avg Ratio</p>
          <p className="text-2xl font-bold text-[#1E293B] mt-1">
            {avgRatio != null ? avgRatio.toFixed(2) : "—"}
          </p>
        </div>
      </div>

      {/* Reserve Ratio History */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-[#1E293B] mb-3">Reserve Ratio History</h2>
        <RatioChart data={ratioHistory} />
      </div>

      {/* Recent Alerts */}
      <div>
        <h2 className="text-lg font-semibold text-[#1E293B] mb-3">Recent Alerts</h2>
        <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden shadow-sm">
          {alertsLoading ? (
            <div className="p-8 text-center text-[#64748B] text-sm">Loading alerts…</div>
          ) : !alerts?.length ? (
            <div className="p-8 text-center text-[#94A3B8] text-sm">No alerts yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                  <th className="text-left py-3 px-4 font-medium text-[#64748B]">Protocol</th>
                  <th className="text-left py-3 px-4 font-medium text-[#64748B]">Severity</th>
                  <th className="text-left py-3 px-4 font-medium text-[#64748B]">Ratio</th>
                  <th className="text-left py-3 px-4 font-medium text-[#64748B]">Time</th>
                </tr>
              </thead>
              <tbody>
                {alerts.slice(0, 10).map((a) => (
                  <tr key={a.alertId} className="border-b border-[#E2E8F0] last:border-0">
                    <td className="py-3 px-4 text-[#1E293B]">{a.protocolId}</td>
                    <td className="py-3 px-4">
                      <span
                        className={
                          a.severity === "critical"
                            ? "text-red-600 font-medium"
                            : "text-amber-600 font-medium"
                        }
                      >
                        {a.severity === "critical" ? "Critical" : "Warning"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#64748B]">{a.ratio != null ? a.ratio.toFixed(2) : "—"}</td>
                    <td className="py-3 px-4 text-[#64748B]">
                      {new Date(a.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
