const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export type ProtocolConfig = {
  protocolId: string;
  name: string;
  reserveWallets: string[];
  liabilitySource: "token" | "merkle" | "api";
  tokenAddress?: string;
  minReserveRatio: number;
  warningRatio: number;
  criticalRatio: number;
};

export type MonitoringSnapshot = {
  protocolId: string;
  timestamp: string;
  reserves: string;
  liabilities: string;
  reserveRatio: number;
  status: "healthy" | "warning" | "critical";
};

export type Alert = {
  alertId: string;
  protocolId: string;
  type: string;
  severity: "warning" | "critical";
  timestamp: string;
  message: string;
  ratio?: number;
};

export async function getProtocols(): Promise<ProtocolConfig[]> {
  const res = await fetch(`${API_BASE}/protocols`);
  if (!res.ok) throw new Error("Failed to fetch protocols");
  return res.json();
}

export async function registerProtocol(body: Partial<ProtocolConfig>): Promise<ProtocolConfig & { protocolId: string }> {
  const res = await fetch(`${API_BASE}/protocol`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Failed to register protocol");
  return res.json();
}

export async function getMonitoring(protocolId: string): Promise<MonitoringSnapshot> {
  const res = await fetch(`${API_BASE}/monitoring/${encodeURIComponent(protocolId)}`);
  if (!res.ok) throw new Error("Failed to fetch monitoring");
  return res.json();
}

export async function getAlerts(protocolId?: string): Promise<Alert[]> {
  const url = protocolId
    ? `${API_BASE}/alerts?protocolId=${encodeURIComponent(protocolId)}`
    : `${API_BASE}/alerts`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch alerts");
  return res.json();
}
