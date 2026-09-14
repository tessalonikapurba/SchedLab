// ============================================================
// SchedLab — Step-by-Step Simulation Engine
// ============================================================
// Manages the step-by-step time progression for the live simulator.
// At each time T, determines arrivals, queue updates, scheduling
// decisions, CPU state, and events — all synchronized.
// ============================================================

import type {
  ProcessConfig,
  ProcessStatus,
  GanttSegment,
  SimulationEvent,
  SimulationSnapshot,
  SchedulerDecision,
  AlgorithmType,
  PriorityDirection,
} from './types';

interface SimProcessState {
  pid: string;
  arrivalTime: number;
  burstTime: number;
  remainingTime: number;
  priority: number;
  status: ProcessStatus;
  firstStart: number | null;
  completionTime: number | null;
}

export class SimulationEngine {
  private processes: SimProcessState[] = [];
  private readyQueue: string[] = [];
  private cpuProcess: string | null = null;
  private currentTime: number = 0;
  private gantt: GanttSegment[] = [];
  private events: SimulationEvent[] = [];
  private algorithm: AlgorithmType;
  private quantum: number;
  private priorityDirection: PriorityDirection;
  private quantumRemaining: number = 0;
  private ganttSegmentStart: number = 0;
  private completed: boolean = false;
  private totalProcesses: number = 0;
  private completedCount: number = 0;

  constructor(
    configs: ProcessConfig[],
    algorithm: AlgorithmType,
    quantum: number = 2,
    priorityDirection: PriorityDirection = 'lower'
  ) {
    this.algorithm = algorithm;
    this.quantum = quantum;
    this.priorityDirection = priorityDirection;
    this.totalProcesses = configs.length;
    this.completedCount = 0;

    this.processes = configs.map((p) => ({
      pid: p.pid,
      arrivalTime: p.arrivalTime,
      burstTime: p.burstTime,
      remainingTime: p.burstTime,
      priority: p.priority,
      status: 'NEW' as ProcessStatus,
      firstStart: null,
      completionTime: null,
    }));
  }

  get isCompleted(): boolean {
    return this.completed;
  }

  get time(): number {
    return this.currentTime;
  }

  get totalTime(): number {
    // Estimate: max completion or current time
    const maxCompletion = this.processes.reduce(
      (max, p) => (p.completionTime !== null ? Math.max(max, p.completionTime) : max),
      this.currentTime
    );
    return Math.max(maxCompletion, this.currentTime);
  }

  getProcessStates(): Record<string, ProcessStatus> {
    const states: Record<string, ProcessStatus> = {};
    for (const p of this.processes) {
      states[p.pid] = p.status;
    }
    return states;
  }

  getRemainingTimes(): Record<string, number> {
    const times: Record<string, number> = {};
    for (const p of this.processes) {
      times[p.pid] = p.remainingTime;
    }
    return times;
  }

  getReadyQueue(): string[] {
    return [...this.readyQueue];
  }

  getCpuProcess(): string | null {
    return this.cpuProcess;
  }

  getGantt(): GanttSegment[] {
    return [...this.gantt];
  }

  getEvents(): SimulationEvent[] {
    return [...this.events];
  }

  getProcessDetails(): SimProcessState[] {
    return this.processes.map((p) => ({ ...p }));
  }

