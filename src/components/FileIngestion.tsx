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
} from "lucide-react";
import { MediaFileState } from "@/types";

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

  const handleFile = async (file: File) => {
    setErrorMsg(null);
    setLoadingMedia(true);

    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    const isVideo = ["mp4", "mkv", "mov", "webm", "avi"].includes(ext);
    const isAudio = ["mp3", "wav", "aac", "m4a", "flac", "ogg"].includes(ext);

    if (!isVideo && !isAudio) {
      setErrorMsg(
        "Unsupported format. Please select an MP4, MKV, MOV, WebM, MP3, WAV, AAC, or M4A file."
      );
      setLoadingMedia(false);
      return;
    }

    const objectUrl = URL.createObjectURL(file);

    try {
      // Determine duration by loading into invisible Audio/Video element
      let duration = 0;
      if (isVideo) {
        duration = await new Promise<number>((resolve) => {
          const video = document.createElement("video");
          video.preload = "metadata";
          video.onloadedmetadata = () => {
            resolve(video.duration || 0);
          };
          video.onerror = () => resolve(0);
          video.src = objectUrl;
        });
      } else {
        duration = await new Promise<number>((resolve) => {
          const audio = document.createElement("audio");
          audio.preload = "metadata";
          audio.onloadedmetadata = () => {
            resolve(audio.duration || 0);
          };
          audio.onerror = () => resolve(0);
          audio.src = objectUrl;
        });
      }

      onMediaLoaded({
        file,
        mediaType: isVideo ? "video" : "audio",
        fileName: file.name,
        fileSize: file.size,
        duration,
        formattedDuration: formatSeconds(duration),
        previewUrl: objectUrl,
      });
    } catch (e) {
      console.error("Error inspecting media file:", e);
      setErrorMsg("Failed to read duration from file. You can still proceed.");
      onMediaLoaded({
        file,
        mediaType: isVideo ? "video" : "audio",
        fileName: file.name,
        fileSize: file.size,
        duration: 0,
        formattedDuration: "Unknown",
        previewUrl: objectUrl,
      });
    } finally {
      setLoadingMedia(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2 mb-6">
        <h2 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
          Step 1: Select Audio or Video Recording
        </h2>
        <p className="text-sm text-slate-400 max-w-2xl mx-auto">
          Upload your meeting recording (MP4/MKV video or MP3/WAV audio). Video feeds containing sensitive screen shares will be safely stripped locally.
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
          accept="video/mp4,video/x-matroska,video/webm,video/quicktime,audio/mpeg,audio/wav,audio/aac,audio/x-m4a,audio/*,video/*"
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
                Supports <span className="text-indigo-300 font-medium">MP4, MKV, MOV, WebM, MP3, WAV, AAC, M4A</span> (Unlimited file size)
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
            <div className="pt-2">
              <div className="text-xs font-medium text-slate-400 mb-2">
                Audio Stream Preview:
              </div>
              <audio
                controls
                src={mediaState.previewUrl}
                className="w-full h-10 rounded-lg bg-slate-950"
              />
            </div>
          )}

          {/* Proceed Button */}
          <div className="pt-4 flex justify-end">
            <button
              onClick={onNextStep}
              className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 transition-all transform hover:-translate-y-0.5"
            >
              <span>Next: Customize Visual Banner</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
