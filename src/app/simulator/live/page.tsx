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
  Zap,
  Timer,
  ChevronRight,
  X,
  Activity,
  Info,
  Sparkles,
} from 'lucide-react';

import { useSimulationStore } from '@/store/simulation';
import { ALGORITHM_DISPLAY_NAMES, getProcessColor, STATUS_COLORS } from '@/lib/constants';
import type { SimulationSpeed } from '@/lib/types';

export default function LiveSimulationPage() {
  const router = useRouter();
  const store = useSimulationStore();
  const [explainMode, setExplainMode] = useState(true);

  // Redirect if not initialized
  useEffect(() => {
    if (!store.engine && store.simulationStatus === 'IDLE') {
      router.replace('/simulator/new');
    }
  }, [store.engine, store.simulationStatus, router]);

  if (!store.engine) {
    return (
      <div className="min-h-screen bg-sim-bg flex items-center justify-center">
        <p className="text-sim-muted text-sm">Initializing simulation…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sim-bg text-sim-text pb-12">
      {/* Header */}
      <div className="border-b border-sim-border px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-sim-text">{store.simulationName}</h1>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-accent/20 text-accent font-semibold">
                {ALGORITHM_DISPLAY_NAMES[store.selectedAlgorithm]}
              </span>
            </div>
            <p className="text-xs text-sim-muted font-mono mt-0.5">
              {store.selectedAlgorithm === 'RR' && `Time Quantum: Q=${store.timeQuantum}`}
              {store.selectedAlgorithm === 'MLFQ' && `MLFQ: Q0=${store.timeQuantum}, Q1=${store.timeQuantum * 2}, Q2=FCFS (Boost every 20u)`}
              {store.selectedAlgorithm === 'PRIORITY_AGING' && `Priority with Aging: Interval=${store.agingInterval}u (${store.priorityDirection})`}
              {store.selectedAlgorithm === 'PRIORITY' && `Priority Direction: ${store.priorityDirection}`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-sim-muted">
            <button
              onClick={() => setExplainMode(!explainMode)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${explainMode
                  ? 'bg-accent/20 text-accent border border-accent/40'
                  : 'bg-sim-surface text-sim-muted border border-sim-border hover:text-sim-text'
                }`}
            >
              <Sparkles size={13} className={explainMode ? 'text-accent' : 'text-sim-muted'} />
              Explain as You Simulate: {explainMode ? 'ON' : 'OFF'}
            </button>

            <span className="flex items-center gap-1">
              <Clock size={13} />
              T = <span className="text-sim-text font-semibold">{store.currentTime}</span>
            </span>

            {store.simulationStatus === 'COMPLETED' && (
              <button
                onClick={() => router.push('/results')}
                className="flex items-center gap-1 px-3 py-1 bg-accent text-white rounded text-xs font-semibold hover:bg-accent-hover transition-colors shadow"
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

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
        {/* Explain As You Simulate Banner / Deep Educational Insight */}
        {explainMode && <ExplainAsYouSimulatePanel />}

        <div className="grid lg:grid-cols-3 gap-4">
          {/* Left Column: CPU + Ready Queue */}
          <div className="space-y-4">
            <CpuPanel />
            <ReadyQueuePanel />
            <SchedulerDecisionPanel />
          </div>

          {/* Center: Process States */}
          <div>
            <ProcessStatesPanel />
          </div>

          {/* Right: Process Inspector */}
          <div>
            <ProcessInspector />
          </div>
        </div>

        {/* Bottom: Gantt + Events */}
        <div className="grid lg:grid-cols-2 gap-4">
          <GanttChart />
          <EventLog />
        </div>
      </div>
    </div>
  );
}

// ==================== Simulation Controls ====================

function SimulationControls() {
  const { simulationStatus, simulationSpeed, play, pause, step, reset, setSpeed } = useSimulationStore();
  const router = useRouter();

  const speeds: SimulationSpeed[] = [0.5, 1, 2, 4];

  const handleReset = () => {
    reset();
    router.push('/simulator/new');
  };

  return (
    <div className="border-b border-sim-border bg-sim-surface px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Playback Buttons */}
        <div className="flex items-center gap-1.5">
          {simulationStatus === 'RUNNING' ? (
            <button
              onClick={pause}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded text-xs font-semibold hover:bg-amber-500/30 transition-colors"
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
              {simulationStatus === 'PAUSED' ? 'Resume' : 'Play'}
            </button>
          )}

          <button
            onClick={step}
            disabled={simulationStatus === 'COMPLETED' || simulationStatus === 'RUNNING'}
            className="flex items-center gap-1 px-3 py-1.5 bg-sim-bg-deep border border-sim-border text-sim-text rounded text-xs font-medium hover:bg-sim-border/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="Step 1 time unit forward"
          >
            <SkipForward size={14} />
            Step
          </button>

          <button
            onClick={handleReset}
            className="flex items-center gap-1 px-2.5 py-1.5 text-sim-muted hover:text-sim-text rounded text-xs font-medium hover:bg-sim-border/30 transition-colors"
            title="Reset Simulation"
          >
            <RotateCcw size={14} />
            Reset
          </button>
        </div>

        {/* Speed Controls */}
        <div className="flex items-center gap-1 text-xs">
          <span className="text-sim-muted mr-1">Speed:</span>
          {speeds.map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`px-2 py-1 rounded font-mono font-bold transition-colors ${simulationSpeed === s
                  ? 'bg-accent text-white'
                  : 'text-sim-muted hover:text-sim-text hover:bg-sim-bg-deep'
                }`}
            >
              {s}x
            </button>
          ))}
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${simulationStatus === 'RUNNING'
                ? 'bg-emerald-400 animate-pulse'
                : simulationStatus === 'PAUSED'
                  ? 'bg-amber-400'
                  : simulationStatus === 'COMPLETED'
                    ? 'bg-blue-400'
                    : 'bg-sim-muted'
              }`}
          />
          <span className="text-xs font-mono font-semibold uppercase text-sim-muted">
            {simulationStatus}
          </span>
        </div>
      </div>
    </div>
  );
}

// ==================== Explain As You Simulate Panel ====================

function ExplainAsYouSimulatePanel() {
  const { events, schedulerDecision, currentTime, readyQueue, currentProcess } = useSimulationStore();
  const latestEvent = events.length > 0 ? events[events.length - 1] : null;


  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-lg bg-sim-surface border border-accent/30 shadow-md relative overflow-hidden"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs font-bold text-accent uppercase tracking-wider">
              <Sparkles size={14} />
              Explain as You Simulate: Event Reasoning (T={currentTime})
            </span>
            {latestEvent?.category && (
              <span className="text-[10px] uppercase font-mono px-2 py-0.2 rounded-full bg-sim-bg-deep text-sim-text border border-sim-border">
                {latestEvent.category}
              </span>
            )}
          </div>

          <p className="text-xs text-sim-text font-medium leading-relaxed">
            {latestEvent?.explanation ||
              latestEvent?.message ||
              'Simulation ready. Click "Play" or "Step" to observe why processes are chosen and how the OS manages queues.'}
          </p>

          {schedulerDecision?.educationalTip && (
            <div className="flex items-start gap-1.5 pt-1 text-[11px] text-sim-muted italic">
              <Info size={13} className="text-blue-400 shrink-0 mt-0.5" />
              <span>OS Lesson: {schedulerDecision.educationalTip}</span>
            </div>
          )}
        </div>

        {/* Live Metrics Gauge Box */}
        <div className="hidden sm:flex items-center gap-4 bg-sim-bg-deep/80 p-2.5 rounded border border-sim-border text-center shrink-0">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-sim-muted">Ready Queue</p>
            <p className="text-sm font-bold font-mono text-amber-400">{readyQueue.length} jobs</p>
          </div>
          <div className="border-l border-sim-border pl-3">
            <p className="text-[10px] uppercase tracking-wider text-sim-muted">Active CPU</p>
            <p className="text-sm font-bold font-mono text-emerald-400">{currentProcess || 'IDLE'}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ==================== CPU Panel ====================

function CpuPanel() {
  const { currentProcess, remainingTimes, processes } = useSimulationStore();
  const proc = currentProcess ? processes.find((p) => p.pid === currentProcess) : null;
  const remaining = currentProcess ? remainingTimes[currentProcess] : 0;

  return (
    <div className="rounded-md border border-sim-border bg-sim-surface overflow-hidden">
      <div className="px-3 py-2 border-b border-sim-border flex items-center justify-between bg-sim-bg-deep">
        <span className="text-xs font-semibold text-sim-text uppercase tracking-wider flex items-center gap-1.5">
          <Cpu size={13} className="text-accent" />
          CPU Execution Core
        </span>
        <span className="text-[10px] font-mono text-sim-muted">Single Core</span>
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
              className="inline-flex items-center justify-center w-16 h-16 rounded-xl text-white font-mono text-xl font-bold mb-2 shadow-lg"
              style={{ backgroundColor: getProcessColor(proc.pid) }}
            >
              {proc.pid}
            </div>
            <p className="text-xs font-semibold text-sim-text">Running</p>
            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-sim-border text-xs">
              <div>
                <span className="text-[10px] text-sim-muted">Remaining</span>
                <p className="font-mono font-bold text-sim-text">{remaining}</p>
              </div>
              <div>
                <span className="text-[10px] text-sim-muted">Priority</span>
                <p className="font-mono font-bold text-sim-text">{proc.priority}</p>
              </div>
              <div>
                <span className="text-[10px] text-sim-muted">Burst</span>
                <p className="font-mono font-bold text-sim-text">{proc.burstTime}</p>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="text-center py-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-lg bg-sim-bg-deep border border-sim-border text-sim-muted mb-2">
              <Cpu size={24} />
            </div>
            <p className="text-xs text-sim-muted font-semibold">CPU IDLE</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== Ready Queue Panel ====================

function ReadyQueuePanel() {
  const { readyQueue, remainingTimes, processes, selectedAlgorithm, mlfqQueues } = useSimulationStore();

  return (
    <div className="rounded-md border border-sim-border bg-sim-surface overflow-hidden">
      <div className="px-3 py-2 border-b border-sim-border flex items-center justify-between bg-sim-bg-deep">
        <span className="text-xs font-semibold text-sim-text uppercase tracking-wider flex items-center gap-1.5">
          <Timer size={13} className="text-amber-400" />
          Ready Queue
        </span>
        <span className="text-[10px] font-mono text-sim-muted">{readyQueue.length} items</span>
      </div>

      <div className="p-3">
        {selectedAlgorithm === 'MLFQ' && mlfqQueues ? (
          /* Multi-Level Feedback Queues */
          <div className="space-y-3">
            {(['q0', 'q1', 'q2'] as const).map((lvl, idx) => {
              const qList = mlfqQueues[lvl] || [];
              const label = idx === 0 ? 'Q0 (RR Q=2)' : idx === 1 ? 'Q1 (RR Q=4)' : 'Q2 (FCFS)';
              return (
                <div key={lvl} className="p-2 rounded bg-sim-bg-deep border border-sim-border/80">
                  <div className="flex justify-between items-center text-[10px] font-mono text-sim-muted mb-1.5">
                    <span className="font-bold text-accent">{label}</span>
                    <span>{qList.length} queued</span>
                  </div>
                  {qList.length === 0 ? (
                    <span className="text-[10px] text-sim-muted italic">Empty</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {qList.map((pid) => (
                        <span
                          key={pid}
                          className="px-2 py-0.5 rounded text-[10px] font-mono font-bold text-white shadow-sm"
                          style={{ backgroundColor: getProcessColor(pid) }}
                        >
                          {pid}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : readyQueue.length === 0 ? (
          <p className="text-xs text-sim-muted text-center py-3">Queue is empty</p>
        ) : (
          <div className="space-y-1.5 max-h-52 overflow-y-auto">
            <AnimatePresence>
              {readyQueue.map((pid) => {
                const proc = processes.find((p) => p.pid === pid);
                return (
                  <motion.div
                    key={pid}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 15 }}
                    className="flex items-center justify-between p-2 rounded bg-sim-bg-deep border border-sim-border"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-6 rounded-sm"
                        style={{ backgroundColor: getProcessColor(pid) }}
                      />
                      <span className="font-mono text-xs font-bold text-sim-text">{pid}</span>
                    </div>
                    <div className="flex gap-3 text-[10px] text-sim-muted">
                      <span>Rem: <span className="font-mono text-sim-text">{remainingTimes[pid]}</span></span>
                      {proc && <span>Pri: <span className="font-mono text-sim-text">{proc.priority}</span></span>}
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

// ==================== Scheduler Decision Panel ====================

function SchedulerDecisionPanel() {
  const { schedulerDecision } = useSimulationStore();

  return (
    <div className="rounded-md border border-sim-border bg-sim-surface overflow-hidden">
      <div className="px-3 py-2 border-b border-sim-border bg-sim-bg-deep flex items-center justify-between">
        <span className="text-xs font-semibold text-sim-text uppercase tracking-wider flex items-center gap-1.5">
          <Info size={13} className="text-blue-400" />
          Scheduler Decision Inspector
        </span>
      </div>
      <div className="p-3 space-y-2">
        {schedulerDecision ? (
          <>
            <p className="text-xs text-sim-text leading-relaxed">
              <strong className="text-accent font-mono">{schedulerDecision.pid}</strong> — {schedulerDecision.reason}
            </p>

            {schedulerDecision.candidates && schedulerDecision.candidates.length > 0 && (
              <div className="pt-2 border-t border-sim-border/80">
                <span className="text-[10px] font-semibold text-sim-muted uppercase">
                  Evaluated Candidates ({schedulerDecision.candidates.length}):
                </span>
                <div className="mt-1 space-y-1">
                  {schedulerDecision.candidates.map((cand) => (
                    <div
                      key={cand.pid}
                      className={`flex items-center justify-between px-2 py-1 rounded text-[11px] font-mono ${cand.pid === schedulerDecision.pid
                          ? 'bg-accent/15 text-accent font-bold border border-accent/30'
                          : 'bg-sim-bg-deep text-sim-muted'
                        }`}
                    >
                      <span>{cand.pid}</span>
                      <span>{cand.detail}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-xs text-sim-muted">No decision recorded yet. Step forward to trigger scheduling.</p>
        )}
      </div>
    </div>
  );
}

// ==================== Process States ====================

function ProcessStatesPanel() {
  const { processes, processStates, selectProcess, selectedProcess, currentProcess } = useSimulationStore();

  useEffect(() => {
    if (!selectedProcess && currentProcess) {
      selectProcess(currentProcess);
    }
  }, [currentProcess, selectedProcess, selectProcess]);

  return (
    <div className="rounded-md border border-sim-border bg-sim-surface overflow-hidden h-full">
      <div className="px-3 py-2 border-b border-sim-border bg-sim-bg-deep flex items-center gap-1.5">
        <Zap size={13} className="text-yellow-400" />
        <span className="text-xs font-semibold text-sim-text uppercase tracking-wider">Process States</span>
      </div>
      <div className="p-3 space-y-1.5" role="listbox" aria-label="Process States">
        {processes.map((proc) => {
          const status = processStates[proc.pid] || 'NEW';
          const colors = STATUS_COLORS[status];
          const isSelected = selectedProcess === proc.pid;

          return (
            <motion.button
              key={proc.pid}
              onClick={() => selectProcess(isSelected ? null : proc.pid)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  selectProcess(isSelected ? null : proc.pid);
                }
              }}
              tabIndex={0}
              role="option"
              aria-selected={isSelected}
              className={`w-full flex items-center justify-between p-2.5 rounded border transition-colors text-left focus:outline-none focus:ring-2 focus:ring-info/50 ${isSelected
                  ? 'border-info bg-info-bg/20 ring-1 ring-info/50'
                  : 'border-sim-border bg-sim-bg-deep hover:border-sim-border/80'
                }`}
              layout
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: getProcessColor(proc.pid) }}
                />
                <span className="font-mono text-xs font-bold text-sim-text">{proc.pid}</span>
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

// ==================== Process Inspector ====================

function ProcessInspector() {
  const { selectedProcess, processes, processStates, remainingTimes, results } = useSimulationStore();

  if (!proc) {
    return (
      <div className="rounded-md border border-sim-border bg-sim-surface overflow-hidden h-full">
        <div className="px-3 py-2 border-b border-sim-border bg-sim-bg-deep">
          <span className="text-xs font-semibold text-sim-text uppercase tracking-wider">Process Inspector</span>
        </div>
        <div className="p-4 text-center">
          <p className="text-xs text-sim-muted">Click a process to inspect its details.</p>
        </div>
      </div>
    );
  }

  const proc = processes.find((p) => p.pid === selectedProcess)!;
  const status = processStates[selectedProcess] || 'NEW';
  const remaining = remainingTimes[selectedProcess] ?? proc.burstTime;
  const result = results?.processResults.find((r) => r.pid === selectedProcess);

  const rows: [string, string | number][] = [
    ['PID', proc.pid],
    ['State', status],
    ['Arrival Time', proc.arrivalTime],
    ['Burst Time', proc.burstTime],
    ['Remaining', remaining],
    ['Priority', proc.priority],
  ];

  if (result) {
    rows.push(
      ['First Start', result.firstStart],
      ['Completion', result.completionTime],
      ['Turnaround', result.turnaroundTime],
      ['Waiting', result.waitingTime],
      ['Response', result.responseTime]
    );
  }

  return (
    <div className="rounded-md border border-sim-border bg-sim-surface overflow-hidden h-full">
      <div className="px-3 py-2 border-b border-sim-border bg-sim-bg-deep flex items-center justify-between">
        <span className="text-xs font-semibold text-sim-text uppercase tracking-wider">
          Process Inspector — <span className="font-mono">{selectedProcess}</span>
        </span>
        <button
          onClick={() => useSimulationStore.getState().selectProcess(null)}
          className="text-sim-muted hover:text-sim-text"
          aria-label="Close inspector"
        >
          <X size={14} />
        </button>
      </div>
      <div className="p-3">
        <table className="w-full text-xs">
          <tbody>
            {rows.map(([label, value]) => (
              <tr key={label} className="border-b border-sim-border last:border-b-0">
                <td className="py-1.5 text-sim-muted pr-3">{label}</td>
                <td className="py-1.5 font-mono font-semibold text-sim-text text-right">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==================== Gantt Chart ====================

function GanttChart() {
  const { results, currentTime, totalTime, simulationStatus } = useSimulationStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  const finalSchedule = results?.gantt ?? [];
  const maxTime = totalTime || (finalSchedule.length > 0 ? finalSchedule[finalSchedule.length - 1].end : 0);
  const UNIT = 40; // px per time unit

  useEffect(() => {
    if (scrollRef.current && simulationStatus === 'RUNNING') {
      const targetScroll = currentTime * UNIT - scrollRef.current.clientWidth / 2;
      scrollRef.current.scrollLeft = Math.max(0, targetScroll);
    }
  }, [gantt]);

  const maxTime = gantt.length > 0 ? Math.max(...gantt.map((s) => s.end)) : 0;
  const UNIT = 40; // px per time unit

  return (
    <div className="rounded-md border border-sim-border bg-sim-surface overflow-hidden">
      <div className="px-3 py-2 border-b border-sim-border bg-sim-bg-deep">
        <span className="text-xs font-semibold text-sim-text uppercase tracking-wider">Gantt Chart</span>
      </div>
      <div className="p-3">
        {gantt.length === 0 ? (
          <p className="text-xs text-sim-muted text-center py-4">Gantt chart will appear as the simulation runs.</p>
        ) : (
          <div ref={scrollRef} className="overflow-x-auto pb-4 pt-1">
            <div style={{ width: Math.max(maxTime * UNIT + 40, 320) }} className="relative">
              {/* Blocks track */}
              <div className="flex h-10 relative bg-sim-bg-deep/60 rounded-xs border border-sim-border/50">
                {finalSchedule.map((seg, i) => {
                  const blockStart = seg.start;
                  const blockEnd = seg.end;
                  const visibleEnd = Math.min(currentTime, blockEnd);
                  const visibleDuration = Math.max(0, visibleEnd - blockStart);

                  if (visibleDuration <= 0) return null;

                  const width = visibleDuration * UNIT;
                  const isActive = currentTime >= blockStart && currentTime < blockEnd;

                  return (
                    <div
                      key={i}
                      className={`h-full flex items-center justify-center border-r border-sim-bg-deep text-[10px] font-mono font-bold shrink-0 relative transition-all ${seg.pid
                          ? 'text-white'
                          : 'text-sim-muted bg-sim-bg-deep border-dashed border-sim-border'
                        } ${isActive ? 'ring-1 ring-white/60 ring-inset z-10' : ''}`}
                      style={{
                        width: `${width}px`,
                        backgroundColor: seg.pid ? getProcessColor(seg.pid) : undefined,
                        opacity: isActive ? 1 : 0.75,
                      }}
                      title={
                        seg.pid
                          ? `${seg.pid}: ${seg.start}–${seg.end} (Visible: ${visibleDuration.toFixed(1)}u)`
                          : `IDLE: ${seg.start}–${seg.end}`
                      }
                    >
                      {width > 22 && (
                        <span className="truncate px-1 text-[10px] font-mono">{seg.pid || 'IDLE'}</span>
                      )}
                      {isActive && (
                        <div className="absolute top-0 right-0 w-0.5 h-full bg-white/80 animate-pulse" />
                      )}
                    </div>
                  );
                })}

                {/* Vertical Current Time Indicator / Cursor Line */}
                {maxTime > 0 && currentTime <= maxTime && (
                  <div
                    className="absolute top-0 bottom-0 pointer-events-none z-20 flex flex-col items-center"
                    style={{ left: `${currentTime * UNIT}px` }}
                  >
                    <div className="w-0.5 h-full bg-accent shadow-sm" />
                    <div className="absolute -top-1 w-2 h-2 rounded-full bg-accent border border-white" />
                  </div>
                )}
              </div>

              {/* Time scale / Axis labels */}
              <div className="relative h-6 mt-1.5 text-[9px] font-mono text-sim-muted">
                {finalSchedule.map((seg, i) => {
                  if (currentTime < seg.start) return null;
                  const visibleEnd = Math.min(currentTime, seg.end);
                  const visibleDuration = Math.max(0, visibleEnd - seg.start);
                  if (visibleDuration <= 0) return null;

                  const width = visibleDuration * UNIT;
                  const showEndLabel = currentTime >= seg.end;

                  return (
                    <div
                      key={i}
                      className="absolute top-0 flex justify-between border-l border-sim-border/70 pt-0.5 px-0.5"
                      style={{
                        left: `${seg.start * UNIT}px`,
                        width: `${width}px`,
                      }}
                    >
                      <span>{seg.start}</span>
                      {showEndLabel && <span>{seg.end}</span>}
                    </div>
                  );
                })}

                {/* Dynamic current time indicator badge on timeline axis */}
                {currentTime > 0 && currentTime < maxTime && (
                  <div
                    className="absolute top-1 pointer-events-none z-20 text-[9px] font-mono font-bold text-accent px-1 rounded bg-accent/20 border border-accent/40 -translate-x-1/2"
                    style={{ left: `${currentTime * UNIT}px` }}
                  >
                    {currentTime.toFixed(1)}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== Event Log ====================

function EventLog() {
  const { events } = useSimulationStore();
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [events]);

  const getEventColor = (type: string) => {
    switch (type) {
      case 'ARRIVAL':
        return 'text-blue-400';
      case 'SCHEDULED':
        return 'text-green-400';
      case 'COMPLETED':
        return 'text-emerald-300';
      case 'PREEMPTED':
        return 'text-amber-400';
      case 'QUANTUM_EXPIRED':
        return 'text-yellow-400';
      case 'AGING':
        return 'text-purple-400';
      case 'BOOST':
        return 'text-accent';
      case 'IDLE':
        return 'text-sim-muted';
      default:
        return 'text-sim-muted';
    }
  };

  return (
    <div className="rounded-md border border-sim-border bg-sim-surface overflow-hidden">
      <div className="px-3 py-2 border-b border-sim-border bg-sim-bg-deep flex items-center justify-between">
        <span className="text-xs font-semibold text-sim-text uppercase tracking-wider">Event Timeline</span>
        <span className="text-[10px] font-mono text-sim-muted">{events.length} events logged</span>
      </div>
      <div ref={logRef} className="p-3 max-h-52 overflow-y-auto space-y-1">
        {events.length === 0 ? (
          <p className="text-xs text-sim-muted text-center py-4">Events will appear as the simulation progresses.</p>
        ) : (
          events.map((ev, i) => (
            <div key={i} className="flex items-start gap-2 text-xs py-0.5 border-b border-sim-border/30 last:border-0">
              <span className="font-mono text-sim-muted shrink-0 w-8 text-right">
                T={ev.time}
              </span>
              <span className={getEventColor(ev.type)}>
                {ev.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
