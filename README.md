# ProofSentinel

Continuous Proof-of-Reserves monitoring powered by Chainlink CRE. Tracks reserve ratios in real-time, detects anomalies, and triggers on-chain safeguards automatically.

## Repo structure

```
proofsentinel/
├── contracts/             # ReserveMonitor.sol (Sepolia: 0xb80D...89B3)
├── backend/               # API server, monitoring, risk engine, safeguard service
├── cre-workflows/         # CRE workflow (cron → monitor → alert → on-chain pause)
├── db/                    # Prisma schema + client (PostgreSQL on Neon)
├── e2e-test/              # E2E test scripts (steps 1-7)
├── frontend/              # Next.js 14 dashboard
├── scripts/               # Standalone reserve/liability fetchers
├── merkle.md              # Merkle tree liability docs
└── architecture.md        # System architecture
```

## Deployed Contracts

| Network | Contract | Address |
|---|---|---|
| Sepolia | ReserveMonitor | `0xb80D135fb054ce3b27Ef67Eca016DBACff0F89B3` |

## Chainlink Integration

ProofSentinel uses **Chainlink CRE (Chainlink Runtime Environment)** to run decentralized monitoring on the DON (Decentralized Oracle Network). Below are all files that use Chainlink:

### CRE Workflow (core automation)

| File | Role |
|---|---|
| [`cre-workflows/monitoring-workflow/main.ts`](cre-workflows/monitoring-workflow/main.ts) | Main workflow — uses `CronCapability`, `ConfidentialHTTPClient`, `EVMClient` from `@chainlink/cre-sdk` to poll the backend, evaluate risk, and call `pauseWithdrawals()` on-chain |
| [`cre-workflows/monitoring-workflow/main.test.ts`](cre-workflows/monitoring-workflow/main.test.ts) | Unit tests — uses `@chainlink/cre-sdk/test` mocks (`newTestRuntime`, `ConfidentialHttpMock`) |
| [`cre-workflows/monitoring-workflow/package.json`](cre-workflows/monitoring-workflow/package.json) | Declares `@chainlink/cre-sdk` (^1.1.1) dependency |
| [`cre-workflows/monitoring-workflow/workflow.yaml`](cre-workflows/monitoring-workflow/workflow.yaml) | Workflow metadata and entry point paths |
| [`cre-workflows/monitoring-workflow/config.staging.json`](cre-workflows/monitoring-workflow/config.staging.json) | Staging config — 30s cron, Sepolia contract address |
| [`cre-workflows/monitoring-workflow/config.production.json`](cre-workflows/monitoring-workflow/config.production.json) | Production config — 5min cron |
| [`cre-workflows/project.yaml`](cre-workflows/project.yaml) | Shared RPC config (Sepolia testnet) |
| [`cre-workflows/README.md`](cre-workflows/README.md) | CRE deployment guide, DON setup, oracle role granting |

### Smart Contract (oracle access control)

| File | Role |
|---|---|
| [`contracts/src/ReserveMonitor.sol`](contracts/src/ReserveMonitor.sol) | On-chain contract with `oracles` mapping — CRE DON forwarder is granted oracle role to call `pauseWithdrawals()`, `unpauseWithdrawals()`, `emitReserveAlert()` |
| [`contracts/test/ReserveMonitor.test.ts`](contracts/test/ReserveMonitor.test.ts) | Tests oracle role management — `grantOracleRole()`, `revokeOracleRole()`, access control enforcement |

### Backend (safeguard execution)

| File | Role |
|---|---|
| [`backend/safeguard-service/index.ts`](backend/safeguard-service/index.ts) | Executes on-chain calls to `ReserveMonitor` — same contract interface the CRE DON uses |

### Documentation

| File | Role |
|---|---|
| [`architecture.md`](architecture.md) | System architecture describing CRE → backend → contract flow |

## Quick start

### 1. Backend

```bash
cd backend && bun install && bun run dev:api
```

API: http://localhost:3001

| Endpoint | Method | Description |
|---|---|---|
| `/protocol` | POST | Register protocol |
| `/protocols` | GET | List protocols |
| `/monitoring/:protocolId` | GET | Run monitoring check |
| `/monitoring/:protocolId/history` | GET | Snapshot history |
| `/alerts` | GET/POST | List or record alerts |
| `/alerts/:protocolId` | GET | Alerts for protocol |
| `/safeguard` | POST | Trigger on-chain safeguard |
| `/protocol/:id/merkle-tree` | PUT | Update Merkle tree data |
| `/protocol/:id/merkle-verify` | POST | Verify Merkle proof |

### 2. Database

```bash
cd db && bun install
bunx prisma generate --schema=prisma/schema.prisma
bunx prisma db push --schema=prisma/schema.prisma
```

### 3. Contracts

```bash
cd contracts && bun install && bunx hardhat test     # run tests
bunx hardhat run scripts/deploy.ts --network sepolia # redeploy
```

### 4. CRE Workflow

```bash
cd cre-workflows/monitoring-workflow && bun install

# simulate (start backend first)
cd cre-workflows && cre workflow simulate ./monitoring-workflow --target=staging-settings

# deploy (requires CRE early access)
cre workflow deploy ./monitoring-workflow --target=staging-settings
```

After deployment, grant oracle role to the DON forwarder:

```bash
cd contracts && bunx hardhat console --network sepolia
> const m = await ethers.getContractAt("ReserveMonitor", "0xb80D135fb054ce3b27Ef67Eca016DBACff0F89B3")
> await m.grantOracleRole("<forwarder-address>")
```

### 5. Frontend

```bash
cd frontend && bun install && bun run dev
```

http://localhost:3000

### 6. Tests

```bash
# e2e (start backend first)
cd e2e-test && bun install && bun run src/index.ts 1  # through 7

# contracts
cd contracts && bunx hardhat test

# cre workflow
cd cre-workflows/monitoring-workflow && bun test
```

## Liability Sources

| Source | How it works |
|---|---|
| `token` | Fetches `totalSupply()` from an ERC20 contract |
| `merkle` | Builds a Merkle tree from user liability leaves, sums balances — see [merkle.md](merkle.md) |
| `api` | Fetches liabilities from an external JSON API via configurable URL + JSON path |

## Tech stack

- **Contracts**: Solidity 0.8.19, Hardhat, Sepolia
- **Backend**: TypeScript, Express, ethers.js, Bun
- **Database**: PostgreSQL (Neon), Prisma ORM
- **CRE**: Chainlink CRE SDK, ConfidentialHTTPClient, EVMClient
- **Frontend**: Next.js 14, Radix UI, Recharts, Tailwind CSS
