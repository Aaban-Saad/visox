# VISOX — Visual Interactive Simulator of Operating System Concepts

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

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

- **⚙️ Process Management**: Visualize process lifecycles (New, Ready, Running, Waiting, Terminated) in a Kanban-style board with animated transitions.
- **⏱️ CPU Scheduling**: Live Gantt chart generation for various algorithms including FCFS, SJF, Priority, and Round Robin. Tracks wait times, turnaround times, and context switches.
- **🧠 Memory Management**: Simulates main memory allocation with First Fit, Best Fit, and Worst Fit strategies. Features fragmentation visualization and memory compaction tools.
- **🔒 Deadlock Simulation**: Real-time Resource Allocation Graph (RAG) simulation detecting circular wait and highlighting deadlocks.

## 🚀 Getting Started

First, clone the repository and install the dependencies:

```bash
npm install
# or yarn / pnpm / bun
```

Then, run the development server:

```bash
npm run dev
# or yarn dev / pnpm dev / bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page if you want to contribute.

## 📝 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.
