import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  Play,
  Square,
  Sparkles,
  Waves,
  CloudRain,
  Radio,
  Wind,
  Disc,
  Info
} from 'lucide-react';
import {
  setAmbientSound,
  updateAmbientVolume,
  getCurrentAmbientMode,
  playChime
} from '../utils/audio';

export const AmbientSoundDeck = ({ soundFxEnabled, onToggleSoundFx }) => {
  const [activeMode, setActiveMode] = useState(getCurrentAmbientMode() || 'off');
  const [volume, setVolume] = useState(55);

  const soundscapes = [
    {
      id: 'binaural',
      name: '40Hz Gamma Binaural',
      category: 'Cognitive Flow',
      icon: Radio,
      freq: '216Hz L / 256Hz R (40Hz delta)',
      desc: 'Stereo-panned frequencies trigger 40Hz cortical synchronization, scientifically linked to high working memory and flow state.',
      bestFor: 'Complex programming, problem solving, logic debugging',
      accent: 'emerald',
    },
    {
      id: 'brown',
      name: 'Deep Brown Noise',
      category: 'Sensory Shield',
      icon: Waves,
      freq: '350Hz low-pass Brownian walk',
      desc: 'Warm, low-frequency acoustic masking that resembles a distant heavy waterfall or airplane cabin. Smooths distracting spikes.',
      bestFor: 'Open offices, noisy environments, deep concentration',
      accent: 'amber',
    },
    {
      id: 'rain',
      name: 'Calm Forest Rain',
      category: 'Biophilic Reset',
      icon: CloudRain,
      freq: 'Filtered pink noise with air bandpass',
      desc: 'Gentle randomized droplet synthesis. Biophilic pink-noise acoustics lower autonomic sympathetic nervous tension.',
      bestFor: 'Writing documentation, creative planning, reducing stress',
      accent: 'cyan',
    },
    {
      id: 'ocean',
      name: 'Ocean Tide & Surf',
      category: 'Rhythmic Respiration',
      icon: Wind,
      freq: '0.08Hz LFO wave swell period (~12s)',
      desc: 'Modulated low-pass filtering simulating natural tidal surf. Gently synchronizes your breath rate to 5-6 cycles per minute.',
      bestFor: 'Long sprints, reading papers, steady paced work',
      accent: 'blue',
    },
    {
      id: 'drone',
      name: '432Hz Cosmic Drone',
      category: 'Harmonic Grounding',
      icon: Disc,
      freq: '432Hz fundamental + 648Hz fifth + 864Hz oct',
      desc: 'Rich multi-oscillator harmonic chord with detuned choral warmth. Relaxes muscular neck tension and promotes calm focus.',
      bestFor: 'Deep research, mental reset, grounding during high stress',
      accent: 'purple',
    },
    {
      id: 'white',
      name: 'Focused White Noise',
      category: 'Acoustic Isolation',
      icon: Sparkles,
      freq: 'Broad-spectrum flat frequency density',
      desc: 'Consistent spectral energy across all human hearing bands. Masks erratic conversational speech and keyboard clatter.',
      bestFor: 'Total isolation, coffee shops, high-speed typing',
      accent: 'slate',
    },
  ];

  const handleSelect = (modeId) => {
    if (activeMode === modeId) {
      setAmbientSound('off');
      setActiveMode('off');
      playChime('click');
    } else {
      setAmbientSound(modeId);
      setActiveMode(modeId);
      updateAmbientVolume(volume);
      playChime('click');
    }
  };

  const handleVolumeChange = (e) => {
    const val = Number(e.target.value);
    setVolume(val);
    updateAmbientVolume(val);
  };

  const testChimes = [
    { type: 'start', label: 'Sprint Start', desc: 'Rising arpeggio (E4 → E5)' },
    { type: 'calibrate', label: 'Recenter Baseline', desc: 'Crisp dual ping (784Hz / 1046Hz)' },
    { type: 'warn', label: 'Drift Warning', desc: 'Soft descending tone (480Hz → 400Hz)' },
    { type: 'alert', label: 'Fatigue Alert', desc: 'Double pulse tone (360Hz)' },
    { type: 'complete', label: 'Sprint Complete', desc: 'Major triad chord (C-E-G-C)' },
  ];

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Header Banner & Master Audio Controls */}
      <div className="linear-panel p-5 rounded-2xl border border-white/5 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-base font-bold linear-text-heading">
                Procedural Ambient Synthesizer
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Native Web Audio
              </span>
            </div>
            <p className="text-xs linear-text-muted">
              Synthesized mathematically in real-time in your browser. Zero MP3 downloads, zero latency, zero bandwidth.
            </p>
          </div>
        </div>

        {/* Master Volume & Global Stop */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-2.5 linear-inset px-3 py-1.5 rounded-xl">
            {volume === 0 ? (
              <VolumeX className="w-4 h-4 linear-text-muted" />
            ) : (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            )}
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={handleVolumeChange}
              className="w-24 sm:w-32 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              title="Ambient Volume"
            />
            <span className="font-mono text-xs font-semibold linear-text-heading min-w-[32px] text-right">
              {volume}%
            </span>
          </div>

          {activeMode !== 'off' && (
            <button
              onClick={() => handleSelect(activeMode)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-semibold transition-all"
            >
              <Square className="w-3.5 h-3.5" />
              <span>Stop Sound</span>
            </button>
          )}
        </div>
      </div>

      {/* 6 Procedural Soundscape Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {soundscapes.map((sound) => {
          const Icon = sound.icon;
          const isPlaying = activeMode === sound.id;

          return (
            <div
              key={sound.id}
              className={`linear-panel p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 cursor-pointer ${
                isPlaying
                  ? 'border-emerald-500/50 bg-emerald-500/[0.04] shadow-lg shadow-emerald-500/10'
                  : 'border-white/5 hover:border-white/10 hover:bg-white/[0.02]'
              }`}
              onClick={() => handleSelect(sound.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isPlaying
                        ? 'bg-emerald-500 text-slate-950 font-bold'
                        : 'bg-white/5 text-slate-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-display text-sm font-bold linear-text-heading">
                      {sound.name}
                    </h3>
                    <span className="text-[10px] linear-text-muted">{sound.category}</span>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect(sound.id);
                  }}
                  className={`p-2 rounded-lg transition-all ${
                    isPlaying
                      ? 'bg-emerald-500 text-slate-950 shadow-md'
                      : 'linear-btn-secondary'
                  }`}
                  title={isPlaying ? 'Pause Soundscape' : 'Play Soundscape'}
                >
                  {isPlaying ? (
                    <Square className="w-3.5 h-3.5 fill-current" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current" />
                  )}
                </button>
              </div>

              {/* Acoustic Explanation */}
              <p className="text-xs linear-text-body leading-relaxed">{sound.desc}</p>

              {/* Frequency Formula & Best For Tag */}
              <div className="flex flex-col gap-1.5 pt-2 border-t border-white/5">
                <div className="flex items-center justify-between text-[10px] font-mono linear-text-muted">
                  <span>Frequency:</span>
                  <span className="linear-text-heading">{sound.freq}</span>
                </div>
                <div className="text-[10px] linear-text-faint">
                  <span className="linear-text-muted font-medium">Best for: </span>
                  {sound.bestFor}
                </div>
              </div>

              {/* Animated Waveform Visualizer when active */}
              {isPlaying && (
                <div className="flex items-center justify-center gap-1 h-3 pt-1">
                  {[40, 80, 50, 100, 60, 90, 70, 45, 85, 65].map((h, i) => (
                    <span
                      key={i}
                      className="w-1 bg-emerald-400 rounded-full animate-pulse"
                      style={{
                        height: `${h}%`,
                        animationDuration: `${0.4 + (i % 4) * 0.2}s`,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Audition & Explanation of Behavioral Audio Cues */}
      <div className="linear-panel p-5 rounded-2xl border border-white/5 shadow-sm flex flex-col gap-3.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-400" />
            <h3 className="font-display text-sm font-bold linear-text-heading">
              Behavioral Auditory Cues Reference
            </h3>
            <span className="text-xs linear-text-muted">
              (Subtle psychoacoustic notifications calibrated for minimal disruption)
            </span>
          </div>

          <button
            onClick={onToggleSoundFx}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg linear-btn-secondary"
          >
            {soundFxEnabled ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Auditory Alerts Enabled</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                <span>Auditory Alerts Muted</span>
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {testChimes.map((chime) => (
            <button
              key={chime.type}
              onClick={() => playChime(chime.type)}
              className="linear-inset p-3 rounded-xl flex flex-col items-start gap-1 hover:border-emerald-500/40 transition-all text-left group"
              title={`Click to preview the ${chime.label} tone`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-bold linear-text-heading group-hover:text-emerald-400 transition-colors">
                  {chime.label}
                </span>
                <Play className="w-3 h-3 text-slate-500 group-hover:text-emerald-400" />
              </div>
              <span className="text-[10px] font-mono linear-text-muted">{chime.desc}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
