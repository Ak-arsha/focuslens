import React from 'react';
import { X, ShieldCheck, Eye, Compass, Smile, Activity, Sparkles } from 'lucide-react';

export const AboutModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-xl p-6 theme-panel rounded-2xl shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-500" />
            <h3 className="font-display text-base font-bold theme-text-heading">
              About FocusLens
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg theme-text-muted hover:theme-text-heading theme-btn-secondary"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col gap-4 text-xs leading-relaxed theme-text-body">
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
            <h4 className="font-bold text-emerald-600 dark:text-emerald-400 text-sm mb-1">
              What is FocusLens?
            </h4>
            <p>
              FocusLens is an intelligent, privacy-first cognitive focus and posture companion. It runs directly inside your web browser using on-device computer vision to help knowledge workers, developers, and researchers sustain uninterrupted deep work while proactively preventing screen fatigue, dry eye strain, and neck posture slouching.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="theme-inset p-3 rounded-lg flex flex-col gap-1.5">
              <div className="flex items-center gap-2 font-bold theme-text-heading">
                <Eye className="w-4 h-4 text-emerald-500" />
                <span>Eye Dynamics &amp; Blink Telemetry</span>
              </div>
              <p className="theme-text-muted">
                Measures Eye Aspect Ratio (EAR) and real-time blink rate to detect the "Screen Staring Syndrome" where blinks drop by 66%, warning you before ocular dryness develops.
              </p>
            </div>

            <div className="theme-inset p-3 rounded-lg flex flex-col gap-1.5">
              <div className="flex items-center gap-2 font-bold theme-text-heading">
                <Compass className="w-4 h-4 text-cyan-500" />
                <span>3D Head Posture &amp; Alignment</span>
              </div>
              <p className="theme-text-muted">
                Tracks 3D Yaw, Pitch, and Roll via facial transformation matrices, mirroring your head in a WebGL 3D wireframe hologram with clear ergonomic alignment guidelines.
              </p>
            </div>

            <div className="theme-inset p-3 rounded-lg flex flex-col gap-1.5">
              <div className="theme-text-heading flex items-center gap-2 font-bold">
                <Smile className="w-4 h-4 text-amber-500" />
                <span>Facial Sentiment &amp; Affect</span>
              </div>
              <p className="theme-text-muted">
                Analyzes 52 facial blendshapes to distinguish calm flow from cognitive frustration, brow furrow tension, or squinting strain.
              </p>
            </div>

            <div className="theme-inset p-3 rounded-lg flex flex-col gap-1.5">
              <div className="theme-text-heading flex items-center gap-2 font-bold">
                <Activity className="w-4 h-4 text-indigo-500" />
                <span>Procedural Soundscapes</span>
              </div>
              <p className="theme-text-muted">
                Synthesizes 40Hz Gamma binaural beats, ocean surf, brown noise, and rain using the native Web Audio API with zero audio file downloads.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-lg theme-inset flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <strong className="theme-text-heading block mb-0.5">100% Zero-Knowledge Privacy Guarantee</strong>
              <p className="theme-text-muted">
                Every video frame is processed in temporary browser RAM via WebAssembly. No video, audio, or biometric data is ever recorded or uploaded to the cloud.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
