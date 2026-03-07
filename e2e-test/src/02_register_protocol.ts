/**
 * Step 2: Register a protocol via POST /protocol
 *
 * Requires: backend API server running on localhost:3001
 */
import { post, get, assert, assertEq } from "./utils/index.ts";

async function main() {
  console.log("=== Step 2: Register Protocol ===\n");

  // Register a test protocol
  console.log("Registering test protocol...");
  const protocol = await post("/protocol", {
    protocolId: "e2e-test",
    name: "E2E Test Protocol",
    reserveWallets: ["0x1111111111111111111111111111111111111111"],
    liabilitySource: "token",
    tokenAddress: "0x2222222222222222222222222222222222222222",
    minReserveRatio: 1.0,
    warningRatio: 1.1,
    criticalRatio: 0.95,
  });
  assertEq(protocol.protocolId, "e2e-test", "protocolId matches");
  assertEq(protocol.name, "E2E Test Protocol", "name matches");

  // Register a protocol without explicit ID
  console.log("\nRegistering auto-ID protocol...");
  const autoProto = await post("/protocol", { name: "Auto ID Protocol" });
  assert(autoProto.protocolId.startsWith("protocol-"), "auto-generated protocolId");

  // List protocols
  console.log("\nListing protocols...");
  const list = await get("/protocols");
  assert(Array.isArray(list), "protocols is array");
  assert(list.length >= 2, `found ${list.length} protocols`);
  const found = list.find((p: any) => p.protocolId === "e2e-test");
  assert(!!found, "e2e-test protocol found in list");

  console.log("\nAll register tests passed!");
}

main().catch(e => { console.error("FAILED:", e.message); process.exit(1); });
