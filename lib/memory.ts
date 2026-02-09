// ============================================================
// Memory Management Algorithms
// ============================================================
// Implements First Fit, Best Fit, and Worst Fit allocation
// strategies with a variable-partition memory model.
// ============================================================

import type { MemoryBlock } from "./types";
import { TOTAL_MEMORY, OS_RESERVED_MEMORY } from "./constants";

/**
 * Initialize memory with OS reserved block and one large free hole.
 */
export function initializeMemory(): MemoryBlock[] {
  return [
    {
      id: "os-reserved",
      pid: -1,
      processName: "OS Kernel",
      color: "#6b7280",
      start: 0,
      size: OS_RESERVED_MEMORY,
    },
    {
      id: "free-0",
      pid: null,
      processName: "Free",
      color: "transparent",
      start: OS_RESERVED_MEMORY,
      size: TOTAL_MEMORY - OS_RESERVED_MEMORY,
    },
  ];
}

/**
 * Get all free blocks (holes) in memory.
 */
function getFreeBlocks(memory: MemoryBlock[]): MemoryBlock[] {
  return memory.filter((b) => b.pid === null);
}

/**
 * Calculate total free memory.
 */
export function getTotalFreeMemory(memory: MemoryBlock[]): number {
  return getFreeBlocks(memory).reduce((sum, b) => sum + b.size, 0);
}

/**
 * Calculate total used memory (excluding OS reserved).
 */
export function getTotalUsedMemory(memory: MemoryBlock[]): number {
  return memory.filter((b) => b.pid !== null && b.pid !== -1).reduce((sum, b) => sum + b.size, 0);
}

/**
 * Calculate external fragmentation percentage.
 * Fragmentation = 1 - (largest free block / total free memory)
 * If all free memory is contiguous, fragmentation is 0%.
 */
export function getFragmentation(memory: MemoryBlock[]): number {
  const freeBlocks = getFreeBlocks(memory);
  if (freeBlocks.length === 0) return 0;

  const totalFree = freeBlocks.reduce((s, b) => s + b.size, 0);
  if (totalFree === 0) return 0;

  const largestFree = Math.max(...freeBlocks.map((b) => b.size));
  return ((1 - largestFree / totalFree) * 100);
}

// ──────────────────────────────────────────────
// First Fit
// ──────────────────────────────────────────────
// Allocates the first free block that is large enough.
// Fast but can lead to fragmentation at the beginning.
function firstFit(memory: MemoryBlock[], size: number): number {
  return memory.findIndex((b) => b.pid === null && b.size >= size);
}

// ──────────────────────────────────────────────
// Best Fit
// ──────────────────────────────────────────────
// Finds the smallest free block that fits the request.
// Minimizes leftover space but can create many tiny holes.
function bestFit(memory: MemoryBlock[], size: number): number {
  let bestIdx = -1;
  let bestSize = Infinity;

  for (let i = 0; i < memory.length; i++) {
    const b = memory[i];
    if (b.pid === null && b.size >= size && b.size < bestSize) {
      bestIdx = i;
      bestSize = b.size;
    }
  }

  return bestIdx;
}

// ──────────────────────────────────────────────
// Worst Fit
// ──────────────────────────────────────────────
// Finds the largest free block. Leaves the biggest
// remaining hole, potentially usable for future requests.
function worstFit(memory: MemoryBlock[], size: number): number {
  let worstIdx = -1;
  let worstSize = -1;

  for (let i = 0; i < memory.length; i++) {
    const b = memory[i];
    if (b.pid === null && b.size >= size && b.size > worstSize) {
      worstIdx = i;
      worstSize = b.size;
    }
  }

  return worstIdx;
}

/**
 * Allocate memory for a process using the specified strategy.
 * Returns the updated memory array, or null if allocation fails.
 */
export function allocateMemory(
  memory: MemoryBlock[],
  pid: number,
  processName: string,
  color: string,
  size: number,
  strategy: string
): MemoryBlock[] | null {
  const blocks = memory.map((b) => ({ ...b }));

  let idx: number;
  switch (strategy) {
    case "BestFit":
      idx = bestFit(blocks, size);
      break;
    case "WorstFit":
      idx = worstFit(blocks, size);
      break;
    default:
      idx = firstFit(blocks, size);
  }

  if (idx === -1) return null; // No suitable block found

  const freeBlock = blocks[idx];

  if (freeBlock.size === size) {
    // Exact fit — replace the free block
    blocks[idx] = {
      id: `proc-${pid}`,
      pid,
      processName,
      color,
      start: freeBlock.start,
      size,
    };
  } else {
    // Split: allocated block + remaining free block
    const allocated: MemoryBlock = {
      id: `proc-${pid}`,
      pid,
      processName,
      color,
      start: freeBlock.start,
      size,
    };
    const remaining: MemoryBlock = {
      id: `free-${freeBlock.start + size}`,
      pid: null,
      processName: "Free",
      color: "transparent",
      start: freeBlock.start + size,
      size: freeBlock.size - size,
    };
    blocks.splice(idx, 1, allocated, remaining);
  }

  return blocks;
}

/**
 * Free memory allocated to a process (by PID).
 * Merges adjacent free blocks to reduce fragmentation.
 */
export function freeMemory(memory: MemoryBlock[], pid: number): MemoryBlock[] {
  const blocks = memory.map((b) => ({ ...b }));

  // Mark the process block as free
  for (const b of blocks) {
    if (b.pid === pid) {
      b.pid = null;
      b.processName = "Free";
      b.color = "transparent";
      b.id = `free-${b.start}`;
    }
  }

  // Merge adjacent free blocks
  return mergeAdjacentFreeBlocks(blocks);
}

/**
 * Merge adjacent free blocks into single contiguous blocks.
 */
function mergeAdjacentFreeBlocks(blocks: MemoryBlock[]): MemoryBlock[] {
  const merged: MemoryBlock[] = [];

  for (const block of blocks) {
    const last = merged[merged.length - 1];
    if (last && last.pid === null && block.pid === null) {
      // Merge with previous free block
      last.size += block.size;
    } else {
      merged.push({ ...block });
    }
  }

  return merged;
}

/**
 * Compact memory: move all allocated blocks to be contiguous,
 * creating one large free block at the end.
 */
export function compactMemory(memory: MemoryBlock[]): MemoryBlock[] {
  const allocated = memory.filter((b) => b.pid !== null);
  const totalFree = memory.filter((b) => b.pid === null).reduce((s, b) => s + b.size, 0);

  const compacted: MemoryBlock[] = [];
  let currentAddr = 0;

  for (const block of allocated) {
    compacted.push({
      ...block,
      start: currentAddr,
    });
    currentAddr += block.size;
  }

  if (totalFree > 0) {
    compacted.push({
      id: `free-${currentAddr}`,
      pid: null,
      processName: "Free",
      color: "transparent",
      start: currentAddr,
      size: totalFree,
    });
  }

  return compacted;
}
