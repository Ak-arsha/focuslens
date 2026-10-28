// Lightweight Procedural Audio Synthesis via Native Web Audio API
// Synthesizes non-intrusive feedback chimes and 6 ambient focus soundscapes directly in the browser. Zero asset downloads.

let audioCtx = null;
let ambientNodes = null;
let currentAmbientMode = 'off';
let ambientMasterGain = null;
let ambientVolume = 0.5; // 0.0 to 1.0

export function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Play subtle auditory feedback chimes
 * @param {'start' | 'calibrate' | 'warn' | 'alert' | 'complete' | 'click'} type
 */
export function playChime(type = 'click') {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  if (type === 'start') {
    // Rising arpeggio for session commencement (E4 -> A4 -> C#5 -> E5)
    const freqs = [329.63, 440.0, 554.37, 659.25];
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
      gain.gain.setValueAtTime(0.1, now + idx * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.09);
      osc.stop(now + idx * 0.09 + 0.25);
    });
  } else if (type === 'warn') {
    // Soft descending attention drift cue (480Hz -> 400Hz)
    [480, 400].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);
      gain.gain.setValueAtTime(0.08, now + idx * 0.12);
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
      gain.gain.setValueAtTime(0.12, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + 0.16);
    });
  } else if (type === 'complete') {
    // Major triad celebration for sprint conclusion (C4, E4, G4, C5)
    const chord = [261.63, 329.63, 392.0, 523.25];
    chord.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);
      gain.gain.setValueAtTime(0.001, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.12, now + idx * 0.06 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.06 + 1.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 1.2);
    });
  } else if (type === 'click') {
    // Subtle UI click transient
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.03);
    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.03);
  }
}

// -------------------------------------------------------------
// Procedural Ambient Soundscapes (Native Web Audio)
// -------------------------------------------------------------

function createNoiseBuffer(ctx, duration = 4) {
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

function createBrownNoiseBuffer(ctx, duration = 4) {
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let lastOut = 0.0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    data[i] = (lastOut + 0.02 * white) / 1.02;
    lastOut = data[i];
    data[i] *= 3.5; // Gain compensation
  }
  return buffer;
}

/**
 * Set ambient soundscape
 * @param {'off' | 'binaural' | 'brown' | 'rain' | 'ocean' | 'drone' | 'white'} mode
 */
