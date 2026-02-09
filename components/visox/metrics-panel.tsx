"use client";

// ============================================================
// Module 5: Metrics Panel
// ============================================================
// Real-time system statistics dashboard with animated counters
// and mini charts.
// ============================================================

import {
  Cpu,
  HardDrive,
  Users,
  AlertTriangle,
  ArrowLeftRight,
  Layers,
} from "lucide-react";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSim } from "@/lib/sim-store";
import { TOTAL_MEMORY } from "@/lib/constants";

export function MetricsPanel() {
  const { state } = useSim();
  const { metrics } = state;

  const memPercent = ((metrics.totalMemoryUsed / (TOTAL_MEMORY - 64)) * 100);

  return (
    <Card className="h-full">
      <CardHeader className="border-b pb-3">
        <CardTitle className="text-sm">System Metrics</CardTitle>
      </CardHeader>
      <CardContent className="pt-3 pb-2">
        <div className="grid grid-cols-2 gap-2.5">
          <MetricCard
            icon={<Users className="size-4" />}
            label="Active Processes"
            value={metrics.activeProcesses}
            color="#3b82f6"
          />
          <MetricCard
            icon={<AlertTriangle className="size-4" />}
            label="Deadlocked"
            value={metrics.deadlockedProcesses}
            color={metrics.deadlockedProcesses > 0 ? "#ef4444" : "#6b7280"}
            alert={metrics.deadlockedProcesses > 0}
          />
          <MetricCard
            icon={<Cpu className="size-4" />}
            label="CPU Utilization"
            value={`${metrics.cpuUtilization.toFixed(0)}%`}
            color="#10b981"
            bar={metrics.cpuUtilization}
          />
          <MetricCard
            icon={<ArrowLeftRight className="size-4" />}
            label="Context Switches"
            value={metrics.contextSwitches}
            color="#8b5cf6"
          />
          <MetricCard
            icon={<HardDrive className="size-4" />}
            label="Memory Used"
            value={`${metrics.totalMemoryUsed} MB`}
            color="#06b6d4"
            bar={memPercent}
          />
          <MetricCard
            icon={<Layers className="size-4" />}
            label="Fragmentation"
            value={`${metrics.memoryFragmentation.toFixed(1)}%`}
            color={
              metrics.memoryFragmentation > 50
                ? "#ef4444"
                : metrics.memoryFragmentation > 25
                  ? "#f59e0b"
                  : "#10b981"
            }
            bar={metrics.memoryFragmentation}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function MetricCard({
  icon,
  label,
  value,
  color,
  bar,
  alert,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
  bar?: number;
  alert?: boolean;
}) {
  return (
    <motion.div
      className={`rounded-lg border border-border/50 bg-muted/10 p-2.5 relative overflow-hidden ${
        alert ? "border-destructive/50" : ""
      }`}
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* Subtle color glow */}
      <div
        className="absolute top-0 right-0 w-12 h-12 rounded-full blur-2xl opacity-20"
        style={{ backgroundColor: color }}
      />

      <div className="flex items-center gap-2 mb-1.5">
        <span style={{ color }} className="opacity-80">
          {icon}
        </span>
        <span className="text-[10px] text-muted-foreground leading-none">{label}</span>
      </div>
      <div className="text-lg font-bold leading-none" style={{ color }}>
        {value}
      </div>

      {/* Mini progress bar */}
      {bar !== undefined && (
        <div className="mt-2 h-1 rounded-full bg-muted/30 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: color }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(bar, 100)}%` }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          />
        </div>
      )}

      {alert && (
        <motion.div
          className="absolute inset-0 rounded-lg border-2 border-destructive/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.5, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        />
      )}
    </motion.div>
  );
}
