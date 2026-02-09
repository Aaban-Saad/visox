// ============================================================
// VISOX — Constants & color palette for the OS simulator
// ============================================================

/** 
 * Process color palette — visually distinct, works on dark backgrounds.
 * Each new process is assigned the next color in rotation.
 */
export const PROCESS_COLORS = [
  "#3b82f6", // blue
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
  "#14b8a6", // teal
  "#a855f7", // purple
  "#6366f1", // indigo
  "#84cc16", // lime
];

/** Random process names for fun */
export const PROCESS_NAMES = [
  "chrome", "vscode", "spotify", "docker", "node",
  "python", "nginx", "redis", "postgres", "webpack",
  "gcc", "bash", "systemd", "sshd", "cron",
  "zsh", "vim", "git", "cargo", "java",
];

/** Total simulated memory in MB */
export const TOTAL_MEMORY = 1024;

/** OS reserved memory in MB */
export const OS_RESERVED_MEMORY = 64;

/** Available resources for deadlock simulation */
export const RESOURCE_IDS = ["R1", "R2", "R3"] as const;

/** Default time quantum for Round Robin */
export const DEFAULT_TIME_QUANTUM = 3;

/** Simulation tick speed in ms */
export const TICK_SPEED_MS = 800;
