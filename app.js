import { FaceLandmarker, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs";

/* ==========================================================================
   DOM Helper & Constants
   ========================================================================== */
const $ = id => document.getElementById(id);
const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const MODEL_URL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
const STORAGE_KEY = "focuslens:history_v2";
const THEME_KEY = "focuslens:theme";
const VIEW_KEY = "focuslens:view_mode";

// MediaPipe landmark indices for Eyes and Iris
const LEFT_EYE = [33, 160, 158, 133, 153, 144];
const RIGHT_EYE = [362, 385, 387, 263, 373, 380];
const LEFT_IRIS = [468, 469, 470, 471, 472];
const RIGHT_IRIS = [473, 474, 475, 476, 477];
const NOSE_TIP = 1;

// Scoring target weights and user coaching messages
const TARGET_SCORES = { focused: 100, distracted: 38, drowsy: 10 };
const STATE_NAMES = {
  focused: "Deep Flow State",
  distracted: "Attention Drifting",
  drowsy: "Fatigue / Eyes Closing"
};
const STATE_MESSAGES = {
  focused: "Optimal engagement. You are locked in your flow state.",
  distracted: "Gaze or head turned away. Bring your attention back to your work.",
  drowsy: "Prolonged eye closure or yawning detected. Take a deep breath or stretch."
};

const STATE_COLORS = {
  focused: "#10B981",
  distracted: "#F59E0B",
  drowsy: "#F43F5E"
};

/* ==========================================================================
   Application State
   ========================================================================== */
let landmarker = null;
let mediaStream = null;
let animFrameId = null;
let session = null;
let audioCtx = null;
let soundFxEnabled = true;
let hudEnabled = true;
let currentAmbientMode = "off";
let ambientNodes = null;
let ambientGain = null;
let currentSprintMinutes = 25;
let sprintCycleCount = 1;
let breathInterval = null;

// Smoothed 3D Pose
let neutralBase = { yaw: 0, pitch: 0 };
let smoothedPose = { yaw: 0, pitch: 0, roll: 0 };

/* ==========================================================================
   Utility & Notification Functions
   ========================================================================== */
const formatTime = ms => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

const getSprintDurationMs = () => currentSprintMinutes * 60000;

function showToast(message, duration = 3000) {
  const toast = $("toast");
  toast.textContent = message;
  toast.hidden = false;
  setTimeout(() => {
    toast.hidden = true;
  }, duration);
}

/* ==========================================================================
   Web Audio API: Procedural Synthesizers & Soundscapes
   ========================================================================== */
function initAudio() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
}

// Gentle Harmonic Bell / Chime Synthesizer
function playChime(type = "zen") {
  if (!soundFxEnabled) return;
  initAudio();
  if (!audioCtx) return;

  const now = audioCtx.currentTime;
  if (type === "zen") {
    // 528 Hz Solfeggio / Zen Tone with soft harmonic decay
    [528, 1056].forEach((freq, idx) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(idx === 0 ? 0.15 : 0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 1.2);
    });
  } else if (type === "warn") {
    // Descending soft notification
    [440, 392].forEach((freq, idx) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.14);
      gain.gain.setValueAtTime(0.12, now + idx * 0.14);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.14 + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now + idx * 0.14);
      osc.stop(now + idx * 0.14 + 0.3);
    });
  } else if (type === "alert") {
    // Drowsiness pulse
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(330, now);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.5);
  }
}

// Procedural Ambient Soundscapes
function stopAmbient() {
  if (ambientNodes) {
    ambientNodes.forEach(node => {
      try { node.stop ? node.stop() : node.disconnect(); } catch (e) {}
    });
    ambientNodes = null;
  }
}

