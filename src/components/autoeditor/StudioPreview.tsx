"use client";

import React, { useEffect, useRef } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Tv,
  Smartphone,
  Square,
  Sparkles,
} from "lucide-react";
import {
  TimelineClip,
  SubtitleCue,
  SubtitleStyleConfig,
  AspectRatioPreset,
  ResolutionDimensions,
  StudioSettings,
} from "@/types/autoeditor";
import { renderCompositorFrame } from "@/lib/engine/canvasCompositor";
import { formatSecondsToTimecode } from "@/lib/engine/timestampParser";

interface StudioPreviewProps {
  clips: TimelineClip[];
  subtitles: SubtitleCue[];
  subtitleStyle: SubtitleStyleConfig;
  settings: StudioSettings;
  currentTimeSec: number;
  totalDurationSec: number;
  isPlaying: boolean;
  aspectRatio: AspectRatioPreset;
  resolution: ResolutionDimensions;
  onTogglePlay: () => void;
  onSeek: (timeSec: number) => void;
  onChangeAspectRatio: (ratio: AspectRatioPreset) => void;
}

export const StudioPreview: React.FC<StudioPreviewProps> = ({
  clips,
  subtitles,
  subtitleStyle,
  settings,
  currentTimeSec,
  totalDurationSec,
  isPlaying,
  aspectRatio,
  resolution,
  onTogglePlay,
  onSeek,
  onChangeAspectRatio,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Active Clip Index
  const activeClipIndex = clips.findIndex(
    (c) => currentTimeSec >= c.startSec && currentTimeSec < c.endSec
  );
  const currentClipNumber =
    activeClipIndex !== -1
      ? activeClipIndex + 1
      : clips.length > 0 && currentTimeSec >= totalDurationSec
      ? clips.length
      : 1;

  // 60FPS Live Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    renderCompositorFrame({
      ctx,
      width: resolution.width,
      height: resolution.height,
      currentTimeSec,
      totalDurationSec,
      clips,
      subtitles,
      subtitleStyle,
      fadeInSec: settings.fadeInSec,
      fadeOutSec: settings.fadeOutSec,
      enableParticles: settings.enableParticles,
      enableGlow: settings.enableGlow,
    });
  }, [
    currentTimeSec,
    totalDurationSec,
    clips,
    subtitles,
    subtitleStyle,
    resolution,
    settings,
  ]);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 backdrop-blur-md space-y-3.5 flex flex-col justify-between shadow-2xl">
      {/* Main Canvas Viewport Container */}
      <div className="relative w-full flex items-center justify-center min-h-[320px] max-h-[460px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800/90 p-2">
        <canvas
          ref={canvasRef}
          width={resolution.width}
          height={resolution.height}
          className="max-w-full max-h-[420px] object-contain rounded-xl shadow-2xl transition-all duration-200"
        />

        {clips.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-2 pointer-events-none bg-slate-950/80 backdrop-blur-xs">
            <Tv className="w-12 h-12 text-slate-600 animate-pulse" />
            <h4 className="text-sm font-bold text-slate-300">
              No Story Media Loaded
            </h4>
            <p className="text-xs text-slate-500 max-w-xs">
              Upload voiceover narration and drop image/clip folders, then click &quot;Build Timeline&quot; to preview.
            </p>
          </div>
        )}
      </div>

      {/* Filmora-Style Playback & Status Bar */}
      <div className="flex items-center justify-between px-2 pt-1 gap-2 flex-wrap">
        <div className="flex items-center space-x-3">
          {/* Big Play / Pause Button */}
          <button
            onClick={onTogglePlay}
            disabled={clips.length === 0}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
              clips.length > 0
                ? "bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-lg shadow-amber-500/30 cursor-pointer transform hover:scale-105 active:scale-95"
                : "bg-slate-800 text-slate-600 cursor-not-allowed"
            }`}
            title={isPlaying ? "Pause (Space)" : "Play (Space)"}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-slate-950" />
            ) : (
              <Play className="w-5 h-5 fill-slate-950 translate-x-0.5" />
            )}
          </button>

          {/* Timecode Readout */}
          <div className="font-mono text-xs sm:text-sm font-bold flex items-center space-x-1.5 pl-1">
            <span className="text-amber-400">
              {formatSecondsToTimecode(currentTimeSec)}
            </span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-300">
              {formatSecondsToTimecode(totalDurationSec)}
            </span>
          </div>

          {/* Skip / Replay Controls */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => onSeek(Math.max(0, currentTimeSec - 5))}
              className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-colors text-xs"
              title="Rewind 5s"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() =>
                onSeek(Math.min(totalDurationSec, currentTimeSec + 5))
              }
              className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-colors text-xs"
              title="Forward 5s"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Status Badge: NOW image X / Total */}
        {clips.length > 0 && (
          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center space-x-2 text-xs">
            <span className="text-slate-500 font-mono text-[10px] uppercase tracking-wider font-bold">
              NOW
            </span>
            <span className="text-slate-200 font-bold font-mono">
              image {currentClipNumber} / {clips.length}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
