import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { CameraStage } from './components/CameraStage';
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
import { useFaceLandmarker } from './hooks/useFaceLandmarker';
import { playChime, setAmbientSound, updateAmbientVolume } from './utils/audio';
import { ShieldCheck, Info, Sparkles } from 'lucide-react';

const STORAGE_KEY = 'focuslens:history_v2';
const THEME_KEY = 'focuslens:theme';
const VIEW_KEY = 'focuslens:view_mode';

const TARGET_SCORES = { focused: 100, distracted: 38, drowsy: 10, idle: 80 };

export function App() {
  const videoRef = useRef(null);
  const hudCanvasRef = useRef(null);

  // App Settings
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

  // Modals & Notifications
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [sessionSummaryData, setSessionSummaryData] = useState(null);
  const [toast, setToast] = useState(null);

  // Ref tracking for high-frequency loops
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
      showToast('Camera active - focus & posture telemetry started!');
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
      : 85;

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

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if user is interacting with form controls
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

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
      } else if (e.key === '?' || e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setIsPrivacyOpen(false);
        setIsShareOpen(false);
        setIsShortcutsOpen(false);
        setIsAboutOpen(false);
        setIsSummaryOpen(false);
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

  return (
    <div className="min-h-screen flex flex-col font-sans transition-colors duration-200">
      <Navbar
        state={state}
        viewMode={viewMode}
        setViewMode={handleSetViewMode}
        soundFxEnabled={soundFxEnabled}
        toggleSoundFx={() => {
          setSoundFxEnabled(!soundFxEnabled);
          showToast(!soundFxEnabled ? 'Auditory alerts enabled' : 'Auditory alerts muted');
        }}
        hudEnabled={hudEnabled}
        toggleHud={() => {
          setHudEnabled(!hudEnabled);
          showToast(!hudEnabled ? 'AI HUD mesh visible' : 'AI HUD mesh hidden');
        }}
        theme={theme}
        toggleTheme={toggleTheme}
        onCalibrate={() => {
          recenter();
          if (soundFxEnabled) playChime('calibrate');
          showToast('Neutral head pose baseline calibrated.');
        }}
        onOpenPrivacy={() => setIsPrivacyOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onOpenAbout={() => setIsAboutOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        {/* Clarity Overview Banner */}
        <div className="theme-panel p-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display font-bold text-sm theme-text-heading">
                  FocusLens: On-Device Cognitive Flow &amp; Ergonomic Posture Studio
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  100% Private Client-Side
                </span>
              </div>
              <p className="text-xs theme-text-muted mt-0.5">
                Webcam AI tracks cognitive attention flow, dry eye blink rates, 3D head posture, and facial sentiment in real-time. Video feeds never leave your browser memory.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsAboutOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg theme-btn-secondary text-xs font-semibold"
            >
              <Info className="w-3.5 h-3.5 text-cyan-500" />
              <span>How It Works</span>
            </button>
            <button
              onClick={() => setIsShortcutsOpen(true)}
              className="px-3 py-1.5 rounded-lg theme-btn-secondary text-xs font-semibold font-mono"
            >
              Keys [?]
            </button>
          </div>
        </div>

        {/* Top Studio Grid: Camera Stage + Real-Time Biometrics with 3D Hologram */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Camera Stage & Sprint Deck */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            <div className="theme-panel p-4 rounded-2xl shadow-sm">
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

          {/* Right Column: Biometrics Command Center, Sentiment, & Three.js 3D Hologram */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            <BiometricsGrid
              biometrics={biometrics}
              state={state}
              score={score}
              onRecenter={() => {
                recenter();
                if (soundFxEnabled) playChime('calibrate');
                showToast('Neutral head pose baseline calibrated.');
              }}
            />
          </div>
        </div>

        {/* Ambient Focus Soundscapes Deck */}
        <AmbientSoundDeck
          ambientMode={ambientMode}
          setAmbientMode={handleAmbientChange}
          volume={ambientVol}
          setVolume={handleVolumeChange}
        />

        {/* Guided Break Overlay */}
        <GuidedBreakModal isOpen={isBreakOpen} onResumeSprint={handleResumeSprint} />

        {/* Longitudinal Telemetry Timeline & KPI Analytics */}
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

        {/* Historical Archive */}
        <HistoryArchive history={history} onClearHistory={handleClearHistory} />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-xs theme-text-muted gap-3">
        <div className="flex items-center gap-2">
          <span>Zero-Knowledge Privacy: All MediaPipe AI inference executes 100% locally on your device.</span>
        </div>
        <div className="flex items-center gap-4 theme-text-body">
          <span>FocusLens React + 3D Studio</span>
          <span>-</span>
          <a
            href="https://github.com/Ak-arsha/focuslens"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-emerald-500 transition-colors"
          >
            GitHub Repository
          </a>
        </div>
      </footer>

      {/* Modals */}
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
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-lg theme-panel shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-200 text-xs font-semibold theme-text-heading border">
          {toast}
        </div>
      )}
    </div>
  );
}
