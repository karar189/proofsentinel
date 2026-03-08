"use client"

import Link from "next/link"

export function Topbar() {
  return (
    <header className="h-14 border-b border-[#E2E8F0] bg-white flex items-center justify-between px-6 shrink-0">
      <Link href="/" className="flex items-center gap-2 text-[#1E293B] font-semibold">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0EA5E9] to-[#0284C7] flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
        ProofSentinel
      </Link>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F0FDF4] border border-[#BBF7D0] text-sm text-[#166534]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Network connected
        </div>
        <div className="w-9 h-9 rounded-full bg-[#E2E8F0] flex items-center justify-center text-[#64748B] text-sm font-medium">
          User
        </div>
      </div>
    </header>
  )
}
