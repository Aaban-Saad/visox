"use client";

// ============================================================
// Module 4: Deadlock Simulator & Resource Allocation Graph
// ============================================================
// Visual RAG with circles (processes) and squares (resources),
// directed edges for requests/allocations, and deadlock detection.
// ============================================================

import { useCallback, useMemo } from "react";
import { AlertTriangle, Shield, Lock, Unlock, Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useSim } from "@/lib/sim-store";
import { buildRAGEdges } from "@/lib/deadlock";
import { RESOURCE_IDS } from "@/lib/constants";
import { useState } from "react";

export function DeadlockVisualizer() {
  const {
    state,
    requestResource,
    releaseResource,
    detectDeadlock,
    resolveDeadlock,
  } = useSim();

  const [selectedPid, setSelectedPid] = useState<string>("");
  const [selectedResource, setSelectedResource] = useState<string>("");

  const activeProcesses = state.processes.filter(
    (p) => p.state !== "Terminated"
  );
  const hasDeadlock = state.deadlockedPids.size > 0;
  const edges = useMemo(() => buildRAGEdges(state.resources), [state.resources]);

  const handleRequest = useCallback(() => {
    if (selectedPid && selectedResource) {
      requestResource(Number(selectedPid), selectedResource);
    }
  }, [selectedPid, selectedResource, requestResource]);

  const handleRelease = useCallback(() => {
    if (selectedPid && selectedResource) {
      releaseResource(Number(selectedPid), selectedResource);
    }
  }, [selectedPid, selectedResource, releaseResource]);

  // Collect unique node IDs from edges + active resources/processes
  const processNodes = activeProcesses.map((p) => `P${p.pid}`);
  const resourceNodes = RESOURCE_IDS.map((r) => r);

  return (
    <Card className="h-full">
      <CardHeader className="border-b pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm">Deadlock</CardTitle>
            {hasDeadlock && (
              <Badge variant="destructive" className="text-[10px] h-4 gap-1 animate-pulse">
                <AlertTriangle className="size-2.5" />
                Detected
              </Badge>
            )}
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="size-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-65 text-xs">
                  <p className="font-medium mb-1">Resource Allocation Graph:</p>
                  <ul className="space-y-0.5 text-muted-foreground">
                    <li>⬤ Circle = Process</li>
                    <li>◼ Square = Resource</li>
                    <li>→ Request edge: process → resource</li>
                    <li>→ Assignment edge: resource → process</li>
                    <li>A cycle in the graph indicates <b>deadlock</b></li>
                  </ul>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={detectDeadlock}
              className="h-7 gap-1 text-xs"
            >
              <Shield className="size-3" />
              Detect
            </Button>
            {hasDeadlock && (
              <Button
                size="sm"
                variant="destructive"
                onClick={resolveDeadlock}
                className="h-7 gap-1 text-xs"
              >
                <AlertTriangle className="size-3" />
                Resolve
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-3 pb-2 space-y-3">
        {/* Resource Allocation Graph (SVG) */}
        <div className="rounded-lg border border-border/50 bg-muted/10 overflow-hidden" style={{ height: 200 }}>
          <RAGGraph
            processNodes={processNodes}
            resourceNodes={resourceNodes}
            edges={edges}
            deadlockedPids={state.deadlockedPids}
            processColors={Object.fromEntries(
              state.processes.map((p) => [`P${p.pid}`, p.color])
            )}
          />
        </div>

        {/* Controls */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Select value={selectedPid} onValueChange={setSelectedPid}>
              <SelectTrigger className="flex-1 h-7 text-xs">
                <SelectValue placeholder="Process" />
              </SelectTrigger>
              <SelectContent>
                {activeProcesses.map((p) => (
                  <SelectItem key={p.pid} value={String(p.pid)}>
                    <span className="flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-sm"
                        style={{ backgroundColor: p.color }}
                      />
                      P{p.pid} ({p.name})
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedResource} onValueChange={setSelectedResource}>
              <SelectTrigger className="w-20 h-7 text-xs">
                <SelectValue placeholder="Res" />
              </SelectTrigger>
              <SelectContent>
                {RESOURCE_IDS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleRequest}
              disabled={!selectedPid || !selectedResource}
              className="flex-1 h-7 gap-1 text-xs"
            >
              <Lock className="size-3" />
              Request
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRelease}
              disabled={!selectedPid || !selectedResource}
              className="flex-1 h-7 gap-1 text-xs"
            >
              <Unlock className="size-3" />
              Release
            </Button>
          </div>
        </div>

        {/* Resource table */}
        <div className="overflow-x-auto rounded-lg border border-border/50">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="bg-muted/30 text-muted-foreground">
                <th className="px-2 py-1 text-left font-medium">Resource</th>
                <th className="px-2 py-1 text-center font-medium">Total</th>
                <th className="px-2 py-1 text-center font-medium">Avail</th>
                <th className="px-2 py-1 text-left font-medium">Held By</th>
                <th className="px-2 py-1 text-left font-medium">Waited By</th>
              </tr>
            </thead>
            <tbody>
              {state.resources.map((r) => (
                <tr key={r.id} className="border-t border-border/30">
                  <td className="px-2 py-1 font-medium">{r.id}</td>
                  <td className="px-2 py-1 text-center">{r.total}</td>
                  <td className="px-2 py-1 text-center">{r.available}</td>
                  <td className="px-2 py-1 text-muted-foreground">
                    {r.heldBy.length > 0 ? r.heldBy.map((p) => `P${p}`).join(", ") : "—"}
                  </td>
                  <td className="px-2 py-1 text-muted-foreground">
                    {r.waitedBy.length > 0 ? r.waitedBy.map((p) => `P${p}`).join(", ") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── SVG Resource Allocation Graph ─────────────────────────

function RAGGraph({
  processNodes,
  resourceNodes,
  edges,
  deadlockedPids,
  processColors,
}: {
  processNodes: string[];
  resourceNodes: string[];
  edges: Array<{ from: string; to: string; type: "request" | "assignment" }>;
  deadlockedPids: Set<number>;
  processColors: Record<string, string>;
}) {
  const width = 400;
  const height = 200;

  // Layout: processes on left, resources on right
  const nodePositions: Record<string, { x: number; y: number }> = {};

  processNodes.forEach((id, i) => {
    const spacing = height / (processNodes.length + 1);
    nodePositions[id] = { x: 80, y: spacing * (i + 1) };
  });

  resourceNodes.forEach((id, i) => {
    const spacing = height / (resourceNodes.length + 1);
    nodePositions[id] = { x: width - 80, y: spacing * (i + 1) };
  });

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-full"
      style={{ minHeight: 200 }}
    >
      <defs>
        <marker
          id="arrowRequest"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b" />
        </marker>
        <marker
          id="arrowAssignment"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#10b981" />
        </marker>
        <marker
          id="arrowDeadlock"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
        </marker>
      </defs>

      {/* Edges */}
      <AnimatePresence>
        {edges.map((edge, i) => {
          const from = nodePositions[edge.from];
          const to = nodePositions[edge.to];
          if (!from || !to) return null;

          // Check if this edge involves deadlocked process
          const fromPid = edge.from.startsWith("P") ? Number(edge.from.slice(1)) : null;
          const toPid = edge.to.startsWith("P") ? Number(edge.to.slice(1)) : null;
          const isDeadlocked =
            (fromPid !== null && deadlockedPids.has(fromPid)) ||
            (toPid !== null && deadlockedPids.has(toPid));

          const markerId = isDeadlocked
            ? "arrowDeadlock"
            : edge.type === "request"
              ? "arrowRequest"
              : "arrowAssignment";

          const color = isDeadlocked
            ? "#ef4444"
            : edge.type === "request"
              ? "#f59e0b"
              : "#10b981";

          // Offset start/end to not overlap nodes
          const dx = to.x - from.x;
          const dy = to.y - from.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const offsetStart = 18;
          const offsetEnd = 18;

          const sx = from.x + (dx / dist) * offsetStart;
          const sy = from.y + (dy / dist) * offsetStart;
          const ex = to.x - (dx / dist) * offsetEnd;
          const ey = to.y - (dy / dist) * offsetEnd;

          return (
            <motion.line
              key={`${edge.from}-${edge.to}-${edge.type}-${i}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              x1={sx}
              y1={sy}
              x2={ex}
              y2={ey}
              stroke={color}
              strokeWidth={isDeadlocked ? 2.5 : 1.5}
              strokeDasharray={edge.type === "request" ? "5,3" : undefined}
              markerEnd={`url(#${markerId})`}
            />
          );
        })}
      </AnimatePresence>

      {/* Process nodes (circles) */}
      {processNodes.map((id) => {
        const pos = nodePositions[id];
        if (!pos) return null;
        const pid = Number(id.slice(1));
        const isDeadlocked = deadlockedPids.has(pid);
        const color = processColors[id] || "#6b7280";

        return (
          <motion.g key={id} initial={{ scale: 0 }} animate={{ scale: 1 }}>
            <circle
              cx={pos.x}
              cy={pos.y}
              r={16}
              fill={color + "25"}
              stroke={isDeadlocked ? "#ef4444" : color}
              strokeWidth={isDeadlocked ? 2.5 : 1.5}
            />
            {isDeadlocked && (
              <motion.circle
                cx={pos.x}
                cy={pos.y}
                r={16}
                fill="transparent"
                stroke="#ef4444"
                strokeWidth={2}
                initial={{ r: 16, opacity: 0.8 }}
                animate={{ r: 24, opacity: 0 }}
                transition={{ repeat: Infinity, duration: 1.2 }}
              />
            )}
            <text
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="central"
              className="text-[10px] font-bold fill-foreground"
            >
              {id}
            </text>
          </motion.g>
        );
      })}

      {/* Resource nodes (squares) */}
      {resourceNodes.map((id) => {
        const pos = nodePositions[id];
        if (!pos) return null;

        return (
          <motion.g key={id} initial={{ scale: 0 }} animate={{ scale: 1 }}>
            <rect
              x={pos.x - 14}
              y={pos.y - 14}
              width={28}
              height={28}
              rx={4}
              fill="oklch(0.274 0.006 286.033 / 0.5)"
              stroke="oklch(0.552 0.016 285.938)"
              strokeWidth={1.5}
            />
            <text
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="central"
              className="text-[10px] font-bold fill-foreground"
            >
              {id}
            </text>
          </motion.g>
        );
      })}

      {/* No nodes message */}
      {processNodes.length === 0 && (
        <text
          x={width / 2}
          y={height / 2}
          textAnchor="middle"
          dominantBaseline="central"
          className="text-[11px] fill-muted-foreground/50"
        >
          Add processes and request resources
        </text>
      )}
    </svg>
  );
}
