'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Layers,
  Cpu,
  Database,
  ArrowRight,
  Shield,
  Zap,
  Split,
  FolderGit2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export default function ProcessThreadsPage() {
  const [architectureMode, setArchitectureMode] = useState<'process' | 'threads'>('threads');

  return (
    <div className="space-y-8">
      {/* Module Header */}
      <div className="border-b border-border pb-6">
        <div className="flex items-center gap-2 text-xs text-accent font-semibold uppercase tracking-wider mb-2">
          <span>Module 01</span>
          <span>•</span>
          <span>Foundation</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
          Processes & Threads
        </h1>
        <p className="text-sm text-muted mt-2 leading-relaxed max-w-3xl">
          An operating system creates the illusion of simultaneous execution. To manage CPU execution and memory safety, modern kernels distinguish between <strong>Processes</strong> (units of resource ownership and isolation) and <strong>Threads</strong> (units of CPU scheduling and execution).
        </p>
      </div>

      {/* Conceptual Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="p-5 rounded-xl bg-surface-alt border border-border space-y-3">
          <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm">
            <Shield size={18} />
            <h3>What is a Process?</h3>
          </div>
          <p className="text-xs text-muted leading-relaxed">
            A <strong>Process</strong> is an active program in execution. Unlike a passive program stored on disk (e.g. an executable file), a process includes program counter, registers, memory address space, and allocated resources.
          </p>
          <div className="p-3 rounded-lg bg-surface border border-border text-xs space-y-1">
            <span className="font-semibold text-foreground text-[11px] block">Key Characteristics:</span>
            <ul className="list-disc pl-4 space-y-0.5 text-muted text-[11px]">
              <li>Complete isolation via Virtual Memory management (MMU / page tables).</li>
              <li>Owns its own file descriptors, sockets, and security tokens.</li>
              <li>Crashing one process does not corrupt memory of other processes.</li>
              <li>Communication requires Inter-Process Communication (IPC: pipes, sockets, shared memory).</li>
            </ul>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-surface-alt border border-border space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
            <Zap size={18} />
            <h3>What is a Thread?</h3>
          </div>
          <p className="text-xs text-muted leading-relaxed">
            A <strong>Thread</strong> (often called a <em>Lightweight Process</em> or LWP) is the smallest sequence of programmed instructions that can be managed independently by the OS scheduler.
          </p>
          <div className="p-3 rounded-lg bg-surface border border-border text-xs space-y-1">
            <span className="font-semibold text-foreground text-[11px] block">Key Characteristics:</span>
            <ul className="list-disc pl-4 space-y-0.5 text-muted text-[11px]">
              <li>Lives inside a parent process and shares its address space.</li>
              <li>Shares Text (Code), Data (Globals), Heap, and Open Files.</li>
              <li>Maintains its own private Stack and CPU Register state (Program Counter).</li>
              <li>Extremely low context switch overhead compared to processes.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Interactive Visualizer: Address Space & Memory Model */}
      <div className="p-6 rounded-xl bg-surface-alt border border-border space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Split size={18} className="text-accent" />
              Interactive Memory & Concurrency Architecture
            </h3>
            <p className="text-xs text-muted mt-0.5">
              Toggle between isolated processes and multi-threaded shared address space.
            </p>
          </div>

          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-surface border border-border text-xs">
            <button
              onClick={() => setArchitectureMode('process')}
              className={`px-3 py-1 rounded-md transition-colors ${
                architectureMode === 'process'
                  ? 'bg-accent text-white font-medium'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              2 Separate Processes
            </button>
            <button
              onClick={() => setArchitectureMode('threads')}
              className={`px-3 py-1 rounded-md transition-colors ${
                architectureMode === 'threads'
                  ? 'bg-accent text-white font-medium'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              1 Process with 3 Threads
            </button>
          </div>
        </div>

        {/* Diagram Area */}
        {architectureMode === 'threads' ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-5 rounded-lg bg-surface border border-border space-y-4"
          >
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="text-xs font-mono font-bold text-accent">
                Parent Process: PID 1042 (Shared Virtual Address Space)
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-accent/15 text-accent font-semibold">
                Shared Memory Model
              </span>
            </div>

            {/* Shared sections */}
            <div className="grid grid-cols-3 gap-3 text-center text-xs font-mono">
              <div className="p-3 rounded bg-blue-500/10 border border-blue-500/30">
                <span className="font-bold text-blue-400 block text-xs">Text (Code)</span>
                <span className="text-[10px] text-muted">Shared binary instructions</span>
              </div>
              <div className="p-3 rounded bg-purple-500/10 border border-purple-500/30">
                <span className="font-bold text-purple-400 block text-xs">Data & BSS</span>
                <span className="text-[10px] text-muted">Shared global variables</span>
              </div>
              <div className="p-3 rounded bg-amber-500/10 border border-amber-500/30">
                <span className="font-bold text-amber-400 block text-xs">Heap</span>
                <span className="text-[10px] text-muted">Shared dynamic memory (malloc)</span>
              </div>
            </div>

            {/* Private Thread Stacks */}
            <div className="mt-4 pt-4 border-t border-border">
              <span className="text-xs font-semibold text-foreground block mb-2">
                Thread-Specific Execution Contexts (Individual Scheduler Entities):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { tid: 'TID 1 (Main)', role: 'UI Event Loop', pc: '0x004012A0' },
                  { tid: 'TID 2 (Worker)', role: 'Background Computation', pc: '0x004058F4' },
                  { tid: 'TID 3 (I/O)', role: 'Network Socket Listener', pc: '0x0040810C' },
                ].map((t) => (
                  <div
                    key={t.tid}
                    className="p-3 rounded-lg bg-surface-alt border border-emerald-500/30 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-emerald-400">{t.tid}</span>
                      <span className="text-[10px] text-emerald-400/80">Active</span>
                    </div>
                    <p className="text-[11px] text-muted">{t.role}</p>
                    <div className="text-[10px] font-mono text-muted bg-surface px-1.5 py-0.5 rounded border border-border">
                      PC: {t.pc}
                    </div>
                    <div className="text-[10px] text-emerald-300 font-mono">
                      Private Stack & Registers
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            {[
              { pid: 'PID 1042 (Process A)', color: 'border-blue-500/40', badge: 'text-blue-400' },
              { pid: 'PID 1043 (Process B)', color: 'border-purple-500/40', badge: 'text-purple-400' },
            ].map((p) => (
              <div
                key={p.pid}
                className={`p-4 rounded-lg bg-surface border ${p.color} space-y-3`}
              >
                <div className="flex items-center justify-between border-b border-border pb-1.5">
                  <span className={`text-xs font-mono font-bold ${p.badge}`}>{p.pid}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-alt text-muted font-mono">
                    MMU Isolated
                  </span>
                </div>
                <div className="space-y-1 text-xs font-mono">
                  <div className="p-2 rounded bg-surface-alt border border-border text-center text-muted">
                    Private Stack (0x7FFF... down)
                  </div>
                  <div className="p-1 text-center text-[10px] text-muted italic">
                    ↕ Free Address Gap ↕
                  </div>
                  <div className="p-2 rounded bg-surface-alt border border-border text-center text-muted">
                    Private Heap (malloc)
                  </div>
                  <div className="p-2 rounded bg-surface-alt border border-border text-center text-muted">
                    Private Data / Text Segment
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Process Control Block (PCB) Breakdown */}
      <div className="p-5 rounded-xl bg-surface-alt border border-border space-y-4">
        <div className="flex items-center gap-2">
          <Database size={18} className="text-accent" />
          <h3 className="text-sm font-bold text-foreground">
            The Process Control Block (PCB) in Operating Systems
          </h3>
        </div>
        <p className="text-xs text-muted leading-relaxed">
          The kernel represents each process in memory using a C structure called the <strong>Process Control Block (PCB)</strong> (or <code className="text-accent">struct task_struct</code> in the Linux kernel). When the CPU scheduler context-switches between processes, it saves the current hardware registers into the outgoing process&apos;s PCB and loads the incoming process&apos;s PCB registers into the CPU cores.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-surface border border-border space-y-1">
            <span className="font-mono font-semibold text-accent text-xs">Identifier (PID)</span>
            <p className="text-[11px] text-muted">Unique integer identifying the process in the system table.</p>
          </div>
          <div className="p-3 rounded-lg bg-surface border border-border space-y-1">
            <span className="font-mono font-semibold text-accent text-xs">Process State</span>
            <p className="text-[11px] text-muted">Current status: New, Ready, Running, Waiting, or Terminated.</p>
          </div>
          <div className="p-3 rounded-lg bg-surface border border-border space-y-1">
            <span className="font-mono font-semibold text-accent text-xs">Program Counter</span>
            <p className="text-[11px] text-muted">Address of the next machine code instruction to execute.</p>
          </div>
          <div className="p-3 rounded-lg bg-surface border border-border space-y-1">
            <span className="font-mono font-semibold text-accent text-xs">CPU Registers</span>
            <p className="text-[11px] text-muted">Accumulators, stack pointer (SP), index registers, and flags.</p>
          </div>
          <div className="p-3 rounded-lg bg-surface border border-border space-y-1">
            <span className="font-mono font-semibold text-accent text-xs">CPU Scheduling</span>
            <p className="text-[11px] text-muted">Priority, queue pointers, burst time, and time quantum counter.</p>
          </div>
          <div className="p-3 rounded-lg bg-surface border border-border space-y-1">
            <span className="font-mono font-semibold text-accent text-xs">Memory Limits</span>
            <p className="text-[11px] text-muted">Page tables, segment tables, base and limit registers.</p>
          </div>
          <div className="p-3 rounded-lg bg-surface border border-border space-y-1">
            <span className="font-mono font-semibold text-accent text-xs">Accounting Info</span>
            <p className="text-[11px] text-muted">CPU time consumed, real time elapsed, clock ticks recorded.</p>
          </div>
          <div className="p-3 rounded-lg bg-surface border border-border space-y-1">
            <span className="font-mono font-semibold text-accent text-xs">I/O Status</span>
            <p className="text-[11px] text-muted">List of open file descriptors, allocated network sockets.</p>
          </div>
        </div>
      </div>

      {/* Architectural Trade-offs Table */}
      <div className="p-5 rounded-xl bg-surface-alt border border-border space-y-3">
        <h3 className="text-sm font-bold text-foreground">Summary Comparison: Process vs Thread</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface text-muted">
                <th className="py-2.5 px-3 font-semibold">Dimension</th>
                <th className="py-2.5 px-3 font-semibold text-blue-400">Process</th>
                <th className="py-2.5 px-3 font-semibold text-emerald-400">Thread</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-muted">
              <tr>
                <td className="py-2 px-3 font-medium text-foreground">Memory Space</td>
                <td className="py-2 px-3">Separate virtual address space per process</td>
                <td className="py-2 px-3">Shares address space with threads in same process</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-medium text-foreground">Context Switch Cost</td>
                <td className="py-2 px-3">High (flushes TLB, swaps page directory base)</td>
                <td className="py-2 px-3">Low (preserves TLB cache, changes SP/PC registers)</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-medium text-foreground">Creation & Teardown</td>
                <td className="py-2 px-3">Heavyweight (allocates PCB, page tables, memory)</td>
                <td className="py-2 px-3">Lightweight (allocates stack and TCB entry)</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-medium text-foreground">Communication</td>
                <td className="py-2 px-3">IPC required (pipes, message queues, sockets)</td>
                <td className="py-2 px-3">Direct via shared memory (requires mutexes/locks)</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-medium text-foreground">Fault Tolerance</td>
                <td className="py-2 px-3">Fault-isolated (crash does not kill other processes)</td>
                <td className="py-2 px-3">Shared fate (segfault in one thread kills entire process)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Next Navigation */}
      <div className="flex justify-end pt-4 border-t border-border">
        <Link
          href="/learn/process-states"
          className="inline-flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-xs font-semibold transition-colors"
        >
          <span>Next: Process States & Lifecycle</span>
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
