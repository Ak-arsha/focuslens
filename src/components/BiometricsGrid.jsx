import React from 'react';
import { ThreeHeadVisualizer } from './ThreeHeadVisualizer';
import { Eye, Compass, Moon, Crosshair, Smile, CheckCircle2, AlertTriangle } from 'lucide-react';

export const BiometricsGrid = ({
  biometrics,
  state,
  score,
  onRecenter,
}) => {
  const { ear, bpm, gazeDirection, yawnsDetected, microsleepCount, pose, alignment, sentiment, isFaceTracked } = biometrics;

  const getStateTitle = () => {
    switch (state) {
      case 'focused': return 'Deep Flow State';
      case 'distracted': return 'Attention Drifting';
      case 'drowsy': return 'Fatigue Alert';
      default: return 'Ready to Begin';
    }
  };

  const getStateMsg = () => {
    switch (state) {
      case 'focused': return 'Optimal engagement. Your attention and posture are locked into flow.';
      case 'distracted': return 'Gaze or head turned away. Re-align with your screen to maintain streak.';
      case 'drowsy': return 'Prolonged eye closure or yawning detected. Take a deep breath or stretch.';
      default: return 'Start your camera session to activate real-time telemetry.';
    }
  };

  const getStateColorClass = () => {
    switch (state) {
      case 'focused': return 'text-emerald-500 dark:text-emerald-400 border-emerald-500/30';
      case 'distracted': return 'text-amber-500 dark:text-amber-400 border-amber-500/30';
      case 'drowsy': return 'text-rose-500 dark:text-rose-400 border-rose-500/30';
      default: return 'text-slate-400 border-slate-700';
    }
  };

  const getBpmTag = () => {
    if (bpm === null) return { text: 'Analyzing', cls: 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400' };
    if (bpm < 10) return { text: 'Low (Dry Eye Risk)', cls: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30' };
    if (bpm > 28) return { text: 'Frequent Blinks', cls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30' };
    return { text: 'Healthy (12-20 BPM)', cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' };
  };

  const getFatigueTag = () => {
    if (yawnsDetected > 3 || microsleepCount > 2) {
      return { text: 'High Fatigue', cls: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30' };
    }
    if (yawnsDetected > 0 || microsleepCount > 0) {
      return { text: 'Moderate', cls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30' };
    }
    return { text: 'Restful & Alert', cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' };
  };

  const getSentimentTag = () => {
    if (!sentiment) return { text: 'Calm Focus', cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' };
    if (sentiment.valence > 60) return { text: 'Positive & Delighted', cls: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30' };
    if (sentiment.valence < -20) return { text: 'Tension / Furrow', cls: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30' };
    return { text: sentiment.label, cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' };
  };

  const bpmTag = getBpmTag();
  const fatigueTag = getFatigueTag();
  const sentimentTag = getSentimentTag();

  const gazeDirections = [
    'Top-Left', 'Up', 'Top-Right',
    'Left', 'Center', 'Right',
    'Bottom-Left', 'Down', 'Bottom-Right'
  ];

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Hero Score Banner */}
      <div className="theme-panel flex items-center gap-5 p-4 rounded-xl shadow-sm">
        <div className="theme-inset flex flex-col items-center justify-center px-4 py-2 rounded-lg min-w-[105px]">
          <div className="flex items-baseline gap-1">
            <span className={`font-display text-4xl font-bold tracking-tight ${getStateColorClass()}`}>
              {isFaceTracked ? Math.round(score) : '-'}
            </span>
            <span className="text-xs font-mono theme-text-muted">/100</span>
          </div>
          <span className="text-[10px] font-semibold tracking-wider uppercase theme-text-muted">Focus Score</span>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${state === 'focused' ? 'bg-emerald-500' : state === 'distracted' ? 'bg-amber-500' : 'bg-rose-500'} animate-pulse`} />
            <h2 className="font-display text-lg font-bold theme-text-heading">{getStateTitle()}</h2>
          </div>
          <p className="text-xs theme-text-body leading-relaxed max-w-md">{getStateMsg()}</p>
        </div>
      </div>

      {/* Grid of Precision Biometrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* 1. Eye Dynamics & Asthenopia Prevention */}
        <div className="theme-panel flex flex-col justify-between gap-3 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              <span className="text-xs font-semibold uppercase tracking-wider theme-text-heading">Eye Dynamics</span>
            </div>
            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${bpmTag.cls}`}>
              {bpmTag.text}
            </span>
          </div>

          <div className="flex justify-between items-end">
            <div>
              <span className="text-[11px] theme-text-muted block">Openness (EAR)</span>
              <b className="font-mono text-lg theme-text-heading">{ear.toFixed(2)}</b>
            </div>
            <div className="text-right">
              <span className="text-[11px] theme-text-muted block">Blink Frequency</span>
              <b className="font-mono text-lg theme-text-heading">
                {bpm !== null ? bpm : '-'} <small className="text-xs theme-text-muted font-normal">BPM</small>
              </b>
            </div>
          </div>

          <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-150"
              style={{ width: `${Math.min(100, (ear / 0.35) * 100)}%` }}
            />
          </div>
          <span className="text-[10px] theme-text-faint">Threshold: EAR &gt; 0.22 indicates open relaxed eyes.</span>
        </div>

        {/* 2. Sentiment & Cognitive Affect Analyzer */}
        <div className="theme-panel flex flex-col justify-between gap-2.5 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smile className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
              <span className="text-xs font-semibold uppercase tracking-wider theme-text-heading">Facial Sentiment</span>
            </div>
            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${sentimentTag.cls}`}>
              {sentiment?.label || 'Calm Focus'}
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-baseline text-xs">
              <span className="text-[11px] theme-text-muted">Emotional Valence</span>
              <span className="font-mono text-xs font-semibold theme-text-heading">
                {sentiment ? (sentiment.valence >= 0 ? `+${sentiment.valence}%` : `${sentiment.valence}%`) : '0%'}
              </span>
            </div>

            {/* Valence Gradient Bar */}
            <div className="relative w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                className="absolute top-0 bottom-0 transition-all duration-200 rounded-full"
                style={{
                  left: '50%',
                  width: `${Math.min(50, Math.abs(sentiment?.valence || 0) / 2)}%`,
                  transform: (sentiment?.valence || 0) < 0 ? 'scaleX(-1)' : 'none',
                  transformOrigin: 'left',
                  backgroundColor: (sentiment?.valence || 0) >= 0 ? '#10B981' : '#F43F5E'
                }}
              />
              <span className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-400 dark:bg-slate-600" />
            </div>

            <div className="flex justify-between text-[9px] theme-text-faint">
              <span>Stressed / Tense</span>
              <span>Neutral Flow</span>
              <span>Positive / Ease</span>
            </div>
          </div>

          <p className="text-[10px] theme-text-body line-clamp-1">
            {sentiment?.description || 'Facial expression metrics analyzed on-device.'}
          </p>
        </div>

        {/* 3. Screen Gaze Vector Matrix */}
        <div className="theme-panel flex flex-col justify-between gap-2.5 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
              <span className="text-xs font-semibold uppercase tracking-wider theme-text-heading">Gaze Vector</span>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-200 dark:bg-slate-800 theme-text-heading font-mono">
              {gazeDirection}
            </span>
          </div>

          {/* 3x3 Quadrant Grid */}
          <div className="grid grid-cols-3 gap-1 w-full h-12 theme-inset p-1 rounded-lg">
            {gazeDirections.map(dir => (
              <div
                key={dir}
                className={`rounded transition-colors ${
                  gazeDirection === dir
                    ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50'
                    : dir === 'Center'
                    ? 'bg-slate-300/60 dark:bg-slate-800/80 border border-dashed border-slate-400 dark:border-slate-700'
                    : 'bg-slate-200/40 dark:bg-slate-900/60'
                }`}
              />
            ))}
          </div>
          <span className="text-[10px] theme-text-faint">Calculates center screen gaze vs. peripheral distraction.</span>
        </div>

        {/* 4. Fatigue Radar */}
        <div className="theme-panel flex flex-col justify-between gap-3 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Moon className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              <span className="text-xs font-semibold uppercase tracking-wider theme-text-heading">Fatigue Radar</span>
            </div>
            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${fatigueTag.cls}`}>
              {fatigueTag.text}
            </span>
          </div>

          <div className="flex justify-between items-end">
            <div>
              <span className="text-[11px] theme-text-muted block">Yawns Logged</span>
              <b className="font-mono text-lg theme-text-heading">{yawnsDetected}</b>
            </div>
            <div className="text-right">
              <span className="text-[11px] theme-text-muted block">Microsleeps</span>
              <b className="font-mono text-lg theme-text-heading">{microsleepCount}</b>
            </div>
          </div>
          <span className="text-[10px] theme-text-faint">Automatic detection of prolonged closure and involuntary yawning.</span>
        </div>

        {/* 5. Three.js 3D Hologram Head Visualizer */}
        <div className="h-full">
          <ThreeHeadVisualizer pose={pose} state={state} isFaceTracked={isFaceTracked} />
        </div>

        {/* 6. 3D Head Orientation & Posture Gauges */}
        <div className="col-span-1 md:col-span-2 theme-panel flex flex-col gap-3 p-4 rounded-xl">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
              <span className="text-xs font-semibold uppercase tracking-wider theme-text-heading">
                3D Posture Gauges
              </span>
              {alignment && (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                    alignment.isAligned
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {alignment.isAligned ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                  <span>{alignment.status}</span>
                </span>
              )}
            </div>
            <button
              onClick={onRecenter}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg transition-colors"
              title="Recenter neutral head pose baseline (Press R)"
            >
              <span>Recenter Baseline</span>
              <kbd className="px-1 py-0.2 rounded bg-emerald-500/20 text-[10px] font-mono">R</kbd>
            </button>
          </div>

          <div className="flex flex-col gap-2.5">
            {[
              { label: 'Yaw (Turn)', val: pose.yaw, safe: 14 },
              { label: 'Pitch (Tilt)', val: pose.pitch, safe: 12 },
              { label: 'Roll (Lean)', val: pose.roll, safe: 10 },
            ].map(axis => {
              const isSafe = Math.abs(axis.val) <= axis.safe;
              return (
                <div key={axis.label} className="grid grid-cols-[85px_1fr_45px] items-center gap-3 text-xs">
                  <span className="theme-text-muted">{axis.label}</span>
                  <div className="relative h-2 bg-slate-200 dark:bg-slate-800 rounded-full">
                    {/* Safe Zone Center Indicator */}
                    <span
                      className="absolute top-0 bottom-0 bg-emerald-500/15 rounded-full pointer-events-none"
                      style={{
                        left: `${50 - (axis.safe / 40) * 50}%`,
                        width: `${(axis.safe / 40) * 100}%`
                      }}
                    />
                    <span className="absolute left-1/2 top-[-2px] w-0.5 h-3 bg-slate-400 dark:bg-slate-500 opacity-60" />
                    <span
                      className={`absolute top-[-3px] w-3.5 h-3.5 -ml-1.5 rounded-full shadow transition-all duration-75 ${
                        isSafe ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-amber-500 shadow-amber-500/50'
                      }`}
                      style={{ left: `${50 + Math.max(-1, Math.min(1, axis.val / 40)) * 50}%` }}
                    />
                  </div>
                  <b className={`font-mono text-right ${isSafe ? 'theme-text-heading' : 'text-amber-500'}`}>
                    {Math.round(axis.val)}&deg;
                  </b>
                </div>
              );
            })}
          </div>
          <span className="text-[10px] theme-text-faint">
            Green shaded zone indicates ergonomic posture limits (&plusmn;14&deg; turn, &plusmn;12&deg; tilt).
          </span>
        </div>
      </div>
    </div>
  );
};
