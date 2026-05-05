# VISOX — Visual Interactive Simulator of Operating System Concepts

VISOX is an educational, visual, and interactive Operating System simulator. It is designed to transform abstract OS concepts into real-time, animated client-side simulations. Built with Next.js, Tailwind CSS, and Framer Motion, it offers a modular dashboard to explore process behavior, CPU scheduling, memory allocation, and deadlocks.

## 🌐 Live Demo

**Play with the live simulator here:** [visox-sim.vercel.app](https://visox-sim.vercel.app)

## 🎥 Video Demo

[![Video Title](https://img.youtube.com/vi/IrulR8KtKbw/0.jpg)](https://www.youtube.com/watch?v=IrulR8KtKbw)

## 🛠 Technologies Used

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS & Shadcn UI
- **Animations:** Motion (Framer Motion)
- **Icons:** Lucide React

## ✨ Features

- **Process Management**: Visualize process lifecycles (New, Ready, Running, Waiting, Terminated) in a Kanban-style board with animated transitions.
- **CPU Scheduling**: Live Gantt chart generation for various algorithms including FCFS, SJF, Priority, and Round Robin. Tracks wait times, turnaround times, and context switches.
- **Memory Management**: Simulates main memory allocation with First Fit, Best Fit, and Worst Fit strategies. Features fragmentation visualization and memory compaction tools.
- **Deadlock Simulation**: Real-time Resource Allocation Graph (RAG) simulation detecting circular wait and highlighting deadlocks.

## 🚀 Getting Started

First, install the dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

Then, run the development server:



```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```