import React from 'react';
import { ThreeHeadVisualizer } from './ThreeHeadVisualizer';
import { Eye, Compass, Moon, Crosshair } from 'lucide-react';

export const BiometricsGrid = ({
  biometrics,
  state,
  score,
  onRecenter,
}) => {
  const { ear, bpm, gazeDirection, yawnsDetected, microsleepCount, pose, isFaceTracked } = biometrics;

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
      case 'focused': return 'Optimal engagement. You are locked in your flow state.';
      case 'distracted': return 'Gaze or head turned away. Bring your attention back to your work.';
      case 'drowsy': return 'Prolonged eye closure or yawning detected. Take a deep breath or stretch.';
      default: return 'Start your camera session to activate real-time telemetry.';
    }
  };

  const getStateColorClass = () => {
    switch (state) {
      case 'focused': return 'text-emerald-400 border-emerald-500/30';
      case 'distracted': return 'text-amber-400 border-amber-500/30';
      case 'drowsy': return 'text-rose-400 border-rose-500/30';
      default: return 'text-slate-400 border-slate-700';
    }
  };

  const getBpmTag = () => {
    if (bpm === null) return { text: 'Analyzing', cls: 'bg-slate-800 text-slate-400' };
    if (bpm < 10) return { text: 'Low (Strain)', cls: 'bg-rose-500/10 text-rose-400 border-rose-500/30' };
    if (bpm > 28) return { text: 'Frequent', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
    return { text: 'Normal', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
  };

  const getFatigueTag = () => {
    if (yawnsDetected > 3 || microsleepCount > 2) {
      return { text: 'High Fatigue', cls: 'bg-rose-500/10 text-rose-400 border-rose-500/30' };
    }
    if (yawnsDetected > 0 || microsleepCount > 0) {
      return { text: 'Moderate', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
    }
    return { text: 'Optimal', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
  };

  const bpmTag = getBpmTag();
  const fatigueTag = getFatigueTag();

  const gazeDirections = [
    'Top-Left', 'Up', 'Top-Right',
    'Left', 'Center', 'Right',
    'Bottom-Left', 'Down', 'Bottom-Right'
  ];

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Hero Score Banner */}
      <div className="flex items-center gap-5 p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 shadow-sm">
        <div className="flex flex-col items-center justify-center px-4 py-2 bg-slate-950/80 rounded-lg border border-slate-800 min-w-[105px]">
          <div className="flex items-baseline gap-1">
            <span className={`font-display text-4xl font-bold tracking-tight ${getStateColorClass()}`}>
              {isFaceTracked ? Math.round(score) : '-'}
            </span>
            <span className="text-xs font-mono text-slate-500">/100</span>
          </div>
          <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-400">Focus Score</span>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${state === 'focused' ? 'bg-emerald-400' : state === 'distracted' ? 'bg-amber-400' : 'bg-rose-400'} animate-pulse`} />
            <h2 className="font-display text-lg font-bold text-slate-100">{getStateTitle()}</h2>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed max-w-md">{getStateMsg()}</p>
        </div>
      </div>

      {/* 2-Column Precision Cards + 3D Hologram */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* 1. Eye Dynamics */}
        <div className="flex flex-col justify-between gap-3 p-4 rounded-xl bg-slate-900/50 border border-slate-800/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-300">
              <Eye className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Eye Dynamics</span>
            </div>
            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${bpmTag.cls}`}>
              {bpmTag.text}
            </span>
          </div>

          <div className="flex justify-between items-end">
            <div>
              <span className="text-[11px] text-slate-500 block">Openness (EAR)</span>
              <b className="font-mono text-lg text-slate-200">{ear.toFixed(2)}</b>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-500 block">Blink Rate</span>
              <b className="font-mono text-lg text-slate-200">
                {bpm !== null ? bpm : '-'} <small className="text-xs text-slate-500 font-normal">BPM</small>
              </b>
            </div>
          </div>

          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-150"
              style={{ width: `${Math.min(100, (ear / 0.35) * 100)}%` }}
            />
          </div>
        </div>

        {/* 2. Gaze Vector Matrix */}
        <div className="flex flex-col justify-between gap-2.5 p-4 rounded-xl bg-slate-900/50 border border-slate-800/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-300">
              <Crosshair className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Gaze Vector</span>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-800 text-slate-300 font-mono">
              {gazeDirection}
            </span>
          </div>

          {/* 3x3 Quadrant Grid */}
          <div className="grid grid-cols-3 gap-1 w-full h-12 bg-slate-950 p-1 rounded-lg border border-slate-800">
            {gazeDirections.map(dir => (
              <div
                key={dir}
                className={`rounded transition-colors ${
                  gazeDirection === dir
                    ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50'
                    : dir === 'Center'
                    ? 'bg-slate-800/80 border border-dashed border-slate-700'
                    : 'bg-slate-900'
                }`}
              />
            ))}
          </div>
          <span className="text-[10px] text-slate-500">Screen Quadrant Engagement</span>
        </div>

        {/* 3. Fatigue Radar */}
        <div className="flex flex-col justify-between gap-3 p-4 rounded-xl bg-slate-900/50 border border-slate-800/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-300">
              <Moon className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Fatigue Radar</span>
            </div>
            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${fatigueTag.cls}`}>
              {fatigueTag.text}
            </span>
          </div>

          <div className="flex justify-between items-end">
            <div>
              <span className="text-[11px] text-slate-500 block">Yawns Logged</span>
              <b className="font-mono text-lg text-slate-200">{yawnsDetected}</b>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-500 block">Microsleeps</span>
              <b className="font-mono text-lg text-slate-200">{microsleepCount}</b>
            </div>
          </div>
          <span className="text-[10px] text-slate-500">Automatic jaw and eye-closure telemetry</span>
        </div>

        {/* 4. Three.js 3D Hologram Head Visualizer */}
        <div className="h-full">
          <ThreeHeadVisualizer pose={pose} state={state} isFaceTracked={isFaceTracked} />
        </div>

        {/* 5. 3D Head Pose Sliders */}
        <div className="col-span-1 md:col-span-2 flex flex-col gap-2.5 p-4 rounded-xl bg-slate-900/50 border border-slate-800/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-300">
              <Compass className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">3D Orientation Gauges</span>
            </div>
            <button
              onClick={onRecenter}
              className="px-2 py-0.5 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-md transition-colors"
            >
              Recenter
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {[
              { label: 'Yaw (Turn)', val: pose.yaw },
              { label: 'Pitch (Tilt)', val: pose.pitch },
              { label: 'Roll (Lean)', val: pose.roll },
            ].map(axis => (
              <div key={axis.label} className="grid grid-cols-[80px_1fr_45px] items-center gap-3 text-xs">
                <span className="text-slate-400">{axis.label}</span>
                <div className="relative h-1.5 bg-slate-800 rounded-full">
                  <span className="absolute left-1/2 top-[-2px] w-0.5 h-2.5 bg-slate-600 opacity-50" />
                  <span
                    className="absolute top-[-3px] w-3 h-3 -ml-1.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-500/50 transition-all duration-75"
                    style={{ left: `${50 + Math.max(-1, Math.min(1, axis.val / 40)) * 50}%` }}
                  />
                </div>
                <b className="font-mono text-right text-slate-200">{Math.round(axis.val)}&deg;</b>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
