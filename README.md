# 🎯 FocusLens — AI Focus & Attention Studio

<p align="center">
  <strong>Private, on-device AI webcam telemetry for deep work, posture awareness, and digital eye strain prevention.</strong>
</p>

<p align="center">
  <a href="https://focuslens-lilac.vercel.app"><img src="https://img.shields.io/badge/Live%20Demo-focuslens.vercel.app-10B981?style=for-the-badge&logo=vercel" alt="Live Demo"></a>
  <a href="https://github.com/Ak-arsha/focuslens"><img src="https://img.shields.io/badge/GitHub-Repository-06B6D4?style=for-the-badge&logo=github" alt="GitHub Repo"></a>
  <img src="https://img.shields.io/badge/Privacy-100%25%20On--Device-10B981?style=for-the-badge" alt="100% On-Device Privacy">
  <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="MIT License">
</p>

---

## 📖 Table of Contents
- [What is FocusLens?](#-what-is-focuslens)
- [Why FocusLens?](#-why-focuslens)
- [Key Features](#-key-features)
- [Biometrics & Telemetry Guide](#-biometrics--telemetry-guide)
- [How It Works (Architecture)](#-how-it-works-architecture)
- [Quick Start (Local Setup)](#-quick-start-local-setup)
- [Deployment on Vercel](#-deployment-on-vercel)
- [Privacy & Security Guarantee](#-privacy--security-guarantee)
- [Browser Compatibility](#-browser-compatibility)
- [Contributing & License](#-contributing--license)

---

## 💡 What is FocusLens?

**FocusLens** is a client-side productivity studio that turns your webcam into an intelligent focus and wellness tracker. Using Google's **MediaPipe Face Landmarker** running directly inside your browser via **WebAssembly (WASM)** and **WebGL**, FocusLens continuously measures your engagement, blink rate, head posture, and fatigue level.

**Crucially, not a single frame of video ever leaves your computer.** Everything is computed in local browser memory and discarded immediately after processing.

---

## ⚡ Why FocusLens?

| Challenge | How FocusLens Solves It |
| :--- | :--- |
| **Attention Drift** | Real-time 0–100 score dial and gentle audio chimes alert you when your attention drifts off-screen. |
| **Digital Eye Strain** | Tracks your **Blinks per Minute (BPM)** and Eye Aspect Ratio (EAR), notifying you when blink rates drop below healthy baselines. |
| **Poor Ergonomics / Slouching** | Real-time **3D Head Pose tracking** (Yaw, Pitch, Roll) helps maintain optimal centered screen posture. |
| **Mental Fatigue & Burnout** | Automatic jaw-opening yawn detection and microsleep tracking alert you when energy drops. |
| **Overworking Without Breaks** | Integrated **Pomodoro Sprint Engine** paired with a guided **4-7-8 Box Breathing circle** and **20-20-20 eye relief exercises**. |
| **Privacy Concerns with Webcam AI** | **Zero cloud streaming.** Zero server APIs. Zero tracking cookies. Works even without an internet connection once loaded. |

---

## 🚀 Key Features

### 1. Dual Camera View Modes
- **Studio View (Default)**: Widescreen camera view with futuristic HUD reticles, live face landmark mesh points, and iris tracking crosshairs.
- **Lens View**: Minimalist circular biometric lens with an animated radial focus ring that smoothly fills and shifts color based on your score.

### 2. Comprehensive Biometric Dashboard
- **Eye Dynamics**: Real-time Eye Aspect Ratio (EAR) gauge, 60-second sliding-window blink counter, and eye-strain alerts.
- **3D Head Orientation**: Visual Yaw (left/right turn), Pitch (up/down tilt), and Roll (lateral lean) sliders with a one-click **Recenter** calibration button.
- **3x3 Gaze Vector Radar**: Visual quadrant heat matrix indicating whether your gaze is directed at your work or looking away.
- **Fatigue Radar**: Automatic yawn counter and prolonged eye-closure detector (microsleeps) with actionable energy risk ratings.

### 3. Integrated Focus Sprints (Pomodoro & Ultradian)
- Quick duration selection chips: **15 min** (Quick sprint), **25 min** (Pomodoro), **45 min** (Deep Work), or **60 min** (Flow Marathon).
- Clear digital timer display, sprint cycle counter (`Cycle #1`, `Cycle #2`), and a manual **"Take Break"** button for quick resets.

### 4. Restorative Guided Break Mode
- When a sprint finishes, FocusLens automatically opens a calm break screen featuring:
  - **4-7-8 Box Breathing Orb**: An animated breathing companion that guides you through Inhale (4s), Hold (7s), and Exhale (8s) phases.
  - **20-20-20 Rule Guide**: Reminds you to focus on an object at least 20 feet (6m) away for 20 seconds to relax ciliary eye muscles.

### 5. Procedural Ambient Soundscapes (Web Audio API)
- Pure synthesized audio generated in real-time without external audio downloads:
  - 🧠 **40 Hz Binaural Beat / Isochronic Flow**: Gamma-wave frequency scientifically associated with cognitive focus and memory retention.
  - 🌧️ **Calm Rain & Stream**: Filtered pink noise with natural droplet modulations.
  - ☕ **Deep Brown Noise**: Low-frequency acoustic warmth for masking environmental room chatter.
  - 🔇 **Mute / Silent**: Instant audio cutoff.
  - Live volume slider with real-time percentage feedback.

### 6. Interactive Telemetry Timeline & Analytics
- **High-DPI Canvas Chart**: Second-by-second continuous focus score graph with smoothed area fills.
- **Interactive Scrubbing**: Hover or drag your mouse across the graph to inspect exact timestamps, scores, and attention states.
- **KPI Metrics**: Session Duration, Longest Unbroken Flow Streak, Longest Distraction Drift, and Mean Score with Letter Grades (**Grade S**, **Grade A**, **Grade B**, **Grade C**).
- **Distribution Bar**: Visual percentage breakdown of time spent in Flow vs. Distracted vs. Fatigued.

### 7. Data Portability & Social Sharing
- **Export CSV**: Complete second-by-second raw telemetry (`timestamp`, `score`, `state`, `ear`).
- **Export JSON**: Structured session summary with full metadata.
- **Shareable Focus Card**: Formats a clean, readable text summary to paste into Slack, Discord, LinkedIn, or X.
- **Local History**: Finished sessions over 10 seconds are saved to your browser's private `localStorage` with a 1-click wipe option.

---

## 📊 Biometrics & Telemetry Guide

Understanding the metrics displayed on your dashboard:

| Metric | What It Measures | Target Healthy Range | What It Means |
| :--- | :--- | :--- | :--- |
| **Focus Score** | Overall attention rating (0–100) | `80 – 100` | Combines eye openness, centered head orientation, and screen gaze into an adaptive score. |
| **EAR (Eye Openness)** | Eye Aspect Ratio | `0.22 – 0.35` | The geometric ratio of eye height to eye width. Values below `0.19` indicate closed eyes / blinking. |
| **Blink Rate (BPM)** | Blinks per minute (60s window) | `12 – 22 BPM` | Normal resting blink rate. Values under `10 BPM` indicate digital staring and dry eye risk. |
| **Yaw (Turn)** | Horizontal head rotation | `-15° to +15°` | Indicates if your head is facing your monitor or turned away toward your phone/room. |
| **Pitch (Tilt)** | Vertical head tilt | `-12° to +15°` | Detects slouching (head tilted down) or excessive ceiling tilt. |
| **Gaze Vector** | Eye iris direction relative to eye corners | `Center` | Highlights which screen quadrant your eyes are pointed toward. |
| **Yawns & Microsleeps** | Jaw opening & closed eye durations | `0 detected` | Flags physiological drowsiness so you can step away before fatigue impairs your work. |

---

## 🏗️ How It Works (Architecture)

```
┌────────────────────────────────────────────────────────┐
│               Client-Side Browser Environment           │
│                                                        │
│  [ Webcam Video Stream (HTML5 getUserMedia) ]          │
│                       │                                │
│                       ▼                                │
│  [ Google MediaPipe Tasks Vision (WASM / WebGL) ]      │
│                       │                                │
│        ┌──────────────┼──────────────┐                 │
│        ▼              ▼              ▼                 │
│  [478 Landmarks] [Blendshapes] [3D Matrix]             │
│        │              │              │                 │
│        ▼              ▼              ▼                 │
│  [EAR & Blinks]  [Gaze & Jaw]   [Yaw/Pitch/Roll]       │
│        └──────────────┬──────────────┘                 │
│                       ▼                                │
│          [ Adaptive Scoring Engine ]                   │
│                       │                                │
│       ┌───────────────┴───────────────┐                │
│       ▼                               ▼                │
│  [ Real-Time HUD ]          [ Interactive Timeline ]   │
│  [ Web Audio Synthesizer ]  [ LocalStorage & Export ]  │
│                                                        │
│             ⛔ ZERO DATA EVER SENT OVER NETWORK ⛔       │
└────────────────────────────────────────────────────────┘
```

---

## 💻 Quick Start (Local Setup)

Because camera access requires a secure browser origin (`localhost` or `https://`), run FocusLens using any local static server:

### Option 1: Python (Recommended — Preinstalled on most machines)
```bash
# From the project directory:
python -m http.server 3000
```
Open your browser and navigate to:
```
http://localhost:3000
```

### Option 2: Node.js (via npx)
```bash
npx serve .
```

### Option 3: VS Code Live Server
1. Open the folder in VS Code.
2. Click **Go Live** on the bottom status bar (using the Live Server extension).

---

## ☁️ Deployment on Vercel

FocusLens is a zero-build static application that deploys in seconds.

### Deploy with 1-Click
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Ak-arsha/focuslens)

### Deploy via Vercel CLI
```bash
npm install -g vercel
vercel --prod
```

### Deploy via GitHub Integration
1. Push this repository to your GitHub account:
   ```bash
   git push origin main
   ```
2. Navigate to [vercel.com/new](https://vercel.com/new).
3. Import the `focuslens` repository.
4. Leave settings as default (Framework: **Other**, Output directory: `.`).
5. Click **Deploy**. Vercel will automatically provision a secure HTTPS domain with the included `Permissions-Policy: camera=(self)` header.

---

## 🔒 Privacy & Security Guarantee

FocusLens was built from the ground up around strict privacy principles:
- **No Video Recording**: Video frames are analyzed in temporary memory and immediately discarded.
- **Zero Cloud Transmission**: No video, audio, or biometric telemetry is sent to any server, database, or analytics platform.
- **Local-Only Storage**: Session records exist solely in your browser's private `localStorage` (`focuslens:history_v2`).
- **No Third-Party Trackers**: No Google Analytics, advertising cookies, or behavioral trackers.

---

## 🌐 Browser Compatibility

| Browser | Status | Hardware Acceleration |
| :--- | :--- | :--- |
| **Google Chrome** | ✅ Supported (Optimal) | Full WebGL & WebGPU Support |
| **Microsoft Edge** | ✅ Supported (Optimal) | Full WebGL Support |
| **Brave** | ✅ Supported | Full WebGL Support |
| **Mozilla Firefox** | ✅ Supported | WebGL Support |
| **Apple Safari** | ✅ Supported (macOS/iOS 16+) | WebGL Support |

> **Note**: For the best performance and highest frame rates (30–60 FPS), ensure hardware acceleration is enabled in your browser settings.

---

## 📜 Contributing & License

Contributions, feedback, and feature suggestions are welcome! Feel free to open an issue or submit a pull request on the [GitHub repository](https://github.com/Ak-arsha/focuslens).

Released under the **[MIT License](LICENSE)**. Free for personal, academic, and commercial use.
