# Demo Simulation (Step 10)

For the hackathon demo, run through this scenario.

## 1. Healthy state

- Reserves: 1000 (ETH or token units)
- Liabilities: 800
- **Ratio: 1.25** → status: **healthy**

## 2. Simulate reserve drop

- Reserves: 700
- Liabilities: 800
- **Ratio: 0.875** → below critical (e.g. 0.95)

## 3. CRE detects breach

- Workflow evaluates: `ratio < criticalRatio` → true
- CRE calls `ReserveMonitor.pauseWithdrawals()` on-chain
- CRE POSTs to backend `POST /alerts` with severity `critical`

## 4. Dashboard

- **Monitoring** page shows updated ratio and status **critical**
- **Alerts** page shows the new critical alert

## How to simulate without real chain

1. Start the API: `cd backend && npm run api`
2. Register a protocol with test wallets and token (or use mock data in backend).
3. Use the **monitoring-service** with env overrides or a small script that mocks reserves/liabilities and calls `POST /alerts` to simulate an alert.
4. Open the dashboard: `cd dashboard && npm run dev` → visit `/monitoring` and `/alerts`.

## Optional: mock alert via curl

```bash
curl -X POST http://localhost:3001/alerts \
  -H "Content-Type: application/json" \
  -d '{"protocolId":"demo","severity":"critical","message":"Reserve ratio below 0.95","ratio":0.87}'
```

Then open http://localhost:3000/alerts to see the alert.
