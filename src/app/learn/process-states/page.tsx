'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Play,
  Clock,
  HardDrive,
  Cpu,
  Layers,
} from 'lucide-react';
import type { ProcessStatus } from '@/lib/types';

interface TransitionLog {
  from: string;
  to: string;
  trigger: string;
  time: string;
}

export default function ProcessStatesPage() {
  const [currentState, setCurrentState] = useState<ProcessStatus>('NEW');
  const [logs, setLogs] = useState<TransitionLog[]>([
    {
      from: 'NONE',
      to: 'NEW',
      trigger: 'sys_fork() / process creation initiated',
      time: '0.00s',
    },
  ]);

  const transitionTo = (to: ProcessStatus, trigger: string) => {
    const newLog: TransitionLog = {
      from: currentState,
      to,
      trigger,
      time: (Math.random() * 2 + 0.1).toFixed(2) + 's',
    };
    setCurrentState(to);
    setLogs((prev) => [newLog, ...prev].slice(0, 8));
  };

  const resetProcess = () => {
    setCurrentState('NEW');
    setLogs([
      {
        from: 'RESET',
        to: 'NEW',
        trigger: 'Clean state reset initiated',
        time: '0.00s',
      },
    ]);
  };

  const STATE_DESCRIPTIONS: Record<
    ProcessStatus,
    { title: string; color: string; bg: string; desc: string; hardware: string }
  > = {
    NEW: {
      title: 'New / Created',
      color: 'text-blue-400',
      bg: 'bg-blue-500/10 border-blue-500/30',
      desc: 'The process is being created and configured by the kernel (e.g., via fork() and exec()). The PCB is allocated, but the process is not yet admitted to the main memory ready queue.',
      hardware: 'Kernel allocates PCB in kernel space; executable binary read from disk storage.',
    },
    READY: {
      title: 'Ready',
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/30',
      desc: 'The process resides in main RAM and is waiting to be allocated CPU execution time by the kernel scheduler. All prerequisite resources (I/O, memory, locks) are ready.',
      hardware: 'Resident in RAM; linked into the Scheduler Ready Queue linked-list.',
    },
    RUNNING: {
      title: 'Running',
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/30',
      desc: 'Instructions are actively executing on physical CPU arithmetic logic units (ALU). Program counter is incrementing, registers are updating.',
      hardware: 'Physical CPU core registers loaded with PCB context; MMU translating active virtual addresses.',
    },
    WAITING: {
      title: 'Waiting / Blocked',
      color: 'text-purple-400',
      bg: 'bg-purple-500/10 border-purple-500/30',
      desc: 'The process cannot run even if CPU cores are idle because it is waiting for an external event to occur (e.g. disk read completion, network packet, timer, or mutex release).',
      hardware: 'CPU freed for other processes; process context linked into Device Wait Queue.',
    },
    TERMINATED: {
      title: 'Terminated / Zombie',
      color: 'text-slate-400',
      bg: 'bg-slate-500/10 border-slate-500/30',
      desc: 'The process has completed execution (via exit() or fatal signal). Memory space is deallocated, but the PCB remains as a zombie until the parent collects its exit status via wait().',
      hardware: 'Memory page tables freed; exit code preserved in PCB for parent process retrieval.',
    },
  };

  return (
    <div className="space-y-8">
      {/* Module Header */}
      <div className="border-b border-border pb-6">
        <div className="flex items-center gap-2 text-xs text-accent font-semibold uppercase tracking-wider mb-2">
          <span>Module 02</span>
          <span>•</span>
          <span>Process Lifecycle</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
          Process States & Lifecycle
        </h1>
        <p className="text-sm text-muted mt-2 leading-relaxed max-w-3xl">
          During its execution lifetime, a process cycles through distinct operating system states. The CPU scheduler continuously mediates transitions between these states in response to hardware clock interrupts, system calls, and I/O events.
        </p>
      </div>

      {/* Interactive State Machine Simulator */}
      <div className="p-6 rounded-xl bg-surface-alt border border-border space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Activity size={18} className="text-accent" />
              Interactive 5-State Machine Controller
            </h2>
            <p className="text-xs text-muted mt-0.5">
              Trigger kernel transitions and observe how the process lifecycle state machine responds.
            </p>
          </div>
          <button
            onClick={resetProcess}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border text-xs text-muted hover:text-foreground hover:bg-surface-elevated transition-colors"
          >
            <RotateCcw size={13} />
            Reset Process
          </button>
        </div>

        {/* Visual State Diagram Nodes */}
        <div className="p-6 rounded-xl bg-surface border border-border">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
            {(['NEW', 'READY', 'RUNNING', 'WAITING', 'TERMINATED'] as ProcessStatus[]).map(
              (status) => {
                const isCurrent = currentState === status;
                const info = STATE_DESCRIPTIONS[status];

                return (
                  <motion.div
                    key={status}
                    animate={{
                      scale: isCurrent ? 1.05 : 1,
                      borderColor: isCurrent ? 'rgb(59, 130, 246)' : 'rgba(255,255,255,0.08)',
                    }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className={`p-3 rounded-lg border-2 flex flex-col items-center justify-center min-h-[90px] relative transition-all ${
                      isCurrent
                        ? `${info.bg} shadow-md shadow-accent/10 font-bold`
                        : 'bg-surface-alt/50 border-border/60 opacity-60'
                    }`}
                  >
                    {isCurrent && (
                      <span className="absolute -top-2.5 px-2 py-0.2 rounded-full bg-accent text-white text-[9px] font-mono uppercase tracking-wider">
                        Active State
                      </span>
                    )}
                    <span className={`text-xs font-mono font-bold ${info.color}`}>
                      {status}
                    </span>
                    <span className="text-[10px] text-muted mt-1">{info.title}</span>
                  </motion.div>
                );
              }
            )}
          </div>

          {/* Active State Detail Panel */}
          <div className="mt-6 p-4 rounded-lg bg-surface-alt border border-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-accent" />
                Current State: <span className="font-mono text-accent">{currentState}</span>
              </span>
              <span className="text-[11px] text-muted font-mono">
                Status: {STATE_DESCRIPTIONS[currentState].title}
              </span>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              {STATE_DESCRIPTIONS[currentState].desc}
            </p>
            <div className="text-[11px] text-foreground/80 font-mono pt-1">
              <strong>Hardware & Queue State:</strong>{' '}
              <span className="text-muted">{STATE_DESCRIPTIONS[currentState].hardware}</span>
            </div>
          </div>
        </div>

        {/* Transition Action Triggers */}
        <div className="space-y-3">
          <span className="text-xs font-semibold text-foreground block">
            Available Kernel Event Triggers from current state ({currentState}):
          </span>

          <div className="flex flex-wrap gap-2">
            {currentState === 'NEW' && (
              <button
                onClick={() => transitionTo('READY', 'sys_admit() — memory allocated, admitted to ready queue')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-medium transition-colors"
              >
                <Play size={13} fill="currentColor" />
                Admit to Ready Queue (admit)
              </button>
            )}

            {currentState === 'READY' && (
              <button
                onClick={() => transitionTo('RUNNING', 'Scheduler Dispatcher selects process for CPU execution')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-medium transition-colors"
              >
                <Cpu size={13} />
                Scheduler Dispatch (dispatch)
              </button>
            )}

            {currentState === 'RUNNING' && (
              <>
                <button
                  onClick={() => transitionTo('READY', 'Timer interrupt fires — time quantum expired')}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-medium transition-colors"
                >
                  <Clock size={13} />
                  Time Quantum Expired (preempt)
                </button>
                <button
                  onClick={() => transitionTo('WAITING', 'Process issues blocking I/O system call (e.g. read())')}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-medium transition-colors"
                >
                  <HardDrive size={13} />
                  I/O or Event Wait (block)
                </button>
                <button
                  onClick={() => transitionTo('TERMINATED', 'Process calls exit(0) or terminates execution')}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-500/20 hover:bg-slate-500/30 text-slate-300 border border-slate-500/40 text-xs font-medium transition-colors"
                >
                  <AlertCircle size={13} />
                  Exit / Terminate (exit)
                </button>
              </>
            )}

            {currentState === 'WAITING' && (
              <button
                onClick={() => transitionTo('READY', 'Hardware disk controller raises interrupt: I/O operation complete')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-medium transition-colors"
              >
                <CheckCircle2 size={13} />
                I/O Complete Interrupt (wake up)
              </button>
            )}

            {currentState === 'TERMINATED' && (
              <button
                onClick={resetProcess}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent text-white text-xs font-medium transition-colors"
              >
                <RotateCcw size={13} />
                Create New Process
              </button>
            )}
          </div>
        </div>

        {/* Transition Log */}
        <div className="p-4 rounded-xl bg-surface border border-border space-y-2 font-mono text-xs">
          <span className="text-[11px] font-semibold text-muted uppercase tracking-wider block">
            Kernel State Transition Journal
          </span>
          <div className="space-y-1.5 max-h-36 overflow-y-auto">
            {logs.map((log, i) => (
              <div
                key={i}
                className="flex items-start gap-2 text-[11px] py-1 border-b border-border/40 last:border-0"
              >
                <span className="text-muted font-mono shrink-0">[{log.time}]</span>
                <span className="text-accent font-semibold">{log.from}</span>
                <span className="text-muted">→</span>
                <span className="text-emerald-400 font-semibold">{log.to}</span>
                <span className="text-muted truncate">: {log.trigger}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 7-State Model Explanation */}
      <div className="p-6 rounded-xl bg-surface-alt border border-border space-y-4">
        <div className="flex items-center gap-2">
          <Layers size={18} className="text-accent" />
          <h3 className="text-base font-bold text-foreground">
            The 7-State Extended Model: Memory Pressure & Swapping
          </h3>
        </div>
        <p className="text-xs text-muted leading-relaxed">
          In real operating systems, physical RAM is limited. When main memory becomes overcommitted, the kernel memory manager (swapper/pager) suspends processes by swapping their memory footprint onto disk storage (swap space). This adds two suspended states:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-lg bg-surface border border-border space-y-2">
            <span className="font-bold text-amber-400 block text-xs">
              Blocked-Suspended State
            </span>
            <p className="text-muted">
              The process is waiting for an I/O event AND has been swapped out to secondary disk storage. When its I/O event finishes, it transitions to <strong>Ready-Suspended</strong>.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-surface border border-border space-y-2">
            <span className="font-bold text-emerald-400 block text-xs">
              Ready-Suspended State
            </span>
            <p className="text-muted">
              The process is ready to run as soon as it is swapped back into main RAM. When memory space opens up, the medium-term scheduler activates it to the regular <strong>Ready</strong> queue.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <Link
          href="/learn/process-threads"
          className="text-xs text-muted hover:text-foreground transition-colors"
        >
          ← Previous: Processes & Threads
        </Link>
        <Link
          href="/learn/cpu-scheduling"
          className="inline-flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-xs font-semibold transition-colors"
        >
          <span>Next: CPU Scheduling Fundamentals</span>
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
