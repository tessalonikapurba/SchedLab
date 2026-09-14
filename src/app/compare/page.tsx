'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Scale,
  Clock,
  TrendingUp,
  Play,
  Sliders,
  BarChart3,
  Layers,
  Sparkles,
  Repeat,
  Gauge,
} from 'lucide-react';

import { useComparisonStore } from '@/store/comparison';
import { useSimulationStore } from '@/store/simulation';
import { PRESET_SCENARIOS, ALGORITHM_METADATA } from '@/lib/constants';
import { generateRecommendation } from '@/lib/recommendation';
import type { AlgorithmType, PriorityDirection } from '@/lib/types';

export default function ComparePage() {
  const router = useRouter();
  const {
    workload,
    entries,
    priorityDirection,
    timeQuantum,
    agingInterval,
    isComputed,
    setWorkload,
    setPriorityDirection,
    setTimeQuantum,
    setAgingInterval: setCompAging,
    runComparison,
  } = useComparisonStore();

  const { setProcesses, setAlgorithm, setQuantum, setPriorityDirection: setSimPriority, setAgingInterval, initializeSimulation } =
    useSimulationStore();

  const [activeMetric, setActiveMetric] = useState<'waiting' | 'turnaround' | 'response' | 'switches' | 'fairness' | 'queue'>('waiting');

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

  const handleAgingChange = (newAging: number) => {
    setCompAging(newAging);
    setTimeout(() => {
      runComparison();
    }, 50);
  };

  const handleRunInSimulator = (algo: AlgorithmType) => {
    setProcesses(workload);
    setAlgorithm(algo);
    setQuantum(timeQuantum);
    setSimPriority(priorityDirection);
    setAgingInterval(agingInterval);
    initializeSimulation();
    router.push('/simulator/live');
  };

  // Recommendation engine evaluation
  const recommendation = generateRecommendation(workload, 'FCFS');

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

  const bestFairness = entries.length
    ? entries.reduce((max, e) =>
        e.result.metrics.fairnessIndex > max.result.metrics.fairnessIndex ? e : max
      )
    : null;

  const lowestSwitches = entries.length
    ? entries.reduce((min, e) =>
        e.result.metrics.contextSwitches < min.result.metrics.contextSwitches ? e : min
      )
    : null;

  // Max values for relative bar chart scaling
  const maxWait = Math.max(...entries.map((e) => e.result.metrics.avgWaitingTime), 1);
  const maxTAT = Math.max(...entries.map((e) => e.result.metrics.avgTurnaroundTime), 1);
  const maxResp = Math.max(...entries.map((e) => e.result.metrics.avgResponseTime), 1);
  const maxSwitches = Math.max(...entries.map((e) => e.result.metrics.contextSwitches), 1);
  const maxQueue = Math.max(...entries.map((e) => e.result.metrics.avgQueueLength), 1);

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
              <span className="text-xs text-muted">{entries.length || 7} Algorithms Evaluated</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
              <Scale size={28} className="text-accent" />
              Algorithm Comparison Matrix
            </h1>
            <p className="text-sm text-muted mt-1">
              Benchmark FCFS, SJF, SRTF, Priority, Round Robin, MLFQ, and Priority with Aging on identical workload inputs under controlled conditions.
            </p>
          </div>

          {/* Preset scenarios bar */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted">Presets:</span>
            {PRESET_SCENARIOS.slice(0, 5).map((p) => (
              <button
                key={p.name}
                onClick={() => handleSelectPreset(p.name)}
                className="px-2.5 py-1 text-xs rounded border border-border bg-surface-alt hover:bg-surface-elevated text-foreground transition-colors"
              >
                {p.name.split(' (')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* ==================== RECOMMENDATION ENGINE SUMMARY BANNER ==================== */}
        <div className="p-4 rounded-xl bg-surface-alt border border-accent/40 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-accent/20 text-accent">
                <Sparkles size={16} />
              </span>
              <span className="text-[10px] uppercase font-bold text-accent tracking-wider">
                Automated Workload Diagnosis
              </span>
            </div>
            <h3 className="text-sm font-bold text-foreground">{recommendation.headline}</h3>
            <p className="text-xs text-muted max-w-3xl leading-relaxed">
              {recommendation.workloadInsight}
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <button
              onClick={() => handleRunInSimulator(recommendation.primaryAlgorithm)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-accent hover:bg-accent-hover rounded-md transition-colors"
            >
              Simulate {recommendation.primaryAlgorithm}
              <Play size={12} fill="currentColor" />
            </button>
          </div>
        </div>

        {/* Global Parameter Controls Bar */}
        <div className="p-4 rounded-xl bg-surface-alt border border-border flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sliders size={18} className="text-accent" />
            <span className="text-xs font-bold text-foreground uppercase tracking-wider">Algorithm Hyperparameters:</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-muted">Round Robin / MLFQ Quantum (Q):</span>
              <input
                type="number"
                min={1}
                max={20}
                value={timeQuantum}
                onChange={(e) => handleQuantumChange(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 px-2 py-1 border border-border rounded bg-surface font-mono text-center font-bold text-foreground focus:border-accent focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-muted">Priority Direction:</span>
              <select
                value={priorityDirection}
                onChange={(e) => handlePriorityDirChange(e.target.value as PriorityDirection)}
                className="px-2 py-1 border border-border rounded bg-surface font-semibold text-foreground focus:border-accent focus:outline-none"
              >
                <option value="lower">Lower number = Higher</option>
                <option value="higher">Higher number = Higher</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-muted">Aging Interval:</span>
              <input
                type="number"
                min={1}
                max={20}
                value={agingInterval}
                onChange={(e) => handleAgingChange(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 px-2 py-1 border border-border rounded bg-surface font-mono text-center font-bold text-foreground focus:border-accent focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Best in Class Highlights Cards */}
        {entries.length > 0 && bestWaiting && bestTurnaround && bestResponse && bestFairness && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20 text-amber-500 shrink-0">
                <Clock size={18} />
              </div>
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-500">
                  Lowest Waiting Time
                </span>
                <div className="text-base font-bold text-foreground">
                  {bestWaiting.algorithm} — <span className="font-mono text-amber-500">{bestWaiting.result.metrics.avgWaitingTime.toFixed(2)}u</span>
                </div>
                <p className="text-[10px] text-muted mt-0.5">Minimizes ready queue delays.</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20 text-blue-500 shrink-0">
                <TrendingUp size={18} />
              </div>
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-500">
                  Shortest Turnaround
                </span>
                <div className="text-base font-bold text-foreground">
                  {bestTurnaround.algorithm} — <span className="font-mono text-blue-500">{bestTurnaround.result.metrics.avgTurnaroundTime.toFixed(2)}u</span>
                </div>
                <p className="text-[10px] text-muted mt-0.5">Optimal overall completion speed.</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-500 shrink-0">
                <Gauge size={18} />
              </div>
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-500">
                  Highest Fairness
                </span>
                <div className="text-base font-bold text-foreground">
                  {bestFairness.algorithm} — <span className="font-mono text-emerald-500">{bestFairness.result.metrics.fairnessIndex.toFixed(3)}</span>
                </div>
                <p className="text-[10px] text-muted mt-0.5">Best anti-starvation balance.</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20 text-purple-500 shrink-0">
                <Repeat size={18} />
              </div>
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-500">
                  Lowest Overhead
                </span>
                <div className="text-base font-bold text-foreground">
                  {lowestSwitches?.algorithm} — <span className="font-mono text-purple-500">{lowestSwitches?.result.metrics.contextSwitches} switches</span>
                </div>
                <p className="text-[10px] text-muted mt-0.5">Minimal CPU context swaps.</p>
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
            <span className="text-xs text-muted">{entries.length} algorithms evaluated</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface text-muted">
                  <th className="py-3 px-4 font-semibold">Algorithm</th>
                  <th className="py-3 px-4 font-semibold font-mono text-amber-500">Avg Waiting (WT)</th>
                  <th className="py-3 px-4 font-semibold font-mono text-blue-500">Avg Turnaround (TAT)</th>
                  <th className="py-3 px-4 font-semibold font-mono text-teal-500">Avg Response (RT)</th>
                  <th className="py-3 px-4 font-semibold font-mono text-purple-500">Context Switches</th>
                  <th className="py-3 px-4 font-semibold font-mono text-emerald-500">Fairness Index</th>
                  <th className="py-3 px-4 font-semibold font-mono text-red-500">Starvation Risk</th>
                  <th className="py-3 px-4 font-semibold text-right">Simulate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {entries.map(({ algorithm, result }) => {
                  const isMinWait = bestWaiting && result.metrics.avgWaitingTime === bestWaiting.result.metrics.avgWaitingTime;
                  const isMinTAT = bestTurnaround && result.metrics.avgTurnaroundTime === bestTurnaround.result.metrics.avgTurnaroundTime;
                  const isMinResp = bestResponse && result.metrics.avgResponseTime === bestResponse.result.metrics.avgResponseTime;
                  const isMaxFairness = bestFairness && result.metrics.fairnessIndex === bestFairness.result.metrics.fairnessIndex;

                  return (
                    <tr key={algorithm} className="hover:bg-surface-elevated/40 transition-colors">
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
                          {algorithm === 'MLFQ' && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface border border-border text-muted font-mono">
                              q0={timeQuantum}
                            </span>
                          )}
                          {algorithm === 'PRIORITY_AGING' && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface border border-border text-muted font-mono">
                              aging={agingInterval}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-muted">
                          {ALGORITHM_METADATA[algorithm]?.preemptive ? 'Preemptive' : 'Non-preemptive'}
                        </span>
                      </td>

                      {/* Waiting */}
                      <td className="py-3 px-4 font-mono font-medium">
                        <div className="flex items-center gap-1.5">
                          <span className={isMinWait ? 'text-amber-500 font-bold' : 'text-foreground'}>
                            {result.metrics.avgWaitingTime.toFixed(2)}
                          </span>
                          {isMinWait && (
                            <span className="text-[9px] px-1 rounded bg-amber-500/20 text-amber-600 font-sans uppercase font-bold">
                              Best
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Turnaround */}
                      <td className="py-3 px-4 font-mono font-medium">
                        <div className="flex items-center gap-1.5">
                          <span className={isMinTAT ? 'text-blue-500 font-bold' : 'text-foreground'}>
                            {result.metrics.avgTurnaroundTime.toFixed(2)}
                          </span>
                          {isMinTAT && (
                            <span className="text-[9px] px-1 rounded bg-blue-500/20 text-blue-600 font-sans uppercase font-bold">
                              Best
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Response */}
                      <td className="py-3 px-4 font-mono font-medium">
                        <div className="flex items-center gap-1.5">
                          <span className={isMinResp ? 'text-teal-500 font-bold' : 'text-foreground'}>
                            {result.metrics.avgResponseTime.toFixed(2)}
                          </span>
                          {isMinResp && (
                            <span className="text-[9px] px-1 rounded bg-teal-500/20 text-teal-600 font-sans uppercase font-bold">
                              Best
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Context Switches */}
                      <td className="py-3 px-4 font-mono font-medium text-foreground">
                        {result.metrics.contextSwitches}
                      </td>

                      {/* Fairness Index */}
                      <td className="py-3 px-4 font-mono font-medium">
                        <div className="flex items-center gap-1.5">
                          <span className={isMaxFairness ? 'text-emerald-600 font-bold' : 'text-foreground'}>
                            {result.metrics.fairnessIndex.toFixed(3)}
                          </span>
                          {isMaxFairness && (
                            <span className="text-[9px] px-1 rounded bg-emerald-500/20 text-emerald-700 font-sans uppercase font-bold">
                              Max
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Starvation Risk */}
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                            result.metrics.starvationRisk === 'None'
                              ? 'bg-emerald-500/15 text-emerald-700'
                              : result.metrics.starvationRisk === 'Low'
                              ? 'bg-blue-500/15 text-blue-700'
                              : result.metrics.starvationRisk === 'Moderate'
                              ? 'bg-amber-500/15 text-amber-700'
                              : 'bg-red-500/15 text-red-700'
                          }`}
                        >
                          {result.metrics.starvationRisk}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleRunInSimulator(algorithm)}
                          className="px-2.5 py-1 text-xs font-semibold rounded bg-accent/10 text-accent hover:bg-accent hover:text-white transition-colors"
                        >
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
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <BarChart3 size={16} className="text-accent" />
              Comparative Metric Visualizer
            </h2>

            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-surface rounded-lg border border-border">
              {(
                [
                  { id: 'waiting', label: 'Waiting Time' },
                  { id: 'turnaround', label: 'Turnaround Time' },
                  { id: 'response', label: 'Response Time' },
                  { id: 'switches', label: 'Context Switches' },
                  { id: 'fairness', label: "Fairness Index" },
                  { id: 'queue', label: 'Queue Length' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveMetric(tab.id)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                    activeMetric === tab.id
                      ? 'bg-accent text-white shadow-xs'
                      : 'text-muted hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2.5 pt-2">
            {entries.map(({ algorithm, result }) => {
              let val = 0;
              let max = 1;
              let color = 'bg-accent';

              if (activeMetric === 'waiting') {
                val = result.metrics.avgWaitingTime;
                max = maxWait;
                color = 'bg-amber-500';
              } else if (activeMetric === 'turnaround') {
                val = result.metrics.avgTurnaroundTime;
                max = maxTAT;
                color = 'bg-blue-500';
              } else if (activeMetric === 'response') {
                val = result.metrics.avgResponseTime;
                max = maxResp;
                color = 'bg-teal-500';
              } else if (activeMetric === 'switches') {
                val = result.metrics.contextSwitches;
                max = maxSwitches;
                color = 'bg-purple-500';
              } else if (activeMetric === 'fairness') {
                val = result.metrics.fairnessIndex;
                max = 1.0;
                color = 'bg-emerald-500';
              } else if (activeMetric === 'queue') {
                val = result.metrics.avgQueueLength;
                max = maxQueue;
                color = 'bg-indigo-500';
              }

              const pct = max > 0 ? (val / max) * 100 : 0;

              return (
                <div key={algorithm} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="font-bold text-foreground">{algorithm}</span>
                    <span className="text-muted">
                      {val.toFixed(2)} {activeMetric === 'fairness' ? '' : activeMetric === 'switches' ? 'switches' : 'units'}
                    </span>
                  </div>
                  <div className="h-4 rounded-md bg-surface border border-border overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.4 }}
                      className={`h-full rounded-md ${color}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
