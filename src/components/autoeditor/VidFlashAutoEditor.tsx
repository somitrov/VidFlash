"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Sparkles,
  Download,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  X,
  Cpu,
  Tv,
  Music,
  ImageIcon,
  Coffee,
  ExternalLink,
} from "lucide-react";
import { AdSenseBanner } from "@/components/AdSenseBanner";
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
import { sortClipsByTimestamp, formatSecondsToTimecode } from "@/lib/engine/timestampParser";
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

interface VidFlashAutoEditorProps {
  isRenderSettingsOpen?: boolean;
  onCloseRenderSettings?: () => void;
  onOpenRenderSettings?: () => void;
}

export function VidFlashAutoEditor({
  isRenderSettingsOpen,
  onCloseRenderSettings,
  onOpenRenderSettings,
}: VidFlashAutoEditorProps = {}) {
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
    selectedTransition: undefined,
    fps: 30,
    qualityPreset: "optimized",
    hardwareProfile: "balanced",
    enableSfx: true,
    selectedSfxId: "random",
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
  const [projectName, setProjectName] = useState<string>("Auto-Sync Sequence");

  // Export State
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [exportedBlobUrl, setExportedBlobUrl] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState<boolean>(false);
  const [isRenderSettingsModalOpen, setIsRenderSettingsModalOpen] = useState<boolean>(false);
  const [isExtensionModalOpen, setIsExtensionModalOpen] = useState<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync external isRenderSettingsOpen with local modal
  useEffect(() => {
    if (isRenderSettingsOpen !== undefined) {
      setIsRenderSettingsModalOpen(isRenderSettingsOpen);
    }
  }, [isRenderSettingsOpen]);

  const closeRenderSettingsModal = () => {
    setIsRenderSettingsModalOpen(false);
    if (onCloseRenderSettings) {
      onCloseRenderSettings();
    }
  };

  const openRenderSettingsModal = () => {
    setIsRenderSettingsModalOpen(true);
    if (onOpenRenderSettings) {
      onOpenRenderSettings();
    }
  };

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

      if (files.length > 0) {
        const cleanName = files[0].name.replace(/\.[^/.]+$/, "").trim();
        if (cleanName) {
          setProjectName(cleanName);
        }
      }

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
  };

  const handleClearAllClips = () => {
    setRawClips([]);
    setTimelineClips([]);
    setCurrentTimeSec(0);
  };

  // Re-order clips manually if needed
  const handleReorderClips = (newOrder: TimelineClip[]) => {
    setRawClips(newOrder);
  };

  // Build / Re-Sync Timeline Engine
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
        transition: i === 0 ? "cut" : studioSettings.selectedTransition!,
      }));
    } else {
      built = built.map((c) => ({
        ...c,
        transition: "cut",
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

        // Sound Effect Trigger at Scene Cuts (Default: Randomized SFX on Cuts)
        if (
          studioSettings.enableSfx &&
          studioSettings.selectedSfxId !== "none" &&
          timelineClips.length > 0
        ) {
          const activeIndex = timelineClips.findIndex(
            (c) => nextTime >= c.startSec && nextTime < c.endSec
          );
          if (
            activeIndex > 0 &&
            activeIndex !== lastCrossedClipIndexRef.current
          ) {
            lastCrossedClipIndexRef.current = activeIndex;
            playAudioSfx(studioSettings.selectedSfxId || "random");
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
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsExporting(true);
    setExportProgress(0);
    setExportError(null);
    setExportedBlobUrl(null);
    setShowCancelConfirm(false);
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
        signal: controller.signal,
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
      if (err instanceof DOMException && err.name === "AbortError") {
        console.log("Video rendering cancelled by user.");
        return;
      }
      if (err instanceof Error && (err.name === "AbortError" || err.message.includes("aborted"))) {
        console.log("Video rendering cancelled by user.");
        return;
      }
      console.error("Export failed:", err);
      setExportError(err instanceof Error ? err.message : "Video export failed");
      if (typeof document !== "undefined") {
        document.title = "VidFlash - Productions on Flash!";
      }
    } finally {
      abortControllerRef.current = null;
    }
  };

  const handleClickCloseOrCancel = () => {
    if (isExporting && !exportedBlobUrl && !exportError) {
      setShowCancelConfirm(true);
    } else {
      handleCloseRenderModal();
    }
  };

  const handleConfirmCancelRender = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setShowCancelConfirm(false);
    handleCloseRenderModal();
  };

  const handleCloseRenderModal = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setShowCancelConfirm(false);
    setIsExporting(false);
    setExportedBlobUrl(null);
    setExportError(null);
    setExportProgress(0);
    if (typeof document !== "undefined") {
      document.title = "VidFlash - Productions on Flash!";
    }
  };

  return (
    <div className="w-full max-w-[1920px] mx-auto px-1 sm:px-2 py-1 space-y-2.5">
      {/* Hidden Audio Element for synchronized playback */}
      <audio ref={audioElementRef} />

      {/* Clean Studio Top Header Bar */}
      <div className="bg-[#121215] border border-[#2b2b36] rounded-xl px-4 py-2 flex items-center justify-between flex-wrap gap-2 text-xs shadow-xl">
        {/* Place 1: Brand & Get the Extension */}
        <div className="flex items-center space-x-2.5">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-600/30 shrink-0">
            <Tv className="w-3.5 h-3.5" />
          </div>
          <span className="font-extrabold text-white text-sm tracking-wide">
            AutoEditor
          </span>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <button
            onClick={() => setIsExtensionModalOpen(true)}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 hover:underline transition-all cursor-pointer group"
            title="Open Flow Automator Extension Setup Guide"
          >
            <span>Get the Extension</span>
            <ExternalLink className="w-3 h-3 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Place 2: Flow Automator Extension Button */}
        <button
          onClick={() => setIsExtensionModalOpen(true)}
          className="group flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500/15 via-teal-500/15 to-emerald-500/15 hover:from-emerald-500/25 hover:to-teal-500/25 border border-emerald-500/35 text-emerald-300 hover:text-emerald-200 text-xs font-bold shadow-lg shadow-emerald-500/10 transition-all transform hover:scale-[1.02] cursor-pointer"
          title="TryAIToday Flow Automator Extension"
        >
          <img
            src="/TryAiToday.png"
            alt="Flow Automator"
            className="w-4 h-4 rounded-full object-contain shrink-0 ring-1 ring-emerald-400/40"
          />
          <span>Flow Automator Extension</span>
        </button>
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
            projectName={projectName}
            totalClipsCount={rawClips.length}
            onTogglePlay={handleTogglePlay}
            onSeek={handleSeek}
            onChangeAspectRatio={handleChangeAspectRatio}
            onUpdateProjectName={(name) => setProjectName(name)}
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

      {/* Render MP4 Dialog Modal with 16:9 AdSense Integration */}
      {isExporting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800/90 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-2xl shadow-black/80 space-y-5 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
              <div className="flex flex-wrap items-center gap-2.5 text-white font-bold text-sm sm:text-base">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 shrink-0" />
                  <span>Rendering Video</span>
                </div>
                <span className="text-slate-600 hidden sm:inline">•</span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/10 text-amber-300 border border-amber-500/35 shadow-sm shadow-amber-500/10">
                  <Coffee className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-bounce" />
                  <span>Get Your Coffee Now</span>
                </span>
              </div>

              <button
                onClick={handleClickCloseOrCancel}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title={!exportedBlobUrl ? "Cancel Rendering" : "Close Modal"}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: 2-Column Responsive Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
              {/* Left Column: Rendering Progress / Status / Controls */}
              <div className="lg:col-span-6 flex flex-col justify-between space-y-4">
                {!exportedBlobUrl && !exportError && (
                  <div className="space-y-4 text-center py-2 flex flex-col justify-center flex-1">
                    <div className="relative w-14 h-14 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/10">
                      <Cpu className="w-7 h-7 animate-spin" />
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-slate-100">
                        Compositing {studioSettings.fps} FPS Video Stream...
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Rendering Ken Burns pan/zoom, transitions, subtitles & audio
                      </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5 text-left">
                      <div className="flex justify-between text-xs font-mono text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                          Progress
                        </span>
                        <span className="text-emerald-400 font-bold text-sm">
                          {exportProgress}%
                        </span>
                      </div>
                      <div className="w-full h-3.5 rounded-full bg-slate-950 overflow-hidden border border-slate-800 p-0.5 shadow-inner">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-400 transition-all duration-200 shadow-md shadow-indigo-500/40"
                          style={{ width: `${exportProgress}%` }}
                        />
                      </div>
                    </div>

                    {/* Hardware Power Governor Live Metrics */}
                    <div className="grid grid-cols-3 gap-2 pt-1 text-[10px] font-mono">
                      <div className="p-2 sm:p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                        <span className="text-slate-500 block text-[9px]">CPU LOAD</span>
                        <span className="text-indigo-400 font-bold">
                          {studioSettings.hardwareProfile === "balanced"
                            ? "60% Cap"
                            : studioSettings.hardwareProfile === "silent"
                            ? "40% Cap"
                            : "100% Turbo"}
                        </span>
                      </div>

                      <div className="p-2 sm:p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                        <span className="text-slate-500 block text-[9px]">RAM GUARD</span>
                        <span className="text-purple-400 font-bold">
                          {studioSettings.hardwareProfile === "silent" ? "50% Cap" : "80% Cap"}
                        </span>
                      </div>

                      <div className="p-2 sm:p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                        <span className="text-slate-500 block text-[9px]">GPU POWER</span>
                        <span className="text-emerald-400 font-bold">100% Direct</span>
                      </div>
                    </div>

                    {/* Coffee relaxation note */}
                    <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-left flex items-start gap-2.5 text-[11px] text-slate-400">
                      <Coffee className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-slate-300">Coffee Break:</strong> Client-side rendering runs locally in your browser with zero cloud queues. Grab a coffee while your video compiles!
                      </span>
                    </div>
                  </div>
                )}

                {exportedBlobUrl && (
                  <div className="space-y-4 text-center py-2 flex flex-col justify-center flex-1">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white">
                        MP4 Video Successfully Rendered!
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Rendered at {resolution.width}×{resolution.height} • {studioSettings.fps} FPS on your local CPU.
                      </p>
                    </div>

                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <button
                        onClick={handleCloseRenderModal}
                        className="w-full sm:flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors"
                      >
                        Close
                      </button>

                      <a
                        href={exportedBlobUrl}
                        download={`VidFlash - ${projectName.trim().replace(/[/\\?%*:|"<>]/g, "_") || "Video"}.mp4`}
                        className="w-full sm:flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/20 hover:scale-[1.02] transition-transform"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download MP4</span>
                      </a>
                    </div>
                  </div>
                )}

                {exportError && (
                  <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs space-y-2">
                    <div className="flex items-center space-x-1.5 font-bold text-sm text-red-400">
                      <AlertCircle className="w-4 h-4 text-red-400" />
                      <span>Render Error</span>
                    </div>
                    <p>{exportError}</p>
                    <button
                      onClick={handleCloseRenderModal}
                      className="px-4 py-2 rounded-lg bg-red-800 hover:bg-red-700 text-white font-semibold text-xs"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>

              {/* Right Column: 16:9 AdSense Placement */}
              <div className="lg:col-span-6 flex flex-col justify-center relative z-0">
                <div className="w-full flex flex-col rounded-2xl bg-slate-950/80 border border-slate-800/90 p-3 sm:p-4 overflow-hidden relative z-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                        Sponsored Advertisement
                      </span>
                    </div>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-slate-900 text-slate-500 border border-slate-800">
                      16:9
                    </span>
                  </div>

                  <div className="w-full aspect-video rounded-xl bg-slate-900/90 border border-slate-800/80 overflow-hidden flex items-center justify-center relative z-0">
                    <AdSenseBanner
                      aspectRatio="16:9"
                      hideHeader={true}
                      className="my-0 p-0 border-0 bg-transparent min-h-0 h-full w-full relative z-0"
                    />
                  </div>

                  <div className="mt-2 text-[10px] text-slate-500 text-center">
                    <span>Ads keep client-side rendering 100% free with no server subscriptions</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Confirmation Dialog Modal (Top-Level Overlay above all modals & ads) */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
          <div className="relative w-full max-w-sm bg-slate-900 border border-slate-700/90 rounded-2xl p-5 sm:p-6 shadow-2xl shadow-black text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-white">
                Cancel Video Rendering?
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Are you sure you want to stop? Current progress (<span className="text-amber-300 font-semibold">{exportProgress}%</span>) will be lost and rendering will immediately stop.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
              >
                Keep Rendering
              </button>

              <button
                onClick={handleConfirmCancelRender}
                className="flex-1 py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-lg shadow-red-600/20 flex items-center justify-center space-x-1.5"
              >
                <X className="w-4 h-4" />
                <span>Yes, Cancel</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Render Settings & Configuration Modal (Opened from Top Navbar or Studio Header) */}
      {isRenderSettingsModalOpen && !isExporting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800/90 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl shadow-black/80 space-y-4 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">Video Render Settings</h3>
                  <p className="text-[11px] text-slate-400">Configure format, resolution & hardware governor</p>
                </div>
              </div>

              <button
                onClick={closeRenderSettingsModal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Close Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Settings Body */}
            <div className="space-y-3.5 text-xs">
              {/* Aspect Ratio & FPS */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-300 font-semibold block mb-1">
                    Timeline Format
                  </label>
                  <select
                    value={aspectRatio}
                    onChange={(e) => handleChangeAspectRatio(e.target.value as AspectRatioPreset)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                  >
                    <option value="16:9">16:9 — 1920x1080 (YouTube/Desktop)</option>
                    <option value="9:16">9:16 — 1080x1920 (Reels/Shorts)</option>
                    <option value="1:1">1:1 — 1080x1080 (Square)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-slate-300 font-semibold block mb-1">
                    Frame Rate (FPS)
                  </label>
                  <select
                    value={studioSettings.fps}
                    onChange={(e) =>
                      setStudioSettings((prev) => ({
                        ...prev,
                        fps: parseInt(e.target.value, 10) as 24 | 30 | 60,
                      }))
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs font-semibold focus:outline-none focus:border-indigo-500 font-mono"
                  >
                    <option value="24">24 fps (Cinematic Film)</option>
                    <option value="30">30 fps (Standard Web)</option>
                    <option value="60">60 fps (Ultra Smooth)</option>
                  </select>
                </div>
              </div>

              {/* Bitrate Compression Preset */}
              <div>
                <label className="text-[11px] text-slate-300 font-semibold block mb-1">
                  Bitrate Compression Preset
                </label>
                <select
                  value={studioSettings.qualityPreset || "optimized"}
                  onChange={(e) =>
                    setStudioSettings((prev) => ({
                      ...prev,
                      qualityPreset: e.target.value as "optimized" | "high" | "compact",
                    }))
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                >
                  <option value="optimized">⚡ Optimized Web & YouTube (~16 MB/min)</option>
                  <option value="compact">📱 Ultra Compact / Low Data (~9 MB/min)</option>
                  <option value="high">🎬 Studio High Fidelity (~33 MB/min)</option>
                </select>
              </div>

              {/* Hardware Power Governor Allocation */}
              <div>
                <label className="text-[11px] text-slate-300 font-semibold block mb-1">
                  Hardware Power Allocation
                </label>
                <select
                  value={studioSettings.hardwareProfile || "balanced"}
                  onChange={(e) =>
                    setStudioSettings((prev) => ({
                      ...prev,
                      hardwareProfile: e.target.value as any,
                    }))
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs font-semibold focus:outline-none focus:border-indigo-500 font-mono"
                >
                  <option value="balanced">⚡ 60% CPU • 80% RAM • 100% GPU (Balanced)</option>
                  <option value="turbo">🚀 100% CPU • 100% RAM • 100% GPU (Max Turbo)</option>
                  <option value="silent">🍃 40% CPU • 50% RAM • 100% GPU (Silent)</option>
                </select>
              </div>

              {/* Summary Specs */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/90 space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Target Resolution</span>
                  <span className="text-slate-200 font-bold">{resolution.width}×{resolution.height}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Clips Ingested</span>
                  <span className="text-slate-200 font-bold">{timelineClips.length} clips</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Master Timeline Duration</span>
                  <span className="text-emerald-400 font-bold">{formatSecondsToTimecode(totalDurationSec)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  onClick={closeRenderSettingsModal}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Close
                </button>

                <button
                  onClick={() => {
                    closeRenderSettingsModal();
                    handleStartRender();
                  }}
                  disabled={timelineClips.length === 0 || isExporting}
                  className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-xl ${
                    isExporting
                      ? "bg-slate-800 text-slate-400 cursor-wait"
                      : timelineClips.length > 0
                      ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-indigo-500/25 cursor-pointer transform hover:scale-[1.02]"
                      : "bg-slate-800 text-slate-600 cursor-not-allowed opacity-50"
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Render MP4 Video</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Flow Automator Extension Tutorial & Download Modal */}
      {isExtensionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800/90 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-2xl shadow-black/80 space-y-5 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center p-1.5 shadow-md shadow-emerald-500/10 shrink-0">
                  <img
                    src="/TryAiToday.png"
                    alt="TryAIToday Flow Automator"
                    className="w-full h-full object-contain rounded-lg"
                  />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-bold text-white">
                      TryAIToday Flow Automator
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Chrome Extension
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Bulk scrape & auto-download timestamped sequence images in seconds
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsExtensionModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Close Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Embedded YouTube Tutorial Video */}
            <div className="space-y-2">
              <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shadow-inner">
                <iframe
                  className="w-full h-full"
                  src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0"
                  title="TryAIToday Flow Automator Extension Tutorial"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
              <p className="text-[11px] text-slate-500 text-center">
                Watch how to install and automate your workflow with Google Flow & VidFlash
              </p>
            </div>

            {/* Step-by-Step Instructions & Workflow Notes */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/90 space-y-3 text-xs">
              <h4 className="font-bold text-slate-200 flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>How It Works: 3 Simple Steps</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-slate-400">
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-emerald-400 font-bold text-[11px] block">1. Install Extension</span>
                  <p className="text-[11px] leading-relaxed">
                    Install the <strong>TryAIToday Flow Automator</strong> extension from the official Chrome Web Store.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-indigo-400 font-bold text-[11px] block">2. Bulk Download</span>
                  <p className="text-[11px] leading-relaxed">
                    Open Google Flow with your account to get all timestamped images downloaded in bulk in one click.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-purple-400 font-bold text-[11px] block">3. Ingest into VidFlash</span>
                  <p className="text-[11px] leading-relaxed">
                    Import the downloaded folder + audio into VidFlash to automatically produce your cinematic video.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                onClick={() => setIsExtensionModalOpen(false)}
                className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors cursor-pointer"
              >
                Close
              </button>

              <a
                href="https://chromewebstore.google.com/detail/tryaitoday-flow-automator/bcmmekkamenpjoogmegiffgemlgikbgf?utm_source=item-share-cb"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:flex-1 py-2.5 px-5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/20 hover:scale-[1.01] transition-transform"
              >
                <img
                  src="/TryAiToday.png"
                  alt="Extension"
                  className="w-4 h-4 rounded-full object-contain"
                />
                <span>Get Flow Automator on Chrome Web Store</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
