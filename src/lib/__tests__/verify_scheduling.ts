// ============================================================
// SchedLab — Algorithmic Verification Test Suite
// ============================================================

import { runSchedulingAlgorithm } from '../scheduling';
import type { ProcessConfig } from '../types';
import { generateRecommendation, analyzeWorkload } from '../recommendation';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`TEST FAILED: ${message}`);
  }
}

function assertApprox(a: number, b: number, eps = 0.01, message = '') {
  if (Math.abs(a - b) > eps) {
    throw new Error(`TEST FAILED: ${message} (Expected ${b}, got ${a})`);
  }
}

console.log('--- Running SchedLab Algorithmic Verifications ---');

// Test 1: FCFS Basic Case
{
  const processes: ProcessConfig[] = [
    { pid: 'P1', arrivalTime: 0, burstTime: 4, priority: 1 },
    { pid: 'P2', arrivalTime: 1, burstTime: 3, priority: 2 },
    { pid: 'P3', arrivalTime: 2, burstTime: 1, priority: 3 },
  ];

  const res = runSchedulingAlgorithm('FCFS', processes);
  // P1: starts 0, ends 4 -> TAT=4, WT=0, RT=0
  // P2: starts 4, ends 7 -> TAT=6, WT=3, RT=3
  // P3: starts 7, ends 8 -> TAT=6, WT=5, RT=5
  const p1 = res.processResults.find((p) => p.pid === 'P1')!;
  const p2 = res.processResults.find((p) => p.pid === 'P2')!;
  const p3 = res.processResults.find((p) => p.pid === 'P3')!;

  assert(p1.completionTime === 4, 'FCFS P1 CT should be 4');
  assert(p1.waitingTime === 0, 'FCFS P1 WT should be 0');
  assert(p2.completionTime === 7, 'FCFS P2 CT should be 7');
  assert(p2.waitingTime === 3, 'FCFS P2 WT should be 3');
  assert(p3.completionTime === 8, 'FCFS P3 CT should be 8');
  assert(p3.waitingTime === 5, 'FCFS P3 WT should be 5');
  assertApprox(res.metrics.avgWaitingTime, (0 + 3 + 5) / 3, 0.01, 'FCFS Avg WT');
  assert(res.metrics.cpuUtilization === 100, 'FCFS CPU Util 100%');
  console.log('✓ Test 1: FCFS Basic Passed');
}

// Test 2: FCFS with CPU Idle Gap
{
  const processes: ProcessConfig[] = [
    { pid: 'P1', arrivalTime: 0, burstTime: 2, priority: 1 },
    { pid: 'P2', arrivalTime: 5, burstTime: 3, priority: 1 },
  ];

  const res = runSchedulingAlgorithm('FCFS', processes);
  // Total time should be 8 (0-2 P1, 2-5 IDLE, 5-8 P2)
  assert(res.totalTime === 8, 'FCFS with idle gap total time 8');
  const idle = res.gantt.find((g) => g.pid === null || g.pid === 'IDLE');
  assert(idle !== undefined, 'Gantt should have IDLE segment');
  assert(idle!.start === 2 && idle!.end === 5, 'IDLE segment should be 2 to 5');
  // Busy time = 5, Total time = 8 -> Util = 5/8 = 62.5%
  assertApprox(res.metrics.cpuUtilization, 62.5, 0.1, 'FCFS CPU Util with idle gap');
  console.log('✓ Test 2: FCFS with CPU Idle Gap Passed');
}

// Test 3: SJF Non-Preemptive
{
  const processes: ProcessConfig[] = [
    { pid: 'P1', arrivalTime: 0, burstTime: 7, priority: 1 },
    { pid: 'P2', arrivalTime: 2, burstTime: 4, priority: 2 },
    { pid: 'P3', arrivalTime: 4, burstTime: 1, priority: 3 },
    { pid: 'P4', arrivalTime: 5, burstTime: 4, priority: 4 },
  ];

  const res = runSchedulingAlgorithm('SJF', processes);
  // P1 runs 0 to 7.
  // At t=7, ready queue has P3 (BT=1), P2 (BT=4), P4 (BT=4).
  // P3 runs 7 to 8.
  // Then P2 runs 8 to 12 (tie-break PID before P4).
  // Then P4 runs 12 to 16.
  const p1 = res.processResults.find((p) => p.pid === 'P1')!;
  const p3 = res.processResults.find((p) => p.pid === 'P3')!;
  const p2 = res.processResults.find((p) => p.pid === 'P2')!;
  const p4 = res.processResults.find((p) => p.pid === 'P4')!;

  assert(p1.completionTime === 7, 'SJF P1 CT 7');
  assert(p3.completionTime === 8, 'SJF P3 CT 8');
  assert(p2.completionTime === 12, 'SJF P2 CT 12');
  assert(p4.completionTime === 16, 'SJF P4 CT 16');
  console.log('✓ Test 3: SJF Non-Preemptive Passed');
}

