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
  {
    id: "clean-fast-swoosh",
    name: "Fast Swoosh (Default)",
    category: "swoosh",
    file: "/sfx/clean-fast-swooshaiff-14784.mp3",
  },
  {
    id: "whoosh-effect-3",
    name: "Cinematic Whoosh",
    category: "swoosh",
    file: "/sfx/whoosh-effect-3-225188.mp3",
  },
  {
    id: "lens-flare",
    name: "Lens Flare Transition",
    category: "swoosh",
    file: "/sfx/Lens flare transition sound effect.mp3",
  },
  {
    id: "camera-shutter",
    name: "Camera Shutter",
    category: "action",
    file: "/sfx/-camera-shutter.mp3",
  },
  {
    id: "camera-flash",
    name: "Camera Flash Shot",
    category: "action",
    file: "/sfx/camera shot flash 2.mp3",
  },
  {
    id: "hit-1",
    name: "Heavy Impact Hit",
    category: "impact",
    file: "/sfx/Hit 1.mp3",
  },
  {
    id: "fast-impact",
    name: "Fast Blow Impact",
    category: "impact",
    file: "/sfx/fast-impact-blow-2655.mp3",
  },
  {
    id: "arrow-impact",
    name: "Arrow Impact",
    category: "impact",
    file: "/sfx/arrow-impact-87260.mp3",
  },
  {
    id: "sword-thud",
    name: "Sword Strike Thud",
    category: "impact",
    file: "/sfx/sword-thud-47635.mp3",
  },
  {
    id: "golem-stomp",
    name: "Golem Stomp",
    category: "impact",
    file: "/sfx/mixkit-golem-stomp-c-3046.mp3",
  },
  {
    id: "coin-received",
    name: "Coin Received Chime",
    category: "ui",
    file: "/sfx/coin-recieved-230517.mp3",
  },
  {
    id: "iphone-send",
    name: "iPhone Send Swoosh",
    category: "ui",
    file: "/sfx/Iphone Send.mp3",
  },
  {
    id: "iphone-receive",
    name: "iPhone Receive Ping",
    category: "ui",
    file: "/sfx/Iphone Receive.mp3",
  },
  {
    id: "tv-glitch",
    name: "TV Static Glitch",
    category: "action",
    file: "/sfx/tv-glitch-6245.mp3",
  },
  {
    id: "beep-scratch",
    name: "Scratch Glitch",
    category: "action",
    file: "/sfx/beep-static-scratch-180801_0182-001-097-000-001-94862.mp3",
  },
  {
    id: "censor-beep",
    name: "Censor Beep",
    category: "ui",
    file: "/sfx/censor-beep-88052.mp3",
  },
  {
    id: "bone-break",
    name: "Bone Break Echo",
    category: "action",
    file: "/sfx/bone-breaking-with-echo-2937.mp3",
  },
  {
    id: "glitch-005",
    name: "Digital Glitch Beep",
    category: "ui",
    file: "/sfx/005.mp3",
  },
];

// Audio element pool for instantaneous, zero-lag playback
const audioPool: Map<string, HTMLAudioElement> = new Map();

export function playAudioSfx(sfxId?: string) {
  if (typeof window === "undefined") return;

  const targetId = sfxId || "clean-fast-swoosh";
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

// Fallback alias for backward compatibility
export const playSynthesizedSfx = (sfxId?: string) => playAudioSfx(sfxId);
