import React from 'react';
import { X, Keyboard } from 'lucide-react';

export const KeyboardShortcutsModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Space', desc: 'Start or Pause active camera tracking' },
    { key: 'R', desc: 'Recenter neutral head pose and posture baseline' },
    { key: 'B', desc: 'Take an instant 4-7-8 box breathing recovery break' },
    { key: 'E', desc: 'End session and view complete telemetry summary' },
    { key: 'M', desc: 'Toggle auditory focus alerts and notification chimes' },
    { key: 'H', desc: 'Toggle AI landmark mesh & posture alignment overlay' },
    { key: 'T', desc: 'Toggle Dark Mode and Light Mode theme' },
    { key: '?', desc: 'Open this keyboard shortcuts quick reference guide' },
    { key: 'Esc', desc: 'Dismiss active dialog or close modal' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md p-6 theme-panel rounded-2xl shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-emerald-500" />
            <h3 className="font-display text-base font-bold theme-text-heading">
              Keyboard Shortcuts
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg theme-text-muted hover:theme-text-heading theme-btn-secondary"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col divide-y divide-slate-200 dark:divide-slate-800/80 text-xs">
          {shortcuts.map((s) => (
            <div key={s.key} className="flex items-center justify-between py-2.5">
              <span className="theme-text-body">{s.desc}</span>
              <kbd className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-xs font-semibold theme-text-heading shadow-sm">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
