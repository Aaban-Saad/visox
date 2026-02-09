"use client";

import { Activity, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSim } from "@/lib/sim-store";
import type { SchedulingAlgorithm, AllocationStrategy } from "@/lib/types";

export function Header() {
  const { state, dispatch, resetAll } = useSim();

  return (
    <header className="border-b border-border/50 bg-card/50 backdrop-blur-md sticky top-0 z-50">
      <div className="mx-auto flex items-center justify-between px-4 py-3 max-w-480">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-primary/20 text-primary">
            <Activity className="size-5" />
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight leading-none">
              VISOX
            </h1>
            <p className="text-[11px] text-muted-foreground leading-tight">
              Visual OS Simulator
            </p>
          </div>
        </div>

        {/* Algorithm Selectors */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:inline">CPU:</span>
            <Select
              value={state.schedulingAlgorithm}
              onValueChange={(v) =>
                dispatch({ type: "SET_SCHEDULING_ALGORITHM", algorithm: v as SchedulingAlgorithm })
              }
            >
              <SelectTrigger className="w-32.5 h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FCFS">FCFS</SelectItem>
                <SelectItem value="SJF">SJF</SelectItem>
                <SelectItem value="Priority">Priority</SelectItem>
                <SelectItem value="RoundRobin">Round Robin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:inline">Memory:</span>
            <Select
              value={state.allocationStrategy}
              onValueChange={(v) =>
                dispatch({ type: "SET_ALLOCATION_STRATEGY", strategy: v as AllocationStrategy })
              }
            >
              <SelectTrigger className="w-30 h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FirstFit">First Fit</SelectItem>
                <SelectItem value="BestFit">Best Fit</SelectItem>
                <SelectItem value="WorstFit">Worst Fit</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {state.schedulingAlgorithm === "RoundRobin" && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Q:</span>
              <Select
                value={String(state.timeQuantum)}
                onValueChange={(v) =>
                  dispatch({ type: "SET_TIME_QUANTUM", quantum: Number(v) })
                }
              >
                <SelectTrigger className="w-15 h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((q) => (
                    <SelectItem key={q} value={String(q)}>
                      {q}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button variant="ghost" size="icon-sm" onClick={resetAll} title="Reset All">
            <RotateCcw className="size-3.5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
