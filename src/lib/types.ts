// ============================================================
// SchedLab — Core Types
// ============================================================

/** A process definition as configured by the user */
export interface ProcessConfig {
  pid: string;
  arrivalTime: number;
  burstTime: number;
  priority: number;
}

/** Runtime state of a process during simulation */
export interface ProcessState {
  pid: string;
  arrivalTime: number;
  burstTime: number;
  remainingTime: number;
  priority: number;
  state: ProcessStatus;
  firstStart: number | null;
  completionTime: number | null;
  turnaroundTime: number | null;
  waitingTime: number | null;
  responseTime: number | null;
  history: StateTransition[];
}

export type ProcessStatus = 'NEW' | 'READY' | 'RUNNING' | 'WAITING' | 'TERMINATED';

export interface StateTransition {
  from: ProcessStatus;
  to: ProcessStatus;
  time: number;
  reason: string;
}

/** A segment in the Gantt chart */
export interface GanttSegment {
  pid: string | null; // null = idle
  start: number;
  end: number;
}

/** Result of a completed scheduling run */
export interface SchedulingResult {
  gantt: GanttSegment[];
  processResults: ProcessResult[];
  processes?: ProcessResult[];
  totalTime: number;
  metrics: AggregateMetrics;
}

/** Per-process final results */
export interface ProcessResult {
  pid: string;
  arrivalTime: number;
  burstTime: number;
  priority: number;
  firstStart: number;
  completionTime: number;
  turnaroundTime: number;
  waitingTime: number;
  responseTime: number;
}

/** Aggregate metrics for a simulation run */
export interface AggregateMetrics {
  avgWaitingTime: number;
  avgTurnaroundTime: number;
  avgResponseTime: number;
  cpuUtilization: number;
  throughput: number;
  // Advanced OS metrics
  contextSwitches: number;
  fairnessIndex: number; // Jain's Fairness Index (0.00 to 1.00)
  starvationRisk: 'None' | 'Low' | 'Moderate' | 'High';
  avgQueueLength: number;
}

/** Supported scheduling algorithms */
export type AlgorithmType =
  | 'FCFS'
  | 'SJF'
  | 'SRTF'
  | 'PRIORITY'
  | 'RR'
  | 'MLFQ'
  | 'PRIORITY_AGING';

/** Direction for priority scheduling */
export type PriorityDirection = 'lower' | 'higher';

/** Simulation event for the event log */
export interface SimulationEvent {
  time: number;
  type: EventType;
  pid?: string;
  message: string;
  explanation?: string; // Deep educational explanation for 'Explain as you simulate'
  category?: 'arrival' | 'preemption' | 'quantum' | 'selection' | 'completion' | 'idle' | 'aging' | 'boost';
}

export type EventType =
  | 'ARRIVAL'
  | 'SCHEDULED'
  | 'PREEMPTED'
  | 'QUANTUM_EXPIRED'
  | 'COMPLETED'
  | 'IDLE'
  | 'RESUMED'
  | 'AGING'
  | 'BOOST';

/** Simulation status */
export type SimulationStatus = 'IDLE' | 'CONFIGURING' | 'READY' | 'RUNNING' | 'PAUSED' | 'COMPLETED';

/** Speed multiplier options */
export type SimulationSpeed = 0.5 | 1 | 2 | 4;

/** Detailed candidate considered by the scheduler */
export interface SchedulerCandidate {
  pid: string;
  score: string | number;
  detail: string;
}

/** Scheduler decision explanation */
export interface SchedulerDecision {
  pid: string;
  reason: string;
  algorithm: AlgorithmType;
  whyWinnerWon?: string;
  educationalTip?: string;
  candidates?: SchedulerCandidate[];
  queueEvolution?: string;
}

/** Snapshot of simulation at a given time step */
export interface SimulationSnapshot {
  time: number;
  cpuProcess: string | null;
  readyQueue: string[];
  processStates: Record<string, ProcessStatus>;
  remainingTimes: Record<string, number>;
  event: SimulationEvent | null;
  ganttSegment: GanttSegment | null;
  decision: SchedulerDecision | null;
  completed: boolean;
  mlfqQueues?: { q0: string[]; q1: string[]; q2: string[] };
}

/** Preset scenario */
export interface PresetScenario {
  name: string;
  description: string;
  processes: ProcessConfig[];
  algorithm: AlgorithmType;
  timeQuantum?: number;
  priorityDirection?: PriorityDirection;
  agingInterval?: number;
  mlfqConfig?: MLFQConfig;
}

/** Configuration for Multi-Level Feedback Queue */
export interface MLFQConfig {
  q0Quantum: number;
  q1Quantum: number;
  boostInterval: number; // Periodic priority boost to top queue
}

/** Algorithm display info */
export interface AlgorithmInfo {
  type: AlgorithmType;
  name: string;
  shortName: string;
  description: string;
  preemptive: boolean;
  educationalCategory?: 'Standard' | 'Advanced OS';
}

/** Saved Scenario in LocalStorage */
export interface SavedScenario {
  id: string;
  name: string;
  description?: string;
  processes: ProcessConfig[];
  algorithm: AlgorithmType;
  timeQuantum?: number;
  priorityDirection?: PriorityDirection;
  agingInterval?: number;
  createdAt: string;
  isCustom?: boolean;
}

/** Simulation History Entry in LocalStorage */
export interface SimulationHistoryEntry {
  id: string;
  timestamp: string;
  simulationName: string;
  algorithm: AlgorithmType;
  processCount: number;
  totalTime: number;
  avgWaitingTime: number;
  avgTurnaroundTime: number;
  fairnessIndex: number;
  contextSwitches: number;
  starvationRisk: 'None' | 'Low' | 'Moderate' | 'High';
}

/** Workload statistical profile */
export interface WorkloadProfile {
  processCount: number;
  burstMean: number;
  burstStdDev: number;
  burstCV: number; // Coefficient of Variation (stdDev / mean)
  hasHighBurstVariance: boolean;
  arrivalSpan: number;
  hasIdleGaps: boolean;
  convoyRiskDetected: boolean;
  priorityVariance: number;
  hasPriorities: boolean;
}

/** Algorithmic Recommendation returned by the Recommendation Engine */
export interface RecommendationResult {
  primaryAlgorithm: AlgorithmType;
  primaryAlgorithmName: string;
  headline: string;
  workloadInsight: string;
  reasons: string[];
  tradeOffs: string[];
  suitabilityScore: {
    latency: number; // 0 - 100
    fairness: number; // 0 - 100
    overhead: number; // 0 - 100 (higher means less overhead)
  };
  alternativeOptions: {
    algorithm: AlgorithmType;
    name: string;
    description: string;
    pros: string;
    cons: string;
  }[];
}