function setAmbient(mode) {
  currentAmbientMode = mode;
  stopAmbient();

  document.querySelectorAll("[data-ambient]").forEach(el => {
    el.classList.toggle("active", el.dataset.ambient === mode);
  });

  if (mode === "off") return;

  initAudio();
  if (!audioCtx) return;

  const vol = +$("ambientVol").value / 100;
  ambientGain = audioCtx.createGain();
  ambientGain.gain.setValueAtTime(vol * 0.15, audioCtx.currentTime);
  ambientGain.connect(audioCtx.destination);

  if (mode === "binaural") {
    // 40Hz Gamma Flow (Left: 216Hz, Right: 256Hz)
    const oscL = audioCtx.createOscillator();
    const oscR = audioCtx.createOscillator();
    oscL.frequency.setValueAtTime(216, audioCtx.currentTime);
    oscR.frequency.setValueAtTime(256, audioCtx.currentTime);

    const panL = audioCtx.createStereoPanner ? audioCtx.createStereoPanner() : null;
    const panR = audioCtx.createStereoPanner ? audioCtx.createStereoPanner() : null;

    if (panL && panR) {
      panL.pan.value = -0.9;
      panR.pan.value = 0.9;
      oscL.connect(panL);
      panL.connect(ambientGain);
      oscR.connect(panR);
      panR.connect(ambientGain);
    } else {
      oscL.connect(ambientGain);
      oscR.connect(ambientGain);
    }

    oscL.start();
    oscR.start();
    ambientNodes = [oscL, oscR, ambientGain];
  } else if (mode === "brown" || mode === "rain") {
    const bufferSize = audioCtx.sampleRate * 2;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      if (mode === "brown") {
        output[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5;
      } else {
        output[i] = (lastOut + 0.05 * white) / 1.05;
        lastOut = output[i];
        output[i] *= 2.0;
      }
    }

    const whiteNoise = audioCtx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = audioCtx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(mode === "brown" ? 280 : 800, audioCtx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(ambientGain);
    whiteNoise.start();
    ambientNodes = [whiteNoise, filter, ambientGain];
  }
}

/* ==========================================================================
   Session Factory & State Initialization
   ========================================================================== */
function createNewSession() {
  const now = performance.now();
  return {
    startTime: now,
    prevTick: now,
    videoTime: -1,
    timeInState: { focused: 0, distracted: 0, drowsy: 0 },
    score: 85,
    currentStreak: 0,
    bestStreak: 0,
    distractionStreak: 0,
    maxDistraction: 0,
    scoreSum: 0,
    scoreCount: 0,
    timelineSeries: [],
    blinkTimestamps: [],
    closedDuration: 0,
    yawnDuration: 0,
    yawnsDetected: 0,
    yawnFlag: false,
    microsleepCount: 0,
    noFaceDuration: 0,
    currentState: "focused",
    lastAudioWarning: 0,
    lastTimelineLog: now,
    fpsFrames: 0,
    fpsTimer: now,
    sprintEndTime: now + getSprintDurationMs(),
    isBreakMode: false
  };
}

/* ==========================================================================
   Start Camera & MediaPipe Initialization
   ========================================================================== */
async function startTracking() {
  $("statusText").textContent = "Loading AI Vision…";
  $("camBtn").disabled = true;

  try {
    initAudio();
    if (!landmarker) {
      const fileset = await FilesetResolver.forVisionTasks(WASM_URL);
      for (const delegate of ["GPU", "CPU"]) {
        try {
          landmarker = await FaceLandmarker.createFromOptions(fileset, {
            baseOptions: { modelAssetPath: MODEL_URL, delegate },
            runningMode: "VIDEO",
            numFaces: 1,
            outputFaceBlendshapes: true,
            outputFacialTransformationMatrixes: true
          });
          break;
        } catch (e) {
          if (delegate === "CPU") throw e;
        }
      }
    }

    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
      audio: false
    });

    const videoEl = $("v");
    videoEl.srcObject = mediaStream;
    await videoEl.play();

    session = createNewSession();
    ["calBtn", "endBtn", "csvBtn", "jsonBtn", "shareCardBtn"].forEach(id => $(id).disabled = false);

    document.body.dataset.state = "focused";
    $("statusText").textContent = "Tracking Active";
    playChime("zen");
    showToast("Camera active — tracking started!");

    trackingLoop();
  } catch (err) {
    $("camBtn").disabled = false;
    document.body.dataset.state = "idle";
    const msg = err.name === "NotAllowedError"
      ? "Camera permission denied. Please allow camera access in browser settings."
      : "Error initializing camera: " + err.message;
    $("statusText").textContent = msg;
    showToast(msg, 5000);
  }
}

/* ==========================================================================
   Real-Time AI Vision Loop
   ========================================================================== */
