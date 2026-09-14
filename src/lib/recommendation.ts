// ============================================================
// SchedLab — Intelligent Recommendation Engine
// ============================================================
// Evaluates workload characteristics (burst variance, convoy risk,
// arrival dispersion, priority spread) and provides pedagogical
// recommendations on which scheduling algorithm best fits the goals.
// ============================================================

import type {
  ProcessConfig,
  AlgorithmType,
  AggregateMetrics,
  WorkloadProfile,
  RecommendationResult,
} from './types';

/**
 * Profile the mathematical and behavioral characteristics of a workload.
 */
export function analyzeWorkload(processes: ProcessConfig[]): WorkloadProfile {
  if (processes.length === 0) {
    return {
      processCount: 0,
      burstMean: 0,
      burstStdDev: 0,
      burstCV: 0,
      hasHighBurstVariance: false,
      arrivalSpan: 0,
      hasIdleGaps: false,
      convoyRiskDetected: false,
      priorityVariance: 0,
      hasPriorities: false,
    };
  }

  const n = processes.length;
  const bursts = processes.map((p) => p.burstTime);
  const arrivals = processes.map((p) => p.arrivalTime);
  const priorities = processes.map((p) => p.priority);

  // Mean burst
  const burstMean = bursts.reduce((s, b) => s + b, 0) / n;

  // Standard deviation of burst
  const burstVariance =
    bursts.reduce((s, b) => s + Math.pow(b - burstMean, 2), 0) / n;
  const burstStdDev = Math.sqrt(burstVariance);

  // Coefficient of variation (CV = stdDev / mean)
  const burstCV = burstMean > 0 ? burstStdDev / burstMean : 0;
  const hasHighBurstVariance = burstCV > 0.45 || (Math.max(...bursts) >= 3 * Math.min(...bursts) && n > 2);

  // Arrival span
  const minArrival = Math.min(...arrivals);
  const maxArrival = Math.max(...arrivals);
  const arrivalSpan = maxArrival - minArrival;

  // Convoy risk check: first arriving process has a burst significantly larger than subsequent ones
  const sortedByArrival = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime);
  let convoyRiskDetected = false;
  if (n >= 3) {
    const firstBurst = sortedByArrival[0].burstTime;
    const remainingBursts = sortedByArrival.slice(1).map((p) => p.burstTime);
    const avgRemainingBurst =
      remainingBursts.reduce((s, b) => s + b, 0) / remainingBursts.length;

    if (firstBurst >= 2.2 * avgRemainingBurst && sortedByArrival[0].arrivalTime <= sortedByArrival[1].arrivalTime) {
      convoyRiskDetected = true;
    }
  }

  // Idle gap check
  let hasIdleGaps = false;
  let runningTime = 0;
  for (const proc of sortedByArrival) {
    if (proc.arrivalTime > runningTime) {
      hasIdleGaps = true;
      break;
    }
    runningTime += proc.burstTime;
  }

  // Priority variance
  const priMean = priorities.reduce((s, p) => s + p, 0) / n;
  const priVar = priorities.reduce((s, p) => s + Math.pow(p - priMean, 2), 0) / n;
  const hasPriorities = priVar > 0;

  return {
    processCount: n,
    burstMean: round(burstMean, 2),
    burstStdDev: round(burstStdDev, 2),
    burstCV: round(burstCV, 2),
    hasHighBurstVariance,
    arrivalSpan,
    hasIdleGaps,
    convoyRiskDetected,
    priorityVariance: round(priVar, 2),
    hasPriorities,
  };
}

/**
 * Generate intelligent, educational recommendations tailored to the given workload.
 */