export function setAmbientSound(mode = 'off') {
  const ctx = getAudioContext();
  if (!ctx) return;

  // Clean up existing ambient nodes
  if (ambientNodes) {
    try {
      if (ambientMasterGain) {
        ambientMasterGain.gain.setValueAtTime(ambientMasterGain.gain.value, ctx.currentTime);
        ambientMasterGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
      }
      setTimeout(() => {
        if (ambientNodes) {
          ambientNodes.forEach((node) => {
            try {
              if (node.stop) node.stop();
              node.disconnect();
            } catch {
              // Ignore node stop errors
            }
          });
          ambientNodes = null;
        }
      }, 350);
    } catch {
      ambientNodes = null;
    }
  }

  currentAmbientMode = mode;
  if (mode === 'off') return;

  // Initialize master ambient gain
  ambientMasterGain = ctx.createGain();
  ambientMasterGain.gain.setValueAtTime(0.0001, ctx.currentTime);
  ambientMasterGain.gain.exponentialRampToValueAtTime(ambientVolume * 0.3, ctx.currentTime + 0.6);
  ambientMasterGain.connect(ctx.destination);

  const nodes = [];

  if (mode === 'white') {
    // Pure White Noise Loop
    const src = ctx.createBufferSource();
    src.buffer = createNoiseBuffer(ctx, 4);
    src.loop = true;
    src.connect(ambientMasterGain);
    src.start();
    nodes.push(src);
  } else if (mode === 'brown') {
    // Deep Brown Noise with Warm Lowpass
    const src = ctx.createBufferSource();
    src.buffer = createBrownNoiseBuffer(ctx, 4);
    src.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, ctx.currentTime);

    src.connect(filter);
    filter.connect(ambientMasterGain);
    src.start();
    nodes.push(src, filter);
  } else if (mode === 'rain') {
    // Gentle Forest Rain (Filtered Pink/Brown Noise with Air Bandpass)
    const src = ctx.createBufferSource();
    src.buffer = createNoiseBuffer(ctx, 4);
    src.loop = true;

    const filter1 = ctx.createBiquadFilter();
    filter1.type = 'bandpass';
    filter1.frequency.setValueAtTime(1100, ctx.currentTime);
    filter1.Q.setValueAtTime(0.9, ctx.currentTime);

    const filter2 = ctx.createBiquadFilter();
    filter2.type = 'lowpass';
    filter2.frequency.setValueAtTime(3200, ctx.currentTime);

    src.connect(filter1);
    filter1.connect(filter2);
    filter2.connect(ambientMasterGain);
    src.start();
    nodes.push(src, filter1, filter2);
  } else if (mode === 'ocean') {
    // Ocean Waves with 12-Second Rhythmic Swell LFO
    const src = ctx.createBufferSource();
    src.buffer = createBrownNoiseBuffer(ctx, 6);
    src.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, ctx.currentTime);

    // LFO Modulator for wave swell
    const lfo = ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.08, ctx.currentTime); // ~12s period
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(260, ctx.currentTime); // modulate +/- 260Hz

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    src.connect(filter);
    filter.connect(ambientMasterGain);
    src.start();
    lfo.start();
    nodes.push(src, filter, lfo, lfoGain);
  } else if (mode === 'binaural') {
    // 40Hz Gamma Flow Binaural Beat (Carrier: 216Hz Left, 256Hz Right)
    // Left Channel (216 Hz)
    const oscL = ctx.createOscillator();
    oscL.type = 'sine';
    oscL.frequency.setValueAtTime(216, ctx.currentTime);

    // Right Channel (256 Hz) -> 40Hz beat
    const oscR = ctx.createOscillator();
    oscR.type = 'sine';
    oscR.frequency.setValueAtTime(256, ctx.currentTime);

    if (ctx.createStereoPanner) {
      const panL = ctx.createStereoPanner();
      panL.pan.setValueAtTime(-0.85, ctx.currentTime);
      const panR = ctx.createStereoPanner();
      panR.pan.setValueAtTime(0.85, ctx.currentTime);

      oscL.connect(panL);
      panL.connect(ambientMasterGain);

      oscR.connect(panR);
      panR.connect(ambientMasterGain);

      nodes.push(oscL, oscR, panL, panR);
    } else {
      oscL.connect(ambientMasterGain);
      oscR.connect(ambientMasterGain);
      nodes.push(oscL, oscR);
    }

    oscL.start();
    oscR.start();
  } else if (mode === 'drone') {
    // 432Hz Harmonic Cosmic Drone (432Hz root + 648Hz 5th + 864Hz octave)
    const freqs = [432, 433.2, 648, 864];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      osc.type = idx === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.25 / freqs.length, ctx.currentTime);

      osc.connect(gain);
      gain.connect(ambientMasterGain);
      osc.start();
      nodes.push(osc, gain);
    });
  }

  ambientNodes = nodes;
}

/**
 * Update ambient sound volume
 * @param {number} volume 0 to 100
 */
export function updateAmbientVolume(volume) {
  ambientVolume = Math.max(0, Math.min(100, volume)) / 100;
  if (ambientMasterGain && audioCtx) {
    ambientMasterGain.gain.setValueAtTime(
      ambientMasterGain.gain.value,
      audioCtx.currentTime
    );
    ambientMasterGain.gain.exponentialRampToValueAtTime(
      Math.max(0.0001, ambientVolume * 0.3),
      audioCtx.currentTime + 0.1
    );
  }
}

export function getCurrentAmbientMode() {
  return currentAmbientMode;
}
