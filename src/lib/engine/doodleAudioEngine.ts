/**
 * Mild Natural Marker & Pen Sketch Sound Effects Engine for VidFlash Studio
 * Plays a gentle, realistic pen-on-paper sketch audio effect
 * strictly synchronized in real time with the animated drawing hand,
 * with guaranteed instantaneous cutoff upon pause, seek, or scene switch.
 */

let globalAudioContext: AudioContext | null = null;
let masterGainNode: GainNode | null = null;
let activeSourceNode: AudioBufferSourceNode | null = null;
let isAudioActive = false;
let cachedBuffer: AudioBuffer | null = null;
let isFetchingBuffer = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!globalAudioContext || globalAudioContext.state === "closed") {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      globalAudioContext = new AudioCtx();

      masterGainNode = globalAudioContext.createGain();
      masterGainNode.gain.setValueAtTime(0, globalAudioContext.currentTime);
      masterGainNode.connect(globalAudioContext.destination);
    }
    return globalAudioContext;
  } catch {
    return null;
  }
}

/**
 * Pre-loads the mild sketch audio buffer from /sfx/marker_sketch_mild.wav
 */
export async function loadMarkerSoundBuffer(
  audioContext: AudioContext
): Promise<AudioBuffer | null> {
  if (cachedBuffer) return cachedBuffer;
  if (isFetchingBuffer) {
    // Await if already fetching in parallel
    await new Promise((r) => setTimeout(r, 80));
    if (cachedBuffer) return cachedBuffer;
  }

  isFetchingBuffer = true;
  try {
    const res = await fetch("/sfx/Marker_Sound_FX.mp3");
    if (res.ok) {
      const arrayBuf = await res.arrayBuffer();
      cachedBuffer = await audioContext.decodeAudioData(arrayBuf.slice(0));
      isFetchingBuffer = false;
      return cachedBuffer;
    }
  } catch (err) {
    console.warn("Failed to load /sfx/Marker_Sound_FX.mp3:", err);
  }
  isFetchingBuffer = false;

  // Fallback synthetic buffer if file is unreachable
  return createSyntheticMildBuffer(audioContext);
}

/**
 * Creates a mild, soft textured pen-on-paper sketch buffer fallback
 */
function createSyntheticMildBuffer(audioContext: AudioContext): AudioBuffer {
  const sampleRate = audioContext.sampleRate;
  const numSamples = Math.floor(sampleRate * 5.0);
  const buffer = audioContext.createBuffer(1, numSamples, sampleRate);
  const channelData = buffer.getChannelData(0);

  let b0 = 0, b1 = 0, b2 = 0;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const white = Math.random() * 2 - 1;
    b0 = 0.98 * b0 + white * 0.12;
    b1 = 0.95 * b1 + white * 0.18;
    b2 = 0.88 * b2 + white * 0.28;
    const pink = (b0 + b1 + b2) * 0.15;

    const strokeRhythm = Math.sin(t * 16.0) * 0.25 + 0.75;
    channelData[i] = pink * strokeRhythm * 0.25;
  }
  return buffer;
}

/**
 * Synchronous buffer getter
 */
export function getCachedDoodleBuffer(
  audioContext: AudioContext,
  _paperStyle: string = "auto"
): AudioBuffer {
  if (cachedBuffer) return cachedBuffer;
  loadMarkerSoundBuffer(audioContext).catch(() => {});
  return createSyntheticMildBuffer(audioContext);
}

/**
 * Updates marker sketching audio state in real-time.
 * - When isDrawing is true: starts mild, gentle sketching sound and loops seamlessly.
 * - When isDrawing is false: IMMEDIATELY cuts master volume to absolute 0.
 */
export function setDoodleDrawingAudioActive(
  isDrawing: boolean,
  _paperStyle: string = "auto",
  volume: number = 0.38
) {
  if (typeof window === "undefined") return;

  const ctx = getAudioContext();
  if (!ctx || !masterGainNode) return;

  if (isDrawing) {
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    if (!isAudioActive) {
      isAudioActive = true;

      const playWithBuffer = (buf: AudioBuffer) => {
        if (!ctx || !masterGainNode || !isAudioActive) return;

        try {
          if (activeSourceNode) {
            try {
              activeSourceNode.stop();
              activeSourceNode.disconnect();
            } catch {}
          }

          const source = ctx.createBufferSource();
          source.buffer = buf;
          source.loop = true; // Seamless loop if clip duration is longer than sound file
          source.connect(masterGainNode);
          source.start(0);
          activeSourceNode = source;

          // Smooth fast attack ramp (30ms) to prevent clicks
          masterGainNode.gain.cancelScheduledValues(ctx.currentTime);
          masterGainNode.gain.setValueAtTime(0.0001, ctx.currentTime);
          masterGainNode.gain.linearRampToValueAtTime(
            Math.max(0.01, volume),
            ctx.currentTime + 0.03
          );
        } catch (e) {
          console.warn("Marker sound start notice:", e);
        }
      };

      if (cachedBuffer) {
        playWithBuffer(cachedBuffer);
      } else {
        loadMarkerSoundBuffer(ctx).then((buf) => {
          if (buf && isAudioActive) {
            playWithBuffer(buf);
          }
        });
      }
    }
  } else {
    // If not drawing, immediately hard-silence the audio!
    stopDoodleAudioImmediately();
  }
}

/**
 * Hard-stops all sketch audio immediately.
 * Called on pause, seek, clip end, scene cut, unmount, or toggle disable.
 */
export function stopDoodleAudioImmediately() {
  isAudioActive = false;

  if (masterGainNode && globalAudioContext) {
    try {
      masterGainNode.gain.cancelScheduledValues(globalAudioContext.currentTime);
      masterGainNode.gain.setValueAtTime(0, globalAudioContext.currentTime);
    } catch {}
  }

  if (activeSourceNode) {
    try {
      activeSourceNode.stop();
      activeSourceNode.disconnect();
    } catch {}
    activeSourceNode = null;
  }
}
