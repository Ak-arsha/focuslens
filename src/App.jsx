import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { CameraStage } from './components/CameraStage';
import { WhoopFocusDial } from './components/WhoopFocusDial';
import { SprintController } from './components/SprintController';
import { CoreBiometricsStack } from './components/CoreBiometricsStack';
import { BiometricsGrid } from './components/BiometricsGrid';
import { AmbientSoundDeck } from './components/AmbientSoundDeck';
import { TimelineChart } from './components/TimelineChart';
import { HistoryArchive } from './components/HistoryArchive';
import { GuidedBreakModal } from './components/GuidedBreakModal';
import { SessionSummaryModal } from './components/SessionSummaryModal';
import { PrivacyModal } from './components/PrivacyModal';
import { AboutModal } from './components/AboutModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { CommandPalette } from './components/CommandPalette';
import { ThreeHeadVisualizer } from './components/ThreeHeadVisualizer';
import { useFaceLandmarker } from './hooks/useFaceLandmarker';
import { playChime } from './utils/audio';
import { saveSessionToDB, getAllSessionsFromDB, deleteSessionFromDB } from './utils/db';
import {
  Compass,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Eye,
  Square,
  Coffee,
  Play,
  Pause,
  Menu,
  X,
  Command,
  Box,
  Activity,
  Music,
  BarChart3,
  Archive,
  Video
} from 'lucide-react';

const THEME_KEY = 'focuslens:theme';
const TARGET_SCORES = { focused: 100, distracted: 38, drowsy: 10, idle: 80 };

