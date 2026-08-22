"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Sparkles,
  Download,
  CheckCircle2,
  AlertCircle,
  X,
  Cpu,
  Tv,
  Music,
  ImageIcon,
} from "lucide-react";
import {
  TimelineClip,
  AudioTrackState,
  SubtitleCue,
  SubtitleStyleConfig,
  AspectRatioPreset,
  ResolutionDimensions,
  ExportConfig,
  MotionEffect,
  TransitionEffect,
  StudioSettings,
} from "@/types/autoeditor";
import { StudioMediaPanel } from "./StudioMediaPanel";
import { StudioPreview } from "./StudioPreview";
import { StudioTimeline } from "./StudioTimeline";
import { StudioControlSidebar } from "./StudioControlSidebar";
import { decodeAudioFiles } from "@/lib/engine/audioEngine";
import {
  processMediaFilesToClips,
  buildAutonomousTimeline,
} from "@/lib/engine/timelineBuilder";
import { sortClipsByTimestamp } from "@/lib/engine/timestampParser";
import { exportVideoClientSide } from "@/lib/engine/videoExporter";
import { playSynthesizedSfx } from "@/lib/engine/sfxEngine";

const ALL_TRANSITIONS: TransitionEffect[] = [
  "crossfade",
  "fade-to-black",
  "wipe-left",
  "wipe-right",
  "slide-left",
  "slide-right",
  "circle-open",
  "flash-white",
];

