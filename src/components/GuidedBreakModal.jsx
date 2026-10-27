import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';

export const GuidedBreakModal = ({
  isOpen,
  onResumeSprint,
}) => {
  const [phaseIndex, setPhaseIndex] = useState(0);

  const phases = [
    { name: 'Inhale', duration: 4000, scale: 'scale-125', msg: 'Inhale slowly and quietly through the nose for 4 seconds...' },
    { name: 'Hold', duration: 7000, scale: 'scale-125 brightness-125', msg: 'Hold your breath calmly for 7 seconds...' },
    { name: 'Exhale', duration: 8000, scale: 'scale-100', msg: 'Exhale smoothly and completely through your mouth for 8 seconds...' },
  ];

  // Confetti trigger upon break opening
  useEffect(() => {
    if (isOpen) {
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10B981', '#06B6D4', '#F59E0B']
        });
      } catch {
        // ignore confetti errors
      }
    }
  }, [isOpen]);

  // Breathing cycle timer
  useEffect(() => {
    if (!isOpen) return;

    const currentDuration = phases[phaseIndex].duration;
    const timer = setTimeout(() => {
      setPhaseIndex((prev) => (prev + 1) % phases.length);
    }, currentDuration);

    return () => clearTimeout(timer);
  }, [isOpen, phaseIndex]);

  if (!isOpen) return null;

  const currentPhase = phases[phaseIndex];

  return (
    <div className="w-full p-6 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900/90 to-cyan-950/30 border border-emerald-500/40 shadow-2xl flex flex-col items-center text-center gap-4 my-2">
      <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs border border-emerald-500/30">
        Sprint Complete
      </span>
      <h2 className="font-display text-2xl font-bold text-slate-100">Cognitive Reset &amp; Eye Relief</h2>
      <p className="text-xs text-slate-300 max-w-md">
        Take a few minutes to reset mental fatigue and relax your ciliary eye muscles.
      </p>

      {/* 4-7-8 Breathing Orb & Exercise Guide */}
      <div className="flex flex-col sm:flex-row items-center gap-6 p-5 rounded-xl bg-slate-950/80 border border-slate-800 w-full max-w-lg text-left">
        <div className="w-20 h-20 flex items-center justify-center shrink-0">
          <div
            className={`w-14 h-14 rounded-full bg-radial from-emerald-400 to-emerald-600/30 shadow-lg shadow-emerald-500/40 flex items-center justify-center transition-transform duration-1000 ${currentPhase.scale}`}
          >
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-white">
              {currentPhase.name}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <h4 className="text-sm font-bold text-slate-200">4-7-8 Box Breathing</h4>
          <p className="text-xs text-slate-400 leading-relaxed">{currentPhase.msg}</p>
          <div className="mt-1 p-2 rounded bg-slate-900 border-l-2 border-cyan-400 text-[11px] text-slate-400">
            <strong className="text-slate-300">20-20-20 Rule:</strong> Look at an object at least 20 feet (6m) away for 20 seconds.
          </div>
        </div>
      </div>

      <button
        onClick={onResumeSprint}
        className="px-6 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all transform hover:-translate-y-0.5"
      >
        Resume Focus Sprint
      </button>
    </div>
  );
};
