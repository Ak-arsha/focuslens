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
import { useFaceLandmarker } from './hooks/useFaceLandmarker';
import { playChime, setAmbientSound, updateAmbientVolume } from './utils/audio';

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
          playChime('zen');
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

  // Initialize Theme and ViewMode from LocalStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_KEY) || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);

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
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem(THEME_KEY, next);
  };

  const handleSetViewMode = (mode) => {
    setViewMode(mode);
    localStorage.setItem(VIEW_KEY, mode);
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
      currentStreakRef.current = 0;
      bestStreakRef.current = 0;
      distractionStreakRef.current = 0;
      maxDistractionRef.current = 0;

      setTimeInState({ focused: 0, distracted: 0, drowsy: 0 });
      setTimeline([]);
      setTimeRemainingMs(sprintMins * 60 * 1000);
      setIsBreakOpen(false);

      if (soundFxEnabled) playChime('zen');
      showToast('Camera active - focus telemetry started!');
    } catch {
      showToast('Camera access blocked. Please allow permissions in browser settings.');
    }
  };

  const handleEndSession = () => {
    stop();
    const elapsed = performance.now() - sessionStartTimeRef.current;

    if (elapsed >= 10000) {
      const avg = Math.round(scoreSumRef.current / Math.max(scoreCountRef.current, 1));
      const flow = Math.round((timeInState.focused / elapsed) * 100);

      const record = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        duration: elapsed,
        avgScore: avg,
        flowPct: flow,
        bestStreak: bestStreakRef.current,
        yawns: biometrics.yawnsDetected,
      };

      const updated = [record, ...history.slice(0, 24)];
      setHistory(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      showToast('Session saved to local history.');
    } else {
      showToast('Session ended (under 10 seconds, not saved).');
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
    if (soundFxEnabled) playChime('zen');
    showToast(`Sprint #${cycleCount + 1} resumed!`);
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

  const formatRemaining = (ms) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  };

  const currentAvgScore = Math.round(scoreSumRef.current / Math.max(scoreCountRef.current, 1)) || Math.round(score);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950">
      <Navbar
        state={state}
        viewMode={viewMode}
        setViewMode={handleSetViewMode}
        soundFxEnabled={soundFxEnabled}
        toggleSoundFx={() => {
          setSoundFxEnabled(!soundFxEnabled);
          showToast(!soundFxEnabled ? 'Audio alerts enabled' : 'Audio alerts muted');
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
          showToast('Neutral head pose calibrated.');
        }}
        onOpenPrivacy={() => setIsPrivacyOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        {/* Top Studio Grid: Camera Stage + Real-Time Biometrics with 3D Hologram */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Camera Stage & Sprint Deck */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80">
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
            />
          </div>

          {/* Right Column: Biometrics Command Center & Three.js 3D Head Visualizer */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            <BiometricsGrid
              biometrics={biometrics}
              state={state}
              score={score}
              onRecenter={() => {
                recenter();
                showToast('Re-centered head orientation.');
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
      <footer className="border-t border-slate-800/80 px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
        <div className="flex items-center gap-2">
          <span>Zero-Knowledge Privacy: All MediaPipe AI inference executes 100% locally on your device.</span>
        </div>
        <div className="flex items-center gap-4 text-slate-400">
          <span>FocusLens React + 3D Studio</span>
          <span>-</span>
          <a
            href="https://github.com/Ak-arsha/focuslens"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-emerald-400 transition-colors"
          >
            GitHub Repository
          </a>
        </div>
      </footer>

      {/* Modals */}
      <PrivacyModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />
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
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-xs font-semibold shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-200">
          {toast}
        </div>
      )}
    </div>
  );
}
