import React from 'react';
import {
  Video,
  Activity,
  Music,
  BarChart3,
  Archive,
  Compass,
  Volume2,
  VolumeX,
  Keyboard,
  Sun,
  Moon,
  ShieldCheck,
  Github,
  Command,
  Eye
} from 'lucide-react';

export const Sidebar = ({
  activeTab,
  setActiveTab,
  isTracking,
  state,
  fps,
  soundFxEnabled,
  toggleSoundFx,
  theme,
  toggleTheme,
  onCalibrate,
  onOpenPrivacy,
  onOpenShortcuts,
  onOpenCommandPalette
}) => {
  const navItems = [
    { id: 'studio', label: 'Live Studio', icon: Video, badge: isTracking ? `${fps} FPS` : null },
    { id: 'biometrics', label: 'Biometrics & Affect', icon: Activity },
    { id: 'soundscapes', label: 'Ambient Audio', icon: Music },
    { id: 'timeline', label: 'Telemetry Analytics', icon: BarChart3 },
    { id: 'archive', label: 'Session Archive', icon: Archive },
  ];

  const getStatusColor = () => {
    switch (state) {
      case 'focused': return 'bg-emerald-500 shadow-emerald-500/50';
      case 'distracted': return 'bg-amber-500 shadow-amber-500/50';
      case 'drowsy': return 'bg-rose-500 shadow-rose-500/50';
      default: return 'bg-slate-400 dark:bg-slate-600';
    }
  };

  const getStatusLabel = () => {
    switch (state) {
      case 'focused': return 'Flow State';
      case 'distracted': return 'Attention Drifting';
      case 'drowsy': return 'Fatigue Alert';
      default: return 'Telemetry Idle';
    }
  };

  return (
    <aside className="w-64 shrink-0 flex flex-col justify-between border-r border-white/5 dark:border-white/5 bg-[var(--bg-sidebar)] p-3 text-xs select-none">
      {/* Brand & Workspace Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between px-2 py-1.5">
          <div className="flex items-center gap-2.5">
            <div className="relative w-7 h-7 flex items-center justify-center">
              <svg viewBox="0 0 32 32" className="w-full h-full">
                <circle cx="16" cy="16" r="14" fill="none" stroke="#10B981" strokeWidth="2.5" />
                <circle cx="16" cy="16" r="8" fill="#10B981" opacity="0.25" />
                <circle cx="16" cy="16" r="3.5" fill="#10B981" />
              </svg>
              {isTracking && (
                <span className="absolute inset-0 rounded-full border border-emerald-500/40 animate-ping opacity-35" />
              )}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-display font-bold text-sm tracking-tight linear-text-heading">FocusLens</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono uppercase font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  v2.0
                </span>
              </div>
              <span className="text-[10px] linear-text-muted leading-tight">Biometric Telemetry</span>
            </div>
          </div>
        </div>

        {/* Live Session Status Indicator */}
        <div className="linear-inset px-3 py-2 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${getStatusColor()} ${isTracking ? 'animate-pulse' : ''}`} />
            <span className="font-medium text-[11px] linear-text-body">{getStatusLabel()}</span>
          </div>
          {isTracking && (
            <span className="text-[10px] font-mono text-emerald-500 font-semibold">{fps} FPS</span>
          )}
        </div>

        {/* Quick Raycast Command Launcher Search Bar */}
        <button
          onClick={onOpenCommandPalette}
          className="linear-inset px-2.5 py-1.5 rounded-lg flex items-center justify-between text-[11px] linear-text-muted hover:linear-text-heading transition-colors"
        >
          <div className="flex items-center gap-2">
            <Command className="w-3.5 h-3.5" />
            <span>Search commands...</span>
          </div>
          <kbd className="px-1.5 py-0.5 rounded bg-black/20 dark:bg-white/10 text-[9px] font-mono">Cmd K</kbd>
        </button>

        {/* Linear Sidebar Navigation Items */}
        <nav className="flex flex-col gap-0.5">
          <span className="px-2 pb-1 text-[10px] font-mono uppercase tracking-wider linear-text-faint font-semibold">
            WORKSPACE
          </span>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'linear-active-tab font-semibold'
                    : 'linear-btn-ghost'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-500' : 'linear-text-muted'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-500 text-[9px] font-mono font-semibold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer Controls */}
      <div className="flex flex-col gap-2 pt-3 border-t border-white/5 dark:border-white/5">
        <span className="px-2 text-[10px] font-mono uppercase tracking-wider linear-text-faint font-semibold">
          SYSTEM CONTROLS
        </span>

        <div className="grid grid-cols-2 gap-1.5">
          {/* Recenter Baseline Button */}
          <button
            onClick={onCalibrate}
            className="flex items-center justify-between px-2.5 py-1.5 rounded-lg linear-btn-secondary text-[11px]"
            title="Recenter head orientation baseline (Press R)"
          >
            <div className="flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span>Recenter</span>
            </div>
            <kbd className="text-[9px] font-mono linear-text-faint">R</kbd>
          </button>

          {/* Sound FX Toggle */}
          <button
            onClick={toggleSoundFx}
            className="flex items-center justify-between px-2.5 py-1.5 rounded-lg linear-btn-secondary text-[11px]"
            title="Toggle focus alert chimes (Press M)"
          >
            <div className="flex items-center gap-1.5">
              {soundFxEnabled ? (
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 opacity-60" />
              )}
              <span>Audio</span>
            </div>
            <kbd className="text-[9px] font-mono linear-text-faint">M</kbd>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-between px-2.5 py-1.5 rounded-lg linear-btn-secondary text-[11px]"
            title="Toggle Dark / Light Theme (Press T)"
          >
            <div className="flex items-center gap-1.5">
              {theme === 'dark' ? (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-slate-700" />
              )}
              <span>Theme</span>
            </div>
            <kbd className="text-[9px] font-mono linear-text-faint">T</kbd>
          </button>

          {/* Keyboard Shortcuts Dialog */}
          <button
            onClick={onOpenShortcuts}
            className="flex items-center justify-between px-2.5 py-1.5 rounded-lg linear-btn-secondary text-[11px]"
            title="View keyboard shortcut references (Press ?)"
          >
            <div className="flex items-center gap-1.5">
              <Keyboard className="w-3.5 h-3.5 text-slate-400" />
              <span>Shortcuts</span>
            </div>
            <kbd className="text-[9px] font-mono linear-text-faint">?</kbd>
          </button>
        </div>

        {/* Privacy & GitHub Row */}
        <div className="flex items-center justify-between px-2 pt-1 text-[11px] linear-text-faint">
          <button
            onClick={onOpenPrivacy}
            className="flex items-center gap-1 hover:text-emerald-500 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>100% On-Device</span>
          </button>
          <a
            href="https://github.com/Ak-arsha/focuslens"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-white transition-colors"
          >
            <Github className="w-3.5 h-3.5" />
            <span>GitHub</span>
          </a>
        </div>
      </div>
    </aside>
  );
};
