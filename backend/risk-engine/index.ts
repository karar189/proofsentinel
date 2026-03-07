/**
 * Risk engine: computes reserve ratio and evaluates thresholds.
 */

export function computeReserveRatio(reserves: bigint, liabilities: bigint): number {
  if (liabilities === 0n) return 0;
  return Number(reserves) / Number(liabilities);
}

export type Thresholds = {
  minReserveRatio: number;
  warningRatio: number;
  criticalRatio: number;
};

export type RiskStatus = "healthy" | "warning" | "critical";

export function evaluateRisk(ratio: number, thresholds: Thresholds): RiskStatus {
  if (ratio < thresholds.criticalRatio) return "critical";
  if (ratio < thresholds.warningRatio) return "warning";
  return "healthy";
}

export function shouldTriggerSafeguard(ratio: number, criticalRatio: number): boolean {
  return ratio < criticalRatio;
}
