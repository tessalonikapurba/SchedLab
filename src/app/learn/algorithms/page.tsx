'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  GitBranch,
  ArrowRight,
  Play,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Zap,
  RotateCw,
  Scale,
  Sparkles,
} from 'lucide-react';
import { useSimulationStore } from '@/store/simulation';
import { PRESET_SCENARIOS } from '@/lib/constants';
import type { AlgorithmType } from '@/lib/types';

interface AlgoDetail {
  type: AlgorithmType;
  title: string;
  preemptive: boolean;
  tagline: string;
  description: string;
  logic: string[];
  pros: string[];
  cons: string[];
  formulaTitle: string;
  formula: string;
  formulaNote: string;
  phenomenon: {
    name: string;
    desc: string;
  };
}

const ALGORITHMS_DATA: AlgoDetail[] = [
  {
    type: 'FCFS',
    title: 'First-Come, First-Served (FCFS)',
    preemptive: false,
    tagline: 'Non-preemptive FIFO queue ordering based strictly on arrival time.',
    description:
      'The simplest scheduling algorithm. Processes are allocated the CPU in the exact order in which they request it, managed through a standard FIFO queue. When a process enters the ready queue, its PCB is linked onto the tail of the queue. When the CPU becomes free, it is allocated to the process at the head of the queue.',
    logic: [
      'Short-term scheduler selects the process at the head of the FIFO ready queue.',
      'Process executes uninterrupted until its entire CPU burst is complete.',
      'If CPU is idle when a process arrives, it immediately begins execution.',
      'Ties in arrival time are resolved deterministically by process ID (PID).',
    ],
    pros: [
      'Simple to understand, verify, and implement.',
      'Completely starvation-free: every arriving process will eventually execute.',
      'Minimal scheduler overhead; zero preemption context-switching costs.',
    ],
    cons: [
      'Average waiting time is often very high compared to shortest-burst algorithms.',
      'Vulnerable to the Convoy Effect, where small processes wait behind a massive CPU burst.',
      'Unsuitable for interactive time-sharing systems.',
    ],
    formulaTitle: 'Average Waiting Time',
    formula: 'Avg WT = (Σ (Completion_i − Arrival_i − Burst_i)) / N',
    formulaNote: 'Highly sensitive to process arrival sequence ordering.',
    phenomenon: {
      name: 'The Convoy Effect',
      desc: 'All other processes wait for one big process to get off the CPU. Results in lower CPU and device utilization than might be possible if shorter processes were allowed to run first.',
    },
  },
  {
    type: 'SJF',
    title: 'Shortest Job First (SJF)',
    preemptive: false,
    tagline: 'Non-preemptive policy that schedules the available process with the shortest CPU burst.',
    description:
      'SJF associates with each process the length of its next CPU burst. When the CPU becomes available, it is assigned to the process that has the smallest CPU burst. If the next CPU bursts of two processes are the same, FCFS scheduling is used to break the tie.',
    logic: [
      'When CPU becomes idle, inspect all currently arrived processes in the ready queue.',
      'Select the candidate with the smallest burst time.',
      'Once assigned, the job executes to completion without interruption.',
      'Newly arriving shorter jobs must wait until the running process finishes.',
    ],
    pros: [
      'Provably optimal for minimizing average waiting time among non-preemptive algorithms.',
      'Rapidly clears short tasks from the system, keeping queues small.',
      'High throughput for systems dominated by short I/O-bound bursts.',
    ],
    cons: [
      'Impossible to know the exact length of future CPU bursts in general-purpose OS kernels.',
      'Can cause starvation (indefinite postponement) for long processes if short jobs arrive continually.',
      'Requires exponential smoothing prediction (τ_{n+1} = α·t_n + (1-α)·τ_n) in practical heuristics.',
    ],
    formulaTitle: 'Exponential Smoothing Burst Prediction',
    formula: 'τ_{n+1} = α · t_n + (1 − α) · τ_n',
    formulaNote: 'Where t_n is actual recent burst length and α (typically 0.5) controls history weighting.',
    phenomenon: {
      name: 'Starvation (Indefinite Blocking)',
      desc: 'A long process can wait indefinitely if a continuous stream of shorter processes arrives in the ready queue.',
    },
  },
  {
    type: 'SRTF',
    title: 'Shortest Remaining Time First (SRTF)',
    preemptive: true,
    tagline: 'Preemptive counterpart of SJF that preempts if a newly arrived job has a shorter remaining burst.',
    description:
      'SRTF continuously evaluates the remaining burst time of the currently running process against any newly arriving processes. If an arriving process has a burst time shorter than the remaining execution time of the current process, the current process is preempted and returned to the ready queue.',
    logic: [
      'At every clock tick or arrival event, compare remaining times of all ready processes.',
      'If an arriving process has remaining burst < current process remaining burst, preempt!',
      'Preempted process status returns to READY; scheduler context-switches to the shorter job.',
      'Guarantees that at any point in time, the CPU is running the closest-to-completion job.',
    ],
    pros: [
      'Optimal average waiting and turnaround time among all scheduling algorithms.',
      'Quick response time for very short interactive bursts.',
      'Highly responsive to newly arriving urgent tasks.',
    ],
    cons: [
      'High context switching overhead due to frequent preemptions.',
      'Even more prone to starvation of long processes than non-preemptive SJF.',
      'Requires continuous tracking of elapsed burst times on every clock tick.',
    ],
    formulaTitle: 'Preemption Condition',
    formula: 'Preempt IF: Burst(P_new) < Remaining(P_running)',
    formulaNote: 'Checked on every process arrival event.',
    phenomenon: {
      name: 'Preemption Thrashing',
      desc: 'Frequent arrivals of slightly shorter processes can cause excessive context switches, spending more time switching than executing productive code.',
    },
  },
  {
    type: 'PRIORITY',
    title: 'Priority Scheduling',
    preemptive: false,
    tagline: 'Schedules processes based on integer priority rankings assigned by the OS or user.',
    description:
      'A priority number (integer) is associated with each process. The CPU is allocated to the process with the highest priority. Equal-priority processes are scheduled in FCFS order. Priority can be defined either internally (memory limits, open files) or externally (importance, funds paid, user ranking).',
    logic: [
      'Each process has an integer priority ranking.',
      'Depending on kernel convention, either lowest integer = highest priority (Unix/POSIX standard) or highest integer = highest priority.',
      'Scheduler always selects the highest priority ready process.',
      'Can be implemented as preemptive or non-preemptive.',
    ],
    pros: [
      'Directly reflects real-world process importance and business criticality.',
      'Enables real-time and kernel daemon threads to take precedence over background tasks.',
      'Flexible framework capable of simulating FCFS and SJF as special cases.',
    ],
    cons: [
      'Major risk of indefinite starvation for low-priority processes.',
      'Priority Inversion: a low-priority process holding a mutex can block a high-priority process.',
      'Requires Aging techniques or Priority Inheritance protocols to maintain fairness.',
    ],
    formulaTitle: 'Aging Solution to Starvation',
    formula: 'Priority(P) = BasePriority − k · (CurrentTime − ArrivalTime)',
    formulaNote: 'Gradually elevates the priority of processes waiting in the queue for long periods.',
    phenomenon: {
      name: 'Priority Inversion',
      desc: 'Occurs when a high-priority task is indirectly preempted by a lower-priority task holding a shared resource, leading to system deadline misses (e.g. Mars Pathfinder anomaly).',
    },
  },
  {
    type: 'RR',
    title: 'Round Robin (RR)',
    preemptive: true,
    tagline: 'Time-sharing policy where each process is given a small slice of CPU time (quantum).',
    description:
      'The Round Robin (RR) scheduling algorithm is designed especially for time-sharing systems. A small unit of time, called a time quantum or time slice (typically 10 to 100 milliseconds), is defined. The ready queue is treated as a circular FIFO queue. The CPU scheduler goes around the ready queue, allocating the CPU to each process for a time interval of up to 1 time quantum.',
    logic: [
      'Scheduler maintains a FIFO circular ready queue.',
      'Process executes until it terminates OR until its allocated time quantum expires.',
      'When quantum expires, the hardware timer generates an interrupt.',
      'The process is preempted, appended to the tail of the ready queue, and the next process is dispatched.',
    ],
    pros: [
      'Fair allocation of CPU resources; no process waits more than (N - 1) × q time units for a turn.',
      'Excellent response time for interactive applications.',
      'Starvation-free: every process in the ready queue makes steady forward progress.',
    ],
    cons: [
      'Average turnaround time is often higher than SJF/SRTF.',
      'Performance heavily dependent on the chosen time quantum (q).',
      'If q is too small, context switch overhead dominates; if q is too large, it degenerates into FCFS.',
    ],
    formulaTitle: 'Response Time Bound & 80/20 Rule',
    formula: 'Max Response Wait ≤ (N − 1) · q',
    formulaNote: 'Rule of Thumb: 80% of CPU bursts should be shorter than the time quantum q.',
    phenomenon: {
      name: 'Quantum Sensitivity Trade-off',
      desc: 'If q is 1ms and context switch takes 0.1ms, 10% of CPU capacity is wasted on pure overhead. If q is 1000ms, responsiveness becomes sluggish.',
    },
  },
];

