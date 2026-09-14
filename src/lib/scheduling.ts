// ============================================================
// SchedLab — Scheduling Engine
// ============================================================
// Pure functions implementing 5 CPU scheduling algorithms.
// No React, no side effects — testable in isolation.
// ============================================================

import type {
  ProcessConfig,
  ProcessResult,
  GanttSegment,
  SchedulingResult,
  AlgorithmType,
  PriorityDirection,
} from './types';

import { computeMetrics } from './metrics';

// ----------------------------------------------------------
// Internal helper type for algorithm state
// ----------------------------------------------------------
interface ProcessEntry {
  pid: string;
  arrival: number;
  burst: number;
  priority: number;
  remaining: number;
  firstStart: number;
  completion: number;
  started: boolean;
}

// ----------------------------------------------------------
// FCFS — First Come, First Served
// ----------------------------------------------------------
export function fcfs(processes: ProcessConfig[]): SchedulingResult {
  if (processes.length === 0) return emptyResult();

  const sorted = [...processes].sort((a, b) =>
    a.arrivalTime !== b.arrivalTime
      ? a.arrivalTime - b.arrivalTime
      : a.pid.localeCompare(b.pid)
  );

  const gantt: GanttSegment[] = [];
  const results: ProcessResult[] = [];
  let currentTime = 0;

  for (const proc of sorted) {
    // CPU idle gap
    if (currentTime < proc.arrivalTime) {
      gantt.push({ pid: null, start: currentTime, end: proc.arrivalTime });
      currentTime = proc.arrivalTime;
    }

    const start = currentTime;
    const end = start + proc.burstTime;

    gantt.push({ pid: proc.pid, start, end });

    const completionTime = end;
    const turnaroundTime = completionTime - proc.arrivalTime;
    const waitingTime = turnaroundTime - proc.burstTime;
    const responseTime = start - proc.arrivalTime;

    results.push({
      pid: proc.pid,
      arrivalTime: proc.arrivalTime,
      burstTime: proc.burstTime,
      priority: proc.priority,
      firstStart: start,
      completionTime,
      turnaroundTime,
      waitingTime,
      responseTime,
    });

    currentTime = end;
  }

  const totalTime = currentTime;
  const metrics = computeMetrics(results, gantt, totalTime);

  return { gantt, processResults: results, totalTime, metrics };
}

// ----------------------------------------------------------
// SJF — Shortest Job First (Non-preemptive)
// ----------------------------------------------------------
export function sjf(processes: ProcessConfig[]): SchedulingResult {
  if (processes.length === 0) return emptyResult();

  const entries: ProcessEntry[] = processes.map((p) => ({
    pid: p.pid,
    arrival: p.arrivalTime,
    burst: p.burstTime,
    priority: p.priority,
    remaining: p.burstTime,
    firstStart: -1,
    completion: -1,
    started: false,
  }));

  const gantt: GanttSegment[] = [];
  let currentTime = 0;
  let completed = 0;
  const n = entries.length;

  while (completed < n) {
    // Available processes that have arrived and not completed
    const available = entries.filter(
      (e) => e.arrival <= currentTime && e.completion === -1
    );

    if (available.length === 0) {
      // Find next arrival
      const nextArrival = Math.min(
        ...entries.filter((e) => e.completion === -1).map((e) => e.arrival)
      );
      gantt.push({ pid: null, start: currentTime, end: nextArrival });
      currentTime = nextArrival;
      continue;
    }

    // Pick shortest burst, break ties by PID
    available.sort((a, b) =>
      a.burst !== b.burst ? a.burst - b.burst : a.pid.localeCompare(b.pid)
    );

    const selected = available[0];
    const start = currentTime;
    const end = start + selected.burst;

    selected.firstStart = start;
    selected.completion = end;
    selected.started = true;

    gantt.push({ pid: selected.pid, start, end });
    currentTime = end;
    completed++;
  }

  const results = entriesToResults(entries);
  const totalTime = currentTime;
  const metrics = computeMetrics(results, gantt, totalTime);

  return { gantt, processResults: results, totalTime, metrics };
}

