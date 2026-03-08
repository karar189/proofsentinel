"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

export default function SettingsPage() {
  const [interval, setInterval] = useState("5")
  const [oracleSource, setOracleSource] = useState("Chainlink")
  const [priceFeed, setPriceFeed] = useState("CoinGecko")
  const [emailNotif, setEmailNotif] = useState(true)
  const [webhookNotif, setWebhookNotif] = useState(true)
  const [slackNotif, setSlackNotif] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleSave = () => {
    setSaving(true)
    setTimeout(() => setSaving(false), 800)
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-[#1E293B] mb-6">Settings</h1>

      <div className="max-w-xl space-y-8">
        <div>
          <Label className="text-[#64748B]">Monitoring Interval</Label>
          <select
            value={interval}
            onChange={(e) => setInterval(e.target.value)}
            className="mt-2 w-full rounded-lg border border-[#E2E8F0] bg-white px-4 py-2 text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]"
          >
            <option value="1">1 minute</option>
            <option value="5">5 minutes</option>
            <option value="15">15 minutes</option>
            <option value="30">30 minutes</option>
          </select>
        </div>

        <div>
          <Label className="text-[#64748B]">Oracle Source</Label>
          <select
            value={oracleSource}
            onChange={(e) => setOracleSource(e.target.value)}
            className="mt-2 w-full rounded-lg border border-[#E2E8F0] bg-white px-4 py-2 text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]"
          >
            <option value="Chainlink">Chainlink</option>
            <option value="Pyth">Pyth</option>
          </select>
        </div>

        <div>
          <Label className="text-[#64748B]">Price Feed Source</Label>
          <select
            value={priceFeed}
            onChange={(e) => setPriceFeed(e.target.value)}
            className="mt-2 w-full rounded-lg border border-[#E2E8F0] bg-white px-4 py-2 text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]"
          >
            <option value="CoinGecko">CoinGecko</option>
            <option value="Chainlink">Chainlink</option>
          </select>
        </div>

        <div>
          <p className="text-sm font-medium text-[#64748B] mb-4">Alert Notification</p>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="email">Email</Label>
              <Switch id="email" checked={emailNotif} onCheckedChange={setEmailNotif} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="webhook">Webhook</Label>
              <Switch id="webhook" checked={webhookNotif} onCheckedChange={setWebhookNotif} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="slack">Slack</Label>
              <Switch id="slack" checked={slackNotif} onCheckedChange={setSlackNotif} />
            </div>
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save Settings"}
        </Button>
      </div>
    </div>
  )
}
