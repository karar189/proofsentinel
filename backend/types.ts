export type ProtocolConfig = {
  protocolId: string;
  name: string;
  reserveWallets: string[];
  liabilitySource: "token" | "merkle" | "api";
  tokenAddress?: string;
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
