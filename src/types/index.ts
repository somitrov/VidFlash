export type CanvasPreset =
  | "gradient-indigo"
  | "gradient-sunset"
  | "gradient-emerald"
  | "gradient-dark"
  | "gradient-cyber"
  | "solid-slate"
  | "solid-midnight"
  | "nature-forest"
  | "nature-aurora"
  | "nature-ocean"
  | "nature-sunset"
  | "nature-cosmic"
  | "custom-image";

export type ResolutionPreset = "144p" | "240p" | "360p" | "720p" | "1080p";

export interface CanvasSettings {
  preset: CanvasPreset;
  customBgImage: string | null;
  overlayOpacity: number;
  resolution: {
    width: number;
    height: number;
  };
  resolutionPreset: ResolutionPreset;
  meetingTitle: string;
  meetingSubtitle: string;
  participants: string;
  badgeText: string;
  showBadge: boolean;
  titleColor: string;
  subtitleColor: string;
  badgeColor: string;
  fontSize: "normal" | "large" | "huge";
  textAlign: "left" | "center" | "right";
  template: "google-meet" | "confidential" | "minimal" | "podcast";
  audioCopyMode: boolean; // Try copying audio stream directly without re-encoding
  frameRate: number; // 1 fps for extreme encoding speed
  spectrumStyle: "ncs-circular" | "frequency-bars" | "none";
  animatedVideoSpectrum: boolean; // Toggle: false = 3-sec Turbo WASM, true = dynamic video frames
  spectrumColor: string;
}

export interface MediaFileState {
  file: File | null;
  mediaType: "audio" | "video" | null;
  fileName: string;
  fileSize: number;
  duration: number;
  formattedDuration: string;
  previewUrl: string | null;
}

export type ProcessingStatus =
  | "idle"
  | "loading-wasm"
  | "extracting-audio"
  | "rendering-frame"
  | "muxing"
  | "completed"
  | "error";

export interface ProcessingProgress {
  status: ProcessingStatus;
  progress: number;
  timeSec: number;
  logs: string[];
  errorMessage: string | null;
  outputBlobUrl: string | null;
  outputFileName: string | null;
}
