import { describe, expect } from "bun:test";
import { newTestRuntime, test, ConfidentialHttpMock } from "@chainlink/cre-sdk/test";
import { onCronTrigger, initWorkflow } from "./main";
import type { Config } from "./main";

const baseConfig: Config = {
  schedule: "*/30 * * * * *",
  apiBaseUrl: "http://localhost:3001",
  protocolId: "demo",
};

function makeMonitoringResponse(status: "healthy" | "warning" | "critical", ratio: number) {
  return JSON.stringify({
    protocolId: "demo",
    timestamp: new Date().toISOString(),
    reserves: "1000000000000000000",
    liabilities: "1000000000000000000",
    reserveRatio: ratio,
    status,
  });
}

describe("onCronTrigger", () => {
  test("returns healthy status with no alert", () => {
    const runtime = newTestRuntime();
    runtime.config = { ...baseConfig };

    const httpMock = ConfidentialHttpMock.testInstance();
    httpMock.sendRequest = (_input) => ({
      statusCode: 200,
      body: btoa(makeMonitoringResponse("healthy", 1.5)),
    });

    const result = onCronTrigger(runtime, {});

    expect(result.status).toBe("healthy");
    expect(result.alertSent).toBe(false);
    expect(result.safeguardTriggered).toBe(false);
    expect(result.reserveRatio).toBe(1.5);
  });

  test("sends warning alert for warning status", () => {
    const runtime = newTestRuntime();
    runtime.config = { ...baseConfig };

    let alertPosted = false;
    const httpMock = ConfidentialHttpMock.testInstance();
    httpMock.sendRequest = (input) => {
      const url = input.request?.url ?? "";
      if (url.includes("/monitoring/")) {
        return {
          statusCode: 200,
          body: btoa(makeMonitoringResponse("warning", 1.05)),
        };
      }
      if (url.includes("/alerts")) {
        alertPosted = true;
        return { statusCode: 201, body: btoa("{}") };
      }
      return { statusCode: 404, body: btoa("{}") };
    };

    const result = onCronTrigger(runtime, {});

    expect(result.status).toBe("warning");
    expect(result.alertSent).toBe(true);
    expect(result.safeguardTriggered).toBe(false);
    expect(alertPosted).toBe(true);
  });

  test("sends critical alert for critical status (no evm config)", () => {
    const runtime = newTestRuntime();
    runtime.config = { ...baseConfig };

    const httpMock = ConfidentialHttpMock.testInstance();
    httpMock.sendRequest = (input) => {
      const url = input.request?.url ?? "";
      if (url.includes("/monitoring/")) {
        return {
          statusCode: 200,
          body: btoa(makeMonitoringResponse("critical", 0.8)),
        };
      }
      return { statusCode: 201, body: btoa("{}") };
    };

    const result = onCronTrigger(runtime, {});

    expect(result.status).toBe("critical");
    expect(result.alertSent).toBe(true);
    // No evm config → no on-chain safeguard
    expect(result.safeguardTriggered).toBe(false);
  });

  test("returns error status when monitoring API fails", () => {
    const runtime = newTestRuntime();
    runtime.config = { ...baseConfig };

    const httpMock = ConfidentialHttpMock.testInstance();
    httpMock.sendRequest = (_input) => ({
      statusCode: 500,
      body: btoa("{}"),
    });

    const result = onCronTrigger(runtime, {});

    expect(result.status).toBe("error");
    expect(result.alertSent).toBe(false);
    expect(result.safeguardTriggered).toBe(false);
  });
});

describe("initWorkflow", () => {
  test("returns one handler with correct cron schedule", () => {
    const testSchedule = "0 */5 * * * *";
    const config: Config = { ...baseConfig, schedule: testSchedule };

    const handlers = initWorkflow(config);

    expect(handlers).toBeArray();
    expect(handlers).toHaveLength(1);
    expect(handlers[0].trigger.config.schedule).toBe(testSchedule);
  });
});
