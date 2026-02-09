"use client";

// ============================================================
// VISOX — Main Dashboard Layout
// ============================================================
// Assembles all modules into a responsive grid layout.
// ============================================================

import { Header } from "@/components/visox/header";
import { ProcessManager } from "@/components/visox/process-manager";
import { CpuScheduler } from "@/components/visox/cpu-scheduler";
import { MemoryVisualizer } from "@/components/visox/memory-visualizer";
import { DeadlockVisualizer } from "@/components/visox/deadlock-visualizer";
import { MetricsPanel } from "@/components/visox/metrics-panel";

export function Dashboard() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 p-4 max-w-480 mx-auto w-full">
        <div className="grid grid-cols-12 gap-4 auto-rows-min">
          {/* Row 1: Process Manager (full width) */}
          <div className="col-span-12">
            <ProcessManager />
          </div>

          {/* Row 2: CPU Scheduler (left) + Memory (right) */}
          <div className="col-span-12 lg:col-span-7">
            <CpuScheduler />
          </div>
          <div className="col-span-12 lg:col-span-5">
            <MemoryVisualizer />
          </div>

          {/* Row 3: Deadlock (left) + Metrics (right) */}
          <div className="col-span-12 lg:col-span-7">
            <DeadlockVisualizer />
          </div>
          <div className="col-span-12 lg:col-span-5">
            <MetricsPanel />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/30 py-2 px-4 text-center">
        <p className="text-[10px] text-muted-foreground">
          VISOX — Visual Interactive Simulator of Operating System Concepts • CSE323 Operating Systems Project
        </p>
        <p className="text-[10px] text-muted-foreground mt-1">
            Made with ❤️ by <a className="text-foreground hover-underline" href="https://github.com/aaban-saad" target="_blank" rel="noopener noreferrer">Aaban Saad</a>
        </p>
      </footer>
    </div>
  );
}
