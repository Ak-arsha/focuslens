import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { CameraStage } from './components/CameraStage';
import { WhoopFocusDial } from './components/WhoopFocusDial';
import { BiometricsGrid } from './components/BiometricsGrid';
import { SprintController } from './components/SprintController';
import { AmbientSoundDeck } from './components/AmbientSoundDeck';
import { GuidedBreakModal } from './components/GuidedBreakModal';
import { TimelineChart } from './components/TimelineChart';
import { HistoryArchive } from './components/HistoryArchive';
import { PrivacyModal } from './components/PrivacyModal';
import { ShareModal } from './components/ShareModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { AboutModal } from './components/AboutModal';
import { SessionSummaryModal } from './components/SessionSummaryModal';
import { CommandPalette } from './components/CommandPalette';
import { ThreeHeadVisualizer } from './components/ThreeHeadVisualizer';
import { useFaceLandmarker } from './hooks/useFaceLandmarker';
import { playChime, setAmbientSound, updateAmbientVolume } from './utils/audio';
import {
  ShieldCheck,
  Info,
  Command,
  Compass,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Eye,
  Activity,
  Sparkles
} from 'lucide-react';

const STORAGE_KEY = 'focuslens:history_v2';
const THEME_KEY = 'focuslens:theme';
const VIEW_KEY = 'focuslens:view_mode';

const TARGET_SCORES = { focused: 100, distracted: 38, drowsy: 10, idle: 80 };

