'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Clock,
  Cpu,
  BarChart3,
  RotateCcw,
  Sliders,
  Scale,
  Download,
  Info,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  TrendingUp,
  Award,
} from 'lucide-react';
import { useSimulationStore } from '@/store/simulation';
import { useComparisonStore } from '@/store/comparison';
import { PRESET_SCENARIOS } from '@/lib/constants';

export default function ResultsPage() {
  const router = useRouter();
  const {
    processes,
    selectedAlgorithm,
    timeQuantum,
    priorityDirection,
    simulationName,
    results,
    setProcesses,
    setAlgorithm,
    computeResults,
    initializeSimulation,
  } = useSimulationStore();

  const { setWorkload, setPriorityDirection, setTimeQuantum, runComparison } =
    useComparisonStore();

  const [activeTab, setActiveTab] = useState<'metrics' | 'formulas' | 'analysis'>('metrics');

  // If no simulation results exist yet, initialize with the standard preset
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
      runComparison();
      router.push('/compare');
    }
  };

  const handleExportJSON = () => {
    if (!results) return;
    const exportData = {
      simulationName,
      algorithm: selectedAlgorithm,
      parameters: {
        timeQuantum: selectedAlgorithm === 'RR' ? timeQuantum : undefined,
        priorityDirection: selectedAlgorithm === 'PRIORITY' ? priorityDirection : undefined,
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

  // Contextual educational insights based on the workload
  const avgBurst =
    processes.length > 0
      ? processes.reduce((sum, p) => sum + p.burstTime, 0) / processes.length
      : 4;
  const isConvoyRisk =
    selectedAlgorithm === 'FCFS' &&
    processes.length > 2 &&
    processes[0].burstTime > avgBurst * 1.8;

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
                {selectedAlgorithm === 'PRIORITY' && ` (${priorityDirection} = high)`}
              </span>
              <span className="text-xs text-muted">Simulation Complete</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {simulationName || 'Simulation Results'}
            </h1>
            <p className="text-sm text-muted mt-1">
              Comprehensive performance metrics, schedule timeline, and educational analysis for {procResults.length} processes.
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
              Compare All (5)
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

        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-surface-alt border border-border shadow-xs"
          >
            <div className="flex items-center justify-between text-xs text-muted mb-1">
              <span>Avg Waiting Time</span>
              <Clock size={16} className="text-amber-500" />
            </div>
            <div className="text-2xl font-bold font-mono text-foreground">
              {metrics.avgWaitingTime.toFixed(2)}
              <span className="text-xs font-normal text-muted ml-1">units</span>
            </div>
            <p className="text-[11px] text-muted mt-1">Time spent sitting in Ready queue</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="p-4 rounded-xl bg-surface-alt border border-border shadow-xs"
          >
            <div className="flex items-center justify-between text-xs text-muted mb-1">
              <span>Avg Turnaround Time</span>
              <TrendingUp size={16} className="text-blue-500" />
            </div>
            <div className="text-2xl font-bold font-mono text-foreground">
              {metrics.avgTurnaroundTime.toFixed(2)}
              <span className="text-xs font-normal text-muted ml-1">units</span>
            </div>
            <p className="text-[11px] text-muted mt-1">From arrival to final completion</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-4 rounded-xl bg-surface-alt border border-border shadow-xs"
          >
            <div className="flex items-center justify-between text-xs text-muted mb-1">
              <span>Avg Response Time</span>
              <Award size={16} className="text-emerald-500" />
            </div>
            <div className="text-2xl font-bold font-mono text-foreground">
              {metrics.avgResponseTime.toFixed(2)}
              <span className="text-xs font-normal text-muted ml-1">units</span>
            </div>
            <p className="text-[11px] text-muted mt-1">From arrival until first CPU burst</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="p-4 rounded-xl bg-surface-alt border border-border shadow-xs"
          >
            <div className="flex items-center justify-between text-xs text-muted mb-1">
              <span>CPU Utilization</span>
              <Cpu size={16} className="text-accent" />
            </div>
            <div className="text-2xl font-bold font-mono text-foreground">
              {metrics.cpuUtilization.toFixed(1)}%
            </div>
            <p className="text-[11px] text-muted mt-1">
              {metrics.throughput.toFixed(3)} proc/unit • Total: {results.totalTime} units
            </p>
          </motion.div>
        </div>

        {/* Gantt Timeline Summary */}
        <div className="p-5 rounded-xl bg-surface-alt border border-border space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <BarChart3 size={16} className="text-accent" />
              Complete Execution Gantt Chart
            </h2>
            <span className="text-xs text-muted font-mono">0 → {results.totalTime} units</span>
          </div>

          <div className="overflow-x-auto pb-2">
            <div className="min-w-[640px]">
              {/* Blocks */}
              <div className="flex h-12 w-full rounded-lg overflow-hidden border border-border/80 bg-surface">
                {gantt.map((seg, idx) => {
                  const duration = seg.end - seg.start;
                  const pct = (duration / (results.totalTime || 1)) * 100;
                  const isIdle = seg.pid === 'IDLE';

                  return (
                    <div
                      key={idx}
                      style={{ width: `${pct}%` }}
                      className={`h-full flex flex-col items-center justify-center px-1 text-xs font-mono font-medium transition-all relative group border-r border-background/20 ${
                        isIdle
                          ? 'bg-slate-800/80 text-slate-400 italic'
                          : 'bg-accent/80 text-white hover:bg-accent'
                      }`}
                    >
                      <span className="truncate">{seg.pid}</span>
                      <span className="text-[10px] opacity-75">{duration}u</span>

                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center bg-gray-900 text-white text-[11px] px-2 py-1 rounded shadow-lg whitespace-nowrap z-20 pointer-events-none">
                        <span>
                          {seg.pid}: {seg.start} → {seg.end} ({duration} units)
                        </span>
                      </div>
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

        {/* Tabbed Educational Section: Analysis & Formulas */}
        <div className="p-6 rounded-xl bg-surface-alt border border-border space-y-5">
          <div className="flex border-b border-border gap-4">
            <button
              onClick={() => setActiveTab('metrics')}
              className={`pb-2.5 text-xs font-medium border-b-2 transition-colors ${
                activeTab === 'metrics'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-muted hover:text-foreground'
              }`}
            >
              Workload-Specific Analysis
            </button>
            <button
              onClick={() => setActiveTab('formulas')}
              className={`pb-2.5 text-xs font-medium border-b-2 transition-colors ${
                activeTab === 'formulas'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-muted hover:text-foreground'
              }`}
            >
              Formulas & Mathematical Proof
            </button>
            <button
              onClick={() => setActiveTab('analysis')}
              className={`pb-2.5 text-xs font-medium border-b-2 transition-colors ${
                activeTab === 'analysis'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-muted hover:text-foreground'
              }`}
            >
              Algorithm Characteristics
            </button>
          </div>

          {activeTab === 'metrics' && (
            <div className="space-y-4 text-xs text-muted leading-relaxed">
              <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-surface border border-border">
                <Info size={16} className="text-accent shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Workload Behavior Insight</h4>
                  <p>
                    With <strong>{selectedAlgorithm}</strong>, processes completed across a total span of{' '}
                    <strong className="text-foreground">{results.totalTime} units</strong>. The average process waited{' '}
                    <strong className="text-foreground">{metrics.avgWaitingTime.toFixed(2)} time units</strong> in the ready queue before or between bursts.
                  </p>
                  {isConvoyRisk && (
                    <p className="mt-2 text-amber-400">
                      <strong>Convoy Effect Detected:</strong> Process {processes[0].pid} has a burst of{' '}
                      {processes[0].burstTime} units and arrived first, delaying shorter subsequent processes. Notice how later processes experienced elevated waiting times.
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-lg bg-surface border border-border space-y-2">
                  <h5 className="font-semibold text-foreground flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-400" />
                    Observed Strengths
                  </h5>
                  <ul className="list-disc pl-4 space-y-1">
                    {selectedAlgorithm === 'FCFS' && (
                      <>
                        <li>Simple, deterministic FIFO order with zero scheduling overhead.</li>
                        <li>Completely starvation-free since every arriving process eventually runs.</li>
                      </>
                    )}
                    {selectedAlgorithm === 'SJF' && (
                      <>
                        <li>Achieves minimal total waiting time for non-preemptive workloads.</li>
                        <li>Shorter jobs finish fast, reducing overall queue buildup.</li>
                      </>
                    )}
                    {selectedAlgorithm === 'SRTF' && (
                      <>
                        <li>Preempts long jobs when short jobs arrive, ensuring optimal average turnaround.</li>
                        <li>Excellent response for interactive bursts.</li>
                      </>
                    )}
                    {selectedAlgorithm === 'RR' && (
                      <>
                        <li>Fair distribution of CPU time among all active processes.</li>
                        <li>Uniform response time bounded by (N - 1) × Quantum.</li>
                      </>
                    )}
                    {selectedAlgorithm === 'PRIORITY' && (
                      <>
                        <li>Enforces business/system priority criteria directly.</li>
                        <li>Urgent tasks receive expedited execution.</li>
                      </>
                    )}
                  </ul>
                </div>

                <div className="p-3.5 rounded-lg bg-surface border border-border space-y-2">
                  <h5 className="font-semibold text-foreground flex items-center gap-1.5">
                    <HelpCircle size={14} className="text-amber-400" />
                    Trade-offs & Considerations
                  </h5>
                  <ul className="list-disc pl-4 space-y-1">
                    {selectedAlgorithm === 'FCFS' && (
                      <>
                        <li>Susceptible to convoy effect if CPU-heavy jobs arrive first.</li>
                        <li>Average waiting time is often much worse than SJF.</li>
                      </>
                    )}
                    {selectedAlgorithm === 'SJF' && (
                      <>
                        <li>Requires prior knowledge or prediction of burst times in real OS kernels.</li>
                        <li>Risk of starvation for long bursts if short bursts arrive continuously.</li>
                      </>
                    )}
                    {selectedAlgorithm === 'SRTF' && (
                      <>
                        <li>Higher context switching overhead due to frequent preemption.</li>
                        <li>Starvation possible for large processes.</li>
                      </>
                    )}
                    {selectedAlgorithm === 'RR' && (
                      <>
                        <li>If quantum is too large, it degenerates into FCFS.</li>
                        <li>If quantum is too small, context switch overhead dominates.</li>
                      </>
                    )}
                    {selectedAlgorithm === 'PRIORITY' && (
                      <>
                        <li>Low priority processes can starve indefinitely without aging mechanisms.</li>
                        <li>Can lead to priority inversion if synchronized resources are held.</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'formulas' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-lg bg-surface border border-border space-y-2">
                <h4 className="font-semibold text-foreground">Turnaround Time (TAT)</h4>
                <div className="p-2.5 rounded bg-surface-alt font-mono text-accent text-sm">
                  TAT = Completion Time − Arrival Time
                </div>
                <p className="text-muted">
                  Measures total elapsed time spent by the process from initial submission until termination.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-surface border border-border space-y-2">
                <h4 className="font-semibold text-foreground">Waiting Time (WT)</h4>
                <div className="p-2.5 rounded bg-surface-alt font-mono text-amber-400 text-sm">
                  WT = Turnaround Time − Burst Time
                </div>
                <p className="text-muted">
                  Total duration spent sitting inside the Ready Queue waiting to be allocated CPU cycles.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-surface border border-border space-y-2">
                <h4 className="font-semibold text-foreground">Response Time (RT)</h4>
                <div className="p-2.5 rounded bg-surface-alt font-mono text-emerald-400 text-sm">
                  RT = First CPU Start Time − Arrival Time
                </div>
                <p className="text-muted">
                  Time taken from process arrival to the very first moment the CPU executes instructions for it.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-surface border border-border space-y-2">
                <h4 className="font-semibold text-foreground">CPU Utilization</h4>
                <div className="p-2.5 rounded bg-surface-alt font-mono text-blue-400 text-sm">
                  Utilization = (Total Busy Time / Schedule Length) × 100%
                </div>
                <p className="text-muted">
                  Percentage of total schedule duration where the CPU is actively executing user processes.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'analysis' && (
            <div className="space-y-4 text-xs text-muted leading-relaxed">
              <p>
                In classical operating systems, CPU scheduling is a core subsystem of the kernel dispatcher. The choice of scheduling algorithm involves navigating inherent trade-offs between <strong>responsiveness</strong>, <strong>fairness</strong>, <strong>throughput</strong>, and <strong>turnaround time</strong>.
              </p>
              <div className="p-4 rounded-lg bg-surface border border-border flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-foreground">Curious how this exact workload performs under other policies?</h4>
                  <p className="text-muted mt-0.5">
                    Benchmark FCFS, SJF, SRTF, Priority, and Round Robin side-by-side with charts.
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
