'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Cpu,
  ArrowRight,
  Clock,
  Zap,
  RotateCw,
  Gauge,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export default function CpuSchedulingPage() {
  // Interactive mini-calculator state
  const [arrival, setArrival] = useState(0);
  const [burst, setBurst] = useState(6);
  const [start, setStart] = useState(2);
  const [completion, setCompletion] = useState(8);

  const turnaround = Math.max(0, completion - arrival);
  const waiting = Math.max(0, turnaround - burst);
  const response = Math.max(0, start - arrival);

  return (
    <div className="space-y-8">
      {/* Module Header */}
      <div className="border-b border-border pb-6">
        <div className="flex items-center gap-2 text-xs text-accent font-semibold uppercase tracking-wider mb-2">
          <span>Module 03</span>
          <span>•</span>
          <span>Core Concepts</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
          CPU Scheduling Fundamentals
        </h1>

        <p className="text-sm text-muted mt-2 leading-relaxed max-w-3xl">
          CPU scheduling is the basis of multiprogrammed operating systems.
          By switching the CPU among processes, the operating system makes the
          computer more productive and interactive.
        </p>
      </div>

      {/* The CPU-I/O Burst Cycle */}
      <div className="p-6 rounded-xl bg-surface-alt border border-border space-y-4">
        <div className="flex items-center gap-2">
          <RotateCw size={18} className="text-accent" />

          <h2 className="text-base font-bold text-foreground">
            The CPU-I/O Burst Cycle
          </h2>
        </div>

        <p className="text-xs text-muted leading-relaxed">
          Process execution consists of a cycle of{' '}
          <strong>CPU execution</strong> and <strong>I/O wait</strong>.
          Processes alternate between these two states. Process execution
          begins with a CPU burst, followed by an I/O burst, followed by
          another CPU burst, eventually terminating on a CPU burst.
        </p>

        {/* Visual Burst Cycle Flow */}
        <div className="p-4 rounded-lg bg-surface border border-border">
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-mono">
            <span className="px-3 py-1.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              CPU Burst (Compute)
            </span>

            <span className="text-muted">→</span>

            <span className="px-3 py-1.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
              I/O Burst (Wait for Disk/Net)
            </span>

            <span className="text-muted">→</span>

            <span className="px-3 py-1.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              CPU Burst
            </span>

            <span className="text-muted">→</span>

            <span className="px-3 py-1.5 rounded bg-slate-500/20 text-slate-300 border border-slate-500/30">
              Process Termination
            </span>
          </div>

          <p className="text-[11px] text-muted text-center mt-3">
            An <strong>I/O-bound process</strong> spends more time doing I/O
            than computations (frequent short CPU bursts). A{' '}
            <strong>CPU-bound process</strong> generates I/O requests
            infrequently, using more time doing computations (infrequent long
            CPU bursts).
          </p>
        </div>
      </div>

      {/* Preemptive vs Non-Preemptive Scheduling */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Non-Preemptive */}
        <div className="p-5 rounded-xl bg-surface-alt border border-border space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Zap size={16} className="text-amber-400" />
              Non-Preemptive (Cooperative)
            </h3>

            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface border border-border text-muted">
              FCFS, SJF
            </span>
          </div>

          <p className="text-xs text-muted leading-relaxed">
            Once the CPU has been allocated to a process, the process keeps
            the CPU until it releases it either by terminating or by switching
            to the waiting state.
          </p>

          <div className="space-y-1.5 pt-1 text-xs">
            <div className="flex items-center gap-2 text-emerald-400 text-[11px]">
              <CheckCircle2 size={13} className="shrink-0" />
              <span>
                Simple design; zero preemption context-switch overhead.
              </span>
            </div>

            <div className="flex items-center gap-2 text-amber-400 text-[11px]">
              <AlertTriangle size={13} className="shrink-0" />
              <span>
                One runaway loop or greedy process can freeze the entire system.
              </span>
            </div>
          </div>
        </div>

        {/* Preemptive */}
        <div className="p-5 rounded-xl bg-surface-alt border border-border space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Clock size={16} className="text-accent" />
              Preemptive Scheduling
            </h3>

            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface border border-border text-muted">
              SRTF, Round Robin
            </span>
          </div>

          <p className="text-xs text-muted leading-relaxed">
            The CPU can be forcibly taken away from a running process when
            higher-priority processes arrive or when a hardware timer interrupt
            signals quantum expiration.
          </p>

          <div className="space-y-1.5 pt-1 text-xs">
            <div className="flex items-center gap-2 text-emerald-400 text-[11px]">
              <CheckCircle2 size={13} className="shrink-0" />
              <span>
                Guarantees responsiveness for interactive tasks and user input.
              </span>
            </div>

            <div className="flex items-center gap-2 text-amber-400 text-[11px]">
              <AlertTriangle size={13} className="shrink-0" />
              <span>
                Requires mutual exclusion locks for shared kernel data
                structures.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* The Dispatcher & Dispatch Latency */}
      <div className="p-5 rounded-xl bg-surface-alt border border-border space-y-3">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Cpu size={16} className="text-accent" />
          The OS Dispatcher &amp; Context Switch Latency
        </h3>

        <p className="text-xs text-muted leading-relaxed">
          The <strong>Dispatcher</strong> is the kernel module that gives
          control of the CPU to the process selected by the short-term
          scheduler. Its responsibilities include:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-surface border border-border space-y-1">
            <span className="font-semibold text-foreground text-xs block">
              1. Context Switching
            </span>

            <p className="text-[11px] text-muted">
              Saving outgoing registers to its PCB and loading incoming
              registers.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-surface border border-border space-y-1">
            <span className="font-semibold text-foreground text-xs block">
              2. Switching to User Mode
            </span>

            <p className="text-[11px] text-muted">
              Restricting processor privilege level from ring 0 (kernel) to
              ring 3 (user).
            </p>
          </div>

          <div className="p-3 rounded-lg bg-surface border border-border space-y-1">
            <span className="font-semibold text-foreground text-xs block">
              3. Jumping to Location
            </span>

            <p className="text-[11px] text-muted">
              Jumping to the instruction pointed to by the process&apos;s
              program counter.
            </p>
          </div>
        </div>

        <p className="text-[11px] text-muted pt-1">
          <strong>Dispatch Latency:</strong> The time it takes for the
          dispatcher to stop one process and start another running. During
          this duration, the CPU is performing pure administrative overhead
          and cannot execute user application code.
        </p>
      </div>

      {/* Interactive Criteria Calculator */}
      <div className="p-6 rounded-xl bg-surface-alt border border-border space-y-5">
        <div>
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Gauge size={18} className="text-accent" />
            Interactive Metric Playground
          </h3>

          <p className="text-xs text-muted mt-0.5">
            Tweak process execution timestamps below to observe how
            turnaround, waiting, and response times are derived.
          </p>
        </div>

        {/* Input sliders */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-lg bg-surface border border-border text-xs">
          <div>
            <label className="text-muted block mb-1">
              Arrival Time (AT): {arrival}
            </label>

            <input
              type="range"
              min="0"
              max="10"
              value={arrival}
              onChange={(e) => setArrival(Number(e.target.value))}
              className="w-full accent-accent"
            />
          </div>

          <div>
            <label className="text-muted block mb-1">
              Burst Time (BT): {burst}
            </label>

            <input
              type="range"
              min="1"
              max="15"
              value={burst}
              onChange={(e) => setBurst(Number(e.target.value))}
              className="w-full accent-accent"
            />
          </div>

          <div>
            <label className="text-muted block mb-1">
              First Start Time (ST): {start}
            </label>

            <input
              type="range"
              min={arrival}
              max="20"
              value={Math.max(arrival, start)}
              onChange={(e) => setStart(Number(e.target.value))}
              className="w-full accent-accent"
            />
          </div>

          <div>
            <label className="text-muted block mb-1">
              Completion Time (CT): {completion}
            </label>

            <input
              type="range"
              min={Math.max(arrival + burst, start + 1)}
              max="30"
              value={Math.max(arrival + burst, completion)}
              onChange={(e) => setCompletion(Number(e.target.value))}
              className="w-full accent-accent"
            />
          </div>
        </div>

        {/* Computed Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30 text-xs space-y-1">
            <span className="text-[11px] font-semibold text-blue-400 block">
              Turnaround Time (CT − AT)
            </span>

            <div className="text-2xl font-bold font-mono text-foreground">
              {turnaround}{' '}
              <span className="text-xs font-normal text-muted">
                units
              </span>
            </div>

            <p className="text-[10px] text-muted">
              Total lifespan from submission to termination
            </p>
          </div>

          <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs space-y-1">
            <span className="text-[11px] font-semibold text-amber-400 block">
              Waiting Time (TAT − BT)
            </span>

            <div className="text-2xl font-bold font-mono text-foreground">
              {waiting}{' '}
              <span className="text-xs font-normal text-muted">
                units
              </span>
            </div>

            <p className="text-[10px] text-muted">
              Time spent waiting in ready queue
            </p>
          </div>

          <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-1">
            <span className="text-[11px] font-semibold text-emerald-400 block">
              Response Time (ST − AT)
            </span>

            <div className="text-2xl font-bold font-mono text-foreground">
              {response}{' '}
              <span className="text-xs font-normal text-muted">
                units
              </span>
            </div>

            <p className="text-[10px] text-muted">
              Delay before the process first starts running
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <Link
          href="/learn/process-states"
          className="text-xs text-muted hover:text-foreground transition-colors"
        >
          ← Previous: Process States &amp; Lifecycle
        </Link>

        <Link
          href="/learn/algorithms"
          className="inline-flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-xs font-semibold transition-colors"
        >
          <span>Next: Scheduling Algorithms Deep Dive</span>
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}