/**
 * Plays a joyful celebration victory fanfare & cheer sound effect when video remuxing completes!
 */
export function playVictorySound() {
  if (typeof window === "undefined") return;

  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const now = ctx.currentTime;

    // --- 1. Victory Fanfare Arpeggio Chime (C5, E5, G5, C6, E6) ---
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = idx === notes.length - 1 ? "triangle" : "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.09);

      gain.gain.setValueAtTime(0.01, now + idx * 0.09);
      gain.gain.linearRampToValueAtTime(0.3, now + idx * 0.09 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.09);
      osc.stop(now + idx * 0.09 + 0.5);
    });

    // --- 2. Celebratory "Yeah!" Vocal Pitch Slide (Formant Synth) ---
    const startTime = now + 0.35;
    const oscVocal = ctx.createOscillator();
    const gainVocal = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    oscVocal.type = "sawtooth";
    // Pitch slides upward like a excited cheer "Yeah!"
    oscVocal.frequency.setValueAtTime(320, startTime);
    oscVocal.frequency.exponentialRampToValueAtTime(580, startTime + 0.2);
    oscVocal.frequency.exponentialRampToValueAtTime(440, startTime + 0.55);

    // Formant filter shaping vocal "Ahhh / Yeahhh" sound
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1200, startTime);
    filter.Q.setValueAtTime(3.0, startTime);

    gainVocal.gain.setValueAtTime(0.01, startTime);
    gainVocal.gain.linearRampToValueAtTime(0.25, startTime + 0.05);
    gainVocal.gain.exponentialRampToValueAtTime(0.001, startTime + 0.6);

    oscVocal.connect(filter);
    filter.connect(gainVocal);
    gainVocal.connect(ctx.destination);

    oscVocal.start(startTime);
    oscVocal.stop(startTime + 0.65);

    // --- 3. Cheering Crowd Noise Burst ---
    const bufferSize = ctx.sampleRate * 0.7;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.setValueAtTime(2200, startTime);
    noiseFilter.Q.setValueAtTime(1.5, startTime);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.01, startTime);
    noiseGain.gain.linearRampToValueAtTime(0.15, startTime + 0.1);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.7);

    whiteNoise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    whiteNoise.start(startTime);
    whiteNoise.stop(startTime + 0.7);

    // --- 4. Extra Sparkle Chime Drop (1.0s) ---
    const sparkOsc = ctx.createOscillator();
    const sparkGain = ctx.createGain();
    sparkOsc.type = "sine";
    sparkOsc.frequency.setValueAtTime(1567.98, now + 0.85); // G6
    sparkOsc.frequency.exponentialRampToValueAtTime(2093.0, now + 1.1); // C7

    sparkGain.gain.setValueAtTime(0.01, now + 0.85);
    sparkGain.gain.linearRampToValueAtTime(0.2, now + 0.9);
    sparkGain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

    sparkOsc.connect(sparkGain);
    sparkGain.connect(ctx.destination);

    sparkOsc.start(now + 0.85);
    sparkOsc.stop(now + 1.45);
  } catch (err) {
    console.warn("Audio celebration sound effect notice:", err);
  }
}
