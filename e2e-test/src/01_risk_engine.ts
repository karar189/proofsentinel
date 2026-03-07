/**
 * Step 1: Risk engine pure function tests
 *
 * No backend needed — tests computeReserveRatio, evaluateRisk, shouldTriggerSafeguard directly.
 */
import { computeReserveRatio, evaluateRisk, shouldTriggerSafeguard } from "../../backend/risk-engine/index.ts";
import { assert, assertEq } from "./utils/index.ts";

async function main() {
  console.log("=== Step 1: Risk Engine Tests ===\n");

  // computeReserveRatio
  console.log("-- computeReserveRatio --");
  assertEq(computeReserveRatio(1000n, 0n), 0, "0 liabilities → 0");
  assertEq(computeReserveRatio(1000n, 1000n), 1, "equal reserves/liabilities → 1");
  assertEq(computeReserveRatio(2000n, 1000n), 2, "2x reserves → 2");
  assertEq(computeReserveRatio(500n, 1000n), 0.5, "half reserves → 0.5");

  // evaluateRisk
  console.log("\n-- evaluateRisk --");
  const thresholds = { minReserveRatio: 1.0, warningRatio: 1.1, criticalRatio: 0.95 };
  assertEq(evaluateRisk(1.2, thresholds), "healthy", "1.2 → healthy");
  assertEq(evaluateRisk(1.1, thresholds), "healthy", "1.1 (at warning threshold) → healthy");
  assertEq(evaluateRisk(1.0, thresholds), "warning", "1.0 → warning");
  assertEq(evaluateRisk(0.95, thresholds), "warning", "0.95 (at critical threshold) → warning");
  assertEq(evaluateRisk(0.9, thresholds), "critical", "0.9 → critical");

  // shouldTriggerSafeguard
  console.log("\n-- shouldTriggerSafeguard --");
  assertEq(shouldTriggerSafeguard(0.9, 0.95), true, "0.9 < 0.95 → true");
  assertEq(shouldTriggerSafeguard(1.0, 0.95), false, "1.0 >= 0.95 → false");
  assertEq(shouldTriggerSafeguard(0.95, 0.95), false, "0.95 = 0.95 → false");

  console.log("\nAll risk engine tests passed!");
}

main().catch(e => { console.error("FAILED:", e.message); process.exit(1); });
