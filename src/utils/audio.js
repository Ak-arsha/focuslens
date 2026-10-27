let audioCtx = null;
let ambientNodes = null;
let ambientGain = null;

export function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playChime(type = 'zen') {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  if (type === 'start') {
    // Crisp rising arpeggio for session commencement
    const freqs = [329.63, 440.0, 554.37, 659.25]; // E4, A4, C#5, E5
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      gain.gain.setValueAtTime(0.001, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.12, now + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.6);
    });
  } else if (type === 'calibrate') {
    // Crisp double ping for baseline recalibration
    [784, 1046.5].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.09);
      gain.gain.setValueAtTime(0.12, now + idx * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.09);
      osc.stop(now + idx * 0.09 + 0.25);
    });
  } else if (type === 'zen') {
    // Restorative harmonic bells (528Hz Solfeggio Love/Repair + 1056Hz harmonic)
    [528, 1056].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(idx === 0 ? 0.16 : 0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 1.8);
    });
  } else if (type === 'warn') {
    // Soft descending attention drift cue
    [480, 400].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);
      gain.gain.setValueAtTime(0.1, now + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.28);
    });
  } else if (type === 'alert') {
    // Double pulse warning for eye fatigue / drowsiness
    [0, 0.2].forEach((offset) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(360, now + offset);
      gain.gain.setValueAtTime(0.14, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + 0.16);
    });
  } else if (type === 'complete') {
    // Major triad celebration for sprint conclusion
    const chord = [261.63, 329.63, 392.0, 523.25]; // C4, E4, G4, C5
    chord.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);
      gain.gain.setValueAtTime(0.12, now + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.07 + 1.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 1.2);
    });
  } else if (type === 'click') {
    // Subtle mechanical haptic tick
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.03);
    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.03);
  }
}

export function stopAmbient() {
  if (ambientNodes) {
    ambientNodes.forEach(node => {
      try {
        if ('stop' in node && typeof node.stop === 'function') {
          node.stop();
        } else if ('disconnect' in node && typeof node.disconnect === 'function') {
          node.disconnect();
        }
      } catch {
        // ignore disconnect errors
      }
    });
    ambientNodes = null;
  }
}

export function setAmbientSound(mode, volume) {
  stopAmbient();
  if (mode === 'off') return;

  const ctx = getAudioContext();
  if (!ctx) return;

  ambientGain = ctx.createGain();
  const masterLevel = (volume / 100) * 0.18;
  ambientGain.gain.setValueAtTime(masterLevel, ctx.currentTime);
  ambientGain.connect(ctx.destination);

  if (mode === 'binaural') {
    // 40Hz Gamma Flow (Left: 216Hz, Right: 256Hz)
    const oscL = ctx.createOscillator();
    const oscR = ctx.createOscillator();
    oscL.type = 'sine';
    oscR.type = 'sine';
    oscL.frequency.setValueAtTime(216, ctx.currentTime);
    oscR.frequency.setValueAtTime(256, ctx.currentTime);

    const panL = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    const panR = ctx.createStereoPanner ? ctx.createStereoPanner() : null;

    if (panL && panR) {
      panL.pan.value = -0.92;
      panR.pan.value = 0.92;
      oscL.connect(panL);
      panL.connect(ambientGain);
      oscR.connect(panR);
      panR.connect(ambientGain);
    } else {
      oscL.connect(ambientGain);
      oscR.connect(ambientGain);
    }

    oscL.start();
    oscR.start();
    ambientNodes = [oscL, oscR, ambientGain];
  } else if (mode === 'brown' || mode === 'rain' || mode === 'white') {
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      if (mode === 'brown') {
        output[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = output[i];
        output[i] *= 3.8;
      } else if (mode === 'rain') {
        output[i] = (lastOut + 0.05 * white) / 1.05;
        lastOut = output[i];
        output[i] *= 2.2;
      } else {
        // Pure white noise
        output[i] = white * 0.4;
      }
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(mode === 'brown' ? 240 : mode === 'rain' ? 850 : 2200, ctx.currentTime);

    noiseSource.connect(filter);
    filter.connect(ambientGain);
    noiseSource.start();
    ambientNodes = [noiseSource, filter, ambientGain];
  } else if (mode === 'ocean') {
    // Ocean surf: brown noise modulated by low frequency oscillator (LFO)
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + 0.03 * white) / 1.03;
      lastOut = output[i];
      output[i] *= 3.2;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    // Filter with resonant frequency sweep
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, ctx.currentTime);
    filter.Q.setValueAtTime(2.5, ctx.currentTime);

    // LFO for periodic wave tide wash (0.12 Hz = 8.3s wave period)
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.12, ctx.currentTime);

    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(240, ctx.currentTime); // modulate cutoff +/- 240Hz

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    noiseSource.connect(filter);
    filter.connect(ambientGain);

    noiseSource.start();
    lfo.start();
    ambientNodes = [noiseSource, filter, lfo, lfoGain, ambientGain];
  } else if (mode === 'drone') {
    // Meditative Cosmic Drone: 432Hz harmonic series with gentle beating
    const frequencies = [108, 216, 432, 436]; // fundamental + octaves + slight detune for warm beating
    const oscillators = [];

    frequencies.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = idx === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(idx === 0 ? 0.35 : idx === 1 ? 0.25 : 0.15, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ambientGain);
      osc.start();
      oscillators.push(osc, gain);
    });

    ambientNodes = [...oscillators, ambientGain];
  }
}

export function updateAmbientVolume(volume) {
  const ctx = getAudioContext();
  if (ambientGain && ctx) {
    ambientGain.gain.setValueAtTime((volume / 100) * 0.18, ctx.currentTime);
  }
}
