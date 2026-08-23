"use client";

import React, { useRef, useState } from "react";
import {
  Upload,
  Music,
  Image as ImageIcon,
  Sparkles,
  Trash2,
  Clock,
  FolderOpen,
  CheckCircle2,
  Film,
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

  const [isAudioDragging, setIsAudioDragging] = useState(false);
  const [isMediaDragging, setIsMediaDragging] = useState(false);

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUploadAudio(Array.from(e.target.files));
      e.target.value = "";
    }
  };

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUploadClips(Array.from(e.target.files));
      e.target.value = "";
    }
  };

  const handleAudioDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsAudioDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onUploadAudio(Array.from(e.dataTransfer.files));
    }
  };

  const handleMediaDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsMediaDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onUploadClips(Array.from(e.dataTransfer.files));
    }
  };

  return (
    <div className="bg-[#18181c] border border-[#2b2b36] rounded-xl overflow-hidden shadow-2xl flex flex-col h-[520px]">
      {/* Media Upload & Assets Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin flex flex-col justify-between">
        <div className="space-y-3">
          {/* Voiceover Audio Lane */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
              <span className="flex items-center space-x-1.5">
                <Music className="w-3 h-3 text-teal-400" />
                <span>Add Voiceover</span>
              </span>
            </div>

            {!audioTrack ? (
              <div
                onClick={() => audioInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsAudioDragging(true);
                }}
                onDragLeave={() => setIsAudioDragging(false)}
                onDrop={handleAudioDrop}
                className={`border border-dashed rounded-lg p-3 text-center cursor-pointer transition-all ${
                  isAudioDragging
                    ? "border-teal-400 bg-teal-950/40"
                    : "border-[#2b2b36] hover:border-teal-500/60 bg-[#121215] hover:bg-teal-950/20"
                } group`}
              >
                <input
                  ref={audioInputRef}
                  type="file"
                  multiple
                  accept="audio/*,.mp3,.wav,.m4a,.aac,.flac,.ogg,.opus,.weba,.wma,.aiff"
                  className="hidden"
                  onChange={handleAudioChange}
                />
                <Upload className="w-4 h-4 text-teal-400 mx-auto mb-1 group-hover:scale-110 transition-transform" />
                <p className="text-[11px] font-semibold text-slate-300">
                  Drop Voiceover Audio (MP3, WAV, M4A...)
                </p>
                <p className="text-[9px] text-slate-500 mt-0.5">
                  Single or multiple parts supported
                </p>
              </div>
            ) : (
              <div className="p-2 rounded-lg bg-[#121215] border border-[#2b2b36] flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2 overflow-hidden">
                  <div className="w-7 h-7 rounded bg-teal-600/20 text-teal-400 flex items-center justify-center shrink-0 border border-teal-500/30">
                    <Music className="w-3.5 h-3.5" />
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-[11px] font-bold text-slate-200 truncate">
                      {audioTrack.fileName}
                    </div>
                    <div className="text-[9px] text-slate-500 font-mono">
                      {formatSecondsToTimecode(audioTrack.durationSec)}
                      {audioTrack.parts && audioTrack.parts.length > 1 && (
                        <span className="text-teal-400 ml-1">
                          ({audioTrack.parts.length} parts)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={onRemoveAudio}
                  className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                  title="Remove Audio"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Story Images & Video Clips Dropzone */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
              <span className="flex items-center space-x-1.5">
                <Film className="w-3 h-3 text-purple-400" />
                <span>Story Media Bins</span>
              </span>
              {clips.length > 0 && (
                <button
                  onClick={onClearAllClips}
                  className="text-[10px] text-slate-500 hover:text-red-400 transition-colors font-mono"
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => mediaInputRef.current?.click()}
                className="flex items-center justify-center space-x-1.5 p-2 rounded-lg bg-[#121215] border border-[#2b2b36] hover:border-purple-500 text-slate-200 text-[11px] font-medium transition-colors"
              >
                <Upload className="w-3 h-3 text-purple-400" />
                <span>Add Files</span>
              </button>
              <input
                ref={mediaInputRef}
                type="file"
                multiple
                accept="image/*,video/*,audio/*,.png,.jpg,.jpeg,.webp,.gif,.bmp,.mp4,.webm,.mov,.mkv,.avi,.m4v,.flv,.mp3,.wav,.m4a,.aac,.flac,.ogg,.opus"
                className="hidden"
                onChange={handleMediaChange}
              />

              <button
                onClick={() => folderInputRef.current?.click()}
                className="flex items-center justify-center space-x-1.5 p-2 rounded-lg bg-[#121215] border border-[#2b2b36] hover:border-purple-500 text-slate-200 text-[11px] font-medium transition-colors"
              >
                <FolderOpen className="w-3 h-3 text-purple-400" />
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

            {/* Clips Thumbnail List / Bin View */}
            {clips.length > 0 ? (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {clips.map((clip, idx) => (
                  <div
                    key={clip.id}
                    className="p-1.5 rounded-lg bg-[#121215] border border-[#2b2b36] flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center space-x-2 overflow-hidden">
                      <span className="text-[9px] font-mono text-slate-500 font-bold w-4 text-center shrink-0">
                        {idx + 1}
                      </span>
                      <img
                        src={clip.mediaUrl}
                        alt={clip.fileName}
                        className="w-7 h-7 rounded object-cover bg-slate-900 shrink-0 border border-slate-800"
                      />
                      <div className="overflow-hidden">
                        <div className="text-slate-200 font-medium truncate text-[10px]">
                          {clip.fileName}
                        </div>
                        {clip.parsedTimestampSec !== null ? (
                          <span className="inline-flex items-center space-x-1 text-[9px] text-emerald-400 font-mono">
                            <Clock className="w-2.5 h-2.5" />
                            <span>{formatSecondsToTimecode(clip.parsedTimestampSec)}</span>
                          </span>
                        ) : (
                          <span className="text-[9px] text-slate-500">Auto seq</span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => onRemoveClip(clip.id)}
                      className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsMediaDragging(true);
                }}
                onDragLeave={() => setIsMediaDragging(false)}
                onDrop={handleMediaDrop}
                onClick={() => mediaInputRef.current?.click()}
                className={`border border-dashed rounded-lg p-4 text-center text-[10px] cursor-pointer transition-all ${
                  isMediaDragging
                    ? "border-purple-400 bg-purple-950/40 text-purple-200"
                    : "border-[#2b2b36] text-slate-500 bg-[#121215] hover:border-purple-500/60"
                } italic`}
              >
                No clips in media pool yet. Drag timestamped files/folders here.
              </div>
            )}
          </div>
        </div>

        {/* Build Timeline Action Button */}
        <button
          onClick={onBuildTimeline}
          disabled={clips.length === 0}
          className={`w-full py-2.5 px-3 rounded-lg font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-md mt-2 ${
            clips.length > 0
              ? "bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-500 hover:from-purple-500 hover:to-emerald-400 text-white shadow-indigo-500/20 cursor-pointer transform hover:scale-[1.01]"
              : "bg-slate-800 text-slate-500 cursor-not-allowed opacity-50"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Build Timeline</span>
        </button>
      </div>
    </div>
  );
};
