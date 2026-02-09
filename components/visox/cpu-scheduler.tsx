"use client";

// ============================================================
// Module 2: CPU Scheduling & Gantt Chart
// ============================================================
// Live animated Gantt chart with scheduling metrics.
// ============================================================

import { Play, Info, Clock, Zap, ArrowLeftRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useSim } from "@/lib/sim-store";

export function CpuScheduler() {
  const { state, runScheduler } = useSim();
  const result = state.schedulingResult;
  const hasProcesses = state.processes.filter((p) => p.state !== "Terminated").length > 0;

  return (
    <Card className="h-full">
      <CardHeader className="border-b pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm">CPU Scheduling</CardTitle>
            <Badge variant="outline" className="text-[10px] h-4">
              {state.schedulingAlgorithm}
              {state.schedulingAlgorithm === "RoundRobin" && ` (Q=${state.timeQuantum})`}
            </Badge>
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="size-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-65 text-xs">
                  <p className="font-medium mb-1">Scheduling Algorithms:</p>
                  <ul className="space-y-0.5 text-muted-foreground">
                    <li><b>FCFS:</b> First process to arrive runs first</li>
                    <li><b>SJF:</b> Shortest burst time runs first</li>
                    <li><b>Priority:</b> Lowest priority number runs first</li>
                    <li><b>Round Robin:</b> Each process gets a time quantum</li>
                  </ul>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Button
            size="sm"
            onClick={runScheduler}
            disabled={!hasProcesses}
            className="h-7 gap-1 text-xs"
          >
            <Play className="size-3" />
            Run
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-3 pb-2 space-y-3">
        {/* Gantt Chart */}
        <div>
          <p className="text-[11px] text-muted-foreground mb-1.5 uppercase tracking-wider font-medium">
            Gantt Chart
          </p>
          <div className="rounded-lg border border-border/50 bg-muted/20 p-2 min-h-15 overflow-x-auto">
            {result && result.gantt.length > 0 ? (
              <div className="flex items-end gap-0.5" style={{ minWidth: "fit-content" }}>
                <AnimatePresence>
                  {result.gantt.map((block, i) => {
                    const width = Math.max((block.end - block.start) * 40, 36);
                    const isIdle = block.pid === null;
                    return (
                      <motion.div
                        key={`${block.pid}-${block.start}-${i}`}
                        initial={{ opacity: 0, scaleY: 0 }}
                        animate={{ opacity: 1, scaleY: 1 }}
                        transition={{ delay: i * 0.08, type: "spring", stiffness: 400, damping: 25 }}
                        className="flex flex-col items-center origin-bottom"
                      >
                        <div
                          className={`rounded-md flex items-center justify-center text-[10px] font-bold h-10 ${
                            isIdle ? "border-2 border-dashed border-muted-foreground/30" : ""
                          }`}
                          style={{
                            width,
                            backgroundColor: isIdle ? "transparent" : block.color + "30",
                            color: isIdle ? "var(--muted-foreground)" : block.color,
                            borderColor: isIdle ? undefined : block.color + "60",
                            borderWidth: isIdle ? undefined : 1,
                          }}
                        >
                          {isIdle ? "idle" : block.processName}
                        </div>
                        <div className="flex justify-between w-full mt-0.5 text-[9px] text-muted-foreground">
                          <span>{block.start}</span>
                          {i === result.gantt.length - 1 && <span>{block.end}</span>}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center justify-center h-10 text-xs text-muted-foreground/50">
                Click &quot;Run&quot; to simulate scheduling
              </div>
            )}
          </div>
        </div>

        {/* Metrics */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-3 gap-2"
          >
            <MetricChip
              icon={<Clock className="size-3" />}
              label="Avg Wait"
              value={`${result.avgWaitingTime.toFixed(1)}t`}
            />
            <MetricChip
              icon={<Zap className="size-3" />}
              label="CPU Util"
              value={`${result.cpuUtilization.toFixed(0)}%`}
            />
            <MetricChip
              icon={<ArrowLeftRight className="size-3" />}
              label="Ctx Switch"
              value={`${result.contextSwitches}`}
            />
          </motion.div>
        )}

        {/* Per-process table */}
        {result && result.processes.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <p className="text-[11px] text-muted-foreground mb-1 uppercase tracking-wider font-medium">
              Per-Process Metrics
            </p>
            <div className="overflow-x-auto rounded-lg border border-border/50">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="bg-muted/30 text-muted-foreground">
                    <th className="px-2 py-1.5 text-left font-medium">Process</th>
                    <th className="px-2 py-1.5 text-right font-medium">Arrival</th>
                    <th className="px-2 py-1.5 text-right font-medium">Burst</th>
                    <th className="px-2 py-1.5 text-right font-medium">Wait</th>
                    <th className="px-2 py-1.5 text-right font-medium">Turnaround</th>
                  </tr>
                </thead>
                <tbody>
                  {result.processes.map((p) => (
                    <tr key={p.pid} className="border-t border-border/30 hover:bg-muted/20">
                      <td className="px-2 py-1 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: p.color }} />
                        <span className="font-medium">{p.name}</span>
                      </td>
                      <td className="px-2 py-1 text-right text-muted-foreground">{p.arrivalTime}</td>
                      <td className="px-2 py-1 text-right text-muted-foreground">{p.burstTime}</td>
                      <td className="px-2 py-1 text-right">{p.waitingTime}</td>
                      <td className="px-2 py-1 text-right">{p.turnaroundTime}</td>
                    </tr>
                  ))}
                  <tr className="border-t border-border/50 bg-muted/20 font-medium">
                    <td className="px-2 py-1" colSpan={3}>Average</td>
                    <td className="px-2 py-1 text-right">{result.avgWaitingTime.toFixed(1)}</td>
                    <td className="px-2 py-1 text-right">{result.avgTurnaroundTime.toFixed(1)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}

function MetricChip({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/20 px-2.5 py-1.5">
      <span className="text-muted-foreground">{icon}</span>
      <div>
        <p className="text-[10px] text-muted-foreground leading-none">{label}</p>
        <p className="text-sm font-bold leading-tight">{value}</p>
      </div>
    </div>
  );
}
