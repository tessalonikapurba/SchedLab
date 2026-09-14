// ============================================================
// SchedLab — Constants & Presets
// ============================================================

import type { AlgorithmInfo, PresetScenario, AlgorithmType } from './types';

export const ALGORITHMS: AlgorithmInfo[] = [
  {
    type: 'FCFS',
    name: 'First Come, First Served',
    shortName: 'FCFS',
    description: 'Processes are executed in the order they arrive in the ready queue.',
    preemptive: false,
  },
  {
    type: 'SJF',
    name: 'Shortest Job First',
    shortName: 'SJF',
    description: 'Selects the process with the shortest burst time from the ready queue.',
    preemptive: false,
  },
  {
    type: 'SRTF',
    name: 'Shortest Remaining Time First',
    shortName: 'SRTF',
    description: 'Preemptive version of SJF. Always runs the process with the shortest remaining time.',
    preemptive: true,
  },
  {
    type: 'PRIORITY',
    name: 'Priority Scheduling',
    shortName: 'Priority',
    description: 'Selects the process with the highest priority value from the ready queue.',
    preemptive: false,
  },
  {
    type: 'RR',
    name: 'Round Robin',
    shortName: 'RR',
    description: 'Each process gets a fixed time quantum. After expiry, it moves to the back of the queue.',
    preemptive: true,
  },
  {
    type: 'MLFQ',
    name: 'Multi-Level Feedback Queue',
    shortName: 'MLFQ',
    description: 'Multi-queue architecture with dynamic demotion on quantum expiry and periodic priority boosting.',
    preemptive: true,
    educationalCategory: 'Advanced OS',
  },
  {
    type: 'PRIORITY_AGING',
    name: 'Priority with Aging',
    shortName: 'Priority + Aging',
    description: 'Prevents starvation by dynamically incrementing priority for processes waiting in the ready queue.',
    preemptive: false,
    educationalCategory: 'Advanced OS',
  },
];

export const ALGORITHM_METADATA: Record<AlgorithmType, AlgorithmInfo> = {
  FCFS: ALGORITHMS[0],
  SJF: ALGORITHMS[1],
  SRTF: ALGORITHMS[2],
  PRIORITY: ALGORITHMS[3],
  RR: ALGORITHMS[4],
  MLFQ: ALGORITHMS[5],
  PRIORITY_AGING: ALGORITHMS[6],
};