// ----------------------------------------------------------
// SRTF — Shortest Remaining Time First (Preemptive SJF)
// ----------------------------------------------------------
export function srtf(processes: ProcessConfig[]): SchedulingResult {
  if (processes.length === 0) return emptyResult();

  const entries: ProcessEntry[] = processes.map((p) => ({
    pid: p.pid,
    arrival: p.arrivalTime,
    burst: p.burstTime,
    priority: p.priority,
    remaining: p.burstTime,
    firstStart: -1,
    completion: -1,
    started: false,
  }));

  const gantt: GanttSegment[] = [];
  let currentTime = 0;
  let completed = 0;
  const n = entries.length;
  let currentProcess: ProcessEntry | null = null;
  let segmentStart = 0;

  while (completed < n) {
    // Check for new arrivals at current time
    const available = entries.filter(
      (e) => e.arrival <= currentTime && e.remaining > 0
    );

    if (available.length === 0) {
      // Flush current segment
      if (currentProcess) {
        gantt.push({ pid: currentProcess.pid, start: segmentStart, end: currentTime });
        currentProcess = null;
      }
      const nextArrival = Math.min(
        ...entries.filter((e) => e.remaining > 0).map((e) => e.arrival)
      );
      gantt.push({ pid: null, start: currentTime, end: nextArrival });
      currentTime = nextArrival;
      segmentStart = currentTime;
      continue;
    }

    // Pick shortest remaining, break ties by PID
    available.sort((a, b) =>
      a.remaining !== b.remaining
        ? a.remaining - b.remaining
        : a.pid.localeCompare(b.pid)
    );

    const selected = available[0];

    // Context switch?
    if (currentProcess && currentProcess.pid !== selected.pid) {
      gantt.push({ pid: currentProcess.pid, start: segmentStart, end: currentTime });
      segmentStart = currentTime;
    } else if (!currentProcess) {
      segmentStart = currentTime;
    }

    if (!selected.started) {
      selected.firstStart = currentTime;
      selected.started = true;
    }

    currentProcess = selected;

    // Execute for 1 time unit
    selected.remaining--;
    currentTime++;

    // Check completion
    if (selected.remaining === 0) {
      selected.completion = currentTime;
      completed++;
      gantt.push({ pid: selected.pid, start: segmentStart, end: currentTime });
      currentProcess = null;
      segmentStart = currentTime;
    }
  }

  // Merge consecutive same-pid gantt segments
  const mergedGantt = mergeGantt(gantt);
  const results = entriesToResults(entries);
  const totalTime = currentTime;
  const metrics = computeMetrics(results, mergedGantt, totalTime);

  return { gantt: mergedGantt, processResults: results, totalTime, metrics };
}

// ----------------------------------------------------------
// Priority Scheduling (Non-preemptive)
// ----------------------------------------------------------
export function priorityScheduling(
  processes: ProcessConfig[],
  direction: PriorityDirection = 'lower'
): SchedulingResult {
  if (processes.length === 0) return emptyResult();

  const entries: ProcessEntry[] = processes.map((p) => ({
    pid: p.pid,
    arrival: p.arrivalTime,
    burst: p.burstTime,
    priority: p.priority,
    remaining: p.burstTime,
    firstStart: -1,
    completion: -1,
    started: false,
  }));

  const gantt: GanttSegment[] = [];
  let currentTime = 0;
  let completed = 0;
  const n = entries.length;

  while (completed < n) {
    const available = entries.filter(
      (e) => e.arrival <= currentTime && e.completion === -1
    );

    if (available.length === 0) {
      const nextArrival = Math.min(
        ...entries.filter((e) => e.completion === -1).map((e) => e.arrival)
      );
      gantt.push({ pid: null, start: currentTime, end: nextArrival });
      currentTime = nextArrival;
      continue;
    }

    // Sort by priority (direction), then by PID for tie-breaking
    available.sort((a, b) => {
      const pCmp =
        direction === 'lower'
          ? a.priority - b.priority
          : b.priority - a.priority;
      return pCmp !== 0 ? pCmp : a.pid.localeCompare(b.pid);
    });

    const selected = available[0];
    const start = currentTime;
    const end = start + selected.burst;

    selected.firstStart = start;
    selected.completion = end;
    selected.started = true;

    gantt.push({ pid: selected.pid, start, end });
    currentTime = end;
    completed++;
  }

  const results = entriesToResults(entries);
  const totalTime = currentTime;
  const metrics = computeMetrics(results, gantt, totalTime);

  return { gantt, processResults: results, totalTime, metrics };
}

