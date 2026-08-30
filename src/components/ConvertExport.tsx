"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Cpu,
  Download,
  CheckCircle2,
  AlertTriangle,
  Terminal,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Clock,
  Zap,
  ChevronUp,
  Music,
  Film,
} from "lucide-react";
import { AdSenseBanner } from "@/components/AdSenseBanner";
import confetti from "canvas-confetti";
import { MediaFileState, CanvasSettings } from "@/types";
import { processAudioToVideo } from "@/lib/ffmpeg";
import { generate1FPSAnimationSequence } from "@/lib/frameGenerator";
import { playVictorySound } from "@/lib/soundEffects";

interface ConvertExportProps {
  mediaState: MediaFileState;
  canvasDataUrl: string;
  settings: CanvasSettings;
  onPrevStep: () => void;
}

export const ConvertExport: React.FC<ConvertExportProps> = ({
  mediaState,
  canvasDataUrl,
  settings,
  onPrevStep,
}) => {
  const [status, setStatus] = useState<
    "idle" | "loading-wasm" | "processing" | "completed" | "error"
  >("idle");
  const [progress, setProgress] = useState<number>(0);
  const [processedSec, setProcessedSec] = useState<number>(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [outputBlobUrl, setOutputBlobUrl] = useState<string | null>(null);
  const [etaSec, setEtaSec] = useState<number | null>(null);
  const [showDownloadMenu, setShowDownloadMenu] = useState<boolean>(false);

  const logContainerRef = useRef<HTMLDivElement>(null);
  const adLogsRef = useRef<HTMLDivElement>(null);
  const downloadMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target as Node)) {
        setShowDownloadMenu(false);
      }
    };
    if (showDownloadMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDownloadMenu]);

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev.slice(-150), `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  // Scroll to top hero section when arriving at Step 3
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // Clean up Blob URLs on unmount to prevent V8 memory leaks
  useEffect(() => {
    return () => {
      if (outputBlobUrl) {
        URL.revokeObjectURL(outputBlobUrl);
      }
    };
  }, [outputBlobUrl]);

  const startConversion = async () => {
    if (!mediaState.file || !canvasDataUrl) return;

    setStatus("loading-wasm");
    setProgress(0);
    setProcessedSec(0);
    setLogs([]);
    setErrorMessage(null);
    if (outputBlobUrl) {
      URL.revokeObjectURL(outputBlobUrl);
      setOutputBlobUrl(null);
    }

    // Smoothly jump/redirect viewport directly to the Ad & Execution logs section
    setTimeout(() => {
      adLogsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);

    const t0 = Date.now();

    try {
      addLog(
        `Initializing Ultra-Fast 1FPS Muxing (${settings.resolutionPreset.toUpperCase()} Resolution: ${
          settings.resolution.width
        }x${settings.resolution.height}, Audio Direct Copy: ${
          settings.audioCopyMode ? "ON" : "OFF"
        })...`
      );

      addLog("Generating 1 FPS animation sequence (rotating vinyl + geometry particles)...");
      const frameSequenceDataUrls = await generate1FPSAnimationSequence(
        settings,
        canvasDataUrl,
        12
      );

      const blob = await processAudioToVideo({
        mediaFile: mediaState.file,
        canvasDataUrl,
        frameSequenceDataUrls,
        duration: mediaState.duration,
        resolution: settings.resolution,
        audioCopyMode: settings.audioCopyMode,
        onLog: (msg) => {
          if (status !== "processing") setStatus("processing");
          addLog(msg);
        },
        onProgress: (percent, currentSec) => {
          setProgress(percent);
          setProcessedSec(currentSec);

          const elapsed = (Date.now() - t0) / 1000;
          if (percent > 2 && elapsed > 1) {
            const totalEstSec = (elapsed / percent) * 100;
            const rem = Math.max(Math.round(totalEstSec - elapsed), 0);
            setEtaSec(rem);
          }
        },
      });

      const url = URL.createObjectURL(blob);
      setOutputBlobUrl(url);
      setStatus("completed");
      setProgress(100);

      try {
        playVictorySound();
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        console.warn("Confetti effect note:", e);
      }
    } catch (err: any) {
      console.error("FFmpeg processing error:", err);
      setStatus("error");
      setErrorMessage(
        err?.message || "Failed to process media file. Please check file format or browser RAM limits."
      );
      addLog(`ERROR: ${err?.message || "Unknown processing error"}`);
    }
  };

  const handleDownloadVideo = () => {
    if (!outputBlobUrl) return;
    setShowDownloadMenu(false);
    const a = document.createElement("a");
    a.href = outputBlobUrl;
    const baseName = mediaState.fileName.replace(/\.[^/.]+$/, "");
    a.download = `${baseName} - Powered by VidFlash.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadAudio = () => {
    setShowDownloadMenu(false);
    const baseName = mediaState.fileName.replace(/\.[^/.]+$/, "");
    let audioUrlToDownload = mediaState.previewUrl;

    if (mediaState.audioBlob) {
      audioUrlToDownload = URL.createObjectURL(mediaState.audioBlob);
    } else if (mediaState.file) {
      audioUrlToDownload = URL.createObjectURL(mediaState.file);
    }

    if (!audioUrlToDownload) return;

    const a = document.createElement("a");
    a.href = audioUrlToDownload;
    const isWav = mediaState.audioBlob ? true : false;
    a.download = isWav ? `${baseName}_JoinedAudio.wav` : `${baseName}_Audio.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${mins}m ${s < 10 ? "0" : ""}${s}s`;
  };

  return (
    <div id="step-3-section" className="w-full max-w-4xl mx-auto space-y-8 scroll-mt-24">
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-white via-emerald-100 to-emerald-300 bg-clip-text text-transparent">
          Step 3: Client-Side FFmpeg Turbo Conversion
        </h2>
        <p className="text-sm text-slate-400 max-w-2xl mx-auto">
          Muxing static banner frame at 1 FPS with direct audio stream copy. Up to 50x faster execution!
        </p>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur-md space-y-6">
        {status === "idle" && (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
              <Zap className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-200">
                Ready for Ultra-Fast {settings.resolutionPreset.toUpperCase()} Muxing
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Resolution: <span className="text-emerald-400 font-semibold">{settings.resolution.width}x{settings.resolution.height}</span> • Frame Rate: <span className="text-emerald-400 font-semibold">1 FPS</span> • Audio Copy: <span className="text-indigo-300 font-semibold">{settings.audioCopyMode ? "Direct Stream Copy" : "AAC"}</span>
              </p>
            </div>

            <button
              onClick={startConversion}
              className="inline-flex items-center space-x-2 px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-base shadow-xl shadow-emerald-500/30 transition-all transform hover:scale-[1.02]"
            >
              <Zap className="w-5 h-5" />
              <span>Start {settings.resolutionPreset.toUpperCase()} Fast Export</span>
            </button>
          </div>
        )}

        {(status === "loading-wasm" || status === "processing") && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <Cpu className="w-5 h-5 animate-spin" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-200">
                    {status === "loading-wasm"
                      ? "Loading FFmpeg WebAssembly Core..."
                      : `Muxing ${settings.resolutionPreset.toUpperCase()} MP4 Video File...`}
                  </h4>
                  <p className="text-xs text-slate-400">
                    Processed: {formatSeconds(processedSec)} of {mediaState.formattedDuration}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-2xl font-extrabold text-emerald-400">
                  {progress}%
                </span>
                {etaSec !== null && (
                  <div className="text-[11px] text-slate-400 flex items-center space-x-1 justify-end">
                    <Clock className="w-3 h-3" />
                    <span>ETA ~{formatSeconds(etaSec)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="relative w-full h-4 rounded-full bg-slate-950 overflow-hidden p-0.5 border border-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500 transition-all duration-300 shadow-lg shadow-emerald-500/50"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {status === "completed" && outputBlobUrl && (
          <div className="space-y-6 border-b border-slate-800/80 pb-6">
            <div className="flex items-center space-x-3 p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-300">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <h4 className="text-base font-bold">
                  MP4 Video Successfully Rendered!
                </h4>
                <p className="text-xs text-emerald-400/80">
                  Your privacy-protected meeting video ({settings.resolutionPreset.toUpperCase()}) is ready to upload to YouTube for Hindi auto-transcription.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400">
                Rendered MP4 Preview:
              </label>
              <div className="rounded-xl overflow-hidden border border-slate-800 bg-black aspect-video">
                <video
                  controls
                  src={outputBlobUrl}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <button
                onClick={startConversion}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Re-render Banner</span>
              </button>

              <div ref={downloadMenuRef} className="relative w-full sm:w-auto">
                {/* Upward Pop-up Format Selector Menu */}
                {showDownloadMenu && (
                  <div className="absolute bottom-full mb-3 right-0 sm:right-0 w-72 rounded-2xl bg-slate-900/95 border border-slate-700/80 shadow-2xl shadow-black/90 p-2.5 space-y-1.5 z-30 animate-in fade-in slide-in-from-bottom-2 duration-150 backdrop-blur-xl">
                    <div className="px-3 py-1.5 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Choose Export Format
                    </div>

                    {/* Option 1: Download MP3 (Audio) */}
                    <button
                      onClick={handleDownloadAudio}
                      className="w-full flex items-center space-x-3 p-2.5 rounded-xl hover:bg-indigo-600/20 border border-transparent hover:border-indigo-500/40 text-left transition-all group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/30 group-hover:scale-105 transition-transform">
                        <Music className="w-5 h-5" />
                      </div>
                      <div className="overflow-hidden">
                        <div className="text-xs font-bold text-slate-100 group-hover:text-indigo-300 transition-colors flex items-center space-x-1.5">
                          <span>Download MP3</span>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-500/30">
                            AUDIO
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">
                          {mediaState.parts && mediaState.parts.length > 1
                            ? `${mediaState.parts.length} Joined audio clips`
                            : "Clean voiceover audio stream"}
                        </p>
                      </div>
                    </button>

                    {/* Option 2: Download MP4 (Video) */}
                    <button
                      onClick={handleDownloadVideo}
                      className="w-full flex items-center space-x-3 p-2.5 rounded-xl hover:bg-emerald-600/20 border border-transparent hover:border-emerald-500/40 text-left transition-all group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30 group-hover:scale-105 transition-transform">
                        <Film className="w-5 h-5" />
                      </div>
                      <div className="overflow-hidden">
                        <div className="text-xs font-bold text-slate-100 group-hover:text-emerald-300 transition-colors flex items-center space-x-1.5">
                          <span>Download MP4</span>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                            VIDEO
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">
                          YouTube-ready 144p banner video
                        </p>
                      </div>
                    </button>
                  </div>
                )}

                {/* Main Download Button */}
                <button
                  onClick={() => setShowDownloadMenu((prev) => !prev)}
                  className="w-full sm:w-auto flex items-center justify-center space-x-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-xl shadow-emerald-500/25 transition-all transform hover:scale-[1.02]"
                >
                  <Download className="w-5 h-5" />
                  <span>Download</span>
                  <ChevronUp
                    className={`w-4 h-4 transition-transform duration-200 ${
                      showDownloadMenu ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 space-y-3">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <h4 className="font-bold text-sm">FFmpeg Conversion Failed</h4>
            </div>
            <p className="text-xs">{errorMessage}</p>
            <button
              onClick={startConversion}
              className="px-4 py-2 rounded-lg bg-red-800 hover:bg-red-700 text-white text-xs font-medium"
            >
              Try Again
            </button>
          </div>
        )}

      </div>

      {/* Ad & Execution Logs Section (Jump Target on Start Conversion) */}
      <div ref={adLogsRef} className="space-y-6 scroll-mt-24">
        {/* Non-intrusive Minimalist Ad Banner */}
        <AdSenseBanner />

        {/* Standalone FFmpeg Execution Logs Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur-md space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
              <Terminal className="w-4 h-4 text-slate-500" />
              <span>FFmpeg Execution Logs</span>
            </span>
            <span className="text-[10px] text-slate-500">
              {logs.length} entries
            </span>
          </div>

          <div
            ref={logContainerRef}
            className="h-40 rounded-xl bg-slate-950 border border-slate-800/80 p-3 font-mono text-[11px] text-slate-400 overflow-y-auto space-y-1"
          >
            {logs.length === 0 ? (
              <p className="text-slate-600 italic">
                Logs will appear here during execution...
              </p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="leading-tight">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-start pt-2">
        <button
          onClick={onPrevStep}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
      </div>
    </div>
  );
};
