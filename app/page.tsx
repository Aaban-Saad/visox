"use client";

import { SimProvider } from "@/lib/sim-store";
import { Dashboard } from "@/components/visox/dashboard";

export default function Page() {
  return (
    <SimProvider>
      <Dashboard />
    </SimProvider>
  );
}