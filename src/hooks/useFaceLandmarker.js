import { useEffect, useRef, useState, useCallback } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm';
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

const LEFT_EYE = [33, 160, 158, 133, 153, 144];
const RIGHT_EYE = [362, 385, 387, 263, 373, 380];
const LEFT_IRIS = [468, 469, 470, 471, 472];
const RIGHT_IRIS = [473, 474, 475, 476, 477];
const NOSE_TIP = 1;

export function useFaceLandmarker(videoRef, hudCanvasRef, hudEnabled, onStateTick) {
  const [isReady, setIsReady] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [fps, setFps] = useState(0);

  const landmarkerRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameRef = useRef(null);

  const neutralBase = useRef({ yaw: 0, pitch: 0 });
  const smoothedPose = useRef({ yaw: 0, pitch: 0, roll: 0 });

  // Biometrics State
  const [biometrics, setBiometrics] = useState({
    ear: 0,
    bpm: null,
    gazeDirection: 'Center',
    yawnsDetected: 0,
    microsleepCount: 0,
    pose: { yaw: 0, pitch: 0, roll: 0 },
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

  // Initialize MediaPipe FaceLandmarker
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
        console.error('Failed to load FaceLandmarker:', err);
      }
    }

    init();

    return () => {
      active = false;
      landmarkerRef.current?.close();
    };
  }, []);

  const drawHud = useCallback(
    (landmarks, video) => {
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

      // Eye Contours
      [LEFT_EYE, RIGHT_EYE].forEach((eye) => {
        ctx.beginPath();
        ctx.strokeStyle = '#10B981';
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.85;
        eye.forEach((idx, i) => {
          const p = pt(idx);
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.closePath();
        ctx.stroke();
      });

      // Iris Crosshairs
      [LEFT_IRIS[0], RIGHT_IRIS[0]].forEach((irisIdx) => {
        if (landmarks[irisIdx]) {
          const p = pt(irisIdx);
          ctx.beginPath();
          ctx.arc(p.x, p.y, 3.5, 0, 2 * Math.PI);
          ctx.fillStyle = '#10B981';
          ctx.globalAlpha = 0.95;
          ctx.fill();

          ctx.beginPath();
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 1;
          ctx.globalAlpha = 0.6;
          ctx.moveTo(p.x - 6, p.y);
          ctx.lineTo(p.x + 6, p.y);
          ctx.moveTo(p.x, p.y - 6);
          ctx.lineTo(p.x + 6, p.y);
          ctx.stroke();
        }
      });

      // Nose direction ray
      const nose = pt(NOSE_TIP);
      const yawOffset = (smoothedPose.current.yaw - neutralBase.current.yaw) * 1.2;
      const pitchOffset = (smoothedPose.current.pitch - neutralBase.current.pitch) * 1.2;

      ctx.beginPath();
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.6;
      ctx.moveTo(nose.x, nose.y);
      ctx.lineTo(nose.x + yawOffset, nose.y + pitchOffset);
      ctx.stroke();

      ctx.restore();
    },
    [hudEnabled, hudCanvasRef]
  );

  const loop = useCallback(() => {
    const video = videoRef.current;
    const landmarker = landmarkerRef.current;
    if (!video || !landmarker) return;

    animFrameRef.current = requestAnimationFrame(loop);

    const now = performance.now();
    if (video.readyState < 2) return;

    const dt = Math.min(now - prevTick.current, 200);
    prevTick.current = now;

    // FPS calculation
    framesCount.current++;
    if (now - lastFpsTime.current >= 1000) {
      setFps(framesCount.current);
      framesCount.current = 0;
      lastFpsTime.current = now;
    }

    const detection = landmarker.detectForVideo(video, now);
    const faceLandmarks = detection.faceLandmarks?.[0];

    drawHud(faceLandmarks, video);

    if (!faceLandmarks) {
      noFaceDuration.current += dt;
      closedDuration.current = 0;
      yawnDuration.current = 0;

      const st = noFaceDuration.current > 1500 ? 'distracted' : 'focused';
      onStateTick(st, dt, 0);

      setBiometrics((prev) => ({
        ...prev,
        isFaceTracked: false,
        fps: framesCount.current,
      }));
      return;
    }

    noFaceDuration.current = 0;
    const vW = video.videoWidth || 640;
    const vH = video.videoHeight || 480;
    const dist = (a, b) =>
      Math.hypot((faceLandmarks[a].x - faceLandmarks[b].x) * vW, (faceLandmarks[a].y - faceLandmarks[b].y) * vH);

    // Eye Aspect Ratio (EAR)
    const earL =
      (dist(LEFT_EYE[1], LEFT_EYE[5]) + dist(LEFT_EYE[2], LEFT_EYE[4])) / (2 * dist(LEFT_EYE[0], LEFT_EYE[3]));
    const earR =
      (dist(RIGHT_EYE[1], RIGHT_EYE[5]) + dist(RIGHT_EYE[2], RIGHT_EYE[4])) /
      (2 * dist(RIGHT_EYE[0], RIGHT_EYE[3]));
    const ear = (earL + earR) / 2;

    // Blendshapes Analysis
    const blendshapes = {};
    (detection.faceBlendshapes?.[0]?.categories || []).forEach((cat) => {
      blendshapes[cat.categoryName] = cat.score;
    });

    // Horizontal & Vertical Gaze Estimation
    const gazeX =
      ((blendshapes.eyeLookInLeft || 0) + (blendshapes.eyeLookOutRight || 0) -
        ((blendshapes.eyeLookOutLeft || 0) + (blendshapes.eyeLookInRight || 0))) /
        2 || 0;
    const gazeY =
      ((blendshapes.eyeLookUpLeft || 0) + (blendshapes.eyeLookUpRight || 0) -
        ((blendshapes.eyeLookDownLeft || 0) + (blendshapes.eyeLookDownRight || 0))) /
        2 || 0;

    let dir = 'Center';
    if (Math.abs(gazeX) < 0.28 && Math.abs(gazeY) < 0.28) {
      dir = 'Center';
    } else if (Math.abs(gazeX) >= Math.abs(gazeY)) {
      dir = gazeX > 0 ? 'Right' : 'Left';
    } else {
      dir = gazeY > 0 ? 'Up' : 'Down';
    }

    // 3D Head Orientation via 4x4 matrix
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

    // Blink & Eye Closure Tracking
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

    // Yawn Detection
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

    // State Evaluation
    const isTurnedAway =
      Math.abs(currentYaw) > 24 || Math.abs(currentPitch) > 19 || Math.abs(gazeX) > 0.45 || gazeY < -0.42;
    const isDrowsy = closedDuration.current > 1000 || yawnDuration.current > 1200;
    const calculatedState = isDrowsy ? 'drowsy' : isTurnedAway ? 'distracted' : 'focused';

    onStateTick(calculatedState, dt, Number(ear.toFixed(2)));

    // Blink rate
    const bpmVal = Math.round((blinkTimestamps.current.length * 60000) / 60000);

    setBiometrics({
      ear: Number(ear.toFixed(2)),
      bpm: bpmVal,
      gazeDirection: dir,
      yawnsDetected: yawnsCount.current,
      microsleepCount: microsleeps.current,
      pose: { yaw: currentYaw, pitch: currentPitch, roll: currentRoll },
      isFaceTracked: true,
      fps: framesCount.current,
    });
  }, [videoRef, drawHud, onStateTick]);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsTracking(true);
      prevTick.current = performance.now();
      loop();
    } catch (err) {
      console.error('Camera access error:', err);
      throw err;
    }
  }, [videoRef, loop]);

  const stop = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsTracking(false);
  }, [videoRef]);

  const recenter = useCallback(() => {
    neutralBase.current = {
      yaw: smoothedPose.current.yaw,
      pitch: smoothedPose.current.pitch,
    };
  }, []);

  return {
    isReady,
    isTracking,
    fps,
    biometrics,
    start,
    stop,
    recenter,
  };
}
