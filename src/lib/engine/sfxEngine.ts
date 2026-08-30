/**
 * High-Performance Sound Effects Engine for VidFlash Studio
 * Plays real studio transition swooshes, impacts, and actions from the SFX library.
 */

export interface SoundEffectItem {
  id: string;
  name: string;
  category: "swoosh" | "impact" | "action" | "ui";
  file: string;
}

export const SFX_LIBRARY: SoundEffectItem[] = [
  // --- Swooshes & Transitions (9 Sounds) ---
  {
    id: "whoosh-high",
    name: "Whoosh High",
    category: "swoosh",
    file: "/sfx/Whoosh high.mp3",
  },
  {
    id: "whoosh-mid-high",
    name: "Whoosh Mid-High",
    category: "swoosh",
    file: "/sfx/Whoosh mid-high.aac",
  },
  {
    id: "whoosh-mid-low",
    name: "Whoosh Mid-Low",
    category: "swoosh",
    file: "/sfx/Whoosh mid-low.aac",
  },
  {
    id: "whoosh-low",
    name: "Whoosh Low",
    category: "swoosh",
    file: "/sfx/Whoosh low.aac",
  },
  {
    id: "short-whoosh",
    name: "Short Whoosh",
    category: "swoosh",
    file: "/sfx/Short Whoosh.mp3",
  },
  {
    id: "whoosh-fire",
    name: "Whoosh Fire",
    category: "swoosh",
    file: "/sfx/whoose fire.mp3",
  },
  {
    id: "short-transition",
    name: "Short Transition",
    category: "swoosh",
    file: "/sfx/short transition.mp3",
  },
  {
    id: "build-up",
    name: "Build Up Rise",
    category: "swoosh",
    file: "/sfx/build up.mp3",
  },
  {
    id: "rake-swing",
    name: "Rake Swing Whoosh",
    category: "swoosh",
    file: "/sfx/rake swing.mp3",
  },

  // --- Actions, Camera & Clicks (12 Sounds) ---
  {
    id: "camera-2",
    name: "Camera Shot 2",
    category: "action",
    file: "/sfx/Camera 2.mp3",
  },
  {
    id: "camera-shutter-2",
    name: "Camera Shutter 2",
    category: "action",
    file: "/sfx/camera shutter 2.mp3",
  },
  {
    id: "shutter-click",
    name: "Shutter Click",
    category: "action",
    file: "/sfx/Shutter Click.mp3",
  },
  {
    id: "finger-snap",
    name: "Finger Snap",
    category: "action",
    file: "/sfx/Snap.mp3",
  },
  {
    id: "pop-sound",
    name: "Pop Sound Effect",
    category: "action",
    file: "/sfx/Pop sound effect.mp3",
  },
  {
    id: "bottle-cork",
    name: "Bottle Cork Pop",
    category: "action",
    file: "/sfx/bottle cork.mp3",
  },
  {
    id: "keyboard-enter",
    name: "Keyboard Enter",
    category: "action",
    file: "/sfx/Keyboard enter.mp3",
  },
  {
    id: "mouse-click",
    name: "Mouse Click",
    category: "action",
    file: "/sfx/mouse click.mp3",
  },
  {
    id: "mouse-click-1",
    name: "Mouse Click 1",
    category: "action",
    file: "/sfx/Mouse click 1.aac",
  },
  {
    id: "mouse-click-2-mp3",
    name: "Mouse Click 2",
    category: "action",
    file: "/sfx/Mouse click 2.mp3",
  },
  {
    id: "mouse-click-2-aac",
    name: "Mouse Click Rapid",
    category: "action",
    file: "/sfx/Mouse click 2.aac",
  },
  {
    id: "mouse-click-3",
    name: "Mouse Click 3",
    category: "action",
    file: "/sfx/Mouse click 3.aac",
  },

  // --- Impacts & Shatters (1 Sound) ---
  {
    id: "wine-glass-shatter",
    name: "Wine Glass Shatter",
    category: "impact",
    file: "/sfx/Wine Glass Shatter.mp3",
  },
];

// Audio element pool for instantaneous, zero-lag playback
const audioPool: Map<string, HTMLAudioElement> = new Map();

/**
 * Returns a randomized transition swoosh/action sound from the library.
 */
export function getRandomTransitionSfxId(): string {
  const transitionSounds = SFX_LIBRARY.filter(
    (item) => item.category === "swoosh" || item.category === "action"
  );
  if (transitionSounds.length === 0) return SFX_LIBRARY[0].id;
  const rand = Math.floor(Math.random() * transitionSounds.length);
  return transitionSounds[rand].id;
}

export function playAudioSfx(sfxId?: string) {
  if (typeof window === "undefined" || !sfxId || sfxId === "none") return;

  const targetId = sfxId === "random" ? getRandomTransitionSfxId() : sfxId;
  const sfxItem =
    SFX_LIBRARY.find((item) => item.id === targetId) || SFX_LIBRARY[0];

  try {
    let audio = audioPool.get(sfxItem.file);
    if (!audio) {
      audio = new Audio(sfxItem.file);
      audio.preload = "auto";
      audioPool.set(sfxItem.file, audio);
    }

    // Reset and play
    audio.currentTime = 0;
    audio.volume = 0.85;
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Ignore autoplay policy restrictions until user interacts
      });
    }
  } catch (e) {
    console.warn("Audio SFX play error:", e);
  }
}

// WebAudio buffer cache for offline export & video rendering
const sfxBufferCache: Map<string, AudioBuffer> = new Map();

/**
 * Decodes and returns an AudioBuffer for a given SFX ID or random transition sound.
 * Cached in memory to ensure instantaneous reuse across scene cuts.
 */
export async function getSfxAudioBuffer(
  sfxId: string | undefined,
  audioContext: AudioContext
): Promise<AudioBuffer | null> {
  if (typeof window === "undefined" || !sfxId || sfxId === "none") return null;

  const targetId = sfxId === "random" ? getRandomTransitionSfxId() : sfxId;
  const sfxItem =
    SFX_LIBRARY.find((item) => item.id === targetId) || SFX_LIBRARY[0];
  if (!sfxItem) return null;

  if (sfxBufferCache.has(sfxItem.file)) {
    return sfxBufferCache.get(sfxItem.file)!;
  }

  try {
    const res = await fetch(sfxItem.file);
    if (!res.ok) {
      console.warn(`SFX file fetch failed (${res.status}): ${sfxItem.file}`);
      return null;
    }
    const arrayBuffer = await res.arrayBuffer();
    // Use clone of arrayBuffer because decodeAudioData detaches the buffer
    const decodedBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
    sfxBufferCache.set(sfxItem.file, decodedBuffer);
    return decodedBuffer;
  } catch (err) {
    console.warn(`Failed to decode SFX buffer for ${sfxItem.file}:`, err);
    return null;
  }
}

// Fallback alias for backward compatibility
export const playSynthesizedSfx = (sfxId?: string) => playAudioSfx(sfxId);
