"use client";

import { useEffect, useState } from "react";
import { getProtocols, registerProtocol, type ProtocolConfig } from "@/lib/api";

export default function ProtocolPage() {
  const [protocols, setProtocols] = useState<ProtocolConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    reserveWallets: "",
    tokenAddress: "",
    minReserveRatio: "1",
    warningRatio: "1.1",
    criticalRatio: "0.95",
  });

  const load = async () => {
    try {
      setError(null);
      const list = await getProtocols();
      setProtocols(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await registerProtocol({
        name: form.name,
        reserveWallets: form.reserveWallets.split(",").map((s) => s.trim()).filter(Boolean),
        liabilitySource: "token",
        tokenAddress: form.tokenAddress || undefined,
        minReserveRatio: parseFloat(form.minReserveRatio),
        warningRatio: parseFloat(form.warningRatio),
        criticalRatio: parseFloat(form.criticalRatio),
      });
      setForm({ name: "", reserveWallets: "", tokenAddress: "", minReserveRatio: "1", warningRatio: "1.1", criticalRatio: "0.95" });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to register");
    }
  };

  return (
    <main>
      <h1 style={{ marginBottom: "0.5rem" }}>Protocol</h1>
      <p style={{ color: "var(--muted)", marginBottom: "1.5rem" }}>
        Register a protocol with reserve wallets and liability source.
      </p>

      <div className="card" style={{ marginBottom: "2rem" }}>
        <h2 style={{ marginBottom: "1rem" }}>Register protocol</h2>
        {error && <p style={{ color: "var(--critical)", marginBottom: "0.75rem" }}>{error}</p>}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "480px" }}>
          <label>
            Name
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="My Protocol"
              required
            />
          </label>
          <label>
            Reserve wallets (comma-separated addresses)
            <input
              value={form.reserveWallets}
              onChange={(e) => setForm((f) => ({ ...f, reserveWallets: e.target.value }))}
              placeholder="0x..., 0x..."
            />
          </label>
          <label>
            Liability token address (ERC20 for totalSupply)
            <input
              value={form.tokenAddress}
              onChange={(e) => setForm((f) => ({ ...f, tokenAddress: e.target.value }))}
              placeholder="0x..."
            />
          </label>
          <label>
            Min reserve ratio
            <input
              type="number"
              step="0.01"
              value={form.minReserveRatio}
              onChange={(e) => setForm((f) => ({ ...f, minReserveRatio: e.target.value }))}
            />
          </label>
          <label>
            Warning ratio
            <input
              type="number"
              step="0.01"
              value={form.warningRatio}
              onChange={(e) => setForm((f) => ({ ...f, warningRatio: e.target.value }))}
            />
          </label>
          <label>
            Critical ratio
            <input
              type="number"
              step="0.01"
              value={form.criticalRatio}
              onChange={(e) => setForm((f) => ({ ...f, criticalRatio: e.target.value }))}
            />
          </label>
          <button type="submit">Register</button>
        </form>
      </div>

      <h2 style={{ marginBottom: "0.75rem" }}>Registered protocols</h2>
      {loading ? (
        <p style={{ color: "var(--muted)" }}>Loading…</p>
      ) : protocols.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>No protocols yet. Register one above.</p>
      ) : (
        <ul style={{ listStyle: "none" }}>
          {protocols.map((p) => (
            <li key={p.protocolId} className="card">
              <strong>{p.name}</strong> — {p.protocolId}
              <br />
              <span style={{ fontSize: "0.875rem", color: "var(--muted)" }}>
                Wallets: {p.reserveWallets.length} · Token: {p.tokenAddress || "—"} · Critical ratio: {p.criticalRatio}
              </span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
