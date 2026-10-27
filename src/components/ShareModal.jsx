import React, { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';

export const ShareModal = ({
  isOpen,
  onClose,
  avgScore,
  durationMs,
  flowPct,
  bestStreakMs,
  yawns,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

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

  const grade = avgScore >= 85 ? 'Grade S - Deep Flow' : avgScore >= 70 ? 'Grade A - Strong Focus' : 'Grade B - Steady Focus';
  const today = new Date().toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

  const shareText = `FocusLens AI Telemetry Summary
------------------------------------
Duration: ${formatTime(durationMs)}
Mean Focus Score: ${avgScore}/100
Flow State: ${flowPct}%
Best Streak: ${formatTime(bestStreakMs)}
Privacy: 100% Client-Side Processing - https://focuslens-lilac.vercel.app`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="relative w-full max-w-md p-6 theme-panel rounded-2xl shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-display text-base font-bold theme-text-heading">Share Focus Summary</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg theme-text-muted hover:theme-text-heading theme-btn-secondary"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Visual Card Preview */}
        <div className="p-5 rounded-xl bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 text-slate-100 border border-slate-700 shadow-xl flex flex-col gap-4">
          <div className="flex justify-between items-center text-xs">
            <span className="font-display font-bold text-slate-100">FocusLens Studio</span>
            <span className="text-slate-400 font-mono text-[11px]">{today}</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="font-display text-5xl font-bold text-emerald-400">{avgScore}</span>
            <div className="flex flex-col">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {grade}
              </span>
              <span className="text-[10px] text-slate-400 mt-1">Client-Side AI Focus Telemetry</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 p-3 bg-black/40 rounded-lg border border-slate-800 text-xs">
            <div>
              <span className="text-[10px] uppercase text-slate-400 block">Duration</span>
              <strong className="font-mono text-slate-200">{formatTime(durationMs)}</strong>
            </div>
            <div>
              <span className="text-[10px] uppercase text-slate-400 block">Flow Rate</span>
              <strong className="font-mono text-emerald-400">{flowPct}%</strong>
            </div>
            <div>
              <span className="text-[10px] uppercase text-slate-400 block">Best Streak</span>
              <strong className="font-mono text-slate-200">{formatTime(bestStreakMs)}</strong>
            </div>
            <div>
              <span className="text-[10px] uppercase text-slate-400 block">Yawns</span>
              <strong className="font-mono text-slate-200">{yawns} detected</strong>
            </div>
          </div>

          <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-800 pt-2">
            <span>https://focuslens-lilac.vercel.app</span>
            <span>100% Private On-Device AI</span>
          </div>
        </div>

        <p className="text-xs theme-text-muted text-center">
          Copy this formatted summary to your clipboard to paste into Slack, Discord, LinkedIn, or notes.
        </p>

        <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-emerald-500/20"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Summary'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
