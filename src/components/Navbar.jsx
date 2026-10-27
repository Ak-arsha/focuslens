import React from 'react';
import { Eye, Volume2, VolumeX, Compass, ShieldCheck, Sun, Moon, Github, Keyboard, Info } from 'lucide-react';

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
  onOpenShortcuts,
  onOpenAbout,
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
      default: return 'bg-slate-400 dark:bg-slate-500';
    }
  };

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-4 sm:px-6 py-2.5 theme-panel border-b shadow-sm">
      {/* Brand & Live Status */}
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-2.5">
          <div className="relative w-8 h-8 flex items-center justify-center">
            <svg viewBox="0 0 32 32" className="w-full h-full">
              <circle cx="16" cy="16" r="14" fill="none" stroke="#10B981" strokeWidth="2.5" />
              <circle cx="16" cy="16" r="8" fill="#10B981" opacity="0.25" />
              <circle cx="16" cy="16" r="3.5" fill="#10B981" />
            </svg>
            <span className="absolute inset-0 rounded-full border border-emerald-500/30 animate-ping opacity-30" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold text-lg theme-text-heading tracking-tight">FocusLens</span>
              <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
                v2.0
              </span>
            </div>
            <span className="text-[11px] theme-text-muted block -mt-0.5 hidden xs:block">On-Device Cognitive Telemetry</span>
          </div>
        </div>

        {/* Live Status Pill */}
        <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full theme-inset text-xs font-medium theme-text-body">
          <span className={`w-2 h-2 rounded-full ${getStatusColor()} shadow-sm animate-pulse`} />
          <span>{getStatusText()}</span>
        </div>
      </div>

      {/* Action Toolbar */}
      <nav className="flex items-center gap-1.5 sm:gap-2">
        {/* Clarity / About Button */}
        <button
          onClick={onOpenAbout}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg theme-btn-secondary"
          title="What is FocusLens? Read architecture &amp; purpose"
        >
          <Info className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
          <span className="hidden md:inline">About</span>
        </button>

        {/* View Mode Switcher */}
        <div className="flex items-center theme-inset rounded-lg p-0.5">
          <button
            onClick={() => setViewMode('studio')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
              viewMode === 'studio' ? 'bg-white dark:bg-slate-800 theme-text-heading shadow-sm' : 'theme-text-muted hover:theme-text-heading'
            }`}
          >
            Studio
          </button>
          <button
            onClick={() => setViewMode('lens')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
              viewMode === 'lens' ? 'bg-white dark:bg-slate-800 theme-text-heading shadow-sm' : 'theme-text-muted hover:theme-text-heading'
            }`}
          >
            Lens
          </button>
        </div>

        {/* HUD Mesh Toggle */}
        <button
          onClick={toggleHud}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
            hudEnabled
              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
              : 'theme-btn-secondary'
          }`}
          title="Toggle AI Face &amp; Posture HUD overlay (Press H)"
        >
          <Eye className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">AI HUD</span>
        </button>

        {/* Sound FX Toggle */}
        <button
          onClick={toggleSoundFx}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
            soundFxEnabled
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              : 'theme-btn-secondary opacity-60'
          }`}
          title="Toggle auditory alerts &amp; focus cues (Press M)"
        >
          {soundFxEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          <span className="hidden lg:inline">Sound</span>
        </button>

        {/* Recenter Button */}
        <button
          onClick={onCalibrate}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg theme-btn-secondary"
          title="Recenter neutral head orientation baseline (Press R)"
        >
          <Compass className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
          <span className="hidden sm:inline">Recenter</span>
        </button>

        {/* Keyboard Shortcuts Button */}
        <button
          onClick={onOpenShortcuts}
          className="p-2 rounded-lg theme-btn-secondary"
          title="View Keyboard Shortcuts (Press ? or K)"
        >
          <Keyboard className="w-3.5 h-3.5" />
        </button>

        {/* Theme Toggle (Light / Dark) */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg theme-btn-secondary"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode (Press T)`}
        >
          {theme === 'dark' ? (
            <Sun className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-slate-700" />
          )}
        </button>

        {/* Privacy Modal Button */}
        <button
          onClick={onOpenPrivacy}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg theme-btn-secondary"
          title="View 100% on-device privacy guarantee"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
          <span className="hidden xl:inline">Privacy</span>
        </button>

        {/* GitHub Link */}
        <a
          href="https://github.com/Ak-arsha/focuslens"
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-lg theme-btn-secondary"
          title="View repository on GitHub"
        >
          <Github className="w-3.5 h-3.5" />
        </a>
      </nav>
    </header>
  );
};
