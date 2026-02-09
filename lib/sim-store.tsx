"use client";

// ============================================================
// VISOX — Central Simulation Store (React Context)
// ============================================================
// Single source of truth for the entire simulator state.
// Uses React Context + useReducer for predictable state updates.
// ============================================================

import React, { createContext, useContext, useReducer, useCallback, type ReactNode } from "react";
import type {
  Process,
  SchedulingAlgorithm,
  AllocationStrategy,
  MemoryBlock,
  ResourceState,
  SchedulingResult,
  SystemMetrics,
} from "./types";
import {
  PROCESS_COLORS,
  PROCESS_NAMES,
  TOTAL_MEMORY,
  OS_RESERVED_MEMORY,
  DEFAULT_TIME_QUANTUM,
} from "./constants";
import { runScheduler } from "./scheduling";
import { initializeMemory, allocateMemory, freeMemory, compactMemory, getTotalUsedMemory, getFragmentation } from "./memory";
import {
  initializeResources,
  requestResource,
  releaseResource,
  releaseAllResources,
  detectDeadlock,
  resolveDeadlock,
} from "./deadlock";

// ─── State Shape ───────────────────────────────────────────

interface SimState {
  // Process management
  processes: Process[];
  nextPid: number;

  // CPU scheduling
  schedulingAlgorithm: SchedulingAlgorithm;
  timeQuantum: number;
  schedulingResult: SchedulingResult | null;

  // Memory
  memory: MemoryBlock[];
  allocationStrategy: AllocationStrategy;

  // Deadlock
  resources: ResourceState[];
  deadlockedPids: Set<number>;

  // Metrics
  metrics: SystemMetrics;
}

// ─── Actions ───────────────────────────────────────────────

type Action =
  | { type: "ADD_PROCESS" }
  | { type: "REMOVE_PROCESS"; pid: number }
  | { type: "SET_PROCESS_STATE"; pid: number; state: Process["state"] }
  | { type: "SET_SCHEDULING_ALGORITHM"; algorithm: SchedulingAlgorithm }
  | { type: "SET_TIME_QUANTUM"; quantum: number }
  | { type: "RUN_SCHEDULER" }
  | { type: "SET_ALLOCATION_STRATEGY"; strategy: AllocationStrategy }
  | { type: "ALLOCATE_MEMORY"; pid: number }
  | { type: "FREE_MEMORY"; pid: number }
  | { type: "COMPACT_MEMORY" }
  | { type: "REQUEST_RESOURCE"; pid: number; resourceId: string }
  | { type: "RELEASE_RESOURCE"; pid: number; resourceId: string }
  | { type: "DETECT_DEADLOCK" }
  | { type: "RESOLVE_DEADLOCK" }
  | { type: "RESET_ALL" };

// ─── Helper Functions ──────────────────────────────────────

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function computeMetrics(state: SimState): SystemMetrics {
  const active = state.processes.filter((p) => p.state !== "Terminated");
  const totalUsed = getTotalUsedMemory(state.memory);
  const fragmentation = getFragmentation(state.memory);
  const cpuUtil = state.schedulingResult?.cpuUtilization ?? 0;
  const ctxSwitches = state.schedulingResult?.contextSwitches ?? 0;

  return {
    activeProcesses: active.length,
    deadlockedProcesses: state.deadlockedPids.size,
    totalMemoryUsed: totalUsed,
    memoryFragmentation: fragmentation,
    cpuUtilization: cpuUtil,
    contextSwitches: ctxSwitches,
  };
}

// ─── Initial State ─────────────────────────────────────────

function createInitialState(): SimState {
  const state: SimState = {
    processes: [],
    nextPid: 1,
    schedulingAlgorithm: "FCFS",
    timeQuantum: DEFAULT_TIME_QUANTUM,
    schedulingResult: null,
    memory: initializeMemory(),
    allocationStrategy: "FirstFit",
    resources: initializeResources(),
    deadlockedPids: new Set(),
    metrics: {
      activeProcesses: 0,
      deadlockedProcesses: 0,
      totalMemoryUsed: 0,
      memoryFragmentation: 0,
      cpuUtilization: 0,
      contextSwitches: 0,
    },
  };
  return state;
}

