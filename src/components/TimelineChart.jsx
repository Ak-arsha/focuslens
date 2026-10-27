import React, { useRef, useEffect, useState } from 'react';
import { Download, FileJson } from 'lucide-react';

export const TimelineChart = ({
  timeline = [],
  elapsedMs = 0,
  bestStreakMs = 0,
  maxDistractionMs = 0,
  avgScore = 80,
  timeInState = { focused: 0, distracted: 0, drowsy: 0 },
  onExportCsv,
  onExportJson,
  isTracking = false,
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

  const safeTime = timeInState || { focused: 0, distracted: 0, drowsy: 0 };
  const totalTime = (safeTime.focused || 0) + (safeTime.distracted || 0) + (safeTime.drowsy || 0) || 1;
  const pctFlow = Math.round(((safeTime.focused || 0) / totalTime) * 100);
  const pctDrift = Math.round(((safeTime.distracted || 0) / totalTime) * 100);
  const pctFatigue = Math.round(((safeTime.drowsy || 0) / totalTime) * 100);

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

    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';

    // Threshold guidelines
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
    ctx.lineWidth = 1;
    [0.8, 0.4].forEach(level => {
      const y = h * (1 - level);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    });

    if (!timeline || timeline.length < 2) {
      // Empty state guidance
      ctx.fillStyle = isDark ? '#64748B' : '#94A3B8';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        isTracking
          ? 'Sampling second-by-second focus telemetry...'
          : 'Telemetry Timeline Standby - Start a camera session to begin streaming',
        w / 2,
        h / 2
      );
      ctx.restore();
      return;
    }

    const padLeft = 10;
    const padRight = 10;
    const padTop = 15;
    const padBottom = 20;
    const plotW = w - padLeft - padRight;
    const plotH = h - padTop - padBottom;

    const minT = timeline[0].t;
    const maxT = Math.max(timeline[timeline.length - 1].t, minT + 10);

    const getX = t => padLeft + ((t - minT) / (maxT - minT)) * plotW;
    const getY = s => padTop + (1 - s / 100) * plotH;

    // Gradient fill under the curve
    const areaGrad = ctx.createLinearGradient(0, padTop, 0, padTop + plotH);
    areaGrad.addColorStop(0, 'rgba(16, 185, 129, 0.35)');
    areaGrad.addColorStop(0.5, 'rgba(16, 185, 129, 0.12)');
    areaGrad.addColorStop(1, 'rgba(16, 185, 129, 0.0)');

    ctx.beginPath();
    ctx.moveTo(getX(timeline[0].t), getY(timeline[0].s));
    for (let i = 1; i < timeline.length; i++) {
      const prev = timeline[i - 1];
      const curr = timeline[i];
      const midX = (getX(prev.t) + getX(curr.t)) / 2;
      const midY = (getY(prev.s) + getY(curr.s)) / 2;
      ctx.quadraticCurveTo(getX(prev.t), getY(prev.s), midX, midY);
    }
    const last = timeline[timeline.length - 1];
    ctx.lineTo(getX(last.t), getY(last.s));
    ctx.lineTo(getX(last.t), padTop + plotH);
    ctx.lineTo(getX(timeline[0].t), padTop + plotH);
    ctx.closePath();
    ctx.fillStyle = areaGrad;
    ctx.fill();

    // Primary score curve stroke
    ctx.beginPath();
    ctx.moveTo(getX(timeline[0].t), getY(timeline[0].s));
    for (let i = 1; i < timeline.length; i++) {
      const prev = timeline[i - 1];
      const curr = timeline[i];
      const midX = (getX(prev.t) + getX(curr.t)) / 2;
      const midY = (getY(prev.s) + getY(curr.s)) / 2;
      ctx.quadraticCurveTo(getX(prev.t), getY(prev.s), midX, midY);
    }
    ctx.lineTo(getX(last.t), getY(last.s));
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.restore();
  }, [timeline, isTracking]);

  return (
    <div className="w-full flex flex-col gap-3.5 select-none">
      {/* Top Header Controls */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider linear-text-heading">
            Live Telemetry Timeline
          </span>
          <span className="text-[10px] linear-text-faint font-mono">
            {timeline.length} samples recorded
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onExportCsv}
            disabled={!timeline.length}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg linear-btn-secondary text-xs font-semibold disabled:opacity-40"
            title="Download CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
          <button
            onClick={onExportJson}
            disabled={!timeline.length}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg linear-btn-secondary text-xs font-semibold disabled:opacity-40"
            title="Download JSON"
          >
            <FileJson className="w-3.5 h-3.5" />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* High-DPI Canvas Viewport */}
      <div className="relative w-full h-36 linear-inset rounded-xl p-2 overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>

      {/* KPI Breakdown Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="linear-inset p-2.5 rounded-lg flex flex-col">
          <span className="text-[10px] linear-text-faint uppercase font-semibold">Active Duration</span>
          <b className="font-mono text-sm linear-text-heading mt-0.5">{formatTime(elapsedMs)}</b>
        </div>

        <div className="linear-inset p-2.5 rounded-lg flex flex-col">
          <span className="text-[10px] linear-text-faint uppercase font-semibold">Peak Flow Streak</span>
          <b className="font-mono text-sm text-emerald-400 mt-0.5">{formatTime(bestStreakMs)}</b>
        </div>

        <div className="linear-inset p-2.5 rounded-lg flex flex-col">
          <span className="text-[10px] linear-text-faint uppercase font-semibold">Max Distraction</span>
          <b className="font-mono text-sm text-amber-400 mt-0.5">{formatTime(maxDistractionMs)}</b>
        </div>

        <div className="linear-inset p-2.5 rounded-lg flex flex-col">
          <span className="text-[10px] linear-text-faint uppercase font-semibold">Mean Flow Ratio</span>
          <b className="font-mono text-sm text-cyan-400 mt-0.5">{pctFlow}%</b>
        </div>
      </div>
    </div>
  );
};
