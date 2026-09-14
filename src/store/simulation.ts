// ============================================================
// SchedLab — Simulation Zustand Store
// ============================================================

import { create } from 'zustand';
import type {
  ProcessConfig,
  ProcessStatus,
  AlgorithmType,
  PriorityDirection,
  GanttSegment,
  SimulationEvent,
  SimulationStatus,
  SimulationSpeed,
  SchedulerDecision,
  SchedulingResult,
} from '@/lib/types';
import { SimulationEngine } from '@/lib/simulation';
import { runSchedulingAlgorithm } from '@/lib/scheduling';
import { recordSimulationRun } from '@/lib/scenarios';

interface SimulationState {
  // Configuration
  simulationName: string;
  processes: ProcessConfig[];
  selectedAlgorithm: AlgorithmType;
  timeQuantum: number;
  priorityDirection: PriorityDirection;
  agingInterval: number;

  // Runtime
  simulationStatus: SimulationStatus;
  currentTime: number;
  totalTime: number;
  currentProcess: string | null;
  readyQueue: string[];
  processStates: Record<string, ProcessStatus>;
  remainingTimes: Record<string, number>;
  gantt: GanttSegment[];
  events: SimulationEvent[];
  simulationSpeed: SimulationSpeed;
  selectedProcess: string | null;
  schedulerDecision: SchedulerDecision | null;
  mlfqQueues?: { q0: string[]; q1: string[]; q2: string[] };

  // Engine
  engine: SimulationEngine | null;
  intervalId: ReturnType<typeof setInterval> | null;

  // Results (computed from full algorithm run for results page)
  results: SchedulingResult | null;

  // Actions — Configuration
  setSimulationName: (name: string) => void;
  addProcess: (process: ProcessConfig) => void;
  updateProcess: (pid: string, updates: Partial<ProcessConfig>) => void;
  deleteProcess: (pid: string) => void;
  setProcesses: (processes: ProcessConfig[]) => void;
  setAlgorithm: (algorithm: AlgorithmType) => void;
  setQuantum: (quantum: number) => void;
  setPriorityDirection: (direction: PriorityDirection) => void;
  setAgingInterval: (interval: number) => void;

  // Actions — Simulation Control
  initializeSimulation: () => void;
  play: () => void;
  pause: () => void;
  step: () => void;
  reset: () => void;
  setSpeed: (speed: SimulationSpeed) => void;
  selectProcess: (pid: string | null) => void;

  // Actions — Results
  computeResults: () => void;
}

