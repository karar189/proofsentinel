/**
 * Step 4: Alert creation and retrieval
 *
 * Requires: backend API server running, protocol registered (step 2)
 */
import { post, get, assert, assertEq } from "./utils/index.ts";

async function main() {
  console.log("=== Step 4: Alerts ===\n");

  // Create a warning alert
  console.log("Creating warning alert...");
  const warning = await post("/alerts", {
    protocolId: "e2e-test",
    severity: "warning",
    message: "Reserve ratio below warning threshold",
    ratio: 1.05,
  });
  assert(warning.alertId.startsWith("alert-"), "warning alertId generated");
  assertEq(warning.severity, "warning", "severity is warning");
  assertEq(warning.protocolId, "e2e-test", "protocolId matches");

  // Create a critical alert
  console.log("\nCreating critical alert...");
  const critical = await post("/alerts", {
    protocolId: "e2e-test",
    severity: "critical",
    message: "Reserve ratio below critical threshold",
    ratio: 0.85,
  });
  assert(critical.alertId.startsWith("alert-"), "critical alertId generated");
  assertEq(critical.severity, "critical", "severity is critical");

  // 400 for missing fields
  console.log("\nChecking 400 for missing fields...");
  const badRes = await fetch(`${(await import("./utils/config.ts")).API_BASE_URL}/alerts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ protocolId: "e2e-test" }),
  });
  assertEq(badRes.status, 400, "missing fields → 400");

  // Get all alerts
  console.log("\nRetrieving all alerts...");
  const allAlerts = await get("/alerts");
  assert(Array.isArray(allAlerts), "alerts is array");
  assert(allAlerts.length >= 2, `found ${allAlerts.length} alerts`);

  // Get alerts by protocolId (query param)
  console.log("\nRetrieving alerts by query param...");
  const filtered = await get("/alerts?protocolId=e2e-test");
  assert(filtered.every((a: any) => a.protocolId === "e2e-test"), "all filtered alerts match protocolId");

  // Get alerts by path param
  console.log("\nRetrieving alerts by path param...");
  const byPath = await get("/alerts/e2e-test");
  assert(byPath.length >= 2, `found ${byPath.length} alerts for e2e-test`);

  // Empty result for unknown protocol
  const empty = await get("/alerts/nonexistent");
  assertEq(empty.length, 0, "unknown protocol → empty alerts");

  console.log("\nAll alert tests passed!");
}

main().catch(e => { console.error("FAILED:", e.message); process.exit(1); });
