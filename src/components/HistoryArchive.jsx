import React from 'react';
import { Trash2 } from 'lucide-react';

export const HistoryArchive = ({
  history,
  onClearHistory,
}) => {
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

  return (
    <div className="theme-panel w-full flex flex-col gap-3 p-5 rounded-xl shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider theme-text-faint block">
            Local Data Archive
          </span>
          <h2 className="font-display text-base font-bold theme-text-heading">Past Focus Sessions</h2>
        </div>

        <button
          onClick={onClearHistory}
          disabled={!history.length}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg theme-btn-secondary disabled:opacity-40 text-xs font-semibold transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear History</span>
        </button>
      </div>

      <div className="w-full overflow-x-auto">
        <ul className="flex flex-col divide-y divide-slate-200 dark:divide-slate-800/80">
          {!history.length ? (
            <li className="py-8 text-center text-xs theme-text-muted">
              No recorded sessions yet. Completed sessions over 10 seconds are securely saved here on this device.
            </li>
          ) : (
            history.slice(0, 10).map((item) => {
              const d = new Date(item.date);
              const dateStr =
                d.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
                ' ' +
                d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const grade =
                item.avgScore >= 85 ? 'Grade S' : item.avgScore >= 70 ? 'Grade A' : 'Grade B';

              return (
                <li
                  key={item.id}
                  className="grid grid-cols-2 sm:grid-cols-5 items-center gap-4 py-3 px-2 text-xs theme-text-body hover:bg-slate-200/50 dark:hover:bg-slate-800/40 rounded transition-colors"
                >
                  <span className="font-medium theme-text-heading">{dateStr}</span>
                  <span className="font-mono theme-text-muted">{formatTime(item.duration)}</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">{item.flowPct}% flow</span>
                  <span className="font-mono font-bold theme-text-heading">Score: {item.avgScore}</span>
                  <span className="text-right">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      {grade}
                    </span>
                  </span>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </div>
  );
};
