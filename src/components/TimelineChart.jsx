import React, { useRef, useEffect, useState } from 'react';
import { Download, FileJson, Share2 } from 'lucide-react';

export const TimelineChart = ({
  timeline,
  elapsedMs,
  bestStreakMs,
  maxDistractionMs,
  avgScore,
  timeInState,
  onExportCsv,
  onExportJson,
  onOpenShareCard,
  isTracking,
}) => {
  const canvasRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);

  const formatTime = (ms) => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const totalTime = timeInState.focused + timeInState.distracted + timeInState.drowsy || 1;
  const pctFlow = Math.round((timeInState.focused / totalTime) * 100);
  const pctDrift = Math.round((timeInState.distracted / totalTime) * 100);
  const pctFatigue = Math.round((timeInState.drowsy / totalTime) * 100);

  const getGrade = (score) => {
    if (score >= 88) return 'Grade S - Elite Flow';
    if (score >= 75) return 'Grade A - Strong Focus';
    if (score >= 60) return 'Grade B - Steady Focus';
    return 'Grade C - Drifting';
  };

  // Render high-DPI canvas graph
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    // Subtle threshold reference lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
    ctx.lineWidth = 1;
    [0.8, 0.4].forEach(level => {
      const y = h * (1 - level);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    });

    if (!timeline.length) {
      ctx.fillStyle = '#64748B';
      ctx.font = '12px Plus Jakarta Sans, sans-serif';
      ctx.fillText('Start your camera session to chart real-time attention telemetry.', 16, h / 2 + 4);
      ctx.restore();
      return;
    }

    const barWidth = w / Math.max(timeline.length, 90);

    timeline.forEach((pt, i) => {
      const color =
        pt.st === 'focused' ? '#10B981' : pt.st === 'distracted' ? '#F59E0B' : '#F43F5E';
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.85;
      const barHeight = Math.max(3, (pt.s / 100) * (h - 14));
      const x = i * barWidth;
      const y = h - barHeight;

      ctx.fillRect(x, y, Math.max(barWidth - 1, 1), barHeight);
    });

    ctx.restore();
  }, [timeline]);

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas || !timeline.length) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const barWidth = rect.width / Math.max(timeline.length, 90);
    const index = Math.floor(mouseX / barWidth);

    if (index >= 0 && index < timeline.length) {
      setTooltip({ x: mouseX, point: timeline[index] });
    }
  };

  return (
    <div className="w-full flex flex-col gap-4 p-5 bg-slate-900/60 border border-slate-800/80 rounded-xl">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Longitudinal Telemetry
          </span>
          <h2 className="font-display text-base font-bold text-slate-200">Session Focus Timeline</h2>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onExportCsv}
            disabled={!timeline.length}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-semibold text-slate-300 border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={onExportJson}
            disabled={!timeline.length}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-semibold text-slate-300 border border-slate-700 transition-colors"
          >
            <FileJson className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
          <button
            onClick={onOpenShareCard}
            disabled={!timeline.length}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-semibold text-slate-300 border border-slate-700 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share Card</span>
          </button>
        </div>
      </div>

      {/* Canvas Chart with Interactive Scrubbing */}
      <div className="relative w-full h-44 bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setTooltip(null)}
          className="w-full h-full block cursor-crosshair"
        />

        {tooltip && (
          <div
            className="absolute top-2.5 -translate-x-1/2 bg-slate-900/95 border border-slate-700 text-slate-100 px-2.5 py-1.5 rounded shadow-xl text-xs pointer-events-none z-30 backdrop-blur-md"
            style={{ left: `${tooltip.x}px` }}
          >
            <span className="text-[10px] font-mono text-slate-400 block">
              {formatTime(tooltip.point.t * 1000)}
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <b className="font-mono text-emerald-400">{tooltip.point.s} / 100</b>
              <span className="capitalize text-slate-300">{tooltip.point.st}</span>
            </div>
          </div>
        )}
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
          <span className="text-[10px] font-semibold uppercase text-slate-500 block">Session Duration</span>
          <b className="font-mono text-xl text-slate-100">{formatTime(elapsedMs)}</b>
          <span className="text-[10px] text-slate-500 block mt-0.5">Active Tracking</span>
        </div>
        <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
          <span className="text-[10px] font-semibold uppercase text-slate-500 block">Longest Flow Streak</span>
          <b className="font-mono text-xl text-emerald-400">{formatTime(bestStreakMs)}</b>
          <span className="text-[10px] text-slate-500 block mt-0.5">Uninterrupted Flow</span>
        </div>
        <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
          <span className="text-[10px] font-semibold uppercase text-slate-500 block">Longest Distraction</span>
          <b className="font-mono text-xl text-amber-400">{formatTime(maxDistractionMs)}</b>
          <span className="text-[10px] text-slate-500 block mt-0.5">Max Drift Time</span>
        </div>
        <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
          <span className="text-[10px] font-semibold uppercase text-slate-500 block">Mean Focus Score</span>
          <b className="font-mono text-xl text-slate-100">{isTracking ? avgScore : '-'}</b>
          <span className="text-[10px] font-bold text-emerald-400 block mt-0.5">
            {isTracking ? getGrade(avgScore) : '-'}
          </span>
        </div>
      </div>

      {/* Distribution Bar */}
      <div className="flex flex-col gap-2">
        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
          <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${pctFlow}%` }} />
          <div className="h-full bg-amber-500 transition-all duration-300" style={{ width: `${pctDrift}%` }} />
          <div className="h-full bg-rose-500 transition-all duration-300" style={{ width: `${pctFatigue}%` }} />
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>In Flow <strong className="text-slate-200">{pctFlow}%</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Distracted <strong className="text-slate-200">{pctDrift}%</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Fatigued <strong className="text-slate-200">{pctFatigue}%</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
