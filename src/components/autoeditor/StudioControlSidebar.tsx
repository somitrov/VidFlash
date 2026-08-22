"use client";

import React, { useRef } from "react";
import {
  Sparkles,
  Sliders,
  Type,
  Shuffle,
  Volume2,
  Tv,
  Smartphone,
  Square,
  Upload,
  Layers,
  Sparkle,
  Sun,
  Activity,
  CheckCircle2,
} from "lucide-react";
import {
  TimelineClip,
  SubtitleCue,
  SubtitleStyleConfig,
  AspectRatioPreset,
  ResolutionDimensions,
  TransitionEffect,
  StudioSettings,
} from "@/types/autoeditor";
import { formatSecondsToTimecode, parseTimestampFromFilename } from "@/lib/engine/timestampParser";
import { parseScriptOrSRTContent } from "./StudioSubtitlesPanel";
import { playSynthesizedSfx } from "@/lib/engine/sfxEngine";

interface StudioControlSidebarProps {
  clips: TimelineClip[];
  subtitles: SubtitleCue[];
  subtitleStyle: SubtitleStyleConfig;
  settings: StudioSettings;
  aspectRatio: AspectRatioPreset;
  resolution: ResolutionDimensions;
  totalDurationSec: number;
  isExporting: boolean;
  exportProgress: number;
  onChangeAspectRatio: (ratio: AspectRatioPreset) => void;
  onUpdateSettings: (newSettings: Partial<StudioSettings>) => void;
  onUpdateSubtitles: (cues: SubtitleCue[]) => void;
  onUpdateSubtitleStyle: (style: SubtitleStyleConfig) => void;
  onApplyTransitionToAll: (transition: TransitionEffect) => void;
  onShuffleTransitions: () => void;
  onStartRender: () => void;
}

const TRANSITION_OPTIONS: { id: TransitionEffect; label: string; icon: string }[] = [
  { id: "cut", label: "None", icon: "⊘" },
  { id: "crossfade", label: "Crossfade", icon: "✦" },
  { id: "fade-to-black", label: "Fade to black", icon: "◐" },
  { id: "wipe-left", label: "Wipe left", icon: "◧" },
  { id: "wipe-right", label: "Wipe right", icon: "◨" },
  { id: "slide-left", label: "Slide left", icon: "⇠" },
  { id: "slide-right", label: "Slide right", icon: "⇢" },
  { id: "circle-open", label: "Circle open", icon: "◉" },
  { id: "flash-white", label: "Flash white", icon: "☼" },
];

