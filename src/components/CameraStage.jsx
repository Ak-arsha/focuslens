import React from 'react';
import { Camera, ShieldCheck, CheckCircle2, AlertTriangle, Eye } from 'lucide-react';

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
  alignment = { isAligned: false, status: 'Standby', cue: 'Position head in center' }
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
        className={`relative w-full overflow-hidden bg-slate-950 border border-slate-700/80 dark:border-slate-800 transition-all duration-500 shadow-2xl flex items-center justify-center ${
          viewMode === 'lens'
            ? 'max-w-[340px] aspect-square rounded-full p-4 ring-4 ring-slate-800/80 shadow-emerald-950/20'
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

        {/* Clear Ergonomic Posture Alignment Guide Lines (Studio View) */}
        {viewMode === 'studio' && isTracking && (
          <div className="absolute inset-0 pointer-events-none z-15 flex items-center justify-center">
            {/* Center Vertical Plumb Axis Guideline */}
            <div
              className={`absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0.5 transition-colors duration-200 ${
                alignment.isAligned ? 'bg-emerald-500/40 shadow-sm shadow-emerald-500/50' : 'bg-amber-400/40 border-dashed'
              }`}
            />

            {/* Horizontal Eye-Horizon Level Guideline */}
            <div
              className={`absolute left-0 right-0 top-[40%] -translate-y-1/2 h-0.5 transition-colors duration-200 ${
                alignment.isAligned ? 'bg-emerald-500/40 shadow-sm shadow-emerald-500/50' : 'bg-amber-400/40 border-dashed'
              }`}
            />

            {/* Center Posture Bounding Target Oval */}
            <div
              className={`w-44 h-56 rounded-[50%] border-2 transition-all duration-300 pointer-events-none flex items-center justify-center ${
                alignment.isAligned
                  ? 'border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                  : 'border-amber-400/70 border-dashed shadow-[0_0_15px_rgba(245,158,11,0.2)]'
              }`}
            >
              {/* Center Crosshair Tick */}
              <div className="relative w-6 h-6">
                <span className="absolute top-1/2 inset-x-0 h-0.5 bg-white/70" />
                <span className="absolute left-1/2 inset-y-0 w-0.5 bg-white/70" />
              </div>
            </div>

            {/* Alignment Guideline Labels */}
            <span className="absolute top-[41%] left-4 text-[9px] font-mono uppercase tracking-widest text-slate-400/80 bg-black/60 px-1.5 py-0.5 rounded">
              Eye Horizon Level
            </span>
            <span className="absolute bottom-12 left-1/2 -translate-x-1/2 text-[9px] font-mono uppercase tracking-widest text-slate-400/80 bg-black/60 px-2 py-0.5 rounded">
              Vertical Plumb Axis
            </span>
          </div>
        )}

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

        {/* Real-Time Posture Alignment Pill Overlay */}
        {isTracking && (
          <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold backdrop-blur-md border shadow-lg transition-all ${
                alignment.isAligned
                  ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                  : 'bg-amber-950/80 border-amber-500/50 text-amber-300 animate-pulse'
              }`}
            >
              {alignment.isAligned ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span>{alignment.status}</span>
              <span className="text-[10px] opacity-75 hidden sm:inline">- {alignment.cue}</span>
            </div>
          </div>
        )}

        {/* Camera Idle Welcome Overlay */}
        {!isTracking && (
          <div className="absolute inset-0 bg-slate-950/95 dark:bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center gap-3.5 z-30">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-lg text-slate-100">Private Focus &amp; Posture Telemetry</h3>
            <p className="text-xs text-slate-300 max-w-sm leading-relaxed">
              Real-time eye dynamics, blink monitoring, sentiment affect, and 3D head pose orientation. 100% on-device via MediaPipe WebAssembly.
            </p>
            <button
              onClick={onStartTracking}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs tracking-wide rounded-lg shadow-lg shadow-emerald-500/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Camera className="w-4 h-4" />
              <span>Start Camera Session</span>
              <kbd className="ml-1.5 px-1.5 py-0.5 rounded bg-emerald-600/40 text-[10px] font-mono">Space</kbd>
            </button>
            <span className="text-[11px] text-slate-400">
              Tip: Position your webcam 50-70cm away in comfortable lighting. Look straight ahead to calibrate.
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
            {isFaceTracked ? 'Face Tracked' : 'Standby'}
          </span>
        </div>
      </div>
    </div>
  );
};
