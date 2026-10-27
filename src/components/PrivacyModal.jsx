import React from 'react';
import { ShieldCheck, X, Lock, HardDrive, Cpu, CloudOff } from 'lucide-react';

export const PrivacyModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg p-6 linear-panel rounded-2xl shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200 border border-white/10">
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div className="flex items-center gap-2.5 text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
            <h3 className="font-display text-base font-bold linear-text-heading">
              Privacy &amp; Edge Security Architecture
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg linear-btn-secondary"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col gap-3 text-xs leading-relaxed max-h-[65vh] overflow-y-auto pr-1">
          <div className="linear-inset p-3.5 rounded-xl flex items-start gap-3">
            <Cpu className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
              <h4 className="font-bold linear-text-heading text-sm">100% On-Device WebAssembly Inference</h4>
              <p className="linear-text-muted">
                Your webcam stream is analyzed frame-by-frame in volatile browser memory using Google MediaPipe
                WebAssembly &amp; WebGL. Video frames are discarded immediately after landmark extraction.
              </p>
            </div>
          </div>

          <div className="linear-inset p-3.5 rounded-xl flex items-start gap-3">
            <CloudOff className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
              <h4 className="font-bold linear-text-heading text-sm">Zero Cloud Transmission</h4>
              <p className="linear-text-muted">
                FocusLens connects to no cloud video streaming endpoints, tracking pixels, or external analytics.
                The application operates entirely offline in your browser once the on-device model is cached.
              </p>
            </div>
          </div>

          <div className="linear-inset p-3.5 rounded-xl flex items-start gap-3">
            <HardDrive className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
              <h4 className="font-bold linear-text-heading text-sm">Device-Only Storage (IndexedDB)</h4>
              <p className="linear-text-muted">
                Session history and biometric summaries are stored strictly inside your browser's client-side{' '}
                <code className="px-1.5 py-0.5 rounded bg-black/30 font-mono text-[10px] text-emerald-400">
                  IndexedDB
                </code>{' '}
                and localStorage. You maintain complete sovereignty to export or wipe your data anytime.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-white/5 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-bold text-xs transition-colors"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};
