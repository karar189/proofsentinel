/**
 * API server: register protocol, monitoring status, alerts, safeguards.
 * Persists data to PostgreSQL via Prisma, with in-memory fallback.
 */
import cors from "cors";
import express from "express";
import { monitorProtocol } from "../monitoring-service";
import { executeSafeguard } from "../safeguard-service";
import { buildMerkleTree, generateProof, verifyProof, processLiabilities } from "../merkle-service";
import type { Alert, ProtocolConfig, MonitoringSnapshot, SafeguardAction } from "../types";
import type { LiabilityLeaf } from "../merkle-service";
import { prisma } from "../../db";

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

let alertCounter = 0;

// Helper: convert DB Protocol row to ProtocolConfig
function toProtocolConfig(row: any): ProtocolConfig {
  return {
    protocolId: row.protocolId,
    name: row.name,
    reserveWallets: row.reserveWallets,
    liabilitySource: row.liabilitySource as ProtocolConfig["liabilitySource"],
    tokenAddress: row.tokenAddress ?? undefined,
    tokenDecimals: row.tokenDecimals,
    tokenSymbol: row.tokenSymbol ?? undefined,
    minReserveRatio: row.minReserveRatio,
    warningRatio: row.warningRatio,
    criticalRatio: row.criticalRatio,
    reserveMonitorContractAddress: row.reserveMonitorContractAddress ?? undefined,
    rpcUrl: row.rpcUrl ?? undefined,
    merkleRoot: row.merkleRoot ?? undefined,
    merkleTreeData: (row.merkleTreeData as LiabilityLeaf[]) ?? undefined,
    liabilityApiUrl: row.liabilityApiUrl ?? undefined,
    liabilityApiPath: row.liabilityApiPath ?? undefined,
  };
}