export const PRESET_SCENARIOS: PresetScenario[] = [
  {
    name: 'Basic FCFS Example',
    description: 'Simple FCFS with sequential arrivals.',
    algorithm: 'FCFS',
    processes: [
      { pid: 'P01', arrivalTime: 0, burstTime: 5, priority: 1 },
      { pid: 'P02', arrivalTime: 1, burstTime: 3, priority: 1 },
      { pid: 'P03', arrivalTime: 2, burstTime: 8, priority: 1 },
      { pid: 'P04', arrivalTime: 3, burstTime: 2, priority: 1 },
    ],
  },
  {
    name: 'Short Jobs vs Long Job (Convoy)',
    description: 'Demonstrates how a long process delays shorter ones (Convoy Effect).',
    algorithm: 'SJF',
    processes: [
      { pid: 'P01', arrivalTime: 0, burstTime: 12, priority: 1 },
      { pid: 'P02', arrivalTime: 1, burstTime: 2, priority: 1 },
      { pid: 'P03', arrivalTime: 2, burstTime: 1, priority: 1 },
      { pid: 'P04', arrivalTime: 3, burstTime: 3, priority: 1 },
    ],
  },
  {
    name: 'Round Robin Fairness',
    description: 'Shows how Round Robin distributes CPU time evenly with time slicing.',
    algorithm: 'RR',
    timeQuantum: 2,
    processes: [
      { pid: 'P01', arrivalTime: 0, burstTime: 6, priority: 1 },
      { pid: 'P02', arrivalTime: 0, burstTime: 4, priority: 1 },
      { pid: 'P03', arrivalTime: 0, burstTime: 8, priority: 1 },
    ],
  },
  {
    name: 'Priority Starvation Prevention (Aging)',
    description: 'Demonstrates how low-priority tasks age and eventually run before starvation.',
    algorithm: 'PRIORITY_AGING',
    priorityDirection: 'lower',
    agingInterval: 3,
    processes: [
      { pid: 'P01', arrivalTime: 0, burstTime: 8, priority: 1 },
      { pid: 'P02', arrivalTime: 1, burstTime: 6, priority: 2 },
      { pid: 'P03', arrivalTime: 2, burstTime: 4, priority: 4 },
      { pid: 'P04', arrivalTime: 3, burstTime: 5, priority: 5 },
    ],
  },
  {
    name: 'MLFQ Adaptive Slicing',
    description: 'Short interactive tasks finish in Q0; CPU-bound tasks demote to Q1 and Q2.',
    algorithm: 'MLFQ',
    timeQuantum: 2,
    processes: [
      { pid: 'P01', arrivalTime: 0, burstTime: 2, priority: 1 },
      { pid: 'P02', arrivalTime: 0, burstTime: 10, priority: 1 },
      { pid: 'P03', arrivalTime: 1, burstTime: 3, priority: 1 },
      { pid: 'P04', arrivalTime: 4, burstTime: 1, priority: 1 },
    ],
  },
  {
    name: 'Preemption Example',
    description: 'Shows preemption when a shorter process arrives during execution.',
    algorithm: 'SRTF',
    processes: [
      { pid: 'P01', arrivalTime: 0, burstTime: 7, priority: 1 },
      { pid: 'P02', arrivalTime: 2, burstTime: 3, priority: 1 },
      { pid: 'P03', arrivalTime: 4, burstTime: 1, priority: 1 },
      { pid: 'P04', arrivalTime: 5, burstTime: 4, priority: 1 },
    ],
  },
  {
    name: 'CPU Idle Example',
    description: 'Processes arrive with gaps, causing the CPU to idle.',
    algorithm: 'FCFS',
    processes: [
      { pid: 'P01', arrivalTime: 0, burstTime: 3, priority: 1 },
      { pid: 'P02', arrivalTime: 6, burstTime: 4, priority: 1 },
      { pid: 'P03', arrivalTime: 12, burstTime: 2, priority: 1 },
    ],
  },
];

export const PROCESS_COLORS: Record<string, string> = {
  P01: '#3B82F6', // blue
  P02: '#10B981', // emerald
  P03: '#F59E0B', // amber
  P04: '#EF4444', // red
  P05: '#8B5CF6', // violet
  P06: '#EC4899', // pink
  P07: '#06B6D4', // cyan
  P08: '#84CC16', // lime
  P09: '#F97316', // orange
  P10: '#6366F1', // indigo
};

export function getProcessColor(pid: string): string {
  if (PROCESS_COLORS[pid]) return PROCESS_COLORS[pid];
  // Generate a deterministic color for unknown PIDs
  let hash = 0;
  for (let i = 0; i < pid.length; i++) {
    hash = pid.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 65%, 55%)`;
}

export const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  NEW: { bg: '#DBEAFE', text: '#1D4ED8', border: '#93C5FD' },
  READY: { bg: '#FEF3C7', text: '#B45309', border: '#FCD34D' },
  RUNNING: { bg: '#D1FAE5', text: '#047857', border: '#6EE7B7' },
  WAITING: { bg: '#E0E7FF', text: '#4338CA', border: '#A5B4FC' },
  TERMINATED: { bg: '#F3F4F6', text: '#6B7280', border: '#D1D5DB' },
};

export const ALGORITHM_DISPLAY_NAMES: Record<AlgorithmType, string> = {
  FCFS: 'First Come, First Served',
  SJF: 'Shortest Job First',
  SRTF: 'Shortest Remaining Time First',
  PRIORITY: 'Priority Scheduling',
  RR: 'Round Robin',
  MLFQ: 'Multi-Level Feedback Queue',
  PRIORITY_AGING: 'Priority with Aging',
};

