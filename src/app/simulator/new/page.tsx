'use client';

import { useState, useCallback } from 'react';
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
  ChevronDown,
  Layers,
} from 'lucide-react';
import { useSimulationStore } from '@/store/simulation';
import type { ProcessConfig, AlgorithmType, PriorityDirection } from '@/lib/types';
import { ALGORITHMS, PRESET_SCENARIOS } from '@/lib/constants';

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
    initializeSimulation,
  } = useSimulationStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPid, setEditingPid] = useState<string | null>(null);
  const [showPresets, setShowPresets] = useState(false);
  const [showRandomizer, setShowRandomizer] = useState(false);

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
    setSimulationName(preset.name);
    setShowPresets(false);
  };

  const handleRandomize = (count: number, arrMin: number, arrMax: number, burstMin: number, burstMax: number, priMin: number, priMax: number) => {
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

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">New Simulation</h1>
        <p className="text-sm text-muted mt-1">Configure processes, select an algorithm, and run the simulation.</p>
      </div>

      {/* Simulation Name */}
      <div className="mb-6">
        <label htmlFor="sim-name" className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
          Simulation Name
        </label>
        <input
          id="sim-name"
          type="text"
          value={simulationName}
          onChange={(e) => setSimulationName(e.target.value)}
          className="w-full max-w-md px-3 py-2 text-sm border border-border rounded-md bg-surface text-foreground focus:border-accent focus:outline-none"
          placeholder="Untitled Simulation"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Process Table */}
        <div className="lg:col-span-2">
          <div className="border border-border rounded-md bg-surface overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-alt">
              <h2 className="text-sm font-semibold text-foreground">Process Table</h2>
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
                  Reset
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
                <tbody>
                  <AnimatePresence>
                    {processes.map((p) => (
                      <motion.tr
                        key={p.pid}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="border-b border-border last:border-b-0 hover:bg-surface-alt/30"
                      >
                        <td className="px-4 py-2.5 font-mono font-semibold text-foreground">{p.pid}</td>
                        <td className="px-4 py-2.5 font-mono text-muted">{p.arrivalTime}</td>
                        <td className="px-4 py-2.5 font-mono text-muted">{p.burstTime}</td>
                        <td className="px-4 py-2.5 font-mono text-muted">{p.priority}</td>
                        <td className="px-4 py-2.5 text-right">
                          <button
                            onClick={() => { setEditingPid(p.pid); setShowAddModal(true); }}
                            className="p-1 text-muted hover:text-foreground transition-colors mr-1"
                            aria-label={`Edit ${p.pid}`}
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => deleteProcess(p.pid)}
                            className="p-1 text-muted hover:text-error transition-colors"
                            aria-label={`Delete ${p.pid}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                  {processes.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted">
                        No processes configured. Add a process or load a preset to begin.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-4 py-3 border-t border-border">
              <button
                onClick={() => { setEditingPid(null); setShowAddModal(true); }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-accent border border-accent/30 rounded-md hover:bg-accent/5 transition-colors"
              >
                <Plus size={14} />
                Add Process
              </button>
            </div>
          </div>
        </div>

        {/* Right: Algorithm Configuration */}
        <div className="space-y-4">
          <div className="border border-border rounded-md bg-surface overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-surface-alt">
              <h2 className="text-sm font-semibold text-foreground">Algorithm</h2>
            </div>
            <div className="p-4 space-y-2">
              {ALGORITHMS.map((algo) => (
                <label
                  key={algo.type}
                  className={`flex items-start gap-2.5 p-2.5 rounded-md cursor-pointer border transition-colors ${
                    selectedAlgorithm === algo.type
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
                    className="mt-0.5 accent-accent"
                  />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{algo.shortName}</p>
                    <p className="text-[11px] text-muted leading-snug mt-0.5">{algo.description}</p>
                    <span className={`inline-block mt-1 text-[10px] font-medium px-1.5 py-0.5 rounded ${
                      algo.preemptive ? 'bg-info-bg text-info' : 'bg-surface-alt text-muted'
                    }`}>
                      {algo.preemptive ? 'Preemptive' : 'Non-preemptive'}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Round Robin — Time Quantum */}
          {selectedAlgorithm === 'RR' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="border border-border rounded-md bg-surface p-4"
            >
              <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
                Time Quantum
              </label>
              <input
                type="number"
                min={1}
                value={timeQuantum}
                onChange={(e) => setQuantum(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface font-mono text-foreground focus:border-accent focus:outline-none"
              />
            </motion.div>
          )}

          {/* Priority — Direction */}
          {selectedAlgorithm === 'PRIORITY' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="border border-border rounded-md bg-surface p-4"
            >
              <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
                Priority Direction
              </label>
              <select
                value={priorityDirection}
                onChange={(e) => setPriorityDirection(e.target.value as PriorityDirection)}
                className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface text-foreground focus:border-accent focus:outline-none"
              >
                <option value="lower">Lower number = Higher priority</option>
                <option value="higher">Higher number = Higher priority</option>
              </select>
            </motion.div>
          )}

          {/* Run Button */}
          <button
            onClick={handleRunSimulation}
            disabled={processes.length === 0}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-accent text-white font-semibold text-sm rounded-md hover:bg-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Play size={16} fill="currentColor" />
            Run Simulation
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
            onClose={() => { setShowAddModal(false); setEditingPid(null); }}
            onAdd={(p) => { addProcess(p); setShowAddModal(false); }}
            onUpdate={(pid, p) => { updateProcess(pid, p); setShowAddModal(false); setEditingPid(null); }}
          />
        )}
      </AnimatePresence>

      {/* Presets Modal */}
      <AnimatePresence>
        {showPresets && (
          <PresetsModal onClose={() => setShowPresets(false)} onSelect={handlePreset} />
        )}
      </AnimatePresence>

      {/* Randomizer Modal */}
      <AnimatePresence>
        {showRandomizer && (
          <RandomizerModal
            onClose={() => setShowRandomizer(false)}
            onGenerate={handleRandomize}
          />
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
    else if (!editingPid && processes.some((p) => p.pid === pid.trim()))
      errs.pid = 'PID must be unique';

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
          <h3 className="font-semibold text-foreground">Preset Scenarios</h3>
          <button onClick={onClose} className="text-muted hover:text-foreground" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
          {PRESET_SCENARIOS.map((preset, i) => (
            <button
              key={preset.name}
              onClick={() => onSelect(i)}
              className="w-full text-left p-3 rounded-md border border-border hover:border-accent/30 hover:bg-accent/3 transition-colors"
            >
              <p className="text-sm font-semibold text-foreground">{preset.name}</p>
              <p className="text-xs text-muted mt-0.5">{preset.description}</p>
              <div className="flex gap-2 mt-1.5">
                <span className="text-[10px] font-mono px-1.5 py-0.5 bg-surface-alt rounded text-muted">
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

// ==================== Randomizer Modal ====================

function RandomizerModal({
  onClose,
  onGenerate,
}: {
  onClose: () => void;
  onGenerate: (count: number, arrMin: number, arrMax: number, burstMin: number, burstMax: number, priMin: number, priMax: number) => void;
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
            <input type="number" min={1} max={20} value={count} onChange={(e) => setCount(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
              className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface font-mono text-foreground focus:border-accent focus:outline-none" />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Arrival Min">
              <input type="number" min={0} value={arrMin} onChange={(e) => setArrMin(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface font-mono text-foreground focus:border-accent focus:outline-none" />
            </FormField>
            <FormField label="Arrival Max">
              <input type="number" min={0} value={arrMax} onChange={(e) => setArrMax(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface font-mono text-foreground focus:border-accent focus:outline-none" />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Burst Min">
              <input type="number" min={1} value={burstMin} onChange={(e) => setBurstMin(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface font-mono text-foreground focus:border-accent focus:outline-none" />
            </FormField>
            <FormField label="Burst Max">
              <input type="number" min={1} value={burstMax} onChange={(e) => setBurstMax(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface font-mono text-foreground focus:border-accent focus:outline-none" />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Priority Min">
              <input type="number" min={0} value={priMin} onChange={(e) => setPriMin(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface font-mono text-foreground focus:border-accent focus:outline-none" />
            </FormField>
            <FormField label="Priority Max">
              <input type="number" min={0} value={priMax} onChange={(e) => setPriMax(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface font-mono text-foreground focus:border-accent focus:outline-none" />
            </FormField>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border">
          <button onClick={onClose} className="px-3 py-1.5 text-sm text-muted border border-border rounded-md hover:bg-surface-alt">
            Cancel
          </button>
          <button onClick={() => onGenerate(count, arrMin, arrMax, burstMin, burstMax, priMin, priMax)}
            className="px-4 py-1.5 text-sm font-medium bg-accent text-white rounded-md hover:bg-accent-hover">
            Generate
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
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