// ----------------------------------------------------------
// Round Robin
// ----------------------------------------------------------
export function roundRobin(
  processes: ProcessConfig[],
  quantum: number = 2
): SchedulingResult {
  if (processes.length === 0) return emptyResult();
  if (quantum <= 0) quantum = 1;

  const entries: ProcessEntry[] = processes.map((p) => ({
    pid: p.pid,
    arrival: p.arrivalTime,
    burst: p.burstTime,
    priority: p.priority,
    remaining: p.burstTime,
    firstStart: -1,
    completion: -1,
    started: false,
  }));

  // Sort by arrival, then PID
  const sortedByArrival = [...entries].sort((a, b) =>
    a.arrival !== b.arrival ? a.arrival - b.arrival : a.pid.localeCompare(b.pid)
  );

  const gantt: GanttSegment[] = [];
  const readyQueue: ProcessEntry[] = [];
  let currentTime = 0;
  let completed = 0;
  const n = entries.length;
  let arrivalIdx = 0;

  // Enqueue initial arrivals
  while (arrivalIdx < n && sortedByArrival[arrivalIdx].arrival <= currentTime) {
    readyQueue.push(sortedByArrival[arrivalIdx]);
    arrivalIdx++;
  }

  while (completed < n) {
    if (readyQueue.length === 0) {
      // Jump to next arrival
      if (arrivalIdx < n) {
        const nextArrival = sortedByArrival[arrivalIdx].arrival;
        gantt.push({ pid: null, start: currentTime, end: nextArrival });
        currentTime = nextArrival;
        while (arrivalIdx < n && sortedByArrival[arrivalIdx].arrival <= currentTime) {
          readyQueue.push(sortedByArrival[arrivalIdx]);
          arrivalIdx++;
        }
        continue;
      }
      break;
    }

    const selected = readyQueue.shift()!;

    if (!selected.started) {
      selected.firstStart = currentTime;
      selected.started = true;
    }

    const execTime = Math.min(quantum, selected.remaining);
    const start = currentTime;
    const end = start + execTime;

    gantt.push({ pid: selected.pid, start, end });
    selected.remaining -= execTime;
    currentTime = end;

    // Enqueue new arrivals that arrived during this quantum
    while (arrivalIdx < n && sortedByArrival[arrivalIdx].arrival <= currentTime) {
      readyQueue.push(sortedByArrival[arrivalIdx]);
      arrivalIdx++;
    }

    if (selected.remaining === 0) {
      selected.completion = currentTime;
      completed++;
    } else {
      // Re-enqueue at end
      readyQueue.push(selected);
    }
  }

  const mergedGantt = mergeGantt(gantt);
  const results = entriesToResults(entries);
  const totalTime = currentTime;
  const metrics = computeMetrics(results, mergedGantt, totalTime);

  return { gantt: mergedGantt, processResults: results, totalTime, metrics };
}

