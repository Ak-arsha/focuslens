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

  if (type === 'zen') {
    [528, 1056].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(idx === 0 ? 0.15 : 0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 1.2);
    });
  } else if (type === 'warn') {
    [440, 392].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.14);
      gain.gain.setValueAtTime(0.12, now + idx * 0.14);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.14 + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.14);
      osc.stop(now + idx * 0.14 + 0.3);
    });
  } else if (type === 'alert') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(330, now);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.5);
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
  ambientGain.gain.setValueAtTime((volume / 100) * 0.15, ctx.currentTime);
  ambientGain.connect(ctx.destination);

  if (mode === 'binaural') {
    // 40Hz Gamma Flow (Left: 216Hz, Right: 256Hz)
    const oscL = ctx.createOscillator();
    const oscR = ctx.createOscillator();
    oscL.frequency.setValueAtTime(216, ctx.currentTime);
    oscR.frequency.setValueAtTime(256, ctx.currentTime);

    const panL = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    const panR = ctx.createStereoPanner ? ctx.createStereoPanner() : null;

    if (panL && panR) {
      panL.pan.value = -0.9;
      panR.pan.value = 0.9;
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
  } else if (mode === 'brown' || mode === 'rain') {
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      if (mode === 'brown') {
        output[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5;
      } else {
        output[i] = (lastOut + 0.05 * white) / 1.05;
        lastOut = output[i];
        output[i] *= 2.0;
      }
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(mode === 'brown' ? 280 : 800, ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(ambientGain);
    whiteNoise.start();
    ambientNodes = [whiteNoise, filter, ambientGain];
  }
}

export function updateAmbientVolume(volume) {
  const ctx = getAudioContext();
  if (ambientGain && ctx) {
    ambientGain.gain.setValueAtTime((volume / 100) * 0.15, ctx.currentTime);
  }
}
