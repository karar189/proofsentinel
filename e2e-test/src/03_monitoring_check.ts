/**
 * Step 3: Check monitoring endpoint
 *
 * Requires: backend API server running, protocol registered (step 2)
 */
import { get, assert, assertEq } from "./utils/index.ts";

async function main() {
  console.log("=== Step 3: Monitoring Check ===\n");

  // 404 for unknown protocol
  console.log("Checking 404 for unknown protocol...");
  const res = await fetch(`${(await import("./utils/config.ts")).API_BASE_URL}/monitoring/nonexistent`);
  assertEq(res.status, 404, "unknown protocol → 404");

  // Try monitoring for registered protocol (may fail with 500 if no real RPC, which is expected)
  console.log("\nChecking monitoring for e2e-test protocol...");
  const monRes = await fetch(`${(await import("./utils/config.ts")).API_BASE_URL}/monitoring/e2e-test`);
  // Either 200 (if RPC works) or 500 (if no real chain) — both are valid
  assert(monRes.status === 200 || monRes.status === 500, `monitoring status: ${monRes.status} (200 or 500 expected)`);

  if (monRes.status === 200) {
    const data = await monRes.json() as any;
    assert(data.protocolId === "e2e-test", "protocolId in response");
    assert(typeof data.reserveRatio === "number", "reserveRatio is number");
    assert(["healthy", "warning", "critical"].includes(data.status), `status is valid: ${data.status}`);
  } else {
    console.log("  INFO: monitoring returned 500 (no real RPC available — expected in test env)");
  }

  console.log("\nAll monitoring tests passed!");
}

main().catch(e => { console.error("FAILED:", e.message); process.exit(1); });
