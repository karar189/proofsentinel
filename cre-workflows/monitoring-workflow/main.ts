/**
 * ProofSentinel CRE Monitoring Workflow
 *
 * Trigger: Cron (every 5 min in production, every 30s in staging for testing)
 * 1. GET backend /monitoring/:protocolId → reserves, liabilities, reserveRatio, status
 * 2. If status === "critical" → POST /alerts to record alert for dashboard
 *
 * CRE runs this on the DON; the backend does the actual reserve/liability fetching.
 * Optionally, your backend can call ReserveMonitor.pauseWithdrawals() when it receives
 * a safeguard trigger (e.g. a dedicated POST /safeguard endpoint).
 */
import {
  CronCapability,
  HTTPClient,
  handler,
  Runner,
  consensusIdenticalAggregation,
  ok,
  json,
  type Runtime,
  type HTTPSendRequester,
} from "@chainlink/cre-sdk"

type Config = {
  schedule: string
  apiBaseUrl: string
  protocolId: string
}

type MonitoringSnapshot = {
  protocolId: string
  timestamp: string
  reserves: string
  liabilities: string
  reserveRatio: number
  status: "healthy" | "warning" | "critical"
}

type WorkflowResult = {
  status: string
  reserveRatio: number
  alertSent: boolean
}

const fetchMonitoring = (sendRequester: HTTPSendRequester, url: string): MonitoringSnapshot => {
  const response = sendRequester.sendRequest({ url }).result()
  if (!ok(response)) {
    throw new Error(`Monitoring API failed: ${response.statusCode}`)
  }
  const data = json(response) as MonitoringSnapshot
  return data
}

const onCronTrigger = (runtime: Runtime<Config>): WorkflowResult => {
  const config = runtime.config
  const monitoringUrl = `${config.apiBaseUrl.replace(/\/$/, "")}/monitoring/${encodeURIComponent(config.protocolId)}`

  runtime.log(`Fetching monitoring: ${monitoringUrl}`)

  const httpClient = new HTTPClient()
  const snapshot = httpClient
    .sendRequest(runtime, fetchMonitoring, consensusIdenticalAggregation<MonitoringSnapshot>())(monitoringUrl)
    .result()

  runtime.log(`Reserve ratio: ${snapshot.reserveRatio}, status: ${snapshot.status}`)

  let alertSent = false
  if (snapshot.status === "critical") {
    const alertsUrl = `${config.apiBaseUrl.replace(/\/$/, "")}/alerts`
    const body = JSON.stringify({
      protocolId: config.protocolId,
      severity: "critical" as const,
      message: "Reserve ratio below critical threshold (CRE workflow)",
      ratio: snapshot.reserveRatio,
    })
    const bodyBase64 = Buffer.from(new TextEncoder().encode(body)).toString("base64")

    const postResponse = httpClient
      .sendRequest(
        runtime,
        (req: HTTPSendRequester, u: string, b: string) => {
          const resp = req.sendRequest({
            url: u,
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: b,
            cacheSettings: { readFromCache: true, maxAgeMs: 60000 },
          }).result()
          if (!ok(resp)) throw new Error(`POST /alerts failed: ${resp.statusCode}`)
          return "ok"
        },
        consensusIdenticalAggregation<string>()
      )(alertsUrl, bodyBase64)

    postResponse.result()
    alertSent = true
    runtime.log("Critical alert sent to backend")
  }

  return {
    status: snapshot.status,
    reserveRatio: snapshot.reserveRatio,
    alertSent,
  }
}

const initWorkflow = (config: Config) => {
  const cron = new CronCapability()
  return [handler(cron.trigger({ schedule: config.schedule }), onCronTrigger)]
}

export async function main() {
  const runner = await Runner.newRunner<Config>()
  await runner.run(initWorkflow)
}
