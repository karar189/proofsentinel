import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "ProofSentinel — Continuous Proof-of-Reserves",
  description: "Monitor reserve ratios and solvency in real time.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="layout">
          <nav className="nav">
            <Link href="/">ProofSentinel</Link>
            <Link href="/protocol">Protocol</Link>
            <Link href="/monitoring">Monitoring</Link>
            <Link href="/alerts">Alerts</Link>
          </nav>
          {children}
        </div>
      </body>
    </html>
  );
}