// ----------------------------------------------------------
// Multi-Level Feedback Queue (MLFQ)
// ----------------------------------------------------------
// 3 Priority Queues:
// Q0: Highest priority, RR with Quantum q0 (default 2)
// Q1: Medium priority, RR with Quantum q1 (default 4)
// Q2: Lowest priority, FCFS (no time quantum)
// Rule: Processes that exhaust quantum in Q_i are demoted to Q_{i+1}.
// Rule: Periodic boost every boostInterval time units resets all to Q0.
// ----------------------------------------------------------
export function mlfq(
  processes: ProcessConfig[],
  config: { q0Quantum?: number; q1Quantum?: number; boostInterval?: number } = {}
): SchedulingResult {
  if (processes.length === 0) return emptyResult();

  const q0Quantum = config.q0Quantum ?? 2;
  const q1Quantum = config.q1Quantum ?? 4;
  const boostInterval = config.boostInterval ?? 20;

  interface MLFQEntry extends ProcessEntry {
    queueLevel: 0 | 1 | 2;
    quantumUsedInLevel: number;
  }

  const entries: MLFQEntry[] = processes.map((p) => ({
    pid: p.pid,
    arrival: p.arrivalTime,
    burst: p.burstTime,
    priority: p.priority,
    remaining: p.burstTime,
    firstStart: -1,
    completion: -1,
    started: false,
    queueLevel: 0,
    quantumUsedInLevel: 0,
  }));

  const gantt: GanttSegment[] = [];
  let currentTime = 0;
  let completed = 0;
  const n = entries.length;

  const q0: MLFQEntry[] = [];
  const q1: MLFQEntry[] = [];
  const q2: MLFQEntry[] = [];

  let currentProcess: MLFQEntry | null = null;
  let segmentStart = 0;

  // Helper to enqueue based on process queueLevel
  const enqueue = (proc: MLFQEntry) => {
    if (proc.queueLevel === 0) q0.push(proc);
    else if (proc.queueLevel === 1) q1.push(proc);
    else q2.push(proc);
  };

  while (completed < n) {
    // 1. Periodic Priority Boost
    if (currentTime > 0 && currentTime % boostInterval === 0) {
      // Boost all unfinished ready processes to Q0
      while (q1.length > 0) {
        const p = q1.shift()!;
        p.queueLevel = 0;
        p.quantumUsedInLevel = 0;
        q0.push(p);
      }
      while (q2.length > 0) {
        const p = q2.shift()!;
        p.queueLevel = 0;
        p.quantumUsedInLevel = 0;
        q0.push(p);
      }
      // Also boost running process if any
      if (currentProcess && currentProcess.queueLevel > 0) {
        currentProcess.queueLevel = 0;
        currentProcess.quantumUsedInLevel = 0;
      }
    }

    // 2. Arrivals at currentTime
    const newArrivals = entries.filter(
      (e) => e.arrival === currentTime && !e.started && e.completion === -1
    );
    for (const arr of newArrivals) {
      arr.queueLevel = 0;
      arr.quantumUsedInLevel = 0;
      q0.push(arr);
    }

    // 3. Check preemption: if currently running from Q1 or Q2, and Q0 has jobs, preempt!
    if (currentProcess) {
      const needsPreemption =
        (currentProcess.queueLevel === 1 && q0.length > 0) ||
        (currentProcess.queueLevel === 2 && (q0.length > 0 || q1.length > 0));

      if (needsPreemption) {
        gantt.push({ pid: currentProcess.pid, start: segmentStart, end: currentTime });
        enqueue(currentProcess);
        currentProcess = null;
      }
    }

    // 4. Select process if CPU is idle
    if (!currentProcess) {
      if (q0.length > 0) {
        currentProcess = q0.shift()!;
      } else if (q1.length > 0) {
        currentProcess = q1.shift()!;
      } else if (q2.length > 0) {
        currentProcess = q2.shift()!;
      }

      if (currentProcess) {
        segmentStart = currentTime;
        if (!currentProcess.started) {
          currentProcess.firstStart = currentTime;
          currentProcess.started = true;
        }
      } else {
        // CPU Idle gap
        const nextArrival = Math.min(
          ...entries.filter((e) => e.completion === -1).map((e) => e.arrival)
        );
        gantt.push({ pid: null, start: currentTime, end: nextArrival });
        currentTime = nextArrival;
        continue;
      }
    }

    // 5. Execute for 1 time unit
    currentProcess.remaining--;
    currentProcess.quantumUsedInLevel++;
    currentTime++;

    // 6. Check process completion
    if (currentProcess.remaining === 0) {
      currentProcess.completion = currentTime;
      completed++;
      gantt.push({ pid: currentProcess.pid, start: segmentStart, end: currentTime });
      currentProcess = null;
    } else {
      // Check quantum expiration in Q0 or Q1
      if (currentProcess.queueLevel === 0 && currentProcess.quantumUsedInLevel >= q0Quantum) {
        // Demote to Q1
        gantt.push({ pid: currentProcess.pid, start: segmentStart, end: currentTime });
        currentProcess.queueLevel = 1;
        currentProcess.quantumUsedInLevel = 0;
        q1.push(currentProcess);
        currentProcess = null;
      } else if (currentProcess.queueLevel === 1 && currentProcess.quantumUsedInLevel >= q1Quantum) {
        // Demote to Q2
        gantt.push({ pid: currentProcess.pid, start: segmentStart, end: currentTime });
        currentProcess.queueLevel = 2;
        currentProcess.quantumUsedInLevel = 0;
        q2.push(currentProcess);
        currentProcess = null;
      }
    }
  }

  const mergedGantt = mergeGantt(gantt);
  const results = entriesToResults(entries);
  const totalTime = currentTime;
  const metrics = computeMetrics(results, mergedGantt, totalTime);

  return { gantt: mergedGantt, processResults: results, totalTime, metrics };
}

