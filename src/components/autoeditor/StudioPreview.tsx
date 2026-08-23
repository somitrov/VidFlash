"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  SkipBack,
  SkipForward,
  Square,
  Maximize2,
  Tv,
  Smartphone,
  Repeat,
  Pencil,
  Check,
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
  projectName?: string;
  totalClipsCount?: number;
  onTogglePlay: () => void;
  onSeek: (timeSec: number) => void;
  onChangeAspectRatio: (ratio: AspectRatioPreset) => void;
  onUpdateProjectName?: (name: string) => void;
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
  projectName,
  totalClipsCount,
  onTogglePlay,
  onSeek,
  onChangeAspectRatio,
  onUpdateProjectName,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [clickFeedback, setClickFeedback] = useState<{
    show: boolean;
    type: "play" | "pause";
  }>({ show: false, type: "play" });
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [tempName, setTempName] = useState<string>(projectName || "Auto-Sync Sequence");
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (projectName) {
      setTempName(projectName);
    }
  }, [projectName]);

  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  const handleSaveName = () => {
    const trimmed = tempName.trim();
    if (trimmed && onUpdateProjectName) {
      onUpdateProjectName(trimmed);
    } else {
      setTempName(projectName || "Auto-Sync Sequence");
    }
    setIsEditingName(false);
  };

  const handleKeyDownName = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSaveName();
    } else if (e.key === "Escape") {
      setTempName(projectName || "Auto-Sync Sequence");
      setIsEditingName(false);
    }
  };

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

  // Single Button Aspect Ratio Layering / Cycling: 16:9 -> 9:16 -> 1:1 -> 16:9
  const handleCycleAspectRatio = () => {
    if (aspectRatio === "16:9") {
      onChangeAspectRatio("9:16");
    } else if (aspectRatio === "9:16") {
      onChangeAspectRatio("1:1");
    } else {
      onChangeAspectRatio("16:9");
    }
  };

  // YouTube-Style Left Click Play/Pause Handler
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.button !== 0 || clips.length === 0) return;

    onTogglePlay();

    setClickFeedback({
      show: true,
      type: isPlaying ? "pause" : "play",
    });

    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }
    feedbackTimeoutRef.current = setTimeout(() => {
      setClickFeedback((prev) => ({ ...prev, show: false }));
    }, 550);
  };

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
      enableFilmGrain: settings.enableFilmGrain,
      enableOldCinema: settings.enableOldCinema,
      enableGeometricGrid: settings.enableGeometricGrid,
      enableBlackAndWhite: settings.enableBlackAndWhite,
      enableVhsScanlines: settings.enableVhsScanlines,
      enableLetterbox: settings.enableLetterbox,
      enablePrismGlow: settings.enablePrismGlow,
      enableVintageSepia: settings.enableVintageSepia,
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
    <div className="bg-[#18181c] border border-[#2b2b36] rounded-xl overflow-hidden shadow-2xl flex flex-col justify-between h-[520px]">
      {/* DaVinci Resolve Viewer Top Bar with Project Name & Images Info */}
      <div className="bg-[#121215] border-b border-[#2b2b36] px-3 py-1.5 flex items-center justify-between font-mono text-xs text-slate-300">
        <div className="flex items-center space-x-2">
          <span className="text-amber-400 font-bold">
            {formatSecondsToTimecode(currentTimeSec)}
          </span>
        </div>

        {/* Center: Sequence & Project Name Editable Badge */}
        <div className="flex items-center space-x-2 max-w-[260px] sm:max-w-sm">
          {isEditingName ? (
            <div className="flex items-center space-x-1 bg-[#1e1e26] px-1.5 py-0.5 rounded border border-indigo-500/60 shadow-sm">
              <input
                ref={nameInputRef}
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onKeyDown={handleKeyDownName}
                onBlur={handleSaveName}
                className="bg-transparent text-[11px] font-bold text-white outline-none w-32 sm:w-44 font-mono placeholder:text-slate-500"
                placeholder="Video Name"
                maxLength={60}
              />
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSaveName();
                }}
                className="p-0.5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 rounded transition-colors"
                title="Save"
              >
                <Check className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditingName(true)}
              className="group/name relative flex items-center space-x-1.5 text-[11px] font-bold text-white bg-[#1e1e26] hover:bg-[#252532] hover:border-indigo-500/40 px-2.5 py-0.5 rounded border border-[#2b2b36] transition-all cursor-pointer truncate max-w-[160px] sm:max-w-[220px]"
              title="Click to rename video"
            >
              <span className="truncate">{projectName || "Auto-Sync Sequence"}</span>
              <Pencil className="w-2.5 h-2.5 text-slate-400 opacity-60 group-hover/name:opacity-100 group-hover/name:text-indigo-300 shrink-0 transition-opacity" />
            </button>
          )}

          {totalClipsCount !== undefined && totalClipsCount > 0 && (
            <span className="text-[10px] font-mono font-bold text-indigo-300 bg-indigo-950/70 border border-indigo-500/30 px-2 py-0.5 rounded shrink-0">
              {totalClipsCount} Images
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-slate-400">
            {formatSecondsToTimecode(totalDurationSec)}
          </span>
        </div>
      </div>

      {/* Center Canvas Viewport with YouTube-Style Left-Click Play/Pause */}
      <div
        onClick={handleCanvasClick}
        className={`relative flex-1 w-full flex items-center justify-center bg-[#09090b] overflow-hidden p-2 select-none ${
          clips.length > 0 ? "cursor-pointer group" : ""
        }`}
        title={clips.length > 0 ? (isPlaying ? "Click to Pause" : "Click to Play") : undefined}
      >
        <canvas
          ref={canvasRef}
          width={resolution.width}
          height={resolution.height}
          className="max-w-full max-h-[380px] object-contain rounded shadow-2xl transition-all duration-200 border border-[#1f1f26]"
        />

        {/* YouTube-Style Play/Pause Quick Tap Feedback Indicator */}
        {clickFeedback.show && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <div className="w-16 h-16 rounded-full bg-black/75 border border-white/20 text-white flex items-center justify-center shadow-2xl backdrop-blur-sm animate-in zoom-in-75 fade-in duration-150">
              {clickFeedback.type === "play" ? (
                <Play className="w-8 h-8 fill-white translate-x-0.5" />
              ) : (
                <Pause className="w-8 h-8 fill-white" />
              )}
            </div>
          </div>
        )}

        {clips.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-2 pointer-events-none bg-black/75 backdrop-blur-xs">
            <Tv className="w-10 h-10 text-slate-600 animate-pulse" />
            <h4 className="text-xs font-bold text-slate-300">
              DaVinci Monitor Idle
            </h4>
            <p className="text-[10px] text-slate-500 max-w-xs">
              Load voiceover audio & drop image folders, then click &quot;Build Timeline&quot;.
            </p>
          </div>
        )}
      </div>

      {/* DaVinci Resolve Viewer Transport Controls */}
      <div className="bg-[#121215] border-t border-[#2b2b36] px-3 py-2 flex items-center justify-between text-xs flex-wrap gap-2">
        {/* Left: Single Aspect Ratio Layering Button (Cycles 16:9 -> 9:16 -> 1:1 -> 16:9) */}
        <button
          onClick={handleCycleAspectRatio}
          className="px-2.5 py-1 rounded bg-[#1c1c24] border border-[#2b2b36] hover:border-indigo-500 text-slate-200 text-[10px] font-mono font-bold flex items-center space-x-1.5 transition-colors group cursor-pointer"
          title="Click to cycle ratio: 16:9 → 9:16 → 1:1"
        >
          <span className="text-white font-bold">{aspectRatio}</span>
          <span className="text-[9px] text-slate-500 group-hover:text-slate-300">↻</span>
        </button>

        {/* Center: DaVinci Transport Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onSeek(0)}
            className="p-1.5 rounded bg-[#1c1c24] border border-[#2b2b36] text-slate-400 hover:text-white transition-colors"
            title="Rewind to Start"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onSeek(Math.max(0, currentTimeSec - 5))}
            className="p-1.5 rounded bg-[#1c1c24] border border-[#2b2b36] text-slate-400 hover:text-white transition-colors"
            title="Step Back 5s"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Main Play/Pause Button */}
          <button
            onClick={onTogglePlay}
            disabled={clips.length === 0}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
              clips.length > 0
                ? "bg-red-600 hover:bg-red-500 text-white font-bold shadow-md shadow-red-600/30 cursor-pointer transform hover:scale-105 active:scale-95"
                : "bg-[#1c1c24] text-slate-600 cursor-not-allowed"
            }`}
            title={isPlaying ? "Pause (Space)" : "Play (Space)"}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-white" />
            ) : (
              <Play className="w-4 h-4 fill-white translate-x-0.5" />
            )}
          </button>

          <button
            onClick={() =>
              onSeek(Math.min(totalDurationSec, currentTimeSec + 5))
            }
            className="p-1.5 rounded bg-[#1c1c24] border border-[#2b2b36] text-slate-400 hover:text-white transition-colors"
            title="Step Forward 5s"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onSeek(totalDurationSec)}
            className="p-1.5 rounded bg-[#1c1c24] border border-[#2b2b36] text-slate-400 hover:text-white transition-colors"
            title="Fast Forward to End"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: NOW Image Indicator */}
        {clips.length > 0 && (
          <div className="px-2 py-1 rounded bg-[#1c1c24] border border-[#2b2b36] text-[10px] font-mono font-bold text-slate-300">
            Clip {currentClipNumber} / {clips.length}
          </div>
        )}
      </div>
    </div>
  );
};
