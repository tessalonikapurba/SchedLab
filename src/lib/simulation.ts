// ============================================================
// SchedLab — Step-by-Step Simulation Engine
// ============================================================
// Manages the step-by-step time progression for the live simulator.
// At each time T, determines arrivals, queue updates, scheduling
// decisions, CPU state, and events — all synchronized with deep
// educational explanations for 'Explain as you simulate'.
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
  SchedulerCandidate,
} from './types';

interface SimProcessState {
  pid: string;
  arrivalTime: number;
  burstTime: number;
  remainingTime: number;
  priority: number;
  effectivePriority: number;
  status: ProcessStatus;
  firstStart: number | null;
  completionTime: number | null;
  mlfqLevel: 0 | 1 | 2;
  quantumUsedInLevel: number;
  waitInQueue: number;
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
  private agingInterval: number;
  private quantumRemaining: number = 0;
  private ganttSegmentStart: number = 0;
  private completed: boolean = false;
  private totalProcesses: number = 0;
  private completedCount: number = 0;

  // MLFQ specific queues
  private mlfqQ0: string[] = [];
  private mlfqQ1: string[] = [];
  private mlfqQ2: string[] = [];
  private mlfqBoostInterval: number = 20;
  private mlfqQ0Quantum: number = 2;
  private mlfqQ1Quantum: number = 4;

  constructor(
    configs: ProcessConfig[],
    algorithm: AlgorithmType,
    quantum: number = 2,
    priorityDirection: PriorityDirection = 'lower',
    agingInterval: number = 3
  ) {
    this.algorithm = algorithm;
    this.quantum = quantum;
    this.priorityDirection = priorityDirection;
    this.agingInterval = agingInterval;
    this.totalProcesses = configs.length;
    this.completedCount = 0;
    this.mlfqQ0Quantum = quantum;
    this.mlfqQ1Quantum = quantum * 2;

    this.processes = configs.map((p) => ({
      pid: p.pid,
      arrivalTime: p.arrivalTime,
      burstTime: p.burstTime,
      remainingTime: p.burstTime,
      priority: p.priority,
      effectivePriority: p.priority,
      status: 'NEW' as ProcessStatus,
      firstStart: null,
      completionTime: null,
      mlfqLevel: 0,
      quantumUsedInLevel: 0,
      waitInQueue: 0,
    }));
  }

  get isCompleted(): boolean {
    return this.completed;
  }

  get time(): number {
    return this.currentTime;
  }

  get totalTime(): number {
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
    if (this.algorithm === 'MLFQ') {
      return [...this.mlfqQ0, ...this.mlfqQ1, ...this.mlfqQ2];
    }
    return [...this.readyQueue];
  }

