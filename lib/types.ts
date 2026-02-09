// ============================================================
// VISOX — Core type definitions for the OS simulator
// ============================================================

/** Process states following the standard 5-state process model */
export type ProcessState = "New" | "Ready" | "Running" | "Waiting" | "Terminated";

/** CPU scheduling algorithms */
export type SchedulingAlgorithm = "FCFS" | "SJF" | "Priority" | "RoundRobin";

/** Memory allocation strategies */
export type AllocationStrategy = "FirstFit" | "BestFit" | "WorstFit";

/** A simulated process */
export interface Process {
  pid: number;
  name: string;
  arrivalTime: number;
  burstTime: number;
  remainingTime: number;
  priority: number; // lower = higher priority
  state: ProcessState;
  color: string;
  /** Memory allocated in MB (0 if not allocated) */
  memoryRequired: number;
  /** Waiting time computed by scheduler */
  waitingTime: number;
  /** Turnaround time computed by scheduler */
  turnaroundTime: number;
  /** Completion time */
  completionTime: number;
  /** Start time (first time CPU was given) */
  startTime: number;
}

/** A single entry in the Gantt chart timeline */
export interface GanttBlock {
  pid: number | null; // null = CPU idle
  processName: string;
  color: string;
  start: number;
  end: number;
}

/** A memory block (allocated or free) */
export interface MemoryBlock {
  id: string;
  pid: number | null; // null = free hole
  processName: string;
  color: string;
  start: number; // start address in MB
  size: number;  // size in MB
}

/** Resources for deadlock simulation */
export type ResourceId = "R1" | "R2" | "R3";

/** Edge type in the resource allocation graph */
export type RAGEdgeType = "request" | "assignment";

/** An edge in the resource allocation graph */
export interface RAGEdge {
  from: string;  // "P1" or "R1"
  to: string;    // "R1" or "P1"
  type: RAGEdgeType;
}

/** Deadlock resource state */
export interface ResourceState {
  id: ResourceId;
  total: number;
  available: number;
  /** PIDs holding this resource */
  heldBy: number[];
  /** PIDs waiting for this resource */
  waitedBy: number[];
}

/** System-wide metrics */
export interface SystemMetrics {
  activeProcesses: number;
  deadlockedProcesses: number;
  totalMemoryUsed: number;
  memoryFragmentation: number;
  cpuUtilization: number;
  contextSwitches: number;
}

/** Scheduling result after running an algorithm */
export interface SchedulingResult {
  gantt: GanttBlock[];
  processes: Process[];
  avgWaitingTime: number;
  avgTurnaroundTime: number;
  cpuUtilization: number;
  contextSwitches: number;
  totalTime: number;
}
