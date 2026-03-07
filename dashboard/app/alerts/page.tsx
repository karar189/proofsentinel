"use client";

import { useEffect, useState } from "react";
import { getAlerts, getProtocols, type Alert, type ProtocolConfig } from "@/lib/api";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [protocols, setProtocols] = useState<ProtocolConfig[]>([]);
  const [filterProtocol, setFilterProtocol] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setError(null);
      const [alertList, protocolList] = await Promise.all([
        getAlerts(filterProtocol || undefined),
        getProtocols(),
      ]);
      setAlerts(alertList);
      setProtocols(protocolList);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    load();
  }, [filterProtocol]);

  return (
    <main>
      <h1 style={{ marginBottom: "0.5rem" }}>Alerts</h1>
      <p style={{ color: "var(--muted)", marginBottom: "1.5rem" }}>
        Warnings and critical alerts when reserve ratio breaches thresholds.
      </p>

      {error && <p style={{ color: "var(--critical)", marginBottom: "0.75rem" }}>{error}</p>}

      <div className="card" style={{ marginBottom: "1rem" }}>
        <label style={{ display: "block", marginBottom: "0.5rem" }}>Filter by protocol</label>
        <select
          value={filterProtocol}
          onChange={(e) => setFilterProtocol(e.target.value)}
          style={{
            background: "var(--bg)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            padding: "0.5rem 0.75rem",
            color: "inherit",
            minWidth: "280px",
          }}
        >
          <option value="">All protocols</option>
          {protocols.map((p) => (
            <option key={p.protocolId} value={p.protocolId}>{p.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p style={{ color: "var(--muted)" }}>Loading alerts…</p>
      ) : alerts.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>No alerts yet.</p>
      ) : (
        <ul style={{ listStyle: "none" }}>
          {alerts.map((a) => (
            <li key={a.alertId} className="card">
              <span className={`badge ${a.severity}`} style={{ marginRight: "0.5rem" }}>
                {a.severity}
              </span>
              <strong>{a.protocolId}</strong> — {a.message}
              {a.ratio != null && (
                <span style={{ color: "var(--muted)", marginLeft: "0.5rem" }}>
                  (ratio: {a.ratio.toFixed(4)})
                </span>
              )}
              <br />
              <span style={{ fontSize: "0.875rem", color: "var(--muted)" }}>
                {new Date(a.timestamp).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