// Test 4: SRTF Preemptive
{
  const processes: ProcessConfig[] = [
    { pid: 'P1', arrivalTime: 0, burstTime: 8, priority: 1 },
    { pid: 'P2', arrivalTime: 1, burstTime: 4, priority: 2 },
    { pid: 'P3', arrivalTime: 2, burstTime: 9, priority: 3 },
    { pid: 'P4', arrivalTime: 3, burstTime: 5, priority: 4 },
  ];

  const res = runSchedulingAlgorithm('SRTF', processes);
  // t=0: P1 starts (rem=8)
  // t=1: P2 arrives (BT=4). P1 remaining is 7. P2 < P1 -> P1 preempted!
  // P2 runs 1 to 5, finishes at 5.
  // At t=5, candidates: P4 (rem=5), P1 (rem=7), P3 (rem=9).
  // P4 runs 5 to 10.
  // P1 runs 10 to 17.
  // P3 runs 17 to 26.
  const p2 = res.processResults.find((p) => p.pid === 'P2')!;
  const p4 = res.processResults.find((p) => p.pid === 'P4')!;
  const p1 = res.processResults.find((p) => p.pid === 'P1')!;
  const p3 = res.processResults.find((p) => p.pid === 'P3')!;

  assert(p2.completionTime === 5, 'SRTF P2 CT 5');
  assert(p4.completionTime === 10, 'SRTF P4 CT 10');
  assert(p1.completionTime === 17, 'SRTF P1 CT 17');
  assert(p3.completionTime === 26, 'SRTF P3 CT 26');
  console.log('✓ Test 4: SRTF Preemptive Passed');
}

// Test 5: Round Robin with Quantum = 2
{
  const processes: ProcessConfig[] = [
    { pid: 'P1', arrivalTime: 0, burstTime: 5, priority: 1 },
    { pid: 'P2', arrivalTime: 1, burstTime: 3, priority: 2 },
    { pid: 'P3', arrivalTime: 2, burstTime: 1, priority: 3 },
  ];

  const res = runSchedulingAlgorithm('RR', processes, { quantum: 2 });
  // t=0-2: P1 runs (rem 3). Arrived during: P2 (t=1), P3 (t=2). Queue: [P2, P3, P1]
  // t=2-4: P2 runs (rem 1). Queue: [P3, P1, P2]
  // t=4-5: P3 runs (rem 0). Finished! Queue: [P1, P2]
  // t=5-7: P1 runs (rem 1). Queue: [P2, P1]
  // t=7-8: P2 runs (rem 0). Finished! Queue: [P1]
  // t=8-9: P1 runs (rem 0). Finished!
  const p3 = res.processResults.find((p) => p.pid === 'P3')!;
  const p2 = res.processResults.find((p) => p.pid === 'P2')!;
  const p1 = res.processResults.find((p) => p.pid === 'P1')!;

  assert(p3.completionTime === 5, 'RR P3 CT 5');
  assert(p2.completionTime === 8, 'RR P2 CT 8');
  assert(p1.completionTime === 9, 'RR P1 CT 9');
  console.log('✓ Test 5: Round Robin (q=2) Passed');
}

// Test 6: Priority Scheduling (lower number = higher priority)
{
  const processes: ProcessConfig[] = [
    { pid: 'P1', arrivalTime: 0, burstTime: 4, priority: 3 },
    { pid: 'P2', arrivalTime: 0, burstTime: 3, priority: 1 },
    { pid: 'P3', arrivalTime: 0, burstTime: 2, priority: 2 },
  ];

  const res = runSchedulingAlgorithm('PRIORITY', processes, { priorityDirection: 'lower' });
  // Order should be P2 (prio 1), then P3 (prio 2), then P1 (prio 3)
  const p2 = res.processResults.find((p) => p.pid === 'P2')!;
  const p3 = res.processResults.find((p) => p.pid === 'P3')!;
  const p1 = res.processResults.find((p) => p.pid === 'P1')!;

  assert(p2.completionTime === 3, 'Priority P2 CT 3');
  assert(p3.completionTime === 5, 'Priority P3 CT 5');
  assert(p1.completionTime === 9, 'Priority P1 CT 9');
  console.log('✓ Test 6: Priority Scheduling Passed');
}

