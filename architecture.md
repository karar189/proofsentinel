# ProofSentinel Architecture

Continuous solvency risk monitor that reduces the detection gap between periodic Proof-of-Reserve audits.

## System Architecture

```
                          +---------------------+
                          |   Dashboard (Next.js)|
                          |   localhost:3000     |
                          +----------+----------+
                                     |
                         polls GET /protocols
                         GET /monitoring/:id
                         GET /alerts
                                     |
                          +----------v----------+
  +----------------+     |   Backend API        |         +---------------------+
  | CRE Workflow   |cron |   (Express :3001)    |         | On-Chain (ethers.js)|
  | (Chainlink DON)+---->|                      +-------->| balanceOf/getBalance|
  |                | GET |  monitoring-service   |<--------| totalSupply         |
  |                | /monitoring/:id             |         +---------------------+
  |                |     |  risk-engine          |
  |                |POST |  safeguard-service    |         +---------------------+
  |                +---->|                       +-------->| ReserveMonitor.sol  |
  |  EVMClient     | /alerts                    |         | pauseWithdrawals()  |
  |  callContract  |     +---------------------+|         | emitReserveAlert()  |
  +-------+--------+     | POST /safeguard      |-------->| pauseDeposits()     |
          |               +---------------------+         +---------------------+
          |                                                  Sepolia: 0xb80D135
          +--- on critical: pauseWithdrawals() via DON       fb054ce3b27Ef67Ec
                                                             a016DBACff0F89B3
```

## Component Breakdown

### CRE Workflow (`cre-workflows/monitoring-workflow/main.ts`)

Chainlink CRE SDK workflow running on the DON. Cron-triggered.

1. `GET /monitoring/{protocolId}` via `ConfidentialHTTPClient`
2. If `status === "warning"`: `POST /alerts` with severity warning
3. If `status === "critical"`: `POST /alerts` + on-chain `pauseWithdrawals()` via `EVMClient.callContract`
4. Reads `withdrawalsPaused()` state before writing (skips if already paused)

Uses `cre.capabilities.*` namespace, `getNetwork()`, `encodeCallMsg()`, `encodeFunctionData()` from viem.

Exported `onCronTrigger` and `initWorkflow` for unit testing with `ConfidentialHttpMock` from `@chainlink/cre-sdk/test`.

### Smart Contract (`contracts/src/ReserveMonitor.sol`)

Solidity ^0.8.19. Deployed on Sepolia: `0xb80D135fb054ce3b27Ef67Eca016DBACff0F89B3`

Role-based access control:
- **Admin-only**: `grantOracleRole`, `revokeOracleRole`, `pauseDeposits`, `unpauseDeposits`
- **Admin OR Oracle**: `pauseWithdrawals`, `unpauseWithdrawals`, `emitReserveAlert`

Oracle role is intended for the CRE DON forwarder address (granted after workflow deployment).

### Backend API (`backend/api-server/app.ts`)

Express server on port 3001. In-memory storage (Map + array).

| Endpoint | Method | Description |
|---|---|---|
| `/protocol` | POST | Register a protocol config |
| `/protocols` | GET | List all registered protocols |
| `/monitoring/:protocolId` | GET | Run monitoring check, return snapshot |
| `/alerts` | GET | List alerts (optional `?protocolId=` filter) |
| `/alerts/:protocolId` | GET | List alerts for a specific protocol |
| `/alerts` | POST | Record an alert (used by CRE workflow) |
| `/safeguard` | POST | Execute on-chain safeguard action |

`app.ts` exports the Express app (for testing). `index.ts` is the thin listener wrapper.

### Safeguard Service (`backend/safeguard-service/index.ts`)

`executeSafeguard(rpcUrl, contractAddress, action, ratio?)` — calls ReserveMonitor contract methods via `ethers.Wallet`.

| Action | Contract Method |
|---|---|
| `pause_withdrawals` | `pauseWithdrawals()` |
| `pause_deposits` | `pauseDeposits()` |
| `emit_alert` | `emitReserveAlert(ratio * 10000)` |

### Monitoring Service (`backend/monitoring-service/index.ts`)

Fetches on-chain data via `ethers.js`:
- **Reserves**: `ERC20.balanceOf(wallet)` or native `getBalance(wallet)` across all reserve wallets
- **Liabilities**: `ERC20.totalSupply()` (when `liabilitySource === "token"`)

Returns `MonitorResult { reserves, liabilities, ratio, status, shouldTriggerSafeguard }`.

### Risk Engine (`backend/risk-engine/index.ts`)

Pure functions:
- `computeReserveRatio(reserves, liabilities)` — 0 if liabilities is 0
- `evaluateRisk(ratio, thresholds)` — `"critical"` / `"warning"` / `"healthy"`
- `shouldTriggerSafeguard(ratio, criticalRatio)` — true if ratio < criticalRatio

### Dashboard (`dashboard/`)

Next.js 14 (App Router). Connects to backend via `NEXT_PUBLIC_API_URL`.

## Data Flow

```
1. User registers protocol → POST /protocol → stored in memory

2. CRE cron fires (5 min prod / 30s staging)
   → GET /monitoring/:protocolId

3. Backend fetches on-chain reserves + liabilities via ethers.js

4. Risk engine evaluates ratio against thresholds

5. Backend returns snapshot { protocolId, reserveRatio, status }

6. CRE workflow:
   - warning → POST /alerts (severity: warning)
   - critical → POST /alerts (severity: critical)
                + EVMClient.callContract → pauseWithdrawals() on Sepolia

7. Dashboard polls GET /protocols, GET /monitoring/:id, GET /alerts
```

## Config & Environment

### CRE Workflows

| File | Purpose |
|---|---|
| `cre-workflows/project.yaml` | Shared RPC config (Sepolia + Arbitrum) |
| `cre-workflows/monitoring-workflow/workflow.yaml` | Workflow paths and names |
| `cre-workflows/monitoring-workflow/config.staging.json` | 30s schedule, localhost API, demo protocol |
| `cre-workflows/monitoring-workflow/config.production.json` | 5 min schedule, production API |
| `cre-workflows/.env` | `CRE_ETH_PRIVATE_KEY` for simulation/deployment |

### Backend

| Env Var | Default | Description |
|---|---|---|
| `PORT` | `3001` | API server port |
| `DEPLOYER_PRIVATE_KEY` | — | Wallet key for safeguard service |

### Contracts

| Env Var | Description |
|---|---|
| `DEPLOYER_PRIVATE_KEY` | Wallet key for deployment |
| `SEPOLIA_RPC_URL` | Sepolia RPC endpoint |

## Types (`backend/types.ts`)

```typescript
ProtocolConfig {
  protocolId, name, reserveWallets[], liabilitySource,
  tokenAddress?, minReserveRatio, warningRatio, criticalRatio,
  reserveMonitorContractAddress?, rpcUrl?
}

MonitoringSnapshot {
  protocolId, timestamp, reserves, liabilities, reserveRatio, status
}

Alert {
  alertId, protocolId, type, severity, timestamp, message, ratio?
}

SafeguardAction = "pause_withdrawals" | "pause_deposits" | "emit_alert"
```