export function App() {
  const videoRef = useRef(null);
  const hudCanvasRef = useRef(null);

  // App Shell & Navigation
  const [activeTab, setActiveTab] = useState('studio');
  const [theme, setTheme] = useState('dark');
  const [viewMode, setViewMode] = useState('studio');
  const [soundFxEnabled, setSoundFxEnabled] = useState(true);
  const [hudEnabled, setHudEnabled] = useState(true);
  const [ambientMode, setAmbientMode] = useState('off');
  const [ambientVol, setAmbientVol] = useState(35);

  // Focus & Sprint Tracking State
  const [state, setState] = useState('idle');
  const [score, setScore] = useState(85);
  const [sprintMins, setSprintMins] = useState(25);
  const [cycleCount, setCycleCount] = useState(1);
  const [timeRemainingMs, setTimeRemainingMs] = useState(25 * 60 * 1000);
  const [isBreakOpen, setIsBreakOpen] = useState(false);

  // Analytics & History
  const [timeline, setTimeline] = useState([]);
  const [history, setHistory] = useState([]);
  const [timeInState, setTimeInState] = useState({ focused: 0, distracted: 0, drowsy: 0 });
  const [elapsedMs, setElapsedMs] = useState(0);
  const [bestStreakMs, setBestStreakMs] = useState(0);
  const [maxDistractionMs, setMaxDistractionMs] = useState(0);

  // Modals & Overlays
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [sessionSummaryData, setSessionSummaryData] = useState(null);
  const [toast, setToast] = useState(null);

  // Ref tracking for high-frequency processing loops
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
    (nextState, dt, ear) => {
      setState(nextState);

      // Score exponential transition
      const target = TARGET_SCORES[nextState];
      scoreRef.current += (target - scoreRef.current) * Math.min(1, dt / 1500);
      scoreSumRef.current += scoreRef.current;
      scoreCountRef.current++;
      totalFramesRef.current++;
      setScore(scoreRef.current);

      // Time in state
      if (nextState !== 'idle') {
        setTimeInState((prev) => ({
          ...prev,
          [nextState]: prev[nextState] + dt,
        }));
      }

      // Streaks
      if (nextState === 'focused') {
        currentStreakRef.current += dt;
        bestStreakRef.current = Math.max(bestStreakRef.current, currentStreakRef.current);
        distractionStreakRef.current = 0;
      } else {
        currentStreakRef.current = 0;
        distractionStreakRef.current += dt;
        maxDistractionRef.current = Math.max(maxDistractionRef.current, distractionStreakRef.current);
      }
      setBestStreakMs(bestStreakRef.current);
      setMaxDistractionMs(maxDistractionRef.current);

      const now = performance.now();
      const currentElapsed = now - sessionStartTimeRef.current;
      setElapsedMs(currentElapsed);

      // Sound FX alerts
      if (
        soundFxEnabled &&
        nextState !== 'focused' &&
        distractionStreakRef.current > 4000 &&
        !isBreakOpen &&
        now - lastAudioWarningRef.current > 10000
      ) {
        playChime(nextState === 'drowsy' ? 'alert' : 'warn');
        lastAudioWarningRef.current = now;
      }

      // Sprint countdown
      if (!isBreakOpen) {
        const remaining = Math.max(0, sprintEndRef.current - now);
        setTimeRemainingMs(remaining);
        if (remaining <= 0) {
          setIsBreakOpen(true);
          playChime('complete');
          showToast('Focus Sprint Complete! Starting restorative break.');
        }
      }

      // Timeline log every 1000ms
      if (now - lastTimelineLogRef.current >= 1000) {
        lastTimelineLogRef.current = now;
        setTimeline((prev) => [
          ...prev,
          {
            t: Math.round(currentElapsed / 1000),
            s: Math.round(scoreRef.current),
            st: nextState,
            ear,
          },
        ]);
      }
    },
    [soundFxEnabled, isBreakOpen]
  );

  const { isTracking, fps, biometrics, start, stop, recenter } = useFaceLandmarker(
    videoRef,
    hudCanvasRef,
    hudEnabled,
    handleStateTick
  );

  // Track posture alignment frames
  useEffect(() => {
    if (biometrics.alignment?.isAligned) {
      alignedFramesRef.current++;
    }
  }, [biometrics.alignment]);

  // Apply Theme Helper
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

  // Initialize Theme and ViewMode from LocalStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_KEY) || 'dark';
    setTheme(savedTheme);
    applyTheme(savedTheme);

    const savedView = localStorage.getItem(VIEW_KEY) || 'studio';
    setViewMode(savedView);

    try {
      const savedHistory = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      setHistory(savedHistory);
    } catch {
      // ignore parse error
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    applyTheme(next);
    localStorage.setItem(THEME_KEY, next);
    if (soundFxEnabled) playChime('click');
    showToast(`Switched to ${next === 'dark' ? 'Dark' : 'Light'} Mode`);
  };

  const handleSetViewMode = (mode) => {
    setViewMode(mode);
    localStorage.setItem(VIEW_KEY, mode);
    if (soundFxEnabled) playChime('click');
  };

  const handleAmbientChange = (mode) => {
    setAmbientMode(mode);
    setAmbientSound(mode, ambientVol);
    showToast(`Ambient soundscape: ${mode === 'off' ? 'Mute' : mode}`);
  };

  const handleVolumeChange = (vol) => {
    setAmbientVol(vol);
    updateAmbientVolume(vol);
  };

  const handleSprintMinsChange = (mins) => {
    setSprintMins(mins);
    const ms = mins * 60 * 1000;
    setTimeRemainingMs(ms);
    if (isTracking && !isBreakOpen) {
      sprintEndRef.current = performance.now() + ms;
    }
    if (soundFxEnabled) playChime('click');
    showToast(`Sprint duration set to ${mins} minutes`);
  };

  const handleStartTracking = async () => {
    try {
      await start();
      const now = performance.now();
      sessionStartTimeRef.current = now;
      sprintEndRef.current = now + sprintMins * 60 * 1000;
      lastTimelineLogRef.current = now;
      scoreRef.current = 85;
      scoreSumRef.current = 0;
      scoreCountRef.current = 0;
      alignedFramesRef.current = 0;
      totalFramesRef.current = 0;
      currentStreakRef.current = 0;
      bestStreakRef.current = 0;
      distractionStreakRef.current = 0;
      maxDistractionRef.current = 0;

      setTimeInState({ focused: 0, distracted: 0, drowsy: 0 });
      setTimeline([]);
      setTimeRemainingMs(sprintMins * 60 * 1000);
      setIsBreakOpen(false);

      if (soundFxEnabled) playChime('start');
      showToast('Camera active - focus telemetry started!');
    } catch {
      showToast('Camera access blocked. Please allow webcam permission in browser.');
    }
  };

  const handleToggleTracking = () => {
    if (isTracking) {
      stop();
      showToast('Camera tracking paused (Press Space to resume)');
    } else {
      handleStartTracking();
    }
  };

  const handleEndSession = () => {
    stop();
    const elapsed = performance.now() - sessionStartTimeRef.current;

    const avg = Math.round(scoreSumRef.current / Math.max(scoreCountRef.current, 1));
    const flow = Math.round((timeInState.focused / Math.max(elapsed, 1)) * 100);
    const alignmentPct = totalFramesRef.current > 0
      ? Math.round((alignedFramesRef.current / totalFramesRef.current) * 100)
      : 88;

    const stats = {
      durationMs: elapsed,
      avgScore: avg,
      flowPct: flow,
      bestStreakMs: bestStreakRef.current,
      yawns: biometrics.yawnsDetected,
      microsleeps: biometrics.microsleepCount,
      dominantSentiment: biometrics.sentiment?.label || 'Calm Focus',
      alignmentScore: alignmentPct,
    };

    if (elapsed >= 5000) {
      const record = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        duration: elapsed,
        avgScore: avg,
        flowPct: flow,
        bestStreak: bestStreakRef.current,
        yawns: biometrics.yawnsDetected,
        dominantSentiment: stats.dominantSentiment,
        alignmentScore: alignmentPct,
      };

      const updated = [record, ...history.slice(0, 24)];
      setHistory(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

      setSessionSummaryData(stats);
      setIsSummaryOpen(true);
      if (soundFxEnabled) playChime('complete');
      showToast('Session concluded & archived.');
    } else {
      showToast('Session ended (under 5 seconds, not archived).');
    }

    setState('idle');
  };

  const handleQuickBreak = () => {
    setIsBreakOpen(true);
    if (soundFxEnabled) playChime('zen');
  };

  const handleResumeSprint = () => {
    setIsBreakOpen(false);
    setCycleCount((prev) => prev + 1);
    sprintEndRef.current = performance.now() + sprintMins * 60 * 1000;
    setTimeRemainingMs(sprintMins * 60 * 1000);
    if (soundFxEnabled) playChime('start');
    showToast(`Sprint Cycle #${cycleCount + 1} resumed!`);
  };

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear your local session history?')) {
      localStorage.removeItem(STORAGE_KEY);
      setHistory([]);
      showToast('Session history wiped.');
    }
  };

  const handleExportCsv = () => {
    if (!timeline.length) return;
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

  const handleExportJson = () => {
    if (!timeline.length) return;
    const avg = Math.round(scoreSumRef.current / Math.max(scoreCountRef.current, 1));
    const data = {
      app: 'FocusLens',
      version: '2.0.0',
      date: new Date().toISOString(),
      durationSeconds: Math.round(elapsedMs / 1000),
      averageScore: avg,
      bestStreakMs,
      maxDistractionMs,
      yawnsDetected: biometrics.yawnsDetected,
      microsleepsDetected: biometrics.microsleepCount,
      sentiment: biometrics.sentiment,
      timeInState,
      timeline,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `focuslens-session-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('JSON session exported.');
  };

  // Keyboard Shortcuts & Raycast Command Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if user is interacting with form inputs
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

      // Raycast launcher: Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (!isTracking) {
          handleStartTracking();
        } else if (isBreakOpen) {
          handleResumeSprint();
        } else {
          handleToggleTracking();
        }
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        recenter();
        if (soundFxEnabled) playChime('calibrate');
        showToast('Neutral head pose baseline calibrated.');
      } else if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        if (isTracking && !isBreakOpen) {
          handleQuickBreak();
        }
      } else if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        if (isTracking) {
          handleEndSession();
        }
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        setSoundFxEnabled((prev) => {
          const next = !prev;
          showToast(next ? 'Auditory alerts enabled' : 'Auditory alerts muted');
          return next;
        });
      } else if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        setHudEnabled((prev) => {
          const next = !prev;
          showToast(next ? 'AI HUD mesh visible' : 'AI HUD mesh hidden');
          return next;
        });
      } else if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        toggleTheme();
      } else if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setIsPrivacyOpen(false);
        setIsShareOpen(false);
        setIsShortcutsOpen(false);
        setIsAboutOpen(false);
        setIsSummaryOpen(false);
        setIsCommandPaletteOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTracking, isBreakOpen, soundFxEnabled, hudEnabled, theme]);

  const formatRemaining = (ms) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  };

  const currentAvgScore = Math.round(scoreSumRef.current / Math.max(scoreCountRef.current, 1)) || Math.round(score);
  const currentFlowRatio = Math.round((timeInState.focused / Math.max(elapsedMs, 1)) * 100);
  const currentAlignmentScore = totalFramesRef.current > 0
    ? Math.round((alignedFramesRef.current / totalFramesRef.current) * 100)
    : 88;

  const tabLabels = {
    studio: 'Live Studio',
    biometrics: 'Biometrics & Affect',
    soundscapes: 'Ambient Audio',
    timeline: 'Telemetry Analytics',
    archive: 'Session Archive',
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden font-sans select-none">
      {/* Linear App Shell Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isTracking={isTracking}
        state={state}
        fps={fps}
        soundFxEnabled={soundFxEnabled}
        toggleSoundFx={() => {
          setSoundFxEnabled(!soundFxEnabled);
          showToast(!soundFxEnabled ? 'Auditory alerts enabled' : 'Auditory alerts muted');
        }}
        theme={theme}
        toggleTheme={toggleTheme}
        onCalibrate={() => {
          recenter();
          if (soundFxEnabled) playChime('calibrate');
          showToast('Neutral head pose calibrated.');
        }}
        onOpenPrivacy={() => setIsPrivacyOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[var(--bg-primary)]">
        {/* Linear Header Bar */}
        <header className="h-12 border-b border-white/5 dark:border-white/5 px-6 flex items-center justify-between shrink-0 bg-[var(--bg-card)] backdrop-blur-md z-20">
          <div className="flex items-center gap-3 text-xs">
            <span className="linear-text-muted">FocusLens</span>
            <span className="linear-text-faint">/</span>
            <span className="linear-text-heading font-semibold">{tabLabels[activeTab]}</span>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle (Studio / Lens) */}
            <div className="flex items-center linear-inset rounded-lg p-0.5 text-xs">
              <button
                onClick={() => handleSetViewMode('studio')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                  viewMode === 'studio' ? 'bg-white dark:bg-slate-800 linear-text-heading shadow-sm' : 'linear-text-muted'
                }`}
              >
                Studio
              </button>
              <button
                onClick={() => handleSetViewMode('lens')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                  viewMode === 'lens' ? 'bg-white dark:bg-slate-800 linear-text-heading shadow-sm' : 'linear-text-muted'
                }`}
              >
                Lens
              </button>
            </div>

            {/* AI HUD Toggle */}
            <button
              onClick={() => {
                setHudEnabled(!hudEnabled);
                showToast(!hudEnabled ? 'AI HUD mesh visible' : 'AI HUD mesh hidden');
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                hudEnabled
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-500'
                  : 'linear-btn-secondary'
              }`}
              title="Toggle AI Face &amp; Posture HUD overlay (Press H)"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">HUD</span>
            </button>

            {/* Recenter Button */}
            <button
              onClick={() => {
                recenter();
                if (soundFxEnabled) playChime('calibrate');
                showToast('Neutral head pose calibrated.');
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg linear-btn-secondary text-xs font-medium"
              title="Recenter Baseline (Press R)"
            >
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Recenter</span>
            </button>

            {/* About / System Details */}
            <button
              onClick={() => setIsAboutOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg linear-btn-secondary text-xs font-medium"
              title="About FocusLens Architecture"
            >
              <Info className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden md:inline">Docs</span>
            </button>

            {/* Raycast Trigger */}
            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              className="p-1.5 rounded-lg linear-btn-secondary"
              title="Open Command Palette (Cmd+K or ?)"
            >
              <Command className="w-3.5 h-3.5 linear-text-muted" />
            </button>
          </div>
        </header>

        {/* Dynamic Tab Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7 flex flex-col gap-6">
          {/* TAB 1: LIVE STUDIO (Hero Camera Stage + Whoop Dial + 3D Posture Hologram + Sprint) */}
          {activeTab === 'studio' && (
            <div className="flex flex-col gap-6 max-w-7xl w-full mx-auto animate-in fade-in duration-200">
              {/* Vercel-Style Product Headline & Privacy Banner */}
              <div className="linear-panel p-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm border border-white/5">
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="font-display font-bold text-sm linear-text-heading">
                        FocusLens: Continuous On-Device Cognitive Flow &amp; Ergonomics
                      </h1>
                      <span className="px-2 py-0.2 rounded-full text-[9px] font-mono font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                        Zero Server Telemetry
                      </span>
                    </div>
                    <p className="text-xs linear-text-muted mt-0.5">
                      Client-side MediaPipe WebAssembly monitors attention dynamics, dry eye blink rates, and 3D head alignment in real time.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setActiveTab('biometrics')}
                    className="px-3 py-1.5 rounded-lg linear-btn-secondary text-xs font-semibold"
                  >
                    Deep Telemetry &rarr;
                  </button>
                </div>
              </div>

              {/* Cockpit Grid: Hero Camera Stage (7 cols) + Whoop Focus Dial (5 cols) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                {/* Hero Camera Viewport */}
                <div className="lg:col-span-7 flex flex-col gap-4">
                  <div className="linear-panel p-4 rounded-2xl shadow-xl border border-white/5 h-full flex flex-col justify-between">
                    <CameraStage
                      videoRef={videoRef}
                      hudCanvasRef={hudCanvasRef}
                      state={state}
                      viewMode={viewMode}
                      isTracking={isTracking}
                      onStartTracking={handleStartTracking}
                      fps={fps}
                      isFaceTracked={biometrics.isFaceTracked}
                      score={score}
                      alignment={biometrics.alignment}
                    />
                  </div>
                </div>

                {/* Whoop-Style Dominant Focus Score Dial */}
                <div className="lg:col-span-5 flex flex-col gap-4">
                  <WhoopFocusDial
                    score={score}
                    state={state}
                    isTracking={isTracking}
                    streakMs={currentStreakRef.current}
                    alignmentScore={currentAlignmentScore}
                    flowRatio={currentFlowRatio}
                  />
                </div>
              </div>

              {/* Sprint Controller & 3D Hologram Stage Row */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                <div className="lg:col-span-7">
                  <SprintController
                    durationMinutes={sprintMins}
                    setDurationMinutes={handleSprintMinsChange}
                    timeRemainingFormatted={formatRemaining(timeRemainingMs)}
                    cycleCount={cycleCount}
                    isTracking={isTracking}
                    onQuickBreak={handleQuickBreak}
                    onEndSession={handleEndSession}
                    onToggleTracking={handleToggleTracking}
                  />
                </div>

                <div className="lg:col-span-5 h-64 lg:h-auto">
                  <ThreeHeadVisualizer
                    pose={biometrics.pose}
                    state={state}
                    isFaceTracked={biometrics.isFaceTracked}
                  />
                </div>
              </div>

              {/* Guided Break Overlay */}
              <GuidedBreakModal isOpen={isBreakOpen} onResumeSprint={handleResumeSprint} />
            </div>
          )}

          {/* TAB 2: BIOMETRICS & AFFECT */}
          {activeTab === 'biometrics' && (
            <div className="max-w-7xl w-full mx-auto flex flex-col gap-5 animate-in fade-in duration-200">
              <BiometricsGrid
                biometrics={biometrics}
                state={state}
                score={score}
                onRecenter={() => {
                  recenter();
                  if (soundFxEnabled) playChime('calibrate');
                  showToast('Neutral head pose calibrated.');
                }}
              />
            </div>
          )}

          {/* TAB 3: AMBIENT SOUNDSCAPES */}
          {activeTab === 'soundscapes' && (
            <div className="max-w-7xl w-full mx-auto flex flex-col gap-5 animate-in fade-in duration-200">
              <AmbientSoundDeck
                ambientMode={ambientMode}
                setAmbientMode={handleAmbientChange}
                volume={ambientVol}
                setVolume={handleVolumeChange}
              />
            </div>
          )}

          {/* TAB 4: TELEMETRY ANALYTICS & TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="max-w-7xl w-full mx-auto flex flex-col gap-5 animate-in fade-in duration-200">
              <TimelineChart
                timeline={timeline}
                elapsedMs={elapsedMs}
                bestStreakMs={bestStreakMs}
                maxDistractionMs={maxDistractionMs}
                avgScore={currentAvgScore}
                timeInState={timeInState}
                onExportCsv={handleExportCsv}
                onExportJson={handleExportJson}
                onOpenShareCard={() => setIsShareOpen(true)}
                isTracking={isTracking}
              />
            </div>
          )}

          {/* TAB 5: ARCHIVE & RECORDS */}
          {activeTab === 'archive' && (
            <div className="max-w-7xl w-full mx-auto flex flex-col gap-5 animate-in fade-in duration-200">
              <HistoryArchive history={history} onClearHistory={handleClearHistory} />
            </div>
          )}
        </main>
      </div>

      {/* Global Modals & Dialogs */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        isTracking={isTracking}
        onStartTracking={handleStartTracking}
        onToggleTracking={handleToggleTracking}
        onRecenter={() => {
          recenter();
          if (soundFxEnabled) playChime('calibrate');
          showToast('Neutral head pose calibrated.');
        }}
        onTakeBreak={handleQuickBreak}
        onEndSession={handleEndSession}
        soundFxEnabled={soundFxEnabled}
        onToggleSound={() => {
          setSoundFxEnabled(!soundFxEnabled);
          showToast(!soundFxEnabled ? 'Auditory alerts enabled' : 'Auditory alerts muted');
        }}
        hudEnabled={hudEnabled}
        onToggleHud={() => {
          setHudEnabled(!hudEnabled);
          showToast(!hudEnabled ? 'AI HUD mesh visible' : 'AI HUD mesh hidden');
        }}
        theme={theme}
        onToggleTheme={toggleTheme}
        onExportCsv={handleExportCsv}
        onExportJson={handleExportJson}
        onOpenShareCard={() => setIsShareOpen(true)}
        onOpenPrivacy={() => setIsPrivacyOpen(true)}
        onOpenAbout={() => setIsAboutOpen(true)}
      />

      <PrivacyModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
      <KeyboardShortcutsModal isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />
      <SessionSummaryModal
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
        sessionStats={sessionSummaryData}
        onStartNewSprint={() => {
          setIsSummaryOpen(false);
          handleStartTracking();
        }}
        onTakeBreak={() => {
          setIsSummaryOpen(false);
          handleQuickBreak();
        }}
        onExportCsv={handleExportCsv}
        onOpenShareCard={() => {
          setIsSummaryOpen(false);
          setIsShareOpen(true);
        }}
      />
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        avgScore={currentAvgScore}
        durationMs={elapsedMs}
        flowPct={Math.round((timeInState.focused / Math.max(elapsedMs, 1)) * 100)}
        bestStreakMs={bestStreakMs}
        yawns={biometrics.yawnsDetected}
      />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-lg linear-panel shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-200 text-xs font-semibold linear-text-heading border border-white/10">
          {toast}
        </div>
      )}
    </div>
  );
}
