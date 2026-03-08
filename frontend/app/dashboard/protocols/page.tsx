"use client"

import { useState } from "react"
import type { ProtocolConfig } from "@/lib/api"
import { useProtocols, useRegisterProtocol } from "@/lib/hooks"
import { ProtocolForm } from "@/components/dashboard/ProtocolForm"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default function ProtocolsPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const { data: protocols, loading, error, refetch } = useProtocols()
  const { mutate: registerProtocol } = useRegisterProtocol()
  const handleRegister = async (body: Partial<ProtocolConfig>) => {
    await registerProtocol(body)
    refetch()
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1E293B]">Protocols</h1>
        <Button onClick={() => setModalOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Register Protocol
        </Button>
      </div>

      <ProtocolForm
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSubmit={handleRegister}
      />

      <h2 className="text-lg font-semibold text-[#1E293B] mb-3">Registered Protocols</h2>
      <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-[#64748B] text-sm">Loading protocols…</div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 text-sm">{error.message}</div>
        ) : !protocols?.length ? (
          <div className="p-8 text-center text-[#94A3B8] text-sm">
            No protocols registered. Click &quot;Register Protocol&quot; to add one.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                <th className="text-left py-3 px-4 font-medium text-[#64748B]">Name</th>
                <th className="text-left py-3 px-4 font-medium text-[#64748B]">Reserve Wallets</th>
                <th className="text-left py-3 px-4 font-medium text-[#64748B]">Liability Token</th>
              </tr>
            </thead>
            <tbody>
              {protocols.map((p) => (
                <tr key={p.protocolId} className="border-b border-[#E2E8F0] last:border-0">
                  <td className="py-3 px-4 font-medium text-[#1E293B]">{p.name}</td>
                  <td className="py-3 px-4 text-[#64748B] font-mono text-xs">
                    {p.reserveWallets.length
                      ? p.reserveWallets.map((w) => `${w.slice(0, 10)}...`).join(", ")
                      : "—"}
                  </td>
                  <td className="py-3 px-4 text-[#64748B]">
                    {p.tokenAddress ? `${p.tokenAddress.slice(0, 10)}...` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
