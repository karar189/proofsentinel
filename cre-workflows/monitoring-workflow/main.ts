/**
 * ProofSentinel CRE Monitoring Workflow
 *
 * Trigger: Cron (every 5 min in production, every 30s in staging for testing)
 * 1. GET backend /monitoring/:protocolId → reserves, liabilities, reserveRatio, status
 * 2. If status === "warning"  → POST /alerts with severity "warning"
 * 3. If status === "critical" → POST /alerts + on-chain pauseWithdrawals via EVMClient
 *
 * CRE runs this on the DON; the backend does the actual reserve/liability fetching.
 */
import {
  type CronPayload,
  cre,
  Runner,
  type Runtime,
  ok,
  json,
  encodeCallMsg,
  getNetwork,
  bytesToHex,
  LAST_FINALIZED_BLOCK_NUMBER,
} from "@chainlink/cre-sdk";
import {
  encodeFunctionData,
  decodeFunctionResult,
  zeroAddress,
  type Address,
} from "viem";

// ── Config ──────────────────────────────────────────

export type Config = {
  schedule: string;
  apiBaseUrl: string;
  protocolId: string;
  evm?: {
    chainSelectorName: string;
    reserveMonitorAddress: string;
  };
};

// ── Types ───────────────────────────────────────────

type MonitoringSnapshot = {
  protocolId: string;
  timestamp: string;
  reserves: string;
  liabilities: string;
  reserveRatio: number;
  status: "healthy" | "warning" | "critical";
};

type WorkflowResult = {
  status: string;
  reserveRatio: number;
  alertSent: boolean;
  safeguardTriggered: boolean;
};

// ── Contract ABI ────────────────────────────────────

const ReserveMonitorABI = [
  {
    name: "pauseWithdrawals",
    type: "function" as const,
    stateMutability: "nonpayable" as const,
    inputs: [],
    outputs: [],
  },
  {
    name: "withdrawalsPaused",
    type: "function" as const,
    stateMutability: "view" as const,
    inputs: [],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
  },
] as const;

// ── Helpers ─────────────────────────────────────────

function postAlert(
  confClient: InstanceType<typeof cre.capabilities.ConfidentialHTTPClient>,
  runtime: Runtime<Config>,
  severity: "warning" | "critical",
  message: string,
  ratio: number
): void {
  const config = runtime.config;
  const alertsUrl = `${config.apiBaseUrl.replace(/\/$/, "")}/alerts`;
  const body = JSON.stringify({
    protocolId: config.protocolId,
    severity,
    message,
    ratio,
  });

  const resp = confClient.sendRequest(runtime, {
    vaultDonSecrets: [],
    request: {
      url: alertsUrl,
      method: "POST",
      multiHeaders: {
        "content-type": { values: ["application/json"] },
      },
      bodyString: body,
    },
  }).result();

  if (!ok(resp)) {
    runtime.log(`POST /alerts failed: status=${resp.statusCode}`);
  }
}

// ── CRE handler ─────────────────────────────────────

export const onCronTrigger = (runtime: Runtime<Config>, _payload: CronPayload): WorkflowResult => {
  const config = runtime.config;
  const monitoringUrl = `${config.apiBaseUrl.replace(/\/$/, "")}/monitoring/${encodeURIComponent(config.protocolId)}`;

  runtime.log(`Fetching monitoring: ${monitoringUrl}`);

  const confClient = new cre.capabilities.ConfidentialHTTPClient();

  // 1. GET monitoring snapshot
  const monResp = confClient.sendRequest(runtime, {
    vaultDonSecrets: [],
    request: {
      url: monitoringUrl,
      method: "GET",
      multiHeaders: {},
    },
  }).result();

  if (!ok(monResp)) {
    runtime.log(`Monitoring API failed: ${monResp.statusCode}`);
    return { status: "error", reserveRatio: 0, alertSent: false, safeguardTriggered: false };
  }

  const snapshot = json(monResp) as MonitoringSnapshot;
  runtime.log(`Reserve ratio: ${snapshot.reserveRatio}, status: ${snapshot.status}`);

  let alertSent = false;
  let safeguardTriggered = false;

  // 2. Warning alert
  if (snapshot.status === "warning") {
    postAlert(confClient, runtime, "warning", "Reserve ratio below warning threshold (CRE workflow)", snapshot.reserveRatio);
    alertSent = true;
    runtime.log("Warning alert sent to backend");
  }

  // 3. Critical alert + on-chain safeguard
  if (snapshot.status === "critical") {
    postAlert(confClient, runtime, "critical", "Reserve ratio below critical threshold (CRE workflow)", snapshot.reserveRatio);
    alertSent = true;
    runtime.log("Critical alert sent to backend");

    // On-chain safeguard: pause withdrawals via EVMClient
    if (config.evm) {
      runtime.log(`Triggering on-chain safeguard on ${config.evm.chainSelectorName}`);

      const net = getNetwork({
        chainFamily: "evm",
        chainSelectorName: config.evm.chainSelectorName,
        isTestnet: config.evm.chainSelectorName.includes("testnet"),
      });
      if (!net) {
        runtime.log(`Network not found: ${config.evm.chainSelectorName}`);
        return { status: snapshot.status, reserveRatio: snapshot.reserveRatio, alertSent, safeguardTriggered };
      }

      const evmClient = new cre.capabilities.EVMClient(net.chainSelector.selector);
      const contractAddr = config.evm.reserveMonitorAddress as Address;

      // Encode pauseWithdrawals() call
      const callData = encodeFunctionData({
        abi: ReserveMonitorABI,
        functionName: "pauseWithdrawals",
      });

      // Read current pause state first (optional safety check)
      let isPaused = false;
      try {
        const readData = encodeFunctionData({
          abi: ReserveMonitorABI,
          functionName: "withdrawalsPaused",
        });
        const readResp = evmClient
          .callContract(runtime, {
            call: encodeCallMsg({ from: zeroAddress, to: contractAddr, data: readData }),
            blockNumber: LAST_FINALIZED_BLOCK_NUMBER,
          })
          .result();

        isPaused = decodeFunctionResult({
          abi: ReserveMonitorABI,
          functionName: "withdrawalsPaused",
          data: bytesToHex(readResp.data),
        }) as boolean;
      } catch (_) {
        runtime.log("Could not read withdrawalsPaused state, proceeding with pause");
      }

      if (isPaused) {
        runtime.log("Withdrawals already paused, skipping on-chain call");
      } else {
        // Write: pause withdrawals
        evmClient
          .callContract(runtime, {
            call: encodeCallMsg({ from: zeroAddress, to: contractAddr, data: callData }),
            blockNumber: LAST_FINALIZED_BLOCK_NUMBER,
          })
          .result();

        runtime.log("On-chain pauseWithdrawals triggered");
      }

      safeguardTriggered = true;
    }
  }

  return {
    status: snapshot.status,
    reserveRatio: snapshot.reserveRatio,
    alertSent,
    safeguardTriggered,
  };
};

// ── Workflow init ───────────────────────────────────

export const initWorkflow = (config: Config) => {
  const cron = new cre.capabilities.CronCapability();
  return [cre.handler(cron.trigger({ schedule: config.schedule }), onCronTrigger)];
};

export async function main() {
  const runner = await Runner.newRunner<Config>();
  await runner.run(initWorkflow);
}