function trackingLoop() {
  animFrameId = requestAnimationFrame(trackingLoop);
  const videoEl = $("v");
  const now = performance.now();

  if (videoEl.readyState < 2 || videoEl.currentTime === session.videoTime) return;
  session.videoTime = videoEl.currentTime;

  const dt = Math.min(now - session.prevTick, 200);
  session.prevTick = now;

  const detection = landmarker.detectForVideo(videoEl, now);
  const faceLandmarks = detection.faceLandmarks[0];

  let calculatedState = session.currentState;
  let ear = 0;
  let gazeDirection = "Center";

  // Draw real-time HUD Canvas Overlay
  drawHudOverlay(faceLandmarks, videoEl);

  if (!faceLandmarks) {
    session.noFaceDuration += dt;
    session.closedDuration = 0;
    session.yawnDuration = 0;
    $("faceTag").textContent = "No Face";
    $("faceTag").style.color = "var(--color-drift)";

    if (session.noFaceDuration > 1500) {
      calculatedState = "distracted";
    }
  } else {
    session.noFaceDuration = 0;
    $("faceTag").textContent = "Face Tracked";
    $("faceTag").style.color = "var(--color-flow)";

    const vW = videoEl.videoWidth || 640;
    const vH = videoEl.videoHeight || 480;
    const dist = (a, b) => Math.hypot((faceLandmarks[a].x - faceLandmarks[b].x) * vW, (faceLandmarks[a].y - faceLandmarks[b].y) * vH);

    // Eye Aspect Ratio (EAR)
    const earL = (dist(LEFT_EYE[1], LEFT_EYE[5]) + dist(LEFT_EYE[2], LEFT_EYE[4])) / (2 * dist(LEFT_EYE[0], LEFT_EYE[3]));
    const earR = (dist(RIGHT_EYE[1], RIGHT_EYE[5]) + dist(RIGHT_EYE[2], RIGHT_EYE[4])) / (2 * dist(RIGHT_EYE[0], RIGHT_EYE[3]));
    ear = (earL + earR) / 2;

    // Blendshapes Analysis
    const blendshapes = {};
    (detection.faceBlendshapes[0]?.categories || []).forEach(cat => {
      blendshapes[cat.categoryName] = cat.score;
    });

    // Horizontal & Vertical Gaze Estimation
    const gazeX = ((blendshapes.eyeLookInLeft + blendshapes.eyeLookOutRight) - (blendshapes.eyeLookOutLeft + blendshapes.eyeLookInRight)) / 2 || 0;
    const gazeY = ((blendshapes.eyeLookUpLeft + blendshapes.eyeLookUpRight) - (blendshapes.eyeLookDownLeft + blendshapes.eyeLookDownRight)) / 2 || 0;

    if (Math.abs(gazeX) < 0.28 && Math.abs(gazeY) < 0.28) {
      gazeDirection = "Center";
    } else if (Math.abs(gazeX) >= Math.abs(gazeY)) {
      gazeDirection = gazeX > 0 ? "Right" : "Left";
    } else {
      gazeDirection = gazeY > 0 ? "Up" : "Down";
    }

    // Update 3x3 Gaze Grid
    updateGazeGrid(gazeDirection);

    // 3D Head Orientation via Facial Transformation Matrix
    const matrix = detection.facialTransformationMatrixes[0]?.data;
    if (matrix) {
      const rawPose = {
        yaw: Math.atan2(matrix[8], matrix[10]) * 57.2958,
        pitch: Math.atan2(-matrix[9], Math.hypot(matrix[8], matrix[10])) * 57.2958,
        roll: Math.atan2(matrix[1], matrix[5]) * 57.2958
      };
      smoothedPose.yaw += (rawPose.yaw - smoothedPose.yaw) * 0.35;
      smoothedPose.pitch += (rawPose.pitch - smoothedPose.pitch) * 0.35;
      smoothedPose.roll += (rawPose.roll - smoothedPose.roll) * 0.35;
    }

    const currentYaw = smoothedPose.yaw - neutralBase.yaw;
    const currentPitch = smoothedPose.pitch - neutralBase.pitch;

    // Eye Closure & Blink Calculation
    if (ear < 0.20) {
      session.closedDuration += dt;
      if (session.closedDuration > 1200) {
        session.microsleepCount++;
      }
    } else {
      if (session.closedDuration >= 45 && session.closedDuration <= 450) {
        session.blinkTimestamps.push(now);
      }
      session.closedDuration = 0;
    }
    session.blinkTimestamps = session.blinkTimestamps.filter(t => now - t < 60000);

    // Yawn Detection (Jaw Opening)
    const jawOpen = blendshapes.jawOpen || 0;
    if (jawOpen > 0.55) {
      session.yawnDuration += dt;
      if (session.yawnDuration > 1200 && !session.yawnFlag) {
        session.yawnFlag = true;
        session.yawnsDetected++;
      }
    } else {
      session.yawnDuration = 0;
      session.yawnFlag = false;
    }

    // State Evaluation Logic
    const isTurnedAway = Math.abs(currentYaw) > 24 || Math.abs(currentPitch) > 19 || Math.abs(gazeX) > 0.45 || gazeY < -0.42;
    const isDrowsy = session.closedDuration > 1000 || session.yawnDuration > 1200;

    calculatedState = isDrowsy ? "drowsy" : (isTurnedAway ? "distracted" : "focused");

    // Telemetry UI Updates
    $("earVal").textContent = ear.toFixed(2);
    $("earBar").style.width = Math.min(100, (ear / 0.35) * 100) + "%";
    $("gazeVal").textContent = gazeDirection;
    $("yawnVal").textContent = session.yawnsDetected;
    $("sleepVal").textContent = session.microsleepCount;

    // Blink Rate & Eye Strain Tag
    const sessionElapsed = now - session.startTime;
    const bpm = sessionElapsed < 8000 ? null : Math.round((session.blinkTimestamps.length * 60000) / Math.min(60000, sessionElapsed));
    if (bpm !== null) {
      $("bpmVal").innerHTML = `${bpm} <small>BPM</small>`;
      const alertTag = $("blinkAlertTag");
      if (bpm < 10) {
        alertTag.textContent = "Low (Strain)";
        alertTag.className = "tag-status tag-alert";
      } else if (bpm > 28) {
        alertTag.textContent = "Frequent";
        alertTag.className = "tag-status tag-warn";
      } else {
        alertTag.textContent = "Normal";
        alertTag.className = "tag-status tag-ok";
      }
    }

    // Fatigue Risk Tag
    const fatigueTag = $("fatigueRisk");
    if (session.yawnsDetected > 3 || session.microsleepCount > 2) {
      fatigueTag.textContent = "High Fatigue";
      fatigueTag.className = "tag-status tag-alert";
      $("fatigueTip").textContent = "Take a 5-minute break";
    } else if (session.yawnsDetected > 0 || session.microsleepCount > 0) {
      fatigueTag.textContent = "Moderate";
      fatigueTag.className = "tag-status tag-warn";
      $("fatigueTip").textContent = "Blink frequently and hydrate";
    } else {
      fatigueTag.textContent = "Optimal";
      fatigueTag.className = "tag-status tag-ok";
      $("fatigueTip").textContent = "Alertness stable";
    }

    // 3D Head Pose Sliders
    $("yawVal").textContent = Math.round(currentYaw) + "°";
    $("pitchVal").textContent = Math.round(currentPitch) + "°";
    $("rollVal").textContent = Math.round(smoothedPose.roll) + "°";

    $("yawPip").style.left = (50 + Math.max(-1, Math.min(1, currentYaw / 40)) * 50) + "%";
    $("pitchPip").style.left = (50 + Math.max(-1, Math.min(1, currentPitch / 40)) * 50) + "%";
    $("rollPip").style.left = (50 + Math.max(-1, Math.min(1, smoothedPose.roll / 40)) * 50) + "%";
  }

  // Update State & Streaks
  session.currentState = calculatedState;
  session.timeInState[calculatedState] += dt;

  if (calculatedState === "focused") {
    session.currentStreak += dt;
    session.bestStreak = Math.max(session.bestStreak, session.currentStreak);
    session.distractionStreak = 0;
  } else {
    session.currentStreak = 0;
    session.distractionStreak += dt;
    session.maxDistraction = Math.max(session.maxDistraction, session.distractionStreak);
  }

  // Focus Score Transition
  const targetScore = TARGET_SCORES[calculatedState];
  session.score += (targetScore - session.score) * Math.min(1, dt / 1500);
  session.scoreSum += session.score;
  session.scoreCount++;

  // Gentle Audio Alert for prolonged drift
  if (calculatedState !== "focused" && session.distractionStreak > 4000 && !session.isBreakMode && (now - session.lastAudioWarning > 10000)) {
    playChime(calculatedState === "drowsy" ? "alert" : "warn");
    session.lastAudioWarning = now;
  }

  // Sprint Timer & Pomodoro Logic
  if (now >= session.sprintEndTime && !session.isBreakMode) {
    triggerBreakMode();
  } else if (!session.isBreakMode) {
    $("sprintTime").textContent = formatTime(session.sprintEndTime - now);
  }

  // FPS Counter
  session.fpsFrames++;
  if (now - session.fpsTimer >= 1000) {
    $("fpsTag").textContent = `${session.fpsFrames} FPS`;
    session.fpsFrames = 0;
    session.fpsTimer = now;
  }

  // Timeline Series Logging (every 1 second)
  if (now - session.lastTimelineLog >= 1000) {
    session.lastTimelineLog = now;
    session.timelineSeries.push({
      t: Math.round((now - session.startTime) / 1000),
      s: Math.round(session.score),
      st: calculatedState,
      ear: Number(ear.toFixed(2))
    });
    renderTimelineChart();
    updateSummaryStats();
  }

  // Sync Body State & Score Dial
  document.body.dataset.state = calculatedState;
  const clampedScore = Math.max(0, Math.min(100, Math.round(session.score)));
  $("scoreRing").style.strokeDashoffset = 816.8 * (1 - clampedScore / 100);
  $("scoreNum").textContent = faceLandmarks || session.noFaceDuration > 1500 ? clampedScore : "–";
  $("stateLabel").textContent = STATE_NAMES[calculatedState];
  $("stateMsg").textContent = !faceLandmarks && session.noFaceDuration > 500
    ? "No face detected in camera viewport. Ensure your face is centered."
    : STATE_MESSAGES[calculatedState];
}

