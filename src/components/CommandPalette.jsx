import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Camera,
  Compass,
  Coffee,
  Square,
  Volume2,
  VolumeX,
  Eye,
  Sun,
  Moon,
  Download,
  FileJson,
  Share2,
  ShieldCheck,
  Info,
  X
} from 'lucide-react';

export const CommandPalette = ({
  isOpen,
  onClose,
  isTracking,
  onStartTracking,
  onToggleTracking,
  onRecenter,
  onTakeBreak,
  onEndSession,
  soundFxEnabled,
  onToggleSound,
  hudEnabled,
  onToggleHud,
  theme,
  onToggleTheme,
  onExportCsv,
  onExportJson,
  onOpenShareCard,
  onOpenPrivacy,
  onOpenAbout
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const commands = [
    {
      id: 'camera',
      icon: Camera,
      title: isTracking ? 'Pause Camera Tracking' : 'Start Camera Session',
      shortcut: 'Space',
      action: () => {
        if (!isTracking) onStartTracking();
        else onToggleTracking();
        onClose();
      }
    },
    {
      id: 'recenter',
      icon: Compass,
      title: 'Recenter Posture Baseline',
      shortcut: 'R',
      action: () => {
        onRecenter();
        onClose();
      }
    },
    {
      id: 'break',
      icon: Coffee,
      title: 'Take Restorative 4-7-8 Break',
      shortcut: 'B',
      action: () => {
        onTakeBreak();
        onClose();
      }
    },
    {
      id: 'end',
      icon: Square,
      title: 'End Session & View Summary',
      shortcut: 'E',
      action: () => {
        onEndSession();
        onClose();
      }
    },
    {
      id: 'hud',
      icon: Eye,
      title: hudEnabled ? 'Hide AI Posture HUD' : 'Show AI Posture HUD',
      shortcut: 'H',
      action: () => {
        onToggleHud();
        onClose();
      }
    },
    {
      id: 'sound',
      icon: soundFxEnabled ? VolumeX : Volume2,
      title: soundFxEnabled ? 'Mute Focus Sound FX' : 'Enable Focus Sound FX',
      shortcut: 'M',
      action: () => {
        onToggleSound();
        onClose();
      }
    },
    {
      id: 'theme',
      icon: theme === 'dark' ? Sun : Moon,
      title: `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`,
      shortcut: 'T',
      action: () => {
        onToggleTheme();
        onClose();
      }
    },
    {
      id: 'csv',
      icon: Download,
      title: 'Export Telemetry to CSV',
      shortcut: 'CSV',
      action: () => {
        onExportCsv();
        onClose();
      }
    },
    {
      id: 'json',
      icon: FileJson,
      title: 'Export Session to JSON',
      shortcut: 'JSON',
      action: () => {
        onExportJson();
        onClose();
      }
    },
    {
      id: 'share',
      icon: Share2,
      title: 'Generate Share Card',
      shortcut: 'Share',
      action: () => {
        onOpenShareCard();
        onClose();
      }
    },
    {
      id: 'privacy',
      icon: ShieldCheck,
      title: '100% On-Device Privacy Architecture',
      shortcut: 'Info',
      action: () => {
        onOpenPrivacy();
        onClose();
      }
    },
    {
      id: 'about',
      icon: Info,
      title: 'How FocusLens Works',
      shortcut: 'Docs',
      action: () => {
        onOpenAbout();
        onClose();
      }
    }
  ];

  const filtered = commands.filter((c) =>
    c.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 p-4 bg-black/75 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg linear-panel rounded-2xl shadow-2xl overflow-hidden border border-white/10 flex flex-col animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Raycast Search Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/5 dark:border-white/5">
          <Search className="w-4 h-4 linear-text-muted shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or action..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm linear-text-heading placeholder:linear-text-muted outline-none"
          />
          <kbd className="px-1.5 py-0.5 rounded bg-black/20 dark:bg-white/10 text-[10px] font-mono linear-text-muted">
            Esc
          </kbd>
        </div>

        {/* Action List */}
        <div className="max-h-80 overflow-y-auto p-2 flex flex-col gap-0.5 text-xs">
          {!filtered.length ? (
            <div className="py-8 text-center linear-text-muted">No commands match "{query}"</div>
          ) : (
            filtered.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={item.action}
                  className="flex items-center justify-between px-3 py-2 rounded-lg linear-btn-ghost text-left transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-emerald-500" />
                    <span className="font-medium linear-text-heading">{item.title}</span>
                  </div>
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-[10px] font-semibold linear-text-heading">
                    {item.shortcut}
                  </kbd>
                </button>
              );
            })
          )}
        </div>

        {/* Footer Navigation Hints */}
        <div className="px-4 py-2 border-t border-white/5 dark:border-white/5 flex items-center justify-between text-[11px] linear-text-faint">
          <span>FocusLens Raycast Action Palette</span>
          <span>Press Enter to select</span>
        </div>
      </div>
    </div>
  );
};
