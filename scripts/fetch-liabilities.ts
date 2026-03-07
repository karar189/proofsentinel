import { ethers } from "ethers";

const ERC20_ABI = [
  "function totalSupply() view returns (uint256)",
  "function decimals() view returns (uint8)",
];

export type FetchLiabilitiesOptions = {
  rpcUrl: string;
  /** ERC20 token address; totalSupply() is used as liabilities proxy */
  tokenAddress: string;
};

/**
 * Fetches liability data from chain.
 * For hackathon: uses token totalSupply() as liabilities.
 * Can be extended for Merkle root / protocol API.
 */
export async function fetchLiabilities(options: FetchLiabilitiesOptions): Promise<bigint> {
  const { rpcUrl, tokenAddress } = options;
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const token = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
  return await token.totalSupply();
}

async function main() {
  const rpcUrl = process.env.RPC_URL ?? "https://eth.llamarpc.com";
  const tokenAddress = process.env.TOKEN_ADDRESS;

  if (!tokenAddress) {
    console.log("Usage: TOKEN_ADDRESS=0x... [RPC_URL=...] npx ts-node fetch-liabilities.ts");
    process.exit(1);
  }

  const total = await fetchLiabilities({ rpcUrl, tokenAddress });
  console.log("Liabilities (raw):", total.toString());
  const token = new ethers.Contract(
    tokenAddress,
    ["function decimals() view returns (uint8)"],
    new ethers.JsonRpcProvider(rpcUrl)
  );
  const decimals = await token.decimals();
  console.log("Liabilities (formatted):", ethers.formatUnits(total, decimals));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