/* ==========================================================================
   AI Face & Iris HUD Canvas Overlay
   ========================================================================== */
function drawHudOverlay(landmarks, videoEl) {
  const canvas = $("hudCanvas");
  if (!hudEnabled || !landmarks) {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    return;
  }

  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
  }

  const ctx = canvas.getContext("2d");
  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, rect.width, rect.height);

  const w = rect.width;
  const h = rect.height;
  const stateColor = STATE_COLORS[session?.currentState || "focused"];

  const pt = idx => ({ x: landmarks[idx].x * w, y: landmarks[idx].y * h });

  // 1. Draw Eye Contours
  [LEFT_EYE, RIGHT_EYE].forEach(eye => {
    ctx.beginPath();
    ctx.strokeStyle = stateColor;
    ctx.lineWidth = 1.6;
    ctx.globalAlpha = 0.85;
    eye.forEach((idx, i) => {
      const p = pt(idx);
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();
    ctx.stroke();
  });

  // 2. Draw Iris Center Points and Crosshairs
  [LEFT_IRIS[0], RIGHT_IRIS[0]].forEach(irisIdx => {
    if (landmarks[irisIdx]) {
      const p = pt(irisIdx);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, 2 * Math.PI);
      ctx.fillStyle = stateColor;
      ctx.globalAlpha = 0.95;
      ctx.fill();

      ctx.beginPath();
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.6;
      ctx.moveTo(p.x - 7, p.y); ctx.lineTo(p.x + 7, p.y);
      ctx.moveTo(p.x, p.y - 7); ctx.lineTo(p.x, p.y + 7);
      ctx.stroke();
    }
  });

  // 3. Subtle Nose Direction Ray
  const nose = pt(NOSE_TIP);
  const yawOffset = (smoothedPose.yaw - neutralBase.yaw) * 1.2;
  const pitchOffset = (smoothedPose.pitch - neutralBase.pitch) * 1.2;

  ctx.beginPath();
  ctx.strokeStyle = stateColor;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.6;
  ctx.moveTo(nose.x, nose.y);
  ctx.lineTo(nose.x + yawOffset, nose.y + pitchOffset);
  ctx.stroke();

  ctx.restore();
}