export function VidFlashAutoEditor() {
  const [audioTrack, setAudioTrack] = useState<AudioTrackState | null>(null);
  const [rawClips, setRawClips] = useState<TimelineClip[]>([]);
  const [timelineClips, setTimelineClips] = useState<TimelineClip[]>([]);
  const [subtitles, setSubtitles] = useState<SubtitleCue[]>([]);
  const [subtitleStyle, setSubtitleStyle] = useState<SubtitleStyleConfig>({
    fontSize: 34,
    fontFamily: "Poppins",
    color: "#ffffff",
    strokeColor: "#000000",
    strokeWidth: 4,
    bgColor: "rgba(0,0,0,0.7)",
    showBackground: true,
    position: "bottom",
    yOffsetPercent: 82,
    highlightActiveWord: false,
    highlightColor: "#facc15",
  });

  const [aspectRatio, setAspectRatio] = useState<AspectRatioPreset>("16:9");
  const [resolution, setResolution] = useState<ResolutionDimensions>({
    width: 1920,
    height: 1080,
  });

  const [studioSettings, setStudioSettings] = useState<StudioSettings>({
    fadeInSec: 0.5,
    fadeOutSec: 0.6,
    randomTransitions: true,
    selectedTransition: "crossfade",
    fps: 30,
    enableSfx: true,
    enableParticles: false,
    enableGlow: false,
  });

  const [currentTimeSec, setCurrentTimeSec] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);

  // Export State
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [exportedBlobUrl, setExportedBlobUrl] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastCrossedClipIndexRef = useRef<number>(-1);

  const totalDurationSec = audioTrack
    ? audioTrack.durationSec
    : timelineClips.length > 0
    ? Math.max(...timelineClips.map((c) => c.endSec))
    : 10;

  // Handle Audio Upload (Single or Multiple clips)
  const handleUploadAudio = async (files: File[]) => {
    try {
      const decoded = await decodeAudioFiles(files);
      setAudioTrack(decoded);

      if (audioElementRef.current) {
        audioElementRef.current.src = decoded.audioUrl || "";
      }
    } catch (err) {
      console.error("Failed to decode audio files:", err);
    }
  };

  const handleRemoveAudio = () => {
    if (audioTrack && audioTrack.audioUrl) {
      URL.revokeObjectURL(audioTrack.audioUrl);
    }
    setAudioTrack(null);
    if (audioElementRef.current) {
      audioElementRef.current.src = "";
    }
  };

  // Handle Media Drop
  const handleUploadClips = async (files: File[]) => {
    const newClips = await processMediaFilesToClips(files);
    setRawClips((prev) => sortClipsByTimestamp([...prev, ...newClips]));
  };

  const handleRemoveClip = (id: string) => {
    setRawClips((prev) => prev.filter((c) => c.id !== id));
    setTimelineClips((prev) => prev.filter((c) => c.id !== id));
  };

  const handleClearAllClips = () => {
    setRawClips([]);
    setTimelineClips([]);
  };

  // Autonomous Timeline Builder Trigger
  const handleBuildTimeline = useCallback(() => {
    const targetAudioDur = audioTrack ? audioTrack.durationSec : 0;
    let built = buildAutonomousTimeline(rawClips, targetAudioDur);

    // Apply Transition Settings
    if (studioSettings.randomTransitions) {
      built = built.map((c, i) => {
        if (i === 0) return { ...c, transition: "cut" };
        const randTrans =
          ALL_TRANSITIONS[Math.floor(Math.random() * ALL_TRANSITIONS.length)];
        return { ...c, transition: randTrans };
      });
    } else if (studioSettings.selectedTransition) {
      built = built.map((c, i) => ({
        ...c,
        transition: i === 0 ? "cut" : studioSettings.selectedTransition,
      }));
    }

    setTimelineClips(built);
    setCurrentTimeSec(0);
    if (audioElementRef.current) audioElementRef.current.currentTime = 0;
  }, [rawClips, audioTrack, studioSettings]);

  // Handle Aspect Ratio Change
  const handleChangeAspectRatio = (ratio: AspectRatioPreset) => {
    setAspectRatio(ratio);
    if (ratio === "16:9") {
      setResolution({ width: 1920, height: 1080 });
    } else if (ratio === "9:16") {
      setResolution({ width: 1080, height: 1920 });
    } else {
      setResolution({ width: 1080, height: 1080 });
    }
  };

  // Handle Settings Update
  const handleUpdateSettings = (newSettings: Partial<StudioSettings>) => {
    setStudioSettings((prev) => ({ ...prev, ...newSettings }));
  };

  // Handle Transition Shuffle
  const handleShuffleTransitions = () => {
    setTimelineClips((prev) =>
      prev.map((c, i) => {
        if (i === 0) return { ...c, transition: "cut" };
        const randTrans =
          ALL_TRANSITIONS[Math.floor(Math.random() * ALL_TRANSITIONS.length)];
        return { ...c, transition: randTrans };
      })
    );
  };

  // Apply Single Transition To All Cuts
  const handleApplyTransitionToAll = (trans: TransitionEffect) => {
    setTimelineClips((prev) =>
      prev.map((c, i) => ({
        ...c,
        transition: i === 0 ? "cut" : trans,
      }))
    );
  };

  // Playback Loop & Clock Sync
  const handleTogglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      audioElementRef.current?.pause();
    } else {
      if (currentTimeSec >= totalDurationSec) {
        setCurrentTimeSec(0);
        if (audioElementRef.current) audioElementRef.current.currentTime = 0;
      }
      setIsPlaying(true);
      audioElementRef.current?.play();
    }
  };

  const handleSeek = (timeSec: number) => {
    const clamped = Math.max(0, Math.min(totalDurationSec, timeSec));
    setCurrentTimeSec(clamped);
    if (audioElementRef.current) {
      audioElementRef.current.currentTime = clamped;
    }
  };

  useEffect(() => {
    if (!isPlaying) {
      if (animationFrameRef.current)
        cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    let lastTimestamp = performance.now();

    const loop = (now: number) => {
      const deltaSec = (now - lastTimestamp) / 1000;
      lastTimestamp = now;

      setCurrentTimeSec((prev) => {
        const nextTime = prev + deltaSec;

        // Sound Effect Trigger at Scene Cuts
        if (studioSettings.enableSfx && timelineClips.length > 0) {
          const activeIndex = timelineClips.findIndex(
            (c) => nextTime >= c.startSec && nextTime < c.endSec
          );
          if (
            activeIndex > 0 &&
            activeIndex !== lastCrossedClipIndexRef.current
          ) {
            lastCrossedClipIndexRef.current = activeIndex;
            playSynthesizedSfx("whoosh");
          }
        }

        if (nextTime >= totalDurationSec) {
          setIsPlaying(false);
          audioElementRef.current?.pause();
          return totalDurationSec;
        }
        return nextTime;
      });

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameRef.current)
        cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying, totalDurationSec, studioSettings.enableSfx, timelineClips]);

  // Clip Property Updates
  const handleUpdateClipMotion = (clipId: string, motion: MotionEffect) => {
    setTimelineClips((prev) =>
      prev.map((c) => (c.id === clipId ? { ...c, motion } : c))
    );
  };

  const handleUpdateClipTransition = (
    clipId: string,
    transition: TransitionEffect
  ) => {
    setTimelineClips((prev) =>
      prev.map((c) => (c.id === clipId ? { ...c, transition } : c))
    );
  };

  // Video Render Handler
  const handleStartRender = async () => {
    setIsExporting(true);
    setExportProgress(0);
    setExportError(null);
    setExportedBlobUrl(null);

    try {
      const config: ExportConfig = {
        aspectRatio,
        resolution,
        fps: studioSettings.fps,
        format: "mp4",
        fadeInSec: studioSettings.fadeInSec,
        fadeOutSec: studioSettings.fadeOutSec,
        enableParticles: studioSettings.enableParticles,
        enableGlow: studioSettings.enableGlow,
      };

      const blob = await exportVideoClientSide({
        clips: timelineClips,
        audioTrack,
        subtitles,
        subtitleStyle,
        config,
        onProgress: (percent) => setExportProgress(percent),
      });

      const url = URL.createObjectURL(blob);
      setExportedBlobUrl(url);
    } catch (err) {
      console.error("Export failed:", err);
      setExportError(err instanceof Error ? err.message : "Video export failed");
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Hidden Audio Element for synchronized playback */}
      <audio ref={audioElementRef} />

      {/* AutoEditor Brand Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 backdrop-blur-md flex items-center justify-between flex-wrap gap-3 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="relative flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 shadow-md shadow-indigo-500/25 text-white font-bold ring-1 ring-indigo-500/30 shrink-0">
            <svg
              className="w-3.5 h-3.5 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m22 8-6 4 6 4V8Z" />
              <rect width="14" height="12" x="2" y="6" rx="2" ry="2" />
            </svg>
            <span className="absolute -bottom-0.5 -right-0.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-base font-extrabold text-white">
                VidFlash AutoEditor
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold font-mono rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                v2.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              image + video · voiceover sync (100% Client-Side)
            </p>
          </div>
        </div>

        {/* Right Status Badges */}
        <div className="flex items-center space-x-2">
          {audioTrack && (
            <div className="flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200">
              <Music className="w-3.5 h-3.5 text-emerald-400" />
              <span className="truncate max-w-[180px] font-mono text-[11px]">
                {audioTrack.fileName}
              </span>
            </div>
          )}

          {rawClips.length > 0 && (
            <div className="flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
              <span className="font-mono text-[11px] font-bold">
                {rawClips.length} images
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Studio Grid: Left Media & Timeline (8 cols) vs Right Control Sidebar (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Media Panel + Preview Player + Multi-Track Timeline */}
        <div className="lg:col-span-8 space-y-6">
          {/* Step 1 & 2 Media Ingestion Panel */}
          <StudioMediaPanel
            audioTrack={audioTrack}
            clips={rawClips}
            onUploadAudio={handleUploadAudio}
            onUploadClips={handleUploadClips}
            onBuildTimeline={handleBuildTimeline}
            onRemoveAudio={handleRemoveAudio}
            onRemoveClip={handleRemoveClip}
            onClearAllClips={handleClearAllClips}
          />

          {/* Live 60FPS Player Viewport */}
          <StudioPreview
            clips={timelineClips}
            subtitles={subtitles}
            subtitleStyle={subtitleStyle}
            settings={studioSettings}
            currentTimeSec={currentTimeSec}
            totalDurationSec={totalDurationSec}
            isPlaying={isPlaying}
            aspectRatio={aspectRatio}
            resolution={resolution}
            onTogglePlay={handleTogglePlay}
            onSeek={handleSeek}
            onChangeAspectRatio={handleChangeAspectRatio}
          />

          {/* Autonomous Multi-Track Timeline */}
          <StudioTimeline
            clips={timelineClips}
            audioTrack={audioTrack}
            subtitles={subtitles}
            currentTimeSec={currentTimeSec}
            totalDurationSec={totalDurationSec}
            selectedClipId={selectedClipId}
            onSelectClip={(id) => setSelectedClipId(id)}
            onSeek={handleSeek}
            onUpdateClipMotion={handleUpdateClipMotion}
            onUpdateClipTransition={handleUpdateClipTransition}
            onOpenTransitions={() => {}}
          />
        </div>

        {/* Right Column: Studio Control Sidebar (Export, Scene Fades, Transitions, Captions, SFX, Overlays) */}
        <div className="lg:col-span-4">
          <StudioControlSidebar
            clips={timelineClips}
            subtitles={subtitles}
            subtitleStyle={subtitleStyle}
            settings={studioSettings}
            aspectRatio={aspectRatio}
            resolution={resolution}
            totalDurationSec={totalDurationSec}
            isExporting={isExporting}
            exportProgress={exportProgress}
            onChangeAspectRatio={handleChangeAspectRatio}
            onUpdateSettings={handleUpdateSettings}
            onUpdateSubtitles={(cues) => setSubtitles(cues)}
            onUpdateSubtitleStyle={(st) => setSubtitleStyle(st)}
            onApplyTransitionToAll={handleApplyTransitionToAll}
            onShuffleTransitions={handleShuffleTransitions}
            onStartRender={handleStartRender}
          />
        </div>
      </div>

      {/* Render MP4 Dialog Modal */}
      {isExporting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-white font-bold text-sm">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Rendering Video (Client-Side)</span>
              </div>
              {!exportedBlobUrl && (
                <button
                  onClick={() => setIsExporting(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {!exportedBlobUrl && !exportError && (
              <div className="space-y-4 text-center py-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mx-auto">
                  <Cpu className="w-6 h-6 animate-spin" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-200">
                    Compositing {studioSettings.fps} FPS Video Stream...
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Rendering Ken Burns pan/zoom, transitions, subtitles & audio
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-mono text-slate-400">
                    <span>Progress</span>
                    <span className="text-emerald-400 font-bold">
                      {exportProgress}%
                    </span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-950 overflow-hidden border border-slate-800 p-0.5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-400 transition-all duration-200"
                      style={{ width: `${exportProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {exportedBlobUrl && (
              <div className="space-y-4 text-center py-2">
                <div className="w-12 h-12 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    MP4 Video Successfully Rendered!
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Rendered at {resolution.width}×{resolution.height} • {studioSettings.fps} FPS on your local CPU.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-between gap-3">
                  <button
                    onClick={() => {
                      setIsExporting(false);
                      setExportedBlobUrl(null);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors"
                  >
                    Close
                  </button>

                  <a
                    href={exportedBlobUrl}
                    download={`VidFlash_${Date.now()}.mp4`}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-lg shadow-emerald-500/20"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download MP4</span>
                  </a>
                </div>
              </div>
            )}

            {exportError && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs space-y-2">
                <div className="flex items-center space-x-1.5 font-bold">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <span>Render Error</span>
                </div>
                <p>{exportError}</p>
                <button
                  onClick={() => setIsExporting(false)}
                  className="px-3 py-1.5 rounded-lg bg-red-800 text-white font-semibold"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
