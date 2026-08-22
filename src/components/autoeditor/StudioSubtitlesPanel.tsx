"use client";

import React, { useRef } from "react";
import {
  Type,
  Palette,
  Upload,
  Plus,
  Trash2,
  Sliders,
  ArrowUp,
  Minus,
  ArrowDown,
} from "lucide-react";
import { SubtitleCue, SubtitleStyleConfig } from "@/types/autoeditor";
import { formatSecondsToTimecode } from "@/lib/engine/timestampParser";

interface StudioSubtitlesPanelProps {
  subtitles: SubtitleCue[];
  styleConfig: SubtitleStyleConfig;
  onUpdateSubtitles: (cues: SubtitleCue[]) => void;
  onUpdateStyleConfig: (config: SubtitleStyleConfig) => void;
}

export const StudioSubtitlesPanel: React.FC<StudioSubtitlesPanelProps> = ({
  subtitles,
  styleConfig,
  onUpdateSubtitles,
  onUpdateStyleConfig,
}) => {
  const srtInputRef = useRef<HTMLInputElement>(null);

  const handleAddCue = () => {
    const lastCue = subtitles[subtitles.length - 1];
    const startSec = lastCue ? lastCue.endSec : 0;
    const newCue: SubtitleCue = {
      id: `sub_${Date.now()}`,
      text: "Enter subtitle caption...",
      startSec,
      endSec: startSec + 3,
    };
    onUpdateSubtitles([...subtitles, newCue]);
  };

  const handleRemoveCue = (id: string) => {
    onUpdateSubtitles(subtitles.filter((c) => c.id !== id));
  };

  const handleUpdateCueText = (id: string, text: string) => {
    onUpdateSubtitles(
      subtitles.map((c) => (c.id === id ? { ...c, text } : c))
    );
  };

  const handleImportScript = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        const parsed = parseScriptOrSRTContent(content);
        if (parsed.length > 0) {
          onUpdateSubtitles(parsed);
        }
      };
      reader.readAsText(e.target.files[0]);
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-md space-y-5">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2 text-amber-300 font-bold text-sm">
          <Type className="w-4 h-4 text-amber-400" />
          <span>Subtitles & Dynamic Captions</span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => srtInputRef.current?.click()}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-amber-500/50 hover:text-white text-slate-300 text-xs font-semibold transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-amber-400" />
            <span>Import Script</span>
          </button>
          <input
            ref={srtInputRef}
            type="file"
            accept=".srt,.vtt,.txt,text/plain"
            className="hidden"
            onChange={handleImportScript}
          />

          <button
            onClick={handleAddCue}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-amber-600/20 border border-amber-500/30 text-amber-300 hover:bg-amber-600/30 text-xs font-semibold transition-colors"
          >
            <Plus className="w-3 h-3" />
            <span>Add Line</span>
          </button>
        </div>
      </div>

      {/* Style Customizer Controls */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        {/* Font Family */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-400">
            Font Style
          </label>
          <select
            value={styleConfig.fontFamily}
            onChange={(e) =>
              onUpdateStyleConfig({ ...styleConfig, fontFamily: e.target.value })
            }
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="Poppins">Poppins</option>
            <option value="Open Sans">Open Sans</option>
            <option value="Impact">Impact (Shorts Style)</option>
            <option value="sans-serif">System Sans</option>
          </select>
        </div>

        {/* Font Size */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-400">
            Size ({styleConfig.fontSize}px)
          </label>
          <input
            type="range"
            min="20"
            max="60"
            value={styleConfig.fontSize}
            onChange={(e) =>
              onUpdateStyleConfig({
                ...styleConfig,
                fontSize: parseInt(e.target.value, 10),
              })
            }
            className="w-full accent-amber-500 mt-2"
          />
        </div>

        {/* Text Color */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-400">
            Text Color
          </label>
          <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 rounded-lg p-1.5">
            <input
              type="color"
              value={styleConfig.color}
              onChange={(e) =>
                onUpdateStyleConfig({ ...styleConfig, color: e.target.value })
              }
              className="w-6 h-6 rounded bg-transparent cursor-pointer border-0"
            />
            <span className="font-mono text-[11px] text-slate-300">
              {styleConfig.color}
            </span>
          </div>
        </div>

        {/* Position */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-400">
            Position
          </label>
          <div className="grid grid-cols-3 gap-1 bg-slate-950 border border-slate-800 rounded-lg p-1">
            <button
              onClick={() =>
                onUpdateStyleConfig({ ...styleConfig, position: "top" })
              }
              className={`p-1 rounded flex items-center justify-center ${
                styleConfig.position === "top"
                  ? "bg-amber-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Top"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() =>
                onUpdateStyleConfig({ ...styleConfig, position: "center" })
              }
              className={`p-1 rounded flex items-center justify-center ${
                styleConfig.position === "center"
                  ? "bg-amber-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Center"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() =>
                onUpdateStyleConfig({ ...styleConfig, position: "bottom" })
              }
              className={`p-1 rounded flex items-center justify-center ${
                styleConfig.position === "bottom"
                  ? "bg-amber-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Bottom"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Subtitles Cues List */}
      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
        {subtitles.map((cue, idx) => (
          <div
            key={cue.id}
            className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/90 flex items-center space-x-3 text-xs"
          >
            <span className="text-[10px] font-mono text-slate-500 w-4 text-center font-bold shrink-0">
              {idx + 1}
            </span>
            <div className="font-mono text-[10px] text-amber-400 shrink-0 w-24">
              {formatSecondsToTimecode(cue.startSec)} &rarr;{" "}
              {formatSecondsToTimecode(cue.endSec)}
            </div>
            <input
              type="text"
              value={cue.text}
              onChange={(e) => handleUpdateCueText(cue.id, e.target.value)}
              className="flex-1 bg-transparent border-b border-transparent focus:border-amber-500 text-slate-200 focus:outline-none text-xs"
            />
            <button
              onClick={() => handleRemoveCue(cue.id)}
              className="p-1 text-slate-500 hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {subtitles.length === 0 && (
          <p className="text-[11px] text-slate-500 text-center py-3 italic">
            No captions added yet. Click &quot;Add Line&quot; or import a script / transcript (.txt, .srt).
          </p>
        )}
      </div>
    </div>
  );
};

export function parseScriptOrSRTContent(rawText: string): SubtitleCue[] {
  if (!rawText || !rawText.trim()) return [];

  // 1. Check if standard SRT / VTT format
  if (/-->\s*\d{1,2}:\d{2}:\d{2}/.test(rawText)) {
    const lines = rawText.replace(/\r\n/g, "\n").split("\n");
    const cues: SubtitleCue[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i].trim();
      if (!line) {
        i++;
        continue;
      }

      if (/^\d+$/.test(line) || line.includes("-->")) {
        let timeLine = line;
        if (/^\d+$/.test(line)) {
          i++;
          if (i >= lines.length) break;
          timeLine = lines[i].trim();
        }

        const match = timeLine.match(
          /(\d{1,2}):(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*(\d{1,2}):(\d{2}):(\d{2})[,.](\d{3})/
        );

        if (match) {
          const startSec =
            parseInt(match[1], 10) * 3600 +
            parseInt(match[2], 10) * 60 +
            parseInt(match[3], 10) +
            parseInt(match[4], 10) / 1000;

          const endSec =
            parseInt(match[5], 10) * 3600 +
            parseInt(match[6], 10) * 60 +
            parseInt(match[7], 10) +
            parseInt(match[8], 10) / 1000;

          i++;
          let text = "";
          while (i < lines.length && lines[i].trim() !== "") {
            text += (text ? " " : "") + lines[i].trim();
            i++;
          }

          cues.push({
            id: `srt_${cues.length}`,
            text,
            startSec: Number(startSec.toFixed(2)),
            endSec: Number(endSec.toFixed(2)),
          });
        }
      }
      i++;
    }
    if (cues.length > 0) return cues;
  }

  // 2. Parse Text with Inline or Multiline Timestamps: (0:00), (0:02), [01:24], (18:23), etc.
  const timeRegex = /[\(\[\<]?\b(?:(\d{1,2}):)?(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\b[\)\]\>]?/g;
  const matches: { startIdx: number; endIdx: number; timeSec: number }[] = [];
  let m: RegExpExecArray | null;

  while ((m = timeRegex.exec(rawText)) !== null) {
    const fullMatch = m[0];
    const hrs = m[1] ? parseInt(m[1], 10) : 0;
    const mins = parseInt(m[2], 10);
    const secs = parseInt(m[3], 10);
    const ms = m[4] ? parseFloat(`0.${m[4]}`) : 0;
    const totalSec = hrs * 3600 + mins * 60 + secs + ms;

    matches.push({
      startIdx: m.index,
      endIdx: m.index + fullMatch.length,
      timeSec: totalSec,
    });
  }

  if (matches.length === 0) {
    const lines = rawText.split(/[\n\r]+/).map((l) => l.trim()).filter(Boolean);
    return lines.map((text, idx) => ({
      id: `script_${idx}`,
      text,
      startSec: idx * 3,
      endSec: (idx + 1) * 3,
    }));
  }

  const cues: SubtitleCue[] = [];
  for (let k = 0; k < matches.length; k++) {
    const curr = matches[k];
    const next = matches[k + 1];

    const textStart = curr.endIdx;
    const textEnd = next ? next.startIdx : rawText.length;
    let text = rawText.slice(textStart, textEnd).trim();

    // Clean up leading/trailing delimiters
    text = text.replace(/^[\:\-\s\>\)\]]+/, "").replace(/[\(\[\<]+$/, "").trim();
    if (!text) continue;

    const startSec = curr.timeSec;
    let endSec = next
      ? next.timeSec
      : startSec + Math.max(2.5, text.split(/\s+/).length * 0.4);

    if (endSec <= startSec) {
      endSec = startSec + 2.5;
    }

    cues.push({
      id: `script_${cues.length}`,
      text,
      startSec: Number(startSec.toFixed(2)),
      endSec: Number(endSec.toFixed(2)),
    });
  }

  return cues;
}
