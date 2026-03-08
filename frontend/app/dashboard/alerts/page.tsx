"use client"

import { useState, useMemo } from "react"
import { useProtocols, useAlerts } from "@/lib/hooks"
import { AlertTable } from "@/components/dashboard/AlertTable"

export default function AlertsPage() {
  const { data: protocols } = useProtocols()
  const [protocolFilter, setProtocolFilter] = useState("")
  const { data: alerts, loading } = useAlerts(protocolFilter || undefined)

  const protocolOptions = useMemo(
    () => protocols?.map((p) => ({ protocolId: p.protocolId, name: p.name })) ?? [],
    [protocols]
  )

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-[#1E293B] mb-6">Alerts</h1>
      <AlertTable
        alerts={alerts ?? []}
        loading={loading}
        protocolFilter={protocolFilter}
        onProtocolFilterChange={setProtocolFilter}
        protocolOptions={protocolOptions}
      />
    </div>
  )
}
