import React from 'react';
import { X, Trophy, Download, Share2, Play, Coffee, CheckCircle2 } from 'lucide-react';

export const SessionSummaryModal = ({
  isOpen,
  onClose,
  sessionStats,
  onStartNewSprint,
  onTakeBreak,
  onExportCsv,
  onOpenShareCard
}) => {
  if (!isOpen || !sessionStats) return null;

  const {
    durationMs,
    avgScore,
    flowPct,
    bestStreakMs,
    yawns,
    microsleeps,
    dominantSentiment,
    alignmentScore
  } = sessionStats;

  const formatTime = (ms) => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    }
    return `${minutes}m ${seconds}s`;
  };

  const getGrade = (s) => {
    if (s >= 88) return { label: 'Grade S - Elite Flow', color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/30' };
    if (s >= 75) return { label: 'Grade A - Strong Focus', color: 'text-cyan-500', bg: 'bg-cyan-500/10 border-cyan-500/30' };
    if (s >= 60) return { label: 'Grade B - Steady Work', color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/30' };
    return { label: 'Grade C - Distracted', color: 'text-rose-500', bg: 'bg-rose-500/10 border-rose-500/30' };
  };

  const grade = getGrade(avgScore);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="relative w-full max-w-lg p-6 theme-panel rounded-2xl shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h3 className="font-display text-base font-bold theme-text-heading">
              Session Concluded &amp; Archived
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg theme-text-muted hover:theme-text-heading theme-btn-secondary"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Hero Score Badge */}
        <div className="flex items-center justify-between p-4 rounded-xl theme-inset">
          <div className="flex items-center gap-4">
            <span className="font-display text-5xl font-bold theme-text-heading">
              {avgScore}
            </span>
            <div className="flex flex-col">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${grade.bg} ${grade.color}`}>
                {grade.label}
              </span>
              <span className="text-[11px] theme-text-muted mt-1">Mean Cognitive Flow Score</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase tracking-wider theme-text-faint font-semibold block">Total Focus Time</span>
            <b className="font-mono text-lg theme-text-heading">{formatTime(durationMs)}</b>
          </div>
        </div>

        {/* Performance Breakdown Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
          <div className="theme-inset p-3 rounded-lg flex flex-col">
            <span className="text-[10px] theme-text-faint uppercase font-semibold">Flow Ratio</span>
            <strong className="font-mono text-base text-emerald-500 dark:text-emerald-400 mt-0.5">{flowPct}%</strong>
            <span className="text-[10px] theme-text-muted">In uninterrupted flow</span>
          </div>

          <div className="theme-inset p-3 rounded-lg flex flex-col">
            <span className="text-[10px] theme-text-faint uppercase font-semibold">Longest Streak</span>
            <strong className="font-mono text-base theme-text-heading mt-0.5">{formatTime(bestStreakMs)}</strong>
            <span className="text-[10px] theme-text-muted">Continuous engagement</span>
          </div>

          <div className="theme-inset p-3 rounded-lg flex flex-col">
            <span className="text-[10px] theme-text-faint uppercase font-semibold">Posture Score</span>
            <strong className="font-mono text-base text-cyan-500 dark:text-cyan-400 mt-0.5">{alignmentScore}%</strong>
            <span className="text-[10px] theme-text-muted">On-axis alignment</span>
          </div>

          <div className="theme-inset p-3 rounded-lg flex flex-col">
            <span className="text-[10px] theme-text-faint uppercase font-semibold">Dominant Affect</span>
            <strong className="text-sm theme-text-heading mt-0.5 truncate">{dominantSentiment}</strong>
            <span className="text-[10px] theme-text-muted">Facial muscle tone</span>
          </div>

          <div className="theme-inset p-3 rounded-lg flex flex-col">
            <span className="text-[10px] theme-text-faint uppercase font-semibold">Yawns Logged</span>
            <strong className="font-mono text-base theme-text-heading mt-0.5">{yawns}</strong>
            <span className="text-[10px] theme-text-muted">Jaw openings</span>
          </div>

          <div className="theme-inset p-3 rounded-lg flex flex-col">
            <span className="text-[10px] theme-text-faint uppercase font-semibold">Microsleeps</span>
            <strong className="font-mono text-base theme-text-heading mt-0.5">{microsleeps}</strong>
            <span className="text-[10px] theme-text-muted">Closures &gt; 1200ms</span>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Session securely archived to your local browser storage. Ready for your next sprint!</span>
        </div>

        {/* Clear Action Direction Buttons */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1.5">
            <button
              onClick={onExportCsv}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg theme-btn-secondary text-xs font-semibold"
              title="Download CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
            <button
              onClick={onOpenShareCard}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg theme-btn-secondary text-xs font-semibold"
              title="Share Card"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onTakeBreak();
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg theme-btn-secondary text-xs font-semibold"
            >
              <Coffee className="w-3.5 h-3.5 text-cyan-500" />
              <span>Take Break</span>
            </button>
            <button
              onClick={() => {
                onClose();
                onStartNewSprint();
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors shadow-sm"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start New Sprint</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