// POST /protocol — Register protocol
app.post("/protocol", async (req, res) => {
  const body = req.body as Partial<ProtocolConfig>;
  const protocolId = body.protocolId ?? `protocol-${Date.now()}`;

  // If merkle source, build tree and compute root
  let merkleRoot: string | undefined;
  let merkleTreeData: LiabilityLeaf[] | undefined;
  if (body.liabilitySource === "merkle" && body.merkleTreeData) {
    const result = processLiabilities(body.merkleTreeData);
    merkleRoot = result.root;
    merkleTreeData = body.merkleTreeData;
  }

  try {
    const row = await prisma.protocol.upsert({
      where: { protocolId },
      update: {
        name: body.name ?? "Unnamed",
        reserveWallets: body.reserveWallets ?? [],
        liabilitySource: body.liabilitySource ?? "token",
        tokenAddress: body.tokenAddress ?? null,
        tokenDecimals: body.tokenDecimals ?? 18,
        tokenSymbol: body.tokenSymbol ?? null,
        minReserveRatio: body.minReserveRatio ?? 1.0,
        warningRatio: body.warningRatio ?? 1.1,
        criticalRatio: body.criticalRatio ?? 0.95,
        reserveMonitorContractAddress: body.reserveMonitorContractAddress ?? null,
        rpcUrl: body.rpcUrl ?? null,
        merkleRoot: merkleRoot ?? null,
        merkleTreeData: merkleTreeData ? (merkleTreeData as any) : undefined,
        liabilityApiUrl: body.liabilityApiUrl ?? null,
        liabilityApiPath: body.liabilityApiPath ?? null,
      },
      create: {
        protocolId,
        name: body.name ?? "Unnamed",
        reserveWallets: body.reserveWallets ?? [],
        liabilitySource: body.liabilitySource ?? "token",
        tokenAddress: body.tokenAddress ?? null,
        tokenDecimals: body.tokenDecimals ?? 18,
        tokenSymbol: body.tokenSymbol ?? null,
        minReserveRatio: body.minReserveRatio ?? 1.0,
        warningRatio: body.warningRatio ?? 1.1,
        criticalRatio: body.criticalRatio ?? 0.95,
        reserveMonitorContractAddress: body.reserveMonitorContractAddress ?? null,
        rpcUrl: body.rpcUrl ?? null,
        merkleRoot: merkleRoot ?? null,
        merkleTreeData: merkleTreeData ? (merkleTreeData as any) : null,
        liabilityApiUrl: body.liabilityApiUrl ?? null,
        liabilityApiPath: body.liabilityApiPath ?? null,
      },
    });

    res.status(201).json(toProtocolConfig(row));
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// GET /protocols — List protocols
app.get("/protocols", async (_req, res) => {
  try {
    const rows = await prisma.protocol.findMany({ orderBy: { createdAt: "desc" } });
    res.json(rows.map(toProtocolConfig));
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// GET /monitoring/:protocolId — Monitoring status
app.get("/monitoring/:protocolId", async (req, res) => {
  try {
    const row = await prisma.protocol.findUnique({
      where: { protocolId: req.params.protocolId },
    });
    if (!row) {
      return res.status(404).json({ error: "Protocol not found" });
    }

    const config = toProtocolConfig(row);
    const result = await monitorProtocol(config);

    const snapshot: MonitoringSnapshot = {
      protocolId: config.protocolId,
      timestamp: new Date().toISOString(),
      reserves: result.reserves.toString(),
      liabilities: result.liabilities.toString(),
      reserveRatio: result.ratio,
      status: result.status,
    };

    // Persist snapshot
    await prisma.monitoringSnapshot.create({
      data: {
        protocolId: config.protocolId,
        reserves: snapshot.reserves,
        liabilities: snapshot.liabilities,
        reserveRatio: snapshot.reserveRatio,
        status: snapshot.status,
      },
    });

    res.json(snapshot);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// GET /monitoring/:protocolId/history — Snapshot history
app.get("/monitoring/:protocolId/history", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const snapshots = await prisma.monitoringSnapshot.findMany({
      where: { protocolId: req.params.protocolId },
      orderBy: { timestamp: "desc" },
      take: limit,
    });
    res.json(snapshots);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// GET /alerts — All alerts (optional ?protocolId=)
app.get("/alerts", async (req, res) => {
  try {
    const protocolId = req.query.protocolId as string | undefined;
    const alerts = await prisma.alert.findMany({
      where: protocolId ? { protocolId } : undefined,
      orderBy: { timestamp: "desc" },
    });
    res.json(alerts.map((a) => ({
      alertId: a.alertId,
      protocolId: a.protocolId,
      type: a.type,
      severity: a.severity,
      timestamp: a.timestamp.toISOString(),
      message: a.message,
      ratio: a.ratio,
    })));
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// GET /alerts/:protocolId
app.get("/alerts/:protocolId", async (req, res) => {
  try {
    const alerts = await prisma.alert.findMany({
      where: { protocolId: req.params.protocolId },
      orderBy: { timestamp: "desc" },
    });
    res.json(alerts.map((a) => ({
      alertId: a.alertId,
      protocolId: a.protocolId,
      type: a.type,
      severity: a.severity,
      timestamp: a.timestamp.toISOString(),
      message: a.message,
      ratio: a.ratio,
    })));
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// POST /alerts — Record alert
app.post("/alerts", async (req, res) => {
  const { protocolId, severity, message, ratio } = req.body as {
    protocolId: string;
    severity: "warning" | "critical";
    message: string;
    ratio?: number;
  };
  if (!protocolId || !severity || !message) {
    return res.status(400).json({ error: "protocolId, severity, message required" });
  }
  try {
    const alertId = `alert-${++alertCounter}-${Date.now()}`;
    const alert = await prisma.alert.create({
      data: {
        alertId,
        protocolId,
        type: "reserve_ratio",
        severity,
        message,
        ratio: ratio ?? null,
      },
    });
    res.status(201).json({
      alertId: alert.alertId,
      protocolId: alert.protocolId,
      type: alert.type,
      severity: alert.severity,
      timestamp: alert.timestamp.toISOString(),
      message: alert.message,
      ratio: alert.ratio,
    });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// PUT /protocol/:protocolId/merkle-tree — Update Merkle tree data
app.put("/protocol/:protocolId/merkle-tree", async (req, res) => {
  const { leaves } = req.body as { leaves: LiabilityLeaf[] };
  if (!leaves || !Array.isArray(leaves) || leaves.length === 0) {
    return res.status(400).json({ error: "leaves array required (each: { userId, balance })" });
  }

  try {
    const row = await prisma.protocol.findUnique({
      where: { protocolId: req.params.protocolId },
    });
    if (!row) {
      return res.status(404).json({ error: "Protocol not found" });
    }

    const result = processLiabilities(leaves);

    const updated = await prisma.protocol.update({
      where: { protocolId: req.params.protocolId },
      data: {
        merkleRoot: result.root,
        merkleTreeData: leaves as any,
        liabilitySource: "merkle",
      },
    });

    res.json({
      protocolId: updated.protocolId,
      merkleRoot: result.root,
      totalLiabilities: result.totalLiabilities.toString(),
      leafCount: leaves.length,
    });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// POST /protocol/:protocolId/merkle-verify — Verify a user's inclusion in the Merkle tree
app.post("/protocol/:protocolId/merkle-verify", async (req, res) => {
  const { userId, balance, proof } = req.body as {
    userId: string;
    balance: string;
    proof: string[];
  };

  if (!userId || !balance || !proof) {
    return res.status(400).json({ error: "userId, balance, and proof required" });
  }

  try {
    const row = await prisma.protocol.findUnique({
      where: { protocolId: req.params.protocolId },
    });
    if (!row || !row.merkleRoot) {
      return res.status(404).json({ error: "Protocol not found or no Merkle root set" });
    }

    const leaf: LiabilityLeaf = { userId, balance };
    const valid = verifyProof(leaf, proof, row.merkleRoot);

    res.json({ valid, userId, merkleRoot: row.merkleRoot });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// POST /safeguard — Execute on-chain safeguard action
app.post("/safeguard", async (req, res) => {
  const { protocolId, action, ratio } = req.body as {
    protocolId: string;
    action: SafeguardAction;
    ratio?: number;
  };

  if (!protocolId || !action) {
    return res.status(400).json({ error: "protocolId and action required" });
  }

  try {
    const row = await prisma.protocol.findUnique({
      where: { protocolId },
    });
    if (!row) {
      return res.status(404).json({ error: "Protocol not found" });
    }

    const config = toProtocolConfig(row);

    if (!config.reserveMonitorContractAddress || !config.rpcUrl) {
      return res.status(400).json({ error: "Protocol missing reserveMonitorContractAddress or rpcUrl" });
    }

    const txHash = await executeSafeguard(
      config.rpcUrl,
      config.reserveMonitorContractAddress,
      action,
      ratio
    );
    res.json({ protocolId, action, txHash, status: "executed" });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Internal: record alert (used by monitoring / CRE)
export async function triggerAlert(
  protocolId: string,
  severity: "warning" | "critical",
  message: string,
  ratio?: number
): Promise<Alert> {
  const alertId = `alert-${++alertCounter}-${Date.now()}`;
  const alert = await prisma.alert.create({
    data: {
      alertId,
      protocolId,
      type: "reserve_ratio",
      severity,
      message,
      ratio: ratio ?? null,
    },
  });
  return {
    alertId: alert.alertId,
    protocolId: alert.protocolId,
    type: alert.type,
    severity: alert.severity as "warning" | "critical",
    timestamp: alert.timestamp.toISOString(),
    message: alert.message,
    ratio: alert.ratio ?? undefined,
  };
}

export default app;
