'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Cpu,
  Layers,
  BarChart3,
  Play,
  BookOpen,
  ChevronDown,
  Workflow,
  ListOrdered,
  Eye,
  GitCompare,
  Info,
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

export default function HomePage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="overflow-x-hidden">
      {/* ==================== HERO ==================== */}
      <section
        className={`relative min-h-[600px] md:min-h-[650px] overflow-hidden ${isDark ? 'bg-[#020617]' : 'bg-[#F7F9FC]'
          }`}
      >
        {/* CPU Background */}
        <div
          className="absolute inset-y-0 right-0 w-full md:w-[62%] bg-cover bg-[position:35%_center]"
          style={{
            backgroundImage: "url('/images/cpu.jpg')",
          }}
        />

        <div className="absolute inset-y-0 right-0 w-full md:w-[62%] bg-cover bg-[position:10%_center]" style={{
          backgroundImage: `linear-gradient(
  91deg,
  ${isDark ? '#020617' : '#F7F9FC'} 0%,
  ${isDark ? '#020617' : 'rgba(247, 249, 252, 0.9)'} 12%,
  ${isDark ? 'rgba(2, 6, 23, 0.9)' : 'rgba(247, 249, 252, 0.9)'} 25%,
        ${isDark ? 'rgba(2, 6, 23, 0.45)' : 'rgba(247, 249, 252, 0.45)'} 38%,
        transparent 50%,
        transparent 100%
        )`,
          borderLeft: `100px ${isDark ? '#020617' : '#F7F9FC'}`,
        }}></div>

        {/* Main Gradient Overlay */}
        <div
          className={`absolute inset-0 ${isDark
            ? 'bg-gradient-to-r from-[#020617] via-[#020617]/80 to-transparent'
            : 'bg-gradient-to-r from-[#F7F9FC] via-[#F7F9FC]/55 to-transparent'
            }`}
        />

        {/* Additional Soft Overlay */}
        <div
          className={`absolute inset-0 ${isDark
            ? 'bg-gradient-to-b from-[#020617]/10 via-transparent to-[#020617]/20'
            : 'bg-gradient-to-b from-white/10 via-transparent to-[#F7F9FC]/25'
            }`}
        />

        {/* Bottom Fade */}
        <div
          className={`absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t ${isDark
            ? 'from-[#020617]/75 to-transparent'
            : 'from-[#F7F9FC]/45 to-transparent'
            }`}
        />

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[600px] md:min-h-[650px] flex items-center">
          <div className="max-w-2xl text-left">
            {/* Badge */}
            <motion.div {...fadeUp}>
              <p
                className={`inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase mb-5 px-3 py-1.5 rounded-full ${isDark
                  ? 'text-blue-300 bg-blue-500/15 border border-blue-400/20'
                  : 'text-blue-700 bg-blue-500/10 border border-blue-500/20'
                  }`}
              >
                <Cpu size={14} />
                Operating Systems Laboratory
              </p>
            </motion.div>

            {/* Heading */}
            <motion.h1
              className={`text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.08] tracking-tight ${isDark ? 'text-white' : 'text-slate-900'
                }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Understand how the CPU
              <br />
              <span className="text-blue-500">
                decides what runs next.
              </span>
            </motion.h1>

            {/* Description */}
            <motion.p
              className={`mt-6 text-base md:text-lg max-w-xl leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'
                }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Explore process states, scheduling algorithms, queues, and
              performance metrics through an interactive Operating Systems
              laboratory.
            </motion.p>

            {/* Buttons */}
            <motion.div
              className="mt-8 flex flex-col sm:flex-row items-start gap-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Link
                href="/simulator/new"
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-semibold text-sm rounded-md hover:bg-blue-500 transition-colors"
              >
                <Play size={16} fill="currentColor" />
                Start Simulation
              </Link>

              <Link
                href="/learn"
                className={`flex items-center gap-2 px-5 py-2.5 font-semibold text-sm rounded-md border transition-colors ${isDark
                  ? 'bg-white/5 text-white border-white/15 hover:bg-white/10'
                  : 'bg-white/70 text-slate-800 border-slate-300 hover:bg-white'
                  }`}
              >
                <BookOpen size={16} />
                Explore Concepts
              </Link>
            </motion.div>

            {/* Technical Indicators */}
            <motion.div
              className={`mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                Process Management
              </span>

              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                CPU Scheduling
              </span>

              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                Performance Analysis
              </span>
            </motion.div>
          </div>
        </div>
      </section >

      {/* ==================== FLOW DIAGRAM ==================== */}
      < section className="py-14 px-4 bg-surface border-b border-border" >
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-accent text-center mb-6">
              Scheduling Flow
            </p>

            <FlowDiagram />
          </motion.div>
        </div>
      </section >

      {/* ==================== WHAT YOU CAN EXPLORE ==================== */}
      < section className="py-16 px-4 bg-surface" >
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
      </section >

      {/* ==================== SUPPORTED ALGORITHMS ==================== */}
      < section className="py-16 px-4" >
        <div className="max-w-5xl mx-auto">
          <SectionTitle>Supported Algorithms</SectionTitle>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-8">
            {[
              {
                abbr: 'FCFS',
                name: 'First Come, First Served',
                preemptive: false,
              },
              {
                abbr: 'SJF',
                name: 'Shortest Job First',
                preemptive: false,
              },
              {
                abbr: 'SRTF',
                name: 'Shortest Remaining Time First',
                preemptive: true,
              },
              {
                abbr: 'Priority',
                name: 'Priority Scheduling',
                preemptive: false,
              },
              {
                abbr: 'RR',
                name: 'Round Robin',
                preemptive: true,
              },
            ].map((algo) => (
              <div
                key={algo.abbr}
                className="p-4 bg-surface rounded-md border border-border"
              >
                <p className="font-mono font-semibold text-foreground text-sm">
                  {algo.abbr}
                </p>

                <p className="text-xs text-muted mt-1">
                  {algo.name}
                </p>

                <span
                  className={`inline-block mt-2 text-[10px] font-medium px-1.5 py-0.5 rounded ${algo.preemptive
                    ? 'bg-info-bg text-info'
                    : 'bg-surface-alt text-muted'
                    }`}
                >
                  {algo.preemptive
                    ? 'Preemptive'
                    : 'Non-preemptive'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section >

      {/* ==================== HOW IT WORKS ==================== */}
      < section className="py-16 px-4 bg-surface" >
        <div className="max-w-5xl mx-auto">
          <SectionTitle>How It Works</SectionTitle>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
            {[
              {
                step: 1,
                icon: <ListOrdered size={20} />,
                title: 'Create Processes',
                desc: 'Define processes with arrival times, burst times, and priorities.',
              },
              {
                step: 2,
                icon: <Workflow size={20} />,
                title: 'Choose Algorithm',
                desc: 'Select from FCFS, SJF, SRTF, Priority, or Round Robin.',
              },
              {
                step: 3,
                icon: <Play size={20} />,
                title: 'Run Simulation',
                desc: 'Launch the step-by-step CPU scheduling simulation.',
              },
              {
                step: 4,
                icon: <Eye size={20} />,
                title: 'Observe CPU & Queue',
                desc: 'Watch processes move through states in real time.',
              },
              {
                step: 5,
                icon: <BarChart3 size={20} />,
                title: 'Analyze Results',
                desc: 'Review metrics, Gantt charts, and per-process statistics.',
              },
              {
                step: 6,
                icon: <GitCompare size={20} />,
                title: 'Compare Algorithms',
                desc: 'Run the same workload through all algorithms and compare.',
              },
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
                    <span className="font-mono text-accent mr-1">
                      {item.step}.
                    </span>
                    {item.title}
                  </p>

                  <p className="text-xs text-muted mt-1 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section >

      {/* ==================== DISCLAIMER ==================== */}
      < section className="py-10 px-4" >
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-3 p-4 rounded-md border border-border bg-info-bg/30">
            <Info
              size={18}
              className="text-info shrink-0 mt-0.5"
            />

            <p className="text-xs text-muted leading-relaxed">
              <strong className="text-foreground">
                Educational Disclaimer:
              </strong>{' '}
              This simulator models operating system concepts for
              educational purposes. It does not control the real
              operating system scheduler.
            </p>
          </div>
        </div>
      </section >

      {/* ==================== FOOTER ==================== */}
      < footer className="py-8 px-4 border-t border-border" >
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted">
            <Cpu size={16} className="text-accent" />

            <span className="font-semibold text-foreground">
              SchedLab
            </span>

            <span>— Interactive CPU Scheduling Simulator</span>
          </div>

          <p className="text-xs text-muted">
            Built for Operating Systems education
          </p>
        </div>
      </footer >
    </div >
  );
}

// ==================== Sub Components ====================

function SectionTitle({
  children,
}: {
  children: React.ReactNode;
}) {
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

        <p className="text-xs text-muted mt-1.5 leading-relaxed">
          {description}
        </p>
      </div>
    </Link>
  );
}

function FlowDiagram() {
  const stages = [
    {
      label: 'Processes',
      sublabel: 'P01, P02, P03 …',
    },
    {
      label: 'Ready Queue',
      sublabel: 'FIFO / Sorted',
    },
    {
      label: 'Scheduler',
      sublabel: 'Algorithm Decision',
    },
    {
      label: 'CPU',
      sublabel: 'Execution',
    },
    {
      label: 'Completed',
      sublabel: 'Results',
    },
  ];

  return (
    <div
      className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-0"
      role="img"
      aria-label="Process scheduling flow: Processes arrive, enter the ready queue, are selected by the scheduler, execute on the CPU, and complete."
    >
      {stages.map((stage, i) => (
        <div
          key={stage.label}
          className="flex items-center"
        >
          <motion.div
            className={`flex flex-col items-center justify-center px-4 py-3 rounded-md min-w-[120px] border ${i === 3
              ? 'bg-blue-600 border-blue-500 text-white'
              : 'bg-surface-alt border-border text-foreground'
              }`}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{
              delay: 0.1 + i * 0.08,
              duration: 0.3,
            }}
          >
            <span className="text-xs font-bold">
              {stage.label}
            </span>

            <span
              className={`text-[10px] mt-0.5 ${i === 3
                ? 'text-blue-100'
                : 'text-muted'
                }`}
            >
              {stage.sublabel}
            </span>
          </motion.div>

          {i < stages.length - 1 && (
            <motion.div
              className="text-accent mx-1 hidden sm:block"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{
                delay: 0.2 + i * 0.08,
              }}
            >
              <ArrowRight size={18} />
            </motion.div>
          )}

          {i < stages.length - 1 && (
            <motion.div
              className="text-accent my-0.5 sm:hidden"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{
                delay: 0.2 + i * 0.08,
              }}
            >
              <ChevronDown size={18} />
            </motion.div>
          )}
        </div>
      ))}
    </div>
  );
}