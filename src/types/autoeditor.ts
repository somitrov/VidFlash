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
  | "wipe-left"
  | "wipe-right"
  | "slide-left"
  | "slide-right"
  | "zoom-in"
  | "circle-open"
  | "flash-white";

export interface StudioSettings {
  fadeInSec: number;
  fadeOutSec: number;
  randomTransitions: boolean;
  selectedTransition: TransitionEffect;
  fps: 24 | 30 | 60;
  enableSfx: boolean;
  enableParticles: boolean;
  enableGlow: boolean;
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
  fadeInSec?: number;
  fadeOutSec?: number;
  enableParticles?: boolean;
  enableGlow?: boolean;
}
