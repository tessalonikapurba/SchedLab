'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Scale,
  Award,
  Clock,
  TrendingUp,
  Zap,
  Play,
  RotateCcw,
  Sliders,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Layers,
  Settings2,
} from 'lucide-react';
import { useComparisonStore } from '@/store/comparison';
import { useSimulationStore } from '@/store/simulation';
import { PRESET_SCENARIOS, ALGORITHM_METADATA } from '@/lib/constants';
import type { AlgorithmType, PriorityDirection } from '@/lib/types';

export default function ComparePage() {
  const router = useRouter();
  const {
    workload,
    entries,
    priorityDirection,
    timeQuantum,
    isComputed,
    setWorkload,
    setPriorityDirection,
    setTimeQuantum,
    runComparison,
  } = useComparisonStore();

  const { setProcesses, setAlgorithm, setQuantum, setPriorityDirection: setSimPriority, initializeSimulation } =
    useSimulationStore();

  const [activeMetric, setActiveMetric] = useState<'waiting' | 'turnaround' | 'response'>('waiting');

  // If no workload is set, default to Convoy Effect preset or standard preset
  useEffect(() => {
    if (workload.length === 0) {
      const preset = PRESET_SCENARIOS[1]; // Convoy effect highlights algorithmic contrast best
      setWorkload(preset.processes);
      setTimeout(() => {
        runComparison();
      }, 50);
    } else if (!isComputed) {
      runComparison();
    }
  }, [workload.length, isComputed, setWorkload, runComparison]);

  const handleSelectPreset = (scenarioName: string) => {
    const sc = PRESET_SCENARIOS.find((s) => s.name === scenarioName);
    if (sc) {
      setWorkload(sc.processes);
      setTimeout(() => {
        runComparison();
      }, 50);
    }
  };

  const handleQuantumChange = (newQ: number) => {
    setTimeQuantum(newQ);
    setTimeout(() => {
      runComparison();
    }, 50);
  };

  const handlePriorityDirChange = (newDir: PriorityDirection) => {
    setPriorityDirection(newDir);
    setTimeout(() => {
      runComparison();
    }, 50);
  };

  const handleRunInSimulator = (algo: AlgorithmType) => {
    setProcesses(workload);
    setAlgorithm(algo);
    setQuantum(timeQuantum);
    setSimPriority(priorityDirection);
    initializeSimulation();
    router.push('/simulator/live');
  };

  // Compute best algorithms
  const bestWaiting = entries.length
    ? entries.reduce((min, e) =>
        e.result.metrics.avgWaitingTime < min.result.metrics.avgWaitingTime ? e : min
      )
    : null;

  const bestTurnaround = entries.length
    ? entries.reduce((min, e) =>
        e.result.metrics.avgTurnaroundTime < min.result.metrics.avgTurnaroundTime ? e : min
      )
    : null;

  const bestResponse = entries.length
    ? entries.reduce((min, e) =>
        e.result.metrics.avgResponseTime < min.result.metrics.avgResponseTime ? e : min
      )
    : null;

  // Max values for relative bar chart scaling
  const maxWait = Math.max(...entries.map((e) => e.result.metrics.avgWaitingTime), 1);
  const maxTAT = Math.max(...entries.map((e) => e.result.metrics.avgTurnaroundTime), 1);
  const maxResp = Math.max(...entries.map((e) => e.result.metrics.avgResponseTime), 1);

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-surface text-foreground py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-accent/15 text-accent border border-accent/30">
                Benchmarking Laboratory
              </span>
              <span className="text-xs text-muted">5 Algorithms Evaluated</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
              <Scale size={28} className="text-accent" />
              Algorithm Comparison
            </h1>
            <p className="text-sm text-muted mt-1">
              Benchmark FCFS, SJF, SRTF, Priority, and Round Robin on identical workload inputs under controlled conditions.
            </p>
          </div>

          {/* Preset scenarios bar */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted">Presets:</span>
            {PRESET_SCENARIOS.slice(0, 4).map((p) => (
              <button
                key={p.name}
                onClick={() => handleSelectPreset(p.name)}
                className="px-2.5 py-1 text-xs rounded-md bg-surface-alt hover:bg-surface-elevated border border-border text-foreground transition-colors"
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Configuration Controls Bar */}
        <div className="p-4 rounded-xl bg-surface-alt border border-border flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-6">
            {/* Workload info */}
            <div className="text-xs">
              <span className="text-muted block">Current Workload:</span>
              <span className="font-semibold text-foreground">
                {workload.length} processes (PIDs:{' '}
                {workload.map((p) => p.pid).slice(0, 5).join(', ')}
                {workload.length > 5 ? '...' : ''})
              </span>
            </div>

            {/* RR Quantum config */}
            <div className="flex items-center gap-2 text-xs">
              <label htmlFor="quantum-input" className="text-muted font-medium">
                RR Quantum (q):
              </label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 6].map((q) => (
                  <button
                    key={q}
                    onClick={() => handleQuantumChange(q)}
                    className={`px-2 py-0.5 rounded text-xs font-mono transition-colors ${
                      timeQuantum === q
                        ? 'bg-accent text-white font-bold'
                        : 'bg-surface border border-border text-muted hover:text-foreground'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Priority direction */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted font-medium">Priority Order:</span>
              <button
                onClick={() =>
                  handlePriorityDirChange(priorityDirection === 'lower' ? 'higher' : 'lower')
                }
                className="px-2.5 py-1 rounded bg-surface border border-border text-foreground font-mono hover:bg-surface-elevated transition-colors"
              >
                {priorityDirection === 'lower' ? 'Lower # = High Priority' : 'Higher # = High Priority'}
              </button>
            </div>
          </div>

          <button
            onClick={() => router.push('/simulator/new')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-foreground bg-surface border border-border rounded-lg hover:bg-surface-elevated transition-colors"
          >
            <Sliders size={14} />
            Edit Workload
          </button>
        </div>

        {/* Winners Banner */}
        {bestWaiting && bestTurnaround && bestResponse && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                <Award size={20} />
              </div>
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">
                  Lowest Avg Waiting Time
                </span>
                <div className="text-lg font-bold text-foreground">
                  {bestWaiting.algorithm} —{' '}
                  <span className="font-mono text-amber-400">
                    {bestWaiting.result.metrics.avgWaitingTime.toFixed(2)}u
                  </span>
                </div>
                <p className="text-[11px] text-muted mt-0.5">
                  Minimizes time processes spend idling in ready state.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                <TrendingUp size={20} />
              </div>
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-400">
                  Lowest Avg Turnaround Time
                </span>
                <div className="text-lg font-bold text-foreground">
                  {bestTurnaround.algorithm} —{' '}
                  <span className="font-mono text-blue-400">
                    {bestTurnaround.result.metrics.avgTurnaroundTime.toFixed(2)}u
                  </span>
                </div>
                <p className="text-[11px] text-muted mt-0.5">
                  Completes jobs fastest from initial arrival.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                <Zap size={20} />
              </div>
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
                  Fastest First Response
                </span>
                <div className="text-lg font-bold text-foreground">
                  {bestResponse.algorithm} —{' '}
                  <span className="font-mono text-emerald-400">
                    {bestResponse.result.metrics.avgResponseTime.toFixed(2)}u
                  </span>
                </div>
                <p className="text-[11px] text-muted mt-0.5">
                  Best for interactive desktop & UI responsiveness.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Comparison Matrix Table */}
        <div className="p-5 rounded-xl bg-surface-alt border border-border space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Layers size={16} className="text-accent" />
              Scheduling Metric Comparison Matrix
            </h2>
            <span className="text-xs text-muted">All tests executed deterministically</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface text-muted">
                  <th className="py-3 px-4 font-semibold">Algorithm</th>
                  <th className="py-3 px-4 font-semibold font-mono text-amber-400">
                    Avg Waiting (WT)
                  </th>
                  <th className="py-3 px-4 font-semibold font-mono text-blue-400">
                    Avg Turnaround (TAT)
                  </th>
                  <th className="py-3 px-4 font-semibold font-mono text-emerald-400">
                    Avg Response (RT)
                  </th>
                  <th className="py-3 px-4 font-semibold font-mono">CPU Utilization</th>
                  <th className="py-3 px-4 font-semibold font-mono">Throughput</th>
                  <th className="py-3 px-4 font-semibold font-mono">Total Time</th>
                  <th className="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {entries.map(({ algorithm, result }) => {
                  const isMinWait =
                    bestWaiting &&
                    result.metrics.avgWaitingTime === bestWaiting.result.metrics.avgWaitingTime;
                  const isMinTAT =
                    bestTurnaround &&
                    result.metrics.avgTurnaroundTime ===
                      bestTurnaround.result.metrics.avgTurnaroundTime;
                  const isMinResp =
                    bestResponse &&
                    result.metrics.avgResponseTime === bestResponse.result.metrics.avgResponseTime;

                  return (
                    <tr
                      key={algorithm}
                      className="hover:bg-surface-elevated/40 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold font-mono text-foreground text-sm">
                            {algorithm}
                          </span>
                          {algorithm === 'RR' && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface border border-border text-muted font-mono">
                              q={timeQuantum}
                            </span>
                          )}
                          {algorithm === 'PRIORITY' && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface border border-border text-muted font-mono">
                              {priorityDirection === 'lower' ? 'low#' : 'high#'}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-muted">
                          {ALGORITHM_METADATA[algorithm].preemptive ? 'Preemptive' : 'Non-preemptive'}
                        </span>
                      </td>

                      {/* Waiting */}
                      <td className="py-3 px-4 font-mono font-medium">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={
                              isMinWait ? 'text-amber-400 font-bold' : 'text-foreground'
                            }
                          >
                            {result.metrics.avgWaitingTime.toFixed(2)}
                          </span>
                          {isMinWait && (
                            <span className="text-[9px] px-1 rounded bg-amber-500/20 text-amber-300 font-sans uppercase font-bold">
                              Best
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Turnaround */}
                      <td className="py-3 px-4 font-mono font-medium">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={
                              isMinTAT ? 'text-blue-400 font-bold' : 'text-foreground'
                            }
                          >
                            {result.metrics.avgTurnaroundTime.toFixed(2)}
                          </span>
                          {isMinTAT && (
                            <span className="text-[9px] px-1 rounded bg-blue-500/20 text-blue-300 font-sans uppercase font-bold">
                              Best
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Response */}
                      <td className="py-3 px-4 font-mono font-medium">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={
                              isMinResp ? 'text-emerald-400 font-bold' : 'text-foreground'
                            }
                          >
                            {result.metrics.avgResponseTime.toFixed(2)}
                          </span>
                          {isMinResp && (
                            <span className="text-[9px] px-1 rounded bg-emerald-500/20 text-emerald-300 font-sans uppercase font-bold">
                              Best
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Utilization */}
                      <td className="py-3 px-4 font-mono text-muted">
                        {result.metrics.cpuUtilization.toFixed(1)}%
                      </td>

                      {/* Throughput */}
                      <td className="py-3 px-4 font-mono text-muted">
                        {result.metrics.throughput.toFixed(3)}
                      </td>

                      {/* Total time */}
                      <td className="py-3 px-4 font-mono text-muted">
                        {result.totalTime} units
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleRunInSimulator(algorithm)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded bg-accent/15 hover:bg-accent text-accent hover:text-white font-medium transition-colors"
                        >
                          <Play size={11} fill="currentColor" />
                          Simulate
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Visual Benchmark Charts */}
        <div className="p-5 rounded-xl bg-surface-alt border border-border space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <BarChart3 size={16} className="text-accent" />
              Comparative Visual Benchmark
            </h2>

            {/* Metric Switcher */}
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-surface border border-border text-xs">
              <button
                onClick={() => setActiveMetric('waiting')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  activeMetric === 'waiting'
                    ? 'bg-accent text-white font-medium'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                Waiting Time
              </button>
              <button
                onClick={() => setActiveMetric('turnaround')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  activeMetric === 'turnaround'
                    ? 'bg-accent text-white font-medium'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                Turnaround Time
              </button>
              <button
                onClick={() => setActiveMetric('response')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  activeMetric === 'response'
                    ? 'bg-accent text-white font-medium'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                Response Time
              </button>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {entries.map(({ algorithm, result }) => {
              let val = 0;
              let max = 1;
              let colorClass = 'bg-accent';

              if (activeMetric === 'waiting') {
                val = result.metrics.avgWaitingTime;
                max = maxWait;
                colorClass = 'bg-amber-500';
              } else if (activeMetric === 'turnaround') {
                val = result.metrics.avgTurnaroundTime;
                max = maxTAT;
                colorClass = 'bg-blue-500';
              } else {
                val = result.metrics.avgResponseTime;
                max = maxResp;
                colorClass = 'bg-emerald-500';
              }

              const widthPct = Math.max((val / max) * 100, 3);

              return (
                <div key={algorithm} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="font-semibold text-foreground">{algorithm}</span>
                    <span className="text-muted">
                      {val.toFixed(2)} units
                    </span>
                  </div>
                  <div className="h-6 w-full rounded-md bg-surface overflow-hidden p-0.5 border border-border/60">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${widthPct}%` }}
                      transition={{ duration: 0.4 }}
                      className={`h-full rounded ${colorClass} flex items-center justify-end pr-2 text-[10px] font-bold text-white font-mono shadow-xs`}
                    >
                      {val > 0.5 ? val.toFixed(1) : ''}
                    </motion.div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stacked Mini-Gantt Visuals */}
        <div className="p-5 rounded-xl bg-surface-alt border border-border space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Clock size={16} className="text-accent" />
              Structural Execution Comparison (Stacked Gantt Timelines)
            </h2>
            <p className="text-xs text-muted mt-0.5">
              Notice how preemptive algorithms interleave execution blocks compared to non-preemptive algorithms.
            </p>
          </div>

          <div className="space-y-3 overflow-x-auto pb-2">
            <div className="min-w-[640px] space-y-3">
              {entries.map(({ algorithm, result }) => (
                <div key={algorithm} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-mono font-semibold text-foreground text-[11px]">
                      {algorithm}
                    </span>
                    <span className="text-muted font-mono text-[10px]">
                      Total: {result.totalTime} units
                    </span>
                  </div>
                  <div className="flex h-7 w-full rounded overflow-hidden border border-border/80 bg-surface">
                    {result.gantt.map((seg, idx) => {
                      const dur = seg.end - seg.start;
                      const pct = (dur / (result.totalTime || 1)) * 100;
                      const isIdle = seg.pid === 'IDLE';

                      return (
                        <div
                          key={idx}
                          style={{ width: `${pct}%` }}
                          className={`h-full flex items-center justify-center text-[10px] font-mono font-medium border-r border-background/20 truncate px-0.5 ${
                            isIdle
                              ? 'bg-slate-800 text-slate-400 italic'
                              : 'bg-accent/80 text-white'
                          }`}
                          title={`${seg.pid}: ${seg.start} → ${seg.end}`}
                        >
                          {seg.pid}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
