/**
 * API server: register protocol, monitoring status, alerts.
 */
import cors from "cors";
import express from "express";
import { monitorProtocol } from "../monitoring-service";
import type { Alert, ProtocolConfig, MonitoringSnapshot } from "../types";

const app = express();
app.use(cors());
app.use(express.json());

const protocols = new Map<string, ProtocolConfig>();
const alerts: Alert[] = [];
let alertCounter = 0;

// POST /protocol — Register protocol
app.post("/protocol", (req, res) => {
  const body = req.body as Partial<ProtocolConfig>;
  const protocolId = body.protocolId ?? `protocol-${Date.now()}`;
  const config: ProtocolConfig = {
    protocolId,
    name: body.name ?? "Unnamed",
    reserveWallets: body.reserveWallets ?? [],
    liabilitySource: body.liabilitySource ?? "token",
    tokenAddress: body.tokenAddress,
    minReserveRatio: body.minReserveRatio ?? 1.0,
    warningRatio: body.warningRatio ?? 1.1,
    criticalRatio: body.criticalRatio ?? 0.95,
    reserveMonitorContractAddress: body.reserveMonitorContractAddress,
    rpcUrl: body.rpcUrl,
  };
  protocols.set(protocolId, config);
  res.status(201).json(config);
});

// GET /protocols — List protocols
app.get("/protocols", (_req, res) => {
  res.json(Array.from(protocols.values()));
});

// GET /monitoring/:protocolId — Monitoring status
app.get("/monitoring/:protocolId", async (req, res) => {
  const config = protocols.get(req.params.protocolId);
  if (!config) {
    return res.status(404).json({ error: "Protocol not found" });
  }
  try {
    const result = await monitorProtocol(config);
    const snapshot: MonitoringSnapshot = {
      protocolId: config.protocolId,
      timestamp: new Date().toISOString(),
      reserves: result.reserves.toString(),
      liabilities: result.liabilities.toString(),
      reserveRatio: result.ratio,
      status: result.status,
    };
    res.json(snapshot);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// GET /alerts — All alerts (optional ?protocolId=)
app.get("/alerts", (req, res) => {
  const protocolId = req.query.protocolId as string | undefined;
  const list = protocolId
    ? alerts.filter((a) => a.protocolId === protocolId)
    : alerts;
  res.json(list);
});

// GET /alerts/:protocolId
app.get("/alerts/:protocolId", (req, res) => {
  const list = alerts.filter((a) => a.protocolId === req.params.protocolId);
  res.json(list);
});

// POST /alerts — Record alert (used by monitoring service / CRE workflow)
app.post("/alerts", (req, res) => {
  const { protocolId, severity, message, ratio } = req.body as {
    protocolId: string;
    severity: "warning" | "critical";
    message: string;
    ratio?: number;
  };
  if (!protocolId || !severity || !message) {
    return res.status(400).json({ error: "protocolId, severity, message required" });
  }
  const alert = triggerAlert(protocolId, severity, message, ratio);
  res.status(201).json(alert);
});

// Internal: record alert (used by monitoring / CRE)
export function triggerAlert(
  protocolId: string,
  severity: "warning" | "critical",
  message: string,
  ratio?: number
): Alert {
  const alert: Alert = {
    alertId: `alert-${++alertCounter}`,
    protocolId,
    type: "reserve_ratio",
    severity,
    timestamp: new Date().toISOString(),
    message,
    ratio,
  };
  alerts.push(alert);
  return alert;
}

const PORT = process.env.PORT ?? 3001;
app.listen(PORT, () => {
  console.log(`ProofSentinel API server listening on http://localhost:${PORT}`);
});
