import React from 'react';
import { VolumeX, Activity, CloudRain, Waves, Wind, Music, Bell } from 'lucide-react';
import { playChime } from '../utils/audio';

export const AmbientSoundDeck = ({
  ambientMode,
  setAmbientMode,
  volume,
  setVolume,
}) => {
  const cards = [
    {
      mode: 'off',
      label: 'Mute / Silent',
      sub: 'Audio disabled',
      icon: <VolumeX className="w-4 h-4" />
    },
    {
      mode: 'binaural',
      label: '40Hz Binaural Flow',
      sub: 'Gamma wave focus',
      icon: <Activity className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
    },
    {
      mode: 'brown',
      label: 'Deep Brown Noise',
      sub: 'Acoustic masking',
      icon: <Waves className="w-4 h-4 text-amber-500 dark:text-amber-400" />
    },
    {
      mode: 'rain',
      label: 'Calm Forest Rain',
      sub: 'Natural pink noise',
      icon: <CloudRain className="w-4 h-4 text-blue-500 dark:text-blue-400" />
    },
    {
      mode: 'ocean',
      label: 'Ocean Surf & Tide',
      sub: 'Rhythmic breath pace',
      icon: <Wind className="w-4 h-4 text-teal-500 dark:text-teal-400" />
    },
    {
      mode: 'drone',
      label: 'Cosmic Drone 432Hz',
      sub: 'Meditative harmonics',
      icon: <Music className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
    },
    {
      mode: 'white',
      label: 'Clean White Noise',
      sub: 'Office chatter isolation',
      icon: <Waves className="w-4 h-4 text-slate-500 dark:text-slate-400" />
    }
  ];

  return (
    <div className="theme-panel w-full flex flex-col gap-3.5 p-4 rounded-xl shadow-sm">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider theme-text-heading">
            Ambient Focus Soundscapes
          </h3>
          <span className="text-[11px] theme-text-muted hidden sm:inline">- 100% Procedural Web Audio API</span>
        </div>

        <div className="flex items-center gap-4">
          {/* Quick Sound Chimes Preview */}
          <div className="hidden md:flex items-center gap-1.5 text-[11px] theme-text-muted">
            <Bell className="w-3.5 h-3.5" />
            <span>Audition Cues:</span>
            <button
              onClick={() => playChime('start')}
              className="px-1.5 py-0.5 rounded text-[10px] theme-btn-secondary"
              title="Test Start Chime"
            >
              Start
            </button>
            <button
              onClick={() => playChime('zen')}
              className="px-1.5 py-0.5 rounded text-[10px] theme-btn-secondary"
              title="Test Break Chime"
            >
              Break
            </button>
            <button
              onClick={() => playChime('warn')}
              className="px-1.5 py-0.5 rounded text-[10px] theme-btn-secondary"
              title="Test Attention Warning"
            >
              Drift
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs theme-text-muted">
            <span>Volume</span>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={e => setVolume(+e.target.value)}
              className="w-24 accent-emerald-500 cursor-pointer"
            />
            <span className="font-mono theme-text-heading w-8 text-right">{volume}%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
        {cards.map(c => (
          <button
            key={c.mode}
            onClick={() => {
              setAmbientMode(c.mode);
              playChime('click');
            }}
            className={`flex flex-col gap-1.5 p-2.5 rounded-lg border text-left transition-all ${
              ambientMode === c.mode
                ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-600 dark:text-emerald-300 shadow-sm'
                : 'theme-inset theme-text-muted hover:theme-text-heading hover:bg-slate-200/50 dark:hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <div className={`p-1.5 rounded-md ${ambientMode === c.mode ? 'bg-emerald-500/25' : 'bg-slate-200 dark:bg-slate-800'}`}>
                {c.icon}
              </div>
              {ambientMode === c.mode && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold leading-tight theme-text-heading line-clamp-1">{c.label}</span>
              <span className="text-[10px] theme-text-faint line-clamp-1">{c.sub}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
