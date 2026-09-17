'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Layers,
  Activity,
  Cpu,
  GitBranch,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Terminal,
} from 'lucide-react';

const MODULES = [
  {
    slug: 'process-threads',
    title: '1. Processes & Threads',
    badge: 'Foundation',
    description:
      'Explore how operating systems abstract running programs. Learn the anatomy of a Process Control Block (PCB), virtual memory address space layout, and how multi-threading enables parallel execution inside shared memory.',
    features: [
      'Process Control Block (PCB)',
      'Address Space (Stack, Heap, Data, Text)',
      'User vs Kernel Threads',
      'Context Switching Overhead',
    ],
    icon: Layers,
    color: 'text-accent',
    borderColor: 'hover:border-accent/50',
  },
  {
    slug: 'process-states',
    title: '2. Process States & Lifecycle',
    badge: 'Interactive Model',
    description:
      'Master the classical 5-state process lifecycle (New, Ready, Running, Waiting, Terminated) and the extended 7-state model with swapping. Features a live interactive state machine simulator.',
    features: [
      '5-State Process Model',
      '7-State Swapping & Suspension',
      'Interactive State Machine Controller',
      'Preemption & I/O Events',
    ],
    icon: Activity,
    color: 'text-amber-400',
    borderColor: 'hover:border-amber-500/50',
  },
  {
    slug: 'cpu-scheduling',
    title: '3. CPU Scheduling Fundamentals',
    badge: 'Core Engine',
    description:
      'Understand why the kernel schedules processes. Dissect CPU burst cycles, the role of the OS dispatcher, preemptive vs non-preemptive design, and the mathematical formulas behind key performance metrics.',
    features: [
      'CPU-I/O Burst Cycles',
      'Preemptive vs Non-Preemptive',
      'Turnaround, Waiting, and Response Times',
      'Throughput & CPU Utilization',
    ],
    icon: Cpu,
    color: 'text-emerald-400',
    borderColor: 'hover:border-emerald-500/50',
  },
  {
    slug: 'algorithms',
    title: '4. Scheduling Algorithms Deep Dive',
    badge: 'Algorithmic Analysis',
    description:
      'Comprehensive study of First-Come First-Served (FCFS), Shortest Job First (SJF), Shortest Remaining Time First (SRTF), Priority Scheduling, and Round Robin (RR). Includes starvation analysis and time quantum selection.',
    features: [
      'FCFS & Convoy Effect',
      'SJF & SRTF Optimality Proofs',
      'Priority Inversion & Aging',
      'Round Robin Quantum Tuning',
    ],
    icon: GitBranch,
    color: 'text-purple-400',
    borderColor: 'hover:border-purple-500/50',
  },
];

export default function LearnIndexPage() {
  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="p-6 rounded-2xl bg-surface-alt border border-border space-y-3">
        <div className="flex items-center gap-2">
          <BookOpen size={20} className="text-accent" />

          <span className="text-xs font-bold uppercase tracking-wider text-accent">
            Curriculum Overview
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
          Operating Systems Scheduling Lab
        </h1>

        <p className="text-sm text-muted leading-relaxed max-w-2xl">
          Welcome to the SchedLab learning suite. Operating systems
          allocate scarce hardware resources (CPU cores, memory, I/O
          bandwidth) across competing processes. Follow the modular
          curriculum below to build deep mental models of concurrency,
          process lifecycles, and scheduling mechanics.
        </p>
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {MODULES.map((module, index) => {
          const Icon = module.icon;

          return (
            <motion.div
              key={module.slug}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className={`group p-5 rounded-xl bg-surface-alt border border-border flex flex-col justify-between transition-all ${module.borderColor}`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div
                    className={`p-2 rounded-lg bg-surface border border-border ${module.color}`}
                  >
                    <Icon size={20} />
                  </div>

                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface border border-border text-muted">
                    {module.badge}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-foreground group-hover:text-accent transition-colors">
                    {module.title}
                  </h3>

                  <p className="text-xs text-muted mt-1 leading-relaxed">
                    {module.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-border/60">
                  <span className="text-[11px] font-semibold text-foreground/80 block mb-1.5">
                    Key Topics Covered:
                  </span>

                  <ul className="space-y-1">
                    {module.features.map((feature, featureIndex) => (
                      <li
                        key={featureIndex}
                        className="flex items-center gap-1.5 text-[11px] text-muted"
                      >
                        <CheckCircle2
                          size={12}
                          className="text-accent shrink-0"
                        />

                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-border">
                <Link
                  href={`/learn/${module.slug}`}
                  className="flex items-center justify-between text-xs font-semibold text-accent hover:text-accent-hover transition-colors"
                >
                  <span>Start Module</span>

                  <ArrowRight
                    size={14}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </Link>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Interactive Terminal / Quick Concept Callout */}
      <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-mono text-xs space-y-3">
        <div className="flex items-center gap-2 text-slate-400 border-b border-slate-800 pb-2">
          <Terminal size={14} />

          <span>schedlab-kernel-shell — concepts-at-a-glance</span>
        </div>

        <div className="space-y-1.5 text-[11px]">
          <p className="text-emerald-400">
            $ schedlab --explain-goal
          </p>

          <p className="text-slate-400">
            &quot;The core goal of CPU scheduling is to maximize CPU
            utilization and throughput while minimizing turnaround
            time, waiting time, and response time.&quot;
          </p>s

          <p className="text-emerald-400 mt-2">
            $ schedlab --next-step
          </p>

          <p className="text-slate-400">
            Ready to explore? Select{' '}
            <strong>Processes &amp; Threads</strong> from the menu or
            launch the simulator directly.
          </p>
        </div>
      </div>
    </div>
  );
}