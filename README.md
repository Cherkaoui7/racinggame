# Cyberpunk Championship Racing

A high-performance, browser-based 3D racing game built with **React**, **Three.js (React Three Fiber)**, and **Zustand**. 

![Cyberpunk Championship Racing](https://raw.githubusercontent.com/pmndrs/react-three-fiber/master/docs/logo.svg)

## 🏁 Overview
**Cyberpunk Championship Racing** is a frontend-only 3D racing experience. Compete against AI drivers on a neon-lit track, battling for the best lap times and 1st place finishes. The game features an advanced performance scaling system, making it playable on both low-end integrated graphics and high-end gaming rigs without sacrificing the core aesthetic. The game includes a fully functional Garage, customizable vehicles, and AAA-style racing UI.

## ✨ Features
- **Real-Time 3D Racing**: Full 3D physics, steering, acceleration, and drifting mechanics.
- **AI Opponents**: Intelligent AI drivers with distance-based Level of Detail (LOD) culling to save CPU cycles when they are far away.
- **Dynamic Resolution Scaling (DRS)**: The game monitors frame times and safely downgrades the graphics tier if performance struggles, ensuring smooth frame rates without WebGL context flashing.
- **Lap Timing System**: Accurate millisecond-level lap tracking, recording your Best Lap and Total Race Time across 3-lap races.
- **Checkpoint Validation**: Robust anti-cheat checkpoint system ensures laps are only counted when the track is completed sequentially.
- **Customizable Graphics**: Low, Medium, and High graphics presets. High enables real-time shadows, post-processing bloom, and higher pixel ratios, while Low optimizes textures and disables heavy post-processing for maximum speed.
- **Immersive HUD**: A React-based, Tailwind-styled HUD featuring a real-time leaderboard, speedometer, minimap, and performance diagnostics panel.
- **AAA Results Screen**: A beautifully designed, cyberpunk-themed post-race results screen displaying comprehensive race telemetry (Total Time, Best Lap, Top Speed, Nitro Uses, Longest Drift).
- **Dynamic Lighting & Aesthetics**: Real-time vehicle headlights that illuminate the track. Tail lights glow bright red when braking, and emit white light when reversing. Model geometries are perfectly aligned using spatial heuristics.
- **Physics Safety Engine**: The physics simulation is deeply sanitized against floating-point anomalies (NaN). The camera and AI vehicles implement rigorous fail-safes during frame drops to prevent physics explosions and world corruption.
- **360° Interactive Garage**: Preview your car in a stylized garage environment. Rotate the camera, inspect details, and customize your vehicle's paint job (Purple, Red, Green).
- **Procedural Body Kits**: Upgrade your car with aerodynamic components like front splitters and GT racing spoilers that attach perfectly to the vehicle chassis.
- **Performance Optimized**: Built strictly using Zustand atomic selectors to completely decouple the 60FPS WebGL render loop from React's Virtual DOM reconciliation.

## 🛠️ Tech Stack
- **Core**: React 18, TypeScript, Vite
- **3D Rendering**: Three.js, `@react-three/fiber`, `@react-three/drei`
- **Post-Processing**: `@react-three/postprocessing`
- **Physics**: Simulation math handled efficiently via `useFrame` updates.
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

## 🚀 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd racing
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:5173`.

## 🎮 Controls
- **W / Up Arrow**: Accelerate
- **S / Down Arrow**: Brake / Reverse
- **A / Left Arrow**: Steer Left
- **D / Right Arrow**: Steer Right
- **Shift**: Nitro / Boost
- **Space**: E-Brake / Drift
- **C**: Change Camera View (Chase, Hood, Cinematic)
- **R**: Respawn Vehicle

## ⚙️ Performance Architecture
This project implements several advanced techniques to squeeze maximum performance out of the browser:
- **Instanced Meshes**: The entire city backdrop, skyscrapers, antennas, dashed lines, and curbs are rendered as `InstancedMesh`. This reduced WebGL draw calls from ~500 down to ~15.
- **Zero React Re-renders**: The React UI strictly subscribes to granular state slices using Zustand selectors (`useGameStore(state => state.property)`) rather than destructured objects. This prevents React from choking the main thread during 120Hz physical simulation updates.
- **Memory Allocation**: Physical vectors, quaternions, and matrices are instantiated exactly once using a shared `createScratch()` helper pattern, eliminating Garbage Collection (GC) pauses during gameplay.
- **Dynamic DPR**: The game uses a `PerformanceGovernor` to dynamically throttle `devicePixelRatio` during intense GPU scenes.

## 🛡️ Security & Anti-Cheat
As a frontend-only browser game, server-side authoritative physics are impossible. However, the game implements several strict anti-tamper measures to prevent casual client-side manipulation:
- **Console Obfuscation**: The global `console.log`, `info`, and `warn` methods are swallowed in production to prevent hackers from reverse-engineering the state or reading telemetry.
- **Context Menu Lock**: The `oncontextmenu` event is globally blocked, preventing users from casually inspecting elements to manipulate the DOM or Canvas.
- **Closed WebGL Backdoors**: The Three.js WebGL context is strictly encapsulated within React Three Fiber, ensuring hackers cannot hook into the renderer via the browser console to extract assets or manipulate the camera matrix.
- **Checkpoint Validation**: The lap timing system verifies sequential checkpoint completion to ensure players cannot trigger the finish line early.

## 📝 License
This project is for educational and entertainment purposes.
