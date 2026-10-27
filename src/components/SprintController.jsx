import React from 'react';
import { Coffee, Square, Play, Pause, RotateCcw } from 'lucide-react';

export const SprintController = ({
  durationMinutes,
  setDurationMinutes,
  timeRemainingFormatted,
  cycleCount,
  isTracking,
  onQuickBreak,
  onEndSession,
  onToggleTracking
}) => {
  const durations = [15, 25, 45, 60];

  return (
    <div className="theme-panel w-full flex flex-col gap-3.5 p-4 rounded-xl shadow-sm">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider theme-text-heading">Focus Sprint</span>
          <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 font-mono text-xs font-semibold border border-slate-300 dark:border-slate-700">
            Sprint Cycle #{cycleCount}
          </span>
        </div>

        {/* Duration Chips */}
        <div className="flex items-center gap-1 theme-inset p-1 rounded-lg">
          {durations.map(d => (
            <button
              key={d}
              onClick={() => setDurationMinutes(d)}
              className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                durationMinutes === d
                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40'
                  : 'theme-text-muted hover:theme-text-heading'
              }`}
            >
              {d}m
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider theme-text-faint font-semibold">Time Remaining</span>
          <b className="font-mono text-3xl font-bold tracking-tight theme-text-heading">
            {timeRemainingFormatted}
          </b>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Pause / Resume camera toggle */}
          {isTracking && (
            <button
              onClick={onToggleTracking}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg theme-btn-secondary text-xs font-semibold"
              title="Pause or Resume Camera Session (Press Space)"
            >
              <Pause className="w-3.5 h-3.5 text-amber-500" />
              <span>Pause</span>
              <kbd className="px-1 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-[10px] font-mono theme-text-faint">Space</kbd>
            </button>
          )}

          {/* Take Restorative Break */}
          <button
            onClick={onQuickBreak}
            disabled={!isTracking}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg theme-btn-secondary disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold"
            title="Start 4-7-8 box breathing eye break (Press B)"
          >
            <Coffee className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
            <span>Take Break</span>
            <kbd className="px-1 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-[10px] font-mono theme-text-faint">B</kbd>
          </button>

          {/* End Session Button with Clear Direction */}
          <button
            onClick={onEndSession}
            disabled={!isTracking}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold text-rose-600 dark:text-rose-400 border border-rose-500/30 transition-all shadow-sm"
            title="End active session and view comprehensive summary breakdown (Press E)"
          >
            <Square className="w-3.5 h-3.5" />
            <span>End Session</span>
            <kbd className="px-1.5 py-0.2 rounded bg-rose-500/20 text-[10px] font-mono">E</kbd>
          </button>
        </div>
      </div>

      <div className="theme-inset p-2 rounded-lg text-[11px] theme-text-muted flex items-center justify-between">
        <span>
          <strong className="theme-text-heading">End Session:</strong> Concludes active camera telemetry, compiles your flow statistics, and archives to local storage.
        </span>
        <span className="hidden sm:inline font-mono text-[10px] theme-text-faint">Shortcuts: Space, R, B, E, M, T, ?</span>
      </div>
    </div>
  );
};
