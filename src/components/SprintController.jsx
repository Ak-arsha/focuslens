import React from 'react';
import { Coffee, Square } from 'lucide-react';

export const SprintController = ({
  durationMinutes,
  setDurationMinutes,
  timeRemainingFormatted,
  cycleCount,
  isTracking,
  onQuickBreak,
  onEndSession,
}) => {
  const durations = [15, 25, 45, 60];

  return (
    <div className="w-full flex flex-col gap-3 p-4 bg-slate-900/60 border border-slate-800/80 rounded-xl">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Focus Sprint</span>
          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 font-mono text-xs font-semibold border border-slate-700">
            Cycle #{cycleCount}
          </span>
        </div>

        {/* Duration Chips */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          {durations.map(d => (
            <button
              key={d}
              onClick={() => setDurationMinutes(d)}
              className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                durationMinutes === d
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {d}m
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <b className="font-mono text-3xl font-bold tracking-tight text-slate-100">
          {timeRemainingFormatted}
        </b>

        <div className="flex items-center gap-2">
          <button
            onClick={onQuickBreak}
            disabled={!isTracking}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
          >
            <Coffee className="w-3.5 h-3.5 text-cyan-400" />
            <span>Take Break</span>
          </button>

          <button
            onClick={onEndSession}
            disabled={!isTracking}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-rose-400 border border-rose-500/30 transition-colors"
          >
            <Square className="w-3.5 h-3.5" />
            <span>End Session</span>
          </button>
        </div>
      </div>
    </div>
  );
};
