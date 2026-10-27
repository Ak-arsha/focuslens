import React from 'react';
import { Activity, ShieldCheck, Flame, Zap } from 'lucide-react';

export const WhoopFocusDial = ({
  score,
  state,
  isTracking,
  streakMs,
  alignmentScore,
  flowRatio
}) => {
  const scorePercent = Math.max(0, Math.min(100, Math.round(score)));
  // Radius: 68 -> Circumference = 2 * PI * 68 = 427.25
  const circumference = 427.25;
  const strokeDashoffset = circumference * (1 - scorePercent / 100);

  const formatStreak = (ms) => {
    const totalSecs = Math.max(0, Math.floor(ms / 1000));
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}m ${String(secs).padStart(2, '0')}s`;
  };

  const getDialColor = () => {
    switch (state) {
      case 'focused': return '#10B981'; // Emerald
      case 'distracted': return '#F59E0B'; // Amber
      case 'drowsy': return '#F43F5E'; // Rose
      default: return '#64748B'; // Slate
    }
  };

  const getStatusHeadline = () => {
    switch (state) {
      case 'focused': return 'Deep Cognitive Flow';
      case 'distracted': return 'Attention Drifting';
      case 'drowsy': return 'Fatigue Detected';
      default: return 'Telemetry Standby';
    }
  };

  const getStatusSubtext = () => {
    switch (state) {
      case 'focused': return 'High alpha-band engagement & stable eye fixation';
      case 'distracted': return 'Off-axis gaze or head orientation deviation';
      case 'drowsy': return 'Prolonged eye closure or involuntary yawning';
      default: return 'Start camera session to calibrate baseline';
    }
  };

  return (
    <div className="linear-panel p-5 rounded-2xl flex flex-col items-center justify-between text-center relative overflow-hidden shadow-lg h-full">
      {/* Background radial glow */}
      <div
        className="absolute w-56 h-56 rounded-full pointer-events-none -top-10 -right-10 opacity-20 blur-3xl transition-colors duration-500"
        style={{ backgroundColor: getDialColor() }}
      />

      {/* Top Header Label */}
      <div className="flex items-center justify-between w-full z-10">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider linear-text-muted">
          <Activity className="w-3.5 h-3.5 text-emerald-500" />
          <span>Cognitive Strain / Flow Index</span>
        </div>
        <span
          className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border transition-colors"
          style={{
            borderColor: `${getDialColor()}40`,
            backgroundColor: `${getDialColor()}15`,
            color: getDialColor()
          }}
        >
          {isTracking ? 'Active Live Telemetry' : 'Standby'}
        </span>
      </div>

      {/* Dominant Whoop/Oura Style Circular Gauge */}
      <div className="relative w-48 h-48 my-3 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
          {/* Background track circle */}
          <circle
            cx="80"
            cy="80"
            r="68"
            fill="none"
            stroke="currentColor"
            className="text-slate-200 dark:text-slate-800/80"
            strokeWidth="8"
          />

          {/* Glowing active progress circle */}
          <circle
            cx="80"
            cy="80"
            r="68"
            fill="none"
            stroke={getDialColor()}
            strokeWidth="8.5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-300 ease-out"
            style={{
              filter: isTracking ? `drop-shadow(0 0 8px ${getDialColor()}88)` : 'none'
            }}
          />
        </svg>

        {/* Center Single Dominant Number */}
        <div className="absolute inset-0 flex flex-col items-center justify-center select-none">
          <span className="font-display text-5xl font-extrabold tracking-tight linear-text-heading num-mono">
            {isTracking ? scorePercent : '--'}
          </span>
          <span className="text-[11px] font-mono font-semibold uppercase tracking-wider linear-text-muted mt-0.5">
            Focus Score
          </span>
        </div>
      </div>

      {/* Supporting Headline & Plain-English Interpretation */}
      <div className="flex flex-col items-center gap-1 max-w-xs z-10">
        <div className="flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: getDialColor() }}
          />
          <h3 className="font-display font-bold text-sm linear-text-heading">
            {getStatusHeadline()}
          </h3>
        </div>
        <p className="text-[11px] linear-text-muted leading-relaxed">
          {getStatusSubtext()}
        </p>
      </div>

      {/* Whoop-Style Sub-Telemetry Row (Streak, Alignment, Ratio) */}
      <div className="grid grid-cols-3 gap-2 w-full pt-3 mt-3 border-t border-white/5 dark:border-white/5 z-10 text-xs">
        <div className="linear-inset p-2 rounded-lg flex flex-col items-center">
          <div className="flex items-center gap-1 text-[10px] font-mono text-emerald-500 font-semibold">
            <Flame className="w-3 h-3" />
            <span>Streak</span>
          </div>
          <span className="font-mono font-bold linear-text-heading text-xs mt-0.5">
            {formatStreak(streakMs)}
          </span>
        </div>

        <div className="linear-inset p-2 rounded-lg flex flex-col items-center">
          <div className="flex items-center gap-1 text-[10px] font-mono text-cyan-400 font-semibold">
            <ShieldCheck className="w-3 h-3" />
            <span>Posture</span>
          </div>
          <span className="font-mono font-bold linear-text-heading text-xs mt-0.5">
            {alignmentScore}%
          </span>
        </div>

        <div className="linear-inset p-2 rounded-lg flex flex-col items-center">
          <div className="flex items-center gap-1 text-[10px] font-mono text-amber-400 font-semibold">
            <Zap className="w-3 h-3" />
            <span>Flow Ratio</span>
          </div>
          <span className="font-mono font-bold linear-text-heading text-xs mt-0.5">
            {flowRatio}%
          </span>
        </div>
      </div>
    </div>
  );
};