function updateGazeGrid(direction) {
  document.querySelectorAll(".quad-cell").forEach(cell => {
    const isTarget = cell.dataset.dir === direction;
    cell.classList.toggle("active", isTarget);
  });
}

/* ==========================================================================
   Break Mode & Guided 4-7-8 Breathing
   ========================================================================== */
function triggerBreakMode() {
  if (!session) return;
  session.isBreakMode = true;
  playChime("zen");
  $("breakSection").hidden = false;
  $("sprintLabel").textContent = "Restorative Break";
  $("sprintTime").textContent = "05:00";

  startBreathingCycle();
}

function startBreathingCycle() {
  clearInterval(breathInterval);
  const circle = $("breathCircle");
  const actionText = $("breathAction");
  const stepText = $("breathStep");

  const phases = [
    { name: "Inhale", cls: "inhale", msg: "Inhale slowly and quietly through the nose for 4s..." },
    { name: "Hold", cls: "hold", msg: "Hold your breath calmly for 7s..." },
    { name: "Exhale", cls: "exhale", msg: "Exhale smoothly through your mouth for 8s..." }
  ];

  let currentPhaseIdx = 0;

  function runPhase() {
    const p = phases[currentPhaseIdx];
    actionText.textContent = p.name;
    stepText.textContent = p.msg;
    circle.className = `breath-orb ${p.cls}`;

    currentPhaseIdx = (currentPhaseIdx + 1) % phases.length;
  }

  runPhase();
  breathInterval = setInterval(runPhase, 19000);
}

function resumeNextSprint() {
  clearInterval(breathInterval);
  $("breakSection").hidden = true;
  if (!session) return;

  sprintCycleCount++;
  session.isBreakMode = false;
  session.sprintEndTime = performance.now() + getSprintDurationMs();
  $("sprintLabel").textContent = "Focus Sprint";
  $("sprintCycle").textContent = `Cycle #${sprintCycleCount}`;
  playChime("zen");
  showToast(`Sprint #${sprintCycleCount} started!`);
}

/* ==========================================================================
   Summary Metrics & State Distribution
   ========================================================================== */
