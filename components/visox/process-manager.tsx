"use client";

// ============================================================
// Module 1: Process State Visualizer
// ============================================================
// Kanban-style columns showing processes in each state.
// Animated transitions when processes change state.
// ============================================================

import { Plus, Trash2, Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useSim } from "@/lib/sim-store";
import type { ProcessState } from "@/lib/types";

const STATE_COLUMNS: { state: ProcessState; label: string; description: string; dotColor: string }[] = [
  { state: "New", label: "New", description: "Process just created, not yet admitted to ready queue", dotColor: "bg-blue-400" },
  { state: "Ready", label: "Ready", description: "Process loaded in memory, waiting for CPU", dotColor: "bg-yellow-400" },
  { state: "Running", label: "Running", description: "Process currently executing on the CPU", dotColor: "bg-emerald-400" },
  { state: "Waiting", label: "Waiting", description: "Process waiting for I/O or resource", dotColor: "bg-orange-400" },
  { state: "Terminated", label: "Done", description: "Process finished execution or killed", dotColor: "bg-red-400" },
];

export function ProcessManager() {
  const { state, addProcess, removeProcess } = useSim();

  return (
    <Card className="h-full">
      <CardHeader className="border-b pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm">Process States</CardTitle>
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="size-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-60 text-xs">
                  <p>Processes move through 5 states: New → Ready → Running → Terminated. A process may also enter Waiting state while blocked on I/O or resources.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Button size="sm" onClick={addProcess} className="h-7 gap-1 text-xs">
            <Plus className="size-3" />
            New Process
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-3 pb-2">
        <div className="grid grid-cols-5 gap-2 min-h-45">
          {STATE_COLUMNS.map((col) => {
            const procs = state.processes.filter((p) => p.state === col.state);
            return (
              <div key={col.state} className="flex flex-col">
                {/* Column header */}
                <div className="flex items-center gap-1.5 mb-2 px-1">
                  <span className={`w-2 h-2 rounded-full ${col.dotColor}`} />
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                    {col.label}
                  </span>
                  <Badge variant="secondary" className="ml-auto text-[10px] h-4 px-1.5">
                    {procs.length}
                  </Badge>
                </div>

                {/* Process cards */}
                <div className="flex-1 space-y-1.5 overflow-y-auto max-h-50 pr-0.5">
                  <AnimatePresence mode="popLayout">
                    {procs.map((proc) => (
                      <motion.div
                        key={proc.pid}
                        layout
                        initial={{ opacity: 0, scale: 0.8, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 10 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className="group relative rounded-lg border border-border/60 bg-muted/30 p-2 cursor-default hover:bg-muted/60 transition-colors"
                      >
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-sm shrink-0"
                            style={{ backgroundColor: proc.color }}
                          />
                          <span className="text-xs font-medium truncate">{proc.name}</span>
                          <span className="text-[10px] text-muted-foreground ml-auto">
                            P{proc.pid}
                          </span>
                        </div>
                        <div className="mt-1 flex gap-2 text-[10px] text-muted-foreground">
                          <span>B:{proc.burstTime}</span>
                          <span>A:{proc.arrivalTime}</span>
                          <span>Pr:{proc.priority}</span>
                        </div>
                        <div className="mt-0.5 text-[10px] text-muted-foreground">
                          Mem: {proc.memoryRequired}MB
                        </div>

                        {/* Terminate button */}
                        {col.state !== "Terminated" && (
                          <button
                            onClick={() => removeProcess(proc.pid)}
                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive/80 p-0.5"
                            title="Terminate process"
                          >
                            <Trash2 className="size-3" />
                          </button>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {procs.length === 0 && (
                    <div className="flex items-center justify-center h-16 text-[10px] text-muted-foreground/50">
                      empty
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
