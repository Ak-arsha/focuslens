import React from 'react';
import { ShieldCheck, X } from 'lucide-react';

export const PrivacyModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg p-6 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col gap-4 text-slate-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
            <h3 className="font-display text-base font-bold text-slate-100">
              Privacy &amp; Security Architecture
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col gap-3 text-xs leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
            <h4 className="font-bold text-slate-100 text-sm mb-1">100% Client-Side Processing</h4>
            <p className="text-slate-400">
              Your webcam stream is analyzed frame-by-frame in volatile browser memory using Google MediaPipe
              WebAssembly. Not a single pixel is ever recorded, stored on a remote server, or streamed across the
              internet.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
            <h4 className="font-bold text-slate-100 text-sm mb-1">Zero Server Telemetry</h4>
            <p className="text-slate-400">
              FocusLens includes no advertising pixels, tracking cookies, or analytics services connected to your
              camera. The application functions completely offline once loaded.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
            <h4 className="font-bold text-slate-100 text-sm mb-1">Device-Only Storage</h4>
            <p className="text-slate-400">
              Session metrics and focus aggregates are saved exclusively in your browser's private{' '}
              <code className="px-1.5 py-0.5 rounded bg-slate-800 font-mono text-[11px] text-emerald-400">
                localStorage
              </code>
              . You can export or erase this history anytime with one click.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
            <h4 className="font-bold text-slate-100 text-sm mb-1">Synthesized Procedural Audio</h4>
            <p className="text-slate-400">
              All soundscapes (40Hz Binaural Beats, Rain, Brown noise) and notification chimes are synthesized
              mathematically in real-time via the HTML5 Web Audio API. Zero audio files are downloaded.
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};
