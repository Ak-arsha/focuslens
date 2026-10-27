import React from 'react';
import { Camera, ShieldCheck } from 'lucide-react';

export const CameraStage = ({
  videoRef,
  hudCanvasRef,
  state,
  viewMode,
  isTracking,
  onStartTracking,
  fps,
  isFaceTracked,
  score,
}) => {
  const scorePercent = Math.max(0, Math.min(100, score));
  // Circle radius 130 -> Circumference 2 * PI * 130 = 816.8
  const dashOffset = 816.8 * (1 - scorePercent / 100);

  const getRingColor = () => {
    switch (state) {
      case 'focused': return '#10B981';
      case 'distracted': return '#F59E0B';
      case 'drowsy': return '#F43F5E';
      default: return '#64748B';
    }
  };

  return (
    <div className="relative w-full flex flex-col items-center justify-center">
      {/* Viewport Frame */}
      <div
        className={`relative w-full overflow-hidden bg-slate-950 border border-slate-800 transition-all duration-500 shadow-2xl flex items-center justify-center ${
          viewMode === 'lens'
            ? 'max-w-[340px] aspect-square rounded-full p-4 ring-4 ring-slate-900/80 shadow-emerald-950/20'
            : 'aspect-[16/10] rounded-2xl'
        }`}
      >
        {/* Video Element */}
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className={`w-full h-full object-cover -scale-x-100 ${viewMode === 'lens' ? 'rounded-full' : ''}`}
        />

        {/* HUD Canvas Overlay */}
        <canvas
          ref={hudCanvasRef}
          className={`absolute inset-0 w-full h-full pointer-events-none z-10 -scale-x-100 ${
            viewMode === 'lens' ? 'rounded-full p-4' : ''
          }`}
        />

        {/* Circular Progress Ring (Visible in Lens View) */}
        {viewMode === 'lens' && (
          <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none z-20" viewBox="0 0 280 280">
            <circle cx="140" cy="140" r="130" fill="none" stroke="#1E293B" strokeWidth="4" />
            <circle
              cx="140"
              cy="140"
              r="130"
              fill="none"
              stroke={getRingColor()}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray="816.8"
              strokeDashoffset={dashOffset}
              className="transition-all duration-300"
              style={{ filter: `drop-shadow(0 0 6px ${getRingColor()}88)` }}
            />
          </svg>
        )}

        {/* Sci-Fi Corner Reticles for Studio View */}
        {viewMode === 'studio' && (
          <>
            <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-emerald-500/70 pointer-events-none z-20" />
            <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-emerald-500/70 pointer-events-none z-20" />
            <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-emerald-500/70 pointer-events-none z-20" />
            <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-emerald-500/70 pointer-events-none z-20" />
          </>
        )}

        {/* Camera Idle Welcome Overlay */}
        {!isTracking && (
          <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center gap-3.5 z-30">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-lg text-slate-100">Private Focus Telemetry</h3>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Real-time eye dynamics, blink monitoring, and 3D head pose orientation. 100% on-device via MediaPipe WebAssembly.
            </p>
            <button
              onClick={onStartTracking}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs tracking-wide rounded-lg shadow-lg shadow-emerald-500/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Camera className="w-4 h-4" />
              <span>Start Camera Session</span>
            </button>
            <span className="text-[11px] text-slate-500">
              Tip: Position your webcam 50-70cm away in comfortable lighting.
            </span>
          </div>
        )}

        {/* Live FPS & Face Tracking Badges */}
        <div
          className={`absolute flex gap-1.5 z-20 pointer-events-none ${
            viewMode === 'lens' ? 'bottom-2 left-1/2 -translate-x-1/2' : 'top-3 right-3'
          }`}
        >
          <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-mono font-semibold text-slate-300">
            {fps} FPS
          </span>
          <span
            className={`px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-mono font-semibold ${
              isFaceTracked ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            {isFaceTracked ? 'Tracked' : 'Standby'}
          </span>
        </div>
      </div>
    </div>
  );
};
