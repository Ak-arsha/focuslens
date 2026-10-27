import React, { useState } from 'react';
import { Camera, ShieldCheck, CheckCircle2, AlertTriangle, Eye, Box, Video } from 'lucide-react';
import { ThreeHeadVisualizer } from './ThreeHeadVisualizer';

export const CameraStage = ({
  videoRef,
  hudCanvasRef,
  state,
  isTracking,
  onStartTracking,
  fps,
  isFaceTracked,
  alignment = { isAligned: true, status: 'Standby', cue: 'Position head in center' },
  pose = { yaw: 0, pitch: 0, roll: 0 }
}) => {
  const [showHologram, setShowHologram] = useState(false);

  return (
    <div className="relative w-full flex flex-col items-center justify-center">
      {/* Viewport Frame */}
      <div className="relative w-full overflow-hidden bg-slate-950 border border-white/10 rounded-2xl aspect-[16/10] shadow-2xl flex items-center justify-center">
        {/* If Hologram mode is toggled, show the 3D Head Visualizer */}
        {showHologram ? (
          <div className="w-full h-full p-2">
            <ThreeHeadVisualizer pose={pose} state={state} isFaceTracked={isFaceTracked} />
          </div>
        ) : (
          <>
            {/* Live Video Feed */}
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="w-full h-full object-cover -scale-x-100"
            />

            {/* High-Performance Canvas HUD Overlay */}
            <canvas
              ref={hudCanvasRef}
              className="absolute inset-0 w-full h-full pointer-events-none z-10 -scale-x-100"
            />

            {/* Clear Ergonomic Posture Alignment Guidelines */}
            {isTracking && (
              <div className="absolute inset-0 pointer-events-none z-15 flex items-center justify-center">
                {/* Center Vertical Plumb Axis */}
                <div
                  className={`absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0.5 transition-colors duration-200 ${
                    alignment.isAligned ? 'bg-emerald-500/40 shadow-sm shadow-emerald-500/50' : 'bg-amber-400/50 border-dashed'
                  }`}
                />

                {/* Horizontal Eye-Horizon Level Line */}
                <div
                  className={`absolute left-0 right-0 top-[40%] -translate-y-1/2 h-0.5 transition-colors duration-200 ${
                    alignment.isAligned ? 'bg-emerald-500/40 shadow-sm shadow-emerald-500/50' : 'bg-amber-400/50 border-dashed'
                  }`}
                />

                {/* Target Posture Bounding Oval */}
                <div
                  className={`w-44 h-56 rounded-[50%] border-2 transition-all duration-300 pointer-events-none flex items-center justify-center ${
                    alignment.isAligned
                      ? 'border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                      : 'border-amber-400/70 border-dashed shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                  }`}
                >
                  <div className="relative w-6 h-6">
                    <span className="absolute top-1/2 inset-x-0 h-0.5 bg-white/70" />
                    <span className="absolute left-1/2 inset-y-0 w-0.5 bg-white/70" />
                  </div>
                </div>

                {/* Line Guideline Labels */}
                <span className="absolute top-[41%] left-3 text-[9px] font-mono uppercase tracking-widest text-slate-300/80 bg-black/60 px-1.5 py-0.5 rounded">
                  Eye Horizon
                </span>
                <span className="absolute bottom-10 left-1/2 -translate-x-1/2 text-[9px] font-mono uppercase tracking-widest text-slate-300/80 bg-black/60 px-2 py-0.5 rounded">
                  Vertical Plumb Axis
                </span>
              </div>
            )}
          </>
        )}

        {/* Top Floating Control Overlays */}
        <div className="absolute top-3 inset-x-3 flex items-center justify-between z-20 pointer-events-none">
          {/* Privacy Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md border border-emerald-500/30 text-[10px] text-emerald-400 font-mono font-medium shadow-md">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Processed On-Device • No Uploads</span>
          </div>

          {/* Hologram / Video View Switcher Toggle */}
          <div className="pointer-events-auto flex items-center gap-1 bg-black/70 backdrop-blur-md p-1 rounded-lg border border-white/10 text-xs">
            <button
              onClick={() => setShowHologram(false)}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 transition-all ${
                !showHologram ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'text-slate-400 hover:text-white'
              }`}
              title="Show live webcam feed with posture overlay"
            >
              <Video className="w-3 h-3" />
              <span>Camera</span>
            </button>
            <button
              onClick={() => setShowHologram(true)}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 transition-all ${
                showHologram ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'text-slate-400 hover:text-white'
              }`}
              title="Show 3D WebGL Holographic Head Pose wireframe"
            >
              <Box className="w-3 h-3" />
              <span>3D Pose</span>
            </button>
          </div>
        </div>

        {/* Bottom Posture Cue Bar */}
        {isTracking && (
          <div className="absolute bottom-3 inset-x-3 flex items-center justify-between z-20 pointer-events-none">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/75 backdrop-blur-md border border-white/10 text-xs shadow-lg">
              {alignment.isAligned ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              )}
              <span className={`font-semibold ${alignment.isAligned ? 'text-emerald-300' : 'text-amber-300'}`}>
                {alignment.status}
              </span>
              <span className="text-slate-400 text-[11px] hidden sm:inline">— {alignment.cue}</span>
            </div>

            <div className="px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md border border-white/10 text-[11px] font-mono font-semibold text-slate-300">
              {fps} FPS
            </div>
          </div>
        )}

        {/* Not Tracking Splash Screen */}
        {!isTracking && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3 shadow-inner">
              <Camera className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-base linear-text-heading mb-1">Camera Feed Suspended</h3>
            <p className="text-xs linear-text-muted max-w-sm mb-4">
              Activate camera telemetry to initialize on-device facial landmark tracking and posture alignment.
            </p>
            <button
              onClick={onStartTracking}
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-bold text-xs transition-all shadow-md shadow-emerald-500/20"
            >
              Resume Telemetry
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
