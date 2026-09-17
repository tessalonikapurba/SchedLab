'use client';

import Link from 'next/link';
import {
  Cpu,
  BookOpen,
  Code2,
  Sparkles,
  Play,
  CheckCircle2,
} from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-surface text-foreground py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/15 text-accent border border-accent/30 text-xs font-semibold">
            <Cpu size={14} />
            <span>About SchedLab</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Interactive Operating Systems Laboratory
          </h1>

          <p className="text-sm text-muted max-w-2xl mx-auto leading-relaxed">
            SchedLab is an educational platform designed to turn abstract
            operating systems theory into tangible, visual, and measurable
            intuition.
          </p>
        </div>

        {/* Educational Philosophy */}
        <div className="p-6 rounded-2xl bg-surface-alt border border-border space-y-4">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Sparkles size={18} className="text-accent" />
            The Educational Philosophy
          </h2>

          <p className="text-xs text-muted leading-relaxed">
            Operating systems courses traditionally teach CPU scheduling using
            static text and paper Gantt chart exercises. While students learn
            the formulas, they often miss the dynamic, non-linear realities of
            operating system design:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-surface border border-border space-y-1">
              <span className="font-semibold text-xs text-accent block">
                1. Observe Real Dynamics
              </span>

              <p className="text-[11px] text-muted">
                Watch processes enter ready queues, experience preemption, and
                track clock ticks in real time.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-surface border border-border space-y-1">
              <span className="font-semibold text-xs text-accent block">
                2. Understand Trade-offs
              </span>

              <p className="text-[11px] text-muted">
                There is no &quot;perfect&quot; scheduler. SJF optimizes
                turnaround at the expense of fairness; Round Robin ensures
                response at the cost of context switching.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-surface border border-border space-y-1">
              <span className="font-semibold text-xs text-accent block">
                3. Experiment Fearlessly
              </span>

              <p className="text-[11px] text-muted">
                Construct custom workloads, test extreme edge cases, and run
                multi-algorithm benchmarks instantly.
              </p>
            </div>
          </div>
        </div>

        {/* Technical Architecture */}
        <div className="p-6 rounded-2xl bg-surface-alt border border-border space-y-4">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Code2 size={18} className="text-accent" />
            Architecture &amp; Rigor
          </h2>

          <p className="text-xs text-muted leading-relaxed">
            SchedLab is engineered with a strict separation of concerns to
            guarantee mathematical precision and algorithmic correctness:
          </p>

          <div className="space-y-2.5 text-xs text-muted">
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-surface border border-border">
              <CheckCircle2
                size={16}
                className="text-emerald-400 shrink-0 mt-0.5"
              />

              <div>
                <strong className="text-foreground">
                  Deterministic Pure Scheduling Engine:
                </strong>{' '}
                All 5 algorithms (FCFS, SJF, SRTF, Priority, Round Robin) are
                implemented as pure mathematical functions with zero framework
                dependencies.
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-surface border border-border">
              <CheckCircle2
                size={16}
                className="text-emerald-400 shrink-0 mt-0.5"
              />

              <div>
                <strong className="text-foreground">
                  Discrete-Event Simulation Loop:
                </strong>{' '}
                The simulation engine advances discrete clock time step-by-step,
                capturing real arrivals, preemption interrupts, and queue
                reordering.
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-surface border border-border">
              <CheckCircle2
                size={16}
                className="text-emerald-400 shrink-0 mt-0.5"
              />

              <div>
                <strong className="text-foreground">
                  Modern Frontend Stack:
                </strong>{' '}
                Built with Next.js 15 App Router, TypeScript, Tailwind CSS,
                Zustand for reactive state management, and Framer Motion for
                hardware-accelerated animations.
              </div>
            </div>
          </div>
        </div>

        {/* Academic References */}
        <div className="p-6 rounded-2xl bg-surface-alt border border-border space-y-4">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <BookOpen size={18} className="text-accent" />
            Academic Foundations &amp; References
          </h2>

          <p className="text-xs text-muted leading-relaxed">
            SchedLab&apos;s models, terminology, and metrics strictly adhere
            to the authoritative curriculum standards in computer science:
          </p>

          <ul className="space-y-3 text-xs">
            <li className="p-3 rounded-lg bg-surface border border-border">
              <strong className="text-foreground block">
                Operating System Concepts (10th Edition)
              </strong>

              <span className="text-muted text-[11px]">
                Abraham Silberschatz, Peter B. Galvin, Greg Gagne — John Wiley
                &amp; Sons.
              </span>
            </li>

            <li className="p-3 rounded-lg bg-surface border border-border">
              <strong className="text-foreground block">
                Operating Systems: Three Easy Pieces (OSTEP)
              </strong>

              <span className="text-muted text-[11px]">
                Remzi H. Arpaci-Dusseau and Andrea C. Arpaci-Dusseau —
                University of Wisconsin-Madison.
              </span>
            </li>

            <li className="p-3 rounded-lg bg-surface border border-border">
              <strong className="text-foreground block">
                Modern Operating Systems (4th Edition)
              </strong>

              <span className="text-muted text-[11px]">
                Andrew S. Tanenbaum, Herbert Bos — Pearson Education.
              </span>
            </li>
          </ul>
        </div>

        {/* Launch CTA */}
        <div className="text-center p-8 rounded-2xl bg-surface-alt border border-border space-y-4">
          <h3 className="text-xl font-bold text-foreground">
            Ready to explore CPU scheduling?
          </h3>

          <p className="text-xs text-muted max-w-md mx-auto">
            Design a custom workload or load one of our educational presets to
            start your simulation.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/simulator/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-semibold transition-colors shadow-sm"
            >
              <Play size={14} fill="currentColor" />
              Configure Simulation
            </Link>

            <Link
              href="/learn"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface-alt hover:bg-surface border border-border text-xs font-semibold text-foreground transition-colors"
            >
              <BookOpen size={14} />
              Browse Curriculum
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}