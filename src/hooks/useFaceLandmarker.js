import { useEffect, useRef, useState, useCallback } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm';
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

// Key Landmark indices for MediaPipe Face Mesh
const LEFT_EYE = [33, 160, 158, 133, 153, 144];
const RIGHT_EYE = [362, 385, 387, 263, 373, 380];
const LEFT_IRIS = [468, 469, 470, 471, 472];
const RIGHT_IRIS = [473, 474, 475, 476, 477];
const NOSE_TIP = 1;
const CHIN = 152;
const FOREHEAD = 10;
const LEFT_EAR_TRAGUS = 234;
const RIGHT_EAR_TRAGUS = 454;

export function useFaceLandmarker(videoRef, hudCanvasRef, hudEnabled, onStateTick) {
  // State Machine: 'idle' | 'requesting-permission' | 'loading-model' | 'tracking' | 'error'
  const [engineStatus, setEngineStatus] = useState('idle');
  const [engineError, setEngineError] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [fps, setFps] = useState(0);

  const landmarkerRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameRef = useRef(null);
  const isTrackingRef = useRef(false);

  // Calibration and smoothing refs
  const neutralBase = useRef({ yaw: 0, pitch: 0 });
  const smoothedPose = useRef({ yaw: 0, pitch: 0, roll: 0 });
  const smoothedSentiment = useRef({ valence: 50, smile: 0, stress: 0, focus: 80, strain: 0 });

  // Biometrics State (Throttled to 10 Hz to prevent React render lag)
  const [biometrics, setBiometrics] = useState({
    ear: 0,
    bpm: null,
    gazeDirection: 'Center',
    yawnsDetected: 0,
    microsleepCount: 0,
    pose: { yaw: 0, pitch: 0, roll: 0 },
    alignment: {
      isAligned: true,
      yawDeviation: 0,
      pitchDeviation: 0,
      rollDeviation: 0,
      status: 'Optimal Posture',
      cue: 'Aligned with screen center'
    },
    sentiment: {
      label: 'Calm Flow',
      valence: 50,
      scores: { calm: 80, smile: 0, focus: 75, stress: 10, strain: 5 },
      description: 'Neutral facial expression in balanced flow state'
    },
    isFaceTracked: false,
    fps: 0,
  });

  const blinkTimestamps = useRef([]);
  const closedDuration = useRef(0);
  const yawnDuration = useRef(0);
  const yawnFlag = useRef(false);
  const yawnsCount = useRef(0);
  const microsleeps = useRef(0);
  const noFaceDuration = useRef(0);
  const prevTick = useRef(performance.now());
  const framesCount = useRef(0);
  const lastFpsTime = useRef(performance.now());
  const lastStateTickTime = useRef(performance.now());
  const lastUIUpdateTime = useRef(performance.now());

  // Initialize MediaPipe FaceLandmarker with GPU / CPU delegate fallback
  useEffect(() => {
    let active = true;

    async function init() {
      try {
        const fileset = await FilesetResolver.forVisionTasks(WASM_URL);
        for (const delegate of ['GPU', 'CPU']) {
          try {
            const lm = await FaceLandmarker.createFromOptions(fileset, {
              baseOptions: { modelAssetPath: MODEL_URL, delegate },
              runningMode: 'VIDEO',
              numFaces: 1,
              outputFaceBlendshapes: true,
              outputFacialTransformationMatrixes: true,
            });
            if (active) {
              landmarkerRef.current = lm;
              setIsReady(true);
            }
            break;
          } catch (e) {
            if (delegate === 'CPU') throw e;
          }
        }
      } catch (err) {
        console.error('Failed to initialize FaceLandmarker:', err);
        if (active) {
          setEngineError('Failed to load on-device vision model.');
        }
      }
    }

    init();

    return () => {
      active = false;
      landmarkerRef.current?.close();
    };
  }, []);

  // Posture overlay HUD drawing function (executed directly on 2D canvas at 60 FPS)
  const drawHud = useCallback(
    (landmarks, isAligned, yawDev, pitchDev) => {
      const canvas = hudCanvasRef.current;
      if (!canvas || !hudEnabled || !landmarks) {
        if (canvas) {
          const ctx = canvas.getContext('2d');
          ctx?.clearRect(0, 0, canvas.width, canvas.height);
        }
        return;
      }

      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, rect.width, rect.height);

      const w = rect.width;
      const h = rect.height;
      const pt = (idx) => ({ x: landmarks[idx].x * w, y: landmarks[idx].y * h });
      const alignColor = isAligned ? '#10B981' : '#F59E0B';

      // 1. Vertical Plumb Axis Guideline (Forehead to Chin)
      if (landmarks[FOREHEAD] && landmarks[CHIN]) {
        const top = pt(FOREHEAD);
        const bot = pt(CHIN);

        ctx.beginPath();
        ctx.strokeStyle = alignColor;
        ctx.lineWidth = 2;
        ctx.setLineDash(isAligned ? [] : [6, 4]);
        ctx.globalAlpha = 0.85;
        ctx.moveTo(top.x, top.y - 20);
        ctx.lineTo(bot.x, bot.y + 20);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 2. Horizontal Eye-Horizon Level Line
      if (landmarks[LEFT_EAR_TRAGUS] && landmarks[RIGHT_EAR_TRAGUS]) {
        const leftEar = pt(LEFT_EAR_TRAGUS);
        const rightEar = pt(RIGHT_EAR_TRAGUS);

        ctx.beginPath();
        ctx.strokeStyle = alignColor;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.7;
        ctx.moveTo(leftEar.x, leftEar.y);
        ctx.lineTo(rightEar.x, rightEar.y);
        ctx.stroke();
      }

      // 3. Center Reticle at Nose Tip
      if (landmarks[NOSE_TIP]) {
        const nose = pt(NOSE_TIP);

        ctx.beginPath();
        ctx.arc(nose.x, nose.y, 16, 0, 2 * Math.PI);
        ctx.strokeStyle = alignColor;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.85;
        ctx.stroke();

        ctx.beginPath();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.8;
        ctx.moveTo(nose.x - 22, nose.y);
        ctx.lineTo(nose.x - 8, nose.y);
        ctx.moveTo(nose.x + 8, nose.y);
        ctx.lineTo(nose.x + 22, nose.y);
        ctx.moveTo(nose.x, nose.y - 22);
        ctx.lineTo(nose.x, nose.y - 8);
        ctx.moveTo(nose.x, nose.y + 8);
        ctx.lineTo(nose.x, nose.y + 22);
        ctx.stroke();

        // Directional alignment ray if deviated
        if (!isAligned) {
          const arrowX = nose.x - (yawDev * 2.2);
          const arrowY = nose.y + (pitchDev * 2.2);
          ctx.beginPath();
          ctx.strokeStyle = '#F59E0B';
          ctx.lineWidth = 2.5;
          ctx.globalAlpha = 0.9;
          ctx.moveTo(nose.x, nose.y);
          ctx.lineTo(arrowX, arrowY);
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(arrowX, arrowY, 4, 0, 2 * Math.PI);
          ctx.fillStyle = '#F59E0B';
          ctx.fill();
        }
      }

      ctx.restore();
    },
    [hudCanvasRef, hudEnabled]
  );

  // Compute Eye Aspect Ratio (Soukupová & Čech, 2016)
  const computeEar = (eyeIndices, landmarks) => {
    const p1 = landmarks[eyeIndices[0]];
    const p2 = landmarks[eyeIndices[1]];
    const p3 = landmarks[eyeIndices[2]];
    const p4 = landmarks[eyeIndices[3]];
    const p5 = landmarks[eyeIndices[4]];
    const p6 = landmarks[eyeIndices[5]];

    const dVertical1 = Math.hypot(p2.x - p6.x, p2.y - p6.y);
    const dVertical2 = Math.hypot(p3.x - p5.x, p3.y - p5.y);
    const dHorizontal = Math.hypot(p1.x - p4.x, p1.y - p4.y);

    if (dHorizontal === 0) return 0;
    return (dVertical1 + dVertical2) / (2.0 * dHorizontal);
  };

  // High-Frequency Detection Loop
  const loop = useCallback(() => {
    if (!isTrackingRef.current || !videoRef.current || !landmarkerRef.current) return;

    const now = performance.now();
    const dt = now - prevTick.current;
    prevTick.current = now;

    framesCount.current++;
    if (now - lastFpsTime.current >= 1000) {
      setFps(framesCount.current);
      framesCount.current = 0;
      lastFpsTime.current = now;
    }

    const video = videoRef.current;
    if (video.readyState < 2) {
      animFrameRef.current = requestAnimationFrame(loop);
      return;
    }

    let detection;
    try {
      detection = landmarkerRef.current.detectForVideo(video, now);
    } catch {
      animFrameRef.current = requestAnimationFrame(loop);
      return;
    }

    const faceLandmarks = detection.faceLandmarks?.[0];

    // No face in frame
    if (!faceLandmarks) {
      noFaceDuration.current += dt;
      drawHud(null, false, 0, 0);

      if (now - lastStateTickTime.current >= 100) {
        lastStateTickTime.current = now;
        onStateTick('idle', dt, 0);
      }

      if (now - lastUIUpdateTime.current >= 100) {
        lastUIUpdateTime.current = now;
        setBiometrics((prev) => ({
          ...prev,
          ear: 0,
          isFaceTracked: false,
          alignment: {
            ...prev.alignment,
            isAligned: false,
            status: 'Face Not Detected',
            cue: 'Position head in front of webcam'
          }
        }));
      }

      animFrameRef.current = requestAnimationFrame(loop);
      return;
    }

    noFaceDuration.current = 0;

    // 1. Eye Aspect Ratio
    const leftEar = computeEar(LEFT_EYE, faceLandmarks);
    const rightEar = computeEar(RIGHT_EYE, faceLandmarks);
    const ear = (leftEar + rightEar) / 2;

    // 2. Blendshapes dictionary
    const blendshapes = {};
    if (detection.faceBlendshapes?.[0]?.categories) {
      for (const cat of detection.faceBlendshapes[0].categories) {
        blendshapes[cat.categoryName] = cat.score;
      }
    }

    // 3. Gaze Vector
    const gazeX = ((blendshapes.eyeLookInLeft || 0) - (blendshapes.eyeLookOutLeft || 0) +
                   (blendshapes.eyeLookOutRight || 0) - (blendshapes.eyeLookInRight || 0)) / 2;
    const gazeY = ((blendshapes.eyeLookUpLeft || 0) + (blendshapes.eyeLookUpRight || 0) -
                   (blendshapes.eyeLookDownLeft || 0) - (blendshapes.eyeLookDownRight || 0)) / 2;

    let dir = 'Center';
    if (Math.abs(gazeX) < 0.28 && Math.abs(gazeY) < 0.28) {
      dir = 'Center';
    } else if (Math.abs(gazeX) >= Math.abs(gazeY)) {
      dir = gazeX > 0 ? 'Right' : 'Left';
    } else {
      dir = gazeY > 0 ? 'Up' : 'Down';
    }

    // 4. 3D Head Orientation via 4x4 matrix with EMA filter
    const matrix = detection.facialTransformationMatrixes?.[0]?.data;
    if (matrix) {
      const rawPose = {
        yaw: Math.atan2(matrix[8], matrix[10]) * 57.2958,
        pitch: Math.atan2(-matrix[9], Math.hypot(matrix[8], matrix[10])) * 57.2958,
        roll: Math.atan2(matrix[1], matrix[5]) * 57.2958,
      };
      smoothedPose.current.yaw += (rawPose.yaw - smoothedPose.current.yaw) * 0.35;
      smoothedPose.current.pitch += (rawPose.pitch - smoothedPose.current.pitch) * 0.35;
      smoothedPose.current.roll += (rawPose.roll - smoothedPose.current.roll) * 0.35;
    }

    const currentYaw = smoothedPose.current.yaw - neutralBase.current.yaw;
    const currentPitch = smoothedPose.current.pitch - neutralBase.current.pitch;
    const currentRoll = smoothedPose.current.roll;

    const isPostureAligned = Math.abs(currentYaw) <= 14 && Math.abs(currentPitch) <= 12 && Math.abs(currentRoll) <= 10;
    let postureCue = 'Aligned with workspace center';
    let postureStatus = 'Optimal Posture';
    if (!isPostureAligned) {
      if (currentYaw > 14) {
        postureCue = 'Turn head slightly left';
        postureStatus = 'Turned Right';
      } else if (currentYaw < -14) {
        postureCue = 'Turn head slightly right';
        postureStatus = 'Turned Left';
      } else if (currentPitch > 12) {
        postureCue = 'Lift chin upward to relieve neck strain';
        postureStatus = 'Slouching Down';
      } else if (currentPitch < -12) {
        postureCue = 'Lower chin toward screen horizon';
        postureStatus = 'Tilted Upward';
      } else if (Math.abs(currentRoll) > 10) {
        postureCue = 'Level head horizon';
        postureStatus = 'Head Leaning';
      }
    }

    // Draw HUD at 60 FPS
    drawHud(faceLandmarks, isPostureAligned, currentYaw, currentPitch);

    // 5. Blink and Eye Closure Tracking
    if (ear < 0.20) {
      closedDuration.current += dt;
      if (closedDuration.current > 1200) {
        microsleeps.current++;
      }
    } else {
      if (closedDuration.current >= 45 && closedDuration.current <= 450) {
        blinkTimestamps.current.push(now);
      }
      closedDuration.current = 0;
    }
    blinkTimestamps.current = blinkTimestamps.current.filter((t) => now - t < 60000);

    // 6. Yawn Detection
    const jawOpen = blendshapes.jawOpen || 0;
    if (jawOpen > 0.55) {
      yawnDuration.current += dt;
      if (yawnDuration.current > 1200 && !yawnFlag.current) {
        yawnFlag.current = true;
        yawnsCount.current++;
      }
    } else {
      yawnDuration.current = 0;
      yawnFlag.current = false;
    }

    // 7. Affective Facial Sentiment Analysis
    const rawSmile = ((blendshapes.mouthSmileLeft || 0) + (blendshapes.mouthSmileRight || 0)) / 2;
    const rawBrowDown = ((blendshapes.browDownLeft || 0) + (blendshapes.browDownRight || 0)) / 2;
    const rawSquint = ((blendshapes.eyeSquintLeft || 0) + (blendshapes.eyeSquintRight || 0)) / 2;
    const rawJawClench = blendshapes.jawClench || ((blendshapes.mouthPressLeft || 0) + (blendshapes.mouthPressRight || 0)) / 2;

    smoothedSentiment.current.smile += (rawSmile - smoothedSentiment.current.smile) * 0.2;
    smoothedSentiment.current.stress += (rawBrowDown * 0.7 + rawJawClench * 0.3 - smoothedSentiment.current.stress) * 0.2;
    smoothedSentiment.current.strain += (rawSquint - smoothedSentiment.current.strain) * 0.2;

    const curSmile = smoothedSentiment.current.smile;
    const curStress = smoothedSentiment.current.stress;
    const curStrain = smoothedSentiment.current.strain;

    let sentimentLabel = 'Calm Flow';
    let sentimentDescription = 'Neutral facial muscle tone in steady flow state';
    let valenceScore = 55;

    if (curSmile > 0.3) {
      sentimentLabel = 'Positive & Engaged';
      sentimentDescription = 'Active satisfaction and positive emotional valence';
      valenceScore = Math.min(100, Math.round(50 + curSmile * 100));
    } else if (curStress > 0.45) {
      sentimentLabel = 'Cognitive Strain';
      sentimentDescription = 'Brow furrowing and jaw tension detected';
      valenceScore = Math.max(-90, Math.round(20 - curStress * 120));
    } else if (curStrain > 0.4 || ear < 0.22) {
      sentimentLabel = 'Eye Strain & Squinting';
      sentimentDescription = 'Ciliary eye muscle fatigue; look into distance';
      valenceScore = Math.max(-60, Math.round(30 - curStrain * 90));
    } else if (curStress > 0.25) {
      sentimentLabel = 'Deep Problem Solving';
      sentimentDescription = 'Analytical concentration with mild brow furrow';
      valenceScore = 40;
    }

    // State Evaluation
    const isTurnedAway =
      Math.abs(currentYaw) > 24 || Math.abs(currentPitch) > 19 || Math.abs(gazeX) > 0.45 || gazeY < -0.42;
    const isDrowsy = closedDuration.current > 1000 || yawnDuration.current > 1200;
    const calculatedState = isDrowsy ? 'drowsy' : isTurnedAway ? 'distracted' : 'focused';

    // State tick callback
    if (now - lastStateTickTime.current >= 100) {
      lastStateTickTime.current = now;
      onStateTick(calculatedState, dt, Number(ear.toFixed(2)));
    }

    // THROTTLE React state updates to 10 Hz
    if (now - lastUIUpdateTime.current >= 100) {
      lastUIUpdateTime.current = now;
      const bpmVal = Math.round((blinkTimestamps.current.length * 60000) / 60000);

      setBiometrics({
        ear: Number(ear.toFixed(2)),
        bpm: bpmVal,
        gazeDirection: dir,
        yawnsDetected: yawnsCount.current,
        microsleepCount: microsleeps.current,
        pose: {
          yaw: Math.round(currentYaw),
          pitch: Math.round(currentPitch),
          roll: Math.round(currentRoll),
        },
        alignment: {
          isAligned: isPostureAligned,
          yawDeviation: Math.round(currentYaw),
          pitchDeviation: Math.round(currentPitch),
          rollDeviation: Math.round(currentRoll),
          status: postureStatus,
          cue: postureCue,
        },
        sentiment: {
          label: sentimentLabel,
          valence: valenceScore,
          scores: {
            calm: Math.max(0, Math.round(100 - curStress * 100 - curStrain * 60)),
            smile: Math.round(curSmile * 100),
            focus: Math.round((1 - Math.min(1, Math.abs(currentYaw) / 30)) * 100),
            stress: Math.round(curStress * 100),
            strain: Math.round(curStrain * 100),
          },
          description: sentimentDescription,
        },
        isFaceTracked: true,
        fps: framesCount.current,
      });
    }

    animFrameRef.current = requestAnimationFrame(loop);
  }, [videoRef, drawHud, onStateTick]);

  // Start tracking
  const start = useCallback(async () => {
    setEngineError(null);
    setEngineStatus('requesting-permission');

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Webcam API is not supported in this browser. Please use Chrome, Edge, Safari, or Firefox.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn('Video play warning:', playErr);
        }
      }

      // Check model readiness
      if (!landmarkerRef.current) {
        setEngineStatus('loading-model');
        let waited = 0;
        while (!landmarkerRef.current && waited < 12000) {
          await new Promise((r) => setTimeout(r, 100));
          waited += 100;
        }
      }

      isTrackingRef.current = true;
      setIsTracking(true);
      setEngineStatus('tracking');
      prevTick.current = performance.now();
      loop();
      return true;
    } catch (err) {
      console.error('Camera or initialization error:', err);
      let errorMsg = 'Failed to access camera.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMsg = 'Camera permission was denied. Please allow camera access in your browser address bar and try again.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMsg = 'No camera device found. Please connect a webcam to continue.';
      } else if (err.message) {
        errorMsg = err.message;
      }
      setEngineError(errorMsg);
      setEngineStatus('error');
      setIsTracking(false);
      isTrackingRef.current = false;
      throw err;
    }
  }, [videoRef, loop]);

  const stop = useCallback(() => {
    isTrackingRef.current = false;
    setIsTracking(false);
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setEngineStatus('idle');
  }, [videoRef]);

  const recenter = useCallback(() => {
    neutralBase.current = {
      yaw: smoothedPose.current.yaw,
      pitch: smoothedPose.current.pitch,
    };
  }, []);

  return {
    engineStatus,
    engineError,
    isReady,
    isTracking,
    fps,
    biometrics,
    start,
    stop,
    recenter,
  };
}
