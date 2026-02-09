// ============================================================
// CPU Scheduling Algorithms
// ============================================================
// Implements FCFS, SJF, Priority Scheduling, and Round Robin.
// Each algorithm takes a list of processes and returns a
// SchedulingResult with the Gantt chart and computed metrics.
// ============================================================

import type { Process, GanttBlock, SchedulingResult } from "./types";

/**
 * Helper: deep-clone processes so algorithms don't mutate the originals.
 */
function cloneProcesses(procs: Process[]): Process[] {
  return procs.map((p) => ({ ...p }));
}

/**
 * Compute final metrics from the Gantt chart and process list.
 */
function computeMetrics(
  gantt: GanttBlock[],
  procs: Process[],
  totalTime: number
): Pick<SchedulingResult, "avgWaitingTime" | "avgTurnaroundTime" | "cpuUtilization" | "contextSwitches"> {
  const completed = procs.filter((p) => p.completionTime > 0);
  const n = completed.length || 1;

  const avgWaitingTime = completed.reduce((s, p) => s + p.waitingTime, 0) / n;
  const avgTurnaroundTime = completed.reduce((s, p) => s + p.turnaroundTime, 0) / n;

  // CPU utilization = time CPU was busy / total time
  const busyTime = gantt.filter((g) => g.pid !== null).reduce((s, g) => s + (g.end - g.start), 0);
  const cpuUtilization = totalTime > 0 ? (busyTime / totalTime) * 100 : 0;

  // Count context switches (transitions between different processes)
  let contextSwitches = 0;
  for (let i = 1; i < gantt.length; i++) {
    if (gantt[i].pid !== gantt[i - 1].pid) contextSwitches++;
  }

  return { avgWaitingTime, avgTurnaroundTime, cpuUtilization, contextSwitches };
}

// ──────────────────────────────────────────────
// FCFS — First Come First Served
// ──────────────────────────────────────────────
// Processes are scheduled in order of arrival time.
// Non-preemptive: once a process starts, it runs to completion.
export function scheduleFCFS(processes: Process[]): SchedulingResult {
  const procs = cloneProcesses(processes).filter((p) => p.state !== "Terminated");
  procs.sort((a, b) => a.arrivalTime - b.arrivalTime);

  const gantt: GanttBlock[] = [];
  let time = 0;

  for (const p of procs) {
    // If process hasn't arrived yet, CPU is idle
    if (time < p.arrivalTime) {
      gantt.push({ pid: null, processName: "idle", color: "#374151", start: time, end: p.arrivalTime });
      time = p.arrivalTime;
    }

    p.startTime = time;
    p.waitingTime = time - p.arrivalTime;
    gantt.push({ pid: p.pid, processName: p.name, color: p.color, start: time, end: time + p.burstTime });
    time += p.burstTime;
    p.completionTime = time;
    p.turnaroundTime = p.completionTime - p.arrivalTime;
    p.remainingTime = 0;
    p.state = "Terminated";
  }

  const metrics = computeMetrics(gantt, procs, time);
  return { gantt, processes: procs, totalTime: time, ...metrics };
}

// ──────────────────────────────────────────────
// SJF — Shortest Job First (Non-preemptive)
// ──────────────────────────────────────────────
// At each decision point, the process with the shortest
// burst time (among arrived processes) is selected.
export function scheduleSJF(processes: Process[]): SchedulingResult {
  const procs = cloneProcesses(processes).filter((p) => p.state !== "Terminated");
  const gantt: GanttBlock[] = [];
  let time = 0;
  const remaining = [...procs];
  const completed: Process[] = [];

  while (remaining.length > 0) {
    // Find processes that have arrived
    const available = remaining.filter((p) => p.arrivalTime <= time);

    if (available.length === 0) {
      // CPU idle until next arrival
      const nextArrival = Math.min(...remaining.map((p) => p.arrivalTime));
      gantt.push({ pid: null, processName: "idle", color: "#374151", start: time, end: nextArrival });
      time = nextArrival;
      continue;
    }

    // Pick shortest burst time
    available.sort((a, b) => a.burstTime - b.burstTime || a.arrivalTime - b.arrivalTime);
    const p = available[0];

    p.startTime = time;
    p.waitingTime = time - p.arrivalTime;
    gantt.push({ pid: p.pid, processName: p.name, color: p.color, start: time, end: time + p.burstTime });
    time += p.burstTime;
    p.completionTime = time;
    p.turnaroundTime = p.completionTime - p.arrivalTime;
    p.remainingTime = 0;
    p.state = "Terminated";

    completed.push(p);
    remaining.splice(remaining.indexOf(p), 1);
  }

  const metrics = computeMetrics(gantt, completed, time);
  return { gantt, processes: completed, totalTime: time, ...metrics };
}