export function generateRecommendation(
  processes: ProcessConfig[],
  _currentAlgorithm?: AlgorithmType,
  _currentMetrics?: AggregateMetrics
): RecommendationResult {
  const profile = analyzeWorkload(processes);


  if (processes.length === 0) {
    return {
      primaryAlgorithm: 'FCFS',
      primaryAlgorithmName: 'First Come, First Served',
      headline: 'No processes defined in workload',
      workloadInsight: 'Add at least one process to receive algorithm recommendations.',
      reasons: ['Workload is currently empty.'],
      tradeOffs: ['Define processes with arrival and burst times to simulate.'],
      suitabilityScore: { latency: 50, fairness: 50, overhead: 100 },
      alternativeOptions: [],
    };
  }

  // Determine Primary Recommendation based on workload signature
  let primaryAlgorithm: AlgorithmType = 'RR';
  let primaryAlgorithmName = 'Round Robin';
  let headline = '';
  let workloadInsight = '';
  const reasons: string[] = [];
  const tradeOffs: string[] = [];

  let latencyScore = 75;
  let fairnessScore = 90;
  let overheadScore = 65;

  if (profile.convoyRiskDetected) {
    // Strong Convoy Effect pattern
    primaryAlgorithm = 'SRTF';
    primaryAlgorithmName = 'Shortest Remaining Time First (SRTF)';
    headline = 'Severe Convoy Effect detected: SJF/SRTF strongly recommended';
    workloadInsight = `Process ${processes[0].pid} has a heavy burst (${processes[0].burstTime} units) arriving first, blocking smaller processes and dramatically inflating average waiting time under FIFO scheduling.`;
    reasons.push(
      `Preempting the long job with SRTF allows short jobs to complete rapidly, cutting average waiting time by up to 50–70%.`,
      `SRTF achieves the mathematically optimal average turnaround time for preemptive workloads.`,
      `With burst CV = ${profile.burstCV}, prioritizing short bursts eliminates the queue bottleneck immediately.`
    );
    tradeOffs.push(
      `High Starvation Risk: If short processes continue to arrive, long jobs will never finish unless an aging mechanism is introduced.`,
      `Higher context switching overhead compared to non-preemptive algorithms like FCFS.`
    );
    latencyScore = 98;
    fairnessScore = 45;
    overheadScore = 55;
  } else if (profile.hasHighBurstVariance) {
    // High burst variability
    primaryAlgorithm = 'SJF';
    primaryAlgorithmName = 'Shortest Job First (SJF)';
    headline = 'High Burst Variance: SJF/SRTF minimizes average waiting time';
    workloadInsight = `Workload burst times vary considerably (mean: ${profile.burstMean}, standard deviation: ${profile.burstStdDev}, CV: ${profile.burstCV}). Short tasks suffer severely if placed behind long tasks.`;
    reasons.push(
      `SJF is provably optimal for minimizing average waiting time among non-preemptive schedulers.`,
      `Quickly clearing shorter jobs maximizes throughput and keeps average queue length short.`,
      `Generates zero preemption overhead compared to SRTF or Round Robin.`
    );
    tradeOffs.push(
      `In a production operating system, exact burst times must be estimated using exponential smoothing.`,
      `If fairness or interactive responsiveness is critical, Round Robin is far safer because it prevents starvation.`
    );
    latencyScore = 95;
    fairnessScore = 55;
    overheadScore = 90;
  } else if (profile.hasPriorities) {
    // Priority tagged processes
    primaryAlgorithm = 'PRIORITY_AGING';
    primaryAlgorithmName = 'Priority with Aging';
    headline = 'Prioritized Workload: Priority with Aging prevents starvation';
    workloadInsight = `Processes carry explicit priority levels (variance: ${profile.priorityVariance}). Pure Priority Scheduling risks permanently starving low-priority processes.`;
    reasons.push(
      `Honors high-priority tasks first, ensuring mission-critical processes meet urgency requirements.`,
      `Aging dynamically increments the priority of waiting processes, mathematically guaranteeing bounded waiting time and zero starvation.`
    );
    tradeOffs.push(
      `Requires tuning the aging threshold (if aging is too fast, priority distinctions collapse; if too slow, starvation risk remains).`,
      `Average waiting time may be higher than SJF because priority overrides burst duration.`
    );
    latencyScore = 80;
    fairnessScore = 85;
    overheadScore = 80;
  } else if (!profile.hasHighBurstVariance && profile.burstCV < 0.3) {
    // Homogeneous bursts
    primaryAlgorithm = 'FCFS';
    primaryAlgorithmName = 'First Come, First Served (FCFS)';
    headline = 'Uniform Burst Times: FCFS delivers minimal overhead';
    workloadInsight = `Processes have nearly identical burst times (CV = ${profile.burstCV}). The Convoy Effect does not occur, and all processes naturally experience similar turnaround times.`;
    reasons.push(
      `Zero preemption and minimal context switches (1 switch per process termination).`,
      `Completely starvation-free with perfect FIFO predictability.`,
      `No complex bookkeeping or queue reordering needed in the kernel.`
    );
    tradeOffs.push(
      `Poor response time for newly arriving interactive tasks if any process takes longer than expected.`,
      `Not suitable for time-sharing operating systems with unpredictable user input.`
    );
    latencyScore = 75;
    fairnessScore = 80;
    overheadScore = 98;
  } else {
    // Interactive / General Purpose
    primaryAlgorithm = 'RR';
    primaryAlgorithmName = 'Round Robin (RR)';
    headline = 'Balanced / Interactive Workload: Round Robin guarantees fairness';
    workloadInsight = `Workload contains a mix of processes where predictable response time and fair CPU sharing are paramount.`;
    reasons.push(
      `Guarantees that every active process gets regular CPU slices bounded by (N - 1) × Quantum.`,
      `Yields a high Jain's Fairness Index (~0.90+) and zero starvation risk.`,
      `Excellent initial response time for interactive processes.`
    );
    tradeOffs.push(
      `If Quantum is too small, excessive context switches degrade CPU efficiency.`,
      `If Quantum is too large, Round Robin degenerates into FCFS.`
    );
    latencyScore = 78;
    fairnessScore = 96;
    overheadScore = 60;
  }

  // Educational alternative algorithms
  const alternatives: RecommendationResult['alternativeOptions'] = [];

  const currentPrimary = primaryAlgorithm as AlgorithmType;

  if (currentPrimary !== 'RR') {
    alternatives.push({
      algorithm: 'RR',
      name: 'Round Robin (RR)',
      description: 'Time-sliced circular queue scheduling.',
      pros: "Guaranteed starvation-free; optimal Jain's fairness index; predictable response time.",
      cons: 'Frequent context switches; higher average turnaround time than SJF.',
    });
  }

  if (currentPrimary !== 'SRTF' && currentPrimary !== 'SJF') {
    alternatives.push({
      algorithm: 'SRTF',
      name: 'Shortest Remaining Time First (SRTF)',
      description: 'Preemptive shortest job scheduler.',
      pros: 'Minimal average turnaround time; interactive short jobs finish instantly.',
      cons: 'High risk of starvation for long processes; requires preemption overhead.',
    });
  }

  if (currentPrimary !== 'MLFQ') {
    alternatives.push({
      algorithm: 'MLFQ',
      name: 'Multi-Level Feedback Queue (MLFQ)',
      description: 'Adaptive multi-priority scheduler used in modern production OS kernels.',
      pros: 'Automatically separates I/O-bound (short) from CPU-bound (long) tasks without knowing burst times beforehand; periodic boost eliminates starvation.',
      cons: 'More complex configuration with multiple quantum levels and demotion rules.',
    });
  }

  if (currentPrimary !== 'PRIORITY_AGING' && profile.hasPriorities) {
    alternatives.push({
      algorithm: 'PRIORITY_AGING',
      name: 'Priority with Aging',
      description: 'Priority scheduler that elevates priority of waiting processes over time.',
      pros: 'Enforces urgency while mathematically preventing starvation.',
      cons: 'Requires parameter tuning for the aging interval.',
    });
  }


  return {
    primaryAlgorithm,
    primaryAlgorithmName,
    headline,
    workloadInsight,
    reasons,
    tradeOffs,
    suitabilityScore: {
      latency: latencyScore,
      fairness: fairnessScore,
      overhead: overheadScore,
    },
    alternativeOptions: alternatives.slice(0, 3),
  };
}

function round(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}
