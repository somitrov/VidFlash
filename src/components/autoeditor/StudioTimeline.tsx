"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  ZoomIn,
  ZoomOut,
  Layers,
  Music,
  Type,
  Video,
  Sparkles,
  Shuffle,
  Volume2,
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
  onOpenTransitions,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(35); // pixels per second
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);

  const duration = Math.max(10, totalDurationSec);
  const timelineWidthPx = Math.max(800, duration * zoomLevel);

  const handleSeekFromEvent = useCallback(
    (clientX: number) => {
      if (!timelineRef.current) return;
      const rect = timelineRef.current.getBoundingClientRect();
      const clickX = clientX - rect.left + timelineRef.current.scrollLeft;
      const targetSec = Math.max(0, Math.min(duration, clickX / zoomLevel));
      onSeek(Number(targetSec.toFixed(2)));
    },
    [duration, zoomLevel, onSeek]
  );

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDraggingPlayhead(true);
    handleSeekFromEvent(e.clientX);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingPlayhead) {
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
  }, [isDraggingPlayhead, handleSeekFromEvent]);

  const playheadPosPx = currentTimeSec * zoomLevel;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 backdrop-blur-md space-y-3.5 shadow-2xl">
      {/* Timeline Controls Header */}
      <div className="flex items-center justify-between border-b border-slate-800/90 pb-2.5">
        <div className="flex items-center space-x-2.5 text-slate-200 font-bold text-xs sm:text-sm">
          <div className="w-6 h-6 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <span>Filmora Studio Multi-Track Timeline</span>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center space-x-2 text-xs text-slate-400">
          <button
            onClick={() => setZoomLevel((prev) => Math.max(15, prev - 5))}
            className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:text-white transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-[10px] w-12 text-center text-slate-400 font-semibold">
            {zoomLevel}px/s
          </span>
          <button
            onClick={() => setZoomLevel((prev) => Math.min(90, prev + 5))}
            className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:text-white transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Multi-Track Scroll Area */}
      <div
        ref={timelineRef}
        onMouseDown={handleMouseDown}
        className="relative w-full overflow-x-auto overflow-y-hidden bg-slate-950 rounded-xl border border-slate-800/90 select-none cursor-pointer py-2 pr-4 scrollbar-thin"
      >
        <div
          className="relative min-h-[220px] space-y-2.5"
          style={{ width: `${timelineWidthPx}px` }}
        >
          {/* Time Ruler */}
          <div className="h-6 border-b border-slate-800/80 relative flex items-end">
            {Array.from({ length: Math.ceil(duration) + 1 }).map((_, sec) => {
              const step = zoomLevel < 25 ? 10 : zoomLevel < 45 ? 5 : 2;
              if (sec % step !== 0) return null;
              return (
                <div
                  key={sec}
                  className="absolute bottom-0 text-[9px] font-mono text-slate-500 pl-1 border-l border-slate-800 flex items-end pb-0.5"
                  style={{ left: `${sec * zoomLevel}px`, height: "14px" }}
                >
                  {Math.floor(sec / 60)}:{(sec % 60).toString().padStart(2, "0")}
                </div>
              );
            })}
          </div>

          {/* Cut Transition Markers Line */}
          <div className="relative h-6 flex items-center">
            {clips.map((clip, idx) => {
              if (idx === 0) return null;
              const cutPosPx = clip.startSec * zoomLevel;
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
                  title={`Transition: ${clip.transition} (Click to customize)`}
                >
                  <div
                    className={`px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold border transition-all flex items-center space-x-1 ${
                      isCut
                        ? "bg-slate-900/90 border-slate-700 text-slate-400 hover:border-indigo-400 hover:text-indigo-300"
                        : "bg-indigo-950/90 border-indigo-500 text-indigo-300 shadow-md shadow-indigo-500/20"
                    }`}
                  >
                    <span>{isCut ? "⊘" : "✦"}</span>
                    <span className="text-[8px] uppercase">
                      {clip.transition.replace(/-/g, " ")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Track 1: Visual Image & Clip Track (V) */}
          <div className="relative h-20 bg-slate-900/50 rounded-xl border border-slate-800/80 p-1 flex items-center overflow-hidden">
            <div className="absolute left-2 top-2 z-10 text-[9px] font-bold font-mono px-1.5 py-0.5 rounded bg-slate-950/80 text-purple-400 border border-purple-500/30">
              V (Video)
            </div>

            {clips.map((clip, index) => {
              const leftPx = clip.startSec * zoomLevel;
              const widthPx = Math.max(20, clip.durationSec * zoomLevel);
              const isSelected = selectedClipId === clip.id;

              return (
                <div
                  key={clip.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectClip(clip.id);
                  }}
                  style={{ left: `${leftPx}px`, width: `${widthPx}px` }}
                  className={`absolute top-1 bottom-1 rounded-lg overflow-hidden border transition-all cursor-pointer group flex flex-col justify-between p-1 bg-slate-950 ${
                    isSelected
                      ? "border-amber-400 ring-2 ring-amber-400/40 z-10"
                      : "border-slate-800 hover:border-slate-600"
                  }`}
                >
                  {/* Clip Background Thumbnail */}
                  <img
                    src={clip.mediaUrl}
                    alt={clip.fileName}
                    className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
                  />

                  {/* Duration Badge */}
                  <div className="relative z-10 flex items-center justify-between">
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-950/90 text-amber-300 border border-amber-500/40">
                      {clip.durationSec.toFixed(1)}s
                    </span>
                    <span className="text-[8px] font-mono px-1 rounded bg-slate-900/80 text-slate-400">
                      #{index + 1}
                    </span>
                  </div>

                  {/* Filename & Timestamp Label */}
                  <div className="relative z-10 bg-slate-950/85 px-1 py-0.5 rounded text-[8px] font-mono text-slate-200 truncate">
                    {clip.fileName}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Track 2: Audio Waveform Track (A) */}
          <div className="relative h-12 bg-slate-900/50 rounded-xl border border-slate-800/80 p-1 flex items-center overflow-hidden">
            <div className="absolute left-2 top-1.5 z-10 text-[9px] font-bold font-mono px-1.5 py-0.5 rounded bg-slate-950/80 text-teal-400 border border-teal-500/30">
              A (Audio)
            </div>

            {audioTrack && audioTrack.waveformPeaks.length > 0 ? (
              <div
                className="absolute inset-0 flex items-center px-2 pointer-events-none"
                style={{ width: `${audioTrack.durationSec * zoomLevel}px` }}
              >
                <div className="w-full h-8 flex items-center space-x-[2px]">
                  {audioTrack.waveformPeaks.map((peak, pIndex) => (
                    <div
                      key={pIndex}
                      style={{ height: `${Math.max(10, peak * 100)}%` }}
                      className="flex-1 bg-gradient-to-t from-teal-500 to-emerald-400 rounded-full opacity-80"
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="w-full text-center text-[10px] text-slate-600 italic">
                No voiceover audio loaded
              </div>
            )}
          </div>

          {/* Track 3: Subtitles & Captions Track (T) */}
          <div className="relative h-9 bg-slate-900/50 rounded-xl border border-slate-800/80 p-1 flex items-center overflow-hidden">
            <div className="absolute left-2 top-1 z-10 text-[9px] font-bold font-mono px-1.5 py-0.2 rounded bg-slate-950/80 text-amber-400 border border-amber-500/30">
              T (Captions)
            </div>

            {subtitles.map((cue) => {
              const leftPx = cue.startSec * zoomLevel;
              const widthPx = Math.max(
                20,
                (cue.endSec - cue.startSec) * zoomLevel
              );
              return (
                <div
                  key={cue.id}
                  style={{ left: `${leftPx}px`, width: `${widthPx}px` }}
                  className="absolute top-1 bottom-1 rounded-md bg-amber-950/80 border border-amber-500/50 px-1.5 py-0.5 text-[9px] text-amber-200 truncate flex items-center font-medium shadow-sm"
                  title={`[${formatSecondsToTimecode(cue.startSec)} - ${formatSecondsToTimecode(cue.endSec)}] ${cue.text}`}
                >
                  {cue.text}
                </div>
              );
            })}
          </div>

          {/* Draggable Playhead Line */}
          <div
            style={{ left: `${playheadPosPx}px` }}
            className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-30 pointer-events-none transition-none shadow-lg shadow-amber-400/50"
          >
            {/* Playhead Top Handle */}
            <div className="w-3.5 h-3.5 bg-amber-400 transform -translate-x-[6px] -translate-y-1 rounded-full border-2 border-slate-950 shadow-md" />
          </div>
        </div>
      </div>
    </div>
  );
};
