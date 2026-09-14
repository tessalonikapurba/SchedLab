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

  return {
    avgWaitingTime: round(avgWaitingTime, 2),
    avgTurnaroundTime: round(avgTurnaroundTime, 2),
    avgResponseTime: round(avgResponseTime, 2),
    cpuUtilization: round(cpuUtilization, 2),
    throughput: round(throughput, 4),
  };
}

function round(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}
