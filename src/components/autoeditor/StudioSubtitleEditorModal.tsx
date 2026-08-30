"use client";

import React, { useState, useEffect } from "react";
import {
  Type,
  X,
  Plus,
  Trash2,
  Search,
  Sparkles,
  Clock,
  FileText,
  Check,
  RotateCcw,
  ArrowUpDown,
  FileCode,
  List,
} from "lucide-react";
import { SubtitleCue } from "@/types/autoeditor";
import { formatSecondsToTimecode } from "@/lib/engine/timestampParser";
import { parseScriptOrSRTContent } from "./StudioSubtitlesPanel";

interface StudioSubtitleEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  subtitles: SubtitleCue[];
  scriptFileName?: string | null;
  onSaveSubtitles: (updatedCues: SubtitleCue[]) => void;
}

export const StudioSubtitleEditorModal: React.FC<StudioSubtitleEditorModalProps> = ({
  isOpen,
  onClose,
  subtitles,
  scriptFileName,
  onSaveSubtitles,
}) => {
  const [cues, setCues] = useState<SubtitleCue[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"cues" | "raw">("cues");
  const [rawText, setRawText] = useState<string>("");
  const [shiftSeconds, setShiftSeconds] = useState<number>(0.5);

  // Sync cues when modal opens
  useEffect(() => {
    if (isOpen) {
      const cloned = subtitles.map((c) => ({ ...c }));
      setCues(cloned);
      setRawText(generateSrtString(cloned));
    }
  }, [isOpen, subtitles]);

  if (!isOpen) return null;

  // Convert cues array to formatted SRT string
  function generateSrtString(cueList: SubtitleCue[]): string {
    return cueList
      .map((c, i) => {
        const start = formatSrtTimestamp(c.startSec);
        const end = formatSrtTimestamp(c.endSec);
        return `${i + 1}\n${start} --> ${end}\n${c.text}\n`;
      })
      .join("\n");
  }

  function formatSrtTimestamp(seconds: number): string {
    const s = Math.max(0, seconds);
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = Math.floor(s % 60);
    const ms = Math.round((s % 1) * 1000);
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")},${ms
      .toString()
      .padStart(3, "0")}`;
  }

  // Edit single cue text
  const handleUpdateText = (id: string, newText: string) => {
    setCues((prev) =>
      prev.map((c) => (c.id === id ? { ...c, text: newText } : c))
    );
  };

  // Edit single cue timing
  const handleUpdateTiming = (
    id: string,
    field: "startSec" | "endSec",
    val: number
  ) => {
    setCues((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: Math.max(0, val) } : c))
    );
  };

  // Delete cue
  const handleDeleteCue = (id: string) => {
    setCues((prev) => prev.filter((c) => c.id !== id));
  };

  // Insert cue after
  const handleInsertAfter = (index: number) => {
    const current = cues[index];
    const newStart = current ? current.endSec : 0;
    const newCue: SubtitleCue = {
      id: `cue_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      text: "New subtitle line...",
      startSec: newStart,
      endSec: newStart + 2.5,
    };
    const next = [...cues];
    next.splice(index + 1, 0, newCue);
    setCues(next);
  };

  // Add cue at end
  const handleAddAtEnd = () => {
    const last = cues[cues.length - 1];
    const newStart = last ? last.endSec : 0;
    const newCue: SubtitleCue = {
      id: `cue_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      text: "New subtitle line...",
      startSec: newStart,
      endSec: newStart + 2.5,
    };
    setCues([...cues, newCue]);
  };

  // Clean transcription watermarks (TurboScribe, Whisper, etc.)
  const handleCleanWatermarks = () => {
    const cleaned = cues
      .map((c) => {
        let t = c.text;
        // Strip TurboScribe and watermark tags
        t = t.replace(
          /\(?Transcribed by TurboScribe\.?.*?(?:remove this message\.\)?)?/gi,
          ""
        );
        t = t.replace(
          /Transcribed by (?:TurboScribe|Whisper|Otter\.ai|Rev\.com)/gi,
          ""
        );
        t = t.replace(/https?:\/\/\S+/gi, "");
        t = t.trim();
        return { ...c, text: t };
      })
      .filter((c) => c.text.length > 0);

    setCues(cleaned);
  };

  // Shift all cues forward or backward
  const handleShiftTimings = (delta: number) => {
    setCues((prev) =>
      prev.map((c) => ({
        ...c,
        startSec: Math.max(0, Number((c.startSec + delta).toFixed(3))),
        endSec: Math.max(0.1, Number((c.endSec + delta).toFixed(3))),
      }))
    );
  };

  // Save changes and close
  const handleSave = () => {
    if (activeTab === "raw") {
      const parsed = parseScriptOrSRTContent(rawText);
      onSaveSubtitles(parsed);
    } else {
      onSaveSubtitles(cues);
    }
    onClose();
  };

  // Filtered cues for search
  const filteredCues = cues.filter((c) =>
    c.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#18181c] border border-[#2b2b36] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden shadow-emerald-950/20">
        {/* Header */}
        <div className="p-4 bg-[#121215] border-b border-[#2b2b36] flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Type className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold text-white">
                  Subtitle & Transcript Editor
                </h2>
                <span className="text-[10px] font-bold bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 px-2 py-0.5 rounded-full font-mono">
                  {cues.length} Cues
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-md">
                {scriptFileName || "Active SRT / TXT Subtitle Track"}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* View Mode Toggle */}
            <div className="flex items-center p-0.5 bg-[#18181c] border border-[#2b2b36] rounded-lg">
              <button
                onClick={() => {
                  if (activeTab === "raw") {
                    const parsed = parseScriptOrSRTContent(rawText);
                    setCues(parsed);
                  }
                  setActiveTab("cues");
                }}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  activeTab === "cues"
                    ? "bg-emerald-500 text-slate-950 font-bold shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Cues List</span>
              </button>
              <button
                onClick={() => {
                  setRawText(generateSrtString(cues));
                  setActiveTab("raw");
                }}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  activeTab === "raw"
                    ? "bg-emerald-500 text-slate-950 font-bold shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>Raw SRT Text</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Toolbar (Only in Cues List Mode) */}
        {activeTab === "cues" && (
          <div className="p-3 bg-[#141418] border-b border-[#2b2b36] flex flex-wrap items-center justify-between gap-2 shrink-0">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[220px] max-w-sm">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search words or lines..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#18181c] border border-[#2b2b36] focus:border-emerald-500/50 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none"
              />
            </div>

            {/* Quick Action Tools */}
            <div className="flex items-center space-x-2">
              {/* Clean Watermarks Button */}
              <button
                onClick={handleCleanWatermarks}
                className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-950/60 border border-indigo-500/30 hover:border-indigo-400 text-indigo-300 text-xs font-semibold transition-colors cursor-pointer"
                title="Remove TurboScribe, Whisper or transcription watermarks"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Clean Watermarks</span>
              </button>

              {/* Shift Timings */}
              <div className="flex items-center space-x-1 bg-[#18181c] border border-[#2b2b36] rounded-lg p-1 text-xs">
                <Clock className="w-3.5 h-3.5 text-slate-400 ml-1" />
                <span className="text-[10px] text-slate-400">Shift:</span>
                <button
                  onClick={() => handleShiftTimings(-shiftSeconds)}
                  className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-[10px] cursor-pointer"
                >
                  -{shiftSeconds}s
                </button>
                <button
                  onClick={() => handleShiftTimings(shiftSeconds)}
                  className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-[10px] cursor-pointer"
                >
                  +{shiftSeconds}s
                </button>
              </div>

              {/* Add New Line */}
              <button
                onClick={handleAddAtEnd}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-600/20 border border-emerald-500/30 hover:bg-emerald-600/30 text-emerald-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Cue</span>
              </button>
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
          {activeTab === "cues" ? (
            filteredCues.length > 0 ? (
              <div className="space-y-2.5">
                {filteredCues.map((cue, index) => {
                  const duration = Math.max(0, cue.endSec - cue.startSec);
                  return (
                    <div
                      key={cue.id}
                      className="p-3 bg-[#121215] border border-[#2b2b36] hover:border-slate-600/70 rounded-xl transition-all flex items-start gap-3 group"
                    >
                      {/* Cue Number Badge */}
                      <div className="flex flex-col items-center justify-center w-8 pt-1 text-slate-500 font-mono text-xs font-bold shrink-0">
                        <span>#{index + 1}</span>
                      </div>

                      {/* Timestamps */}
                      <div className="flex flex-col space-y-1.5 shrink-0 w-32">
                        <div className="flex items-center space-x-1">
                          <span className="text-[10px] font-mono text-slate-500 w-8">
                            Start:
                          </span>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={cue.startSec}
                            onChange={(e) =>
                              handleUpdateTiming(
                                cue.id,
                                "startSec",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-20 bg-[#18181c] border border-[#2b2b36] rounded px-1.5 py-0.5 text-[11px] font-mono text-emerald-300 focus:border-emerald-500 focus:outline-none"
                          />
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className="text-[10px] font-mono text-slate-500 w-8">
                            End:
                          </span>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={cue.endSec}
                            onChange={(e) =>
                              handleUpdateTiming(
                                cue.id,
                                "endSec",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-20 bg-[#18181c] border border-[#2b2b36] rounded px-1.5 py-0.5 text-[11px] font-mono text-emerald-300 focus:border-emerald-500 focus:outline-none"
                          />
                        </div>
                        <span className="text-[9px] font-mono text-slate-500 pl-8">
                          ({duration.toFixed(1)}s dur)
                        </span>
                      </div>

                      {/* Subtitle Text Input */}
                      <div className="flex-1 min-w-0">
                        <textarea
                          rows={2}
                          value={cue.text}
                          onChange={(e) =>
                            handleUpdateText(cue.id, e.target.value)
                          }
                          className="w-full bg-[#18181c] border border-[#2b2b36] focus:border-emerald-500/60 rounded-lg p-2 text-xs text-white placeholder:text-slate-600 focus:outline-none resize-none leading-relaxed"
                          placeholder="Subtitle text..."
                        />
                      </div>

                      {/* Row Actions */}
                      <div className="flex flex-col items-center space-y-1 shrink-0 pt-0.5">
                        <button
                          onClick={() => handleInsertAfter(index)}
                          title="Insert line below"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-300 hover:bg-emerald-950/40 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCue(cue.id)}
                          title="Delete cue"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/40 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center space-y-2 border border-dashed border-[#2b2b36] rounded-xl">
                <Search className="w-6 h-6 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400 font-medium">
                  {searchQuery
                    ? `No cues found matching "${searchQuery}"`
                    : "No subtitle cues loaded"}
                </p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="text-xs text-emerald-400 hover:underline cursor-pointer"
                  >
                    Clear search filter
                  </button>
                )}
              </div>
            )
          ) : (
            <div className="h-full flex flex-col space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Edit Full SRT Script (Standard SRT Timestamp Format)</span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {rawText.split("\n").length} Lines
                </span>
              </div>
              <textarea
                rows={18}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                className="w-full h-full min-h-[380px] bg-[#121215] border border-[#2b2b36] rounded-xl p-3 text-xs font-mono text-emerald-200 placeholder:text-slate-600 focus:border-emerald-500/60 focus:outline-none leading-relaxed resize-none scrollbar-thin"
                placeholder="1\n00:00:01,000 --> 00:00:03,000\nYour subtitle caption..."
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#121215] border-t border-[#2b2b36] flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-400">
            <span>Total: </span>
            <span className="font-bold text-white font-mono">{cues.length} Cues</span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/25 flex items-center space-x-2 transition-all cursor-pointer transform hover:scale-[1.02]"
            >
              <Check className="w-4 h-4" />
              <span>Save & Apply Subtitles</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