// ----------------------------------------------------------
// Priority Scheduling with Aging
// ----------------------------------------------------------
// Prevents starvation by gradually elevating the priority of processes
// that spend extended periods waiting in the ready queue.
// agingInterval: Every K time units of waiting, priority increments by 1.
// ----------------------------------------------------------
export function priorityWithAging(
  processes: ProcessConfig[],
  direction: PriorityDirection = 'lower',
  agingInterval: number = 3
): SchedulingResult {
  if (processes.length === 0) return emptyResult();
  if (agingInterval <= 0) agingInterval = 1;

  interface AgingEntry extends ProcessEntry {
    effectivePriority: number;
    waitInQueue: number;
  }

  const entries: AgingEntry[] = processes.map((p) => ({
    pid: p.pid,
    arrival: p.arrivalTime,
    burst: p.burstTime,
    priority: p.priority,
    effectivePriority: p.priority,
    remaining: p.burstTime,
    firstStart: -1,
    completion: -1,
    started: false,
    waitInQueue: 0,
  }));

  const gantt: GanttSegment[] = [];
  let currentTime = 0;
  let completed = 0;
  const n = entries.length;

  while (completed < n) {
    // Processes that have arrived and not completed
    const available = entries.filter(
      (e) => e.arrival <= currentTime && e.completion === -1
    );

    if (available.length === 0) {
      const nextArrival = Math.min(
        ...entries.filter((e) => e.completion === -1).map((e) => e.arrival)
      );
      gantt.push({ pid: null, start: currentTime, end: nextArrival });
      currentTime = nextArrival;
      continue;
    }

    // Sort by effective priority
    available.sort((a, b) => {
      const pCmp =
        direction === 'lower'
          ? a.effectivePriority - b.effectivePriority
          : b.effectivePriority - a.effectivePriority;
      return pCmp !== 0 ? pCmp : a.pid.localeCompare(b.pid);
    });

    const selected = available[0];
    const start = currentTime;
    const end = start + selected.burst;

    selected.firstStart = start;
    selected.completion = end;
    selected.started = true;

    gantt.push({ pid: selected.pid, start, end });

    // While selected runs for selected.burst units, other available processes age
    const burstSpan = selected.burst;
    for (const other of available) {
      if (other.pid !== selected.pid) {
        other.waitInQueue += burstSpan;
        const agingLevels = Math.floor(other.waitInQueue / agingInterval);
        if (agingLevels > 0) {
          other.waitInQueue = other.waitInQueue % agingInterval;
          if (direction === 'lower') {
            other.effectivePriority = Math.max(1, other.effectivePriority - agingLevels);
          } else {
            other.effectivePriority = other.effectivePriority + agingLevels;
          }
        }
      }
    }

    currentTime = end;
    completed++;
  }

  const results = entriesToResults(entries);
  const totalTime = currentTime;
  const metrics = computeMetrics(results, gantt, totalTime);

  return { gantt, processResults: results, totalTime, metrics };
}

// ----------------------------------------------------------
// Dispatcher — run any algorithm by type
// ----------------------------------------------------------
export function runSchedulingAlgorithm(
  algorithm: AlgorithmType,
  processes: ProcessConfig[],
  options?: {
    quantum?: number;
    priorityDirection?: PriorityDirection;
    agingInterval?: number;
    mlfqConfig?: { q0Quantum?: number; q1Quantum?: number; boostInterval?: number };
  }
): SchedulingResult {
  switch (algorithm) {
    case 'FCFS':
      return fcfs(processes);
    case 'SJF':
      return sjf(processes);
    case 'SRTF':
      return srtf(processes);
    case 'PRIORITY':
      return priorityScheduling(processes, options?.priorityDirection ?? 'lower');
    case 'RR':
      return roundRobin(processes, options?.quantum ?? 2);
    case 'MLFQ':
      return mlfq(processes, options?.mlfqConfig ?? { q0Quantum: options?.quantum ?? 2 });
    case 'PRIORITY_AGING':
      return priorityWithAging(
        processes,
        options?.priorityDirection ?? 'lower',
        options?.agingInterval ?? 3
      );
    default:
      throw new Error(`Unknown algorithm: ${algorithm}`);
  }
}

// ----------------------------------------------------------
// Helpers
// ----------------------------------------------------------
function entriesToResults(entries: ProcessEntry[]): ProcessResult[] {
  return entries.map((e) => ({
    pid: e.pid,
    arrivalTime: e.arrival,
    burstTime: e.burst,
    priority: e.priority,
    firstStart: e.firstStart,
    completionTime: e.completion,
    turnaroundTime: e.completion - e.arrival,
    waitingTime: e.completion - e.arrival - e.burst,
    responseTime: e.firstStart - e.arrival,
  }));
}

function mergeGantt(gantt: GanttSegment[]): GanttSegment[] {
  if (gantt.length === 0) return [];
  const merged: GanttSegment[] = [{ ...gantt[0] }];
  for (let i = 1; i < gantt.length; i++) {
    const last = merged[merged.length - 1];
    if (last.pid === gantt[i].pid && last.end === gantt[i].start) {
      last.end = gantt[i].end;
    } else {
      merged.push({ ...gantt[i] });
    }
  }
  return merged;
}

function emptyResult(): SchedulingResult {
  return {
    gantt: [],
    processResults: [],
    totalTime: 0,
    metrics: {
      avgWaitingTime: 0,
      avgTurnaroundTime: 0,
      avgResponseTime: 0,
      cpuUtilization: 0,
      throughput: 0,
      contextSwitches: 0,
      fairnessIndex: 1.0,
      starvationRisk: 'None',
      avgQueueLength: 0,
    },
  };
}