  getMlfqQueues(): { q0: string[]; q1: string[]; q2: string[] } {
    return {
      q0: [...this.mlfqQ0],
      q1: [...this.mlfqQ1],
      q2: [...this.mlfqQ2],
    };
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
        mlfqQueues: this.getMlfqQueues(),
      };
    }

    const stepEvents: SimulationEvent[] = [];
    let decision: SchedulerDecision | null = null;

    // 0. MLFQ Periodic Priority Boost
    if (this.algorithm === 'MLFQ' && this.currentTime > 0 && this.currentTime % this.mlfqBoostInterval === 0) {
      const boostedCount = this.mlfqQ1.length + this.mlfqQ2.length;
      while (this.mlfqQ1.length > 0) {
        const pid = this.mlfqQ1.shift()!;
        const proc = this.getProcess(pid);
        proc.mlfqLevel = 0;
        proc.quantumUsedInLevel = 0;
        this.mlfqQ0.push(pid);
      }
      while (this.mlfqQ2.length > 0) {
        const pid = this.mlfqQ2.shift()!;
        const proc = this.getProcess(pid);
        proc.mlfqLevel = 0;
        proc.quantumUsedInLevel = 0;
        this.mlfqQ0.push(pid);
      }
      if (this.cpuProcess) {
        const cpuProc = this.getProcess(this.cpuProcess);
        cpuProc.mlfqLevel = 0;
        cpuProc.quantumUsedInLevel = 0;
      }
      if (boostedCount > 0) {
        stepEvents.push({
          time: this.currentTime,
          type: 'BOOST',
          category: 'boost',
          message: `Periodic Priority Boost: ${boostedCount} process(es) promoted to Q0`,
          explanation: `To prevent starvation of long or CPU-bound processes in lower queues, the OS periodic boost reset all ready processes to top-level Q0.`,
        });
      }
    }

    // 1. Process arrivals at current time
    for (const p of this.processes) {
      if (p.arrivalTime === this.currentTime && p.status === 'NEW') {
        p.status = 'READY';
        if (this.algorithm === 'MLFQ') {
          p.mlfqLevel = 0;
          p.quantumUsedInLevel = 0;
          this.mlfqQ0.push(p.pid);
        } else {
          this.readyQueue.push(p.pid);
        }

        stepEvents.push({
          time: this.currentTime,
          type: 'ARRIVAL',
          category: 'arrival',
          pid: p.pid,
          message: `${p.pid} arrived in system (Burst: ${p.burstTime}, Priority: ${p.priority})`,
          explanation: `${p.pid} arrived at T=${this.currentTime}. Initialized with remaining time ${p.burstTime} and queued in the Ready Queue. ${this.cpuProcess ? `CPU is currently busy with ${this.cpuProcess}.` : 'CPU is idle; scheduling evaluation triggered.'}`,
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
        this.flushGanttSegment();
        currentProc.status = 'READY';
        this.readyQueue.push(this.cpuProcess);
        stepEvents.push({
          time: this.currentTime,
          type: 'PREEMPTED',
          category: 'preemption',
          pid: this.cpuProcess,
          message: `${this.cpuProcess} preempted by ${shorterInQueue}`,
          explanation: `Preemption: ${shorterInQueue} has a shorter remaining burst (${this.getProcess(shorterInQueue).remainingTime} units) than ${this.cpuProcess}'s remaining ${currentProc.remainingTime} units. The OS halts ${this.cpuProcess} and saves its state.`,
        });
        this.cpuProcess = null;
      }
    }

    // 2b. Handle MLFQ Preemption (Higher Queue Arrival)
    if (this.algorithm === 'MLFQ' && this.cpuProcess) {
      const currentProc = this.getProcess(this.cpuProcess);
      const higherPriorityArrival =
        (currentProc.mlfqLevel === 1 && this.mlfqQ0.length > 0) ||
        (currentProc.mlfqLevel === 2 && (this.mlfqQ0.length > 0 || this.mlfqQ1.length > 0));

      if (higherPriorityArrival) {
        this.flushGanttSegment();
        currentProc.status = 'READY';
        if (currentProc.mlfqLevel === 1) this.mlfqQ1.push(this.cpuProcess);
        else this.mlfqQ2.push(this.cpuProcess);

        stepEvents.push({
          time: this.currentTime,
          type: 'PREEMPTED',
          category: 'preemption',
          pid: this.cpuProcess,
          message: `${this.cpuProcess} (Q${currentProc.mlfqLevel}) preempted by higher priority queue`,
          explanation: `In MLFQ, processes in higher priority queues strictly preempt lower queues. ${this.cpuProcess} surrendered CPU back to Q${currentProc.mlfqLevel}.`,
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
          category: 'quantum',
          pid: this.cpuProcess,
          message: `Time slice expired for ${this.cpuProcess} (Q=${this.quantum})`,
          explanation: `Timer interrupt fired: ${this.cpuProcess} completed its allocated ${this.quantum}-unit quantum and was placed at the tail of the ready queue for fairness.`,
        });
        this.cpuProcess = null;
      }
    }

    // 3b. Handle MLFQ Quantum Demotion
    if (this.algorithm === 'MLFQ' && this.cpuProcess) {
      const proc = this.getProcess(this.cpuProcess);
      const currentLevelQuantum = proc.mlfqLevel === 0 ? this.mlfqQ0Quantum : this.mlfqQ1Quantum;

      if (proc.mlfqLevel < 2 && proc.quantumUsedInLevel >= currentLevelQuantum) {
        this.flushGanttSegment();
        proc.status = 'READY';
        const oldLevel = proc.mlfqLevel;
        proc.mlfqLevel = (oldLevel + 1) as 1 | 2;
        proc.quantumUsedInLevel = 0;

        if (proc.mlfqLevel === 1) this.mlfqQ1.push(this.cpuProcess);
        else this.mlfqQ2.push(this.cpuProcess);

        stepEvents.push({
          time: this.currentTime,
          type: 'QUANTUM_EXPIRED',
          category: 'quantum',
          pid: this.cpuProcess,
          message: `${this.cpuProcess} exhausted quantum in Q${oldLevel} -> demoted to Q${proc.mlfqLevel}`,
          explanation: `MLFQ Rule: Process used its entire time allotment in Q${oldLevel} without finishing. It is flagged as CPU-bound and demoted to Q${proc.mlfqLevel}.`,
        });
        this.cpuProcess = null;
      }
    }

    // 3c. Priority with Aging updates for waiting processes
    if (this.algorithm === 'PRIORITY_AGING') {
      for (const pid of this.readyQueue) {
        const proc = this.getProcess(pid);
        proc.waitInQueue++;
        if (proc.waitInQueue >= this.agingInterval) {
          proc.waitInQueue = 0;
          const oldPri = proc.effectivePriority;
          if (this.priorityDirection === 'lower') {
            proc.effectivePriority = Math.max(1, proc.effectivePriority - 1);
          } else {
            proc.effectivePriority = proc.effectivePriority + 1;
          }
          stepEvents.push({
            time: this.currentTime,
            type: 'AGING',
            category: 'aging',
            pid: proc.pid,
            message: `${proc.pid} aged: priority improved from ${oldPri} to ${proc.effectivePriority}`,
            explanation: `Anti-starvation aging: ${proc.pid} waited in the ready queue for ${this.agingInterval} time units. Its priority was boosted to prevent starvation.`,
          });
        }
      }
    }

    // 4. If CPU is free, schedule next process
    const hasReadyProcesses =
      this.algorithm === 'MLFQ'
        ? this.mlfqQ0.length > 0 || this.mlfqQ1.length > 0 || this.mlfqQ2.length > 0
        : this.readyQueue.length > 0;

    if (!this.cpuProcess && hasReadyProcesses) {
      const selectedPid = this.selectProcess();
      if (selectedPid) {
        const proc = this.getProcess(selectedPid);
        if (this.algorithm === 'MLFQ') {
          if (this.mlfqQ0[0] === selectedPid) this.mlfqQ0.shift();
          else if (this.mlfqQ1[0] === selectedPid) this.mlfqQ1.shift();
          else if (this.mlfqQ2[0] === selectedPid) this.mlfqQ2.shift();
        } else {
          this.readyQueue = this.readyQueue.filter((pid) => pid !== selectedPid);
        }

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
          category: 'selection',
          pid: selectedPid,
          message: `Scheduler selected ${selectedPid} to execute on CPU`,
          explanation: decision.whyWinnerWon,
        });
      }
    }

    // 5. If CPU still idle
    if (!this.cpuProcess) {
      const unfinished = this.processes.filter((p) => p.status !== 'TERMINATED');

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
          mlfqQueues: this.getMlfqQueues(),
        };
      }

      // Record idle gantt
      const idleSegment: GanttSegment = {
        pid: null,
        start: this.currentTime,
        end: this.currentTime + 1,
      };

      if (
        this.gantt.length > 0 &&
        this.gantt[this.gantt.length - 1].pid === null &&
        this.gantt[this.gantt.length - 1].end === this.currentTime
      ) {
        this.gantt[this.gantt.length - 1].end = this.currentTime + 1;
      } else {
        this.gantt.push(idleSegment);
      }

      stepEvents.push({
        time: this.currentTime,
        type: 'IDLE',
        category: 'idle',
        message: 'CPU idle (waiting for process arrival)',
        explanation: 'The ready queue is empty while pending processes arrive at later timestamps. CPU enters idle state.',
      });

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
        mlfqQueues: this.getMlfqQueues(),
      };
    }

    // 6. Execute on CPU for 1 time unit
    const runningProc = this.getProcess(this.cpuProcess);
    runningProc.remainingTime--;
    runningProc.quantumUsedInLevel++;

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

      const tat = runningProc.completionTime - runningProc.arrivalTime;
      const wt = tat - runningProc.burstTime;

      stepEvents.push({
        time: this.currentTime,
        type: 'COMPLETED',
        category: 'completion',
        pid: this.cpuProcess,
        message: `${this.cpuProcess} completed execution (TAT: ${tat}, WT: ${wt})`,
        explanation: `${this.cpuProcess} exhausted all ${runningProc.burstTime} burst units. Turnaround: ${tat} units, Total Wait: ${wt} units. Process PCB terminated.`,
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
      mlfqQueues: this.getMlfqQueues(),
    };
  }

  // ---- Private helpers ----

  private getProcess(pid: string): SimProcessState {
    return this.processes.find((p) => p.pid === pid)!;
  }

  private selectProcess(): string | null {
    if (this.algorithm === 'MLFQ') {
      if (this.mlfqQ0.length > 0) return this.mlfqQ0[0];
      if (this.mlfqQ1.length > 0) return this.mlfqQ1[0];
      if (this.mlfqQ2.length > 0) return this.mlfqQ2[0];
      return null;
    }

    if (this.readyQueue.length === 0) return null;

    const queueProcesses = this.readyQueue.map((pid) => this.getProcess(pid));

    switch (this.algorithm) {
      case 'FCFS': {
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
      case 'PRIORITY_AGING': {
        queueProcesses.sort((a, b) => {
          const pCmp =
            this.priorityDirection === 'lower'
              ? a.effectivePriority - b.effectivePriority
              : b.effectivePriority - a.effectivePriority;
          return pCmp !== 0 ? pCmp : a.pid.localeCompare(b.pid);
        });
        return queueProcesses[0].pid;
      }
      case 'RR': {
        return this.readyQueue[0];
      }
      default:
        return this.readyQueue[0];
    }
  }

  private generateDecision(pid: string): SchedulerDecision {
    const proc = this.getProcess(pid);
    let reason = '';
    let whyWinnerWon = '';
    let educationalTip = '';
    const candidates: SchedulerCandidate[] = [];

    const readyPids = this.algorithm === 'MLFQ'
      ? [...this.mlfqQ0, ...this.mlfqQ1, ...this.mlfqQ2]
      : this.readyQueue;

    for (const p of readyPids) {
      const candidate = this.getProcess(p);
      let scoreVal: string | number = '';
      let detail = '';
      if (this.algorithm === 'FCFS') {
        scoreVal = candidate.arrivalTime;
        detail = `Arrival T=${candidate.arrivalTime}`;
      } else if (this.algorithm === 'SJF') {
        scoreVal = candidate.burstTime;
        detail = `Burst=${candidate.burstTime}`;
      } else if (this.algorithm === 'SRTF') {
        scoreVal = candidate.remainingTime;
        detail = `Remaining=${candidate.remainingTime}`;
      } else if (this.algorithm === 'PRIORITY') {
        scoreVal = candidate.priority;
        detail = `Priority=${candidate.priority}`;
      } else if (this.algorithm === 'PRIORITY_AGING') {
        scoreVal = candidate.effectivePriority;
        detail = `Effective Pri=${candidate.effectivePriority} (Base: ${candidate.priority})`;
      } else if (this.algorithm === 'MLFQ') {
        scoreVal = `Q${candidate.mlfqLevel}`;
        detail = `Queue Level Q${candidate.mlfqLevel}`;
      } else {
        scoreVal = 'FIFO Head';
        detail = 'Front of Queue';
      }
      candidates.push({ pid: p, score: scoreVal, detail });
    }

    switch (this.algorithm) {
      case 'FCFS':
        reason = `${pid} arrived first among available processes.`;
        whyWinnerWon = `Selected ${pid} because it entered the ready queue earliest at T=${proc.arrivalTime}.`;
        educationalTip = 'FCFS follows strict First-In-First-Out order, avoiding queue reordering overhead.';
        break;
      case 'SJF':
        reason = `${pid} has the shortest burst time (${proc.burstTime}) in the ready queue.`;
        whyWinnerWon = `Selected ${pid} because its total burst (${proc.burstTime}) is the shortest available, minimizing collective waiting time.`;
        educationalTip = 'Shortest Job First minimizes average wait by servicing quick processes immediately.';
        break;
      case 'SRTF':
        reason = `${pid} has the shortest remaining execution time (${proc.remainingTime}).`;
        whyWinnerWon = `Selected ${pid} because only ${proc.remainingTime} units of execution remain, beating all other candidates.`;
        educationalTip = 'SRTF preemptively yields the CPU whenever a shorter job enters the ready queue.';
        break;
      case 'PRIORITY':
        reason = `${pid} holds the ${this.priorityDirection === 'lower' ? 'lowest (best)' : 'highest'} priority value (${proc.priority}).`;
        whyWinnerWon = `Selected ${pid} based on priority ranking (${proc.priority}).`;
        educationalTip = 'Priority scheduling services urgent tasks first, but risks starving low-priority tasks.';
        break;
      case 'PRIORITY_AGING':
        reason = `${pid} has the best effective priority (${proc.effectivePriority}) after aging.`;
        whyWinnerWon = `Selected ${pid} with effective priority ${proc.effectivePriority} (aged from original ${proc.priority}).`;
        educationalTip = 'Aging boosts the priority of waiting processes over time, mathematically guaranteeing bounded waiting time.';
        break;
      case 'RR':
        reason = `${pid} is at the head of the circular ready queue.`;
        whyWinnerWon = `Selected ${pid} according to fair FIFO time-sharing order.`;
        educationalTip = 'Round Robin guarantees that all ready tasks receive CPU attention within a deterministic timeframe.';
        break;
      case 'MLFQ':
        reason = `${pid} is in the highest non-empty queue (Q${proc.mlfqLevel}).`;
        whyWinnerWon = `Selected ${pid} because Q${proc.mlfqLevel} is the highest priority queue currently holding ready jobs.`;
        educationalTip = 'MLFQ prioritizes short interactive jobs in Q0 and demotes compute-heavy jobs to lower queues.';
        break;
    }

    return {
      pid,
      reason,
      algorithm: this.algorithm,
      whyWinnerWon,
      educationalTip,
      candidates,
    };
  }

  private flushGanttSegment(): void {
    if (this.cpuProcess && this.currentTime > this.ganttSegmentStart) {
      const newSeg: GanttSegment = {
        pid: this.cpuProcess,
        start: this.ganttSegmentStart,
        end: this.currentTime,
      };

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
