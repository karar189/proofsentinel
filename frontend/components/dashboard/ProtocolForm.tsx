"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { ProtocolConfig } from "@/lib/api"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (body: Partial<ProtocolConfig>) => Promise<unknown>
}

export function ProtocolForm({ open, onOpenChange, onSubmit }: Props) {
  const [name, setName] = useState("")
  const [reserveWalletsStr, setReserveWalletsStr] = useState("")
  const [tokenAddress, setTokenAddress] = useState("")
  const [tokenSymbol, setTokenSymbol] = useState("")
  const [rpcUrl, setRpcUrl] = useState("")
  const [warningRatio, setWarningRatio] = useState("1.10")
  const [criticalRatio, setCriticalRatio] = useState("0.95")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const wallets = reserveWalletsStr
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean)
    if (!name.trim()) {
      setError("Protocol name is required")
      setLoading(false)
      return
    }
    if (!wallets.length) {
      setError("At least one reserve wallet is required")
      setLoading(false)
      return
    }
    try {
      await onSubmit({
        name: name.trim(),
        reserveWallets: wallets,
        tokenAddress: tokenAddress.trim() || undefined,
        tokenSymbol: tokenSymbol.trim() || undefined,
        rpcUrl: rpcUrl.trim() || undefined,
        liabilitySource: "token",
        warningRatio: parseFloat(warningRatio) || 1.1,
        criticalRatio: parseFloat(criticalRatio) || 0.95,
        minReserveRatio: 0,
      })
      onOpenChange(false)
      setName("")
      setReserveWalletsStr("")
      setTokenAddress("")
      setTokenSymbol("")
      setRpcUrl("")
      setWarningRatio("1.10")
      setCriticalRatio("0.95")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to register")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Register Protocol</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Protocol Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="DemoStaking"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="wallets">Reserve Wallet Addresses</Label>
            <textarea
              id="wallets"
              value={reserveWalletsStr}
              onChange={(e) => setReserveWalletsStr(e.target.value)}
              placeholder="0xABC123..."
              rows={3}
              className="mt-1 flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <p className="text-xs text-[#64748B] mt-1">One address per line or comma-separated</p>
          </div>
          <div>
            <Label htmlFor="rpc">RPC URL (must match the chain where your wallet has funds)</Label>
            <Input
              id="rpc"
              value={rpcUrl}
              onChange={(e) => setRpcUrl(e.target.value)}
              placeholder="https://bsc-dataseed.binance.org/"
              className="mt-1 font-mono text-xs"
            />
            <p className="text-xs text-[#64748B] mt-1">
              BNB Smart Chain: https://bsc-dataseed.binance.org/ — Ethereum: https://eth.llamarpc.com — Leave empty for Ethereum default.
            </p>
          </div>
          <div>
            <Label htmlFor="token">Liability Token (ERC20 contract address, or leave empty for native balance)</Label>
            <Input
              id="token"
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
              placeholder="0x... (e.g. USDT on BNB) or leave empty for native BNB/ETH"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="symbol">Token symbol (e.g. USDT, USDC, BNB)</Label>
            <Input
              id="symbol"
              value={tokenSymbol}
              onChange={(e) => setTokenSymbol(e.target.value)}
              placeholder="USDT"
              className="mt-1"
            />
            <p className="text-xs text-[#64748B] mt-1">Shown next to amounts on Monitoring (e.g. 53.67 USDT)</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="warning">Warning Ratio</Label>
              <Input
                id="warning"
                type="number"
                step="0.01"
                value={warningRatio}
                onChange={(e) => setWarningRatio(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="critical">Critical Ratio</Label>
              <Input
                id="critical"
                type="number"
                step="0.01"
                value={criticalRatio}
                onChange={(e) => setCriticalRatio(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Registering…" : "Register"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