  /**
   * Advance simulation by one time unit.
   * Returns a snapshot of everything that happened.
   */
  step(): SimulationSnapshot {
    if (this.completed) {
      return {
        time: this.currentTime,
        cpuProcess: null,
        readyQueue: [],
        processStates: this.getProcessStates(),
        remainingTimes: this.getRemainingTimes(),
        event: null,
        ganttSegment: null,
        decision: null,
        completed: true,
      };
    }

    const stepEvents: SimulationEvent[] = [];
    let decision: SchedulerDecision | null = null;

    // 1. Process arrivals at current time
    for (const p of this.processes) {
      if (p.arrivalTime === this.currentTime && p.status === 'NEW') {
        p.status = 'READY';
        this.readyQueue.push(p.pid);
        stepEvents.push({
          time: this.currentTime,
          type: 'ARRIVAL',
          pid: p.pid,
          message: `${p.pid} arrived`,
        });
      }
    }

    // 2. Handle preemption (SRTF)
    if (this.algorithm === 'SRTF' && this.cpuProcess) {
      const currentProc = this.getProcess(this.cpuProcess);
      const shorterInQueue = this.readyQueue.find((pid) => {
        const p = this.getProcess(pid);
        return (
          p.remainingTime < currentProc.remainingTime ||
          (p.remainingTime === currentProc.remainingTime &&
            p.pid.localeCompare(currentProc.pid) < 0)
        );
      });

      if (shorterInQueue) {
        // Preempt current process
        this.flushGanttSegment();
        currentProc.status = 'READY';
        this.readyQueue.push(this.cpuProcess);
        stepEvents.push({
          time: this.currentTime,
          type: 'PREEMPTED',
          pid: this.cpuProcess,
          message: `${this.cpuProcess} preempted by ${shorterInQueue}`,
        });
        this.cpuProcess = null;
      }
    }

    // 3. Handle quantum expiration (RR)
    if (this.algorithm === 'RR' && this.cpuProcess && this.quantumRemaining <= 0) {
      const proc = this.getProcess(this.cpuProcess);
      if (proc.remainingTime > 0) {
        this.flushGanttSegment();
        proc.status = 'READY';
        this.readyQueue.push(this.cpuProcess);
        stepEvents.push({
          time: this.currentTime,
          type: 'QUANTUM_EXPIRED',
          pid: this.cpuProcess,
          message: `Quantum expired for ${this.cpuProcess}`,
        });
        this.cpuProcess = null;
      }
    }

    // 4. If CPU is free, schedule next process
    if (!this.cpuProcess && this.readyQueue.length > 0) {
      const selectedPid = this.selectProcess();
      if (selectedPid) {
        const proc = this.getProcess(selectedPid);
        this.readyQueue = this.readyQueue.filter((pid) => pid !== selectedPid);
        proc.status = 'RUNNING';
        this.cpuProcess = selectedPid;
        this.ganttSegmentStart = this.currentTime;

        if (proc.firstStart === null) {
          proc.firstStart = this.currentTime;
        }

        if (this.algorithm === 'RR') {
          this.quantumRemaining = this.quantum;
        }

        decision = this.generateDecision(selectedPid);
        stepEvents.push({
          time: this.currentTime,
          type: 'SCHEDULED',
          pid: selectedPid,
          message: `Scheduler selected ${selectedPid}`,
        });
      }
    }

    // 5. If CPU still idle
    if (!this.cpuProcess) {
      // Check if there are unfinished processes
      const unfinished = this.processes.filter(
        (p) => p.status !== 'TERMINATED'
      );

      if (unfinished.length === 0) {
        this.completed = true;
        this.events.push(...stepEvents);
        return {
          time: this.currentTime,
          cpuProcess: null,
          readyQueue: this.getReadyQueue(),
          processStates: this.getProcessStates(),
          remainingTimes: this.getRemainingTimes(),
          event: stepEvents.length > 0 ? stepEvents[stepEvents.length - 1] : null,
          ganttSegment: null,
          decision: null,
          completed: true,
        };
      }

      // CPU is idle — record idle time and advance
      stepEvents.push({
        time: this.currentTime,
        type: 'IDLE',
        message: 'CPU idle',
      });

      // Record idle gantt
      const idleSegment: GanttSegment = {
        pid: null,
        start: this.currentTime,
        end: this.currentTime + 1,
      };

      // Merge with previous idle
      if (
        this.gantt.length > 0 &&
        this.gantt[this.gantt.length - 1].pid === null &&
        this.gantt[this.gantt.length - 1].end === this.currentTime
      ) {
        this.gantt[this.gantt.length - 1].end = this.currentTime + 1;
      } else {
        this.gantt.push(idleSegment);
      }

      this.events.push(...stepEvents);
      this.currentTime++;

      return {
        time: this.currentTime - 1,
        cpuProcess: null,
        readyQueue: this.getReadyQueue(),
        processStates: this.getProcessStates(),
        remainingTimes: this.getRemainingTimes(),
        event: stepEvents.length > 0 ? stepEvents[stepEvents.length - 1] : null,
        ganttSegment: idleSegment,
        decision: null,
        completed: false,
      };
    }

    // 6. Execute on CPU for 1 time unit
    const runningProc = this.getProcess(this.cpuProcess);
    runningProc.remainingTime--;
    if (this.algorithm === 'RR') {
      this.quantumRemaining--;
    }

    this.currentTime++;

    // 7. Check process completion
    let ganttSeg: GanttSegment | null = null;
    if (runningProc.remainingTime === 0) {
      runningProc.status = 'TERMINATED';
      runningProc.completionTime = this.currentTime;
      this.completedCount++;

      this.flushGanttSegment();
      ganttSeg = this.gantt[this.gantt.length - 1];

      stepEvents.push({
        time: this.currentTime,
        type: 'COMPLETED',
        pid: this.cpuProcess,
        message: `${this.cpuProcess} completed`,
      });
      this.cpuProcess = null;

      if (this.completedCount === this.totalProcesses) {
        this.completed = true;
      }
    }

    this.events.push(...stepEvents);

    return {
      time: this.currentTime - 1,
      cpuProcess: this.cpuProcess,
      readyQueue: this.getReadyQueue(),
      processStates: this.getProcessStates(),
      remainingTimes: this.getRemainingTimes(),
      event: stepEvents.length > 0 ? stepEvents[stepEvents.length - 1] : null,
      ganttSegment: ganttSeg,
      decision,
      completed: this.completed,
    };
  }

