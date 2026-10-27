import React from 'react';
import { VolumeX, Activity, CloudRain, Waves } from 'lucide-react';

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
      sub: 'Audio off',
      icon: <VolumeX className="w-4 h-4" />
    },
    {
      mode: 'binaural',
      label: '40Hz Binaural Flow',
      sub: 'Gamma wave focus',
      icon: <Activity className="w-4 h-4 text-cyan-400" />
    },
    {
      mode: 'rain',
      label: 'Calm Rain & Stream',
      sub: 'Natural pink noise',
      icon: <CloudRain className="w-4 h-4 text-blue-400" />
    },
    {
      mode: 'brown',
      label: 'Deep Brown Noise',
      sub: 'Acoustic masking',
      icon: <Waves className="w-4 h-4 text-amber-400" />
    }
  ];

  return (
    <div className="w-full flex flex-col gap-3 p-4 bg-slate-900/60 border border-slate-800/80 rounded-xl">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Ambient Focus Soundscapes
          </h3>
          <span className="text-[11px] text-slate-500 hidden sm:inline">- 100% Procedural Web Audio API</span>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Volume</span>
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={e => setVolume(+e.target.value)}
            className="w-24 accent-emerald-500 cursor-pointer"
          />
          <span className="font-mono text-slate-300 w-8">{volume}%</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {cards.map(c => (
          <button
            key={c.mode}
            onClick={() => setAmbientMode(c.mode)}
            className={`flex items-center gap-2.5 p-3 rounded-lg border text-left transition-all ${
              ambientMode === c.mode
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 shadow-sm'
                : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <div className={`p-1.5 rounded-md ${ambientMode === c.mode ? 'bg-emerald-500/20' : 'bg-slate-800'}`}>
              {c.icon}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold leading-tight text-slate-200">{c.label}</span>
              <span className="text-[10px] text-slate-500">{c.sub}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
