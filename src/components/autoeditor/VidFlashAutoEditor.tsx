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
import { playAudioSfx } from "@/lib/engine/sfxEngine";

const ALL_TRANSITIONS: TransitionEffect[] = [
  "crossfade",
  "light-leak",
  "glow-flash",
  "zoom-in",
  "zoom-out",
  "zoom-blur",
  "glitch",
  "stretch-glow",
  "spin-360",
  "whip-pan-left",
  "whip-pan-right",
  "whip-pan-up",
  "whip-pan-down",
  "slide-left",
  "slide-right",
  "circle-open",
  "flash-white",
  "fade-to-black",
  "wipe-left",
  "wipe-right",
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
    qualityPreset: "optimized",
    hardwareProfile: "balanced",
    enableSfx: true,
    selectedSfxId: "clean-fast-swoosh",
    enableParticles: false,
    enableGlow: false,
    enableFilmGrain: false,
    enableOldCinema: false,
    enableGeometricGrid: false,
    enableBlackAndWhite: false,
    enableVhsScanlines: false,
    enableLetterbox: false,
    enablePrismGlow: false,
    enableVintageSepia: false,
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

  // Handle Audio Upload (Single or Multiple clips, all formats)
  const handleUploadAudio = async (files: File[]) => {
    try {
      const decoded = await decodeAudioFiles(files);
      setAudioTrack(decoded);

      if (audioElementRef.current) {
        audioElementRef.current.src = decoded.audioUrl || "";
        audioElementRef.current.load();
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
      audioElementRef.current.pause();
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
  const handleTogglePlay = async () => {
    if (isPlaying) {
      setIsPlaying(false);
      try {
        audioElementRef.current?.pause();
      } catch {}
    } else {
      if (currentTimeSec >= totalDurationSec) {
        setCurrentTimeSec(0);
        if (audioElementRef.current) audioElementRef.current.currentTime = 0;
      }
      setIsPlaying(true);
      if (audioElementRef.current && audioTrack?.audioUrl) {
        try {
          const playPromise = audioElementRef.current.play();
          if (playPromise !== undefined) {
            await playPromise;
          }
        } catch (err: any) {
          // Gracefully handle browser AbortError / play request interrupted by pause
          if (err.name !== "AbortError") {
            console.warn("Audio playback notice:", err);
          }
        }
      }
    }
  };

  const handleSeek = (timeSec: number) => {
    const clamped = Math.max(0, Math.min(totalDurationSec, timeSec));
    setCurrentTimeSec(clamped);
    if (audioElementRef.current && isFinite(audioElementRef.current.duration)) {
      try {
        audioElementRef.current.currentTime = clamped;
      } catch {}
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

        // Sound Effect Trigger at Scene Cuts (Default: Fast Swoosh)
        if (studioSettings.enableSfx && timelineClips.length > 0) {
          const activeIndex = timelineClips.findIndex(
            (c) => nextTime >= c.startSec && nextTime < c.endSec
          );
          if (
            activeIndex > 0 &&
            activeIndex !== lastCrossedClipIndexRef.current
          ) {
            lastCrossedClipIndexRef.current = activeIndex;
            playAudioSfx(studioSettings.selectedSfxId || "clean-fast-swoosh");
          }
        }

        if (nextTime >= totalDurationSec) {
          setIsPlaying(false);
          try {
            audioElementRef.current?.pause();
          } catch {}
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

  // Interactive Clip Boundary Sliding / Hold Duration Adjustment
  const handleResizeClipBoundary = (clipIndex: number, newCutSec: number) => {
    setTimelineClips((prev) => {
      if (clipIndex < 0 || clipIndex >= prev.length - 1) return prev;
      const updated = [...prev];
      const leftClip = { ...updated[clipIndex] };
      const rightClip = { ...updated[clipIndex + 1] };

      const minDur = 0.3;
      const clamped = Math.max(
        leftClip.startSec + minDur,
        Math.min(rightClip.endSec - minDur, newCutSec)
      );

      leftClip.endSec = clamped;
      leftClip.durationSec = Number(
        (leftClip.endSec - leftClip.startSec).toFixed(2)
      );

      rightClip.startSec = clamped;
      rightClip.durationSec = Number(
        (rightClip.endSec - rightClip.startSec).toFixed(2)
      );

      updated[clipIndex] = leftClip;
      updated[clipIndex + 1] = rightClip;
      return updated;
    });
  };

  // Video Render Handler
  const handleStartRender = async () => {
    setIsExporting(true);
    setExportProgress(0);
    setExportError(null);
    setExportedBlobUrl(null);
    if (typeof document !== "undefined") {
      document.title = "VidFlash - 0% Rendered";
    }

    try {
      const config: ExportConfig = {
        aspectRatio,
        resolution,
        fps: studioSettings.fps,
        format: "mp4",
        qualityPreset: studioSettings.qualityPreset || "optimized",
        hardwareProfile: studioSettings.hardwareProfile || "balanced",
        fadeInSec: studioSettings.fadeInSec,
        fadeOutSec: studioSettings.fadeOutSec,
        enableParticles: studioSettings.enableParticles,
        enableGlow: studioSettings.enableGlow,
        enableFilmGrain: studioSettings.enableFilmGrain,
        enableOldCinema: studioSettings.enableOldCinema,
        enableGeometricGrid: studioSettings.enableGeometricGrid,
        enableBlackAndWhite: studioSettings.enableBlackAndWhite,
        enableVhsScanlines: studioSettings.enableVhsScanlines,
        enableLetterbox: studioSettings.enableLetterbox,
        enablePrismGlow: studioSettings.enablePrismGlow,
        enableVintageSepia: studioSettings.enableVintageSepia,
      };

      const blob = await exportVideoClientSide({
        clips: timelineClips,
        audioTrack,
        subtitles,
        subtitleStyle,
        config,
        onProgress: (percent) => {
          setExportProgress(percent);
          if (typeof document !== "undefined") {
            document.title = `VidFlash - ${percent}% Rendered`;
          }
        },
      });

      const url = URL.createObjectURL(blob);
      setExportedBlobUrl(url);
      if (typeof document !== "undefined") {
        document.title = "VidFlash - Render Complete! 🎉";
      }
    } catch (err) {
      console.error("Export failed:", err);
      setExportError(err instanceof Error ? err.message : "Video export failed");
      if (typeof document !== "undefined") {
        document.title = "VidFlash - Video Productions on Flash!";
      }
    }
  };

  const handleCloseRenderModal = () => {
    setIsExporting(false);
    setExportedBlobUrl(null);
    setExportError(null);
    if (typeof document !== "undefined") {
      document.title = "VidFlash - Video Productions on Flash!";
    }
  };

  return (
    <div className="w-full max-w-[1920px] mx-auto px-1 sm:px-2 py-1 space-y-2.5">
      {/* Hidden Audio Element for synchronized playback */}
      <audio ref={audioElementRef} />

      {/* Clean Studio Top Header Bar */}
      <div className="bg-[#121215] border border-[#2b2b36] rounded-xl px-4 py-2 flex items-center justify-between flex-wrap gap-2 text-xs shadow-xl">
        <div className="flex items-center space-x-2.5">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-600/30 shrink-0">
            <Tv className="w-3.5 h-3.5" />
          </div>
          <span className="font-extrabold text-white text-sm tracking-wide">
            AutoEditor
          </span>
        </div>
      </div>

      {/* DaVinci Top 3-Pane Work Area: Media Pool (Left) | Viewer Monitor (Center) | Inspector (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 items-start">
        {/* Left: Media Pool (Col Span 3) */}
        <div className="lg:col-span-3 xl:col-span-3">
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
        </div>

        {/* Center: Viewer Monitor (Col Span 6) */}
        <div className="lg:col-span-5 xl:col-span-6">
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
            projectName={audioTrack ? audioTrack.fileName : "Auto-Sync Sequence"}
            totalClipsCount={rawClips.length}
            onTogglePlay={handleTogglePlay}
            onSeek={handleSeek}
            onChangeAspectRatio={handleChangeAspectRatio}
          />
        </div>

        {/* Right: Inspector Panel (Col Span 3) */}
        <div className="lg:col-span-4 xl:col-span-3">
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

      {/* Bottom Section: Full-Width Multi-Track Timeline (100% Full Width across the bottom) */}
      <div className="w-full">
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
          onResizeBoundary={handleResizeClipBoundary}
          onOpenTransitions={() => {}}
        />
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
                  onClick={handleCloseRenderModal}
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

                {/* Hardware Power Governor Live Metrics */}
                <div className="grid grid-cols-3 gap-2 pt-1 text-[10px] font-mono">
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-center">
                    <span className="text-slate-500 block text-[9px]">CPU LOAD</span>
                    <span className="text-indigo-400 font-bold">
                      {studioSettings.hardwareProfile === "balanced"
                        ? "60% Cap"
                        : studioSettings.hardwareProfile === "silent"
                        ? "40% Cap"
                        : "100% Turbo"}
                    </span>
                  </div>

                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-center">
                    <span className="text-slate-500 block text-[9px]">RAM GUARD</span>
                    <span className="text-purple-400 font-bold">
                      {studioSettings.hardwareProfile === "silent" ? "50% Cap" : "80% Cap"}
                    </span>
                  </div>

                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-center">
                    <span className="text-slate-500 block text-[9px]">GPU POWER</span>
                    <span className="text-emerald-400 font-bold">100% Direct</span>
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
                    onClick={handleCloseRenderModal}
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
                  onClick={handleCloseRenderModal}
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
