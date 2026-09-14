// ============================================================
// SchedLab — Metrics Calculator
// ============================================================

import type { ProcessResult, GanttSegment, AggregateMetrics } from './types';

/**
 * Compute aggregate metrics from per-process results and Gantt chart.
 * Never hardcodes — always derived from actual data.
 */
export function computeMetrics(
  results: ProcessResult[],
  gantt: GanttSegment[],
  totalTime: number
): AggregateMetrics {
  if (results.length === 0) {
    return {
      avgWaitingTime: 0,
      avgTurnaroundTime: 0,
      avgResponseTime: 0,
      cpuUtilization: 0,
      throughput: 0,
      contextSwitches: 0,
      fairnessIndex: 1.0,
      starvationRisk: 'None',
      avgQueueLength: 0,
    };
  }

  const n = results.length;

  const avgWaitingTime =
    results.reduce((sum, r) => sum + r.waitingTime, 0) / n;
  const avgTurnaroundTime =
    results.reduce((sum, r) => sum + r.turnaroundTime, 0) / n;
  const avgResponseTime =
    results.reduce((sum, r) => sum + r.responseTime, 0) / n;

  // CPU busy time = total time minus idle segments
  const idleTime = gantt
    .filter((s) => s.pid === null)
    .reduce((sum, s) => sum + (s.end - s.start), 0);
  const busyTime = totalTime - idleTime;
  const cpuUtilization = totalTime > 0 ? (busyTime / totalTime) * 100 : 0;

  const throughput = totalTime > 0 ? n / totalTime : 0;

  // 1. Context Switches: Count transitions between different active processes
  const nonIdleSegments = gantt.filter((s) => s.pid !== null);
  let contextSwitches = 0;
  for (let i = 1; i < nonIdleSegments.length; i++) {
    if (nonIdleSegments[i].pid !== nonIdleSegments[i - 1].pid) {
      contextSwitches++;
    }
  }

  // 2. Jain's Fairness Index:
  // x_i = burstTime_i / turnaroundTime_i (ratio of actual service to system time spent)
  // J = (sum x_i)^2 / (n * sum(x_i^2))
  const serviceRatios = results.map((r) =>
    r.turnaroundTime > 0 ? r.burstTime / r.turnaroundTime : 1.0
  );
  const sumRatios = serviceRatios.reduce((sum, x) => sum + x, 0);
  const sumSqRatios = serviceRatios.reduce((sum, x) => sum + x * x, 0);
  const fairnessRaw =
    sumSqRatios > 0 ? Math.pow(sumRatios, 2) / (n * sumSqRatios) : 1.0;
  const fairnessIndex = Math.min(1.0, Math.max(0.0, round(fairnessRaw, 3)));

  // 3. Starvation Risk:
  // Derived from waiting time distribution and max wait-to-burst skew
  const maxWait = Math.max(...results.map((r) => r.waitingTime));
  const maxWaitToBurstRatio = Math.max(
    ...results.map((r) => r.waitingTime / (r.burstTime || 1))
  );

  let starvationRisk: 'None' | 'Low' | 'Moderate' | 'High' = 'None';
  if (
    n > 1 &&
    (results.some((r) => r.waitingTime > avgWaitingTime * 2.4 && r.waitingTime >= 6) ||
      maxWaitToBurstRatio >= 4.5)
  ) {
    starvationRisk = 'High';
  } else if (
    n > 1 &&
    (results.some((r) => r.waitingTime > avgWaitingTime * 1.7 && r.waitingTime >= 4) ||
      maxWaitToBurstRatio >= 2.8)
  ) {
    starvationRisk = 'Moderate';
  } else if (n > 1 && maxWait > 0 && maxWait > avgWaitingTime * 1.25) {
    starvationRisk = 'Low';
  }

  // 4. Average Queue Length (Little's Law time-weighted average):
  // Sum of all waiting times divided by total simulation time
  const totalWaitTime = results.reduce((sum, r) => sum + r.waitingTime, 0);
  const avgQueueLength = totalTime > 0 ? round(totalWaitTime / totalTime, 2) : 0;

  return {
    avgWaitingTime: round(avgWaitingTime, 2),
    avgTurnaroundTime: round(avgTurnaroundTime, 2),
    avgResponseTime: round(avgResponseTime, 2),
    cpuUtilization: round(cpuUtilization, 2),
    throughput: round(throughput, 4),
    contextSwitches,
    fairnessIndex,
    starvationRisk,
    avgQueueLength,
  };
}

function round(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