function updateSummaryStats() {
  if (!session) return;
  const totalMs = session.timeInState.focused + session.timeInState.distracted + session.timeInState.drowsy || 1;
  const pct = state => Math.round((session.timeInState[state] / totalMs) * 100);

  const focusedPct = pct("focused");
  const distractedPct = pct("distracted");
  const drowsyPct = pct("drowsy");

  $("elapsedVal").textContent = formatTime(performance.now() - session.startTime);
  $("bestStreak").textContent = formatTime(session.bestStreak);
  $("dmaxVal").textContent = formatTime(session.maxDistraction);

  const avg = Math.round(session.scoreSum / Math.max(session.scoreCount, 1));
  $("avgScore").textContent = avg;

  const gradeEl = $("avgGrade");
  if (avg >= 88) {
    gradeEl.textContent = "Grade S • Elite Flow";
    gradeEl.style.color = "var(--color-flow)";
  } else if (avg >= 75) {
    gradeEl.textContent = "Grade A • Strong Focus";
    gradeEl.style.color = "var(--color-flow)";
  } else if (avg >= 60) {
    gradeEl.textContent = "Grade B • Steady Focus";
    gradeEl.style.color = "var(--color-active)";
  } else {
    gradeEl.textContent = "Grade C • Drifting";
    gradeEl.style.color = "var(--color-drift)";
  }

  $("pctFocused").textContent = `${focusedPct}%`;
  $("pctDistracted").textContent = `${distractedPct}%`;
  $("pctDrowsy").textContent = `${drowsyPct}%`;

  $("barFocused").style.width = `${focusedPct}%`;
  $("barDistracted").style.width = `${distractedPct}%`;
  $("barDrowsy").style.width = `${drowsyPct}%`;
}

/* ==========================================================================
   Interactive High-DPI Timeline Chart
   ========================================================================== */
function renderTimelineChart() {
  const canvas = $("tl");
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;

  if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
    canvas.width = w * dpr;
    canvas.height = h * dpr;
  }

  const ctx = canvas.getContext("2d");
  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w, h);

  const series = session ? session.timelineSeries : [];

  // Horizontal threshold grid lines
  ctx.strokeStyle = "rgba(255, 255, 255, 0.07)";
  ctx.lineWidth = 1;
  [0.8, 0.4].forEach(level => {
    const y = h * (1 - level);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  });

  if (!series.length) {
    ctx.fillStyle = "#64748B";
    ctx.font = "14px Plus Jakarta Sans, sans-serif";
    ctx.fillText("Start your camera to begin live second-by-second focus charting.", 20, h / 2 + 5);
    ctx.restore();
    return;
  }

  const barWidth = w / Math.max(series.length, 90);

  series.forEach((point, i) => {
    ctx.fillStyle = STATE_COLORS[point.st] || "#10B981";
    ctx.globalAlpha = 0.85;
    const barHeight = Math.max(3, (point.s / 100) * (h - 14));
    const x = i * barWidth;
    const y = h - barHeight;

    ctx.fillRect(x, y, Math.max(barWidth - 1, 1), barHeight);
  });

  ctx.restore();
}

// Chart Tooltip Scrubbing
$("tl").addEventListener("mousemove", e => {
  if (!session || !session.timelineSeries.length) return;
  const canvas = $("tl");
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const series = session.timelineSeries;
  const barWidth = rect.width / Math.max(series.length, 90);

  const index = Math.floor(mouseX / barWidth);
  if (index >= 0 && index < series.length) {
    const pt = series[index];
    const tooltip = $("chartTooltip");
    tooltip.hidden = false;
    tooltip.style.left = `${mouseX}px`;

    $("tipTime").textContent = formatTime(pt.t * 1000);
    $("tipScore").textContent = `${pt.s} / 100`;
    $("tipScore").style.color = STATE_COLORS[pt.st];
    $("tipState").textContent = STATE_NAMES[pt.st];
  }
});

$("tl").addEventListener("mouseleave", () => {
  $("chartTooltip").hidden = true;
});

/* ==========================================================================
   Session Persistence & LocalStorage Management
   ========================================================================== */
function saveCurrentSession() {
  if (!session) return;
  const elapsed = performance.now() - session.startTime;
  if (elapsed < 10000) return;

  try {
    const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const avg = Math.round(session.scoreSum / Math.max(session.scoreCount, 1));
    const flowPct = Math.round((session.timeInState.focused / elapsed) * 100);

    history.unshift({
      id: Date.now().toString(),
      date: new Date().toISOString(),
      duration: elapsed,
      avgScore: avg,
      flowPct: flowPct,
      bestStreak: session.bestStreak,
      yawns: session.yawnsDetected
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 30)));
  } catch (e) {
    console.warn("Storage save error", e);
  }
}

