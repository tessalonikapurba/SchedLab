'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Shuffle,
  RotateCcw,
  Play,
  Trash2,
  Edit3,
  X,
  AlertCircle,
  Layers,
  Bookmark,
  Share2,
  History,
  Download,
  Upload,
  Check,
} from 'lucide-react';
import { useSimulationStore } from '@/store/simulation';
import type { ProcessConfig, PriorityDirection, SavedScenario } from '@/lib/types';
import { ALGORITHMS, PRESET_SCENARIOS } from '@/lib/constants';

import {
  saveScenario,
  getSavedScenarios,
  deleteSavedScenario,
  getSimulationHistory,
  clearSimulationHistory,
  encodeScenarioToUrl,
  decodeScenarioFromUrl,
  exportScenariosToJson,
  importScenariosFromJson,
} from '@/lib/scenarios';

export default function NewSimulationPage() {
  const router = useRouter();
  const {
    simulationName,
    setSimulationName,
    processes,
    setProcesses,
    addProcess,
    deleteProcess,
    updateProcess,
    selectedAlgorithm,
    setAlgorithm,
    timeQuantum,
    setQuantum,
    priorityDirection,
    setPriorityDirection,
    agingInterval,
    setAgingInterval,
    initializeSimulation,
  } = useSimulationStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPid, setEditingPid] = useState<string | null>(null);
  const [showPresets, setShowPresets] = useState(false);
  const [showSavedScenarios, setShowSavedScenarios] = useState(false);
  const [showRandomizer, setShowRandomizer] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);

  // Auto-decode scenario from URL query on initial load (?sc=...)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const encoded = params.get('sc');
      if (encoded) {
        const decoded = decodeScenarioFromUrl(encoded);
        if (decoded && decoded.processes && decoded.processes.length > 0) {
          setProcesses(decoded.processes);
          if (decoded.name) setSimulationName(decoded.name);
          if (decoded.algorithm) setAlgorithm(decoded.algorithm);
          if (decoded.timeQuantum) setQuantum(decoded.timeQuantum);
          if (decoded.priorityDirection) setPriorityDirection(decoded.priorityDirection);
          if (decoded.agingInterval) setAgingInterval(decoded.agingInterval);
        }
      }
    }
  }, [setProcesses, setSimulationName, setAlgorithm, setQuantum, setPriorityDirection, setAgingInterval]);

  const handleRunSimulation = () => {
    if (processes.length === 0) return;
    initializeSimulation();
    router.push('/simulator/live');
  };

  const handlePreset = (idx: number) => {
    const preset = PRESET_SCENARIOS[idx];
    setProcesses(preset.processes);
    setAlgorithm(preset.algorithm);
    if (preset.timeQuantum) setQuantum(preset.timeQuantum);
    if (preset.priorityDirection) setPriorityDirection(preset.priorityDirection);
    if (preset.agingInterval) setAgingInterval(preset.agingInterval);
    setSimulationName(preset.name);
    setShowPresets(false);
  };

  const handleSelectSavedScenario = (sc: SavedScenario) => {
    setProcesses(sc.processes);
    setAlgorithm(sc.algorithm);
    if (sc.timeQuantum) setQuantum(sc.timeQuantum);
    if (sc.priorityDirection) setPriorityDirection(sc.priorityDirection);
    if (sc.agingInterval) setAgingInterval(sc.agingInterval);
    setSimulationName(sc.name);
    setShowSavedScenarios(false);
  };

  const handleRandomize = (
    count: number,
    arrMin: number,
    arrMax: number,
    burstMin: number,
    burstMax: number,
    priMin: number,
    priMax: number
  ) => {
    const procs: ProcessConfig[] = [];
    for (let i = 1; i <= count; i++) {
      const pid = `P${String(i).padStart(2, '0')}`;
      procs.push({
        pid,
        arrivalTime: Math.floor(Math.random() * (arrMax - arrMin + 1)) + arrMin,
        burstTime: Math.floor(Math.random() * (burstMax - burstMin + 1)) + burstMin,
        priority: Math.floor(Math.random() * (priMax - priMin + 1)) + priMin,
      });
    }
    setProcesses(procs);
    setShowRandomizer(false);
  };

  const handleShareLink = () => {
    if (processes.length === 0) return;
    const encoded = encodeScenarioToUrl({
      name: simulationName,
      processes,
      algorithm: selectedAlgorithm,
      timeQuantum,
      priorityDirection,
      agingInterval,
    });

    const shareUrl = `${window.location.origin}/simulator/new?sc=${encoded}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2500);
    });
  };

  const handleSaveScenarioSubmit = () => {
    if (!saveName.trim() || processes.length === 0) return;
    saveScenario({
      name: saveName.trim(),
      processes,
      algorithm: selectedAlgorithm,
      timeQuantum,
      priorityDirection,
      agingInterval,
    });
    setShowSaveModal(false);
    setSaveName('');
    setShowSavedScenarios(true);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Toast Notification */}
      <AnimatePresence>
        {copiedToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-8 z-50 flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg shadow-xl text-xs font-semibold"
          >
            <Check size={16} />
            Shareable simulation link copied to clipboard!
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Simulation Lab Setup</h1>
          <p className="text-sm text-muted mt-0.5">
            Configure processes, tune algorithm parameters, and analyze scheduling behavior.
          </p>
        </div>

        {/* Top Actions: Share, History, Saved */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowSavedScenarios(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-foreground bg-surface border border-border rounded-md hover:bg-surface-alt transition-colors"
          >
            <Bookmark size={14} className="text-accent" />
            Saved Scenarios
          </button>
          <button
            onClick={() => setShowHistory(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted bg-surface border border-border rounded-md hover:bg-surface-alt transition-colors"
          >
            <History size={14} />
            History
          </button>
          <button
            onClick={handleShareLink}
            disabled={processes.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted bg-surface border border-border rounded-md hover:bg-surface-alt transition-colors disabled:opacity-40"
            title="Copy shareable link with workload to clipboard"
          >
            <Share2 size={14} />
            Share Link
          </button>
        </div>
      </div>

      {/* Simulation Name & Save */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="w-full max-w-md">
          <label htmlFor="sim-name" className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
            Scenario / Lab Name
          </label>
          <input
            id="sim-name"
            type="text"
            value={simulationName}
            onChange={(e) => setSimulationName(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface text-foreground focus:border-accent focus:outline-none"
            placeholder="Untitled Simulation"
          />
        </div>
        <div className="sm:pt-5">
          <button
            onClick={() => {
              setSaveName(simulationName);
              setShowSaveModal(true);
            }}
            disabled={processes.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-accent border border-accent/40 bg-accent/5 rounded-md hover:bg-accent/10 transition-colors disabled:opacity-40"
          >
            <Bookmark size={13} />
            Save to Library
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Process Table */}
        <div className="lg:col-span-2">
          <div className="border border-border rounded-md bg-surface overflow-hidden">
            <div className="flex flex-wrap items-center justify-between px-4 py-3 border-b border-border bg-surface-alt gap-2">
              <h2 className="text-sm font-semibold text-foreground">Process Table ({processes.length})</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPresets(true)}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-muted border border-border rounded-md hover:bg-background transition-colors"
                >
                  <Layers size={13} />
                  Presets
                </button>
                <button
                  onClick={() => setShowRandomizer(true)}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-muted border border-border rounded-md hover:bg-background transition-colors"
                >
                  <Shuffle size={13} />
                  Randomize
                </button>
                <button
                  onClick={() => setProcesses([])}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-muted border border-border rounded-md hover:bg-background transition-colors"
                >
                  <RotateCcw size={13} />
                  Clear
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm" id="process-table">
                <thead>
                  <tr className="border-b border-border bg-surface-alt/50">
                    <th className="text-left px-4 py-2 text-xs font-semibold text-muted uppercase tracking-wider">PID</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-muted uppercase tracking-wider">Arrival Time</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-muted uppercase tracking-wider">Burst Time</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-muted uppercase tracking-wider">Priority</th>
                    <th className="text-right px-4 py-2 text-xs font-semibold text-muted uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {processes.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted">
                        No processes configured yet. Add processes manually, pick a preset, or randomize.
                      </td>
                    </tr>
                  ) : (
                    processes.map((proc) => (
                      <tr key={proc.pid} className="hover:bg-surface-alt/40 transition-colors">
                        <td className="px-4 py-2.5 font-mono font-bold text-accent">{proc.pid}</td>
                        <td className="px-4 py-2.5 font-mono text-muted">{proc.arrivalTime}</td>
                        <td className="px-4 py-2.5 font-mono text-muted">{proc.burstTime}</td>
                        <td className="px-4 py-2.5 font-mono text-muted">{proc.priority}</td>
                        <td className="px-4 py-2.5 text-right space-x-1">
                          <button
                            onClick={() => {
                              setEditingPid(proc.pid);
                              setShowAddModal(true);
                            }}
                            className="p-1 text-muted hover:text-foreground rounded hover:bg-surface-alt"
                            title="Edit"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => deleteProcess(proc.pid)}
                            className="p-1 text-muted hover:text-error rounded hover:bg-surface-alt"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Add Process Button */}
            <div className="p-3 border-t border-border bg-surface-alt/30">
              <button
                onClick={() => {
                  setEditingPid(null);
                  setShowAddModal(true);
                }}
                className="flex items-center gap-1 text-xs font-semibold text-accent hover:text-accent-hover transition-colors"
              >
                <Plus size={14} />
                Add Process
              </button>
            </div>
          </div>
        </div>

        {/* Right: Algorithm Selector & Parameters */}
        <div className="space-y-4">
          <div className="border border-border rounded-md bg-surface overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-surface-alt flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Scheduling Algorithm</h2>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-accent/10 text-accent font-semibold">
                7 Available
              </span>
            </div>
            <div className="p-3 space-y-2 max-h-96 overflow-y-auto">
              {ALGORITHMS.map((algo) => (
                <label
                  key={algo.type}
                  className={`flex items-start gap-2.5 p-2.5 rounded-md cursor-pointer border transition-colors ${selectedAlgorithm === algo.type
                      ? 'border-accent/50 bg-accent/5'
                      : 'border-transparent hover:bg-surface-alt'
                    }`}
                >
                  <input
                    type="radio"
                    name="algorithm"
                    value={algo.type}
                    checked={selectedAlgorithm === algo.type}
                    onChange={() => setAlgorithm(algo.type)}
                    className="mt-0.5 text-info focus:ring-info accent-blue-600"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-foreground">{algo.shortName}</p>
                      {algo.educationalCategory === 'Advanced OS' && (
                        <span className="text-[9px] font-semibold px-1 py-0.2 rounded bg-amber-500/15 text-amber-600 border border-amber-500/30">
                          Advanced
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted leading-snug mt-0.5">{algo.description}</p>
                    <span className={`inline-block mt-1 text-[10px] font-medium px-1.5 py-0.5 rounded ${algo.preemptive ? 'bg-info-bg text-info' : 'bg-surface-alt text-muted'
                      }`}>
                      {algo.preemptive ? 'Preemptive' : 'Non-preemptive'}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Algorithm-Specific Tuning Parameters */}
          {(selectedAlgorithm === 'RR' || selectedAlgorithm === 'MLFQ') && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="border border-border rounded-md bg-surface p-4 space-y-2"
            >
              <label className="block text-xs font-semibold text-muted uppercase tracking-wide">
                {selectedAlgorithm === 'MLFQ' ? 'Q0 Time Quantum (Q1 = 2 × Q0)' : 'Time Quantum (Q)'}
              </label>
              <input
                type="number"
                min={1}
                value={timeQuantum}
                onChange={(e) => setQuantum(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface font-mono text-foreground focus:border-accent focus:outline-none"
              />
              <p className="text-[11px] text-muted">
                {selectedAlgorithm === 'MLFQ'
                  ? `Q0 runs at Q=${timeQuantum}, Q1 runs at Q=${timeQuantum * 2}, Q2 runs FCFS. Periodic boost every 20 units.`
                  : 'Shorter quantum improves responsiveness but increases context switching costs.'}
              </p>
            </motion.div>
          )}

          {(selectedAlgorithm === 'PRIORITY' || selectedAlgorithm === 'PRIORITY_AGING') && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="border border-border rounded-md bg-surface p-4 space-y-3"
            >
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
                  Priority Direction
                </label>
                <select
                  value={priorityDirection}
                  onChange={(e) => setPriorityDirection(e.target.value as PriorityDirection)}
                  className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface text-foreground focus:border-accent focus:outline-none"
                >
                  <option value="lower">Lower number = Higher priority (Unix style)</option>
                  <option value="higher">Higher number = Higher priority</option>
                </select>
              </div>

              {selectedAlgorithm === 'PRIORITY_AGING' && (
                <div>
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
                    Aging Interval (Time Units)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={agingInterval}
                    onChange={(e) => setAgingInterval(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface font-mono text-foreground focus:border-accent focus:outline-none"
                  />
                  <p className="text-[11px] text-muted mt-1">
                    Every {agingInterval} units of waiting without CPU access, process priority increments by 1.
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* Run Button */}
          <button
            onClick={handleRunSimulation}
            disabled={processes.length === 0}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-accent text-white font-semibold text-sm rounded-md hover:bg-accent-hover transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Play size={16} fill="currentColor" />
            Launch Live Simulation
          </button>
        </div>
      </div>

      {/* ==================== MODALS ==================== */}

      {/* Add/Edit Process Modal */}
      <AnimatePresence>
        {showAddModal && (
          <AddProcessModal
            processes={processes}
            editingPid={editingPid}
            onClose={() => {
              setShowAddModal(false);
              setEditingPid(null);
            }}
            onAdd={(p) => {
              addProcess(p);
              setShowAddModal(false);
            }}
            onUpdate={(pid, p) => {
              updateProcess(pid, p);
              setShowAddModal(false);
              setEditingPid(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Presets Modal */}
      <AnimatePresence>
        {showPresets && (
          <PresetsModal onClose={() => setShowPresets(false)} onSelect={handlePreset} />
        )}
      </AnimatePresence>

      {/* Saved Scenarios Modal */}
      <AnimatePresence>
        {showSavedScenarios && (
          <SavedScenariosModal
            onClose={() => setShowSavedScenarios(false)}
            onSelect={handleSelectSavedScenario}
          />
        )}
      </AnimatePresence>

      {/* Save Scenario Modal */}
      <AnimatePresence>
        {showSaveModal && (
          <ModalOverlay onClose={() => setShowSaveModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface rounded-lg border border-border shadow-xl w-full max-w-md mx-4 p-5 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Bookmark size={18} className="text-accent" />
                  Save Scenario to Local Library
                </h3>
                <button onClick={() => setShowSaveModal(false)} className="text-muted hover:text-foreground">
                  <X size={18} />
                </button>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1">
                  Scenario Name
                </label>
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface text-foreground focus:border-accent focus:outline-none"
                  placeholder="e.g. Lab 3 - MLFQ vs SRTF Convoy"
                />
              </div>
              <p className="text-xs text-muted">
                This scenario will be stored in your browser&apos;s local storage and can be recalled anytime or exported as JSON.
              </p>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="px-3 py-1.5 text-xs text-muted hover:text-foreground rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveScenarioSubmit}
                  disabled={!saveName.trim()}
                  className="px-4 py-1.5 text-xs font-semibold bg-accent text-white rounded hover:bg-accent-hover disabled:opacity-40"
                >
                  Save Scenario
                </button>
              </div>
            </motion.div>
          </ModalOverlay>
        )}
      </AnimatePresence>

      {/* History Modal */}
      <AnimatePresence>
        {showHistory && <SimulationHistoryModal onClose={() => setShowHistory(false)} />}
      </AnimatePresence>

      {/* Randomizer Modal */}
      <AnimatePresence>
        {showRandomizer && (
          <RandomizerModal onClose={() => setShowRandomizer(false)} onGenerate={handleRandomize} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ==================== Add Process Modal ====================

function AddProcessModal({
  processes,
  editingPid,
  onClose,
  onAdd,
  onUpdate,
}: {
  processes: ProcessConfig[];
  editingPid: string | null;
  onClose: () => void;
  onAdd: (p: ProcessConfig) => void;
  onUpdate: (pid: string, p: Partial<ProcessConfig>) => void;
}) {
  const existing = editingPid ? processes.find((p) => p.pid === editingPid) : null;

  const [pid, setPid] = useState(existing?.pid ?? `P${String(processes.length + 1).padStart(2, '0')}`);
  const [arrival, setArrival] = useState(String(existing?.arrivalTime ?? 0));
  const [burst, setBurst] = useState(String(existing?.burstTime ?? 1));
  const [priority, setPriority] = useState(String(existing?.priority ?? 1));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!pid.trim()) errs.pid = 'PID is required';
    else if (!editingPid && processes.some((p) => p.pid === pid.trim())) errs.pid = 'PID must be unique';

    const arrNum = parseInt(arrival);
    if (isNaN(arrNum) || arrNum < 0) errs.arrival = 'Must be ≥ 0';

    const burstNum = parseInt(burst);
    if (isNaN(burstNum) || burstNum <= 0) errs.burst = 'Must be > 0';

    const priNum = parseInt(priority);
    if (isNaN(priNum) || priNum < 0) errs.priority = 'Must be ≥ 0';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    if (editingPid) {
      onUpdate(editingPid, {
        pid: pid.trim(),
        arrivalTime: parseInt(arrival),
        burstTime: parseInt(burst),
        priority: parseInt(priority),
      });
    } else {
      onAdd({
        pid: pid.trim(),
        arrivalTime: parseInt(arrival),
        burstTime: parseInt(burst),
        priority: parseInt(priority),
      });
    }
  };

  return (
    <ModalOverlay onClose={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-surface rounded-lg border border-border shadow-lg w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground">
            {editingPid ? `Edit ${editingPid}` : 'Add Process'}
          </h3>
          <button onClick={onClose} className="text-muted hover:text-foreground" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <FormField label="PID" error={errors.pid}>
            <input
              value={pid}
              onChange={(e) => setPid(e.target.value)}
              disabled={!!editingPid}
              className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface font-mono text-foreground focus:border-accent focus:outline-none disabled:opacity-50"
            />
          </FormField>
          <FormField label="Arrival Time" error={errors.arrival}>
            <input
              type="number"
              min={0}
              value={arrival}
              onChange={(e) => setArrival(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface font-mono text-foreground focus:border-accent focus:outline-none"
            />
          </FormField>
          <FormField label="Burst Time" error={errors.burst}>
            <input
              type="number"
              min={1}
              value={burst}
              onChange={(e) => setBurst(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface font-mono text-foreground focus:border-accent focus:outline-none"
            />
          </FormField>
          <FormField label="Priority" error={errors.priority}>
            <input
              type="number"
              min={0}
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface font-mono text-foreground focus:border-accent focus:outline-none"
            />
          </FormField>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm text-muted border border-border rounded-md hover:bg-surface-alt"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-1.5 text-sm font-medium bg-accent text-white rounded-md hover:bg-accent-hover"
          >
            {editingPid ? 'Update' : 'Add'}
          </button>
        </div>
      </motion.div>
    </ModalOverlay>
  );
}

// ==================== Presets Modal ====================

function PresetsModal({
  onClose,
  onSelect,
}: {
  onClose: () => void;
  onSelect: (idx: number) => void;
}) {
  return (
    <ModalOverlay onClose={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-surface rounded-lg border border-border shadow-lg w-full max-w-lg mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Standard Curriculum Presets</h3>
          <button onClick={onClose} className="text-muted hover:text-foreground" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
          {PRESET_SCENARIOS.map((preset, i) => (
            <button
              key={preset.name}
              onClick={() => onSelect(i)}
              className="w-full text-left p-3 rounded-md border border-border hover:border-accent/40 hover:bg-accent/5 transition-colors"
            >
              <p className="text-sm font-semibold text-foreground">{preset.name}</p>
              <p className="text-xs text-muted mt-0.5">{preset.description}</p>
              <div className="flex gap-2 mt-1.5">
                <span className="text-[10px] font-mono px-1.5 py-0.5 bg-surface-alt rounded text-foreground font-medium">
                  {preset.algorithm}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 bg-surface-alt rounded text-muted">
                  {preset.processes.length} processes
                </span>
              </div>
            </button>
          ))}
        </div>
      </motion.div>
    </ModalOverlay>
  );
}

// ==================== Saved Scenarios Modal ====================

function SavedScenariosModal({
  onClose,
  onSelect,
}: {
  onClose: () => void;
  onSelect: (sc: SavedScenario) => void;
}) {
  const [scenarios, setScenarios] = useState<SavedScenario[]>(() => getSavedScenarios());

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteSavedScenario(id);
    setScenarios(getSavedScenarios());
  };

  const handleExport = () => {
    const jsonStr = exportScenariosToJson(scenarios);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `schedlab-scenarios-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      const imported = importScenariosFromJson(content);
      if (imported.length > 0) {
        for (const sc of imported) {
          saveScenario(sc);
        }
        setScenarios(getSavedScenarios());
      }
    };
    reader.readAsText(file);
  };

  return (
    <ModalOverlay onClose={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-surface rounded-lg border border-border shadow-xl w-full max-w-xl mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Bookmark size={18} className="text-accent" />
            <h3 className="font-semibold text-foreground">Scenario Library (LocalStorage)</h3>
          </div>
          <button onClick={onClose} className="text-muted hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
          {scenarios.length === 0 ? (
            <p className="text-xs text-muted text-center py-8">
              No saved scenarios found. Click &quot;Save to Library&quot; to store your custom workloads.
            </p>
          ) : (

            scenarios.map((sc) => (
              <div
                key={sc.id}
                onClick={() => onSelect(sc)}
                className="group flex items-center justify-between p-3 rounded-md border border-border hover:border-accent/40 hover:bg-accent/5 transition-colors cursor-pointer"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{sc.name}</p>
                    {sc.isCustom && (
                      <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-accent/15 text-accent">
                        Custom
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-muted mt-1 font-mono">
                    <span>Algo: <strong className="text-foreground">{sc.algorithm}</strong></span>
                    <span>Procs: {sc.processes.length}</span>
                    {sc.timeQuantum && <span>Q: {sc.timeQuantum}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleDelete(sc.id, e)}
                    className="p-1 text-muted hover:text-error opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete scenario"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-surface-alt/50">
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-muted hover:text-foreground border border-border rounded bg-surface hover:bg-surface-alt transition-colors"
            >
              <Download size={12} />
              Export JSON
            </button>
            <label className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-muted hover:text-foreground border border-border rounded bg-surface hover:bg-surface-alt transition-colors cursor-pointer">
              <Upload size={12} />
              Import JSON
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 text-xs text-muted hover:text-foreground"
          >
            Close
          </button>
        </div>
      </motion.div>
    </ModalOverlay>
  );
}

// ==================== Simulation History Modal ====================

function SimulationHistoryModal({ onClose }: { onClose: () => void }) {
  const [history, setHistory] = useState(getSimulationHistory());

  const handleClear = () => {
    clearSimulationHistory();
    setHistory([]);
  };

  return (
    <ModalOverlay onClose={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-surface rounded-lg border border-border shadow-xl w-full max-w-xl mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <History size={18} className="text-accent" />
            <h3 className="font-semibold text-foreground">Recent Simulation Runs</h3>
          </div>
          <button onClick={onClose} className="text-muted hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
          {history.length === 0 ? (
            <p className="text-xs text-muted text-center py-8">
              No simulation runs logged yet. Launch a simulation to build up history.
            </p>
          ) : (
            history.map((run) => (
              <div
                key={run.id}
                className="p-3 rounded-md border border-border bg-surface hover:bg-surface-alt transition-colors space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">{run.simulationName}</span>
                  <span className="text-[10px] font-mono text-muted">
                    {new Date(run.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-[10px] font-mono text-muted pt-1">
                  <span>Algo: <strong className="text-foreground">{run.algorithm}</strong></span>
                  <span>Avg WT: <strong className="text-amber-500">{run.avgWaitingTime}</strong></span>
                  <span>Fairness: <strong className="text-emerald-500">{run.fairnessIndex}</strong></span>
                  <span>Switches: <strong className="text-foreground">{run.contextSwitches}</strong></span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-surface-alt/50">
          <button
            onClick={handleClear}
            disabled={history.length === 0}
            className="text-xs text-error hover:underline disabled:opacity-40"
          >
            Clear History
          </button>
          <button
            onClick={onClose}
            className="px-3 py-1 text-xs text-muted hover:text-foreground"
          >
            Close
          </button>
        </div>
      </motion.div>
    </ModalOverlay>
  );
}

// ==================== Randomizer Modal ====================

function RandomizerModal({
  onClose,
  onGenerate,
}: {
  onClose: () => void;
  onGenerate: (
    count: number,
    arrMin: number,
    arrMax: number,
    burstMin: number,
    burstMax: number,
    priMin: number,
    priMax: number
  ) => void;
}) {
  const [count, setCount] = useState(5);
  const [arrMin, setArrMin] = useState(0);
  const [arrMax, setArrMax] = useState(10);
  const [burstMin, setBurstMin] = useState(1);
  const [burstMax, setBurstMax] = useState(12);
  const [priMin, setPriMin] = useState(1);
  const [priMax, setPriMax] = useState(5);

  return (
    <ModalOverlay onClose={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-surface rounded-lg border border-border shadow-lg w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Random Workload Generator</h3>
          <button onClick={onClose} className="text-muted hover:text-foreground" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <FormField label="Number of Processes">
            <input
              type="number"
              min={1}
              max={20}
              value={count}
              onChange={(e) => setCount(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
              className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface font-mono text-foreground focus:border-accent focus:outline-none"
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Arrival Min">
              <input
                type="number"
                min={0}
                value={arrMin}
                onChange={(e) => setArrMin(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface font-mono text-foreground focus:border-accent focus:outline-none"
              />
            </FormField>
            <FormField label="Arrival Max">
              <input
                type="number"
                min={0}
                value={arrMax}
                onChange={(e) => setArrMax(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface font-mono text-foreground focus:border-accent focus:outline-none"
              />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Burst Min">
              <input
                type="number"
                min={1}
                value={burstMin}
                onChange={(e) => setBurstMin(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface font-mono text-foreground focus:border-accent focus:outline-none"
              />
            </FormField>
            <FormField label="Burst Max">
              <input
                type="number"
                min={1}
                value={burstMax}
                onChange={(e) => setBurstMax(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface font-mono text-foreground focus:border-accent focus:outline-none"
              />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Priority Min">
              <input
                type="number"
                min={0}
                value={priMin}
                onChange={(e) => setPriMin(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface font-mono text-foreground focus:border-accent focus:outline-none"
              />
            </FormField>
            <FormField label="Priority Max">
              <input
                type="number"
                min={0}
                value={priMax}
                onChange={(e) => setPriMax(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface font-mono text-foreground focus:border-accent focus:outline-none"
              />
            </FormField>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm text-muted border border-border rounded-md hover:bg-surface-alt"
          >
            Cancel
          </button>
          <button
            onClick={() => onGenerate(count, arrMin, arrMax, burstMin, burstMax, priMin, priMax)}
            className="px-4 py-1.5 text-sm font-medium bg-accent text-white rounded-md hover:bg-accent-hover"
          >
            Generate Workload
          </button>
        </div>
      </motion.div>
    </ModalOverlay>
  );
}

// ==================== Shared Components ====================

function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]"
      onClick={onClose}
    >
      {children}
    </motion.div>
  );
}

function FormField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1">{label}</label>
      {children}
      {error && (
        <p className="flex items-center gap-1 mt-1 text-xs text-error">
          <AlertCircle size={12} />
          {error}
        </p>
      )}
    </div>
  );
}