export function App() {
  const videoRef = useRef(null);
  const hudCanvasRef = useRef(null);

  // Active Workspace Tab ('studio' | 'biometrics' | 'soundscapes' | 'timeline' | 'archive')
  const [activeTab, setActiveTab] = useState('studio');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // App Theme & Controls
  const [theme, setTheme] = useState('dark');
  const [soundFxEnabled, setSoundFxEnabled] = useState(true);
  const [hudEnabled, setHudEnabled] = useState(true);

  // Sprint & Session State
  const [state, setState] = useState('idle');
  const [score, setScore] = useState(85);
  const [sprintMins, setSprintMins] = useState(25);
  const [timeRemainingMs, setTimeRemainingMs] = useState(25 * 60 * 1000);
  const [cycleCount, setCycleCount] = useState(1);

  // Analytics & History
  const [timeline, setTimeline] = useState([]);
  const [history, setHistory] = useState([]);
  const [timeInState, setTimeInState] = useState({ focused: 0, distracted: 0, drowsy: 0 });
  const [elapsedMs, setElapsedMs] = useState(0);
  const [bestStreakMs, setBestStreakMs] = useState(0);
  const [maxDistractionMs, setMaxDistractionMs] = useState(0);

  // Modals
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isBreakOpen, setIsBreakOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [sessionSummaryData, setSessionSummaryData] = useState(null);
  const [toast, setToast] = useState(null);

  // Tracking refs
  const scoreRef = useRef(85);
  const scoreSumRef = useRef(0);
  const scoreCountRef = useRef(0);
  const currentStreakRef = useRef(0);
  const bestStreakRef = useRef(0);
  const distractionStreakRef = useRef(0);
  const maxDistractionRef = useRef(0);
  const lastAudioWarningRef = useRef(0);
  const lastTimelineLogRef = useRef(0);
  const sessionStartTimeRef = useRef(0);
  const sprintEndRef = useRef(0);
  const alignedFramesRef = useRef(0);
  const totalFramesRef = useRef(0);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // State tick callback from useFaceLandmarker
  const handleStateTick = useCallback(
    (detectedState, dt, currentEar) => {
      const now = performance.now();
      setState(detectedState);

      // Adaptive Flow Scoring
      const targetScore = TARGET_SCORES[detectedState] ?? 80;
      const alpha = 0.08;
      const nextScore = Math.max(0, Math.min(100, scoreRef.current + alpha * (targetScore - scoreRef.current)));
      scoreRef.current = nextScore;
      setScore(nextScore);

      scoreSumRef.current += nextScore;
      scoreCountRef.current += 1;

      // Track streaks & distraction
      if (detectedState === 'focused') {
        currentStreakRef.current += dt;
        distractionStreakRef.current = 0;
        if (currentStreakRef.current > bestStreakRef.current) {
          bestStreakRef.current = currentStreakRef.current;
          setBestStreakMs(currentStreakRef.current);
        }
      } else if (detectedState === 'distracted' || detectedState === 'drowsy') {
        distractionStreakRef.current += dt;
        currentStreakRef.current = 0;
        if (distractionStreakRef.current > maxDistractionRef.current) {
          maxDistractionRef.current = distractionStreakRef.current;
          setMaxDistractionMs(distractionStreakRef.current);
        }

        // Auditory cues for drift or drowsiness
        if (soundFxEnabled && now - lastAudioWarningRef.current > 12000) {
          if (detectedState === 'drowsy') {
            playChime('alert');
            lastAudioWarningRef.current = now;
          } else if (distractionStreakRef.current > 3500) {
            playChime('warn');
            lastAudioWarningRef.current = now;
          }
        }
      }

      totalFramesRef.current += 1;

      setTimeInState((prev) => ({
        ...prev,
        [detectedState]: (prev[detectedState] || 0) + dt,
      }));

      // Log timeline telemetry every 1000ms
      if (now - lastTimelineLogRef.current >= 1000) {
        lastTimelineLogRef.current = now;
        const currentElapsed = sessionStartTimeRef.current ? now - sessionStartTimeRef.current : 0;
        setElapsedMs(currentElapsed);

        setTimeline((prev) => [
          ...prev.slice(-120),
          {
            t: Math.round(currentElapsed / 1000),
            s: Math.round(nextScore),
            st: detectedState,
            ear: currentEar,
          },
        ]);
      }
    },
    [soundFxEnabled]
  );

  // Hook instance
  const {
    engineStatus,
    engineError,
    isReady,
    isTracking,
    fps,
    biometrics,
    start: startTracking,
    stop: stopTracking,
    recenter,
  } = useFaceLandmarker(videoRef, hudCanvasRef, hudEnabled, handleStateTick);

  // Posture frame counter
  useEffect(() => {
    if (isTracking && biometrics.alignment?.isAligned) {
      alignedFramesRef.current += 1;
    }
  }, [isTracking, biometrics.alignment?.isAligned]);

  // Apply Theme helper
  const applyTheme = (themeName) => {
    document.documentElement.setAttribute('data-theme', themeName);
    if (themeName === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  };

  // Initialize Theme and load past sessions from IndexedDB
  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_KEY) || 'dark';
    setTheme(savedTheme);
    applyTheme(savedTheme);

    getAllSessionsFromDB()
      .then((sessions) => setHistory(sessions))
      .catch((err) => console.warn('Could not load sessions from IndexedDB:', err));
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    applyTheme(next);
    localStorage.setItem(THEME_KEY, next);
  };

  // Sprint Timer Countdown Loop
  useEffect(() => {
    if (!isTracking || isBreakOpen) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, sprintEndRef.current - Date.now());
      setTimeRemainingMs(remaining);

      if (remaining === 0) {
        if (soundFxEnabled) playChime('complete');
        showToast('Sprint Finished! Take a restorative break.');
        setIsBreakOpen(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isTracking, isBreakOpen, soundFxEnabled]);

  // Start Focus Session
  const handleStartSession = async () => {
    try {
      await startTracking();
      sessionStartTimeRef.current = performance.now();
      sprintEndRef.current = Date.now() + sprintMins * 60 * 1000;
      setTimeRemainingMs(sprintMins * 60 * 1000);
      scoreRef.current = 85;
      scoreSumRef.current = 0;
      scoreCountRef.current = 0;
      alignedFramesRef.current = 0;
      totalFramesRef.current = 0;
      currentStreakRef.current = 0;
      bestStreakRef.current = 0;
      distractionStreakRef.current = 0;
      maxDistractionRef.current = 0;
      setTimeline([]);
      setTimeInState({ focused: 0, distracted: 0, drowsy: 0 });

      if (soundFxEnabled) playChime('start');
      showToast('Camera active. Telemetry running.');
    } catch (err) {
      console.warn('Start session aborted:', err);
    }
  };

  // End Session & Generate Health Report
  const handleEndSession = async () => {
    stopTracking();
    const duration = Math.max(1000, elapsedMs);
    const totalTime = timeInState.focused + timeInState.distracted + timeInState.drowsy || 1;
    const flowPct = Math.round((timeInState.focused / totalTime) * 100);
    const avgScore = Math.round(scoreSumRef.current / Math.max(scoreCountRef.current, 1)) || 80;
    const alignmentPct = totalFramesRef.current > 0
      ? Math.round((alignedFramesRef.current / totalFramesRef.current) * 100)
      : 88;

    const summary = {
      id: `session_${Date.now()}`,
      date: new Date().toISOString(),
      timestamp: Date.now(),
      durationMs: duration,
      avgScore,
      flowPct,
      bestStreakMs: bestStreakRef.current,
      maxDistractionMs: maxDistractionRef.current,
      yawns: biometrics.yawnsDetected || 0,
      microsleeps: biometrics.microsleepCount || 0,
      dominantSentiment: biometrics.sentiment?.label || 'Calm Flow',
      alignmentScore: alignmentPct,
      avgBpm: biometrics.bpm || 16,
      timeline,
    };

    setSessionSummaryData(summary);
    setIsSummaryOpen(true);

    if (duration > 10000) {
      try {
        await saveSessionToDB(summary);
        const updated = await getAllSessionsFromDB();
        setHistory(updated);
      } catch (err) {
        console.warn('Failed to persist session to IndexedDB:', err);
      }
    }

    if (soundFxEnabled) playChime('complete');
  };

  // Quick Restorative Break
  const handleTakeBreak = () => {
    setIsBreakOpen(true);
    if (soundFxEnabled) playChime('warn');
  };

  // Resume from Guided Break
  const handleResumeFromBreak = () => {
    setIsBreakOpen(false);
    setCycleCount((prev) => prev + 1);
    sprintEndRef.current = Date.now() + sprintMins * 60 * 1000;
    setTimeRemainingMs(sprintMins * 60 * 1000);
    if (!isTracking) {
      startTracking();
    }
    if (soundFxEnabled) playChime('start');
    showToast(`Cycle #${cycleCount + 1} started.`);
  };

  // Format Remaining Timer
  const formatRemaining = (ms) => {
    const totalSecs = Math.max(0, Math.ceil(ms / 1000));
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  // Export CSV
  const handleExportCsv = () => {
    if (!timeline.length) {
      showToast('No telemetry data to export yet.');
      return;
    }
    const headers = 'timestamp_seconds,focus_score,state,eye_openness_ear\n';
    const rows = timeline.map((p) => `${p.t},${p.s},${p.st},${p.ear}`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `focuslens-telemetry-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('CSV telemetry exported.');
  };

  // Export JSON
  const handleExportJson = () => {
    const summary = sessionSummaryData || {
      app: 'FocusLens',
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      durationMs: elapsedMs,
      averageScore: Math.round(scoreRef.current),
      timeline,
    };
    const blob = new Blob([JSON.stringify(summary, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `focuslens-session-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('JSON session exported.');
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if (e.code === 'Space') {
        e.preventDefault();
        if (!isTracking) handleStartSession();
        else stopTracking();
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        recenter();
        if (soundFxEnabled) playChime('calibrate');
        showToast('Neutral posture baseline calibrated.');
      } else if (e.code === 'KeyB') {
        e.preventDefault();
        handleTakeBreak();
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        setSoundFxEnabled((prev) => {
          showToast(!prev ? 'Auditory alerts unmuted' : 'Auditory alerts muted');
          return !prev;
        });
      } else if (e.code === 'KeyH') {
        e.preventDefault();
        setHudEnabled((prev) => {
          showToast(!prev ? 'HUD overlay shown' : 'HUD overlay hidden');
          return !prev;
        });
      } else if (e.code === 'KeyT') {
        e.preventDefault();
        toggleTheme();
      } else if (e.code === 'KeyE' && isTracking) {
        e.preventDefault();
        handleEndSession();
      } else if (e.key === '?') {
        e.preventDefault();
        setIsShortcutsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTracking, soundFxEnabled, theme]);

  const currentFlowRatio = totalFramesRef.current > 0
    ? Math.round(((timeInState.focused || 0) / (elapsedMs || 1)) * 100)
    : 85;

  const currentAlignmentScore = totalFramesRef.current > 0
    ? Math.round((alignedFramesRef.current / totalFramesRef.current) * 100)
    : 90;

  const getTabLabel = () => {
    switch (activeTab) {
      case 'studio': return 'Live Studio & Camera Telemetry';
      case 'biometrics': return 'Biometrics & Cognitive Affect';
      case 'soundscapes': return 'Ambient Audio Synthesizer';
      case 'timeline': return 'Telemetry Analytics & Trends';
      case 'archive': return 'Session Archive & Local Records';
      default: return 'FocusLens';
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-heading)] flex flex-col md:flex-row font-sans transition-colors duration-200 overflow-x-hidden">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-slate-900/95 text-white border border-emerald-500/40 shadow-2xl text-xs font-semibold flex items-center gap-2 backdrop-blur-md animate-in slide-in-from-bottom-2 duration-150">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{toast}</span>
        </div>
      )}

      {/* Desktop Linear Sidebar */}
      <div className="hidden md:flex">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isTracking={isTracking}
          state={state}
          fps={fps}
          soundFxEnabled={soundFxEnabled}
          toggleSoundFx={() => setSoundFxEnabled(!soundFxEnabled)}
          theme={theme}
          toggleTheme={toggleTheme}
          onCalibrate={() => {
            recenter();
            if (soundFxEnabled) playChime('calibrate');
            showToast('Neutral posture calibrated.');
          }}
          onOpenPrivacy={() => setIsPrivacyOpen(true)}
          onOpenShortcuts={() => setIsShortcutsOpen(true)}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        />
      </div>

      {/* Mobile Drawer Overlay */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-black/80 backdrop-blur-sm">
          <div className="relative w-72 h-full bg-[var(--bg-sidebar)] flex flex-col justify-between">
            <Sidebar
              activeTab={activeTab}
              setActiveTab={(tab) => {
                setActiveTab(tab);
                setIsMobileSidebarOpen(false);
              }}
              isTracking={isTracking}
              state={state}
              fps={fps}
              soundFxEnabled={soundFxEnabled}
              toggleSoundFx={() => setSoundFxEnabled(!soundFxEnabled)}
              theme={theme}
              toggleTheme={toggleTheme}
              onCalibrate={() => {
                recenter();
                if (soundFxEnabled) playChime('calibrate');
                showToast('Neutral posture calibrated.');
              }}
              onOpenPrivacy={() => {
                setIsMobileSidebarOpen(false);
                setIsPrivacyOpen(true);
              }}
              onOpenShortcuts={() => {
                setIsMobileSidebarOpen(false);
                setIsShortcutsOpen(true);
              }}
              onOpenCommandPalette={() => {
                setIsMobileSidebarOpen(false);
                setIsCommandPaletteOpen(true);
              }}
            />
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg linear-btn-secondary"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Cockpit Area */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Top Sticky Header */}
        <header className="sticky top-0 z-30 linear-panel border-b border-white/5 px-4 sm:px-6 py-3 flex items-center justify-between gap-4 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="md:hidden p-2 rounded-lg linear-btn-secondary"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div>
              <h1 className="font-display font-bold text-sm sm:text-base linear-text-heading flex items-center gap-2">
                <span>{getTabLabel()}</span>
              </h1>
              <div className="flex items-center gap-2 text-[11px] linear-text-muted">
                <span>Cycle #{cycleCount}</span>
                <span>•</span>
                <span className="font-mono text-emerald-400">{formatRemaining(timeRemainingMs)}</span>
              </div>
            </div>
          </div>

          {/* Quick Header Action Bar */}
          <div className="flex items-center gap-2">
            {/* Start / Pause Button */}
            {isTracking ? (
              <button
                onClick={() => {
                  stopTracking();
                  showToast('Camera paused.');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg linear-btn-secondary text-xs font-semibold text-amber-400"
                title="Pause camera stream (Space)"
              >
                <Pause className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Pause</span>
              </button>
            ) : (
              <button
                onClick={handleStartSession}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-sm"
                title="Start camera tracking (Space)"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start</span>
              </button>
            )}

            {/* Recenter Baseline Button */}
            <button
              onClick={() => {
                recenter();
                if (soundFxEnabled) playChime('calibrate');
                showToast('Neutral posture calibrated.');
              }}
              className="p-2 rounded-lg linear-btn-secondary"
              title="Recenter Baseline (Press R)"
            >
              <Compass className="w-4 h-4 text-cyan-400" />
            </button>

            {/* Take 4-7-8 Break Button */}
            <button
              onClick={handleTakeBreak}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg linear-btn-secondary text-xs font-semibold"
              title="Take a 4-7-8 recovery break (Press B)"
            >
              <Coffee className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Break</span>
            </button>

            {/* End Session Button with Clear Direction */}
            {isTracking && (
              <button
                onClick={handleEndSession}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-400 text-xs font-bold transition-all shadow-sm"
                title="End active session and view comprehensive summary report (Press E)"
              >
                <Square className="w-3.5 h-3.5" />
                <span>End Session</span>
                <kbd className="px-1 py-0.2 rounded bg-rose-500/20 text-[9px] font-mono">E</kbd>
              </button>
            )}

            {/* Command Palette Trigger */}
            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              className="p-2 rounded-lg linear-btn-secondary hidden sm:flex"
              title="Command Palette (Cmd+K)"
            >
              <Command className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Dynamic Workspace Body */}
        <div className="flex-1 p-4 sm:p-6 lg:p-7 max-w-7xl w-full mx-auto flex flex-col gap-6">
          {/* TAB 1: LIVE STUDIO (Always kept mounted in DOM to preserve video stream & MediaPipe tracking) */}
          <div style={{ display: activeTab === 'studio' ? 'block' : 'none' }}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Left Column (7 cols): Hero Camera Stage + 3D Hologram Card directly beneath it */}
              <div className="lg:col-span-7 flex flex-col gap-4">
                <div className="linear-panel p-4 rounded-2xl shadow-xl border border-white/5">
                  <CameraStage
                    videoRef={videoRef}
                    hudCanvasRef={hudCanvasRef}
                    state={state}
                    isTracking={isTracking}
                    onStartTracking={handleStartSession}
                    engineStatus={engineStatus}
                    engineError={engineError}
                    fps={fps}
                    isFaceTracked={biometrics.isFaceTracked}
                    alignment={biometrics.alignment}
                    pose={biometrics.pose}
                  />
                </div>

                {/* 3D Cervical Spine Hologram Card (Placed directly beneath the camera) */}
                <div className="linear-panel p-4 rounded-2xl shadow-lg border border-white/5 flex flex-col gap-2">
                  <div className="flex items-center justify-between pb-2 border-b border-white/5">
                    <div className="flex items-center gap-2">
                      <Box className="w-4 h-4 text-cyan-400" />
                      <span className="font-display font-bold text-xs uppercase tracking-wider linear-text-heading">
                        3D Cervical Spine Hologram
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        WebGL Real-Time
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <div className="flex items-center gap-2 font-mono text-[11px] linear-text-muted">
                        <span>Y: <b className="linear-text-heading">{biometrics.pose?.yaw ?? 0}&deg;</b></span>
                        <span>P: <b className="linear-text-heading">{biometrics.pose?.pitch ?? 0}&deg;</b></span>
                        <span>R: <b className="linear-text-heading">{biometrics.pose?.roll ?? 0}&deg;</b></span>
                      </div>
                      <button
                        onClick={() => {
                          recenter();
                          if (soundFxEnabled) playChime('calibrate');
                          showToast('Neutral posture calibrated.');
                        }}
                        className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                        title="Recenter Baseline (Press R)"
                      >
                        <Compass className="w-3 h-3" />
                        <span>Recenter</span>
                      </button>
                    </div>
                  </div>

                  <div className="w-full h-48 relative overflow-hidden rounded-xl linear-inset">
                    <ThreeHeadVisualizer
                      pose={biometrics.pose}
                      state={state}
                      isFaceTracked={biometrics.isFaceTracked}
                    />
                  </div>
                </div>
              </div>

              {/* Right Column (5 cols): Dominant Whoop Focus Score Dial + Sprint Controller + Quick Preview */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                <WhoopFocusDial
                  score={score}
                  state={state}
                  isTracking={isTracking}
                  streakMs={currentStreakRef.current}
                  alignmentScore={currentAlignmentScore}
                  flowRatio={currentFlowRatio}
                />

                <SprintController
                  durationMinutes={sprintMins}
                  setDurationMinutes={(m) => {
                    setSprintMins(m);
                    if (isTracking) {
                      sprintEndRef.current = Date.now() + m * 60 * 1000;
                      setTimeRemainingMs(m * 60 * 1000);
                    } else {
                      setTimeRemainingMs(m * 60 * 1000);
                    }
                    showToast(`Sprint duration set to ${m}m.`);
                  }}
                  timeRemainingFormatted={formatRemaining(timeRemainingMs)}
                  cycleCount={cycleCount}
                  isTracking={isTracking}
                  onQuickBreak={handleTakeBreak}
                  onEndSession={handleEndSession}
                  onToggleTracking={() => {
                    if (isTracking) stopTracking();
                    else startTracking();
                  }}
                />

                <CoreBiometricsStack
                  biometrics={biometrics}
                  state={state}
                  onRecenter={() => {
                    recenter();
                    if (soundFxEnabled) playChime('calibrate');
                    showToast('Neutral posture calibrated.');
                  }}
                />
              </div>
            </div>
          </div>

          {/* TAB 2: BIOMETRICS & COGNITIVE AFFECT */}
          {activeTab === 'biometrics' && (
            <div className="animate-in fade-in duration-200">
              <BiometricsGrid
                biometrics={biometrics}
                state={state}
                score={score}
                onRecenter={() => {
                  recenter();
                  if (soundFxEnabled) playChime('calibrate');
                  showToast('Neutral posture calibrated.');
                }}
              />
            </div>
          )}

          {/* TAB 3: AMBIENT AUDIO SYNTHESIZER */}
          {activeTab === 'soundscapes' && (
            <div className="animate-in fade-in duration-200">
              <AmbientSoundDeck
                soundFxEnabled={soundFxEnabled}
                onToggleSoundFx={() => setSoundFxEnabled(!soundFxEnabled)}
              />
            </div>
          )}

          {/* TAB 4: TELEMETRY ANALYTICS */}
          {activeTab === 'timeline' && (
            <div className="animate-in fade-in duration-200 flex flex-col gap-5">
              <div className="linear-panel p-5 rounded-2xl border border-white/5 shadow-xl">
                <TimelineChart
                  timeline={timeline}
                  elapsedMs={elapsedMs}
                  bestStreakMs={bestStreakMs}
                  maxDistractionMs={maxDistractionMs}
                  avgScore={Math.round(score)}
                  timeInState={timeInState}
                  onExportCsv={handleExportCsv}
                  onExportJson={handleExportJson}
                  isTracking={isTracking}
                />
              </div>
            </div>
          )}

          {/* TAB 5: SESSION ARCHIVE */}
          {activeTab === 'archive' && (
            <div className="animate-in fade-in duration-200">
              <HistoryArchive
                history={history}
                onClearHistory={async () => {
                  try {
                    for (const s of history) {
                      await deleteSessionFromDB(s.id);
                    }
                    setHistory([]);
                    showToast('History cleared.');
                  } catch (err) {
                    console.error('Failed to clear history:', err);
                  }
                }}
              />
            </div>
          )}
        </div>
      </main>

      {/* Guided 4-7-8 Breathing Break Modal */}
      {isBreakOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-xl">
            <GuidedBreakModal
              isOpen={isBreakOpen}
              onResumeSprint={handleResumeFromBreak}
            />
            <button
              onClick={() => setIsBreakOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-lg linear-btn-secondary"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Session Summary Modal */}
      <SessionSummaryModal
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
        sessionStats={sessionSummaryData}
        onStartNewSprint={handleStartSession}
        onExportCsv={handleExportCsv}
        onExportJson={handleExportJson}
      />

      {/* Privacy Architecture Modal */}
      <PrivacyModal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
      />

      {/* About FocusLens Modal */}
      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Raycast Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        isTracking={isTracking}
        onStartTracking={handleStartSession}
        onToggleTracking={() => {
          if (isTracking) stopTracking();
          else startTracking();
        }}
        onRecenter={() => {
          recenter();
          if (soundFxEnabled) playChime('calibrate');
          showToast('Neutral posture calibrated.');
        }}
        onTakeBreak={handleTakeBreak}
        onEndSession={handleEndSession}
        soundFxEnabled={soundFxEnabled}
        onToggleSound={() => setSoundFxEnabled(!soundFxEnabled)}
        hudEnabled={hudEnabled}
        onToggleHud={() => setHudEnabled(!hudEnabled)}
        theme={theme}
        onToggleTheme={toggleTheme}
        onExportCsv={handleExportCsv}
        onExportJson={handleExportJson}
        onOpenShareCard={() => showToast('Share summary generated.')}
        onOpenPrivacy={() => setIsPrivacyOpen(true)}
        onOpenAbout={() => setIsAboutOpen(true)}
      />
    </div>
  );
}
