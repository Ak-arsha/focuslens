# FocusLens

> Private, on-device AI webcam telemetry for deep work, posture awareness, and digital eye strain prevention.

[Live Demo](https://focuslens-lilac.vercel.app) | [GitHub Repository](https://github.com/Ak-arsha/focuslens)

---

## Overview

FocusLens is a client-side computer vision application designed to help knowledge workers, developers, and students sustain high-quality attention while protecting their physical wellness.

Prolonged computer sessions often lead to unconscious attention drift, digital eye strain (asthenopia) caused by drastically reduced blink rates, and neck/back fatigue from poor ergonomics. Traditional computer vision tools attempt to address this by streaming webcam footage to cloud servers, introducing severe privacy and latency concerns.

FocusLens eliminates this compromise. Powered by Google MediaPipe Tasks Vision running locally via WebAssembly and WebGL, FocusLens processes every video frame in temporary browser memory. Video feeds, audio, and biometric metrics never leave your machine.

---

## Problem Statement and Objectives

### Problem Statement
1. **Unconscious Attention Drift**: Multitasking and environmental distractions break cognitive flow states without immediate feedback.
2. **Digital Eye Strain (Screen Staring Syndrome)**: Research indicates that computer users blink 66% less frequently when looking at digital displays, leading to dry eyes and ocular fatigue.
3. **Ergonomic Posture Decay**: Users tilt, turn, and slouch their heads over long hours without realizing their deviation from a neutral posture.
4. **Webcam Privacy Risks**: Cloud-based vision solutions require transmitting sensitive home or office video streams across the internet.

### Objectives
- Compute real-time biometric indicators (Eye Aspect Ratio, blink rate, 3D head pose, gaze vectors) purely on-device at 30 to 60 FPS.
- Provide objective, adaptive focus scoring (0 to 100) with non-intrusive feedback.
- Detect digital eye strain and drowsiness in real time using peer-reviewed facial landmark algorithms.
- Structure productivity into customizable focus sprints with guided 4-7-8 box breathing recovery breaks.
- Ensure 100% zero-knowledge data privacy with client-side execution and local persistence.

---

## Key Features

- **Dual Viewport Interface**: Toggle between Widescreen Studio View (with live AI mesh overlay and corner reticles) and Minimalist Circular Lens View.
- **Eye Dynamics and Blink Rate Telemetry**: Continuous measurement of Eye Aspect Ratio (EAR) and 60-second sliding-window Blinks Per Minute (BPM) with digital eye-strain warnings.
- **3D Head Pose Tracking**: Real-time calculation of Yaw (horizontal turn), Pitch (vertical tilt), and Roll (lateral lean) with one-click neutral baseline recalibration.
- **3x3 Gaze Vector Matrix**: Directional gaze detection determining whether attention is centered on-screen or directed off-screen.
- **Fatigue and Microsleep Detection**: Automatic identification of jaw opening (yawns) and prolonged eye closures (microsleeps) with dynamic risk level indicators.
- **Adaptive Flow Score Engine**: Continuous 0 to 100 score dial reflecting uninterrupted focus, drifting attention, or fatigue.
- **Configurable Focus Sprints**: Pomodoro-style sprints (15, 25, 45, or 60 minutes) with cycle counting and manual break triggers.
- **Guided Restorative Break Mode**: Box breathing companion (4s inhale, 7s hold, 8s exhale) combined with the 20-20-20 eye relief guide.
- **Procedural Ambient Soundscapes**: In-browser audio synthesized via the Web Audio API, including 40 Hz Binaural Beat (Gamma frequency focus), Calm Rain, and Deep Brown Noise.
- **Interactive Longitudinal Timeline**: High-DPI HTML5 canvas chart with mouse scrubbing tooltips displaying historical scores and states.
- **Session Data Portability**: Export complete second-by-second telemetry to CSV, download structured JSON session logs, or copy formatted text summary cards to clipboard.

---

## Tech Stack and Architecture

### Technology Stack
- **Languages**: HTML5, CSS3, JavaScript (ES6+ Modules)
- **Computer Vision Model**: Google MediaPipe Face Landmarker (v0.10.14)
- **Runtime Acceleration**: WebAssembly (WASM), WebGL, WebGPU
- **Audio Synthesis**: Native Web Audio API (OscillatorNode, BiquadFilterNode, StereoPannerNode, AudioBufferSourceNode)
- **Graphics & Visualization**: HTML5 Canvas API (High-DPI 2D Context)
- **Storage**: Client-Side HTML5 LocalStorage
- **Deployment & Hosting**: Vercel (Edge Network with Custom Permissions-Policy headers)

### System Architecture

The following diagram illustrates the end-to-end FocusLens pipeline, from webcam input and on-device facial landmark processing to real-time biometric analysis, adaptive focus scoring, and visualization. All video processing occurs locally in the browser.

![FocusLens System Architecture](docs/images/architecture.png)

---

## Demo and Interface

The application interface is divided into functional operational zones:

1. **Top Navigation**: Live connection status pill, real-time AI HUD toggle, sound effects toggle, neutral pose calibration, privacy documentation, and dark/light mode toggle.
2. **Camera Studio Stage**: Webcam viewport supporting Studio and Lens modes, FPS and face detection indicators, sprint countdown clock, duration chips (15m, 25m, 45m, 60m), and session controls.
3. **Biometrics Command Center**: Central 0 to 100 focus score dial, dynamic state headline, and four metric cards: Eye Dynamics, Gaze Vector, Fatigue Radar, and 3D Head Pose sliders.
4. **Ambient Soundscape Deck**: Procedural sound selector with volume control and live percentage readouts.
5. **Interactive Telemetry Timeline**: Second-by-second focus score graph with hover scrubbers and KPI stat boxes (Session Duration, Longest Flow Streak, Longest Distraction, Mean Score).
6. **Historical Archive**: Local session logs showing date, duration, flow percentage, average score, and letter grade ratings.

Live URL: [https://focuslens-lilac.vercel.app](https://focuslens-lilac.vercel.app)

---

## Project Structure

```text
focuslens/
├── docs/
│   └── images/
│       └── architecture.png
├── .gitignore          # Git exclusion rules (build artifacts, .vercel)
├── LICENSE             # MIT Open Source License
├── README.md           # Comprehensive project documentation
├── app.js              # Application logic, MediaPipe loop, Web Audio, charting
├── index.html          # Semantic HTML5 application structure and accessible dialogs
├── style.css           # Modern CSS design system, typography, animations, responsive rules
└── vercel.json         # Vercel deployment configuration, clean URLs, Permissions-Policy
```

---

## Installation and Setup

### Prerequisites
- A modern web browser supporting WebGL (Google Chrome, Microsoft Edge, Brave, Mozilla Firefox, or Apple Safari).
- A functional webcam.
- A local HTTP server (camera access via `getUserMedia` requires a secure origin: `localhost` or `https://`).

### Cloning the Repository
```bash
git clone https://github.com/Ak-arsha/focuslens.git
cd focuslens
```

### Running Locally

Because FocusLens is a zero-build static application, you can start it immediately using any lightweight static server:

#### Option A: Using Python (Recommended)
```bash
python -m http.server 3000
```
Open your browser and visit: `http://localhost:3000`

#### Option B: Using Node.js (via npx serve)
```bash
npx serve .
```

#### Option C: Using VS Code Live Server
Right-click `index.html` inside VS Code and select **Open with Live Server**.

---

## Usage and Workflow

1. **Activate the Camera**: Click **Start Camera Session**. Grant the browser permission to access your webcam when prompted.
2. **Calibrate Neutral Baseline**: Sit in your normal working posture approximately 50 to 70 cm from the monitor, look at the center of your screen, and click **Recenter** (or the **Calibrate** button in the header).
3. **Set Sprint Duration**: Select your preferred sprint length (15m, 25m, 45m, or 60m) using the chips in the sprint controller.
4. **Select Ambient Soundscape (Optional)**: Choose an ambient background mode (40Hz Binaural Flow, Calm Rain, or Deep Brown Noise) and adjust the volume slider.
5. **Work in Flow**: FocusLens continuously measures your engagement. If your head turns away or eyes close for prolonged periods, a gentle notification chime sounds.
6. **Take Restorative Breaks**: When your sprint ends (or upon clicking **Take Break**), follow the 4-7-8 breathing circle and look 20 feet away for 20 seconds.
7. **End and Export**: Click **End Session** to store the run in your local history. Export raw metrics via **Export CSV** or **Export JSON**.

---

## Results and Evaluation

### 1. Eye Aspect Ratio (EAR) Calculation
Eye openness is calculated geometrically across six facial landmark coordinates per eye:

$$\text{EAR} = \frac{\|\mathbf{p}_2 - \mathbf{p}_6\| + \|\mathbf{p}_3 - \mathbf{p}_5\|}{2 \|\mathbf{p}_1 - \mathbf{p}_4\|}$$

- **Normal Open Eye**: $\text{EAR} \ge 0.22$
- **Blink Threshold**: $\text{EAR} < 0.19$ (registered when closure duration is between 45 ms and 450 ms)
- **Microsleep / Eye Closure**: $\text{EAR} < 0.19$ sustained for $> 1000\text{ ms}$

### 2. 3D Head Pose Orientation
Extracted from the 4x4 facial transformation matrix $\mathbf{M}$ provided by the MediaPipe pipeline:

$$\text{Yaw} = \text{atan2}(M_{2,0}, M_{2,2}) \times \frac{180}{\pi}$$

$$\text{Pitch} = \text{atan2}(-M_{2,1}, \sqrt{M_{2,0}^2 + M_{2,2}^2}) \times \frac{180}{\pi}$$

$$\text{Roll} = \text{atan2}(M_{0,1}, M_{1,1}) \times \frac{180}{\pi}$$

To eliminate jitter while maintaining responsiveness, an exponential moving average (EMA) smoothing filter with $\alpha = 0.35$ is applied across consecutive frames:

$$\mathbf{S}_t = \alpha \mathbf{X}_t + (1 - \alpha) \mathbf{S}_{t-1}$$

### 3. Focus Score Dynamics
The live focus score $S \in [0, 100]$ smoothly interpolates toward a state target score ($T_{\text{focused}} = 100$, $T_{\text{distracted}} = 38$, $T_{\text{drowsy}} = 10$) using an adaptive exponential transition:

$$S_{t} = S_{t-1} + (T - S_{t-1}) \times \min\left(1, \frac{\Delta t}{1500}\right)$$

### 4. Frame Rate and Hardware Benchmarks
- **Average Inference Latency**: 16 ms to 32 ms per frame on standard integrated GPUs (Intel Iris Xe / AMD Radeon Vega).
- **Sustained Frame Rate**: 30 to 60 FPS in modern Chromium and WebKit browsers.
- **Memory Footprint**: ~65 MB to 95 MB browser memory overhead.

---

## Security, Limitations and Future Scope

### Security and Privacy Protections
- **Zero Cloud Transmission**: All inference is executed locally through compiled WebAssembly binary modules.
- **Permissions-Policy Configuration**: The deployment includes strict security headers:
  ```json
  { "key": "Permissions-Policy", "value": "camera=(self)" },
  { "key": "X-Content-Type-Options", "value": "nosniff" },
  { "key": "X-Frame-Options", "value": "SAMEORIGIN" }
  ```
- **Local Persistence**: Data is saved only in browser `localStorage`. No analytics cookies or tracking pixels are included.

### Known Limitations
- Requires sufficient ambient facial illumination to detect landmarks reliably.
- Rapid head movements exceeding 60 degrees from center may temporarily lose facial tracking.
- Heavy prescription eyeglasses with strong reflections can slightly dampen Eye Aspect Ratio precision.

### Future Scope
- Multi-camera input device selection dropdown.
- Weekly and monthly aggregated trend analytics with CSV bulk import.
- Integration with desktop Notification API for background alerts during full-screen external workflows.
- WebGPU backend acceleration optimization for next-generation mobile browsers.

---

## Contributing

Contributions are welcomed. To contribute:

1. Fork the repository on GitHub.
2. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Commit your changes with clear, descriptive commit messages:
   ```bash
   git commit -m "feat: describe your change"
   ```
4. Push to your branch:
   ```bash
   git push origin feature/your-feature-name
   ```
5. Open a Pull Request on the main repository.

---

## License

This project is licensed under the terms of the [MIT License](LICENSE). Free for academic, personal, and commercial use.

---

## Contact

- **Maintainer**: [Ak-arsha](https://github.com/Ak-arsha)
- **Repository**: [https://github.com/Ak-arsha/focuslens](https://github.com/Ak-arsha/focuslens)
- **Live Demo**: [https://focuslens-lilac.vercel.app](https://focuslens-lilac.vercel.app)
