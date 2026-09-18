'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Cpu,
  Clock,
  Timer,
  ChevronRight,
  X,
  Activity,
  Info,
  Sparkles,
  Zap,
} from 'lucide-react';

import { useSimulationStore } from '@/store/simulation';
import {
  ALGORITHM_DISPLAY_NAMES,
  getProcessColor,
  STATUS_COLORS,
} from '@/lib/constants';
import type { SimulationSpeed } from '@/lib/types';

export default function LiveSimulationPage() {
  const router = useRouter();
  const store = useSimulationStore();
  const [explainMode, setExplainMode] = useState(true);

  useEffect(() => {
    if (!store.engine && store.simulationStatus === 'IDLE') {
      router.replace('/simulator/new');
    }
  }, [store.engine, store.simulationStatus, router]);

  if (!store.engine) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted text-sm">
          Initializing simulation…
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-12 transition-colors">
      {/* Header */}
      <div className="border-b border-border px-4 py-3 bg-surface">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-foreground">
                {store.simulationName}
              </h1>

              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-accent/15 text-accent font-semibold">
                {ALGORITHM_DISPLAY_NAMES[store.selectedAlgorithm]}
              </span>
            </div>

            <p className="text-xs text-muted font-mono mt-0.5">
              {store.selectedAlgorithm === 'RR' &&
                `Time Quantum: Q=${store.timeQuantum}`}

              {store.selectedAlgorithm === 'MLFQ' &&
                `MLFQ: Q0=${store.timeQuantum}, Q1=${store.timeQuantum * 2
                }, Q2=FCFS (Boost every 20u)`}

              {store.selectedAlgorithm === 'PRIORITY_AGING' &&
                `Priority with Aging: Interval=${store.agingInterval}u (${store.priorityDirection})`}

              {store.selectedAlgorithm === 'PRIORITY' &&
                `Priority Direction: ${store.priorityDirection}`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-muted">
            <button
              onClick={() => setExplainMode(!explainMode)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${explainMode
                ? 'bg-accent/15 text-accent border border-accent/30'
                : 'bg-surface-alt text-muted border border-border hover:text-foreground'
                }`}
            >
              <Sparkles
                size={13}
                className={explainMode ? 'text-accent' : 'text-muted'}
              />

              Explain as You Simulate:{' '}
              {explainMode ? 'ON' : 'OFF'}
            </button>

            <span className="flex items-center gap-1">
              <Clock size={13} />

              T={' '}
              <span className="text-foreground font-bold text-sm">
                {store.currentTime}
              </span>
            </span>

            {store.simulationStatus === 'COMPLETED' && (
              <button
                onClick={() => router.push('/results')}
                className="flex items-center gap-1 px-3 py-1 bg-accent text-white rounded text-xs font-semibold hover:bg-accent-hover transition-colors"
              >
                View Results
                <ChevronRight size={13} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <SimulationControls />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
        {explainMode && <ExplainAsYouSimulatePanel />}

        <div className="grid lg:grid-cols-3 gap-4">
          {/* Left Column */}
          <div className="space-y-4">
            <CpuPanel />
            <ReadyQueuePanel />
            <SchedulerDecisionPanel />
          </div>

          {/* Center Column */}
          <div>
            <ProcessStatesPanel />
          </div>

          {/* Right Column */}
          <div>
            <ProcessInspector />
          </div>
        </div>

        {/* Bottom */}
        <div className="grid lg:grid-cols-2 gap-4">
          <GanttChart />
          <EventLog />
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Simulation Controls
   ============================================================ */

function SimulationControls() {
  const {
    simulationStatus,
    simulationSpeed,
    play,
    pause,
    step,
    reset,
    setSpeed,
  } = useSimulationStore();

  const router = useRouter();

  const speeds: SimulationSpeed[] = [0.5, 1, 2, 4];

  const handleReset = () => {
    reset();
    router.push('/simulator/new');
  };

  return (
    <div className="border-b border-border bg-surface px-4 py-2.5 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Playback */}
        <div className="flex items-center gap-1.5">
          {simulationStatus === 'RUNNING' ? (
            <button
              onClick={pause}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/40 rounded text-xs font-semibold hover:bg-amber-500/25 transition-colors"
            >
              <Pause size={14} />
              Pause
            </button>
          ) : (
            <button
              onClick={play}
              disabled={simulationStatus === 'COMPLETED'}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-accent text-white rounded text-xs font-semibold hover:bg-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Play size={14} fill="currentColor" />

              {simulationStatus === 'PAUSED'
                ? 'Resume'
                : 'Play'}
            </button>
          )}

          <button
            onClick={step}
            disabled={
              simulationStatus === 'COMPLETED' ||
              simulationStatus === 'RUNNING'
            }
            className="flex items-center gap-1 px-3 py-1.5 bg-surface-alt border border-border text-foreground rounded text-xs font-medium hover:bg-surface transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="Step 1 time unit forward"
          >
            <SkipForward size={14} />
            Step
          </button>

          <button
            onClick={handleReset}
            className="flex items-center gap-1 px-2.5 py-1.5 text-muted hover:text-foreground rounded text-xs font-medium hover:bg-surface-alt transition-colors"
            title="Reset Simulation"
          >
            <RotateCcw size={14} />
            Reset
          </button>
        </div>

        {/* Speed */}
        <div className="flex items-center gap-1 text-xs">
          <span className="text-muted mr-1">
            Speed:
          </span>

          {speeds.map((speed) => (
            <button
              key={speed}
              onClick={() => setSpeed(speed)}
              className={`px-2 py-1 rounded font-mono font-bold transition-colors ${simulationSpeed === speed
                ? 'bg-accent text-white'
                : 'text-muted hover:text-foreground hover:bg-surface-alt'
                }`}
            >
              {speed}x
            </button>
          ))}
        </div>

        {/* Status */}
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${simulationStatus === 'RUNNING'
              ? 'bg-emerald-500 dark:bg-emerald-400 animate-pulse'
              : simulationStatus === 'PAUSED'
                ? 'bg-amber-500 dark:bg-amber-400'
                : simulationStatus === 'COMPLETED'
                  ? 'bg-blue-500 dark:bg-blue-400'
                  : 'bg-muted'
              }`}
          />

          <span className="text-xs font-mono font-semibold uppercase text-muted">
            {simulationStatus}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Explain As You Simulate
   ============================================================ */

function ExplainAsYouSimulatePanel() {
  const {
    events,
    schedulerDecision,
    currentTime,
    readyQueue,
    currentProcess,
  } = useSimulationStore();

  const latestEvent =
    events.length > 0 ? events[events.length - 1] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-lg bg-surface border border-accent/30 relative overflow-hidden"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1 text-xs font-bold text-accent uppercase tracking-wider">
              <Sparkles size={14} />
              Explain as You Simulate
            </span>

            <span className="text-[10px] text-muted font-mono">
              T={currentTime}
            </span>

            {latestEvent?.category && (
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-surface-alt text-foreground border border-border">
                {latestEvent.category}
              </span>
            )}
          </div>

          <p className="text-xs text-foreground font-medium leading-relaxed">
            {latestEvent?.explanation ||
              latestEvent?.message ||
              'Simulation ready. Click Play or Step to observe the scheduling decisions and queue changes.'}
          </p>

          {schedulerDecision?.educationalTip && (
            <div className="flex items-start gap-1.5 pt-1 text-[11px] text-muted italic">
              <Info
                size={13}
                className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5"
              />

              <span>
                OS Lesson: {schedulerDecision.educationalTip}
              </span>
            </div>
          )}
        </div>

        {/* Live Status */}
        <div className="hidden sm:flex items-center gap-4 bg-surface-alt p-2.5 rounded border border-border text-center shrink-0">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted">
              Ready Queue
            </p>

            <p className="text-sm font-bold font-mono text-amber-600 dark:text-amber-400">
              {readyQueue.length} jobs
            </p>
          </div>

          <div className="border-l border-border pl-3">
            <p className="text-[10px] uppercase tracking-wider text-muted">
              Active CPU
            </p>

            <p className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {currentProcess || 'IDLE'}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ============================================================
   CPU Panel
   ============================================================ */

function CpuPanel() {
  const {
    currentProcess,
    remainingTimes,
    processes,
  } = useSimulationStore();

  const proc = currentProcess
    ? processes.find((process) => process.pid === currentProcess)
    : null;

  const remaining = currentProcess
    ? remainingTimes[currentProcess]
    : 0;

  return (
    <div className="rounded-md border border-border bg-surface overflow-hidden">
      <div className="px-3 py-2 border-b border-border flex items-center justify-between bg-surface-alt">
        <span className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Cpu size={13} className="text-accent" />
          CPU Execution Core
        </span>

        <span className="text-[10px] font-mono text-muted">
          Single Core
        </span>
      </div>

      <div className="p-4">
        {proc ? (
          <motion.div
            key={proc.pid}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center"
          >
            <div
              className="inline-flex items-center justify-center w-16 h-16 rounded-xl text-white font-mono text-xl font-bold mb-2"
              style={{
                backgroundColor: getProcessColor(proc.pid),
              }}
            >
              {proc.pid}
            </div>

            <p className="text-xs font-semibold text-foreground">
              Running
            </p>

            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border text-xs">
              <div>
                <span className="text-[10px] text-muted">
                  Remaining
                </span>

                <p className="font-mono font-bold text-foreground">
                  {remaining}
                </p>
              </div>

              <div>
                <span className="text-[10px] text-muted">
                  Priority
                </span>

                <p className="font-mono font-bold text-foreground">
                  {proc.priority}
                </p>
              </div>

              <div>
                <span className="text-[10px] text-muted">
                  Burst
                </span>

                <p className="font-mono font-bold text-foreground">
                  {proc.burstTime}
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="text-center py-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-lg bg-surface-alt border border-border text-muted mb-2">
              <Cpu size={24} />
            </div>

            <p className="text-xs text-muted font-semibold">
              CPU IDLE
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   Ready Queue
   ============================================================ */

function ReadyQueuePanel() {
  const {
    readyQueue,
    remainingTimes,
    processes,
    selectedAlgorithm,
    mlfqQueues,
  } = useSimulationStore();

  return (
    <div className="rounded-md border border-border bg-surface overflow-hidden">
      <div className="px-3 py-2 border-b border-border flex items-center justify-between bg-surface-alt">
        <span className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Timer size={13} className="text-amber-500 dark:text-amber-400" />
          Ready Queue
        </span>

        <span className="text-[10px] font-mono text-muted">
          {readyQueue.length} items
        </span>
      </div>

      <div className="p-3">
        {selectedAlgorithm === 'MLFQ' && mlfqQueues ? (
          <div className="space-y-3">
            {(['q0', 'q1', 'q2'] as const).map(
              (level, index) => {
                const queue = mlfqQueues[level] || [];

                const label =
                  index === 0
                    ? 'Q0 (RR Q=2)'
                    : index === 1
                      ? 'Q1 (RR Q=4)'
                      : 'Q2 (FCFS)';

                return (
                  <div
                    key={level}
                    className="p-2 rounded bg-surface-alt border border-border"
                  >
                    <div className="flex justify-between items-center text-[10px] font-mono text-muted mb-1.5">
                      <span className="font-bold text-accent">
                        {label}
                      </span>

                      <span>
                        {queue.length} queued
                      </span>
                    </div>

                    {queue.length === 0 ? (
                      <span className="text-[10px] text-muted italic">
                        Empty
                      </span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {queue.map((pid) => (
                          <span
                            key={pid}
                            className="px-2 py-0.5 rounded text-[10px] font-mono font-bold text-white"
                            style={{
                              backgroundColor:
                                getProcessColor(pid),
                            }}
                          >
                            {pid}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }
            )}
          </div>
        ) : readyQueue.length === 0 ? (
          <p className="text-xs text-muted text-center py-3">
            Queue is empty
          </p>
        ) : (
          <div className="space-y-1.5 max-h-52 overflow-y-auto">
            <AnimatePresence>
              {readyQueue.map((pid) => {
                const proc = processes.find(
                  (process) => process.pid === pid
                );

                return (
                  <motion.div
                    key={pid}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 15 }}
                    className="flex items-center justify-between p-2 rounded bg-surface-alt border border-border"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-6 rounded-sm"
                        style={{
                          backgroundColor:
                            getProcessColor(pid),
                        }}
                      />

                      <span className="font-mono text-xs font-bold text-foreground">
                        {pid}
                      </span>
                    </div>

                    <div className="flex gap-3 text-[10px] text-muted">
                      <span>
                        Rem:{' '}
                        <span className="font-mono text-foreground">
                          {remainingTimes[pid]}
                        </span>
                      </span>

                      {proc && (
                        <span>
                          Pri:{' '}
                          <span className="font-mono text-foreground">
                            {proc.priority}
                          </span>
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   Scheduler Decision
   ============================================================ */

function SchedulerDecisionPanel() {
  const { schedulerDecision } = useSimulationStore();

  return (
    <div className="rounded-md border border-border bg-surface overflow-hidden">
      <div className="px-3 py-2 border-b border-border bg-surface-alt flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Info size={13} className="text-blue-600 dark:text-blue-400" />
          Scheduler Decision
        </span>
      </div>

      <div className="p-3 space-y-2">
        {schedulerDecision ? (
          <>
            <p className="text-xs text-foreground leading-relaxed">
              <strong className="text-accent font-mono">
                {schedulerDecision.pid}
              </strong>{' '}
              — {schedulerDecision.reason}
            </p>

            {schedulerDecision.candidates &&
              schedulerDecision.candidates.length > 0 && (
                <div className="pt-2 border-t border-border">
                  <span className="text-[10px] font-semibold text-muted uppercase">
                    Evaluated Candidates (
                    {schedulerDecision.candidates.length}):
                  </span>

                  <div className="mt-1 space-y-1">
                    {schedulerDecision.candidates.map(
                      (candidate) => (
                        <div
                          key={candidate.pid}
                          className={`flex items-center justify-between px-2 py-1 rounded text-[11px] font-mono ${candidate.pid ===
                            schedulerDecision.pid
                            ? 'bg-accent/10 text-accent font-bold border border-accent/30'
                            : 'bg-surface-alt text-muted'
                            }`}
                        >
                          <span>{candidate.pid}</span>
                          <span>{candidate.detail}</span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
          </>
        ) : (
          <p className="text-xs text-muted">
            No scheduling decision recorded yet. Use Step or Play to start the simulation.
          </p>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   Process States
   ============================================================ */

function ProcessStatesPanel() {
  const {
    processes,
    processStates,
    selectProcess,
    selectedProcess,
  } = useSimulationStore();

  return (
    <div className="rounded-md border border-border bg-surface overflow-hidden h-full">
      <div className="px-3 py-2 border-b border-border bg-surface-alt flex items-center gap-1.5">
        <Zap size={13} className="text-yellow-600 dark:text-yellow-400" />

        <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
          Process States
        </span>
      </div>

      <div className="p-3 space-y-1.5">
        {processes.map((proc) => {
          const status =
            processStates[proc.pid] || 'NEW';

          const colors = STATUS_COLORS[status];

          const isSelected =
            selectedProcess === proc.pid;

          return (
            <motion.button
              key={proc.pid}
              onClick={() =>
                selectProcess(
                  isSelected ? null : proc.pid
                )
              }
              className={`w-full flex items-center justify-between p-2.5 rounded border transition-colors text-left ${isSelected
                ? 'border-accent bg-accent/10'
                : 'border-border bg-surface-alt hover:bg-surface'
                }`}
              layout
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{
                    backgroundColor:
                      getProcessColor(proc.pid),
                  }}
                />

                <span className="font-mono text-xs font-bold text-foreground">
                  {proc.pid}
                </span>
              </div>

              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wide"
                style={{
                  backgroundColor: colors.bg,
                  color: colors.text,
                  border: `1px solid ${colors.border}`,
                }}
              >
                {status}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
   Process Inspector
   ============================================================ */

function ProcessInspector() {
  const {
    selectedProcess,
    processes,
    remainingTimes,
    processStates,
    selectProcess,
  } = useSimulationStore();

  const proc = selectedProcess
    ? processes.find(
      (process) => process.pid === selectedProcess
    )
    : null;

  if (!proc) {
    return (
      <div className="rounded-md border border-border bg-surface overflow-hidden h-full flex items-center justify-center p-6 text-center">
        <div>
          <Activity
            size={24}
            className="text-muted mx-auto mb-2 opacity-50"
          />

          <p className="text-xs text-muted">
            Select a process to inspect its runtime attributes.
          </p>
        </div>
      </div>
    );
  }

  const status =
    processStates[proc.pid] || 'NEW';

  const remaining =
    remainingTimes[proc.pid] ?? proc.burstTime;

  const elapsed =
    proc.burstTime - remaining;

  const progressPct =
    proc.burstTime > 0
      ? (elapsed / proc.burstTime) * 100
      : 0;

  return (
    <div className="rounded-md border border-border bg-surface overflow-hidden h-full">
      <div className="px-3 py-2 border-b border-border bg-surface-alt flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Activity
            size={13}
            className="text-accent"
          />

          Process Control Block ({proc.pid})
        </span>

        <button
          onClick={() => selectProcess(null)}
          className="text-muted hover:text-foreground transition-colors"
          aria-label="Close process inspector"
        >
          <X size={14} />
        </button>
      </div>

      <div className="p-4 space-y-4 text-xs">
        {/* Progress */}
        <div>
          <div className="flex justify-between text-muted mb-1">
            <span>Execution Progress</span>

            <span className="font-mono">
              {elapsed}/{proc.burstTime} (
              {Math.round(progressPct)}%)
            </span>
          </div>

          <div className="h-2 rounded-full bg-surface-alt border border-border overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${progressPct}%`,
                backgroundColor:
                  getProcessColor(proc.pid),
              }}
            />
          </div>
        </div>

        {/* PCB Runtime Attributes */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-2 rounded bg-surface-alt border border-border">
            <span className="text-[10px] text-muted uppercase">
              Arrival Time
            </span>

            <p className="text-sm font-mono font-bold text-foreground">
              {proc.arrivalTime}
            </p>
          </div>

          <div className="p-2 rounded bg-surface-alt border border-border">
            <span className="text-[10px] text-muted uppercase">
              Burst Time
            </span>

            <p className="text-sm font-mono font-bold text-foreground">
              {proc.burstTime}
            </p>
          </div>

          <div className="p-2 rounded bg-surface-alt border border-border">
            <span className="text-[10px] text-muted uppercase">
              Priority
            </span>

            <p className="text-sm font-mono font-bold text-foreground">
              {proc.priority}
            </p>
          </div>

          <div className="p-2 rounded bg-surface-alt border border-border">
            <span className="text-[10px] text-muted uppercase">
              Status
            </span>

            <p className="text-sm font-mono font-bold text-accent">
              {status}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Gantt Chart
   ============================================================ */

function GanttChart() {
  const { gantt, currentTime } =
    useSimulationStore();

  const scrollRef =
    useRef<HTMLDivElement>(null);

  const followFrameRef =
    useRef<number | null>(null);

  const UNIT = 38;

  const maxTime =
    gantt.length > 0
      ? Math.max(
        ...gantt.map((segment) => segment.end)
      )
      : 0;

  /*
   * Auto-follow hanya dilakukan di dalam container Gantt.
   * Halaman utama tidak akan ikut bergeser.
   * Container Gantt hanya bergerak ketika playhead
   * mendekati batas viewport.
   */
  useEffect(() => {
    const container = scrollRef.current;

    if (!container || gantt.length === 0) {
      return;
    }

    if (followFrameRef.current !== null) {
      cancelAnimationFrame(
        followFrameRef.current
      );
    }

    followFrameRef.current =
      requestAnimationFrame(() => {
        const playheadPosition =
          currentTime * UNIT;

        const viewportWidth =
          container.clientWidth;

        if (viewportWidth <= 0) {
          return;
        }

        const currentScrollLeft =
          container.scrollLeft;

        const viewportLeft =
          currentScrollLeft;

        const viewportRight =
          currentScrollLeft + viewportWidth;

        const safeLeft =
          viewportLeft + viewportWidth * 0.2;

        const safeRight =
          viewportRight - viewportWidth * 0.2;

        if (playheadPosition > safeRight) {
          const targetScroll =
            playheadPosition -
            viewportWidth * 0.6;

          container.scrollLeft = Math.max(
            0,
            targetScroll
          );
        } else if (
          playheadPosition < safeLeft
        ) {
          const targetScroll =
            playheadPosition -
            viewportWidth * 0.4;

          container.scrollLeft = Math.max(
            0,
            targetScroll
          );
        }
      });

    return () => {
      if (followFrameRef.current !== null) {
        cancelAnimationFrame(
          followFrameRef.current
        );

        followFrameRef.current = null;
      }
    };
  }, [currentTime, gantt.length]);

  /*
   * Cleanup ketika component di-unmount.
   */
  useEffect(() => {
    return () => {
      if (followFrameRef.current !== null) {
        cancelAnimationFrame(
          followFrameRef.current
        );
      }
    };
  }, []);

  return (
    <div className="rounded-md border border-border bg-surface overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 border-b border-border bg-surface-alt flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
          Live Gantt Chart
        </span>

        <span className="text-[10px] font-mono text-muted">
          {gantt.length} segments
        </span>
      </div>

      <div className="p-3">
        {gantt.length === 0 ? (
          <p className="text-xs text-muted text-center py-4">
            Gantt segments will appear as the simulation runs.
          </p>
        ) : (
          <div
            ref={scrollRef}
            className="
              overflow-x-auto
              overflow-y-hidden
              overscroll-x-contain
              pb-2
            "
          >
            <div
              className="relative"
              style={{
                width: `${Math.max(
                  maxTime * UNIT + 20,
                  100
                )}px`,
                minWidth: `${Math.max(
                  maxTime * UNIT + 20,
                  100
                )}px`,
              }}
            >
              {/* Gantt Blocks */}
              <div className="flex h-10">
                {gantt.map((segment, index) => {
                  const totalDuration =
                    segment.end - segment.start;

                  const totalWidth =
                    totalDuration * UNIT;

                  /*
                   * Hanya bagian yang sudah dilewati
                   * simulation clock yang ditampilkan.
                   */
                  const visibleEnd = Math.min(
                    currentTime,
                    segment.end
                  );

                  const visibleDuration =
                    Math.max(
                      0,
                      visibleEnd -
                      segment.start
                    );

                  const visibleWidth =
                    visibleDuration * UNIT;

                  const isActive =
                    currentTime >=
                    segment.start &&
                    currentTime <
                    segment.end;

                  const isCompleted =
                    currentTime >= segment.end;

                  return (
                    <div
                      key={`${segment.pid ?? 'idle'}-${segment.start}-${segment.end}-${index}`}
                      className="relative h-full shrink-0"
                      style={{
                        width: `${totalWidth}px`,
                      }}
                    >
                      {/* Completed / Active Portion */}
                      {visibleWidth > 0 && (
                        <motion.div
                          initial={false}
                          animate={{
                            width: visibleWidth,
                          }}
                          transition={{
                            duration: 0.08,
                            ease: 'linear',
                          }}
                          className={`
                            absolute
                            left-0
                            top-0
                            h-full
                            flex
                            items-center
                            justify-center
                            border-r
                            border-border
                            text-[10px]
                            font-mono
                            font-bold
                            overflow-hidden
                            ${segment.pid
                              ? 'text-white'
                              : 'text-muted bg-surface-alt border-dashed border-border'
                            }
                          `}
                          style={{
                            backgroundColor:
                              segment.pid
                                ? getProcessColor(
                                  segment.pid
                                )
                                : undefined,
                            opacity:
                              isActive ||
                                isCompleted
                                ? 1
                                : 0.8,
                          }}
                          title={
                            segment.pid
                              ? `${segment.pid}: ${segment.start}–${segment.end}`
                              : `IDLE: ${segment.start}–${segment.end}`
                          }
                        >
                          {segment.pid || 'IDLE'}

                          {/* Active Playhead Edge */}
                          {isActive && (
                            <div
                              className="
                                absolute
                                top-0
                                right-0
                                w-0.5
                                h-full
                                bg-white
                                opacity-90
                              "
                            />
                          )}
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Time Scale */}
              <div className="relative h-6 mt-1 border-t border-border">
                {Array.from(
                  {
                    length:
                      Math.max(
                        0,
                        Math.floor(maxTime)
                      ) + 1,
                  },
                  (_, time) => (
                    <div
                      key={time}
                      className="absolute top-0"
                      style={{
                        left: `${time * UNIT}px`,
                        transform:
                          'translateX(-50%)',
                      }}
                    >
                      <div className="h-1.5 w-px bg-border" />

                      <span className="block mt-1 text-[9px] font-mono text-muted whitespace-nowrap">
                        {time}
                      </span>
                    </div>
                  )
                )}
              </div>

              {/* Current Time Indicator */}
              <motion.div
                className="
                  absolute
                  top-0
                  bottom-6
                  w-px
                  bg-accent/80
                  pointer-events-none
                  z-20
                "
                animate={{
                  x: currentTime * UNIT,
                }}
                transition={{
                  duration: 0.1,
                  ease: 'linear',
                }}
              >
                <div
                  className="
                    absolute
                    -top-1
                    -left-1
                    w-2
                    h-2
                    rounded-full
                    bg-accent
                    shadow-sm
                  "
                />
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   Event Log
   ============================================================ */

function EventLog() {
  const { events } = useSimulationStore();

  const logRef =
    useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop =
        logRef.current.scrollHeight;
    }
  }, [events]);

  const getEventColor = (type: string) => {
    switch (type) {
      case 'ARRIVAL':
        return 'text-blue-600 dark:text-blue-400';

      case 'SCHEDULED':
        return 'text-green-600 dark:text-green-400';

      case 'COMPLETED':
        return 'text-emerald-600 dark:text-emerald-300';

      case 'PREEMPTED':
        return 'text-amber-600 dark:text-amber-400';

      case 'QUANTUM_EXPIRED':
        return 'text-yellow-600 dark:text-yellow-400';

      case 'AGING':
        return 'text-purple-600 dark:text-purple-400';

      case 'BOOST':
        return 'text-accent';

      case 'IDLE':
        return 'text-muted';

      default:
        return 'text-muted';
    }
  };

  return (
    <div className="rounded-md border border-border bg-surface overflow-hidden">
      <div className="px-3 py-2 border-b border-border bg-surface-alt flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
          Event Timeline
        </span>

        <span className="text-[10px] font-mono text-muted">
          {events.length} events logged
        </span>
      </div>

      <div
        ref={logRef}
        className="p-3 max-h-52 overflow-y-auto space-y-1"
      >
        {events.length === 0 ? (
          <p className="text-xs text-muted text-center py-4">
            Events will appear as the simulation progresses.
          </p>
        ) : (
          events.map((event, index) => (
            <div
              key={index}
              className="flex items-start gap-2 text-xs py-0.5 border-b border-border/40 last:border-0"
            >
              <span className="font-mono text-muted shrink-0 w-8 text-right">
                T={event.time}
              </span>

              <span className={getEventColor(event.type)}>
                {event.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}