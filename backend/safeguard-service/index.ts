/**
 * Safeguard service: executes on-chain safeguard actions via ReserveMonitor contract.
 */
import { ethers } from "ethers";
import type { SafeguardAction } from "../types";

const RESERVE_MONITOR_ABI = [
  "function pauseWithdrawals() external",
  "function pauseDeposits() external",
  "function emitReserveAlert(uint256 ratio) external",
];

export async function executeSafeguard(
  rpcUrl: string,
  contractAddress: string,
  action: SafeguardAction,
  ratio?: number
): Promise<string> {
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("DEPLOYER_PRIVATE_KEY not set");
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  const contract = new ethers.Contract(contractAddress, RESERVE_MONITOR_ABI, wallet);

  let tx: ethers.TransactionResponse;

  switch (action) {
    case "pause_withdrawals":
      tx = await contract.pauseWithdrawals();
      break;
    case "pause_deposits":
      tx = await contract.pauseDeposits();
      break;
    case "emit_alert":
      if (ratio === undefined) {
        throw new Error("ratio required for emit_alert action");
      }
      tx = await contract.emitReserveAlert(Math.round(ratio * 10000));
      break;
    default:
      throw new Error(`Unknown safeguard action: ${action}`);
  }

  await tx.wait();
  return tx.hash;
}
