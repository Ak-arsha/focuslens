import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CameraStage } from './components/CameraStage';
import { WhoopFocusDial } from './components/WhoopFocusDial';
import { CoreBiometricsStack } from './components/CoreBiometricsStack';
import { AdvancedTelemetryDrawer } from './components/AdvancedTelemetryDrawer';
import { TimelineChart } from './components/TimelineChart';
import { SessionSummaryModal } from './components/SessionSummaryModal';
import { PrivacyModal } from './components/PrivacyModal';
import { HistoryArchive } from './components/HistoryArchive';
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
  ShieldCheck,
  History,
  X,
  Play,
  Pause,
  Activity
} from 'lucide-react';

const THEME_KEY = 'focuslens:theme';
const TARGET_SCORES = { focused: 100, distracted: 38, drowsy: 10, idle: 80 };

export function App() {
  const videoRef = useRef(null);
  const hudCanvasRef = useRef(null);

  // App Theme & Controls
  const [theme, setTheme] = useState('dark');
  const [soundFxEnabled, setSoundFxEnabled] = useState(true);
  const [hudEnabled, setHudEnabled] = useState(true);

  // Focus & Sprint Tracking State
  const [state, setState] = useState('idle');
  const [score, setScore] = useState(85);
  const [sprintMins, setSprintMins] = useState(25);
  const [timeRemainingMs, setTimeRemainingMs] = useState(25 * 60 * 1000);

  // Analytics & History
  const [timeline, setTimeline] = useState([]);
  const [history, setHistory] = useState([]);
  const [timeInState, setTimeInState] = useState({ focused: 0, distracted: 0, drowsy: 0 });
  const [elapsedMs, setElapsedMs] = useState(0);
  const [bestStreakMs, setBestStreakMs] = useState(0);
  const [maxDistractionMs, setMaxDistractionMs] = useState(0);

  // Modals
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [sessionSummaryData, setSessionSummaryData] = useState(null);
  const [toast, setToast] = useState(null);

  // Continuous tracking refs
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
    if (!isTracking) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, sprintEndRef.current - Date.now());
      setTimeRemainingMs(remaining);

      if (remaining === 0) {
        if (soundFxEnabled) playChime('complete');
        showToast('Focus Sprint Finished! Great job.');
        handleEndSession();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isTracking, soundFxEnabled]);

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
      yawns: biometrics.yawnsDetected,
      microsleeps: biometrics.microsleepCount,
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

  // Format Remaining Timer
  const formatRemaining = (ms) => {
    const totalSecs = Math.max(0, Math.ceil(ms / 1000));
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  // Export CSV
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

      if (e.code === 'Space') {
        e.preventDefault();
        if (!isTracking) handleStartSession();
        else stopTracking();
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        recenter();
        if (soundFxEnabled) playChime('calibrate');
        showToast('Neutral posture baseline calibrated.');
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

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-heading)] flex flex-col font-sans transition-colors duration-200">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-slate-900/95 text-white border border-emerald-500/40 shadow-2xl text-xs font-semibold flex items-center gap-2 backdrop-blur-md animate-in slide-in-from-bottom-2 duration-150">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{toast}</span>
        </div>
      )}

      {/* Main FocusLens Cockpit Container */}
      <div className="flex-1 flex flex-col max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-7 gap-5 animate-in fade-in duration-200">
        {/* Linear Header Bar */}
        <header className="linear-panel p-3.5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-white/5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 flex items-center justify-center">
                <svg viewBox="0 0 32 32" className="w-full h-full">
                  <circle cx="16" cy="16" r="14" fill="none" stroke="#10B981" strokeWidth="2.5" />
                  <circle cx="16" cy="16" r="8" fill="#10B981" opacity="0.25" />
                  <circle cx="16" cy="16" r="3.5" fill="#10B981" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-display font-bold text-sm linear-text-heading">FocusLens</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono uppercase font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    v2.0
                  </span>
                </div>
                <span className="text-[10px] linear-text-muted">On-Device AI Cockpit</span>
              </div>
            </div>

            <div className="h-5 w-px bg-white/10 hidden sm:block" />

            {/* Live Session Status Pill */}
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-black/30 border border-white/5 text-xs">
              <span
                className={`w-2 h-2 rounded-full ${
                  state === 'focused' ? 'bg-emerald-500 animate-pulse' : state === 'distracted' ? 'bg-amber-500' : isTracking ? 'bg-rose-500' : 'bg-slate-500'
                }`}
              />
              <span className="font-medium text-[11px] linear-text-heading capitalize">
                {isTracking ? (state === 'focused' ? 'Flow State' : state === 'distracted' ? 'Attention Drifting' : 'Fatigue Alert') : 'Telemetry Standby'}
              </span>
              {isTracking && (
                <span className="text-[10px] font-mono text-emerald-400 font-semibold">{fps} FPS</span>
              )}
            </div>
          </div>

          {/* Sprint Duration & Timer */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 linear-inset p-1 rounded-lg text-xs">
              {[15, 25, 45].map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setSprintMins(m);
                    if (isTracking) {
                      sprintEndRef.current = Date.now() + m * 60 * 1000;
                      setTimeRemainingMs(m * 60 * 1000);
                    } else {
                      setTimeRemainingMs(m * 60 * 1000);
                    }
                    showToast(`Sprint set to ${m} minutes.`);
                  }}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                    sprintMins === m ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'linear-text-muted hover:text-white'
                  }`}
                >
                  {m}m
                </button>
              ))}
            </div>

            <div className="font-mono text-lg font-bold linear-text-heading min-w-[55px] text-center">
              {formatRemaining(timeRemainingMs)}
            </div>
          </div>

          {/* Toolbar Actions */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {isTracking ? (
              <button
                onClick={() => {
                  stopTracking();
                  showToast('Camera paused.');
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg linear-btn-secondary text-xs font-semibold text-amber-400"
                title="Pause camera stream (Space)"
              >
                <Pause className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Pause</span>
              </button>
            ) : (
              <button
                onClick={handleStartSession}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-sm"
                title="Start camera tracking (Space)"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start</span>
              </button>
            )}

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

            <button
              onClick={() => setSoundFxEnabled(!soundFxEnabled)}
              className="p-2 rounded-lg linear-btn-secondary"
              title="Toggle audio alerts (Press M)"
            >
              {soundFxEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 opacity-50" />}
            </button>

            <button
              onClick={() => setHudEnabled(!hudEnabled)}
              className={`p-2 rounded-lg border transition-colors ${
                hudEnabled ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400' : 'linear-btn-secondary'
              }`}
              title="Toggle AI HUD mesh (Press H)"
            >
              <Eye className="w-4 h-4" />
            </button>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg linear-btn-secondary"
              title="Toggle Theme (Press T)"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            <button
              onClick={() => setIsHistoryOpen(true)}
              className="p-2 rounded-lg linear-btn-secondary"
              title="View Past Sessions"
            >
              <History className="w-4 h-4 text-cyan-400" />
            </button>

            <button
              onClick={() => setIsPrivacyOpen(true)}
              className="p-2 rounded-lg linear-btn-secondary"
              title="Privacy Architecture"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </button>

            {/* End Session Button */}
            {isTracking && (
              <button
                onClick={handleEndSession}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-400 text-xs font-bold transition-all shadow-sm"
                title="End Active Session and View Report (Press E)"
              >
                <Square className="w-3.5 h-3.5" />
                <span>End Session</span>
                <kbd className="px-1 py-0.2 rounded bg-rose-500/20 text-[9px] font-mono">E</kbd>
              </button>
            )}
          </div>
        </header>

        {/* 2-Column Live Cockpit Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Hero Camera Stage with Posture Overlay */}
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
          </div>

          {/* Right Column: Dominant Whoop Focus Score Dial + Core Biometrics Stack */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <WhoopFocusDial
              score={score}
              state={state}
              isTracking={isTracking}
              streakMs={currentStreakRef.current}
              alignmentScore={currentAlignmentScore}
              flowRatio={currentFlowRatio}
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

        {/* Bottom Section: Timeline Chart & Collapsible Advanced Telemetry */}
        <div className="flex flex-col gap-4 w-full">
          <div className="linear-panel p-4 rounded-2xl border border-white/5 shadow-sm">
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

          <AdvancedTelemetryDrawer
            biometrics={biometrics}
            onRecenter={() => {
              recenter();
              if (soundFxEnabled) playChime('calibrate');
              showToast('Neutral posture calibrated.');
            }}
          />
        </div>
      </div>

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

      {/* Past Sessions History Modal */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-2xl p-6 linear-panel rounded-2xl shadow-2xl flex flex-col gap-4 border border-white/10 max-h-[85vh] overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-cyan-400" />
                <h3 className="font-display text-base font-bold linear-text-heading">
                  Past Focus Sessions (IndexedDB)
                </h3>
              </div>
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="p-1.5 rounded-lg linear-btn-secondary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
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
          </div>
        </div>
      )}
    </div>
  );
}
