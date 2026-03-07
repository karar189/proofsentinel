/**
 * Step 5: Safeguard endpoint validation
 *
 * Requires: backend API server running, protocol registered (step 2)
 * Tests validation paths only — no real contract call (no contract address configured)
 */
import { post, assert, assertEq, API_BASE_URL } from "./utils/index.ts";

async function main() {
  console.log("=== Step 5: Safeguard Endpoint ===\n");

  // 400 for missing fields
  console.log("Checking 400 for missing fields...");
  const badRes = await fetch(`${API_BASE_URL}/safeguard`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  assertEq(badRes.status, 400, "empty body → 400");

  // 404 for unknown protocol
  console.log("\nChecking 404 for unknown protocol...");
  const notFound = await fetch(`${API_BASE_URL}/safeguard`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ protocolId: "nonexistent", action: "pause_withdrawals" }),
  });
  assertEq(notFound.status, 404, "unknown protocol → 404");

  // 400 for protocol without contract address
  console.log("\nChecking 400 for protocol without contract address...");
  const noContract = await fetch(`${API_BASE_URL}/safeguard`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ protocolId: "e2e-test", action: "pause_withdrawals" }),
  });
  assertEq(noContract.status, 400, "no contract address → 400");
  const body = await noContract.json() as any;
  assert(body.error.includes("reserveMonitorContractAddress"), "error mentions missing contract address");

  console.log("\nAll safeguard validation tests passed!");
}

main().catch(e => { console.error("FAILED:", e.message); process.exit(1); });
