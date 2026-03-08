import type { LiabilityLeaf } from "./merkle-service";

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

  // Merkle liability fields
  merkleRoot?: string;
  merkleTreeData?: LiabilityLeaf[];

  // API liability fields
  liabilityApiUrl?: string;
  liabilityApiPath?: string;
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

export type SafeguardAction = "pause_withdrawals" | "pause_deposits" | "emit_alert";
