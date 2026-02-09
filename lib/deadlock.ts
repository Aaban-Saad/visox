// ============================================================
// Deadlock Detection & Resolution
// ============================================================
// Implements a simplified Resource Allocation Graph (RAG)
// with circular-wait detection and Banker's Algorithm
// for deadlock resolution.
// ============================================================

import type { ResourceState } from "./types";
import { RESOURCE_IDS } from "./constants";

/**
 * Initialize resource states with configurable totals.
 */
export function initializeResources(totals: Record<string, number> = { R1: 2, R2: 2, R3: 2 }): ResourceState[] {
  return RESOURCE_IDS.map((id) => ({
    id,
    total: totals[id] ?? 2,
    available: totals[id] ?? 2,
    heldBy: [],
    waitedBy: [],
  }));
}

/**
 * Try to allocate a resource to a process.
 * Returns true if successful, false if the process must wait.
 */
export function requestResource(
  resources: ResourceState[],
  resourceId: string,
  pid: number
): { resources: ResourceState[]; granted: boolean } {
  const updated = resources.map((r) => ({ ...r, heldBy: [...r.heldBy], waitedBy: [...r.waitedBy] }));
  const res = updated.find((r) => r.id === resourceId);

  if (!res) return { resources: updated, granted: false };

  // Check if process already holds this resource
  if (res.heldBy.includes(pid)) return { resources: updated, granted: true };

  if (res.available > 0) {
    // Grant the resource
    res.available--;
    res.heldBy.push(pid);
    // Remove from waiting if was waiting
    res.waitedBy = res.waitedBy.filter((p) => p !== pid);
    return { resources: updated, granted: true };
  } else {
    // Process must wait
    if (!res.waitedBy.includes(pid)) {
      res.waitedBy.push(pid);
    }
    return { resources: updated, granted: false };
  }
}

/**
 * Release a resource held by a process.
 */
export function releaseResource(
  resources: ResourceState[],
  resourceId: string,
  pid: number
): ResourceState[] {
  return resources.map((r) => {
    if (r.id !== resourceId) return r;

    const newHeldBy = r.heldBy.filter((p) => p !== pid);
    const released = r.heldBy.length - newHeldBy.length;

    return {
      ...r,
      heldBy: newHeldBy,
      waitedBy: r.waitedBy.filter((p) => p !== pid),
      available: r.available + released,
    };
  });
}

/**
 * Release ALL resources held by a process.
 */
export function releaseAllResources(
  resources: ResourceState[],
  pid: number
): ResourceState[] {
  return resources.map((r) => {
    const held = r.heldBy.filter((p) => p === pid).length;
    return {
      ...r,
      heldBy: r.heldBy.filter((p) => p !== pid),
      waitedBy: r.waitedBy.filter((p) => p !== pid),
      available: r.available + held,
    };
  });
}

/**
 * Detect deadlock by finding circular wait in the RAG.
 * Uses DFS to find cycles in the wait-for graph.
 * Returns the set of deadlocked PIDs.
 */
export function detectDeadlock(resources: ResourceState[]): Set<number> {
  // Build a wait-for graph: process -> set of processes it's waiting on
  // P1 waits for R1, R1 is held by P2 => P1 waits for P2
  const waitForGraph = new Map<number, Set<number>>();

  for (const res of resources) {
    for (const waitingPid of res.waitedBy) {
      if (!waitForGraph.has(waitingPid)) {
        waitForGraph.set(waitingPid, new Set());
      }
      // This process waits for all processes holding this resource
      for (const holdingPid of res.heldBy) {
        if (holdingPid !== waitingPid) {
          waitForGraph.get(waitingPid)!.add(holdingPid);
        }
      }
    }
  }

  // DFS to find cycles
  const deadlocked = new Set<number>();
  const visited = new Set<number>();
  const inStack = new Set<number>();

  function dfs(node: number, path: number[]): boolean {
    visited.add(node);
    inStack.add(node);
    path.push(node);

    const neighbors = waitForGraph.get(node) || new Set();
    for (const neighbor of neighbors) {
      if (inStack.has(neighbor)) {
        // Found a cycle — mark all nodes in the cycle
        const cycleStart = path.indexOf(neighbor);
        for (let i = cycleStart; i < path.length; i++) {
          deadlocked.add(path[i]);
        }
        deadlocked.add(neighbor);
        return true;
      }
      if (!visited.has(neighbor)) {
        if (dfs(neighbor, path)) return true;
      }
    }

    path.pop();
    inStack.delete(node);
    return false;
  }

  for (const node of waitForGraph.keys()) {
    if (!visited.has(node)) {
      dfs(node, []);
    }
  }

  return deadlocked;
}

/**
 * Resolve deadlock using a simplified Banker's Algorithm approach.
 * Terminates the lowest-priority (highest PID) deadlocked process
 * and releases its resources.
 */
export function resolveDeadlock(
  resources: ResourceState[],
  deadlockedPids: Set<number>
): { resources: ResourceState[]; terminatedPid: number | null } {
  if (deadlockedPids.size === 0) return { resources, terminatedPid: null };

  // Terminate the process with the highest PID (lowest priority heuristic)
  const victim = Math.max(...deadlockedPids);
  const updated = releaseAllResources(resources, victim);

  return { resources: updated, terminatedPid: victim };
}

/**
 * Build edges for the Resource Allocation Graph visualization.
 */
export function buildRAGEdges(resources: ResourceState[]): Array<{
  from: string;
  to: string;
  type: "request" | "assignment";
}> {
  const edges: Array<{ from: string; to: string; type: "request" | "assignment" }> = [];

  for (const res of resources) {
    // Assignment edges: Resource -> Process (resource assigned to process)
    for (const pid of res.heldBy) {
      edges.push({ from: res.id, to: `P${pid}`, type: "assignment" });
    }
    // Request edges: Process -> Resource (process requesting resource)
    for (const pid of res.waitedBy) {
      edges.push({ from: `P${pid}`, to: res.id, type: "request" });
    }
  }

  return edges;
}
