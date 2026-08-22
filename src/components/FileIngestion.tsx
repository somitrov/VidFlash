"use client";

import React, { useRef, useState } from "react";
import {
  Upload,
  FileAudio,
  FileVideo,
  CheckCircle2,
  AlertCircle,
  Clock,
  HardDrive,
  ArrowRight,
  Sparkles,
  Zap,
  ListMusic,
} from "lucide-react";
import { MediaFileState } from "@/types";
import { AdSenseBanner } from "@/components/AdSenseBanner";
import { decodeAudioFiles, audioBufferToWavBlob } from "@/lib/engine/audioEngine";

interface FileIngestionProps {
  mediaState: MediaFileState;
  onMediaLoaded: (media: MediaFileState) => void;
  onNextStep: () => void;
}

export const FileIngestion: React.FC<FileIngestionProps> = ({
  mediaState,
  onMediaLoaded,
  onNextStep,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatSeconds = (seconds: number) => {
    if (isNaN(seconds) || seconds <= 0) return "00:00";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) {
      return `${hrs}:${mins < 10 ? "0" : ""}${mins}:${
        secs < 10 ? "0" : ""
      }${secs}`;
    }
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleFiles = async (files: File[]) => {
    if (!files || files.length === 0) return;
    setErrorMsg(null);
    setLoadingMedia(true);

    try {
      // Check if single video file
      if (files.length === 1) {
        const file = files[0];
        const ext = file.name.split(".").pop()?.toLowerCase() || "";
        const isVideo = ["mp4", "mkv", "mov", "webm", "avi", "3gp"].includes(ext);

        if (isVideo) {
          const objectUrl = URL.createObjectURL(file);
          const duration = await new Promise<number>((resolve) => {
            const video = document.createElement("video");
            video.preload = "metadata";
            video.onloadedmetadata = () => resolve(video.duration || 0);
            video.onerror = () => resolve(0);
            video.src = objectUrl;
          });

          onMediaLoaded({
            file,
            mediaType: "video",
            fileName: file.name,
            fileSize: file.size,
            duration,
            formattedDuration: formatSeconds(duration),
            previewUrl: objectUrl,
          });
          return;
        }
      }

      // Audio ingestion (single or multi-part audio joining)
      const audioExts = ["mp3", "wav", "aac", "m4a", "amr", "flac", "ogg", "wma", "opus"];
      const audioFiles = files.filter((f) => {
        const ext = f.name.split(".").pop()?.toLowerCase() || "";
        return audioExts.includes(ext) || f.type.startsWith("audio/");
      });

      if (audioFiles.length === 0) {
        setErrorMsg("Unsupported format. Please select AAC (.m4a), MP3, AMR, WAV, FLAC, OGG, or video files.");
        return;
      }

      const decoded = await decodeAudioFiles(audioFiles);
      const totalSize = audioFiles.reduce((acc, f) => acc + f.size, 0);

      // Create synthetic audio File from merged WAV blob if multiple files
      let finalFile: File | null = audioFiles[0];
      if (audioFiles.length > 1 && decoded.audioBuffer) {
        const wavBlob = audioBufferToWavBlob(decoded.audioBuffer);
        finalFile = new File([wavBlob], `${decoded.fileName}.wav`, { type: "audio/wav" });
      }

      onMediaLoaded({
        file: finalFile,
        audioBlob: decoded.audioBuffer ? audioBufferToWavBlob(decoded.audioBuffer) : null,
        files: audioFiles,
        parts: decoded.parts?.map((p) => ({ fileName: p.fileName, duration: p.durationSec })),
        mediaType: "audio",
        fileName: decoded.fileName,
        fileSize: totalSize,
        duration: decoded.durationSec,
        formattedDuration: formatSeconds(decoded.durationSec),
        previewUrl: decoded.audioUrl,
      });
    } catch (e) {
      console.error("Error inspecting media file:", e);
      setErrorMsg("Failed to decode audio. Please check file formats.");
    } finally {
      setLoadingMedia(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2 mb-6">
        <h2 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
          Step 1: Select Audio or Video Recording
        </h2>
        <p className="text-sm text-slate-400 max-w-2xl mx-auto">
          Upload your meeting recording in <span className="text-indigo-300 font-medium">AAC (.m4a), MP3, AMR, WAV</span>, FLAC, OGG, or video formats (MP4/MKV). Video feeds with sensitive screen shares are safely stripped locally.
        </p>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-200 overflow-hidden ${
          isDragging
            ? "border-indigo-500 bg-indigo-950/40 shadow-2xl shadow-indigo-500/20 scale-[1.01]"
            : mediaState.file
            ? "border-emerald-500/60 bg-emerald-950/10 hover:border-emerald-500"
            : "border-slate-800 bg-slate-900/40 hover:border-indigo-500/60 hover:bg-slate-900/70"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="audio/aac,audio/x-m4a,audio/m4a,audio/mpeg,audio/mp3,audio/amr,audio/3gpp,audio/wav,audio/x-wav,audio/flac,audio/ogg,video/mp4,video/x-matroska,video/webm,video/quicktime,audio/*,video/*"
          className="hidden"
          onChange={handleInputChange}
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${
              mediaState.file
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
            }`}
          >
            {loadingMedia ? (
              <div className="w-8 h-8 border-3 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            ) : mediaState.mediaType === "video" ? (
              <FileVideo className="w-8 h-8" />
            ) : mediaState.mediaType === "audio" ? (
              <FileAudio className="w-8 h-8" />
            ) : (
              <Upload className="w-8 h-8" />
            )}
          </div>

          {!mediaState.file ? (
            <div>
              <p className="text-base font-semibold text-slate-200">
                Drag & drop your meeting recording file here
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Supports <span className="text-indigo-300 font-medium">AAC (.m4a), MP3, AMR, WAV, FLAC, OGG, MP4, MKV</span> (Unlimited file size)
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span className="text-base font-bold text-emerald-300 truncate max-w-md">
                  {mediaState.fileName}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Click or drag another file to replace
              </p>
            </div>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center space-x-2 p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-sm">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Selected Media Metadata Card */}
      {mediaState.file && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4 backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Ingested File Metadata</span>
            </h3>
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-800 text-indigo-300 border border-indigo-500/30 uppercase">
              {mediaState.mediaType} Stream Detected
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
              <HardDrive className="w-5 h-5 text-indigo-400 shrink-0" />
              <div>
                <div className="text-[11px] text-slate-400">File Size</div>
                <div className="text-sm font-semibold text-slate-200">
                  {formatFileSize(mediaState.fileSize)}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
              <Clock className="w-5 h-5 text-purple-400 shrink-0" />
              <div>
                <div className="text-[11px] text-slate-400">Duration</div>
                <div className="text-sm font-semibold text-slate-200">
                  {mediaState.formattedDuration}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
              <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <div className="text-[11px] text-slate-400">Privacy Status</div>
                <div className="text-xs font-semibold text-emerald-400 truncate">
                  {mediaState.mediaType === "video"
                    ? "Video stripped; Audio preserved"
                    : "Ready for YouTube Muxing"}
                </div>
              </div>
            </div>
          </div>

          {/* Media Audio Preview */}
          {mediaState.previewUrl && (
            <div className="pt-2 space-y-3">
              <div className="text-xs font-medium text-slate-400">
                Audio Stream Preview:
              </div>
              <audio
                controls
                src={mediaState.previewUrl}
                className="w-full h-10 rounded-lg bg-slate-950"
              />

              {/* Multi-Audio Parts Breakdown */}
              {mediaState.parts && mediaState.parts.length > 1 && (
                <div className="space-y-1.5 p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-indigo-300 mb-1">
                    <ListMusic className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Merged Audio Sequence ({mediaState.parts.length} clips joined in order)</span>
                  </div>
                  <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
                    {mediaState.parts.map((part, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between px-2.5 py-1 rounded-lg bg-slate-900/60 border border-slate-800/60 text-[11px]"
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <span className="font-mono text-slate-500 font-bold w-3 text-center">
                            {idx + 1}
                          </span>
                          <span className="text-slate-300 truncate">
                            {part.fileName}
                          </span>
                        </div>
                        <span className="font-mono text-emerald-400 shrink-0 ml-2">
                          {formatSeconds(part.duration)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Proceed Button */}
          <div className="pt-4 flex justify-end">
            <button
              onClick={onNextStep}
              className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 transition-all transform hover:-translate-y-0.5"
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Non-intrusive Auto-Optimized Ad Banner */}
      <AdSenseBanner />
    </div>
  );
};
