export type AspectRatioPreset = "16:9" | "9:16" | "1:1";

export interface ResolutionDimensions {
  width: number;
  height: number;
}

export type MotionEffect =
  | "none"
  | "ken-burns-zoom-in"
  | "ken-burns-zoom-out"
  | "pan-left"
  | "pan-right"
  | "pulse";

export type TransitionEffect =
  | "cut"
  | "crossfade"
  | "fade-to-black"
  | "flash-white"
  | "light-leak"
  | "glow-flash"
  | "zoom-in"
  | "zoom-out"
  | "zoom-blur"
  | "glitch"
  | "stretch-glow"
  | "whip-pan-left"
  | "whip-pan-right"
  | "whip-pan-up"
  | "whip-pan-down"
  | "wipe-left"
  | "wipe-right"
  | "slide-left"
  | "slide-right"
  | "circle-open"
  | "spin-360";

export type HardwareProfile = "balanced" | "turbo" | "silent";

export type RenderProfileTier =
  | "low-720p"
  | "balanced-1080p"
  | "high-1080p"
  | "2k-1440p"
  | "4k-2160p";

export interface StudioSettings {
  fadeInSec: number;
  fadeOutSec: number;
  randomTransitions: boolean;
  selectedTransition?: TransitionEffect;
  fps: 24 | 30 | 60;
  renderProfile: RenderProfileTier;
  qualityPreset?: "optimized" | "high" | "compact";
  hardwareProfile?: HardwareProfile;
  enableSfx: boolean;
  selectedSfxId?: string;
  enableParticles: boolean;
  enableGlow: boolean;
  // Visual Effects & Overlays Suite
  enableFilmGrain?: boolean;
  enableOldCinema?: boolean;
  enableGeometricGrid?: boolean;
  enableBlackAndWhite?: boolean;
  enableVhsScanlines?: boolean;
  enableLetterbox?: boolean;
  enablePrismGlow?: boolean;
  enableVintageSepia?: boolean;
}

export interface TimelineClip {
  id: string;
  file: File;
  fileName: string;
  fileType: "image" | "video";
  mediaUrl: string;
  imageElement?: HTMLImageElement | null;
  videoElement?: HTMLVideoElement | null;
  naturalWidth: number;
  naturalHeight: number;
  startSec: number;
  endSec: number;
  durationSec: number;
  parsedTimestampSec: number | null;
  motion: MotionEffect;
  transition: TransitionEffect;
  transitionDuration: number;
}

export interface AudioTrackPart {
  fileName: string;
  durationSec: number;
  startSec: number;
  endSec: number;
}

export interface AudioTrackState {
  file: File | File[] | null;
  fileName: string;
  parts?: AudioTrackPart[];
  durationSec: number;
  audioBuffer: AudioBuffer | null;
  waveformPeaks: number[];
  audioUrl: string | null;
}

export interface BgmTrackState {
  file: File | null;
  fileName: string;
  durationSec: number;
  audioBuffer: AudioBuffer | null;
  audioUrl: string | null;
  volume: number;
  autoDucking: boolean;
  duckedVolume: number;
}

export interface SubtitleStyleConfig {
  fontSize: number;
  fontFamily: string;
  color: string;
  strokeColor: string;
  strokeWidth: number;
  bgColor: string;
  showBackground: boolean;
  position: "bottom" | "center" | "top";
  yOffsetPercent: number;
  highlightActiveWord: boolean;
  highlightColor: string;
}

export interface SubtitleCue {
  id: string;
  text: string;
  startSec: number;
  endSec: number;
  words?: { word: string; startSec: number; endSec: number }[];
}

export interface ExportConfig {
  aspectRatio: AspectRatioPreset;
  resolution: ResolutionDimensions;
  fps: 24 | 30 | 60;
  format: "mp4" | "webm";
  renderProfile?: RenderProfileTier;
  qualityPreset?: "optimized" | "high" | "compact";
  hardwareProfile?: HardwareProfile;
  fadeInSec?: number;
  fadeOutSec?: number;
  enableParticles?: boolean;
  enableGlow?: boolean;
  enableFilmGrain?: boolean;
  enableOldCinema?: boolean;
  enableGeometricGrid?: boolean;
  enableBlackAndWhite?: boolean;
  enableVhsScanlines?: boolean;
  enableLetterbox?: boolean;
  enablePrismGlow?: boolean;
  enableVintageSepia?: boolean;
}
