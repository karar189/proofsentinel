/**
 * Monitoring service: fetches reserves, liabilities, computes ratio, evaluates thresholds, triggers alerts.
 */
import { ethers } from "ethers";
import { computeReserveRatio, evaluateRisk, type Thresholds } from "../risk-engine";
import type { ProtocolConfig } from "../types";

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
];

async function fetchReserves(
  rpcUrl: string,
  wallets: string[],
  tokenAddress?: string
): Promise<bigint> {
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  let total = 0n;
  if (tokenAddress) {
    const token = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    for (const w of wallets) {
      total += await token.balanceOf(w);
    }
  } else {
    for (const w of wallets) {
      total += await provider.getBalance(w);
    }
  }
  return total;
}

async function fetchLiabilities(rpcUrl: string, tokenAddress: string): Promise<bigint> {
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const token = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
  return await token.totalSupply();
}

export type MonitorResult = {
  reserves: bigint;
  liabilities: bigint;
  ratio: number;
  status: "healthy" | "warning" | "critical";
  shouldTriggerSafeguard: boolean;
};

export async function monitorProtocol(config: ProtocolConfig): Promise<MonitorResult> {
  const rpcUrl = config.rpcUrl ?? "https://eth.llamarpc.com";
  const reserves = await fetchReserves(
    rpcUrl,
    config.reserveWallets,
    config.tokenAddress
  );
  const liabilities =
    config.liabilitySource === "token" && config.tokenAddress
      ? await fetchLiabilities(rpcUrl, config.tokenAddress)
      : 0n;
  const ratio = computeReserveRatio(reserves, liabilities);
  const thresholds: Thresholds = {
    minReserveRatio: config.minReserveRatio,
    warningRatio: config.warningRatio,
    criticalRatio: config.criticalRatio,
  };
  const status = evaluateRisk(ratio, thresholds);
  const shouldTriggerSafeguard = ratio < config.criticalRatio;
  return { reserves, liabilities, ratio, status, shouldTriggerSafeguard };
}

// Standalone runner for cron/local testing
async function main() {
  const config: ProtocolConfig = {
    protocolId: "demo",
    name: "Demo Protocol",
    reserveWallets: process.env.RESERVE_WALLETS?.split(",").map((s) => s.trim()) ?? [],
    liabilitySource: "token",
    tokenAddress: process.env.TOKEN_ADDRESS,
    minReserveRatio: 1.0,
    warningRatio: 1.1,
    criticalRatio: 0.95,
    rpcUrl: process.env.RPC_URL,
  };
  if (config.reserveWallets.length === 0 || !config.tokenAddress) {
    console.log("Set RESERVE_WALLETS and TOKEN_ADDRESS to run monitor");
    process.exit(0);
  }
  const result = await monitorProtocol(config);
  console.log(JSON.stringify({
    reserves: result.reserves.toString(),
    liabilities: result.liabilities.toString(),
    ratio: result.ratio,
    status: result.status,
    shouldTriggerSafeguard: result.shouldTriggerSafeguard,
  }, null, 2));
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
