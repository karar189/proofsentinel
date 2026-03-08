"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

type Point = { time: string; ratio: number }

export function RatioChart({ data }: { data: Point[] }) {
  if (!data.length) {
    return (
      <div className="h-64 flex items-center justify-center text-[#94A3B8] text-sm border border-[#E2E8F0] rounded-lg bg-white">
        No ratio history yet. Monitoring data will appear here.
      </div>
    )
  }
  return (
    <div className="h-64 w-full border border-[#E2E8F0] rounded-lg bg-white p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis dataKey="time" tick={{ fontSize: 12 }} stroke="#94A3B8" />
          <YAxis tick={{ fontSize: 12 }} stroke="#94A3B8" domain={["auto", "auto"]} />
          <Tooltip
            contentStyle={{ fontSize: 12, border: "1px solid #E2E8F0", borderRadius: 8 }}
            formatter={(value: number) => [value.toFixed(2), "Ratio"]}
          />
          <Line type="monotone" dataKey="ratio" stroke="#0EA5E9" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
