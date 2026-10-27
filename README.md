# 🎯 FocusLens — AI Webcam Attention & Focus Telemetry

> **100% Client-Side AI Focus & Attention Tracker.** Powered by Google MediaPipe Face Landmarker via WebAssembly and WebGL. No video, audio, or biometric telemetry ever leaves your browser.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Ak-arsha/focuslens)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![Privacy: 100% Client-Side](https://img.shields.io/badge/Privacy-100%25%20On--Device-10B981.svg)](#privacy--security-architecture)
[![MediaPipe: Face Landmarker](https://img.shields.io/badge/MediaPipe-Tasks%20Vision-06B6D4.svg)](https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker)

---

## 🌟 Key Features

- **🔒 100% Private & Local Inference**: Face mesh, blendshape detection, and 3D pose matrix estimations run exclusively on your GPU/CPU via WebAssembly. Zero pixels uploaded to any server.
- **👁️ Eye Dynamics & Strain Telemetry**: Live EAR (Eye Aspect Ratio) monitoring, 60-second sliding-window blink counter (BPM), and digital eye-strain alerts.
- **📐 3D Head Orientation**: Real-time Yaw, Pitch, and Roll angles calculated from facial transformation matrices with one-click neutral pose calibration.
- **🧭 3x3 Gaze Vector Radar**: Real-time tracking of eye look vectors (Center, Left, Right, Up, Down, Corners) to detect screen engagement vs. environment distraction.
- **😴 Fatigue & Microsleep Radar**: Jaw-open yawn detector and prolonged eye-closure detection with actionable fatigue warnings.
- **⚡ Adaptive Live Focus Score**: Continuous 0–100 score dial reflecting deep flow state, drifting attention, and drowsiness.
- **⏱️ Smart Focus Sprints (Pomodoro & Ultradian)**: Configurable sprint durations (15m, 25m, 45m, 60m) with cycle counters.
- **🧘 Guided 4-7-8 Breathing & Eye Relief**: Automatic transition to guided box breathing cycles and the 20-20-20 eye strain relief exercise during breaks.
- **🎵 Built-in Ambient Soundscapes (Zero External Files)**: Pure Web Audio API synthesized procedural soundscapes:
  - **40 Hz Binaural Beat / Isochronic Flow Tone** (scientifically linked to cognitive focus)
  - **Calming Rain & Stream**
  - **Deep Brown Noise**
  - **Zen Chimes & Gentle Alerts**
- **📈 Interactive Session Timeline**: High-DPI canvas telemetry chart with second-by-second scrubbing tooltips.
- **📊 Data Exports & Shareable Cards**:
  - Export full telemetry to **CSV**
  - Export structured session logs to **JSON**
  - Generate formatted **Social Summary Cards** to copy into Slack, Discord, or X
- **🌓 Modern Cyber-Minimalist Theme**: Native Dark & Light modes with automatic system detection.

---

## 🏗️ Architecture

```
[ Webcam Feed (Browser getUserMedia) ]
                   │
                   ▼ (HTML5 <video> in memory)
[ Google MediaPipe Tasks Vision (WASM / WebGL) ]
                   │
      ┌────────────┼────────────┐
      ▼            ▼            ▼
[ 478 Landmarks ] [ Blendshapes ] [ 3D Transform Matrix ]
      │            │            │
      ▼            ▼            ▼
[ EAR & Blinks ] [ Gaze & Yawns ] [ Yaw, Pitch, Roll ]
      └────────────┬────────────┘
                   ▼
       [ Focus Score Engine ]
                   │
       ┌───────────┴───────────┐
       ▼                       ▼
[ Real-Time HUD Overlay ] [ Interactive Timeline & Storage ]
```

---

## 🚀 Quick Start (Local Development)

Because camera access requires a secure context (`https://` or `localhost`), run with any local static HTTP server:

### Option 1: Python (Built-in)
```bash
python -m http.server 3000
```
Then visit `http://localhost:3000` in Chrome, Edge, Brave, or Firefox.

### Option 2: Node.js (npx serve)
```bash
npx serve .
```

---

## ☁️ Deploy to Vercel

FocusLens is a zero-build static web application. It deploys instantly to Vercel:

### Deploy via Vercel CLI:
```bash
npm install -g vercel
vercel --prod
```

### Deploy via GitHub:
1. Push this repository to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new).
3. Import the `focuslens` repository.
4. Framework Preset: **Other** (Root directory: `.`, no build command needed).
5. Click **Deploy**.

---

## 🔒 Privacy & Security Guarantee

1. **Camera Stream**: Video is routed directly from `getUserMedia()` into a hidden/displayed DOM video element and passed directly to the WebAssembly runtime in JavaScript.
2. **Zero Cloud Telemetry**: FocusLens does not load tracking analytics, telemetry scripts, or remote logging.
3. **Local Storage**: Session history is saved exclusively in your browser's `localStorage` (`focuslens:history_v2`) and can be permanently deleted with the "Clear History" button.

---

## 📜 License

MIT License © 2026 FocusLens Contributors. Free for personal and commercial use.
