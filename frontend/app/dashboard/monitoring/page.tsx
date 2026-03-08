"use client"

import { useState } from "react"
import { useProtocols, useMonitoring } from "@/lib/hooks"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

function formatAmount(weiStr: string, decimals: number, maxDecimals = 4): string {
  try {
    const n = BigInt(weiStr)
    const div = BigInt(10 ** decimals)
    const intPart = n / div
    const fracPart = n % div
    const fracStr = fracPart.toString().padStart(decimals, "0").slice(0, maxDecimals).replace(/0+$/, "") || "0"
    return fracStr ? `${intPart.toLocaleString()}.${fracStr}` : intPart.toLocaleString()
  } catch {
    return weiStr
  }
}

export default function MonitoringPage() {
  const { data: protocols, loading: protocolsLoading } = useProtocols()
  const [protocolId, setProtocolId] = useState<string>("")
  const { data: snapshot, loading: monitoringLoading, error, refetch } = useMonitoring(protocolId || null)

  const selectedProtocol = protocols?.find((p) => p.protocolId === protocolId)
  const decimals = selectedProtocol?.tokenDecimals ?? 18
  const symbol = selectedProtocol?.tokenSymbol?.trim() || (selectedProtocol?.tokenAddress ? "tokens" : "")
  const amountSuffix = symbol ? ` ${symbol}` : ""

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-[#1E293B] mb-6">Monitoring</h1>

      <div className="mb-6">
        <label className="block text-sm font-medium text-[#64748B] mb-2">Protocol Selector</label>
        <select
          value={protocolId}
          onChange={(e) => setProtocolId(e.target.value)}
          className="w-full max-w-xs rounded-lg border border-[#E2E8F0] bg-white px-4 py-2 text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]"
        >
          <option value="">Select a protocol</option>
          {protocols?.map((p) => (
            <option key={p.protocolId} value={p.protocolId}>
              {p.name} ({p.protocolId})
            </option>
          ))}
        </select>
      </div>

      {!protocolId && (
        <p className="text-[#94A3B8] text-sm">Select a protocol to view monitoring data.</p>
      )}

      {protocolId && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm">
              <p className="text-sm text-[#64748B] font-medium">Reserves</p>
              <p className="text-xl font-bold text-[#1E293B] mt-1">
                {monitoringLoading ? "…" : snapshot ? `${formatAmount(snapshot.reserves, decimals)}${amountSuffix}` : "—"}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm">
              <p className="text-sm text-[#64748B] font-medium">Liabilities</p>
              <p className="text-xl font-bold text-[#1E293B] mt-1">
                {monitoringLoading ? "…" : snapshot ? `${formatAmount(snapshot.liabilities, decimals)}${amountSuffix}` : "—"}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm">
              <p className="text-sm text-[#64748B] font-medium">Reserve Ratio</p>
              <p className="text-xl font-bold text-[#1E293B] mt-1">
                {monitoringLoading ? "…" : snapshot ? snapshot.reserveRatio.toFixed(2) : "—"}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm">
              <p className="text-sm text-[#64748B] font-medium">Status</p>
              <p className="mt-1 flex items-center gap-2">
                {monitoringLoading ? (
                  "…"
                ) : snapshot ? (
                  <>
                    <span
                      className={`w-3 h-3 rounded-full ${
                        snapshot.status === "healthy"
                          ? "bg-emerald-500"
                          : snapshot.status === "warning"
                            ? "bg-amber-500"
                            : "bg-red-500"
                      }`}
                    />
                    <span className="font-bold uppercase text-[#1E293B]">{snapshot.status}</span>
                  </>
                ) : (
                  "—"
                )}
              </p>
            </div>
          </div>

          <div className="mb-4 flex justify-end">
            <Button onClick={() => refetch()} disabled={monitoringLoading} className="gap-2">
              <RefreshCw className={`w-4 h-4 ${monitoringLoading ? "animate-spin" : ""}`} />
              Refresh Monitoring
            </Button>
          </div>

          <h2 className="text-lg font-semibold text-[#1E293B] mb-3">Reserve Wallets</h2>
          <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden shadow-sm">
            {!selectedProtocol?.reserveWallets?.length ? (
              <div className="p-6 text-center text-[#94A3B8] text-sm">No reserve wallets configured.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                    <th className="text-left py-3 px-4 font-medium text-[#64748B]">Wallet Address</th>
                    <th className="text-left py-3 px-4 font-medium text-[#64748B]">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedProtocol.reserveWallets.map((wallet) => (
                    <tr key={wallet} className="border-b border-[#E2E8F0] last:border-0">
                      <td className="py-3 px-4 font-mono text-xs text-[#1E293B]">{wallet}</td>
                      <td className="py-3 px-4 text-[#64748B]">
                        {snapshot ? `${formatAmount(snapshot.reserves, decimals)}${amountSuffix}` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {error && (
            <p className="mt-4 text-sm text-red-600">{error.message}</p>
          )}
        </>
      )}
    </div>
  )
}
