'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Cpu,
  Layers,
  BarChart3,
  Clock,
  Play,
  BookOpen,
  ChevronDown,
  Workflow,
  ListOrdered,
  Eye,
  GitCompare,
  Info,
} from 'lucide-react';

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

export default function HomePage() {
  return (
    <div className="overflow-x-hidden">
      {/* ==================== HERO ==================== */}
      <section className="relative py-16 md:py-24 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div {...fadeUp}>
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase text-accent mb-4 px-3 py-1 bg-accent/8 rounded-full">
              <Cpu size={14} />
              Operating Systems Laboratory
            </p>
          </motion.div>

          <motion.h1
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground leading-tight tracking-tight max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Understand how the CPU decides{' '}
            <span className="text-accent">what runs next.</span>
          </motion.h1>

          <motion.p
            className="mt-5 text-base md:text-lg text-muted max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Explore process states, scheduling algorithms, queues, and performance metrics through an interactive Operating Systems laboratory.
          </motion.p>

          <motion.div
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Link
              href="/simulator/new"
              className="flex items-center gap-2 px-5 py-2.5 bg-accent text-white font-semibold text-sm rounded-md hover:bg-accent-hover transition-colors"
            >
              <Play size={16} fill="currentColor" />
              Start Simulation
            </Link>
            <Link
              href="/learn"
              className="flex items-center gap-2 px-5 py-2.5 bg-surface text-foreground font-semibold text-sm rounded-md border border-border hover:bg-surface-alt transition-colors"
            >
              <BookOpen size={16} />
              Explore Concepts
            </Link>
          </motion.div>
        </div>

        {/* Flow Diagram */}
        <motion.div
          className="max-w-3xl mx-auto mt-14"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <FlowDiagram />
        </motion.div>
      </section>

      {/* ==================== WHAT YOU CAN EXPLORE ==================== */}
      <section className="py-16 px-4 bg-surface">
        <div className="max-w-5xl mx-auto">
          <SectionTitle>What You Can Explore</SectionTitle>
          <div className="grid md:grid-cols-3 gap-6 mt-8">
            <ExploreCard
              icon={<Layers size={22} />}
              title="Process & Threads"
              description="Learn how processes and threads work, their lifecycle, and how the OS manages them."
              href="/learn/process-threads"
            />
            <ExploreCard
              icon={<Cpu size={22} />}
              title="CPU Scheduling"
              description="Experiment with different scheduling algorithms and observe how the CPU allocates time."
              href="/simulator/new"
            />
            <ExploreCard
              icon={<BarChart3 size={22} />}
              title="Performance Analysis"
              description="Understand waiting, turnaround, response time, and CPU utilization through real simulations."
              href="/compare"
            />
          </div>
        </div>
      </section>

      {/* ==================== SUPPORTED ALGORITHMS ==================== */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <SectionTitle>Supported Algorithms</SectionTitle>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-8">
            {[
              { abbr: 'FCFS', name: 'First Come, First Served', preemptive: false },
              { abbr: 'SJF', name: 'Shortest Job First', preemptive: false },
              { abbr: 'SRTF', name: 'Shortest Remaining Time First', preemptive: true },
              { abbr: 'Priority', name: 'Priority Scheduling', preemptive: false },
              { abbr: 'RR', name: 'Round Robin', preemptive: true },
            ].map((algo) => (
              <div
                key={algo.abbr}
                className="p-4 bg-surface rounded-md border border-border"
              >
                <p className="font-mono font-semibold text-foreground text-sm">
                  {algo.abbr}
                </p>
                <p className="text-xs text-muted mt-1">{algo.name}</p>
                <span
                  className={`inline-block mt-2 text-[10px] font-medium px-1.5 py-0.5 rounded ${
                    algo.preemptive
                      ? 'bg-info-bg text-info'
                      : 'bg-surface-alt text-muted'
                  }`}
                >
                  {algo.preemptive ? 'Preemptive' : 'Non-preemptive'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== HOW IT WORKS ==================== */}
      <section className="py-16 px-4 bg-surface">
        <div className="max-w-5xl mx-auto">
          <SectionTitle>How It Works</SectionTitle>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
            {[
              { step: 1, icon: <ListOrdered size={20} />, title: 'Create Processes', desc: 'Define processes with arrival times, burst times, and priorities.' },
              { step: 2, icon: <Workflow size={20} />, title: 'Choose Algorithm', desc: 'Select from FCFS, SJF, SRTF, Priority, or Round Robin.' },
              { step: 3, icon: <Play size={20} />, title: 'Run Simulation', desc: 'Launch the step-by-step CPU scheduling simulation.' },
              { step: 4, icon: <Eye size={20} />, title: 'Observe CPU & Queue', desc: 'Watch processes move through states in real time.' },
              { step: 5, icon: <BarChart3 size={20} />, title: 'Analyze Results', desc: 'Review metrics, Gantt charts, and per-process statistics.' },
              { step: 6, icon: <GitCompare size={20} />, title: 'Compare Algorithms', desc: 'Run the same workload through all algorithms and compare.' },
            ].map((item) => (
              <div
                key={item.step}
                className="flex gap-3 p-4 rounded-md border border-border bg-background"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-md bg-accent/10 text-accent shrink-0">
                  {item.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    <span className="font-mono text-accent mr-1">{item.step}.</span>
                    {item.title}
                  </p>
                  <p className="text-xs text-muted mt-1 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== DISCLAIMER ==================== */}
      <section className="py-10 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-3 p-4 rounded-md border border-border bg-info-bg/30">
            <Info size={18} className="text-info shrink-0 mt-0.5" />
            <p className="text-xs text-muted leading-relaxed">
              <strong className="text-foreground">Educational Disclaimer:</strong>{' '}
              This simulator models operating system concepts for educational purposes. It does not control the real operating system scheduler.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted">
            <Cpu size={16} className="text-accent" />
            <span className="font-semibold text-foreground">SchedLab</span>
            <span>— Interactive CPU Scheduling Simulator</span>
          </div>
          <p className="text-xs text-muted">Built for Operating Systems education</p>
        </div>
      </footer>
    </div>
  );
}

// ==================== Sub Components ====================

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">
      {children}
    </h2>
  );
}

function ExploreCard({
  icon,
  title,
  description,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link href={href} className="group">
      <div className="p-5 rounded-md border border-border bg-background hover:border-accent/40 transition-colors h-full">
        <div className="w-9 h-9 rounded-md bg-accent/10 flex items-center justify-center text-accent mb-3">
          {icon}
        </div>
        <h3 className="font-semibold text-sm text-foreground group-hover:text-accent transition-colors">
          {title}
        </h3>
        <p className="text-xs text-muted mt-1.5 leading-relaxed">{description}</p>
      </div>
    </Link>
  );
}

function FlowDiagram() {
  const stages = [
    { label: 'Processes', sublabel: 'P01, P02, P03 …', color: 'bg-info text-white' },
    { label: 'Ready Queue', sublabel: 'FIFO / Sorted', color: 'bg-warning text-white' },
    { label: 'Scheduler', sublabel: 'Algorithm Decision', color: 'bg-accent text-white' },
    { label: 'CPU', sublabel: 'Execution', color: 'bg-success text-white' },
    { label: 'Completed', sublabel: 'Results', color: 'bg-muted text-white' },
  ];

  return (
    <div
      className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-0"
      role="img"
      aria-label="Process scheduling flow: Processes arrive, enter the ready queue, are selected by the scheduler, execute on the CPU, and complete."
    >
      {stages.map((stage, i) => (
        <div key={stage.label} className="flex items-center">
          <motion.div
            className={`flex flex-col items-center justify-center px-4 py-3 rounded-md ${stage.color} min-w-[120px]`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 + i * 0.1, duration: 0.3 }}
          >
            <span className="text-xs font-bold">{stage.label}</span>
            <span className="text-[10px] opacity-80 mt-0.5">{stage.sublabel}</span>
          </motion.div>
          {i < stages.length - 1 && (
            <motion.div
              className="text-muted mx-1 hidden sm:block"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 + i * 0.1 }}
            >
              <ArrowRight size={18} />
            </motion.div>
          )}
          {i < stages.length - 1 && (
            <motion.div
              className="text-muted my-0.5 sm:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 + i * 0.1 }}
            >
              <ChevronDown size={18} />
            </motion.div>
          )}
        </div>
      ))}
    </div>
  );
}