// ─── Reducer ───────────────────────────────────────────────

function reducer(state: SimState, action: Action): SimState {
  let newState: SimState;

  switch (action.type) {
    case "ADD_PROCESS": {
      const pid = state.nextPid;
      const color = PROCESS_COLORS[(pid - 1) % PROCESS_COLORS.length];
      const name = PROCESS_NAMES[(pid - 1) % PROCESS_NAMES.length];
      const memReq = randomInt(2, 12) * 16; // 32–192 MB in 16MB chunks
      const newProcess: Process = {
        pid,
        name,
        arrivalTime: randomInt(0, 10),
        burstTime: randomInt(1, 10),
        remainingTime: 0,
        priority: randomInt(1, 10),
        state: "New",
        color,
        memoryRequired: memReq,
        waitingTime: 0,
        turnaroundTime: 0,
        completionTime: 0,
        startTime: -1,
      };
      newProcess.remainingTime = newProcess.burstTime;

      // Try to allocate memory
      const memResult = allocateMemory(
        state.memory,
        pid,
        name,
        color,
        memReq,
        state.allocationStrategy
      );

      const updatedMemory = memResult ?? state.memory;
      if (memResult) {
        newProcess.state = "Ready";
      }

      newState = {
        ...state,
        processes: [...state.processes, newProcess],
        nextPid: pid + 1,
        memory: updatedMemory,
      };
      break;
    }

    case "REMOVE_PROCESS": {
      newState = {
        ...state,
        processes: state.processes.map((p) =>
          p.pid === action.pid ? { ...p, state: "Terminated" as const } : p
        ),
        memory: freeMemory(state.memory, action.pid),
        resources: releaseAllResources(state.resources, action.pid),
      };
      break;
    }

    case "SET_PROCESS_STATE": {
      newState = {
        ...state,
        processes: state.processes.map((p) =>
          p.pid === action.pid ? { ...p, state: action.state } : p
        ),
      };
      break;
    }

    case "SET_SCHEDULING_ALGORITHM": {
      newState = { ...state, schedulingAlgorithm: action.algorithm, schedulingResult: null };
      break;
    }

    case "SET_TIME_QUANTUM": {
      newState = { ...state, timeQuantum: action.quantum, schedulingResult: null };
      break;
    }

    case "RUN_SCHEDULER": {
      const readyProcesses = state.processes.filter(
        (p) => p.state === "Ready" || p.state === "New" || p.state === "Running"
      );
      if (readyProcesses.length === 0) {
        newState = state;
        break;
      }
      const result = runScheduler(state.schedulingAlgorithm, readyProcesses, state.timeQuantum);
      newState = { ...state, schedulingResult: result };
      break;
    }

    case "SET_ALLOCATION_STRATEGY": {
      newState = { ...state, allocationStrategy: action.strategy };
      break;
    }

    case "ALLOCATE_MEMORY": {
      const proc = state.processes.find((p) => p.pid === action.pid);
      if (!proc) { newState = state; break; }
      const memResult = allocateMemory(
        state.memory,
        proc.pid,
        proc.name,
        proc.color,
        proc.memoryRequired,
        state.allocationStrategy
      );
      newState = {
        ...state,
        memory: memResult ?? state.memory,
        processes: memResult
          ? state.processes.map((p) => p.pid === action.pid ? { ...p, state: "Ready" as const } : p)
          : state.processes,
      };
      break;
    }

    case "FREE_MEMORY": {
      newState = {
        ...state,
        memory: freeMemory(state.memory, action.pid),
      };
      break;
    }

    case "COMPACT_MEMORY": {
      newState = { ...state, memory: compactMemory(state.memory) };
      break;
    }

    case "REQUEST_RESOURCE": {
      const { resources: newRes, granted } = requestResource(
        state.resources,
        action.resourceId,
        action.pid
      );
      const procState = granted ? "Running" : "Waiting";
      newState = {
        ...state,
        resources: newRes,
        processes: state.processes.map((p) =>
          p.pid === action.pid ? { ...p, state: procState as Process["state"] } : p
        ),
      };
      break;
    }

    case "RELEASE_RESOURCE": {
      const newRes = releaseResource(state.resources, action.resourceId, action.pid);
      newState = {
        ...state,
        resources: newRes,
      };
      break;
    }

    case "DETECT_DEADLOCK": {
      const deadlocked = detectDeadlock(state.resources);
      newState = {
        ...state,
        deadlockedPids: deadlocked,
        processes: state.processes.map((p) =>
          deadlocked.has(p.pid) ? { ...p, state: "Waiting" as const } : p
        ),
      };
      break;
    }

    case "RESOLVE_DEADLOCK": {
      const { resources: newRes, terminatedPid } = resolveDeadlock(state.resources, state.deadlockedPids);
      let updatedMemory = state.memory;
      if (terminatedPid !== null) {
        updatedMemory = freeMemory(state.memory, terminatedPid);
      }
      const newDeadlocked = detectDeadlock(newRes);
      newState = {
        ...state,
        resources: newRes,
        memory: updatedMemory,
        deadlockedPids: newDeadlocked,
        processes: state.processes.map((p) => {
          if (terminatedPid !== null && p.pid === terminatedPid) {
            return { ...p, state: "Terminated" as const };
          }
          if (newDeadlocked.has(p.pid)) {
            return { ...p, state: "Waiting" as const };
          }
          return p;
        }),
      };
      break;
    }

    case "RESET_ALL": {
      newState = createInitialState();
      break;
    }

    default:
      newState = state;
  }

  // Recompute metrics after every action
  newState.metrics = computeMetrics(newState);
  return newState;
}