export default function AlgorithmsPage() {
  const router = useRouter();
  const [selectedAlgo, setSelectedAlgo] = useState<AlgorithmType>('FCFS');
  const { setProcesses, setAlgorithm, setQuantum, initializeSimulation } = useSimulationStore();

  const current = ALGORITHMS_DATA.find((a) => a.type === selectedAlgo) || ALGORITHMS_DATA[0];

  const handleLaunchSimulator = (algo: AlgorithmType) => {
    // Choose appropriate preset
    let preset = PRESET_SCENARIOS[0];
    if (algo === 'FCFS') preset = PRESET_SCENARIOS[1]; // Convoy effect demo
    else if (algo === 'SJF' || algo === 'SRTF') preset = PRESET_SCENARIOS[2]; // SJF demo
    else if (algo === 'PRIORITY') preset = PRESET_SCENARIOS[4]; // Priority demo
    else if (algo === 'RR') preset = PRESET_SCENARIOS[3]; // RR demo

    setProcesses(preset.processes);
    setAlgorithm(algo);
    if (algo === 'RR') setQuantum(2);
    initializeSimulation();
    router.push('/simulator/live');
  };

  return (
    <div className="space-y-8">
      {/* Module Header */}
      <div className="border-b border-border pb-6">
        <div className="flex items-center gap-2 text-xs text-accent font-semibold uppercase tracking-wider mb-2">
          <span>Module 04</span>
          <span>•</span>
          <span>Algorithmic Deep Dive</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
          CPU Scheduling Algorithms
        </h1>
        <p className="text-sm text-muted mt-2 leading-relaxed max-w-3xl">
          Select an algorithm below to analyze its mathematical formulas, execution rules, preemption conditions, classical pitfalls (starvation, convoy effect, priority inversion), and simulate it live.
        </p>
      </div>

      {/* Algorithm Tabs */}
      <div className="flex flex-wrap gap-2">
        {ALGORITHMS_DATA.map((algo) => (
          <button
            key={algo.type}
            onClick={() => setSelectedAlgo(algo.type)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              selectedAlgo === algo.type
                ? 'bg-accent text-white shadow-sm'
                : 'bg-surface-alt border border-border text-muted hover:text-foreground hover:bg-surface-elevated'
            }`}
          >
            {algo.type}
          </button>
        ))}
      </div>

      {/* Selected Algorithm Card */}
      <motion.div
        key={selectedAlgo}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="space-y-6"
      >
        {/* Title Banner */}
        <div className="p-6 rounded-2xl bg-surface-alt border border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  current.preemptive
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                }`}
              >
                {current.preemptive ? 'Preemptive' : 'Non-Preemptive'}
              </span>
              <span className="text-xs text-muted font-mono">{current.type}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">{current.title}</h2>
            <p className="text-xs text-muted max-w-2xl">{current.tagline}</p>
          </div>

          <button
            onClick={() => handleLaunchSimulator(current.type)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-semibold transition-colors shadow-sm shrink-0"
          >
            <Play size={14} fill="currentColor" />
            Simulate {current.type} Live
          </button>
        </div>

        {/* Description & Execution Rules */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="p-5 rounded-xl bg-surface-alt border border-border space-y-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <GitBranch size={16} className="text-accent" />
              How It Works
            </h3>
            <p className="text-xs text-muted leading-relaxed">{current.description}</p>

            <div className="pt-2">
              <span className="text-[11px] font-semibold text-foreground block mb-2">
                Execution Steps & Logic:
              </span>
              <ol className="list-decimal pl-4 space-y-1 text-xs text-muted">
                {current.logic.map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ol>
            </div>
          </div>

          {/* Formulas & Phenomenon */}
          <div className="space-y-4">
            <div className="p-5 rounded-xl bg-surface-alt border border-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">{current.formulaTitle}</span>
                <Clock size={15} className="text-accent" />
              </div>
              <div className="p-2.5 rounded-lg bg-surface border border-border font-mono text-accent text-xs font-semibold">
                {current.formula}
              </div>
              <p className="text-[11px] text-muted">{current.formulaNote}</p>
            </div>

            <div className="p-5 rounded-xl bg-surface-alt border border-amber-500/30 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                <AlertTriangle size={15} />
                <span>Classic Vulnerability: {current.phenomenon.name}</span>
              </div>
              <p className="text-xs text-muted leading-relaxed">{current.phenomenon.desc}</p>
            </div>
          </div>
        </div>

        {/* Pros and Cons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="p-5 rounded-xl bg-surface-alt border border-border space-y-2">
            <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
              <CheckCircle2 size={15} />
              Advantages
            </h4>
            <ul className="space-y-1.5 text-xs text-muted">
              {current.pros.map((pro, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">•</span>
                  <span>{pro}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-5 rounded-xl bg-surface-alt border border-border space-y-2">
            <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
              <AlertTriangle size={15} />
              Disadvantages & Trade-offs
            </h4>
            <ul className="space-y-1.5 text-xs text-muted">
              {current.cons.map((con, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-amber-400 mt-0.5">•</span>
                  <span>{con}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Comparison CTA */}
      <div className="p-6 rounded-2xl bg-surface-alt border border-border flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Scale size={18} className="text-accent" />
            Compare all 5 algorithms side-by-side
          </h4>
          <p className="text-xs text-muted mt-0.5">
            Want to see which algorithm achieves the lowest turnaround time on your custom workload?
          </p>
        </div>
        <Link
          href="/compare"
          className="flex items-center gap-1.5 px-4 py-2 bg-surface hover:bg-surface-elevated border border-border rounded-xl text-xs font-semibold text-foreground transition-colors shrink-0"
        >
          <span>Open Comparison Lab</span>
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
