# Tests

## E2E (requires backend running)

```bash
cd backend && bun run dev:api          # terminal 1
cd e2e-test && bun install             # terminal 2
bun run src/index.ts 1                 # risk engine (offline)
bun run src/index.ts 2                 # register protocol
bun run src/index.ts 3                 # monitoring
bun run src/index.ts 4                 # alerts
bun run src/index.ts 5                 # safeguard
bun run src/index.ts 6                 # full flow
```

## Contracts

```bash
cd contracts && bun install && bunx hardhat test
```

## CRE Workflow

```bash
cd cre-workflows/monitoring-workflow && bun install && bun test
```

## CRE Simulation (requires backend running)

```bash
cd cre-workflows && cre workflow simulate ./monitoring-workflow --target=staging-settings
```
