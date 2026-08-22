/**
 * Proprietary WebAudio Sound Effects Synthesizer for VidFlash Studio
 * Generates instant studio sound effects directly in-browser with zero network latency.
 */

export function playSynthesizedSfx(
  type: "whoosh" | "pop" | "camera" | "chime" = "whoosh"
) {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (type === "whoosh") {
      // Cinematic transition whoosh using filtered noise sweep
      const duration = 0.4;
      const bufferSize = Math.floor(ctx.sampleRate * duration);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let b0 = 0,
        b1 = 0,
        b2 = 0;

      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99 * b0 + white * 0.05;
        b1 = 0.95 * b1 + white * 0.1;
        b2 = 0.85 * b2 + white * 0.2;
        data[i] = (b0 + b1 + b2) * 1.5;
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(250, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(
        2200,
        ctx.currentTime + duration * 0.5
      );
      filter.frequency.exponentialRampToValueAtTime(
        180,
        ctx.currentTime + duration
      );
      filter.Q.value = 2.5;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + duration * 0.5);
      gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + duration);

      noiseSource.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noiseSource.start();
      noiseSource.stop(ctx.currentTime + duration);
    } else if (type === "pop") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(700, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.09);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.09);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.09);
    } else if (type === "chime") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(1046.5, ctx.currentTime); // C6
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    }
  } catch (e) {
    console.warn("SFX synthesis error:", e);
  }
}
