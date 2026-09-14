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
  AggregateMetrics,
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
// Dispatcher — run any algorithm by type
// ----------------------------------------------------------
export function runSchedulingAlgorithm(
  algorithm: AlgorithmType,
  processes: ProcessConfig[],
  options?: { quantum?: number; priorityDirection?: PriorityDirection }
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
    },
  };
}