function renderHistoryList() {
  let history = [];
  try {
    history = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch (e) {}

  const listEl = $("historyList");
  if (!history.length) {
    listEl.innerHTML = `<li class="history-empty-row">No recorded sessions yet. Completed sessions over 10 seconds are securely saved here on this device.</li>`;
    return;
  }

  listEl.innerHTML = history.slice(0, 10).map(item => {
    const d = new Date(item.date);
    const dateFormatted = d.toLocaleDateString([], { month: "short", day: "numeric" }) + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const grade = item.avgScore >= 85 ? "Grade S" : (item.avgScore >= 70 ? "Grade A" : "Grade B");

    return `
      <li class="history-item-row">
        <span class="h-date">${dateFormatted}</span>
        <span class="h-dur">⏱️ ${formatTime(item.duration)}</span>
        <span class="h-flow">🔥 ${item.flowPct}% flow</span>
        <span class="h-score">Score: ${item.avgScore}</span>
        <span class="h-badge">${grade}</span>
      </li>
    `;
  }).join("");
}

function clearAllHistory() {
  if (confirm("Are you sure you want to clear all stored session history?")) {
    try {
      localStorage.removeItem(STORAGE_KEY);
      renderHistoryList();
      showToast("Session history cleared.");
    } catch (e) {}
  }
}

/* ==========================================================================
   Session Teardown & Reset
   ========================================================================== */
function stopTracking() {
  cancelAnimationFrame(animFrameId);
  clearInterval(breathInterval);
  $("breakSection").hidden = true;

  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
    mediaStream = null;
  }
  $("v").srcObject = null;

  saveCurrentSession();
  session = null;

  document.body.dataset.state = "idle";
  $("statusText").textContent = "Camera Inactive";
  $("camBtn").disabled = false;
  ["calBtn", "endBtn", "csvBtn", "jsonBtn", "shareCardBtn"].forEach(id => $(id).disabled = true);

  $("scoreNum").textContent = "–";
  $("stateLabel").textContent = "Session Finished";
  $("stateMsg").textContent = "Your session stats have been saved. Click 'Start Camera Session' whenever you're ready.";
  $("scoreRing").style.strokeDashoffset = 816.8;

  ["bestStreak", "dmaxVal", "avgScore", "pctFocused", "pctDistracted", "pctDrowsy"].forEach(id => $(id).textContent = "–");
  $("elapsedVal").textContent = "00:00";
  $("avgGrade").textContent = "–";
  ["barFocused", "barDistracted", "barDrowsy"].forEach(id => $(id).style.width = "0%");

  renderTimelineChart();
  renderHistoryList();
  showToast("Session saved successfully.");
}

/* ==========================================================================
   Export & Share Features
   ========================================================================== */
function exportCSV() {
  if (!session || !session.timelineSeries.length) return;
  const headers = "timestamp_seconds,focus_score,state,eye_openness_ear\n";
  const rows = session.timelineSeries.map(p => `${p.t},${p.s},${p.st},${p.ear}`).join("\n");
  const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `focuslens-telemetry-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast("CSV telemetry exported!");
}

function exportJSON() {
  if (!session) return;
  const elapsed = performance.now() - session.startTime;
  const data = {
    app: "FocusLens",
    version: "2.0.0",
    date: new Date().toISOString(),
    durationSeconds: Math.round(elapsed / 1000),
    averageScore: Math.round(session.scoreSum / Math.max(session.scoreCount, 1)),
    bestStreakMs: session.bestStreak,
    maxDistractionMs: session.maxDistraction,
    yawnsDetected: session.yawnsDetected,
    microsleepsDetected: session.microsleepCount,
    timeInStateMs: session.timeInState,
    timeline: session.timelineSeries
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `focuslens-session-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast("JSON session exported!");
}

function openShareCard() {
  if (!session) return;
  const elapsed = performance.now() - session.startTime;
  const avg = Math.round(session.scoreSum / Math.max(session.scoreCount, 1));
  const flowPct = Math.round((session.timeInState.focused / Math.max(elapsed, 1)) * 100);

  $("scDate").textContent = new Date().toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
  $("scScore").textContent = avg;
  $("scTime").textContent = formatTime(elapsed);
  $("scFlow").textContent = `${flowPct}%`;
  $("scStreak").textContent = formatTime(session.bestStreak);
  $("scDist").textContent = `${session.yawnsDetected} yawns`;

  const gradeText = avg >= 85 ? "Grade S • Deep Flow" : (avg >= 70 ? "Grade A • Strong Focus" : "Grade B • Steady Focus");
  $("scGrade").textContent = gradeText;

  $("shareModal").showModal();
}

function copyShareText() {
  if (!session) return;
  const elapsed = performance.now() - session.startTime;
  const avg = Math.round(session.scoreSum / Math.max(session.scoreCount, 1));
  const flowPct = Math.round((session.timeInState.focused / Math.max(elapsed, 1)) * 100);

  const text = `🎯 FocusLens AI Telemetry Summary
────────────────────────────
⏱️ Duration: ${formatTime(elapsed)}
🏆 Mean Focus Score: ${avg}/100
🔥 Flow State: ${flowPct}%
⚡ Best Streak: ${formatTime(session.bestStreak)}
🔒 100% Client-Side Privacy • https://focuslens.vercel.app`;

  navigator.clipboard.writeText(text).then(() => {
    showToast("Summary copied to clipboard!");
    $("shareModal").close();
  });
}

/* ==========================================================================
   View Mode & Theme Configuration
   ========================================================================== */
