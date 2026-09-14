'use client';

import { useEffect, useRef } from 'react';
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
} from 'lucide-react';
import { useSimulationStore } from '@/store/simulation';
import { ALGORITHM_DISPLAY_NAMES, getProcessColor, STATUS_COLORS } from '@/lib/constants';
import type { SimulationSpeed, ProcessStatus } from '@/lib/types';

export default function LiveSimulationPage() {
  const router = useRouter();
  const store = useSimulationStore();

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
    <div className="min-h-screen bg-sim-bg text-sim-text">
      {/* Header */}
      <div className="border-b border-sim-border px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-sm font-bold text-sim-text">{store.simulationName}</h1>
            <p className="text-xs text-sim-muted font-mono">
              {ALGORITHM_DISPLAY_NAMES[store.selectedAlgorithm]}
              {store.selectedAlgorithm === 'RR' && ` (Q=${store.timeQuantum})`}
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-sim-muted">
            <span className="flex items-center gap-1">
              <Clock size={13} />
              T = <span className="text-sim-text font-semibold">{store.currentTime}</span>
            </span>
            <span>
              Total: <span className="text-sim-text">{store.totalTime}</span>
            </span>
            {store.simulationStatus === 'COMPLETED' && (
              <button
                onClick={() => router.push('/results')}
                className="flex items-center gap-1 px-2.5 py-1 bg-accent text-white rounded text-xs font-semibold hover:bg-accent-hover transition-colors"
              >
                View Results
                <ChevronRight size={12} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <SimulationControls />

      {/* Main Grid */}
      <div className="max-w-7xl mx-auto px-4 py-4">
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
        <div className="grid lg:grid-cols-2 gap-4 mt-4">
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
    <div className="border-b border-sim-border px-4 py-2">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          {simulationStatus === 'RUNNING' ? (
            <button onClick={pause} className="sim-btn" aria-label="Pause">
              <Pause size={16} /> Pause
            </button>
          ) : (
            <button
              onClick={play}
              disabled={simulationStatus === 'COMPLETED'}
              className="sim-btn text-accent disabled:opacity-40"
              aria-label="Play"
            >
              <Play size={16} fill="currentColor" /> Play
            </button>
          )}
          <button
            onClick={step}
            disabled={simulationStatus === 'COMPLETED'}
            className="sim-btn disabled:opacity-40"
            aria-label="Step forward"
          >
            <SkipForward size={16} /> Step
          </button>
          <button onClick={handleReset} className="sim-btn" aria-label="Reset">
            <RotateCcw size={16} /> Reset
          </button>
        </div>

        <div className="flex items-center gap-1 ml-4">
          <span className="text-xs text-sim-muted mr-1">Speed:</span>
          {speeds.map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`px-2 py-0.5 text-xs font-mono rounded transition-colors ${
                simulationSpeed === s
                  ? 'bg-accent text-white'
                  : 'text-sim-muted hover:text-sim-text hover:bg-sim-surface'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>

        {simulationStatus === 'COMPLETED' && (
          <span className="ml-auto text-xs font-semibold text-green-400 flex items-center gap-1">
            <Activity size={14} />
            Simulation Complete
          </span>
        )}
      </div>

      <style jsx>{`
        .sim-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          font-size: 12px;
          font-weight: 500;
          color: #F9FAFB;
          border: 1px solid #374151;
          border-radius: 4px;
          background: #1F2937;
          transition: background 0.15s;
        }
        .sim-btn:hover {
          background: #374151;
        }
      `}</style>
    </div>
  );
}

// ==================== CPU Panel ====================

function CpuPanel() {
  const { currentProcess, processStates, remainingTimes, processes } = useSimulationStore();

  const proc = currentProcess
    ? processes.find((p) => p.pid === currentProcess)
    : null;

  return (
    <div className="rounded-md border border-sim-border bg-sim-surface overflow-hidden">
      <div className="px-3 py-2 border-b border-sim-border flex items-center gap-1.5 bg-sim-bg-deep">
        <Cpu size={14} className="text-accent" />
        <span className="text-xs font-semibold text-sim-text uppercase tracking-wider">CPU</span>
      </div>
      <div className="p-4">
        {currentProcess && proc ? (
          <motion.div
            key={currentProcess}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div
              className="inline-flex items-center justify-center w-16 h-16 rounded-lg text-white font-mono font-bold text-lg mb-2"
              style={{ backgroundColor: getProcessColor(currentProcess) }}
            >
              {currentProcess}
            </div>
            <p className="text-xs text-green-400 font-semibold mb-2">RUNNING</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-sim-bg-deep rounded px-2 py-1.5">
                <p className="text-sim-muted text-[10px]">Remaining</p>
                <p className="font-mono font-bold text-sim-text">
                  {remainingTimes[currentProcess]}
                </p>
              </div>
              <div className="bg-sim-bg-deep rounded px-2 py-1.5">
                <p className="text-sim-muted text-[10px]">Burst</p>
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

// ==================== Ready Queue ====================

function ReadyQueuePanel() {
  const { readyQueue, remainingTimes, processes } = useSimulationStore();

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
        {readyQueue.length === 0 ? (
          <p className="text-xs text-sim-muted text-center py-3">Empty</p>
        ) : (
          <div className="space-y-1.5">
            <AnimatePresence>
              {readyQueue.map((pid, idx) => {
                const proc = processes.find((p) => p.pid === pid);
                return (
                  <motion.div
                    key={pid}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
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

// ==================== Scheduler Decision ====================

function SchedulerDecisionPanel() {
  const { schedulerDecision } = useSimulationStore();

  return (
    <div className="rounded-md border border-sim-border bg-sim-surface overflow-hidden">
      <div className="px-3 py-2 border-b border-sim-border bg-sim-bg-deep flex items-center gap-1.5">
        <Info size={13} className="text-blue-400" />
        <span className="text-xs font-semibold text-sim-text uppercase tracking-wider">Scheduler Decision</span>
      </div>
      <div className="p-3">
        {schedulerDecision ? (
          <p className="text-xs text-sim-muted leading-relaxed">
            <span className="font-mono font-bold text-sim-text">{schedulerDecision.pid}</span>{' '}
            — {schedulerDecision.reason}
          </p>
        ) : (
          <p className="text-xs text-sim-muted">No decision yet. Start the simulation.</p>
        )}
      </div>
    </div>
  );
}

// ==================== Process States ====================

function ProcessStatesPanel() {
  const { processes, processStates, selectProcess, selectedProcess } = useSimulationStore();

  return (
    <div className="rounded-md border border-sim-border bg-sim-surface overflow-hidden h-full">
      <div className="px-3 py-2 border-b border-sim-border bg-sim-bg-deep flex items-center gap-1.5">
        <Zap size={13} className="text-yellow-400" />
        <span className="text-xs font-semibold text-sim-text uppercase tracking-wider">Process States</span>
      </div>
      <div className="p-3 space-y-1.5">
        {processes.map((proc) => {
          const status = processStates[proc.pid] || 'NEW';
          const colors = STATUS_COLORS[status];
          const isSelected = selectedProcess === proc.pid;
          return (
            <motion.button
              key={proc.pid}
              onClick={() => selectProcess(isSelected ? null : proc.pid)}
              className={`w-full flex items-center justify-between p-2.5 rounded border transition-colors text-left ${
                isSelected
                  ? 'border-accent bg-accent/10'
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
                className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
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

  if (!selectedProcess) {
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
  const { gantt, currentTime } = useSimulationStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
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
          <div ref={scrollRef} className="overflow-x-auto pb-2">
            <div style={{ minWidth: maxTime * UNIT + 20 }}>
              {/* Blocks */}
              <div className="flex h-10">
                {gantt.map((seg, i) => {
                  const width = (seg.end - seg.start) * UNIT;
                  const isActive = currentTime >= seg.start && currentTime < seg.end;
                  return (
                    <div
                      key={i}
                      className={`h-full flex items-center justify-center border-r border-sim-bg-deep text-[10px] font-mono font-bold shrink-0 relative ${
                        seg.pid
                          ? 'text-white'
                          : 'text-sim-muted bg-sim-bg-deep border-dashed border-sim-border'
                      }`}
                      style={{
                        width,
                        backgroundColor: seg.pid ? getProcessColor(seg.pid) : undefined,
                        opacity: isActive ? 1 : 0.75,
                      }}
                      title={seg.pid ? `${seg.pid}: ${seg.start}–${seg.end}` : `IDLE: ${seg.start}–${seg.end}`}
                    >
                      {seg.pid || 'IDLE'}
                      {isActive && (
                        <div className="absolute top-0 right-0 w-0.5 h-full bg-white/80 animate-pulse" />
                      )}
                    </div>
                  );
                })}
              </div>
              {/* Time scale */}
              <div className="flex">
                {gantt.map((seg, i) => {
                  const width = (seg.end - seg.start) * UNIT;
                  return (
                    <div
                      key={i}
                      className="text-[9px] font-mono text-sim-muted shrink-0 border-r border-sim-border pt-1"
                      style={{ width }}
                    >
                      {seg.start}
                    </div>
                  );
                })}
                {gantt.length > 0 && (
                  <span className="text-[9px] font-mono text-sim-muted pt-1">
                    {gantt[gantt.length - 1].end}
                  </span>
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
      case 'ARRIVAL': return 'text-blue-400';
      case 'SCHEDULED': return 'text-green-400';
      case 'COMPLETED': return 'text-emerald-300';
      case 'PREEMPTED': return 'text-amber-400';
      case 'QUANTUM_EXPIRED': return 'text-yellow-400';
      case 'IDLE': return 'text-sim-muted';
      default: return 'text-sim-muted';
    }
  };

  return (
    <div className="rounded-md border border-sim-border bg-sim-surface overflow-hidden">
      <div className="px-3 py-2 border-b border-sim-border bg-sim-bg-deep flex items-center justify-between">
        <span className="text-xs font-semibold text-sim-text uppercase tracking-wider">Event Log</span>
        <span className="text-[10px] font-mono text-sim-muted">{events.length} events</span>
      </div>
      <div ref={logRef} className="p-3 max-h-52 overflow-y-auto space-y-0.5">
        {events.length === 0 ? (
          <p className="text-xs text-sim-muted text-center py-4">Events will appear as the simulation runs.</p>
        ) : (
          events.map((ev, i) => (
            <div key={i} className="flex items-start gap-2 text-xs py-0.5">
              <span className="font-mono text-sim-muted shrink-0 w-10 text-right">
                {String(ev.time).padStart(2, '0')}:00
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
