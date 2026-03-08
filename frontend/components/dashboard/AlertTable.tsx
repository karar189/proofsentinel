"use client"

import { useState } from "react"
import type { Alert } from "@/lib/api"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type Props = {
  alerts: Alert[]
  loading?: boolean
  protocolFilter: string
  onProtocolFilterChange: (id: string) => void
  protocolOptions: { protocolId: string; name: string }[]
}

export function AlertTable({
  alerts,
  loading,
  protocolFilter,
  onProtocolFilterChange,
  protocolOptions,
}: Props) {
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null)

  return (
    <>
      <div className="mb-4">
        <label className="block text-sm font-medium text-[#64748B] mb-2">Filter by Protocol</label>
        <select
          value={protocolFilter}
          onChange={(e) => onProtocolFilterChange(e.target.value)}
          className="w-full max-w-xs rounded-lg border border-[#E2E8F0] bg-white px-4 py-2 text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]"
        >
          <option value="">All protocols</option>
          {protocolOptions.map((p) => (
            <option key={p.protocolId} value={p.protocolId}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-[#64748B] text-sm">Loading alerts…</div>
        ) : !alerts.length ? (
          <div className="p-8 text-center text-[#94A3B8] text-sm">No alerts.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                <th className="text-left py-3 px-4 font-medium text-[#64748B]">Severity</th>
                <th className="text-left py-3 px-4 font-medium text-[#64748B]">Protocol</th>
                <th className="text-left py-3 px-4 font-medium text-[#64748B]">Message</th>
                <th className="text-left py-3 px-4 font-medium text-[#64748B]">Time</th>
                <th className="text-left py-3 px-4 font-medium text-[#64748B]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((a) => (
                <tr
                  key={a.alertId}
                  className="border-b border-[#E2E8F0] last:border-0 hover:bg-[#F8FAFC] cursor-pointer"
                  onClick={() => setSelectedAlert(a)}
                >
                  <td className="py-3 px-4">
                    <span
                      className={
                        a.severity === "critical"
                          ? "text-red-600 font-medium"
                          : "text-amber-600 font-medium"
                      }
                    >
                      {a.severity === "critical" ? "🔴 Critical" : "🟡 Warning"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[#1E293B]">{a.protocolId}</td>
                  <td className="py-3 px-4 text-[#64748B]">{a.message}</td>
                  <td className="py-3 px-4 text-[#64748B]">
                    {new Date(a.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      type="button"
                      className="text-[#0EA5E9] hover:underline"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedAlert(a)
                      }}
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Dialog open={!!selectedAlert} onOpenChange={() => setSelectedAlert(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alert Details</DialogTitle>
          </DialogHeader>
          {selectedAlert && (
            <div className="space-y-3 text-sm">
              <p><span className="font-medium text-[#64748B]">Protocol:</span> {selectedAlert.protocolId}</p>
              <p><span className="font-medium text-[#64748B]">Reserve Ratio:</span> {selectedAlert.ratio != null ? selectedAlert.ratio.toFixed(2) : "—"}</p>
              <p><span className="font-medium text-[#64748B]">Message:</span> {selectedAlert.message}</p>
              <p><span className="font-medium text-[#64748B]">Timestamp:</span> {new Date(selectedAlert.timestamp).toLocaleString()}</p>
              <p className="text-[#64748B] pt-2 border-t border-[#E2E8F0]">
                Action taken: {selectedAlert.severity === "critical" ? "pauseWithdrawals()" : "Alert recorded"}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
