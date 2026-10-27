import React from 'react';
import { X, Download, FileJson, Play, Coffee, CheckCircle2, HeartPulse, ShieldCheck, Flame, Compass, Eye } from 'lucide-react';

export const SessionSummaryModal = ({
  isOpen,
  onClose,
  sessionStats,
  onStartNewSprint,
  onExportCsv,
  onExportJson
}) => {
  if (!isOpen || !sessionStats) return null;

  const {
    durationMs,
    avgScore,
    flowPct,
    bestStreakMs,
    maxDistractionMs,
    yawns,
    microsleeps,
    dominantSentiment,
    alignmentScore,
    avgBpm = 16,
    timeline = []
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
    if (s >= 88) return { label: 'Grade S', title: 'Elite Flow State', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' };
    if (s >= 75) return { label: 'Grade A', title: 'Strong Focus', color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/30' };
    if (s >= 60) return { label: 'Grade B', title: 'Steady Engagement', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' };
    return { label: 'Grade C', title: 'Attention Drifting', color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/30' };
  };

  const grade = getGrade(avgScore);

  const getTopInsight = () => {
    if (alignmentScore >= 85 && flowPct >= 75) {
      return 'Exceptional cognitive stability. Posture remained 85%+ on-axis with sustained eye hydration and zero significant fatigue lapses.';
    }
    if (alignmentScore < 70) {
      return 'Strong cognitive output, but head posture deviated frequently. Adjust your monitor height to align with screen horizon and relieve cervical spine strain.';
    }
    if (yawns > 2 || microsleeps > 1) {
      return 'Mental fatigue detected during the latter half. A 4-7-8 box breathing recovery cycle or brief hydration break will restore ciliary focus.';
    }
    return 'Consistent flow velocity. Balanced blink dynamics and stable gaze quadrants maintained throughout this session.';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-xl p-6 linear-panel rounded-2xl shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200 border border-white/10">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
              <HeartPulse className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold linear-text-heading">
                Session Focus &amp; Health Report
              </h3>
              <span className="text-[10px] linear-text-muted font-mono">100% On-Device Telemetry Summary</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg linear-btn-secondary"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Circular Recovery & Focus Score Header */}
        <div className="linear-inset p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" className="text-slate-800" strokeWidth="7" />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray="263.9"
                  strokeDashoffset={263.9 * (1 - avgScore / 100)}
                  style={{ filter: 'drop-shadow(0 0 6px rgba(16,185,129,0.5))' }}
                />
              </svg>
              <span className="absolute font-display text-2xl font-black linear-text-heading num-mono">
                {avgScore}
              </span>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${grade.bg} ${grade.color}`}>
                  {grade.label}
                </span>
                <span className="text-xs font-semibold linear-text-heading">{grade.title}</span>
              </div>
              <span className="text-[11px] linear-text-muted mt-1">Mean Cognitive Recovery &amp; Flow Score</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase tracking-wider linear-text-faint font-semibold block">Session Duration</span>
            <b className="font-mono text-base linear-text-heading">{formatTime(durationMs)}</b>
          </div>
        </div>

        {/* Primary Health & Ergonomic Insight */}
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-2.5 text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-0.5">
            <strong className="text-emerald-400 font-semibold text-[11px] uppercase tracking-wider">
              Primary Biometric Insight
            </strong>
            <p className="linear-text-muted text-[11px] leading-relaxed">
              {getTopInsight()}
            </p>
          </div>
        </div>

        {/* 4 Core Resume Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div className="linear-inset p-3 rounded-xl flex flex-col">
            <span className="text-[10px] linear-text-faint uppercase font-semibold">Flow Ratio</span>
            <strong className="font-mono text-base text-emerald-400 mt-0.5">{flowPct}%</strong>
            <span className="text-[10px] linear-text-muted">In flow zone</span>
          </div>

          <div className="linear-inset p-3 rounded-xl flex flex-col">
            <span className="text-[10px] linear-text-faint uppercase font-semibold">Posture Alignment</span>
            <strong className="font-mono text-base text-cyan-400 mt-0.5">{alignmentScore}%</strong>
            <span className="text-[10px] linear-text-muted">On-axis alignment</span>
          </div>

          <div className="linear-inset p-3 rounded-xl flex flex-col">
            <span className="text-[10px] linear-text-faint uppercase font-semibold">Average Blink Rate</span>
            <strong className="font-mono text-base text-amber-400 mt-0.5">{avgBpm} BPM</strong>
            <span className="text-[10px] linear-text-muted">Asthenopia metric</span>
          </div>

          <div className="linear-inset p-3 rounded-xl flex flex-col">
            <span className="text-[10px] linear-text-faint uppercase font-semibold">Peak Flow Streak</span>
            <strong className="font-mono text-base linear-text-heading mt-0.5">{formatTime(bestStreakMs)}</strong>
            <span className="text-[10px] linear-text-muted">Longest focus period</span>
          </div>
        </div>

        {/* Mini Session Trend SVG Visualization */}
        {timeline && timeline.length > 3 && (
          <div className="linear-inset p-3 rounded-xl flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[10px] linear-text-muted font-mono">
              <span>Session Flow Trend (0 - 100)</span>
              <span>{timeline.length} telemetry samples</span>
            </div>
            <div className="w-full h-14 flex items-end">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 100 35" preserveAspectRatio="none">
                <polyline
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={timeline
                    .map((item, index) => {
                      const x = (index / (timeline.length - 1)) * 100;
                      const y = 35 - ((item.score || 80) / 100) * 35;
                      return `${x.toFixed(1)},${y.toFixed(1)}`;
                    })
                    .join(' ')}
                />
              </svg>
            </div>
          </div>
        )}

        {/* Action Buttons: Export CSV, Export JSON, Start New Sprint */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-white/5">
          <div className="flex items-center gap-2">
            <button
              onClick={onExportCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg linear-btn-secondary text-xs font-semibold"
              title="Download timestamped biometric CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={onExportJson}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg linear-btn-secondary text-xs font-semibold"
              title="Download full JSON session telemetry"
            >
              <FileJson className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
          </div>

          <button
            onClick={() => {
              onClose();
              onStartNewSprint();
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-bold text-xs transition-colors shadow-md shadow-emerald-500/20"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Start New Session</span>
          </button>
        </div>
      </div>
    </div>
  );
};
