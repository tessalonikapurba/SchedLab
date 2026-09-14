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
}

/** Supported scheduling algorithms */
export type AlgorithmType = 'FCFS' | 'SJF' | 'SRTF' | 'PRIORITY' | 'RR';

/** Direction for priority scheduling */
export type PriorityDirection = 'lower' | 'higher';

/** Simulation event for the event log */
export interface SimulationEvent {
  time: number;
  type: EventType;
  pid?: string;
  message: string;
}

export type EventType =
  | 'ARRIVAL'
  | 'SCHEDULED'
  | 'PREEMPTED'
  | 'QUANTUM_EXPIRED'
  | 'COMPLETED'
  | 'IDLE'
  | 'RESUMED';

/** Simulation status */
export type SimulationStatus = 'IDLE' | 'CONFIGURING' | 'READY' | 'RUNNING' | 'PAUSED' | 'COMPLETED';

/** Speed multiplier options */
export type SimulationSpeed = 0.5 | 1 | 2 | 4;

/** Scheduler decision explanation */
export interface SchedulerDecision {
  pid: string;
  reason: string;
  algorithm: AlgorithmType;
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
}

/** Preset scenario */
export interface PresetScenario {
  name: string;
  description: string;
  processes: ProcessConfig[];
  algorithm: AlgorithmType;
  timeQuantum?: number;
  priorityDirection?: PriorityDirection;
}

/** Algorithm display info */
export interface AlgorithmInfo {
  type: AlgorithmType;
  name: string;
  shortName: string;
  description: string;
  preemptive: boolean;
}
