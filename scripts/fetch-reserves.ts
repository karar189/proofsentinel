import { ethers } from "ethers";

const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
];

export type FetchReservesOptions = {
  /** RPC URL (e.g. Ethereum) */
  rpcUrl: string;
  /** List of reserve wallet addresses to sum */
  wallets: string[];
  /** Optional: ERC20 token address to read balance of; if omitted, uses native ETH balance */
  tokenAddress?: string;
};

/**
 * Fetches total reserve balance across wallets.
 * Supports native (ETH) or a single ERC20 token.
 */
export async function fetchReserves(options: FetchReservesOptions): Promise<bigint> {
  const { rpcUrl, wallets, tokenAddress } = options;
  const provider = new ethers.JsonRpcProvider(rpcUrl);

  let total = 0n;

  if (tokenAddress) {
    const token = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    for (const wallet of wallets) {
      const balance = await token.balanceOf(wallet);
      total += balance;
    }
  } else {
    for (const wallet of wallets) {
      const balance = await provider.getBalance(wallet);
      total += balance;
    }
  }

  return total;
}

async function main() {
  const rpcUrl = process.env.RPC_URL ?? "https://eth.llamarpc.com";
  const walletsEnv = process.env.RESERVE_WALLETS ?? "";
  const wallets = walletsEnv ? walletsEnv.split(",").map((s) => s.trim()) : [];
  const tokenAddress = process.env.TOKEN_ADDRESS;

  if (wallets.length === 0) {
    console.log("Usage: RESERVE_WALLETS=0x...,0x... [TOKEN_ADDRESS=0x...] npx ts-node fetch-reserves.ts");
    console.log("Total reserves: 0 (no wallets provided)");
    process.exit(0);
  }

  const total = await fetchReserves({ rpcUrl, wallets, tokenAddress });
  console.log("Total reserves (wei):", total.toString());
  if (!tokenAddress) {
    console.log("Total reserves (ETH):", ethers.formatEther(total));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