// ─── Context ───────────────────────────────────────────────

interface SimContextValue {
  state: SimState;
  dispatch: React.Dispatch<Action>;
  addProcess: () => void;
  removeProcess: (pid: number) => void;
  runScheduler: () => void;
  compactMemory: () => void;
  requestResource: (pid: number, resourceId: string) => void;
  releaseResource: (pid: number, resourceId: string) => void;
  detectDeadlock: () => void;
  resolveDeadlock: () => void;
  resetAll: () => void;
}

const SimContext = createContext<SimContextValue | null>(null);

export function SimProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [state, dispatch] = useReducer(reducer, null, createInitialState);

  const addProcess = useCallback(() => dispatch({ type: "ADD_PROCESS" }), []);
  const removeProcess = useCallback((pid: number) => dispatch({ type: "REMOVE_PROCESS", pid }), []);
  const runSched = useCallback(() => dispatch({ type: "RUN_SCHEDULER" }), []);
  const compact = useCallback(() => dispatch({ type: "COMPACT_MEMORY" }), []);
  const reqRes = useCallback(
    (pid: number, resourceId: string) => dispatch({ type: "REQUEST_RESOURCE", pid, resourceId }),
    []
  );
  const relRes = useCallback(
    (pid: number, resourceId: string) => dispatch({ type: "RELEASE_RESOURCE", pid, resourceId }),
    []
  );
  const detect = useCallback(() => dispatch({ type: "DETECT_DEADLOCK" }), []);
  const resolve = useCallback(() => dispatch({ type: "RESOLVE_DEADLOCK" }), []);
  const reset = useCallback(() => dispatch({ type: "RESET_ALL" }), []);

  return (
    <SimContext.Provider
      value={{
        state,
        dispatch,
        addProcess,
        removeProcess,
        runScheduler: runSched,
        compactMemory: compact,
        requestResource: reqRes,
        releaseResource: relRes,
        detectDeadlock: detect,
        resolveDeadlock: resolve,
        resetAll: reset,
      }}
    >
      {children}
    </SimContext.Provider>
  );
}

export function useSim() {
  const ctx = useContext(SimContext);
  if (!ctx) throw new Error("useSim must be used within SimProvider");
  return ctx;
}
