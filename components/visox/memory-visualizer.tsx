"use client";

// ============================================================
// Module 3: Memory Management Visualizer
// ============================================================
// Vertical memory bar with colored blocks showing allocated
// memory and free holes with fragmentation visualization.
// ============================================================

import { HardDrive, Layers, Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useSim } from "@/lib/sim-store";
import { TOTAL_MEMORY } from "@/lib/constants";

export function MemoryVisualizer() {
  const { state, compactMemory } = useSim();
  const { memory, metrics } = state;

  const usedMB = metrics.totalMemoryUsed;
  const freeMB = TOTAL_MEMORY - usedMB - 64; // subtract OS reserved
  const frag = metrics.memoryFragmentation;
  const freeBlocks = memory.filter((b) => b.pid === null).length;

  return (
    <Card className="h-full">
      <CardHeader className="border-b pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm">Memory</CardTitle>
            <Badge variant="outline" className="text-[10px] h-4">
              {state.allocationStrategy.replace(/([A-Z])/g, " $1").trim()}
            </Badge>
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="size-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-60 text-xs">
                  <p className="font-medium mb-1">Memory Allocation:</p>
                  <ul className="space-y-0.5 text-muted-foreground">
                    <li><b>First Fit:</b> First large-enough hole</li>
                    <li><b>Best Fit:</b> Smallest adequate hole</li>
                    <li><b>Worst Fit:</b> Largest available hole</li>
                  </ul>
                  <p className="mt-1 text-muted-foreground">Compaction merges all free space into one contiguous block.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={compactMemory}
            disabled={freeBlocks <= 1}
            className="h-7 gap-1 text-xs"
          >
            <Layers className="size-3" />
            Compact
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-3 pb-2">
        <div className="flex gap-3">
          {/* Memory bar */}
          <div className="relative w-16 rounded-lg border border-border/50 overflow-hidden bg-muted/10 shrink-0" style={{ height: 280 }}>
            <AnimatePresence>
              {memory.map((block) => {
                const topPercent = (block.start / TOTAL_MEMORY) * 100;
                const heightPercent = (block.size / TOTAL_MEMORY) * 100;
                const isFree = block.pid === null;
                const isOS = block.pid === -1;

                return (
                  <motion.div
                    key={block.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className={`absolute left-0 right-0 flex items-center justify-center text-[9px] font-medium border-b border-background/30 ${
                      isFree
                        ? "bg-muted/20 text-muted-foreground/40"
                        : isOS
                          ? "bg-zinc-700/60 text-zinc-300"
                          : ""
                    }`}
                    style={{
                      top: `${topPercent}%`,
                      height: `${heightPercent}%`,
                      backgroundColor: !isFree && !isOS ? block.color + "35" : undefined,
                      color: !isFree && !isOS ? block.color : undefined,
                      minHeight: 2,
                    }}
                  >
                    {heightPercent > 5 && (
                      <span className="truncate px-0.5">
                        {isFree ? "free" : isOS ? "OS" : block.processName}
                      </span>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Address labels */}
            <div className="absolute -right-0.5 top-0 text-[8px] text-muted-foreground/40 translate-x-full px-1">0</div>
            <div className="absolute -right-0.5 bottom-0 text-[8px] text-muted-foreground/40 translate-x-full px-1">{TOTAL_MEMORY}</div>
          </div>

          {/* Memory stats */}
          <div className="flex-1 space-y-2.5">
            <StatRow
              icon={<HardDrive className="size-3" />}
              label="Used"
              value={`${usedMB} MB`}
              sub={`of ${TOTAL_MEMORY} MB`}
            />
            <StatRow
              icon={<Layers className="size-3" />}
              label="Free"
              value={`${freeMB} MB`}
              sub={`${freeBlocks} block${freeBlocks !== 1 ? "s" : ""}`}
            />

            {/* Fragmentation bar */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-muted-foreground">Fragmentation</span>
                <span className="text-[10px] font-medium">{frag.toFixed(1)}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    backgroundColor:
                      frag > 50 ? "#ef4444" : frag > 25 ? "#f59e0b" : "#10b981",
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(frag, 100)}%` }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                />
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-1 pt-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Legend</p>
              {memory
                .filter((b) => b.pid !== null && b.pid !== -1)
                .map((b) => (
                  <div key={b.id} className="flex items-center gap-1.5 text-[10px]">
                    <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: b.color }} />
                    <span className="truncate">{b.processName}</span>
                    <span className="text-muted-foreground ml-auto">{b.size}MB</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatRow({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground">{icon}</span>
      <div className="flex-1">
        <div className="flex items-baseline justify-between">
          <span className="text-[10px] text-muted-foreground">{label}</span>
          <span className="text-xs font-bold">{value}</span>
        </div>
        <p className="text-[9px] text-muted-foreground/60">{sub}</p>
      </div>
    </div>
  );
}