function setViewMode(mode) {
  document.body.dataset.view = mode;
  $("viewStudioBtn").classList.toggle("active", mode === "studio");
  $("viewLensBtn").classList.toggle("active", mode === "lens");
  try {
    localStorage.setItem(VIEW_KEY, mode);
  } catch (e) {}
}

function initThemeAndView() {
  // Theme
  const savedTheme = localStorage.getItem(THEME_KEY);
  if (savedTheme) {
    document.documentElement.setAttribute("data-theme", savedTheme);
  } else {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.setAttribute("data-theme", prefersDark ? "dark" : "light");
  }

  // View Mode
  const savedView = localStorage.getItem(VIEW_KEY) || "studio";
  setViewMode(savedView);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") || "dark";
  const next = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch (e) {}
}

/* ==========================================================================
   Event Listeners & Initialization
   ========================================================================== */
$("camBtn").addEventListener("click", startTracking);
$("endBtn").addEventListener("click", stopTracking);

$("calBtn").addEventListener("click", () => {
  neutralBase = { yaw: smoothedPose.yaw, pitch: smoothedPose.pitch };
  showToast("Neutral pose calibrated to current position.");
});
$("quickCalBtn").addEventListener("click", () => {
  neutralBase = { yaw: smoothedPose.yaw, pitch: smoothedPose.pitch };
  showToast("Re-centered head orientation.");
});

$("themeToggle").addEventListener("click", toggleTheme);

// View Mode buttons
$("viewStudioBtn").addEventListener("click", () => setViewMode("studio"));
$("viewLensBtn").addEventListener("click", () => setViewMode("lens"));

// Sound FX toggle
$("sndToggle").addEventListener("click", () => {
  soundFxEnabled = !soundFxEnabled;
  const btn = $("sndToggle");
  btn.setAttribute("aria-pressed", soundFxEnabled);
  btn.classList.toggle("active", soundFxEnabled);
  if (soundFxEnabled) playChime("zen");
  showToast(soundFxEnabled ? "Audio alerts enabled" : "Audio alerts muted");
});

// HUD Mesh toggle
$("hudToggle").addEventListener("click", () => {
  hudEnabled = !hudEnabled;
  const btn = $("hudToggle");
  btn.setAttribute("aria-pressed", hudEnabled);
  btn.classList.toggle("active", hudEnabled);
  showToast(hudEnabled ? "AI HUD Mesh visible" : "AI HUD Mesh hidden");
});

// Ambient soundscape cards
document.querySelectorAll(".sound-card").forEach(btn => {
  btn.addEventListener("click", () => {
    setAmbient(btn.dataset.ambient);
  });
});

$("ambientVol").addEventListener("input", e => {
  const val = e.target.value;
  $("volPercent").textContent = `${val}%`;
  if (ambientGain && audioCtx) {
    ambientGain.gain.setValueAtTime((+val / 100) * 0.15, audioCtx.currentTime);
  }
});

// Sprint duration chip selector
document.querySelectorAll(".chip-btn").forEach(chip => {
  chip.addEventListener("click", () => {
    document.querySelectorAll(".chip-btn").forEach(c => c.classList.remove("active"));
    chip.classList.add("active");
    currentSprintMinutes = +chip.dataset.len;
    if (session && !session.isBreakMode) {
      session.sprintEndTime = performance.now() + getSprintDurationMs();
    } else {
      $("sprintTime").textContent = formatTime(getSprintDurationMs());
    }
    showToast(`Sprint duration set to ${currentSprintMinutes} minutes`);
  });
});

// Quick Break button
$("quickBreakBtn").addEventListener("click", () => {
  if (session) {
    triggerBreakMode();
  } else {
    showToast("Start a camera session to begin a sprint.");
  }
});

$("skipBreakBtn").addEventListener("click", resumeNextSprint);
$("clrBtn").addEventListener("click", clearAllHistory);
$("csvBtn").addEventListener("click", exportCSV);
$("jsonBtn").addEventListener("click", exportJSON);
$("shareCardBtn").addEventListener("click", openShareCard);
$("copyShareText").addEventListener("click", copyShareText);

// Privacy Modal handlers
$("privacyBtn").addEventListener("click", () => $("privacyModal").showModal());
$("closeModalBtn").addEventListener("click", () => $("privacyModal").close());
$("closeModalOk").addEventListener("click", () => $("privacyModal").close());

// Share Modal handlers
$("closeShareBtn").addEventListener("click", () => $("shareModal").close());

// Window lifecycle
window.addEventListener("resize", () => {
  renderTimelineChart();
});
window.addEventListener("pagehide", saveCurrentSession);

// Startup
initThemeAndView();
renderHistoryList();
renderTimelineChart();
$("sprintTime").textContent = formatTime(getSprintDurationMs());
