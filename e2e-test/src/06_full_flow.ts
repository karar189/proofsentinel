/**
 * Step 6: Full flow — register → alerts → safeguard check
 *
 * Requires: backend API server running (clean state recommended)
 * This is a self-contained integration test that registers a fresh protocol.
 */
import { post, get, assert, assertEq, API_BASE_URL } from "./utils/index.ts";

async function main() {
  console.log("=== Step 6: Full Integration Flow ===\n");

  const protocolId = `flow-${Date.now()}`;

  // 1. Register
  console.log("1. Registering protocol...");
  const proto = await post("/protocol", {
    protocolId,
    name: "Full Flow Test",
    reserveWallets: ["0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"],
    liabilitySource: "token",
    tokenAddress: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    minReserveRatio: 1.0,
    warningRatio: 1.1,
    criticalRatio: 0.95,
  });
  assertEq(proto.protocolId, protocolId, "registered");

  // 2. Verify listed
  console.log("\n2. Verifying protocol listed...");
  const list = await get("/protocols");
  assert(list.some((p: any) => p.protocolId === protocolId), "found in list");

  // 3. Post warning alert
  console.log("\n3. Posting warning alert...");
  const warn = await post("/alerts", {
    protocolId,
    severity: "warning",
    message: "Reserve ratio dipping",
    ratio: 1.05,
  });
  assertEq(warn.severity, "warning", "warning alert created");

  // 4. Post critical alert
  console.log("\n4. Posting critical alert...");
  const crit = await post("/alerts", {
    protocolId,
    severity: "critical",
    message: "Reserve ratio critical",
    ratio: 0.8,
  });
  assertEq(crit.severity, "critical", "critical alert created");

  // 5. Verify alerts recorded
  console.log("\n5. Verifying alerts...");
  const alerts = await get(`/alerts/${protocolId}`);
  assertEq(alerts.length, 2, "2 alerts recorded");

  // 6. Safeguard validation (no contract configured)
  console.log("\n6. Safeguard validation...");
  const sgRes = await fetch(`${API_BASE_URL}/safeguard`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ protocolId, action: "pause_withdrawals" }),
  });
  assertEq(sgRes.status, 400, "safeguard blocked (no contract address)");

  // 7. Monitoring 404 for unknown
  console.log("\n7. Monitoring 404 check...");
  const mon404 = await fetch(`${API_BASE_URL}/monitoring/does-not-exist-${Date.now()}`);
  assertEq(mon404.status, 404, "unknown protocol → 404");

  console.log("\nFull integration flow passed!");
}

main().catch(e => { console.error("FAILED:", e.message); process.exit(1); });
