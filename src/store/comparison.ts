// ============================================================
// SchedLab — Comparison Store
// ============================================================

import { create } from 'zustand';
import type {
  ProcessConfig,
  AlgorithmType,
  SchedulingResult,
  PriorityDirection,
} from '@/lib/types';
import { runSchedulingAlgorithm } from '@/lib/scheduling';

interface ComparisonEntry {
  algorithm: AlgorithmType;
  result: SchedulingResult;
}

interface ComparisonState {
  workload: ProcessConfig[];
  entries: ComparisonEntry[];
  priorityDirection: PriorityDirection;
  timeQuantum: number;
  isComputed: boolean;

  setWorkload: (processes: ProcessConfig[]) => void;
  setPriorityDirection: (d: PriorityDirection) => void;
  setTimeQuantum: (q: number) => void;
  runComparison: () => void;
  reset: () => void;
}

const ALL_ALGORITHMS: AlgorithmType[] = ['FCFS', 'SJF', 'SRTF', 'PRIORITY', 'RR'];

export const useComparisonStore = create<ComparisonState>((set, get) => ({
  workload: [],
  entries: [],
  priorityDirection: 'lower',
  timeQuantum: 2,
  isComputed: false,

  setWorkload: (processes) => set({ workload: processes, isComputed: false, entries: [] }),

  setPriorityDirection: (d) => set({ priorityDirection: d }),

  setTimeQuantum: (q) => set({ timeQuantum: q }),

  runComparison: () => {
    const { workload, timeQuantum, priorityDirection } = get();
    if (workload.length === 0) return;

    const entries: ComparisonEntry[] = ALL_ALGORITHMS.map((algorithm) => ({
      algorithm,
      result: runSchedulingAlgorithm(algorithm, workload, {
        quantum: timeQuantum,
        priorityDirection,
      }),
    }));

    set({ entries, isComputed: true });
  },

  reset: () => set({ workload: [], entries: [], isComputed: false }),
}));
