/**
 * Monitoring service: fetches reserves, liabilities, computes ratio, evaluates thresholds, triggers alerts.
 */
import { ethers } from "ethers";
import { computeReserveRatio, evaluateRisk, type Thresholds } from "../risk-engine";
import { computeTotalLiabilities, verifyProof, buildMerkleTree } from "../merkle-service";
import { fetchApiLiabilities } from "../api-liability-service";
import type { ProtocolConfig } from "../types";

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
];

function isLikelyContractAddress(addr: string): boolean {
  return ethers.isAddress(addr) && addr.length === 42 && addr.startsWith("0x");
}

async function fetchReserves(
  rpcUrl: string,
  wallets: string[],
  tokenAddress?: string
): Promise<bigint> {
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  let total = 0n;
  const useToken = tokenAddress && isLikelyContractAddress(tokenAddress);
  if (useToken) {
    const token = new ethers.Contract(tokenAddress!, ERC20_ABI, provider);
    for (const w of wallets) {
      try {
        const bal = await token.balanceOf(w);
        total += typeof bal === "bigint" ? bal : BigInt(bal?.toString() ?? "0");
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.includes("BAD_DATA") || msg.includes("0x")) {
          throw new Error(
            `balanceOf failed: wrong chain or invalid token. Your wallet balance is on a specific network (e.g. BNB Smart Chain). When registering the protocol, set RPC URL to that same chain (e.g. https://bsc-dataseed.binance.org/ for BNB). For native BNB/ETH only, leave Liability Token empty.`
          );
        }
        throw e;
      }
    }
  } else {
    for (const w of wallets) {
      total += await provider.getBalance(w);
    }
  }
  return total;
}

async function fetchTokenLiabilities(rpcUrl: string, tokenAddress: string): Promise<bigint> {
  if (!isLikelyContractAddress(tokenAddress)) {
    throw new Error(
      `Invalid token address "${tokenAddress}". Use a 0x... ERC20 contract address, not a symbol.`
    );
  }
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const token = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
  try {
    const supply = await token.totalSupply();
    return typeof supply === "bigint" ? supply : BigInt(supply?.toString() ?? "0");
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("BAD_DATA") || msg.includes("0x")) {
      throw new Error(
        `totalSupply failed: use the same RPC as your wallet (e.g. BNB Chain RPC if your token is on BNB). Set RPC URL when registering the protocol.`
      );
    }
    throw e;
  }
}

function fetchMerkleLiabilities(config: ProtocolConfig): bigint {
  if (!config.merkleTreeData || config.merkleTreeData.length === 0) {
    throw new Error(
      "Merkle liability source requires merkleTreeData (array of { userId, balance } leaves). " +
      "Submit them via POST /protocol or PUT /protocol/:id/merkle-tree."
    );
  }

  // Verify the tree root matches if a root was previously stored
  if (config.merkleRoot) {
    const tree = buildMerkleTree(config.merkleTreeData);
    if (tree.root !== config.merkleRoot) {
      throw new Error(
        `Merkle root mismatch: computed ${tree.root} but expected ${config.merkleRoot}. ` +
        "The liability data may have been tampered with."
      );
    }
  }

  return computeTotalLiabilities(config.merkleTreeData);
}

async function fetchLiabilities(config: ProtocolConfig, rpcUrl: string): Promise<bigint> {
  switch (config.liabilitySource) {
    case "token":
      if (!config.tokenAddress) return 0n;
      return fetchTokenLiabilities(rpcUrl, config.tokenAddress);

    case "merkle":
      return fetchMerkleLiabilities(config);

    case "api":
      if (!config.liabilityApiUrl || !config.liabilityApiPath) {
        throw new Error(
          "API liability source requires liabilityApiUrl and liabilityApiPath. " +
          "Set them when registering the protocol."
        );
      }
      return fetchApiLiabilities(config.liabilityApiUrl, config.liabilityApiPath);

    default:
      throw new Error(`Unknown liability source: ${config.liabilitySource}`);
  }
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
  const liabilities = await fetchLiabilities(config, rpcUrl);
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