// ──────────────────────────────────────────────
// Priority Scheduling (Non-preemptive)
// ──────────────────────────────────────────────
// Lower priority number = higher priority.
// Among arrived processes, the one with the highest priority
// (lowest number) runs to completion.
export function schedulePriority(processes: Process[]): SchedulingResult {
  const procs = cloneProcesses(processes).filter((p) => p.state !== "Terminated");
  const gantt: GanttBlock[] = [];
  let time = 0;
  const remaining = [...procs];
  const completed: Process[] = [];

  while (remaining.length > 0) {
    const available = remaining.filter((p) => p.arrivalTime <= time);

    if (available.length === 0) {
      const nextArrival = Math.min(...remaining.map((p) => p.arrivalTime));
      gantt.push({ pid: null, processName: "idle", color: "#374151", start: time, end: nextArrival });
      time = nextArrival;
      continue;
    }

    // Pick highest priority (lowest number), break ties by arrival
    available.sort((a, b) => a.priority - b.priority || a.arrivalTime - b.arrivalTime);
    const p = available[0];

    p.startTime = time;
    p.waitingTime = time - p.arrivalTime;
    gantt.push({ pid: p.pid, processName: p.name, color: p.color, start: time, end: time + p.burstTime });
    time += p.burstTime;
    p.completionTime = time;
    p.turnaroundTime = p.completionTime - p.arrivalTime;
    p.remainingTime = 0;
    p.state = "Terminated";

    completed.push(p);
    remaining.splice(remaining.indexOf(p), 1);
  }

  const metrics = computeMetrics(gantt, completed, time);
  return { gantt, processes: completed, totalTime: time, ...metrics };
}

// ──────────────────────────────────────────────
// Round Robin
// ──────────────────────────────────────────────
// Each process gets a fixed time quantum. If it doesn't
// finish within the quantum, it's preempted and placed
// at the end of the ready queue.
export function scheduleRoundRobin(processes: Process[], quantum: number): SchedulingResult {
  const procs = cloneProcesses(processes).filter((p) => p.state !== "Terminated");
  procs.sort((a, b) => a.arrivalTime - b.arrivalTime);

  const gantt: GanttBlock[] = [];
  let time = 0;
  const queue: Process[] = [];
  const remaining = [...procs];
  const completed: Process[] = [];

  // Initialize remaining times
  remaining.forEach((p) => (p.remainingTime = p.burstTime));

  // Track which processes have been added to the queue
  let nextIdx = 0;

  // Add all processes that arrive at time 0
  while (nextIdx < remaining.length && remaining[nextIdx].arrivalTime <= time) {
    queue.push(remaining[nextIdx]);
    nextIdx++;
  }

  while (queue.length > 0 || nextIdx < remaining.length) {
    if (queue.length === 0) {
      // CPU idle
      const nextArrival = remaining[nextIdx].arrivalTime;
      gantt.push({ pid: null, processName: "idle", color: "#374151", start: time, end: nextArrival });
      time = nextArrival;
      while (nextIdx < remaining.length && remaining[nextIdx].arrivalTime <= time) {
        queue.push(remaining[nextIdx]);
        nextIdx++;
      }
      continue;
    }

    const p = queue.shift()!;
    if (p.startTime < 0) p.startTime = time;

    const execTime = Math.min(quantum, p.remainingTime);
    gantt.push({ pid: p.pid, processName: p.name, color: p.color, start: time, end: time + execTime });
    time += execTime;
    p.remainingTime -= execTime;

    // Add newly arrived processes to queue before re-adding current process
    while (nextIdx < remaining.length && remaining[nextIdx].arrivalTime <= time) {
      queue.push(remaining[nextIdx]);
      nextIdx++;
    }

    if (p.remainingTime > 0) {
      // Process not finished, put back in queue
      queue.push(p);
    } else {
      // Process completed
      p.completionTime = time;
      p.turnaroundTime = p.completionTime - p.arrivalTime;
      p.waitingTime = p.turnaroundTime - p.burstTime;
      p.state = "Terminated";
      completed.push(p);
    }
  }

  const metrics = computeMetrics(gantt, completed, time);
  return { gantt, processes: completed, totalTime: time, ...metrics };
}

/**
 * Run the selected scheduling algorithm.
 */
export function runScheduler(
  algorithm: string,
  processes: Process[],
  quantum: number
): SchedulingResult {
  switch (algorithm) {
    case "FCFS":
      return scheduleFCFS(processes);
    case "SJF":
      return scheduleSJF(processes);
    case "Priority":
      return schedulePriority(processes);
    case "RoundRobin":
      return scheduleRoundRobin(processes, quantum);
    default:
      return scheduleFCFS(processes);
  }
}