  // ---- Private helpers ----

  private getProcess(pid: string): SimProcessState {
    return this.processes.find((p) => p.pid === pid)!;
  }

  private selectProcess(): string | null {
    if (this.readyQueue.length === 0) return null;

    const queueProcesses = this.readyQueue.map((pid) => this.getProcess(pid));

    switch (this.algorithm) {
      case 'FCFS': {
        // First in queue (arrival order)
        queueProcesses.sort((a, b) =>
          a.arrivalTime !== b.arrivalTime
            ? a.arrivalTime - b.arrivalTime
            : a.pid.localeCompare(b.pid)
        );
        return queueProcesses[0].pid;
      }
      case 'SJF': {
        queueProcesses.sort((a, b) =>
          a.burstTime !== b.burstTime
            ? a.burstTime - b.burstTime
            : a.pid.localeCompare(b.pid)
        );
        return queueProcesses[0].pid;
      }
      case 'SRTF': {
        queueProcesses.sort((a, b) =>
          a.remainingTime !== b.remainingTime
            ? a.remainingTime - b.remainingTime
            : a.pid.localeCompare(b.pid)
        );
        return queueProcesses[0].pid;
      }
      case 'PRIORITY': {
        queueProcesses.sort((a, b) => {
          const pCmp =
            this.priorityDirection === 'lower'
              ? a.priority - b.priority
              : b.priority - a.priority;
          return pCmp !== 0 ? pCmp : a.pid.localeCompare(b.pid);
        });
        return queueProcesses[0].pid;
      }
      case 'RR': {
        // FIFO — first in ready queue
        return this.readyQueue[0];
      }
      default:
        return this.readyQueue[0];
    }
  }

  private generateDecision(pid: string): SchedulerDecision {
    const proc = this.getProcess(pid);
    let reason = '';

    switch (this.algorithm) {
      case 'FCFS':
        reason = `${pid} arrived before the other available processes.`;
        break;
      case 'SJF':
        reason = `${pid} has the shortest burst time (${proc.burstTime}) among available processes.`;
        break;
      case 'SRTF':
        reason = `${pid} has the shortest remaining time (${proc.remainingTime}) among available processes.`;
        break;
      case 'PRIORITY':
        reason = `${pid} has the ${this.priorityDirection === 'lower' ? 'lowest' : 'highest'} priority value (${proc.priority}) among available processes.`;
        break;
      case 'RR':
        reason = `${pid} is next according to the circular ready queue.`;
        break;
    }

    return { pid, reason, algorithm: this.algorithm };
  }

  private flushGanttSegment(): void {
    if (this.cpuProcess && this.currentTime > this.ganttSegmentStart) {
      const newSeg: GanttSegment = {
        pid: this.cpuProcess,
        start: this.ganttSegmentStart,
        end: this.currentTime,
      };

      // Merge with previous if same pid
      if (
        this.gantt.length > 0 &&
        this.gantt[this.gantt.length - 1].pid === this.cpuProcess &&
        this.gantt[this.gantt.length - 1].end === this.ganttSegmentStart
      ) {
        this.gantt[this.gantt.length - 1].end = this.currentTime;
      } else {
        this.gantt.push(newSeg);
      }

      this.ganttSegmentStart = this.currentTime;
    }
  }
}
