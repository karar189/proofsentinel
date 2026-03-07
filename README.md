# ProofSentinel

Continuous Proof-of-Reserves monitoring: track reserve ratios, detect anomalies, trigger safeguards via Chainlink CRE.

## Repo structure

```
proofsentinel/
├── contracts/          # ReserveMonitor.sol — safeguards (pause, emit alert)
├── backend/            # API server, monitoring service, risk engine
├── cre-workflows/      # CRE workflow YAML (trigger → fetch → compute → safeguard)
├── scripts/            # fetch-reserves.ts, fetch-liabilities.ts, demo
└── dashboard/          # Next.js UI — protocol, monitoring, alerts
```

## Quick start

### 1. Backend (API + logic)

```bash
cd proofsentinel/backend
npm install
npm run api
```

API: http://localhost:3001  
Endpoints: `POST /protocol`, `GET /protocols`, `GET /monitoring/:protocolId`, `GET /alerts`, `POST /alerts`

### 2. Dashboard (Next.js)

```bash
cd proofsentinel/dashboard
npm install
npm run dev
```

Dashboard: http://localhost:3000  
Pages: `/`, `/protocol`, `/monitoring`, `/alerts`

### 3. Scripts (reserves / liabilities)

```bash
cd proofsentinel/scripts
npm install
# Reserves (native ETH):
RESERVE_WALLETS=0x...,0x... npx ts-node fetch-reserves.ts
# Reserves (ERC20):
RESERVE_WALLETS=0x...,0x... TOKEN_ADDRESS=0x... npx ts-node fetch-reserves.ts
# Liabilities (token totalSupply):
TOKEN_ADDRESS=0x... npx ts-node fetch-liabilities.ts
```

### 4. CRE workflow (orchestration)

CRE runs the monitoring loop and posts alerts to your backend.

- **Runnable workflow:** TypeScript in `cre-workflows/monitoring-workflow/` (cron → GET /monitoring → if critical, POST /alerts).
- **Setup:** See [cre-workflows/README.md](cre-workflows/README.md) for config, `bun install`, simulate (`cre workflow simulate monitoring-workflow --target staging-settings`), and deploy.
- **Conceptual YAML:** `cre-workflows/monitoring-workflow.yaml` is reference only; the real integration is the TS workflow above.

### 5. Demo simulation

See `scripts/demo-simulation.md`. Simulate a breach and confirm alerts on the dashboard.

## Tech stack

- **Contracts:** Solidity (ReserveMonitor)
- **Backend:** Node.js / TypeScript (Express, ethers)
- **Monitoring engine:** Chainlink CRE
- **Dashboard:** Next.js (App Router)
- **Scripts:** TypeScript, ethers

## Success criteria

- [x] Monitoring computes reserve ratios  
- [x] CRE workflow defined (trigger, steps, safeguard)  
- [x] Anomalies trigger alerts (API + dashboard)  
- [x] Dashboard shows solvency metrics and alerts  
