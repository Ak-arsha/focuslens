import React from 'react';
import { Eye, ShieldCheck, Moon, AlertTriangle, CheckCircle2, Compass } from 'lucide-react';

export const CoreBiometricsStack = ({ biometrics, state = 'idle', onRecenter }) => {
  const {
    ear = 0,
    bpm = null,
    yawnsDetected = 0,
    microsleepCount = 0,
    alignment = { isAligned: true, status: 'Optimal Posture', cue: 'Aligned with screen center' },
    pose = { yaw: 0, pitch: 0, roll: 0 }
  } = biometrics || {};

  const getBpmTag = () => {
    if (bpm === null) return { text: 'Analyzing...', color: 'text-slate-400 bg-slate-800' };
    if (bpm < 10) return { text: 'Low • Dry Eye Risk', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' };
    if (bpm > 28) return { text: 'High Blink Rate', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
    return { text: 'Healthy • 12-20 BPM', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
  };

  const getFatigueTag = () => {
    if (yawnsDetected > 2 || microsleepCount > 1) {
      return { text: 'High Fatigue Risk', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' };
    }
    if (yawnsDetected > 0 || microsleepCount > 0) {
      return { text: 'Moderate Fatigue', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
    }
    return { text: 'Restful & Alert', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
  };

  const bpmTag = getBpmTag();
  const fatigueTag = getFatigueTag();
  const safeEar = typeof ear === 'number' ? ear : 0;
  const safePose = pose || { yaw: 0, pitch: 0, roll: 0 };
  const safeAlignment = alignment || { isAligned: true, status: 'Optimal Posture' };

  return (
    <div className="flex flex-col gap-3.5 w-full select-none">
      {/* 1. Blink Rate & Eye-Strain Risk */}
      <div className="linear-panel p-4 rounded-xl flex flex-col justify-between gap-2.5 border border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold uppercase tracking-wider linear-text-heading">
              Blink Rate &amp; Eye Strain
            </span>
          </div>
          <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-full border ${bpmTag.color}`}>
            {bpmTag.text}
          </span>
        </div>

        <div className="flex items-baseline justify-between pt-1">
          <div>
            <span className="text-[11px] linear-text-muted block">Blink Frequency</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <b className="font-mono text-2xl font-bold linear-text-heading">{bpm !== null ? bpm : '--'}</b>
              <span className="text-xs linear-text-muted font-normal">BPM</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] linear-text-muted block">Eye Openness (EAR)</span>
            <b className="font-mono text-lg font-bold linear-text-heading mt-0.5">{safeEar.toFixed(2)}</b>
          </div>
        </div>

        {/* EAR Progress Indicator */}
        <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-150"
            style={{ width: `${Math.min(100, (safeEar / 0.35) * 100)}%` }}
          />
        </div>
      </div>

      {/* 2. Posture Status & Ergonomic Alignment */}
      <div className="linear-panel p-4 rounded-xl flex flex-col justify-between gap-2.5 border border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-semibold uppercase tracking-wider linear-text-heading">
              Ergonomic Posture
            </span>
          </div>
          <span
            className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-full border flex items-center gap-1 ${
              safeAlignment.isAligned
                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                : 'text-amber-400 bg-amber-500/10 border-amber-500/30'
            }`}
          >
            {safeAlignment.isAligned ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
            <span>{safeAlignment.status}</span>
          </span>
        </div>

        <div className="flex items-center justify-between text-xs pt-1">
          <div className="flex items-center gap-4 font-mono">
            <div>
              <span className="text-[10px] linear-text-muted uppercase block">Yaw</span>
              <span className={Math.abs(safePose.yaw || 0) > 14 ? 'text-amber-400 font-bold' : 'linear-text-heading'}>
                {safePose.yaw || 0}&deg;
              </span>
            </div>
            <div>
              <span className="text-[10px] linear-text-muted uppercase block">Pitch</span>
              <span className={Math.abs(safePose.pitch || 0) > 12 ? 'text-amber-400 font-bold' : 'linear-text-heading'}>
                {safePose.pitch || 0}&deg;
              </span>
            </div>
            <div>
              <span className="text-[10px] linear-text-muted uppercase block">Roll</span>
              <span className={Math.abs(safePose.roll || 0) > 10 ? 'text-amber-400 font-bold' : 'linear-text-heading'}>
                {safePose.roll || 0}&deg;
              </span>
            </div>
          </div>

          <button
            onClick={onRecenter}
            className="px-2.5 py-1 rounded-lg linear-btn-secondary text-xs font-semibold text-cyan-400 flex items-center gap-1"
            title="Recenter Baseline (Press R)"
          >
            <span>Recenter</span>
            <kbd className="px-1 py-0.2 rounded bg-black/30 text-[9px] font-mono">R</kbd>
          </button>
        </div>
      </div>

      {/* 3. Fatigue & Involuntary Sleep Radar */}
      <div className="linear-panel p-4 rounded-xl flex flex-col justify-between gap-2.5 border border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Moon className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold uppercase tracking-wider linear-text-heading">
              Fatigue &amp; Drowsiness
            </span>
          </div>
          <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-full border ${fatigueTag.color}`}>
            {fatigueTag.text}
          </span>
        </div>

        <div className="flex items-baseline justify-between pt-1">
          <div>
            <span className="text-[11px] linear-text-muted block">Yawns Logged</span>
            <b className="font-mono text-xl font-bold linear-text-heading mt-0.5">{yawnsDetected}</b>
          </div>

          <div className="text-right">
            <span className="text-[11px] linear-text-muted block">Microsleeps (&gt;1.2s)</span>
            <b className="font-mono text-xl font-bold linear-text-heading mt-0.5">{microsleepCount}</b>
          </div>
        </div>
      </div>
    </div>
  );
};
