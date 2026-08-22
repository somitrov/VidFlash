"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Volume2,
  Eye,
  GripVertical,
} from "lucide-react";
import {
  TimelineClip,
  AudioTrackState,
  SubtitleCue,
  MotionEffect,
  TransitionEffect,
} from "@/types/autoeditor";
import { formatSecondsToTimecode } from "@/lib/engine/timestampParser";

interface StudioTimelineProps {
  clips: TimelineClip[];
  audioTrack: AudioTrackState | null;
  subtitles: SubtitleCue[];
  currentTimeSec: number;
  totalDurationSec: number;
  selectedClipId: string | null;
  onSelectClip: (id: string | null) => void;
  onSeek: (timeSec: number) => void;
  onUpdateClipMotion: (clipId: string, motion: MotionEffect) => void;
  onUpdateClipTransition: (clipId: string, transition: TransitionEffect) => void;
  onResizeBoundary?: (clipIndex: number, newCutSec: number) => void;
  onOpenTransitions?: () => void;
}

export const StudioTimeline: React.FC<StudioTimelineProps> = ({
  clips,
  audioTrack,
  subtitles,
  currentTimeSec,
  totalDurationSec,
  selectedClipId,
  onSelectClip,
  onSeek,
  onUpdateClipMotion,
  onUpdateClipTransition,
  onResizeBoundary,
  onOpenTransitions,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(30); // pixels per second (0 = Fit All Mode)
  const [isFitMode, setIsFitMode] = useState<boolean>(false);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);

  // Active boundary drag state { index, currentCutSec }
  const [activeDragBoundary, setActiveDragBoundary] = useState<{
    index: number;
    sec: number;
  } | null>(null);

  const duration = Math.max(10, totalDurationSec);

  // Compute effective zoom: in Fit mode, stretch across container width
  const containerWidth = timelineRef.current?.clientWidth || 1200;
  const effectiveZoom = isFitMode
    ? Math.max(8, (containerWidth - 90) / duration)
    : zoomLevel;

  const timelineTrackWidthPx = duration * effectiveZoom;

  const handleSeekFromEvent = useCallback(
    (clientX: number) => {
      if (!timelineRef.current) return;
      const rect = timelineRef.current.getBoundingClientRect();
      const clickX = clientX - rect.left + timelineRef.current.scrollLeft - 70;
      const targetSec = Math.max(0, Math.min(duration, clickX / effectiveZoom));
      onSeek(Number(targetSec.toFixed(2)));
    },
    [duration, effectiveZoom, onSeek]
  );

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeDragBoundary) return;
    setIsDraggingPlayhead(true);
    handleSeekFromEvent(e.clientX);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingPlayhead && !activeDragBoundary) {
        handleSeekFromEvent(e.clientX);
      }
    };
    const handleMouseUp = () => {
      if (isDraggingPlayhead) {
        setIsDraggingPlayhead(false);
      }
    };

    if (isDraggingPlayhead) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingPlayhead, activeDragBoundary, handleSeekFromEvent]);

  // Handle Interactive Boundary Resizing
  const handleBoundaryMouseDown = (
    e: React.MouseEvent,
    clipIndex: number,
    initialCutSec: number
  ) => {
    e.stopPropagation();
    setActiveDragBoundary({ index: clipIndex, sec: initialCutSec });

    const moveHandler = (moveEvent: MouseEvent) => {
      if (!timelineRef.current) return;
      const rect = timelineRef.current.getBoundingClientRect();
      const clickX =
        moveEvent.clientX - rect.left + timelineRef.current.scrollLeft - 70;
      const rawSec = clickX / effectiveZoom;

      const leftClip = clips[clipIndex];
      const rightClip = clips[clipIndex + 1];
      if (!leftClip || !rightClip) return;

      const minDur = 0.3;
      const clamped = Math.max(
        leftClip.startSec + minDur,
        Math.min(rightClip.endSec - minDur, rawSec)
      );

      setActiveDragBoundary({ index: clipIndex, sec: Number(clamped.toFixed(2)) });
    };

    const upHandler = (upEvent: MouseEvent) => {
      window.removeEventListener("mousemove", moveHandler);
      window.removeEventListener("mouseup", upHandler);

      if (!timelineRef.current) {
        setActiveDragBoundary(null);
        return;
      }
      const rect = timelineRef.current.getBoundingClientRect();
      const clickX =
        upEvent.clientX - rect.left + timelineRef.current.scrollLeft - 70;
      const rawSec = clickX / effectiveZoom;

      const leftClip = clips[clipIndex];
      const rightClip = clips[clipIndex + 1];
      if (leftClip && rightClip && onResizeBoundary) {
        const minDur = 0.3;
        const finalSec = Math.max(
          leftClip.startSec + minDur,
          Math.min(rightClip.endSec - minDur, rawSec)
        );
        onResizeBoundary(clipIndex, Number(finalSec.toFixed(2)));
      }
      setActiveDragBoundary(null);
    };

    window.addEventListener("mousemove", moveHandler);
    window.addEventListener("mouseup", upHandler);
  };

  const playheadPosPx = 70 + currentTimeSec * effectiveZoom;

  return (
    <div className="bg-[#18181c] border border-[#2b2b36] rounded-xl overflow-hidden shadow-2xl space-y-0">
      {/* Clean Timeline Top Toolbar */}
      <div className="bg-[#121215] border-b border-[#2b2b36] px-3 py-1.5 flex items-center justify-between text-xs flex-wrap gap-2">
        {/* Left: Track Summary */}
        <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-400">
          <span className="text-purple-400 font-bold">V1</span>
          <span>•</span>
          <span className="text-teal-400 font-bold">A1</span>
          <span>•</span>
          <span className="text-emerald-400 font-bold">T1</span>
          <span className="text-slate-500 ml-2">
            ({clips.length} images • {formatSecondsToTimecode(totalDurationSec)})
          </span>
        </div>

        {/* Right: Fit Mode & Zoom Slider */}
        <div className="flex items-center space-x-3 text-slate-400">
          <button
            onClick={() => setIsFitMode((prev) => !prev)}
            className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold flex items-center space-x-1 transition-colors border ${
              isFitMode
                ? "bg-red-950/80 border-red-500 text-red-300"
                : "bg-[#1f1f26] border-[#2b2b36] text-slate-300 hover:text-white"
            }`}
            title="Fit all clips to screen width"
          >
            {isFitMode ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
            <span>{isFitMode ? "Fit Active" : "Fit All"}</span>
          </button>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => {
                setIsFitMode(false);
                setZoomLevel((prev) => Math.max(8, prev - 6));
              }}
              className="p-1 rounded hover:bg-[#252530] hover:text-white"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <input
              type="range"
              min="8"
              max="90"
              value={effectiveZoom}
              onChange={(e) => {
                setIsFitMode(false);
                setZoomLevel(parseInt(e.target.value, 10));
              }}
              className="w-24 accent-red-500 h-1 bg-[#252530] rounded cursor-pointer"
            />
            <button
              onClick={() => {
                setIsFitMode(false);
                setZoomLevel((prev) => Math.min(90, prev + 6));
              }}
              className="p-1 rounded hover:bg-[#252530] hover:text-white"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Multi-Track Scroll Area */}
      <div
        ref={timelineRef}
        onMouseDown={handleMouseDown}
        className="relative w-full overflow-x-auto overflow-y-hidden bg-[#0e0e11] select-none cursor-pointer py-1 scrollbar-thin"
      >
        <div
          className="relative min-h-[220px] space-y-1.5"
          style={{ width: isFitMode ? "100%" : `${timelineTrackWidthPx + 100}px` }}
        >
          {/* Time Ruler */}
          <div className="h-6 border-b border-[#2b2b36] relative flex items-end ml-[70px]">
            {Array.from({ length: Math.ceil(duration) + 1 }).map((_, sec) => {
              const step =
                effectiveZoom < 15
                  ? 30
                  : effectiveZoom < 30
                  ? 15
                  : effectiveZoom < 50
                  ? 5
                  : 2;
              if (sec % step !== 0) return null;
              return (
                <div
                  key={sec}
                  className="absolute bottom-0 text-[9px] font-mono text-slate-500 pl-1 border-l border-[#2b2b36] flex items-end pb-0.5"
                  style={{ left: `${sec * effectiveZoom}px`, height: "14px" }}
                >
                  01:00:{sec.toString().padStart(2, "0")}:00
                </div>
              );
            })}
          </div>

          {/* Cut Transition Markers Line */}
          <div className="relative h-5 flex items-center ml-[70px]">
            {clips.map((clip, idx) => {
              if (idx === 0) return null;
              let cutSec = clip.startSec;
              if (activeDragBoundary && activeDragBoundary.index === idx - 1) {
                cutSec = activeDragBoundary.sec;
              }
              const cutPosPx = cutSec * effectiveZoom;
              const isCut = clip.transition === "cut";
              return (
                <div
                  key={`cut_${clip.id}`}
                  style={{ left: `${cutPosPx}px` }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenTransitions?.();
                  }}
                  className="absolute -translate-x-1/2 z-20 flex items-center justify-center cursor-pointer group"
                  title={`Transition: ${clip.transition}`}
                >
                  <div
                    className={`px-1.5 py-0.2 rounded text-[8px] font-mono font-bold border transition-all flex items-center space-x-0.5 ${
                      isCut
                        ? "bg-[#18181c] border-[#363644] text-slate-400 hover:border-red-400 hover:text-red-300"
                        : "bg-red-950 border-red-500 text-red-300 shadow-sm"
                    }`}
                  >
                    <span>{isCut ? "⊘" : "✦"}</span>
                    <span className="uppercase text-[7px]">
                      {clip.transition.replace(/-/g, " ")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* TRACK 1: Visual Video (V1) */}
          <div className="relative h-20 bg-[#141418] border-y border-[#202028] flex items-center">
            {/* Left Track Header (V1) */}
            <div className="sticky left-0 z-20 w-[70px] h-full bg-[#18181c] border-r border-[#2b2b36] flex flex-col justify-between p-1.5 text-[10px] font-mono">
              <div className="flex items-center justify-between">
                <span className="text-purple-400 font-bold">V1</span>
                <Eye className="w-3 h-3 text-slate-500 hover:text-slate-300" />
              </div>
              <span className="text-[8px] text-slate-500 truncate">
                {clips.length} Clips
              </span>
            </div>

            {/* Video Clips Track */}
            <div className="relative flex-1 h-full flex items-center">
              {clips.map((clip, index) => {
                let startSec = clip.startSec;
                let endSec = clip.endSec;

                if (activeDragBoundary) {
                  if (activeDragBoundary.index === index - 1) {
                    startSec = activeDragBoundary.sec;
                  }
                  if (activeDragBoundary.index === index) {
                    endSec = activeDragBoundary.sec;
                  }
                }

                const currentDur = Math.max(0.2, endSec - startSec);
                const leftPx = startSec * effectiveZoom;
                const widthPx = Math.max(12, currentDur * effectiveZoom);
                const isSelected = selectedClipId === clip.id;

                return (
                  <div
                    key={clip.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectClip(clip.id);
                    }}
                    style={{ left: `${leftPx}px`, width: `${widthPx}px` }}
                    className={`absolute top-1 bottom-1 rounded overflow-hidden border transition-all cursor-pointer group flex flex-col justify-between p-1 bg-[#1a1a22] ${
                      isSelected
                        ? "border-red-500 ring-1 ring-red-500 z-10"
                        : "border-[#2b2b36] hover:border-slate-500"
                    }`}
                  >
                    {/* Thumbnail Image */}
                    <img
                      src={clip.mediaUrl}
                      alt={clip.fileName}
                      className="absolute inset-0 w-full h-full object-cover opacity-65 group-hover:opacity-85 transition-opacity"
                    />

                    {/* Duration Badge */}
                    <div className="relative z-10 flex items-center justify-between">
                      <span className="text-[8px] font-mono font-bold px-1 rounded bg-black/80 text-amber-300 border border-amber-500/40">
                        {currentDur.toFixed(1)}s
                      </span>
                      <span className="text-[7px] font-mono px-1 rounded bg-black/60 text-slate-400">
                        #{index + 1}
                      </span>
                    </div>

                    {/* Clip Name */}
                    <div className="relative z-10 bg-black/85 px-1 py-0.2 rounded text-[7px] font-mono text-slate-200 truncate">
                      {clip.fileName}
                    </div>

                    {/* Interactive Clip Boundary Sliding Handle on Right Edge */}
                    {index < clips.length - 1 && (
                      <div
                        onMouseDown={(e) =>
                          handleBoundaryMouseDown(e, index, clip.endSec)
                        }
                        className="absolute right-0 top-0 bottom-0 w-3 cursor-col-resize hover:bg-red-500/50 flex items-center justify-center z-20 group/handle transition-colors"
                        title="Drag left/right to adjust clip hold duration"
                      >
                        <div className="w-1 h-5 rounded-full bg-slate-400 group-hover/handle:bg-white transition-colors" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* TRACK 2: Voiceover Audio (A1) */}
          <div className="relative h-12 bg-[#141418] border-b border-[#202028] flex items-center">
            {/* Left Track Header (A1) */}
            <div className="sticky left-0 z-20 w-[70px] h-full bg-[#18181c] border-r border-[#2b2b36] flex flex-col justify-between p-1.5 text-[10px] font-mono">
              <div className="flex items-center justify-between">
                <span className="text-teal-400 font-bold">A1</span>
                <Volume2 className="w-3 h-3 text-slate-500 hover:text-slate-300" />
              </div>
              <span className="text-[8px] text-teal-400 truncate">Audio 1</span>
            </div>

            {/* Audio Waveform Track */}
            <div className="relative flex-1 h-full flex items-center">
              {audioTrack && audioTrack.waveformPeaks.length > 0 ? (
                <div
                  className="absolute inset-0 flex items-center px-1 pointer-events-none"
                  style={{ width: `${audioTrack.durationSec * effectiveZoom}px` }}
                >
                  <div className="w-full h-8 flex items-center space-x-[1.5px]">
                    {audioTrack.waveformPeaks.map((peak, pIndex) => (
                      <div
                        key={pIndex}
                        style={{ height: `${Math.max(10, peak * 100)}%` }}
                        className="flex-1 bg-gradient-to-t from-teal-600 to-emerald-400 rounded-full opacity-80"
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="w-full text-center text-[9px] text-slate-600 italic">
                  No audio loaded in A1
                </div>
              )}
            </div>
          </div>

          {/* TRACK 3: Captions & Subtitles (T1) */}
          <div className="relative h-8 bg-[#141418] border-b border-[#202028] flex items-center">
            {/* Left Track Header (T1) */}
            <div className="sticky left-0 z-20 w-[70px] h-full bg-[#18181c] border-r border-[#2b2b36] flex flex-col justify-between p-1 text-[10px] font-mono">
              <span className="text-emerald-400 font-bold">T1</span>
              <span className="text-[7px] text-slate-500">Captions</span>
            </div>

            {/* Subtitle Cue blocks */}
            <div className="relative flex-1 h-full flex items-center">
              {subtitles.map((cue) => {
                const leftPx = cue.startSec * effectiveZoom;
                const widthPx = Math.max(
                  20,
                  (cue.endSec - cue.startSec) * effectiveZoom
                );
                return (
                  <div
                    key={cue.id}
                    style={{ left: `${leftPx}px`, width: `${widthPx}px` }}
                    className="absolute top-1 bottom-1 rounded bg-emerald-950/80 border border-emerald-500/50 px-1 text-[8px] text-emerald-200 truncate flex items-center font-medium"
                    title={`[${formatSecondsToTimecode(cue.startSec)}] ${cue.text}`}
                  >
                    {cue.text}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Red DaVinci Playhead Needle */}
          <div
            style={{ left: `${playheadPosPx}px` }}
            className="absolute top-0 bottom-0 w-[1.5px] bg-red-500 z-30 pointer-events-none transition-none shadow-lg shadow-red-500/50"
          >
            {/* Red DaVinci Playhead Top Flag */}
            <div className="w-3 h-3.5 bg-red-500 transform -translate-x-[5px] -translate-y-0.5 clip-flag shadow-md" />
          </div>
        </div>
      </div>
    </div>
  );
};