export const useSimulationStore = create<SimulationState>((set, get) => ({
  // Default state
  simulationName: 'Untitled Simulation',
  processes: [],
  selectedAlgorithm: 'FCFS',
  timeQuantum: 2,
  priorityDirection: 'lower',
  agingInterval: 3,

  simulationStatus: 'IDLE',
  currentTime: 0,
  totalTime: 0,
  currentProcess: null,
  readyQueue: [],
  processStates: {},
  remainingTimes: {},
  gantt: [],
  events: [],
  simulationSpeed: 1,
  selectedProcess: null,
  schedulerDecision: null,
  mlfqQueues: { q0: [], q1: [], q2: [] },

  engine: null,
  intervalId: null,
  results: null,

  // ---- Configuration Actions ----

  setSimulationName: (name) => set({ simulationName: name }),

  addProcess: (process) =>
    set((state) => ({
      processes: [...state.processes, process],
    })),

  updateProcess: (pid, updates) =>
    set((state) => ({
      processes: state.processes.map((p) =>
        p.pid === pid ? { ...p, ...updates } : p
      ),
    })),

  deleteProcess: (pid) =>
    set((state) => ({
      processes: state.processes.filter((p) => p.pid !== pid),
    })),

  setProcesses: (processes) => set({ processes }),

  setAlgorithm: (algorithm) => set({ selectedAlgorithm: algorithm }),

  setQuantum: (quantum) => set({ timeQuantum: quantum }),

  setPriorityDirection: (direction) => set({ priorityDirection: direction }),

  setAgingInterval: (interval) => set({ agingInterval: interval }),

  // ---- Simulation Control Actions ----

  initializeSimulation: () => {
    const { processes, selectedAlgorithm, timeQuantum, priorityDirection, agingInterval } = get();

    // Clean up any running interval
    const { intervalId } = get();
    if (intervalId) clearInterval(intervalId);

    // Create engine
    const engine = new SimulationEngine(
      processes,
      selectedAlgorithm,
      timeQuantum,
      priorityDirection,
      agingInterval
    );

    // Also compute full results upfront for the results page
    const fullResults = runSchedulingAlgorithm(
      selectedAlgorithm,
      processes,
      { quantum: timeQuantum, priorityDirection, agingInterval }
    );

    // Initialize process states
    const initialStates: Record<string, ProcessStatus> = {};
    const initialRemaining: Record<string, number> = {};
    for (const p of processes) {
      initialStates[p.pid] = 'NEW';
      initialRemaining[p.pid] = p.burstTime;
    }

    set({
      engine,
      simulationStatus: 'READY',
      currentTime: 0,
      totalTime: fullResults.totalTime,
      currentProcess: null,
      readyQueue: [],
      processStates: initialStates,
      remainingTimes: initialRemaining,
      gantt: [],
      events: [],
      schedulerDecision: null,
      selectedProcess: null,
      intervalId: null,
      results: fullResults,
      mlfqQueues: { q0: [], q1: [], q2: [] },
    });
  },

  play: () => {
    const { engine, simulationStatus, simulationSpeed, results, simulationName, selectedAlgorithm, processes } = get();
    if (!engine || engine.isCompleted) return;
    if (simulationStatus === 'RUNNING') return;

    const interval = setInterval(() => {
      const state = get();
      if (!state.engine || state.engine.isCompleted) {
        if (state.intervalId) clearInterval(state.intervalId);
        set({ simulationStatus: 'COMPLETED', intervalId: null });
        return;
      }

      const snapshot = state.engine.step();

      set({
        currentTime: state.engine.time,
        currentProcess: state.engine.getCpuProcess(),
        readyQueue: state.engine.getReadyQueue(),
        processStates: state.engine.getProcessStates(),
        remainingTimes: state.engine.getRemainingTimes(),
        gantt: state.engine.getGantt(),
        events: state.engine.getEvents(),
        schedulerDecision: snapshot.decision ?? state.schedulerDecision,
        mlfqQueues: snapshot.mlfqQueues,
        simulationStatus: snapshot.completed ? 'COMPLETED' : 'RUNNING',
      });

      if (snapshot.completed) {
        if (state.intervalId) clearInterval(state.intervalId);
        set({ intervalId: null });

        // Record in simulation history
        if (results) {
          recordSimulationRun({
            simulationName: simulationName || 'Simulation',
            algorithm: selectedAlgorithm,
            processCount: processes.length,
            totalTime: results.totalTime,
            avgWaitingTime: results.metrics.avgWaitingTime,
            avgTurnaroundTime: results.metrics.avgTurnaroundTime,
            fairnessIndex: results.metrics.fairnessIndex,
            contextSwitches: results.metrics.contextSwitches,
            starvationRisk: results.metrics.starvationRisk,
          });
        }
      }
    }, 1000 / simulationSpeed);

    set({ simulationStatus: 'RUNNING', intervalId: interval });
  },

  pause: () => {
    const { intervalId } = get();
    if (intervalId) clearInterval(intervalId);
    set({ simulationStatus: 'PAUSED', intervalId: null });
  },

  step: () => {
    const { engine, intervalId, results, simulationName, selectedAlgorithm, processes } = get();
    if (!engine || engine.isCompleted) return;

    // Pause if playing
    if (intervalId) {
      clearInterval(intervalId);
      set({ intervalId: null });
    }

    const snapshot = engine.step();

    set({
      currentTime: engine.time,
      currentProcess: engine.getCpuProcess(),
      readyQueue: engine.getReadyQueue(),
      processStates: engine.getProcessStates(),
      remainingTimes: engine.getRemainingTimes(),
      gantt: engine.getGantt(),
      events: engine.getEvents(),
      schedulerDecision: snapshot.decision ?? get().schedulerDecision,
      mlfqQueues: snapshot.mlfqQueues,
      simulationStatus: snapshot.completed ? 'COMPLETED' : 'PAUSED',
    });

    if (snapshot.completed && results) {
      recordSimulationRun({
        simulationName: simulationName || 'Simulation',
        algorithm: selectedAlgorithm,
        processCount: processes.length,
        totalTime: results.totalTime,
        avgWaitingTime: results.metrics.avgWaitingTime,
        avgTurnaroundTime: results.metrics.avgTurnaroundTime,
        fairnessIndex: results.metrics.fairnessIndex,
        contextSwitches: results.metrics.contextSwitches,
        starvationRisk: results.metrics.starvationRisk,
      });
    }
  },

  reset: () => {
    const { intervalId } = get();
    if (intervalId) clearInterval(intervalId);

    set({
      engine: null,
      simulationStatus: 'IDLE',
      currentTime: 0,
      totalTime: 0,
      currentProcess: null,
      readyQueue: [],
      processStates: {},
      remainingTimes: {},
      gantt: [],
      events: [],
      schedulerDecision: null,
      selectedProcess: null,
      intervalId: null,
      results: null,
      mlfqQueues: { q0: [], q1: [], q2: [] },
    });
  },

  setSpeed: (speed) => {
    const { simulationStatus, intervalId } = get();
    set({ simulationSpeed: speed });

    // If running, restart interval with new speed
    if (simulationStatus === 'RUNNING' && intervalId) {
      clearInterval(intervalId);
      set({ intervalId: null, simulationStatus: 'PAUSED' });
      // Small delay then resume
      setTimeout(() => get().play(), 50);
    }
  },

  selectProcess: (pid) => set({ selectedProcess: pid }),

  computeResults: () => {
    const { processes, selectedAlgorithm, timeQuantum, priorityDirection, agingInterval } = get();
    const results = runSchedulingAlgorithm(
      selectedAlgorithm,
      processes,
      { quantum: timeQuantum, priorityDirection, agingInterval }
    );
    set({ results });
  },
}));

