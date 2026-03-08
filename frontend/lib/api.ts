/**
 * ProofSentinel backend API client.
 * Base URL: NEXT_PUBLIC_API_URL (default http://localhost:3001)
 */

const API_BASE = typeof window !== "undefined" 
  ? (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001")
  : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001");

export type ProtocolConfig = {
  protocolId: string;
  name: string;
  reserveWallets: string[];
  liabilitySource: "token" | "merkle" | "api";
  tokenAddress?: string;
  tokenDecimals?: number;
  tokenSymbol?: string;
  minReserveRatio: number;
  warningRatio: number;
  criticalRatio: number;
  reserveMonitorContractAddress?: string;
  rpcUrl?: string;
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

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error || res.statusText);
  }
  return res.json();
}

export const api = {
  getProtocols: () => fetchApi<ProtocolConfig[]>("/protocols"),
  getMonitoring: (protocolId: string) => fetchApi<MonitoringSnapshot>(`/monitoring/${protocolId}`),
  getAlerts: (protocolId?: string) =>
    fetchApi<Alert[]>(protocolId ? `/alerts?protocolId=${encodeURIComponent(protocolId)}` : "/alerts"),
  getAlertsByProtocol: (protocolId: string) => fetchApi<Alert[]>(`/alerts/${protocolId}`),
  registerProtocol: (body: Partial<ProtocolConfig>) =>
    fetchApi<ProtocolConfig>("/protocol", { method: "POST", body: JSON.stringify(body) }),
};
