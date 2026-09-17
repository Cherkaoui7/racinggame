# Cyberpunk Championship Racing

A high-performance, browser-based 3D racing game built with **React**, **Three.js (React Three Fiber)**, and **Zustand**. 

![Cyberpunk Championship Racing](https://raw.githubusercontent.com/pmndrs/react-three-fiber/master/docs/logo.svg)

## 🏁 Overview
**Cyberpunk Championship Racing** is a frontend-only 3D racing experience. Compete against AI drivers on a neon-lit track, battling for the best lap times and 1st place finishes. The game features an advanced performance scaling system, making it playable on both low-end integrated graphics and high-end gaming rigs without sacrificing the core aesthetic.

## ✨ Features
- **Real-Time 3D Racing**: Full 3D physics, steering, acceleration, and drifting mechanics.
- **AI Opponents**: Intelligent AI drivers with distance-based Level of Detail (LOD) culling to save CPU cycles when they are far away.
- **Dynamic Resolution Scaling (DRS)**: The game actively monitors your frame times and dynamically adjusts the internal WebGL resolution to maintain a target FPS (e.g., 40-60 FPS) without stuttering.
- **Lap Timing System**: Accurate millisecond-level lap tracking, recording your Best Lap and Total Race Time across 3-lap races.
- **Checkpoint Validation**: Robust anti-cheat checkpoint system ensures laps are only counted when the track is completed sequentially.
- **Customizable Graphics**: Low, Medium, and High graphics presets. High enables real-time shadows, post-processing bloom, and higher pixel ratios, while Low optimizes textures and disables heavy post-processing for maximum speed.
- **Immersive HUD**: A React-based, Tailwind-styled HUD featuring a real-time leaderboard, speedometer, minimap, and performance diagnostics panel.

## 🛠️ Tech Stack
- **Core**: React 18, TypeScript, Vite
- **3D Rendering**: Three.js, `@react-three/fiber`, `@react-three/drei`
- **Post-Processing**: `@react-three/postprocessing`
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
- **C**: Change Camera View (Chase, Hood, Cinematic)

## ⚙️ Performance Architecture
This project implements several advanced techniques to squeeze maximum performance out of the browser:
- **Instanced Meshes**: Track components like dashed lines and curbs are rendered as `InstancedMesh` to reduce WebGL draw calls from thousands down to single digits.
- **UI Decoupling**: The React UI strictly subscribes to granular state slices using Zustand selectors to prevent expensive React re-renders during 60FPS animation loops.
- **Backdrop-Blur Removal**: CSS backdrop filters have been carefully optimized or removed to prevent GPU bandwidth bottlenecks during WebGL compositing.

## 📝 License
This project is for educational and entertainment purposes.
