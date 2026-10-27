import React from 'react';
import { Eye, Volume2, VolumeX, Compass, ShieldCheck, Sun, Moon, Github } from 'lucide-react';

export const Navbar = ({
  state,
  viewMode,
  setViewMode,
  soundFxEnabled,
  toggleSoundFx,
  hudEnabled,
  toggleHud,
  theme,
  toggleTheme,
  onCalibrate,
  onOpenPrivacy,
}) => {
  const getStatusText = () => {
    switch (state) {
      case 'focused': return 'Deep Flow';
      case 'distracted': return 'Attention Drifting';
      case 'drowsy': return 'Fatigue Alert';
      default: return 'Camera Offline';
    }
  };

  const getStatusColor = () => {
    switch (state) {
      case 'focused': return 'bg-emerald-500 shadow-emerald-500/50';
      case 'distracted': return 'bg-amber-500 shadow-amber-500/50';
      case 'drowsy': return 'bg-rose-500 shadow-rose-500/50';
      default: return 'bg-slate-500';
    }
  };

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-3 bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/80">
      {/* Brand & Live Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8 flex items-center justify-center">
            <svg viewBox="0 0 32 32" className="w-full h-full">
              <circle cx="16" cy="16" r="14" fill="none" stroke="#10B981" strokeWidth="2.5" />
              <circle cx="16" cy="16" r="8" fill="#10B981" opacity="0.25" />
              <circle cx="16" cy="16" r="3.5" fill="#10B981" />
            </svg>
            <span className="absolute inset-0 rounded-full border border-emerald-500/30 animate-ping opacity-30" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-lg text-slate-100 tracking-tight">FocusLens</span>
              <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                v2.0 React + 3D
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block -mt-0.5">On-Device Cognitive Telemetry</span>
          </div>
        </div>

        {/* Live Status Pill */}
        <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300 font-medium">
          <span className={`w-2 h-2 rounded-full ${getStatusColor()} shadow-sm animate-pulse`} />
          <span>{getStatusText()}</span>
        </div>
      </div>

      {/* Action Toolbar */}
      <nav className="flex items-center gap-2">
        {/* View Mode Switcher */}
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
          <button
            onClick={() => setViewMode('studio')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
              viewMode === 'studio' ? 'bg-slate-800 text-slate-100 shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Studio
          </button>
          <button
            onClick={() => setViewMode('lens')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
              viewMode === 'lens' ? 'bg-slate-800 text-slate-100 shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Lens
          </button>
        </div>

        {/* HUD Mesh Toggle */}
        <button
          onClick={toggleHud}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
            hudEnabled
              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
          title="Toggle AI Face & Iris HUD overlay"
        >
          <Eye className="w-3.5 h-3.5" />
          <span className="hidden md:inline">AI HUD</span>
        </button>

        {/* Sound FX Toggle */}
        <button
          onClick={toggleSoundFx}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
            soundFxEnabled
              ? 'bg-slate-800 border-slate-700 text-slate-200'
              : 'bg-slate-900 border-slate-800 text-slate-500'
          }`}
          title="Toggle notification chimes"
        >
          {soundFxEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5" />}
          <span className="hidden md:inline">Sound</span>
        </button>

        {/* Recenter Button */}
        <button
          onClick={onCalibrate}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          title="Recenter head orientation baseline"
        >
          <Compass className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Recenter</span>
        </button>

        {/* Privacy Modal Button */}
        <button
          onClick={onOpenPrivacy}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          title="View 100% on-device privacy guarantee"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden md:inline">Privacy</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          title="Toggle Dark/Light Mode"
        >
          {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </button>

        {/* GitHub Link */}
        <a
          href="https://github.com/Ak-arsha/focuslens"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 border border-slate-800 text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
          title="Star on GitHub"
        >
          <Github className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">GitHub</span>
        </a>
      </nav>
    </header>
  );
};