// Test 7: MLFQ Scheduling (Q0=2, Q1=4, Q2=FCFS)
{
  const processes: ProcessConfig[] = [
    { pid: 'P1', arrivalTime: 0, burstTime: 6, priority: 1 },
    { pid: 'P2', arrivalTime: 0, burstTime: 2, priority: 1 },
  ];

  const res = runSchedulingAlgorithm('MLFQ', processes, {
    mlfqConfig: { q0Quantum: 2, q1Quantum: 4, boostInterval: 50 },
  });
  // t=0: P1 and P2 enter Q0.
  // P1 runs t=0..2 (uses 2 units in Q0 -> demoted to Q1).
  // P2 runs t=2..4 (uses 2 units in Q0 -> completes!).
  // P1 runs from Q1 t=4..8 (finishes remaining 4 units in Q1).
  const p2 = res.processResults.find((p) => p.pid === 'P2')!;
  const p1 = res.processResults.find((p) => p.pid === 'P1')!;

  assert(p2.completionTime === 4, 'MLFQ P2 CT should be 4');
  assert(p1.completionTime === 8, 'MLFQ P1 CT should be 8');
  console.log('✓ Test 7: MLFQ Multi-Level Demotion Passed');
}

// Test 8: Priority with Aging (starvation prevention)
{
  const processes: ProcessConfig[] = [
    { pid: 'P1', arrivalTime: 0, burstTime: 10, priority: 1 }, // High priority long task
    { pid: 'P2', arrivalTime: 0, burstTime: 2, priority: 5 },  // Low priority short task
  ];

  // Aging interval = 2. During P1's 10 burst units, P2 waits 10 units -> ages by 5 levels!
  // P2's effective priority decreases from 5 down to 1.
  const res = runSchedulingAlgorithm('PRIORITY_AGING', processes, {
    priorityDirection: 'lower',
    agingInterval: 2,
  });

  const p1 = res.processResults.find((p) => p.pid === 'P1')!;
  const p2 = res.processResults.find((p) => p.pid === 'P2')!;
  assert(p1.completionTime === 10, 'Priority Aging P1 CT 10');
  assert(p2.completionTime === 12, 'Priority Aging P2 CT 12');
  console.log('✓ Test 8: Priority with Aging Passed');
}

// Test 9: Advanced Metrics (Context switches, Jain's fairness index, Avg Queue Length)
{
  const processes: ProcessConfig[] = [
    { pid: 'P1', arrivalTime: 0, burstTime: 4, priority: 1 },
    { pid: 'P2', arrivalTime: 0, burstTime: 4, priority: 1 },
  ];

  // Round Robin Q=2: P1 (0..2), P2 (2..4), P1 (4..6), P2 (6..8)
  // Transitions: P1->P2 (1), P2->P1 (2), P1->P2 (3) -> 3 context switches
  const res = runSchedulingAlgorithm('RR', processes, { quantum: 2 });
  assert(res.metrics.contextSwitches === 3, `Expected 3 context switches, got ${res.metrics.contextSwitches}`);
  assertApprox(res.metrics.fairnessIndex, 1.0, 0.05, 'Symmetric RR should have high fairness');
  // Total wait: P1 waited 2 (from 2 to 4), P2 waited 2 (from 0 to 2) + 2 (from 4 to 6) = 4. Total wait = 6. Total time = 8.
  // Avg queue length = 6 / 8 = 0.75
  assertApprox(res.metrics.avgQueueLength, 0.75, 0.05, 'Avg queue length check');
  console.log('✓ Test 9: Advanced Metrics Passed');
}

// Test 10: Recommendation Engine
{
  // Workload with long initial job and short subsequent jobs (Convoy Effect)

  const convoyWorkload: ProcessConfig[] = [
    { pid: 'P1', arrivalTime: 0, burstTime: 20, priority: 1 },
    { pid: 'P2', arrivalTime: 1, burstTime: 2, priority: 1 },
    { pid: 'P3', arrivalTime: 1, burstTime: 1, priority: 1 },
    { pid: 'P4', arrivalTime: 2, burstTime: 3, priority: 1 },
  ];

  const profile = analyzeWorkload(convoyWorkload);
  assert(profile.convoyRiskDetected === true, 'Profile should detect convoy risk');

  const rec = generateRecommendation(convoyWorkload, 'FCFS');
  assert(
    rec.primaryAlgorithm === 'SRTF' || rec.primaryAlgorithm === 'SJF',
    `Recommendation should be SRTF or SJF, got ${rec.primaryAlgorithm}`
  );
  assert(rec.reasons.length > 0, 'Recommendation should give educational reasons');
  console.log('✓ Test 10: Recommendation Engine Passed');
}

console.log('ALL 10 ALGORITHMIC TEST SUITES PASSED PERFECTLY!');

