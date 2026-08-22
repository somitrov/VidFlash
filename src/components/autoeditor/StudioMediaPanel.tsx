"use client";

import React, { useRef } from "react";
import {
  Upload,
  Music,
  Image as ImageIcon,
  Sparkles,
  Trash2,
  Clock,
  FolderOpen,
  CheckCircle2,
} from "lucide-react";
import { AudioTrackState, TimelineClip } from "@/types/autoeditor";
import { formatSecondsToTimecode } from "@/lib/engine/timestampParser";

interface StudioMediaPanelProps {
  audioTrack: AudioTrackState | null;
  clips: TimelineClip[];
  onUploadAudio: (files: File[]) => void;
  onUploadClips: (files: File[]) => void;
  onBuildTimeline: () => void;
  onRemoveAudio: () => void;
  onRemoveClip: (id: string) => void;
  onClearAllClips: () => void;
}

export const StudioMediaPanel: React.FC<StudioMediaPanelProps> = ({
  audioTrack,
  clips,
  onUploadAudio,
  onUploadClips,
  onBuildTimeline,
  onRemoveAudio,
  onRemoveClip,
  onClearAllClips,
}) => {
  const audioInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUploadAudio(Array.from(e.target.files));
    }
  };

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUploadClips(Array.from(e.target.files));
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Voiceover Audio Track Ingestion */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-indigo-300 font-bold text-sm">
            <Music className="w-4 h-4 text-indigo-400" />
            <span>1. Voiceover Narration</span>
          </div>
          {audioTrack && (
            <span className="text-[11px] font-mono text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
              {formatSecondsToTimecode(audioTrack.durationSec)}
            </span>
          )}
        </div>

        {!audioTrack ? (
          <div
            onClick={() => audioInputRef.current?.click()}
            className="border-2 border-dashed border-slate-800 hover:border-indigo-500/60 rounded-xl p-6 text-center cursor-pointer transition-all duration-200 bg-slate-950/50 hover:bg-indigo-950/20 group"
          >
            <input
              ref={audioInputRef}
              type="file"
              multiple
              accept="audio/*"
              className="hidden"
              onChange={handleAudioChange}
            />
            <div className="w-12 h-12 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition-transform">
              <Upload className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-slate-200">
              Click or drag voiceover audio here
            </p>
            <p className="text-[10px] text-slate-500 mt-1">
              Supports MP3, WAV, M4A, AAC, FLAC
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3 overflow-hidden">
                <div className="w-9 h-9 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/30">
                  <Music className="w-4 h-4" />
                </div>
                <div className="overflow-hidden">
                  <div className="text-xs font-bold text-slate-200 truncate">
                    {audioTrack.fileName}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Total Duration: {formatSecondsToTimecode(audioTrack.durationSec)}
                    {audioTrack.parts && audioTrack.parts.length > 1 && (
                      <span className="text-indigo-400 ml-1.5 font-medium">
                        ({audioTrack.parts.length} parts merged)
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={onRemoveAudio}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors shrink-0"
                title="Remove audio"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* If multi-part audio, show compact list */}
            {audioTrack.parts && audioTrack.parts.length > 1 && (
              <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                {audioTrack.parts.map((part, pIdx) => (
                  <div
                    key={pIdx}
                    className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-950/50 border border-slate-800/60 text-[10px]"
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <span className="font-mono text-slate-500 font-bold w-3 text-center">
                        {pIdx + 1}
                      </span>
                      <span className="text-slate-300 truncate">
                        {part.fileName}
                      </span>
                    </div>
                    <span className="font-mono text-emerald-400 shrink-0 ml-2">
                      {formatSecondsToTimecode(part.durationSec)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Batch Media Ingestion */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-purple-300 font-bold text-sm">
            <ImageIcon className="w-4 h-4 text-purple-400" />
            <span>2. Story Images & Clips</span>
          </div>
          {clips.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-mono text-purple-300 font-semibold bg-purple-950/60 border border-purple-500/30 px-2.5 py-0.5 rounded-full">
                {clips.length} items
              </span>
              <button
                onClick={onClearAllClips}
                className="text-[10px] text-slate-400 hover:text-red-400 transition-colors"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Upload Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => mediaInputRef.current?.click()}
            className="flex items-center justify-center space-x-1.5 p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-purple-500/60 text-slate-200 text-xs font-semibold transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-purple-400" />
            <span>Add Files</span>
          </button>
          <input
            ref={mediaInputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            className="hidden"
            onChange={handleMediaChange}
          />

          <button
            onClick={() => folderInputRef.current?.click()}
            className="flex items-center justify-center space-x-1.5 p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-purple-500/60 text-slate-200 text-xs font-semibold transition-colors"
          >
            <FolderOpen className="w-3.5 h-3.5 text-purple-400" />
            <span>Add Folder</span>
          </button>
          <input
            ref={folderInputRef}
            type="file"
            // @ts-expect-error webkitdirectory HTML attribute
            webkitdirectory=""
            directory=""
            multiple
            className="hidden"
            onChange={handleMediaChange}
          />
        </div>

        {/* Ingested Clips List */}
        {clips.length > 0 ? (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {clips.map((clip, idx) => (
              <div
                key={clip.id}
                className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between space-x-3 text-xs"
              >
                <div className="flex items-center space-x-2.5 overflow-hidden">
                  <span className="text-[10px] font-mono text-slate-500 font-bold w-4 text-center shrink-0">
                    {idx + 1}
                  </span>
                  <img
                    src={clip.mediaUrl}
                    alt={clip.fileName}
                    className="w-8 h-8 rounded-lg object-cover bg-slate-900 shrink-0 border border-slate-800"
                  />
                  <div className="overflow-hidden">
                    <div className="text-slate-200 font-medium truncate text-[11px]">
                      {clip.fileName}
                    </div>
                    {clip.parsedTimestampSec !== null ? (
                      <span className="inline-flex items-center space-x-1 text-[10px] text-emerald-400 font-mono">
                        <Clock className="w-2.5 h-2.5" />
                        <span>{formatSecondsToTimecode(clip.parsedTimestampSec)}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500">Auto sequential</span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => onRemoveClip(clip.id)}
                  className="p-1 rounded-md text-slate-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-slate-500 text-center py-4 italic">
            Drop timestamped images (e.g. 00_15_scene.png, 01_24_story.jpg)
          </p>
        )}

        {/* 3. Build Timeline Action Button */}
        <button
          onClick={onBuildTimeline}
          disabled={clips.length === 0}
          className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-lg ${
            clips.length > 0
              ? "bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-500 hover:from-purple-500 hover:to-emerald-400 text-white shadow-indigo-500/25 cursor-pointer transform hover:scale-[1.01]"
              : "bg-slate-800 text-slate-500 cursor-not-allowed opacity-50"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Build Timeline (Auto-Sync)</span>
        </button>
      </div>
    </div>
  );
};
