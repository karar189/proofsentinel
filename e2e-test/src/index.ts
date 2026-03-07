/**
 * E2E test orchestrator
 *
 * Run individual steps:
 *   bun run src/01_risk_engine.ts
 *   bun run src/02_register_protocol.ts
 *   bun run src/03_monitoring_check.ts
 *   bun run src/04_alerts.ts
 *   bun run src/05_safeguard.ts
 *   bun run src/06_full_flow.ts
 *
 * Step 1 runs offline (no server needed).
 * Steps 2-6 require the backend API server running: cd backend && bun run dev:api
 */

const step = process.argv[2];

if (!step) {
  console.log("Usage: bun run src/index.ts <step>");
  console.log("");
  console.log("Steps:");
  console.log("  1  Risk engine pure function tests (offline)");
  console.log("  2  Register protocol via POST /protocol");
  console.log("  3  Monitoring endpoint check");
  console.log("  4  Alert creation and retrieval");
  console.log("  5  Safeguard endpoint validation");
  console.log("  6  Full integration flow (register → alert → safeguard)");
  console.log("");
  console.log("Step 1 runs offline. Steps 2-6 require: cd backend && bun run dev:api");
  process.exit(0);
}

const scripts: Record<string, string> = {
  "1": "./01_risk_engine.ts",
  "2": "./02_register_protocol.ts",
  "3": "./03_monitoring_check.ts",
  "4": "./04_alerts.ts",
  "5": "./05_safeguard.ts",
  "6": "./06_full_flow.ts",
};

const script = scripts[step];
if (!script) {
  console.error(`Unknown step: ${step}. Use 1-6.`);
  process.exit(1);
}

await import(script);
