import React from 'react';
import { ShieldCheck, Activity, Eye, Compass, Play, AlertCircle, Loader2, History, Lock } from 'lucide-react';

export const LandingScreen = ({
  engineStatus,
  engineError,
  onStartSession,
  onOpenPrivacy,
  onOpenHistory,
  hasHistory = false,
}) => {
  const isStarting = engineStatus === 'requesting-permission' || engineStatus === 'loading-model' || engineStatus === 'calibrating';

  const getStatusText = () => {
    switch (engineStatus) {
      case 'requesting-permission':
        return 'Requesting camera access in your browser...';
      case 'loading-model':
        return 'Loading MediaPipe Face Landmarker WASM model...';
      case 'calibrating':
        return 'Calibrating neutral pose baseline...';
      default:
        return 'Initializing...';
    }
  };

  return (
    <div className="min-h-full flex flex-col justify-between max-w-5xl mx-auto px-4 py-8 sm:py-12 select-none animate-in fade-in duration-300">
      {/* Top Brand & Privacy Callout */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 flex items-center justify-center">
            <svg viewBox="0 0 32 32" className="w-full h-full">
              <circle cx="16" cy="16" r="14" fill="none" stroke="#10B981" strokeWidth="2.5" />
              <circle cx="16" cy="16" r="8" fill="#10B981" opacity="0.25" />
              <circle cx="16" cy="16" r="3.5" fill="#10B981" />
            </svg>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-display font-extrabold text-base tracking-tight linear-text-heading">FocusLens</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                v2.0
              </span>
            </div>
            <span className="text-[11px] linear-text-muted">On-Device AI Telemetry</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasHistory && (
            <button
              onClick={onOpenHistory}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg linear-btn-secondary text-xs font-medium"
            >
              <History className="w-3.5 h-3.5 text-cyan-400" />
              <span>Past Sessions</span>
            </button>
          )}

          <button
            onClick={onOpenPrivacy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg linear-btn-secondary text-xs font-medium"
          >
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Privacy Guarantee</span>
          </button>
        </div>
      </div>

      {/* Main Hero Section */}
      <div className="flex flex-col items-center text-center my-8 sm:my-14 max-w-3xl mx-auto">
        {/* On-device architecture pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-500 text-xs font-semibold mb-6 shadow-sm">
          <ShieldCheck className="w-4 h-4" />
          <span>100% On-Device AI • Zero Cloud Transmission</span>
        </div>

        <h1 className="font-display font-black text-3xl sm:text-5xl tracking-tight linear-text-heading leading-[1.15] mb-4">
          Privacy-First AI Focus &amp; Ergonomics Monitor
        </h1>

        <p className="text-sm sm:text-base linear-text-muted max-w-2xl leading-relaxed mb-8">
          Monitors cognitive attention drift, cervical spine posture, and digital eye strain entirely inside your browser using MediaPipe WebAssembly. No video or audio ever leaves this device.
        </p>

        {/* Error message state if camera was denied */}
        {engineError && (
          <div className="w-full max-w-md mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-left flex items-start gap-3 text-xs text-rose-300 animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
              <strong className="text-rose-200 font-semibold">Camera Access Required</strong>
              <span>{engineError}</span>
            </div>
          </div>
        )}

        {/* Primary CTA Button */}
        <div className="flex flex-col items-center gap-3 w-full max-w-sm">
          <button
            onClick={onStartSession}
            disabled={isStarting}
            className="w-full py-3.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-bold text-base transition-all duration-150 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2.5 disabled:opacity-60 disabled:cursor-wait"
          >
            {isStarting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-slate-950" />
                <span>{getStatusText()}</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-slate-950 text-slate-950" />
                <span>Start Focus Session</span>
              </>
            )}
          </button>

          <span className="text-[11px] linear-text-faint">
            Camera permission required • All video stays in volatile RAM
          </span>
        </div>
      </div>

      {/* 3 Core Benefit Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
        {/* Benefit 1: Focus Telemetry */}
        <div className="linear-panel p-5 rounded-2xl flex flex-col gap-2.5 text-left border border-white/5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-500">
            <Activity className="w-4 h-4" />
          </div>
          <h3 className="font-display font-bold text-sm linear-text-heading">Focus Telemetry</h3>
          <p className="text-xs linear-text-muted leading-relaxed">
            Computes a real-time 0–100 flow score based on uninterrupted screen fixations, off-axis gaze drift, and attention fatigue.
          </p>
        </div>

        {/* Benefit 2: Posture Awareness */}
        <div className="linear-panel p-5 rounded-2xl flex flex-col gap-2.5 text-left border border-white/5">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400">
            <Compass className="w-4 h-4" />
          </div>
          <h3 className="font-display font-bold text-sm linear-text-heading">Posture Awareness</h3>
          <p className="text-xs linear-text-muted leading-relaxed">
            Tracks 3D cervical spine orientation (yaw, pitch, roll) with vertical plumb guidelines and instant slouching alerts.
          </p>
        </div>

        {/* Benefit 3: Eye-Strain Prevention */}
        <div className="linear-panel p-5 rounded-2xl flex flex-col gap-2.5 text-left border border-white/5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400">
            <Eye className="w-4 h-4" />
          </div>
          <h3 className="font-display font-bold text-sm linear-text-heading">Eye-Strain Prevention</h3>
          <p className="text-xs linear-text-muted leading-relaxed">
            Measures Eye Aspect Ratio (EAR) and 60-second blink rate (BPM) to counteract screen-stare dry eye asthenopia.
          </p>
        </div>
      </div>

      {/* Prominent Privacy Statement */}
      <div className="linear-panel p-4 rounded-xl flex items-center gap-3.5 border border-emerald-500/20 bg-emerald-950/10 text-xs linear-text-muted mt-4">
        <Lock className="w-5 h-5 text-emerald-400 shrink-0" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 w-full">
          <div>
            <strong className="text-emerald-400 font-semibold block sm:inline mr-1">
              Zero Server Telemetry:
            </strong>
            <span>
              Inference runs via MediaPipe WebAssembly directly in your browser. No video, audio, or telemetry packets are ever sent to the cloud.
            </span>
          </div>
          <span className="font-mono text-[10px] text-emerald-500/80 uppercase tracking-wider shrink-0 font-bold">
            Client-Side Only
          </span>
        </div>
      </div>
    </div>
  );
};
