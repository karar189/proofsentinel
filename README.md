# ProofSentinel

Continuous Proof-of-Reserves monitoring powered by Chainlink CRE. Tracks reserve ratios in real-time, detects anomalies, and triggers on-chain safeguards automatically.

## Repo structure

```
proofsentinel/
├── contracts/             # ReserveMonitor.sol (Sepolia: 0xb80D...89B3)
├── backend/               # API server, monitoring, risk engine, safeguard service
├── cre-workflows/         # CRE workflow (cron → monitor → alert → on-chain pause)
├── e2e-test/              # E2E test scripts
├── scripts/               # Standalone reserve/liability fetchers
└── dashboard/             # Next.js UI
```

## Deployed Contracts

| Network | Contract | Address |
|---|---|---|
| Sepolia | ReserveMonitor | `0xb80D135fb054ce3b27Ef67Eca016DBACff0F89B3` |

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
| `/alerts` | GET/POST | List or record alerts |
| `/alerts/:protocolId` | GET | Alerts for protocol |
| `/safeguard` | POST | Trigger on-chain safeguard |

### 2. Contracts

Deployed on Sepolia: `0xb80D135fb054ce3b27Ef67Eca016DBACff0F89B3`

```bash
cd contracts && bun install && bunx hardhat test     # run tests
bunx hardhat run scripts/deploy.ts --network sepolia # redeploy
```

### 3. CRE Workflow

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

### 4. Dashboard

```bash
cd dashboard && bun install && bun run dev
```

http://localhost:3000

### 5. Tests

```bash
# e2e (start backend first)
cd e2e-test && bun install && bun run src/index.ts 1  # through 6

# contracts
cd contracts && bunx hardhat test

# cre workflow
cd cre-workflows/monitoring-workflow && bun test
```

## Tech stack

- **Contracts**: Solidity 0.8.19, Hardhat, Sepolia
- **Backend**: TypeScript, Express, ethers.js, Bun
- **CRE**: Chainlink CRE SDK, ConfidentialHTTPClient, EVMClient
- **Dashboard**: Next.js 14
