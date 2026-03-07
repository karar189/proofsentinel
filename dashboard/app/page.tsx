export default function Home() {
  return (
    <main>
      <h1 style={{ marginBottom: "0.5rem" }}>ProofSentinel</h1>
      <p style={{ color: "var(--muted)", marginBottom: "2rem" }}>
        Continuous on-chain solvency monitoring. Reduce detection latency of reserve risks.
      </p>
      <div className="card">
        <h2 style={{ marginBottom: "0.75rem" }}>Quick links</h2>
        <ul style={{ listStyle: "none" }}>
          <li style={{ marginBottom: "0.5rem" }}>
            <a href="/protocol">Register a protocol</a> — Add reserve wallets and liability source
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            <a href="/monitoring">Monitoring</a> — View reserve ratio and status per protocol
          </li>
          <li>
            <a href="/alerts">Alerts</a> — See triggered warnings and critical alerts
          </li>
        </ul>
      </div>
    </main>
  );
}
