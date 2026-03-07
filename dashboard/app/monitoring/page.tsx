"use client";

import { useEffect, useState } from "react";
import { getProtocols, getMonitoring, type ProtocolConfig, type MonitoringSnapshot } from "@/lib/api";

export default function MonitoringPage() {
  const [protocols, setProtocols] = useState<ProtocolConfig[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<MonitoringSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingSnapshot, setLoadingSnapshot] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getProtocols()
      .then(setProtocols)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selected) {
      setSnapshot(null);
      return;
    }
    setLoadingSnapshot(true);
    setError(null);
    getMonitoring(selected)
      .then(setSnapshot)
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Failed to load");
        setSnapshot(null);
      })
      .finally(() => setLoadingSnapshot(false));
  }, [selected]);

  return (
    <main>
      <h1 style={{ marginBottom: "0.5rem" }}>Monitoring</h1>
      <p style={{ color: "var(--muted)", marginBottom: "1.5rem" }}>
        Reserve ratio, reserves, and liabilities per protocol.
      </p>

      {error && <p style={{ color: "var(--critical)", marginBottom: "0.75rem" }}>{error}</p>}

      {loading ? (
        <p style={{ color: "var(--muted)" }}>Loading protocols…</p>
      ) : protocols.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>No protocols registered. Add one on the Protocol page.</p>
      ) : (
        <>
          <div className="card" style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>Select protocol</label>
            <select
              value={selected ?? ""}
              onChange={(e) => setSelected(e.target.value || null)}
              style={{
                background: "var(--bg)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                padding: "0.5rem 0.75rem",
                color: "inherit",
                minWidth: "280px",
              }}
            >
              <option value="">—</option>
              {protocols.map((p) => (
                <option key={p.protocolId} value={p.protocolId}>{p.name} ({p.protocolId})</option>
              ))}
            </select>
          </div>

          {loadingSnapshot && <p style={{ color: "var(--muted)" }}>Loading monitoring data…</p>}
          {selected && snapshot && (
            <div className="card">
              <h2 style={{ marginBottom: "1rem" }}>{snapshot.protocolId}</h2>
              <p style={{ marginBottom: "0.5rem" }}>
                <strong>Reserves:</strong> {snapshot.reserves} wei
              </p>
              <p style={{ marginBottom: "0.5rem" }}>
                <strong>Liabilities:</strong> {snapshot.liabilities} wei
              </p>
              <p style={{ marginBottom: "0.5rem" }}>
                <strong>Reserve ratio:</strong> {snapshot.reserveRatio.toFixed(4)}
              </p>
              <p style={{ marginBottom: "0.5rem" }}>
                <strong>Status:</strong>{" "}
                <span className={`badge ${snapshot.status}`}>{snapshot.status}</span>
              </p>
              <p style={{ fontSize: "0.875rem", color: "var(--muted)" }}>
                Updated: {new Date(snapshot.timestamp).toLocaleString()}
              </p>
            </div>
          )}
        </>
      )}
    </main>
  );
}
