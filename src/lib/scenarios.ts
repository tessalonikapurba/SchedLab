// ============================================================
// SchedLab — Saved Scenarios, History & Shareable URL Links
// ============================================================

import type {
  SavedScenario,
  SimulationHistoryEntry,
  ProcessConfig,
  AlgorithmType,
  PriorityDirection,
} from './types';
import { PRESET_SCENARIOS } from './constants';

const SCENARIOS_KEY = 'schedlab_saved_scenarios';
const HISTORY_KEY = 'schedlab_simulation_history';

/**
 * Retrieve saved scenarios from localStorage (falling back to built-in presets).
 */
export function getSavedScenarios(): SavedScenario[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(SCENARIOS_KEY);
    if (!raw) {
      // Seed with default presets as initial templates
      const seeded: SavedScenario[] = PRESET_SCENARIOS.map((preset, i) => ({
        id: `preset-${i + 1}`,
        name: preset.name,
        description: preset.description,
        processes: preset.processes,
        algorithm: preset.algorithm,
        timeQuantum: preset.timeQuantum,
        priorityDirection: preset.priorityDirection,
        createdAt: new Date().toISOString(),
        isCustom: false,
      }));
      localStorage.setItem(SCENARIOS_KEY, JSON.stringify(seeded));
      return seeded;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load saved scenarios from localStorage:', err);
    return [];
  }
}

/**
 * Save a new custom scenario to localStorage.
 */
export function saveScenario(scenario: {
  name: string;
  description?: string;
  processes: ProcessConfig[];
  algorithm: AlgorithmType;
  timeQuantum?: number;
  priorityDirection?: PriorityDirection;
  agingInterval?: number;
}): SavedScenario {
  const current = getSavedScenarios();
  const newEntry: SavedScenario = {
    id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: scenario.name.trim() || 'Untitled Scenario',
    description: scenario.description,
    processes: scenario.processes,
    algorithm: scenario.algorithm,
    timeQuantum: scenario.timeQuantum,
    priorityDirection: scenario.priorityDirection,
    agingInterval: scenario.agingInterval,
    createdAt: new Date().toISOString(),
    isCustom: true,
  };

  const updated = [newEntry, ...current];
  try {
    localStorage.setItem(SCENARIOS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save scenario to localStorage:', err);
  }

  return newEntry;
}

/**
 * Delete a scenario by ID.
 */
export function deleteSavedScenario(id: string): void {
  const current = getSavedScenarios();
  const updated = current.filter((s) => s.id !== id);
  try {
    localStorage.setItem(SCENARIOS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to delete scenario from localStorage:', err);
  }
}

/**
 * Retrieve simulation run history from localStorage.
 */
export function getSimulationHistory(): SimulationHistoryEntry[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed to load simulation history:', err);
    return [];
  }
}

/**
 * Record a completed simulation run in history (keeps last 25 runs).
 */
export function recordSimulationRun(
  entry: Omit<SimulationHistoryEntry, 'id' | 'timestamp'>
): void {
  if (typeof window === 'undefined') return;

  const current = getSimulationHistory();
  const newEntry: SimulationHistoryEntry = {
    id: `run-${Date.now()}`,
    timestamp: new Date().toISOString(),
    ...entry,
  };

  // Prepend and cap to 25 items
  const updated = [newEntry, ...current].slice(0, 25);
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to record simulation run:', err);
  }
}

/**
 * Clear simulation run history.
 */
export function clearSimulationHistory(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch (err) {
    console.error('Failed to clear history:', err);
  }
}

/**
 * Encode scenario parameters into a compact base64 URL string.
 */
export function encodeScenarioToUrl(data: {
  name: string;
  processes: ProcessConfig[];
  algorithm: AlgorithmType;
  timeQuantum?: number;
  priorityDirection?: PriorityDirection;
  agingInterval?: number;
}): string {
  try {
    const payload = JSON.stringify({
      n: data.name,
      p: data.processes.map((proc) => [
        proc.pid,
        proc.arrivalTime,
        proc.burstTime,
        proc.priority,
      ]),
      a: data.algorithm,
      q: data.timeQuantum,
      d: data.priorityDirection,
      ag: data.agingInterval,
    });

    if (typeof window !== 'undefined') {
      return window.btoa(encodeURIComponent(payload));
    }
    return Buffer.from(encodeURIComponent(payload)).toString('base64');
  } catch (err) {
    console.error('Failed to encode scenario to URL:', err);
    return '';
  }
}

/**
 * Decode scenario parameters from a base64 URL query string.
 */
export function decodeScenarioFromUrl(
  encodedStr: string
): Partial<SavedScenario> | null {
  try {
    let jsonStr = '';
    if (typeof window !== 'undefined') {
      jsonStr = decodeURIComponent(window.atob(encodedStr));
    } else {
      jsonStr = decodeURIComponent(
        Buffer.from(encodedStr, 'base64').toString('utf-8')
      );
    }

    const raw = JSON.parse(jsonStr);
    const processes: ProcessConfig[] = (raw.p || []).map(
      (item: [string, number, number, number?]) => ({
        pid: String(item[0]),
        arrivalTime: Number(item[1]),
        burstTime: Number(item[2]),
        priority: Number(item[3] ?? 1),
      })
    );


    return {
      name: raw.n || 'Shared Scenario',
      processes,
      algorithm: raw.a || 'FCFS',
      timeQuantum: raw.q,
      priorityDirection: raw.d,
      agingInterval: raw.ag,
    };
  } catch (err) {
    console.error('Failed to decode scenario from URL:', err);
    return null;
  }
}

/**
 * Export scenarios as JSON string for backup or assignment sharing.
 */
export function exportScenariosToJson(scenarios: SavedScenario[]): string {
  return JSON.stringify(scenarios, null, 2);
}

/**
 * Import scenarios from JSON string.
 */
export function importScenariosFromJson(jsonStr: string): SavedScenario[] {
  try {
    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed)) return [];

    const valid: SavedScenario[] = [];
    for (const item of parsed) {
      if (item && item.name && Array.isArray(item.processes)) {
        valid.push({
          id: item.id || `imported-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: item.name,
          description: item.description,
          processes: item.processes,
          algorithm: item.algorithm || 'FCFS',
          timeQuantum: item.timeQuantum,
          priorityDirection: item.priorityDirection,
          agingInterval: item.agingInterval,
          createdAt: item.createdAt || new Date().toISOString(),
          isCustom: true,
        });
      }
    }
    return valid;
  } catch (err) {
    console.error('Failed to import scenarios from JSON:', err);
    return [];
  }
}
