# CRE Workflows — How CRE Is Integrated

ProofSentinel uses **Chainlink CRE** to run the monitoring loop on a schedule and to push alerts to your backend when the reserve ratio is critical.

## Architecture

```
                    ┌─────────────────────────────────────┐
                    │  CRE (Chainlink Runtime Environment)│
                    │  - Cron trigger (e.g. every 5 min)   │
                    │  - GET /monitoring/:protocolId      │
                    │  - If status === "critical":        │
                    │    POST /alerts                     │
                    └──────────────┬──────────────────────┘
                                   │
                                   │ HTTP
                                   ▼
                    ┌─────────────────────────────────────┐
                    │  ProofSentinel Backend (API server) │
                    │  - Holds protocol config & state   │
                    │  - Fetches reserves/liabilities   │
                    │  - Computes ratio, stores alerts   │
                    └──────────────┬──────────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │  Optional: your backend or   │
                    │  a keeper calls               │
                    │  ReserveMonitor.pauseWithdrawals()
                    └──────────────────────────────┘
```

- **CRE** does not fetch reserves/liabilities from the chain itself in this setup. It calls your **backend API** (`GET /monitoring/:protocolId`), which returns the current reserve ratio and status.
- When the backend returns `status: "critical"`, the workflow **POSTs to `/alerts`** so the dashboard shows the alert. Optionally, your backend (or a separate keeper) can call `ReserveMonitor.pauseWithdrawals()` when it detects critical or when it receives a dedicated “safeguard” signal.

## Project layout

- **`project.yaml`** — CRE project config (RPCs, targets). Used by all workflows.
- **`monitoring-workflow/`** — One workflow:
  - **`main.ts`** — Cron trigger; GET monitoring API; if critical, POST /alerts.
  - **`workflow.yaml`** — Workflow name and paths (entry, config, secrets).
  - **`config.staging.json`** / **`config.production.json`** — Schedule, `apiBaseUrl`, `protocolId`.

The conceptual YAML **`monitoring-workflow.yaml`** in this folder is for reference only. The **runnable** workflow is the TypeScript app in **`monitoring-workflow/`**.

## Prerequisites

- [CRE CLI](https://docs.chain.link/cre/getting-started/cli-installation/macos-linux) installed and logged in (`cre login`, `cre whoami`).
- **Bun** (for the TypeScript workflow): `curl -fsSL https://bun.sh/install | bash`
- Backend and (optionally) dashboard running so the workflow can call your API.

## 1. Configure the workflow

Edit **`monitoring-workflow/config.staging.json`** (or `config.production.json`):

```json
{
  "schedule": "*/30 * * * * *",
  "apiBaseUrl": "http://localhost:3001",
  "protocolId": "demo"
}
```

- **schedule** — Cron expression (6 fields: sec min hour day month dow). Staging uses every 30s for quick tests; production can use `"0 */5 * * * *"` (every 5 minutes).
- **apiBaseUrl** — Base URL of your ProofSentinel API (no trailing slash).
- **protocolId** — Protocol ID you registered via `POST /protocol`.

## 2. Install dependencies

From the **CRE project root** (this folder: `proofsentinel/cre-workflows/`):

```bash
cd monitoring-workflow
bun install
cd ..
```

`bun install` runs `cre-setup` (postinstall) for the WASM toolchain.

## 3. Run the backend

In another terminal, start the API so CRE can call it:

```bash
cd proofsentinel/backend
npm run api
```

Register a protocol and ensure that protocol’s monitoring returns data (e.g. use the dashboard or `POST /protocol` and `GET /monitoring/:protocolId`).

## 4. Simulate the workflow (local)

From **`proofsentinel/cre-workflows/`**:

```bash
cre workflow simulate monitoring-workflow --target staging-settings
```

You need a **`.env`** in `cre-workflows/` with at least:

```bash
CRE_ETH_PRIVATE_KEY=your_64_char_hex_private_key
```

The simulator will run the cron once: it will GET your monitoring URL and, if status is critical, POST to `/alerts`.

## 5. Deploy and run on CRE (live)

When you’re ready to run on Chainlink’s network:

1. **Deploy the workflow**
   ```bash
   cre workflow deploy monitoring-workflow --target production-settings
   ```
2. **Activate it** (so the cron runs on schedule)
   ```bash
   cre workflow activate monitoring-workflow --target production-settings
   ```
3. Use **`config.production.json`** with your production **apiBaseUrl** and **protocolId**, and a production cron schedule (e.g. every 5 minutes).

## Connect CRE → Smart contract (optional)

CRE in this repo only talks to your **HTTP API**. It does not call `ReserveMonitor.sol` directly. To trigger on-chain safeguards when the ratio is critical you can:

- **Option A — Backend calls the contract**  
  When your backend computes a critical ratio (or receives a dedicated “safeguard” request), it uses a funded key to call `ReserveMonitor.pauseWithdrawals()` or `emitReserveAlert(ratio)`.

- **Option B — CRE report flow**  
  Use CRE’s [report + consumer contract](https://docs.chain.link/cre/guides/workflow/using-evm-client/onchain-write/overview) so the workflow produces a signed report and a consumer contract’s `onReport` calls your `ReserveMonitor`. That requires a consumer that implements the CRE receiver interface and forwards to `ReserveMonitor`.

For the hackathon, Option A (backend or keeper calling `ReserveMonitor`) is usually enough.

## Summary

| What                | Where                          |
|---------------------|---------------------------------|
| Cron + HTTP logic   | `monitoring-workflow/main.ts`   |
| Schedule / API URL  | `config.staging.json` or `config.production.json` |
| Project RPC/targets | `project.yaml`                  |
| Simulate            | `cre workflow simulate monitoring-workflow --target staging-settings` |
| Deploy / activate   | `cre workflow deploy` / `cre workflow activate` |

CRE integrates by **orchestrating** your monitoring: it periodically calls your backend and, when the backend says status is critical, it records an alert (and you can extend the backend to call `ReserveMonitor`).