export const StudioControlSidebar: React.FC<StudioControlSidebarProps> = ({
  clips,
  subtitles,
  subtitleStyle,
  settings,
  aspectRatio,
  resolution,
  totalDurationSec,
  isExporting,
  exportProgress,
  onChangeAspectRatio,
  onUpdateSettings,
  onUpdateSubtitles,
  onUpdateSubtitleStyle,
  onApplyTransitionToAll,
  onShuffleTransitions,
  onStartRender,
}) => {
  const scriptInputRef = useRef<HTMLInputElement>(null);

  const handleScriptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        const parsed = parseScriptOrSRTContent(text);
        if (parsed.length > 0) {
          onUpdateSubtitles(parsed);
        }
      };
      reader.readAsText(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-4 max-h-[850px] overflow-y-auto pr-1 scrollbar-thin">
      {/* 1. EXPORT / RENDER CARD */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 backdrop-blur-md space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Export Settings
          </span>
          <span className="text-[10px] font-mono text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
            Client-Side Turbo
          </span>
        </div>

        {/* Aspect Ratio & FPS Selectors */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <label className="text-[10px] text-slate-400 font-semibold block mb-1">
              Aspect
            </label>
            <select
              value={aspectRatio}
              onChange={(e) => onChangeAspectRatio(e.target.value as AspectRatioPreset)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-slate-200 text-xs font-semibold focus:outline-none focus:border-indigo-500"
            >
              <option value="16:9">16:9 — 1920x1080</option>
              <option value="9:16">9:16 — 1080x1920</option>
              <option value="1:1">1:1 — 1080x1080</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 font-semibold block mb-1">
              Frame Rate (FPS)
            </label>
            <select
              value={settings.fps}
              onChange={(e) =>
                onUpdateSettings({
                  fps: parseInt(e.target.value, 10) as 24 | 30 | 60,
                })
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-slate-200 text-xs font-semibold focus:outline-none focus:border-indigo-500 font-mono"
            >
              <option value="24">24 fps (Cinematic)</option>
              <option value="30">30 fps (Standard)</option>
              <option value="60">60 fps (Ultra Smooth)</option>
            </select>
          </div>
        </div>

        {/* Metadata Summary */}
        <div className="space-y-1.5 p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px]">
          <div className="flex items-center justify-between text-slate-400">
            <span>Resolution</span>
            <span className="font-mono text-slate-200 font-bold">
              {resolution.width}×{resolution.height}
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>Images & Clips</span>
            <span className="font-mono text-slate-200 font-bold">
              {clips.length}
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>Total Length</span>
            <span className="font-mono text-emerald-400 font-bold">
              {formatSecondsToTimecode(totalDurationSec)}
            </span>
          </div>
        </div>

        {/* Render MP4 Button */}
        <button
          onClick={onStartRender}
          disabled={clips.length === 0 || isExporting}
          className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 transition-all shadow-xl ${
            isExporting
              ? "bg-slate-800 text-slate-400 cursor-wait"
              : clips.length > 0
              ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-indigo-500/25 cursor-pointer transform hover:scale-[1.02] active:scale-98"
              : "bg-slate-800 text-slate-600 cursor-not-allowed opacity-50"
          }`}
        >
          {isExporting ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Rendering MP4 ({exportProgress}%)</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4" />
              <span>Render MP4</span>
            </div>
          )}
        </button>
      </div>

      {/* 2. SCENE FADES CARD */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 backdrop-blur-md space-y-4 shadow-xl">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Scene Fades
          </span>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Fade the opening and ending (video & audio)
          </p>
        </div>

        <div className="space-y-3">
          {/* Fade In */}
          <div className="flex items-center justify-between space-x-3">
            <span className="text-xs text-slate-300 font-medium w-16">
              Fade In
            </span>
            <input
              type="range"
              min="0"
              max="3"
              step="0.1"
              value={settings.fadeInSec}
              onChange={(e) =>
                onUpdateSettings({ fadeInSec: parseFloat(e.target.value) })
              }
              className="flex-1 accent-indigo-500 h-1.5 bg-slate-950 rounded-lg cursor-pointer"
            />
            <span className="text-xs font-mono text-indigo-400 font-bold w-10 text-right">
              {settings.fadeInSec.toFixed(1)}s
            </span>
          </div>

          {/* Fade Out */}
          <div className="flex items-center justify-between space-x-3">
            <span className="text-xs text-slate-300 font-medium w-16">
              Fade Out
            </span>
            <input
              type="range"
              min="0"
              max="3"
              step="0.1"
              value={settings.fadeOutSec}
              onChange={(e) =>
                onUpdateSettings({ fadeOutSec: parseFloat(e.target.value) })
              }
              className="flex-1 accent-indigo-500 h-1.5 bg-slate-950 rounded-lg cursor-pointer"
            />
            <span className="text-xs font-mono text-indigo-400 font-bold w-10 text-right">
              {settings.fadeOutSec.toFixed(1)}s
            </span>
          </div>
        </div>
      </div>

      {/* 3. TRANSITIONS CARD (Manual + Random Mix) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 backdrop-blur-md space-y-3 shadow-xl">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Transitions
          </span>
          <button
            onClick={() => {
              const next = !settings.randomTransitions;
              onUpdateSettings({ randomTransitions: next });
              if (next) onShuffleTransitions();
            }}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors border ${
              settings.randomTransitions
                ? "bg-purple-950/80 border-purple-500 text-purple-300 shadow-sm"
                : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            <Shuffle className="w-3 h-3 text-purple-400" />
            <span>Random mix</span>
          </button>
        </div>

        <p className="text-[10px] text-slate-500">
          Tap a cut marker on the timeline or choose a transition below:
        </p>

        {/* Transition Options Grid */}
        <div className="grid grid-cols-2 gap-1.5">
          {TRANSITION_OPTIONS.map((opt) => {
            const isSelected = settings.selectedTransition === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => {
                  onUpdateSettings({
                    selectedTransition: opt.id,
                    randomTransitions: false,
                  });
                  onApplyTransitionToAll(opt.id);
                }}
                className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all text-left ${
                  isSelected
                    ? "bg-indigo-600/30 border-indigo-500 text-indigo-200 shadow-sm"
                    : "bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200"
                }`}
              >
                <span className="text-sm">{opt.icon}</span>
                <span className="truncate">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. CAPTIONS & TIMESTAMPED SCRIPT CARD */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 backdrop-blur-md space-y-3.5 shadow-xl">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Captions & Script
          </span>
          {subtitles.length > 0 && (
            <span className="text-[10px] font-mono text-amber-400 font-semibold bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded-full">
              {subtitles.length} lines
            </span>
          )}
        </div>

        <button
          onClick={() => scriptInputRef.current?.click()}
          className="w-full py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/60 text-slate-200 text-xs font-semibold flex items-center justify-center space-x-2 transition-colors group"
        >
          <Type className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
          <span>Upload timestamped script (.txt / .srt)</span>
        </button>
        <input
          ref={scriptInputRef}
          type="file"
          accept=".txt,.srt,.vtt,text/plain"
          className="hidden"
          onChange={handleScriptUpload}
        />

        <p className="text-[10px] text-slate-500 leading-relaxed">
          An <span className="text-amber-400">.srt</span>, <span className="text-amber-400">.vtt</span>, or timestamped <span className="text-amber-400">.txt</span> — inline markers like <code className="text-slate-400 font-mono">(0:03)</code> work automatically.
        </p>

        {/* Font Style Controls */}
        <div className="space-y-2 pt-1 border-t border-slate-800">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Size ({subtitleStyle.fontSize}px)</span>
            <input
              type="range"
              min="20"
              max="60"
              value={subtitleStyle.fontSize}
              onChange={(e) =>
                onUpdateSubtitleStyle({
                  ...subtitleStyle,
                  fontSize: parseInt(e.target.value, 10),
                })
              }
              className="w-32 accent-amber-500 h-1.5 bg-slate-950 rounded-lg cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Position</span>
            <div className="flex items-center space-x-1 p-0.5 bg-slate-950 rounded-lg border border-slate-800">
              {(["top", "center", "bottom"] as const).map((pos) => (
                <button
                  key={pos}
                  onClick={() =>
                    onUpdateSubtitleStyle({ ...subtitleStyle, position: pos })
                  }
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold capitalize ${
                    subtitleStyle.position === pos
                      ? "bg-amber-500 text-slate-950"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 5. SOUND EFFECTS (SFX) & AUTO WHOOSH */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 backdrop-blur-md space-y-3 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Volume2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Transition SFX
            </span>
          </div>
          <button
            onClick={() => {
              const next = !settings.enableSfx;
              onUpdateSettings({ enableSfx: next });
              if (next) playSynthesizedSfx("whoosh");
            }}
            className={`w-10 h-5 rounded-full transition-colors relative p-0.5 ${
              settings.enableSfx ? "bg-emerald-600" : "bg-slate-800"
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform ${
                settings.enableSfx ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        <p className="text-[10px] text-slate-500">
          Plays cinematic swoosh audio at each scene transition.
        </p>

        {/* Quick SFX preview triggers */}
        <div className="grid grid-cols-3 gap-1.5 pt-1">
          <button
            onClick={() => playSynthesizedSfx("whoosh")}
            className="px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-[10px] text-slate-300 hover:border-emerald-500 hover:text-emerald-300 transition-colors font-mono"
          >
            Whoosh
          </button>
          <button
            onClick={() => playSynthesizedSfx("pop")}
            className="px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-[10px] text-slate-300 hover:border-emerald-500 hover:text-emerald-300 transition-colors font-mono"
          >
            Pop
          </button>
          <button
            onClick={() => playSynthesizedSfx("chime")}
            className="px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-[10px] text-slate-300 hover:border-emerald-500 hover:text-emerald-300 transition-colors font-mono"
          >
            Chime
          </button>
        </div>
      </div>

      {/* 6. PARTICLES & AMBIENT GLOW */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 backdrop-blur-md space-y-3 shadow-xl">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
          Visual Overlays
        </span>

        <div className="space-y-2.5 pt-1">
          {/* Floating Particles */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs text-slate-300">
              <Sparkle className="w-3.5 h-3.5 text-purple-400" />
              <span>Geometric Floating Particles</span>
            </div>
            <button
              onClick={() =>
                onUpdateSettings({ enableParticles: !settings.enableParticles })
              }
              className={`w-9 h-5 rounded-full transition-colors relative p-0.5 ${
                settings.enableParticles ? "bg-purple-600" : "bg-slate-800"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.enableParticles ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Ambient Video Glow */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs text-slate-300">
              <Sun className="w-3.5 h-3.5 text-indigo-400" />
              <span>Ambient Cinematic Vignette</span>
            </div>
            <button
              onClick={() => onUpdateSettings({ enableGlow: !settings.enableGlow })}
              className={`w-9 h-5 rounded-full transition-colors relative p-0.5 ${
                settings.enableGlow ? "bg-indigo-600" : "bg-slate-800"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.enableGlow ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
