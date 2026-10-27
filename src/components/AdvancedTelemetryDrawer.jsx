import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Activity, Smile, Crosshair, Compass } from 'lucide-react';

export const AdvancedTelemetryDrawer = ({ biometrics, onRecenter }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { gazeDirection, sentiment, pose, alignment } = biometrics;

  const gazeDirections = [
    'Top-Left', 'Up', 'Top-Right',
    'Left', 'Center', 'Right',
    'Bottom-Left', 'Down', 'Bottom-Right'
  ];

  return (
    <div className="w-full linear-panel rounded-2xl border border-white/5 overflow-hidden transition-all duration-200">
      {/* Drawer Header & Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between linear-btn-ghost text-xs font-semibold select-none"
      >
        <div className="flex items-center gap-2.5">
          <Activity className="w-4 h-4 text-emerald-500" />
          <span className="linear-text-heading font-display">Advanced Telemetry &amp; Affect Metrics</span>
          <span className="px-2 py-0.5 rounded text-[9px] font-mono uppercase bg-white/5 text-slate-400">
            {isOpen ? 'Expanded' : 'Collapsed'}
          </span>
        </div>

        <div className="flex items-center gap-2 linear-text-muted">
          <span className="text-[11px] hidden sm:inline">
            {isOpen ? 'Hide deep telemetry' : 'View gaze matrix, sentiment & Euler angles'}
          </span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Collapsible Content */}
      {isOpen && (
        <div className="p-4 pt-0 border-t border-white/5 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs animate-in fade-in duration-150">
          {/* 1. Facial Sentiment & Affect */}
          <div className="linear-inset p-3.5 rounded-xl flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-semibold linear-text-heading">
                <Smile className="w-4 h-4 text-cyan-400" />
                <span>Facial Sentiment</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                {sentiment?.label || 'Calm Flow'}
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-baseline text-xs">
                <span className="text-[11px] linear-text-muted">Emotional Valence</span>
                <span className="font-mono text-xs font-semibold linear-text-heading">
                  {sentiment ? (sentiment.valence >= 0 ? `+${sentiment.valence}%` : `${sentiment.valence}%`) : '0%'}
                </span>
              </div>

              {/* Valence indicator bar */}
              <div className="relative w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="absolute top-0 bottom-0 transition-all duration-200 rounded-full"
                  style={{
                    left: '50%',
                    width: `${Math.min(50, Math.abs(sentiment?.valence || 0) / 2)}%`,
                    transform: (sentiment?.valence || 0) < 0 ? 'scaleX(-1)' : 'none',
                    transformOrigin: 'left',
                    backgroundColor: (sentiment?.valence || 0) >= 0 ? '#10B981' : '#F43F5E'
                  }}
                />
                <span className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-600" />
              </div>

              <div className="flex justify-between text-[9px] linear-text-faint">
                <span>Cognitive Tension</span>
                <span>Neutral Flow</span>
                <span>Positive Ease</span>
              </div>
            </div>

            <p className="text-[10px] linear-text-muted line-clamp-2 leading-relaxed">
              {sentiment?.description || 'Real-time blendshape affective state inference.'}
            </p>
          </div>

          {/* 2. Gaze Vector Matrix */}
          <div className="linear-inset p-3.5 rounded-xl flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-semibold linear-text-heading">
                <Crosshair className="w-4 h-4 text-emerald-400" />
                <span>3x3 Gaze Vector</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {gazeDirection}
              </span>
            </div>

            {/* 3x3 Quadrant Grid */}
            <div className="grid grid-cols-3 gap-1 w-full h-14 bg-black/30 p-1.5 rounded-lg">
              {gazeDirections.map((dir) => (
                <div
                  key={dir}
                  className={`rounded transition-colors flex items-center justify-center ${
                    gazeDirection === dir
                      ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50'
                      : dir === 'Center'
                      ? 'bg-slate-800/80 border border-dashed border-slate-700'
                      : 'bg-slate-900/60'
                  }`}
                />
              ))}
            </div>

            <p className="text-[10px] linear-text-muted leading-relaxed">
              Quantifies on-screen center fixation versus off-axis screen diversion.
            </p>
          </div>

          {/* 3. 3D Euler Orientation Gauges */}
          <div className="linear-inset p-3.5 rounded-xl flex flex-col justify-between gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-semibold linear-text-heading">
                <Compass className="w-4 h-4 text-cyan-400" />
                <span>Euler Angles (&deg;)</span>
              </div>
              <button
                onClick={onRecenter}
                className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                title="Recenter Baseline"
              >
                Recenter
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {[
                { label: 'Yaw', val: pose.yaw, safe: 14 },
                { label: 'Pitch', val: pose.pitch, safe: 12 },
                { label: 'Roll', val: pose.roll, safe: 10 },
              ].map((axis) => {
                const isSafe = Math.abs(axis.val) <= axis.safe;
                return (
                  <div key={axis.label} className="grid grid-cols-[45px_1fr_40px] items-center gap-2 text-xs">
                    <span className="linear-text-muted text-[11px]">{axis.label}</span>
                    <div className="relative h-1.5 bg-slate-800 rounded-full">
                      <span
                        className="absolute top-0 bottom-0 bg-emerald-500/20 rounded-full"
                        style={{
                          left: `${50 - (axis.safe / 40) * 50}%`,
                          width: `${(axis.safe / 40) * 100}%`
                        }}
                      />
                      <span
                        className={`absolute top-[-3px] w-3 h-3 -ml-1.5 rounded-full shadow transition-all duration-75 ${
                          isSafe ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                        style={{ left: `${50 + Math.max(-1, Math.min(1, axis.val / 40)) * 50}%` }}
                      />
                    </div>
                    <span className={`font-mono text-right text-xs ${isSafe ? 'linear-text-heading' : 'text-amber-400'}`}>
                      {axis.val}&deg;
                    </span>
                  </div>
                );
              })}
            </div>

            <p className="text-[10px] linear-text-muted">
              Green bounds represent ergonomic tolerance (&plusmn;14&deg; turn, &plusmn;12&deg; tilt).
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
