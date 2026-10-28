import React from 'react';
import {
  Bot,
  Play,
  Sparkles,
  ShieldCheck,
  Eye,
  Compass,
  Smile,
  ArrowRight,
  BookOpen,
  Keyboard,
  Sun,
  Moon,
  Github,
  CheckCircle2
} from 'lucide-react';

export const BotWelcomeScreen = ({
  onEnterCockpit,
  onStartInteractiveTour,
  theme,
  onToggleTheme
}) => {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-heading)] flex flex-col justify-between p-4 sm:p-8 select-none font-sans animate-in fade-in duration-300">
      {/* Top Navbar */}
      <header className="max-w-5xl w-full mx-auto flex items-center justify-between pb-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center">
            <svg viewBox="0 0 32 32" className="w-full h-full">
              <circle cx="16" cy="16" r="14" fill="none" stroke="#10B981" strokeWidth="2.5" />
              <circle cx="16" cy="16" r="8" fill="#10B981" opacity="0.25" />
              <circle cx="16" cy="16" r="3.5" fill="#10B981" />
            </svg>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-base linear-text-heading">FocusLens</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono uppercase font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              v2.0
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>100% On-Device AI • No Cloud Uploads</span>
          </div>

          <button
            onClick={onToggleTheme}
            className="p-2 rounded-lg linear-btn-secondary"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>
        </div>
      </header>

      {/* Main Bot Addressal Hero Container */}
      <main className="max-w-3xl w-full mx-auto my-auto py-8 flex flex-col items-center text-center gap-7">
        {/* LensBot Floating Avatar & Speech Bubble */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-3xl bg-emerald-500/15 border-2 border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_35px_rgba(16,185,129,0.3)] transform hover:scale-105 transition-all">
              <Bot className="w-10 h-10 text-emerald-400" />
            </div>
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 animate-ping opacity-60" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-[var(--bg-primary)]" />
          </div>

          {/* Friendly Addressal Speech Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold animate-in slide-in-from-bottom-2 duration-200">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Hi! I am LensBot, your AI focus &amp; ergonomics guide.</span>
          </div>
        </div>

        {/* Hero Headline & Purpose */}
        <div className="flex flex-col gap-3">
          <h1 className="font-display font-extrabold text-3xl sm:text-5xl linear-text-heading tracking-tight leading-tight">
            Real-time biometric focus telemetry. <br className="hidden sm:inline" />
            <span className="text-emerald-400">Entirely on your device.</span>
          </h1>

          <p className="text-sm sm:text-base linear-text-muted max-w-xl mx-auto leading-relaxed">
            FocusLens monitors your cognitive flow, cervical posture alignment, and dry-eye blink rates using on-device computer vision models. No video or audio leaves your computer.
          </p>
        </div>

        {/* 3 Neat Benefit Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 w-full text-left">
          <div className="linear-panel p-4 rounded-2xl border border-white/5 flex flex-col gap-2 hover:border-emerald-500/30 transition-all">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Eye className="w-4 h-4" />
            </div>
            <h3 className="font-display text-sm font-bold linear-text-heading">Flow &amp; Attention</h3>
            <p className="text-xs linear-text-muted leading-relaxed">
              Whoop-style 0–100 focus dial and gaze fixation telemetry to measure deep cognitive flow.
            </p>
          </div>

          <div className="linear-panel p-4 rounded-2xl border border-white/5 flex flex-col gap-2 hover:border-cyan-500/30 transition-all">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Compass className="w-4 h-4" />
            </div>
            <h3 className="font-display text-sm font-bold linear-text-heading">3D Posture Defense</h3>
            <p className="text-xs linear-text-muted leading-relaxed">
              3D WebGL spine hologram &amp; alignment guidelines to eliminate forward neck slouching.
            </p>
          </div>

          <div className="linear-panel p-4 rounded-2xl border border-white/5 flex flex-col gap-2 hover:border-amber-500/30 transition-all">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Smile className="w-4 h-4" />
            </div>
            <h3 className="font-display text-sm font-bold linear-text-heading">Blink &amp; Fatigue Radar</h3>
            <p className="text-xs linear-text-muted leading-relaxed">
              Calculates Eye Aspect Ratio (EAR) to prevent dry-eye strain and triggers 4-7-8 breathing resets.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          {/* Primary CTA */}
          <button
            onClick={() => onEnterCockpit(true)}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-bold text-sm transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 group"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Enter Cockpit &amp; Start Session</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Secondary CTA: Take Guided Tour */}
          <button
            onClick={onStartInteractiveTour}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl linear-btn-secondary text-xs font-semibold flex items-center justify-center gap-2 hover:border-emerald-500/40"
          >
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <span>Take Step-by-Step Tour</span>
          </button>
        </div>

        {/* Quick Skip Link for Power Users */}
        <button
          onClick={() => onEnterCockpit(false)}
          className="text-xs linear-text-muted hover:linear-text-heading underline underline-offset-4 transition-colors"
        >
          Skip directly to dashboard without starting camera
        </button>
      </main>

      {/* Footer System Summary */}
      <footer className="max-w-5xl w-full mx-auto pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs linear-text-faint">
        <div className="flex items-center gap-3 font-mono text-[11px]">
          <span>Shortcuts:</span>
          <span>Space (Start/Pause)</span>
          <span>•</span>
          <span>R (Recenter)</span>
          <span>•</span>
          <span>B (Break)</span>
          <span>•</span>
          <span>E (End)</span>
        </div>

        <div className="flex items-center gap-4">
          <a
            href="https://github.com/Ak-arsha/focuslens"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-white transition-colors"
          >
            <Github className="w-4 h-4" />
            <span>GitHub</span>
          </a>
        </div>
      </footer>
    </div>
  );
};
