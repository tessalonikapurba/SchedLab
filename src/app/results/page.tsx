'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  Clock,
  Cpu,
  RotateCcw,
  Sliders,
  Scale,
  Download,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  TrendingUp,
  Award,
  Sparkles,
  Repeat,
  ShieldAlert,
  Gauge,
  Layers,
} from 'lucide-react';
import { useSimulationStore } from '@/store/simulation';
import { useComparisonStore } from '@/store/comparison';
import { PRESET_SCENARIOS } from '@/lib/constants';
import { generateRecommendation } from '@/lib/recommendation';
import type { AlgorithmType } from '@/lib/types';


export default function ResultsPage() {
  const router = useRouter();
  const {
    processes,
    selectedAlgorithm,
    timeQuantum,
    priorityDirection,
    agingInterval,
    simulationName,
    results,
    setProcesses,
    setAlgorithm,
    computeResults,
    initializeSimulation,
  } = useSimulationStore();

  const { setWorkload, setPriorityDirection, setTimeQuantum, setAgingInterval: setCompAging, runComparison } =
    useComparisonStore();

  const [activeTab, setActiveTab] = useState<'recommendation' | 'metrics' | 'formulas' | 'analysis'>('recommendation');

  // If no simulation results exist yet, initialize with standard preset
  useEffect(() => {
    if (!results || processes.length === 0) {
      const defaultPreset = PRESET_SCENARIOS[0];
      setProcesses(defaultPreset.processes);
      setAlgorithm('FCFS');
      setTimeout(() => {
        computeResults();
      }, 50);
    }
  }, [results, processes.length, setProcesses, setAlgorithm, computeResults]);

  const handleCompareClick = () => {
    if (processes.length > 0) {
      setWorkload(processes);
      setPriorityDirection(priorityDirection);
      setTimeQuantum(timeQuantum);
      setCompAging(agingInterval);
      runComparison();
      router.push('/compare');
    }
  };

  const handleApplyRecommendation = (algo: AlgorithmType) => {
    setAlgorithm(algo);
    initializeSimulation();
    router.push('/simulator/live');
  };

  const handleExportJSON = () => {
    if (!results) return;
    const exportData = {
      simulationName,
      algorithm: selectedAlgorithm,
      parameters: {
        timeQuantum: selectedAlgorithm === 'RR' || selectedAlgorithm === 'MLFQ' ? timeQuantum : undefined,
        priorityDirection: selectedAlgorithm === 'PRIORITY' || selectedAlgorithm === 'PRIORITY_AGING' ? priorityDirection : undefined,
        agingInterval: selectedAlgorithm === 'PRIORITY_AGING' ? agingInterval : undefined,
      },
      metrics: results.metrics,
      processes: results.processResults,
      gantt: results.gantt,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `schedlab-${selectedAlgorithm.toLowerCase()}-results.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    if (!results) return;
    const headers = [
      'PID',
      'Arrival Time',
      'Burst Time',
      'Priority',
      'First Start Time',
      'Completion Time',
      'Turnaround Time',
      'Waiting Time',
      'Response Time',
    ];
    const rows = results.processResults.map((p) => [
      p.pid,
      p.arrivalTime,
      p.burstTime,
      p.priority,
      p.firstStart,
      p.completionTime,
      p.turnaroundTime,
      p.waitingTime,
      p.responseTime,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
      '',
      'Metric,Value',
      `Average Waiting Time,${results.metrics.avgWaitingTime.toFixed(2)}`,
      `Average Turnaround Time,${results.metrics.avgTurnaroundTime.toFixed(2)}`,
      `Average Response Time,${results.metrics.avgResponseTime.toFixed(2)}`,
      `CPU Utilization,${results.metrics.cpuUtilization.toFixed(1)}%`,
      `Throughput,${results.metrics.throughput.toFixed(3)} processes/unit`,
      `Context Switches,${results.metrics.contextSwitches}`,
      `Fairness Index,${results.metrics.fairnessIndex.toFixed(3)}`,
      `Starvation Risk,${results.metrics.starvationRisk}`,
      `Average Queue Length,${results.metrics.avgQueueLength.toFixed(2)}`,
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `schedlab-${selectedAlgorithm.toLowerCase()}-results.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!results) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center bg-surface">
        <div className="text-center p-8">
          <div className="animate-spin text-accent mb-4 inline-block">
            <Clock size={36} />
          </div>
          <p className="text-muted text-sm">Calculating simulation results...</p>
        </div>
      </div>
    );
  }

  const { metrics, processResults: procResults, gantt } = results;
  const recommendation = generateRecommendation(processes, selectedAlgorithm, metrics);

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-surface text-foreground py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-accent/15 text-accent border border-accent/30">
                {selectedAlgorithm}
                {selectedAlgorithm === 'RR' && ` (q=${timeQuantum})`}
                {selectedAlgorithm === 'MLFQ' && ` (q0=${timeQuantum}, q1=${timeQuantum * 2})`}
                {selectedAlgorithm === 'PRIORITY_AGING' && ` (aging=${agingInterval})`}
                {selectedAlgorithm === 'PRIORITY' && ` (${priorityDirection} = high)`}
              </span>
              <span className="text-xs text-muted">Simulation Run Completed</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {simulationName || 'Simulation Results'}
            </h1>
            <p className="text-sm text-muted mt-1">
              Comprehensive performance metrics, schedule timeline, and intelligent algorithm recommendations.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                initializeSimulation();
                router.push('/simulator/live');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-foreground bg-surface-alt border border-border rounded-lg hover:bg-surface-elevated transition-colors"
            >
              <RotateCcw size={14} />
              Replay Live
            </button>
            <button
              onClick={() => router.push('/simulator/new')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-foreground bg-surface-alt border border-border rounded-lg hover:bg-surface-elevated transition-colors"
            >
              <Sliders size={14} />
              Modify Workload
            </button>
            <button
              onClick={handleCompareClick}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-accent hover:bg-accent-hover rounded-lg transition-colors shadow-sm"
            >
              <Scale size={14} />
              Compare All (7)
            </button>
            <div className="relative group">
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground bg-surface-alt border border-border rounded-lg transition-colors"
                title="Export data"
              >
                <Download size={14} />
                Export
              </button>
              <div className="absolute right-0 mt-1 w-32 bg-surface-elevated border border-border rounded-md shadow-lg hidden group-hover:block z-10 py-1">
                <button
                  onClick={handleExportCSV}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-surface-alt text-foreground"
                >
                  Export CSV
                </button>
                <button
                  onClick={handleExportJSON}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-surface-alt text-foreground"
                >
                  Export JSON
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ==================== 8 METRIC CARDS ==================== */}
        <div>
          <h2 className="text-xs font-bold text-muted uppercase tracking-wider mb-3">Simulation Performance Metrics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* 1. Avg Waiting Time */}
            <div className="p-4 rounded-xl bg-surface-alt border border-border shadow-xs">
              <div className="flex items-center justify-between text-xs text-muted mb-1">
                <span>Avg Waiting Time</span>
                <Clock size={16} className="text-amber-500" />
              </div>
              <div className="text-2xl font-bold font-mono text-foreground">
                {metrics.avgWaitingTime.toFixed(2)}
                <span className="text-xs font-normal text-muted ml-1">units</span>
              </div>
              <p className="text-[11px] text-muted mt-1">Average wait in Ready Queue</p>
            </div>

            {/* 2. Avg Turnaround Time */}
            <div className="p-4 rounded-xl bg-surface-alt border border-border shadow-xs">
              <div className="flex items-center justify-between text-xs text-muted mb-1">
                <span>Avg Turnaround Time</span>
                <TrendingUp size={16} className="text-blue-500" />
              </div>
              <div className="text-2xl font-bold font-mono text-foreground">
                {metrics.avgTurnaroundTime.toFixed(2)}
                <span className="text-xs font-normal text-muted ml-1">units</span>
              </div>
              <p className="text-[11px] text-muted mt-1">From arrival to completion</p>
            </div>

            {/* 3. Context Switches */}
            <div className="p-4 rounded-xl bg-surface-alt border border-border shadow-xs">
              <div className="flex items-center justify-between text-xs text-muted mb-1">
                <span>Context Switches</span>
                <Repeat size={16} className="text-purple-500" />
              </div>
              <div className="text-2xl font-bold font-mono text-foreground">
                {metrics.contextSwitches}
                <span className="text-xs font-normal text-muted ml-1">switches</span>
              </div>
              <p className="text-[11px] text-muted mt-1">CPU process-to-process handoffs</p>
            </div>

            {/* 4. Jain's Fairness Index */}
            <div className="p-4 rounded-xl bg-surface-alt border border-border shadow-xs">
              <div className="flex items-center justify-between text-xs text-muted mb-1">
                <span>Jain&apos;s Fairness Index</span>
                <Gauge size={16} className="text-emerald-500" />
              </div>
              <div className="text-2xl font-bold font-mono text-foreground flex items-baseline gap-2">
                {metrics.fairnessIndex.toFixed(3)}
                <span
                  className={`text-[10px] font-sans font-semibold px-1.5 py-0.5 rounded ${
                    metrics.fairnessIndex >= 0.9
                      ? 'bg-emerald-500/15 text-emerald-600'
                      : metrics.fairnessIndex >= 0.75
                      ? 'bg-amber-500/15 text-amber-600'
                      : 'bg-red-500/15 text-red-600'
                  }`}
                >
                  {metrics.fairnessIndex >= 0.9 ? 'High' : metrics.fairnessIndex >= 0.75 ? 'Moderate' : 'Unfair'}
                </span>
              </div>
              <p className="text-[11px] text-muted mt-1">1.000 = perfectly balanced service</p>
            </div>

            {/* 5. Avg Response Time */}
            <div className="p-4 rounded-xl bg-surface-alt border border-border shadow-xs">
              <div className="flex items-center justify-between text-xs text-muted mb-1">
                <span>Avg Response Time</span>
                <Award size={16} className="text-teal-500" />
              </div>
              <div className="text-2xl font-bold font-mono text-foreground">
                {metrics.avgResponseTime.toFixed(2)}
                <span className="text-xs font-normal text-muted ml-1">units</span>
              </div>
              <p className="text-[11px] text-muted mt-1">Arrival to first execution start</p>
            </div>

            {/* 6. CPU Utilization */}
            <div className="p-4 rounded-xl bg-surface-alt border border-border shadow-xs">
              <div className="flex items-center justify-between text-xs text-muted mb-1">
                <span>CPU Utilization</span>
                <Cpu size={16} className="text-accent" />
              </div>
              <div className="text-2xl font-bold font-mono text-foreground">
                {metrics.cpuUtilization.toFixed(1)}%
              </div>
              <p className="text-[11px] text-muted mt-1">Non-idle busy time ratio</p>
            </div>

            {/* 7. Starvation Risk */}
            <div className="p-4 rounded-xl bg-surface-alt border border-border shadow-xs">
              <div className="flex items-center justify-between text-xs text-muted mb-1">
                <span>Starvation Risk</span>
                <ShieldAlert size={16} className="text-red-500" />
              </div>
              <div className="text-xl font-bold font-mono text-foreground mt-0.5">
                <span
                  className={`inline-block px-2 py-0.5 rounded text-sm font-semibold ${
                    metrics.starvationRisk === 'None'
                      ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30'
                      : metrics.starvationRisk === 'Low'
                      ? 'bg-blue-500/15 text-blue-600 border border-blue-500/30'
                      : metrics.starvationRisk === 'Moderate'
                      ? 'bg-amber-500/15 text-amber-600 border border-amber-500/30'
                      : 'bg-red-500/15 text-red-600 border border-red-500/30'
                  }`}
                >
                  {metrics.starvationRisk}
                </span>
              </div>
              <p className="text-[11px] text-muted mt-1">Waiting skew & starvation exposure</p>
            </div>

            {/* 8. Avg Ready Queue Length */}
            <div className="p-4 rounded-xl bg-surface-alt border border-border shadow-xs">
              <div className="flex items-center justify-between text-xs text-muted mb-1">
                <span>Avg Queue Length</span>
                <Layers size={16} className="text-indigo-500" />
              </div>
              <div className="text-2xl font-bold font-mono text-foreground">
                {metrics.avgQueueLength.toFixed(2)}
                <span className="text-xs font-normal text-muted ml-1">procs</span>
              </div>
              <p className="text-[11px] text-muted mt-1">Little&apos;s Law time-average length</p>
            </div>

          </div>
        </div>

        {/* Schedule Gantt Chart View */}
        <div className="p-5 rounded-xl bg-surface-alt border border-border space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Schedule Timeline (Gantt Chart)</h2>
            <span className="text-xs font-mono text-muted">Total Duration: {results.totalTime} units</span>
          </div>

          <div className="overflow-x-auto pb-3">
            <div className="min-w-[600px]">
              {/* Gantt Bar */}
              <div className="flex h-12 w-full rounded-lg overflow-hidden border border-border">
                {gantt.map((seg, idx) => {
                  const duration = seg.end - seg.start;
                  const pct = (duration / (results.totalTime || 1)) * 100;
                  const isIdle = seg.pid === null;

                  return (
                    <div
                      key={idx}
                      style={{ width: `${pct}%` }}
                      className={`h-full flex flex-col items-center justify-center text-xs font-mono font-bold transition-all relative border-r border-background/20 last:border-0 ${
                        isIdle
                          ? 'bg-muted/20 text-muted border-dashed'
                          : 'text-white'
                      }`}
                      title={isIdle ? `IDLE (${duration}u)` : `${seg.pid} (${duration}u)`}
                    >
                      <span>{isIdle ? 'IDLE' : seg.pid}</span>
                      <span className="text-[9px] font-normal opacity-80">{duration}u</span>
                    </div>
                  );
                })}
              </div>

              {/* Ticks */}
              <div className="relative h-6 mt-1 flex text-[10px] font-mono text-muted">
                {gantt.map((seg, idx) => {
                  const duration = seg.end - seg.start;
                  const pct = (duration / (results.totalTime || 1)) * 100;
                  return (
                    <div
                      key={idx}
                      style={{ width: `${pct}%` }}
                      className="flex justify-between px-0.5 border-l border-border/40 last:border-r"
                    >
                      <span>{seg.start}</span>
                      {idx === gantt.length - 1 && <span>{seg.end}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Results Table */}
        <div className="p-5 rounded-xl bg-surface-alt border border-border space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Per-Process Performance Table</h2>
            <span className="text-xs text-muted">{procResults.length} processes evaluated</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface text-muted">
                  <th className="py-2.5 px-3 font-semibold">PID</th>
                  <th className="py-2.5 px-3 font-semibold font-mono">Arrival (AT)</th>
                  <th className="py-2.5 px-3 font-semibold font-mono">Burst (BT)</th>
                  <th className="py-2.5 px-3 font-semibold font-mono">Priority</th>
                  <th className="py-2.5 px-3 font-semibold font-mono">Start (ST)</th>
                  <th className="py-2.5 px-3 font-semibold font-mono">Completion (CT)</th>
                  <th className="py-2.5 px-3 font-semibold font-mono text-blue-400">Turnaround (TAT)</th>
                  <th className="py-2.5 px-3 font-semibold font-mono text-amber-400">Waiting (WT)</th>
                  <th className="py-2.5 px-3 font-semibold font-mono text-emerald-400">Response (RT)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {procResults.map((p) => (
                  <tr key={p.pid} className="hover:bg-surface-elevated/40 transition-colors">
                    <td className="py-2.5 px-3 font-semibold font-mono text-accent">{p.pid}</td>
                    <td className="py-2.5 px-3 font-mono text-muted">{p.arrivalTime}</td>
                    <td className="py-2.5 px-3 font-mono text-muted">{p.burstTime}</td>
                    <td className="py-2.5 px-3 font-mono text-muted">{p.priority}</td>
                    <td className="py-2.5 px-3 font-mono text-muted">{p.firstStart}</td>
                    <td className="py-2.5 px-3 font-mono text-foreground font-medium">
                      {p.completionTime}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-medium text-foreground">
                      {p.turnaroundTime}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-medium text-foreground">
                      {p.waitingTime}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-medium text-foreground">
                      {p.responseTime}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border bg-surface font-semibold">
                  <td colSpan={6} className="py-2.5 px-3 text-right text-muted">
                    Workload Average:
                  </td>
                  <td className="py-2.5 px-3 font-mono text-blue-400">
                    {metrics.avgTurnaroundTime.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-amber-400">
                    {metrics.avgWaitingTime.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-emerald-400">
                    {metrics.avgResponseTime.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* ==================== EDUCATIONAL SECTION & RECOMMENDATION ENGINE ==================== */}
        <div className="p-6 rounded-xl bg-surface-alt border border-border space-y-5">
          <div className="flex border-b border-border gap-4">
            <button
              onClick={() => setActiveTab('recommendation')}
              className={`pb-2.5 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'recommendation'
                  ? 'border-accent text-accent font-bold'
                  : 'border-transparent text-muted hover:text-foreground'
              }`}
            >
              <Sparkles size={14} />
              Recommendation Engine
            </button>
            <button
              onClick={() => setActiveTab('metrics')}
              className={`pb-2.5 text-xs font-medium border-b-2 transition-colors ${
                activeTab === 'metrics'
                  ? 'border-accent text-accent font-bold'
                  : 'border-transparent text-muted hover:text-foreground'
              }`}
            >
              Workload Behavior Insights
            </button>
            <button
              onClick={() => setActiveTab('formulas')}
              className={`pb-2.5 text-xs font-medium border-b-2 transition-colors ${
                activeTab === 'formulas'
                  ? 'border-accent text-accent font-bold'
                  : 'border-transparent text-muted hover:text-foreground'
              }`}
            >
              Formulas & Mathematical Proof
            </button>
            <button
              onClick={() => setActiveTab('analysis')}
              className={`pb-2.5 text-xs font-medium border-b-2 transition-colors ${
                activeTab === 'analysis'
                  ? 'border-accent text-accent font-bold'
                  : 'border-transparent text-muted hover:text-foreground'
              }`}
            >
              Algorithm Characteristics
            </button>
          </div>

          {/* TAB 1: RECOMMENDATION ENGINE */}
          {activeTab === 'recommendation' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-surface border border-accent/40 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-accent/15 text-accent">
                      <Sparkles size={18} />
                    </span>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-accent tracking-wider">
                        Educational Recommendation
                      </span>
                      <h3 className="text-base font-bold text-foreground">{recommendation.headline}</h3>
                    </div>
                  </div>

                  {recommendation.primaryAlgorithm !== selectedAlgorithm ? (
                    <button
                      onClick={() => handleApplyRecommendation(recommendation.primaryAlgorithm)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-accent hover:bg-accent-hover rounded-md transition-colors shrink-0"
                    >
                      Switch to {recommendation.primaryAlgorithm} & Simulate
                      <ArrowRight size={13} />
                    </button>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20 shrink-0">
                      <CheckCircle2 size={13} />
                      Current algorithm is optimal for this goal!
                    </span>
                  )}
                </div>

                <p className="text-xs text-foreground/90 leading-relaxed">
                  {recommendation.workloadInsight}
                </p>

                {/* Suitability Meters */}
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="p-2.5 rounded-lg bg-surface-alt border border-border">
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="font-semibold text-muted">Latency / Wait Optimization</span>
                      <span className="font-mono font-bold text-foreground">{recommendation.suitabilityScore.latency}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-border overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${recommendation.suitabilityScore.latency}%` }} />
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-surface-alt border border-border">
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="font-semibold text-muted">Fairness / Anti-Starvation</span>
                      <span className="font-mono font-bold text-foreground">{recommendation.suitabilityScore.fairness}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-border overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${recommendation.suitabilityScore.fairness}%` }} />
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-surface-alt border border-border">
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="font-semibold text-muted">Low Switching Overhead</span>
                      <span className="font-mono font-bold text-foreground">{recommendation.suitabilityScore.overhead}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-border overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full" style={{ width: `${recommendation.suitabilityScore.overhead}%` }} />
                    </div>
                  </div>
                </div>

                {/* Reasons and Trade-offs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <CheckCircle2 size={13} className="text-emerald-500" />
                      Key Reasons to Choose {recommendation.primaryAlgorithmName}
                    </h4>
                    <ul className="list-disc pl-4 text-xs text-muted space-y-1">
                      {recommendation.reasons.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <HelpCircle size={13} className="text-amber-500" />
                      Critical Trade-offs to Consider
                    </h4>
                    <ul className="list-disc pl-4 text-xs text-muted space-y-1">
                      {recommendation.tradeOffs.map((t, i) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Alternative Options */}
                {recommendation.alternativeOptions.length > 0 && (
                  <div className="pt-3 border-t border-border/80">
                    <h4 className="text-xs font-bold text-muted uppercase tracking-wider mb-2">
                      Alternative Algorithmic Perspectives:
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {recommendation.alternativeOptions.map((alt) => (
                        <div
                          key={alt.algorithm}
                          className="p-2.5 rounded-lg bg-surface-alt border border-border text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-foreground">{alt.name}</span>
                            <button
                              onClick={() => handleApplyRecommendation(alt.algorithm)}
                              className="text-[10px] text-accent hover:underline font-semibold"
                            >
                              Simulate
                            </button>
                          </div>
                          <p className="text-[11px] text-emerald-600 font-medium">{alt.pros}</p>
                          <p className="text-[10px] text-muted">{alt.cons}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: WORKLOAD BEHAVIOR INSIGHTS */}
          {activeTab === 'metrics' && (
            <div className="space-y-4 text-xs text-muted leading-relaxed">
              <div className="p-3.5 rounded-lg bg-surface border border-border">
                <h4 className="font-semibold text-foreground mb-1">Workload Execution Summary</h4>
                <p>
                  With <strong>{selectedAlgorithm}</strong>, processes completed across a total span of{' '}
                  <strong className="text-foreground">{results.totalTime} units</strong>. The CPU experienced{' '}
                  <strong className="text-foreground">{metrics.contextSwitches} context switches</strong>, while achieving a Jain&apos;s fairness index of{' '}
                  <strong className="text-foreground">{metrics.fairnessIndex.toFixed(3)}</strong> and an average ready queue length of{' '}
                  <strong className="text-foreground">{metrics.avgQueueLength.toFixed(2)} processes</strong>.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: FORMULAS & PROOFS */}
          {activeTab === 'formulas' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* TAT */}
              <div className="p-4 rounded-lg bg-surface border border-border space-y-2">
                <h4 className="font-semibold text-foreground">Turnaround Time (TAT)</h4>
                <div className="p-2.5 rounded bg-surface-alt font-mono text-accent text-sm">
                  TAT = Completion Time − Arrival Time
                </div>
                <p className="text-muted">
                  Total elapsed time spent by the process from initial arrival into the system until final termination.
                </p>
              </div>

              {/* WT */}
              <div className="p-4 rounded-lg bg-surface border border-border space-y-2">
                <h4 className="font-semibold text-foreground">Waiting Time (WT)</h4>
                <div className="p-2.5 rounded bg-surface-alt font-mono text-amber-500 text-sm">
                  WT = Turnaround Time − Burst Time
                </div>
                <p className="text-muted">
                  Cumulative duration spent by the process sitting inside the Ready Queue waiting for CPU scheduling.
                </p>
              </div>

              {/* Jain's Fairness Index */}
              <div className="p-4 rounded-lg bg-surface border border-border space-y-2">
                <h4 className="font-semibold text-foreground">Jain&apos;s Fairness Index (J)</h4>
                <div className="p-2.5 rounded bg-surface-alt font-mono text-emerald-500 text-xs">
                  J = (∑ xᵢ)² / (n · ∑ xᵢ²), &nbsp; where xᵢ = Burst / TAT
                </div>
                <p className="text-muted">
                  Measures whether processes receive a fair share of system resources proportional to their burst sizes. Bounded in [1/n, 1.0]. A value of 1.0 represents perfect egalitarian fairness.
                </p>
              </div>

              {/* Little's Law / Avg Queue Length */}
              <div className="p-4 rounded-lg bg-surface border border-border space-y-2">
                <h4 className="font-semibold text-foreground">Average Ready Queue Length (L_q)</h4>
                <div className="p-2.5 rounded bg-surface-alt font-mono text-indigo-500 text-sm">
                  L_q = (∑ Waiting Time) / Schedule Length
                </div>
                <p className="text-muted">
                  Direct application of Little&apos;s Law (L = λW). Gives the continuous time-weighted average number of jobs waiting in the ready queue.
                </p>
              </div>


              {/* Context Switches */}
              <div className="p-4 rounded-lg bg-surface border border-border space-y-2">
                <h4 className="font-semibold text-foreground">Context Switch Cost</h4>
                <div className="p-2.5 rounded bg-surface-alt font-mono text-purple-500 text-xs">
                  Switch = Process_B.start where Process_B ≠ Process_A
                </div>
                <p className="text-muted">
                  Every preemption or quantum exhaustion incurs context switching overhead: saving registers to the Process Control Block (PCB), cache line invalidation, and TLB flushes.
                </p>
              </div>

              {/* CPU Utilization */}
              <div className="p-4 rounded-lg bg-surface border border-border space-y-2">
                <h4 className="font-semibold text-foreground">CPU Utilization</h4>
                <div className="p-2.5 rounded bg-surface-alt font-mono text-blue-500 text-sm">
                  Utilization = (Busy Time / Total Time) × 100%
                </div>
                <p className="text-muted">
                  Ratio of total CPU executing time against idle gaps caused by process arrival delays.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: ALGORITHM CHARACTERISTICS */}
          {activeTab === 'analysis' && (
            <div className="space-y-4 text-xs text-muted leading-relaxed">
              <p>
                In operating systems, the scheduling dispatcher balances trade-offs between <strong>latency</strong>, <strong>throughput</strong>, and <strong>fairness</strong>. Algorithms with preemption (SRTF, RR, MLFQ) achieve superior responsiveness at the cost of elevated context switching overhead.
              </p>
              <div className="p-4 rounded-lg bg-surface border border-border flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-foreground">Benchmark all 7 algorithms on this exact workload</h4>
                  <p className="text-muted mt-0.5">
                    Compare FCFS, SJF, SRTF, Priority, Round Robin, MLFQ, and Priority with Aging side-by-side.
                  </p>
                </div>
                <button
                  onClick={handleCompareClick}
                  className="flex items-center gap-1 px-3.5 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg font-medium transition-colors shrink-0"
                >
                  Open Comparison
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
