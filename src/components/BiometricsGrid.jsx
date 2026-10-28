import React from 'react';
import { ThreeHeadVisualizer } from './ThreeHeadVisualizer';
import {
  Eye,
  Compass,
  Moon,
  Crosshair,
  Smile,
  CheckCircle2,
  AlertTriangle,
  Info,
  Activity,
  HeartPulse,
  Brain
} from 'lucide-react';

export const BiometricsGrid = ({
  biometrics,
  state,
  score,
  onRecenter,
}) => {
  const {
    ear = 0.28,
    bpm = 16,
    gazeDirection = 'Center',
    yawnsDetected = 0,
    microsleepCount = 0,
    pose = { yaw: 0, pitch: 0, roll: 0 },
    alignment = { isAligned: true, status: 'Aligned' },
    sentiment = { label: 'Calm Flow', valence: 15, description: 'Relaxed facial engagement' },
    isFaceTracked = false
  } = biometrics || {};

  const getStateTitle = () => {
    switch (state) {
      case 'focused': return 'Optimal Flow State';
      case 'distracted': return 'Attention Drifting Off-Screen';
      case 'drowsy': return 'Cognitive Fatigue Alert';
      default: return 'Telemetry Standby';
    }
  };

  const getStateMsg = () => {
    switch (state) {
      case 'focused': return 'Peak engagement. Gaze vector centered, cervical spine aligned, and cognitive load balanced.';
      case 'distracted': return 'Gaze or head turned away from active screen boundaries. Recenter posture to protect your flow streak.';
      case 'drowsy': return 'Prolonged eye closure or involuntary yawn detected. Take a 4-7-8 breathing break or stretch.';
      default: return 'Start your camera session to activate real-time on-device biometric telemetry.';
    }
  };

  const getBpmTag = () => {
    if (bpm === null || bpm === undefined) return { text: 'Analyzing...', cls: 'bg-slate-500/10 text-slate-400 border-slate-700' };
    if (bpm < 10) return { text: 'Low Blink Rate (Dry Eye Risk)', cls: 'bg-rose-500/10 text-rose-400 border-rose-500/30' };
    if (bpm > 28) return { text: 'Frequent Blinks (Agitation)', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
    return { text: 'Healthy Rhythm (12-22 BPM)', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
  };

  const getFatigueTag = () => {
    if (yawnsDetected > 3 || microsleepCount > 2) {
      return { text: 'High Fatigue', cls: 'bg-rose-500/10 text-rose-400 border-rose-500/30' };
    }
    if (yawnsDetected > 0 || microsleepCount > 0) {
      return { text: 'Mild Fatigue Detected', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
    }
    return { text: 'Restful & Alert', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
  };

  const bpmTag = getBpmTag();
  const fatigueTag = getFatigueTag();

  const gazeDirections = [
    'Top-Left', 'Up', 'Top-Right',
    'Left', 'Center', 'Right',
    'Bottom-Left', 'Down', 'Bottom-Right'
  ];

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Top Banner: Real-time Telemetry Overview */}
      <div className="linear-panel p-5 rounded-2xl border border-white/5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="linear-inset flex flex-col items-center justify-center px-4 py-2.5 rounded-xl min-w-[105px]">
            <div className="flex items-baseline gap-1">
              <span className="font-display text-4xl font-bold tracking-tight text-emerald-400">
                {isFaceTracked ? Math.round(score) : 85}
              </span>
              <span className="text-xs font-mono linear-text-muted">/100</span>
            </div>
            <span className="text-[10px] font-semibold tracking-wider uppercase linear-text-muted">
              Live Focus Score
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  state === 'focused'
                    ? 'bg-emerald-500 animate-pulse'
                    : state === 'distracted'
                    ? 'bg-amber-500'
                    : state === 'drowsy'
                    ? 'bg-rose-500'
                    : 'bg-slate-500'
                }`}
              />
              <h2 className="font-display text-lg font-bold linear-text-heading">{getStateTitle()}</h2>
            </div>
            <p className="text-xs linear-text-muted leading-relaxed max-w-xl">{getStateMsg()}</p>
          </div>
        </div>

        <button
          onClick={onRecenter}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl transition-all shrink-0"
          title="Recenter neutral head pose baseline (Press R)"
        >
          <Compass className="w-4 h-4 text-cyan-400" />
          <span>Recenter Posture</span>
          <kbd className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-[10px] font-mono">R</kbd>
        </button>
      </div>

      {/* Grid of 6 Precision Biometric Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 1. Eye Dynamics & Asthenopia Prevention */}
        <div className="linear-panel p-4 rounded-2xl border border-white/5 flex flex-col justify-between gap-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider linear-text-heading">
                Eye Dynamics (EAR)
              </span>
            </div>
            <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full border ${bpmTag.cls}`}>
              {bpmTag.text}
            </span>
          </div>

          <div className="flex justify-between items-baseline pt-1">
            <div>
              <span className="text-[11px] linear-text-muted block">Openness (EAR)</span>
              <b className="font-mono text-2xl linear-text-heading">{Number(ear).toFixed(2)}</b>
            </div>
            <div className="text-right">
              <span className="text-[11px] linear-text-muted block">Blink Rate</span>
              <b className="font-mono text-2xl linear-text-heading">
                {bpm !== null ? bpm : 16} <span className="text-xs linear-text-muted font-normal">BPM</span>
              </b>
            </div>
          </div>

          <div className="w-full h-1.5 rounded-full linear-inset overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-150"
              style={{ width: `${Math.min(100, (Number(ear) / 0.35) * 100)}%` }}
            />
          </div>

          <div className="linear-inset p-2 rounded-lg text-[10px] linear-text-muted leading-tight">
            <strong className="linear-text-heading">What it is:</strong> Eye Aspect Ratio (EAR) measures eyelid separation across 6 landmark coordinates. Staring at screens reduces blinks by 66%, triggering ocular dryness.
          </div>
        </div>

        {/* 2. Sentiment & Cognitive Affect Analyzer */}
        <div className="linear-panel p-4 rounded-2xl border border-white/5 flex flex-col justify-between gap-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smile className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold uppercase tracking-wider linear-text-heading">
                Facial Sentiment &amp; Affect
              </span>
            </div>
            <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              {sentiment?.label || 'Calm Flow'}
            </span>
          </div>

          <div className="flex flex-col gap-1.5 pt-1">
            <div className="flex justify-between items-baseline text-xs">
              <span className="text-[11px] linear-text-muted">Emotional Valence</span>
              <span className="font-mono text-sm font-bold linear-text-heading">
                {sentiment?.valence >= 0 ? `+${sentiment?.valence ?? 12}%` : `${sentiment?.valence}%`}
              </span>
            </div>

            {/* Valence Gradient Bar */}
            <div className="relative w-full h-2 rounded-full linear-inset overflow-hidden">
              <div
                className="absolute top-0 bottom-0 transition-all duration-200 rounded-full"
                style={{
                  left: '50%',
                  width: `${Math.min(50, Math.abs(sentiment?.valence || 12) / 2)}%`,
                  transform: (sentiment?.valence || 12) < 0 ? 'scaleX(-1)' : 'none',
                  transformOrigin: 'left',
                  backgroundColor: (sentiment?.valence || 12) >= 0 ? '#10B981' : '#F43F5E'
                }}
              />
              <span className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/30" />
            </div>

            <div className="flex justify-between text-[9px] linear-text-faint">
              <span>Tension / Furrow</span>
              <span>Neutral Flow</span>
              <span>Delight / Ease</span>
            </div>
          </div>

          <div className="linear-inset p-2 rounded-lg text-[10px] linear-text-muted leading-tight">
            <strong className="linear-text-heading">What it is:</strong> Analyzes facial blendshapes (zygomatic smile vs. corrugator brow furrow) to gauge mental strain and cognitive engagement in real-time.
          </div>
        </div>

        {/* 3. Screen Gaze Vector Matrix */}
        <div className="linear-panel p-4 rounded-2xl border border-white/5 flex flex-col justify-between gap-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold uppercase tracking-wider linear-text-heading">
                Screen Gaze Vector
              </span>
            </div>
            <span className="px-2 py-0.5 text-[9px] font-bold rounded-full linear-inset font-mono linear-text-heading">
              {gazeDirection || 'Center'}
            </span>
          </div>

          {/* 3x3 Quadrant Grid */}
          <div className="grid grid-cols-3 gap-1.5 w-full h-14 linear-inset p-1.5 rounded-xl">
            {gazeDirections.map((dir) => (
              <div
                key={dir}
                className={`rounded flex items-center justify-center text-[8px] font-mono transition-all ${
                  gazeDirection === dir
                    ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50 text-slate-950 font-bold'
                    : dir === 'Center'
                    ? 'bg-white/5 border border-dashed border-white/20 linear-text-faint'
                    : 'bg-white/[0.02] linear-text-faint'
                }`}
              >
                {dir === 'Center' ? 'CTR' : ''}
              </div>
            ))}
          </div>

          <div className="linear-inset p-2 rounded-lg text-[10px] linear-text-muted leading-tight">
            <strong className="linear-text-heading">What it is:</strong> Calculates iris offset relative to eye corners to verify whether attention is centered on the display or diverted toward phone/periphery.
          </div>
        </div>

        {/* 4. Fatigue & Drowsiness Radar */}
        <div className="linear-panel p-4 rounded-2xl border border-white/5 flex flex-col justify-between gap-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Moon className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wider linear-text-heading">
                Fatigue &amp; Microsleeps
              </span>
            </div>
            <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full border ${fatigueTag.cls}`}>
              {fatigueTag.text}
            </span>
          </div>

          <div className="flex justify-between items-baseline pt-1">
            <div>
              <span className="text-[11px] linear-text-muted block">Yawns Detected</span>
              <b className="font-mono text-2xl linear-text-heading">{yawnsDetected}</b>
            </div>
            <div className="text-right">
              <span className="text-[11px] linear-text-muted block">Microsleep Events</span>
              <b className="font-mono text-2xl linear-text-heading">{microsleepCount}</b>
            </div>
          </div>

          <div className="linear-inset p-2 rounded-lg text-[10px] linear-text-muted leading-tight">
            <strong className="linear-text-heading">What it is:</strong> Mouth Aspect Ratio (MAR &gt; 0.65 for &gt; 2.5s) detects yawning, while EAR &lt; 0.16 for &gt; 1.8s flags involuntary microsleep episodes.
          </div>
        </div>

        {/* 5. 3D Head Orientation & Ergonomic Safe Zones */}
        <div className="linear-panel p-4 rounded-2xl border border-white/5 flex flex-col justify-between gap-3 shadow-sm md:col-span-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold uppercase tracking-wider linear-text-heading">
                3D Posture Gauges &amp; Safe Limits
              </span>
              {alignment && (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                    alignment.isAligned
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  }`}
                >
                  {alignment.isAligned ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                  <span>{alignment.status}</span>
                </span>
              )}
            </div>
            <span className="text-[10px] font-mono linear-text-muted">Safe Bounds: &plusmn;14&deg; Yaw, &plusmn;12&deg; Pitch</span>
          </div>

          <div className="flex flex-col gap-2.5">
            {[
              { label: 'Yaw (Turn)', val: pose.yaw ?? 0, safe: 14 },
              { label: 'Pitch (Tilt)', val: pose.pitch ?? 0, safe: 12 },
              { label: 'Roll (Lean)', val: pose.roll ?? 0, safe: 10 },
            ].map((axis) => {
              const isSafe = Math.abs(axis.val) <= axis.safe;
              return (
                <div key={axis.label} className="grid grid-cols-[90px_1fr_45px] items-center gap-3 text-xs">
                  <span className="linear-text-muted text-[11px]">{axis.label}</span>
                  <div className="relative h-2 linear-inset rounded-full overflow-visible">
                    {/* Safe Zone Center Indicator */}
                    <span
                      className="absolute top-0 bottom-0 bg-emerald-500/20 rounded-full pointer-events-none"
                      style={{
                        left: `${50 - (axis.safe / 40) * 50}%`,
                        width: `${(axis.safe / 40) * 100}%`
                      }}
                    />
                    <span className="absolute left-1/2 top-[-2px] w-0.5 h-3 bg-white/30" />
                    <span
                      className={`absolute top-[-3px] w-3.5 h-3.5 -ml-1.5 rounded-full shadow transition-all duration-75 ${
                        isSafe ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-amber-500 shadow-amber-500/50'
                      }`}
                      style={{ left: `${50 + Math.max(-1, Math.min(1, axis.val / 40)) * 50}%` }}
                    />
                  </div>
                  <b className={`font-mono text-right text-xs ${isSafe ? 'linear-text-heading' : 'text-amber-400'}`}>
                    {Math.round(axis.val)}&deg;
                  </b>
                </div>
              );
            })}
          </div>

          <div className="linear-inset p-2 rounded-lg text-[10px] linear-text-muted leading-tight">
            <strong className="linear-text-heading">What it is:</strong> Head pose angles computed via 3D facial landmark transformation matrix. Green zone designates posture preventing forward head posture (FHP) and cervical disc compression.
          </div>
        </div>
      </div>
    </div>
  );
};
