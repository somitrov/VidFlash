"use client";

import React, { useState, useRef } from "react";
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
  Video,
  Music,
  SlidersHorizontal,
  FolderOpen,
  Eye,
  CheckCircle2,
  Play,
} from "lucide-react";
import {
  TimelineClip,
  SubtitleCue,
  SubtitleStyleConfig,
  AspectRatioPreset,
  ResolutionDimensions,
  TransitionEffect,
  StudioSettings,
  HardwareProfile,
} from "@/types/autoeditor";
import { formatSecondsToTimecode } from "@/lib/engine/timestampParser";
import { parseScriptOrSRTContent } from "./StudioSubtitlesPanel";
import { SFX_LIBRARY, playAudioSfx } from "@/lib/engine/sfxEngine";

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

type InspectorTab = "export" | "video" | "transitions" | "captions" | "audio" | "effects";

const TRANSITION_OPTIONS: { id: TransitionEffect; label: string; icon: string; category?: string }[] = [
  { id: "cut", label: "None / Hard Cut", icon: "⊘" },
  { id: "crossfade", label: "Crossfade Dissolve", icon: "✦" },
  { id: "light-leak", label: "Light Leak & Flare", icon: "☀️" },
  { id: "glow-flash", label: "Optical Bloom Flash", icon: "✨" },
  { id: "zoom-in", label: "Cinematic Zoom In", icon: "🔍" },
  { id: "zoom-out", label: "Cinematic Zoom Out", icon: "🔎" },
  { id: "zoom-blur", label: "Whip Zoom Blur", icon: "💨" },
  { id: "glitch", label: "RGB Glitch Distortion", icon: "⚡" },
  { id: "stretch-glow", label: "Pixel Stretch Glow", icon: "💫" },
  { id: "spin-360", label: "Spin Roll 360", icon: "🌀" },
  { id: "whip-pan-left", label: "Whip Pan Left", icon: "⇚" },
  { id: "whip-pan-right", label: "Whip Pan Right", icon: "⇛" },
  { id: "whip-pan-up", label: "Whip Pan Up", icon: "⇑" },
  { id: "whip-pan-down", label: "Whip Pan Down", icon: "⇓" },
  { id: "slide-left", label: "Slide Left", icon: "⇠" },
  { id: "slide-right", label: "Slide Right", icon: "⇢" },
  { id: "circle-open", label: "Iris Circle Open", icon: "◉" },
  { id: "flash-white", label: "Flash White Strobe", icon: "☼" },
  { id: "fade-to-black", label: "Fade to Black", icon: "◐" },
  { id: "wipe-left", label: "Wipe Left", icon: "◧" },
  { id: "wipe-right", label: "Wipe Right", icon: "◨" },
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
  const [activeTab, setActiveTab] = useState<InspectorTab>("export");
  const scriptInputRef = useRef<HTMLInputElement>(null);

  const activeSfxId = settings.selectedSfxId || "clean-fast-swoosh";

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
    <div className="bg-[#18181c] border border-[#2b2b36] rounded-xl overflow-hidden shadow-2xl flex flex-col h-[520px]">
      {/* DaVinci Inspector Top Bar */}
      <div className="bg-[#121215] border-b border-[#2b2b36] px-3 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
            Inspector
          </span>
        </div>

        <span className="text-[10px] font-mono text-slate-500">
          {clips.length} Clips Loaded
        </span>
      </div>

      {/* DaVinci Resolve Tab Navigation Header */}
      <div className="flex items-center border-b border-[#2b2b36] bg-[#141418] px-1 overflow-x-auto scrollbar-none text-[11px]">
        <button
          onClick={() => setActiveTab("export")}
          className={`flex items-center space-x-1.5 px-3 py-2 border-b-2 font-semibold transition-colors shrink-0 ${
            activeTab === "export"
              ? "border-red-500 text-white bg-[#1f1f26]"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Render</span>
        </button>

        <button
          onClick={() => setActiveTab("video")}
          className={`flex items-center space-x-1.5 px-3 py-2 border-b-2 font-semibold transition-colors shrink-0 ${
            activeTab === "video"
              ? "border-red-500 text-white bg-[#1f1f26]"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Video className="w-3.5 h-3.5 text-indigo-400" />
          <span>Video</span>
        </button>

        <button
          onClick={() => setActiveTab("transitions")}
          className={`flex items-center space-x-1.5 px-3 py-2 border-b-2 font-semibold transition-colors shrink-0 ${
            activeTab === "transitions"
              ? "border-red-500 text-white bg-[#1f1f26]"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Shuffle className="w-3.5 h-3.5 text-purple-400" />
          <span>Transitions</span>
        </button>

        <button
          onClick={() => setActiveTab("captions")}
          className={`flex items-center space-x-1.5 px-3 py-2 border-b-2 font-semibold transition-colors shrink-0 ${
            activeTab === "captions"
              ? "border-red-500 text-white bg-[#1f1f26]"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Type className="w-3.5 h-3.5 text-emerald-400" />
          <span>Captions</span>
        </button>

        <button
          onClick={() => setActiveTab("audio")}
          className={`flex items-center space-x-1.5 px-3 py-2 border-b-2 font-semibold transition-colors shrink-0 ${
            activeTab === "audio"
              ? "border-red-500 text-white bg-[#1f1f26]"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Music className="w-3.5 h-3.5 text-teal-400" />
          <span>Audio SFX</span>
        </button>

        <button
          onClick={() => setActiveTab("effects")}
          className={`flex items-center space-x-1.5 px-3 py-2 border-b-2 font-semibold transition-colors shrink-0 ${
            activeTab === "effects"
              ? "border-red-500 text-white bg-[#1f1f26]"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Sparkle className="w-3.5 h-3.5 text-pink-400" />
          <span>Effects</span>
        </button>
      </div>

      {/* DaVinci Inspector Body Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {/* TAB 1: RENDER & EXPORT */}
        {activeTab === "export" && (
          <div className="space-y-4">
            <div className="space-y-3">
              {/* Aspect Ratio & FPS */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] text-slate-400 font-semibold block mb-1">
                    Timeline Format
                  </label>
                  <select
                    value={aspectRatio}
                    onChange={(e) => onChangeAspectRatio(e.target.value as AspectRatioPreset)}
                    className="w-full bg-[#121215] border border-[#2b2b36] rounded-lg px-2.5 py-1.5 text-slate-200 text-xs font-semibold focus:outline-none focus:border-red-500"
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
                    className="w-full bg-[#121215] border border-[#2b2b36] rounded-lg px-2.5 py-1.5 text-slate-200 text-xs font-semibold focus:outline-none focus:border-red-500 font-mono"
                  >
                    <option value="24">24 fps (Cinematic)</option>
                    <option value="30">30 fps (Standard)</option>
                    <option value="60">60 fps (Ultra Smooth)</option>
                  </select>
                </div>
              </div>

              {/* Compression & Quality Preset */}
              <div>
                <label className="text-[10px] text-slate-400 font-semibold block mb-1">
                  Bitrate Compression Preset
                </label>
                <select
                  value={settings.qualityPreset || "optimized"}
                  onChange={(e) =>
                    onUpdateSettings({
                      qualityPreset: e.target.value as "optimized" | "high" | "compact",
                    })
                  }
                  className="w-full bg-[#121215] border border-[#2b2b36] rounded-lg px-2.5 py-1.5 text-slate-200 text-xs font-semibold focus:outline-none focus:border-red-500"
                >
                  <option value="optimized">⚡ Optimized Web & YouTube (~16 MB/min)</option>
                  <option value="compact">📱 Ultra Compact / Low Data (~9 MB/min)</option>
                  <option value="high">🎬 Studio High Fidelity (~33 MB/min)</option>
                </select>
              </div>

              {/* Hardware Power Governor */}
              <div>
                <label className="text-[10px] text-slate-400 font-semibold block mb-1">
                  Hardware Power Allocation
                </label>
                <select
                  value={settings.hardwareProfile || "balanced"}
                  onChange={(e) =>
                    onUpdateSettings({
                      hardwareProfile: e.target.value as HardwareProfile,
                    })
                  }
                  className="w-full bg-[#121215] border border-[#2b2b36] rounded-lg px-2.5 py-1.5 text-slate-200 text-xs font-semibold focus:outline-none focus:border-red-500 font-mono"
                >
                  <option value="balanced">⚡ 60% CPU • 80% RAM • 100% GPU (Balanced)</option>
                  <option value="turbo">🚀 100% CPU • 100% RAM • 100% GPU (Max Turbo)</option>
                  <option value="silent">🍃 40% CPU • 50% RAM • 100% GPU (Silent)</option>
                </select>
              </div>

              {/* Metadata Card */}
              <div className="p-3 rounded-lg bg-[#121215] border border-[#2b2b36] space-y-1.5 text-[11px] font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Resolution</span>
                  <span className="text-slate-200 font-bold">{resolution.width}×{resolution.height}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Clips Ingested</span>
                  <span className="text-slate-200 font-bold">{clips.length}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Master Duration</span>
                  <span className="text-emerald-400 font-bold">{formatSecondsToTimecode(totalDurationSec)}</span>
                </div>
              </div>

              {/* Render Button */}
              <button
                onClick={onStartRender}
                disabled={clips.length === 0 || isExporting}
                className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-xl ${
                  isExporting
                    ? "bg-slate-800 text-slate-400 cursor-wait"
                    : clips.length > 0
                    ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-indigo-500/25 cursor-pointer transform hover:scale-[1.01]"
                    : "bg-slate-800 text-slate-600 cursor-not-allowed opacity-50"
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>{isExporting ? `Rendering (${exportProgress}%)` : "Render MP4 Video"}</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: VIDEO & SCENE FADES */}
        {activeTab === "video" && (
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#2b2b36]">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Scene Fades
                </span>
                <span className="text-[10px] text-slate-500">Video & Audio</span>
              </div>

              {/* Fade In */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Opening Fade In</span>
                  <span className="font-mono text-indigo-400 font-bold">{settings.fadeInSec.toFixed(1)}s</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="3"
                  step="0.1"
                  value={settings.fadeInSec}
                  onChange={(e) => onUpdateSettings({ fadeInSec: parseFloat(e.target.value) })}
                  className="w-full accent-indigo-500 h-1.5 bg-[#121215] rounded-lg cursor-pointer"
                />
              </div>

              {/* Fade Out */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Ending Fade Out</span>
                  <span className="font-mono text-indigo-400 font-bold">{settings.fadeOutSec.toFixed(1)}s</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="3"
                  step="0.1"
                  value={settings.fadeOutSec}
                  onChange={(e) => onUpdateSettings({ fadeOutSec: parseFloat(e.target.value) })}
                  className="w-full accent-indigo-500 h-1.5 bg-[#121215] rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: TRANSITIONS */}
        {activeTab === "transitions" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#2b2b36]">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Scene Cuts & Blends
              </span>
              <button
                onClick={() => {
                  const next = !settings.randomTransitions;
                  onUpdateSettings({ randomTransitions: next });
                  if (next) onShuffleTransitions();
                }}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-[10px] font-bold border transition-colors ${
                  settings.randomTransitions
                    ? "bg-purple-950/80 border-purple-500 text-purple-300"
                    : "bg-[#121215] border-[#2b2b36] text-slate-400 hover:text-slate-200"
                }`}
              >
                <Shuffle className="w-3 h-3 text-purple-400" />
                <span>Random mix</span>
              </button>
            </div>

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
                    className={`flex items-center space-x-2 px-2.5 py-2 rounded-lg text-xs font-medium border transition-all text-left ${
                      isSelected
                        ? "bg-indigo-600/30 border-indigo-500 text-indigo-200 shadow-sm"
                        : "bg-[#121215] border-[#2b2b36] hover:border-slate-700 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <span>{opt.icon}</span>
                    <span className="truncate text-[11px]">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: CAPTIONS */}
        {activeTab === "captions" && (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-[#2b2b36]">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Captions & Script
              </span>
              {subtitles.length > 0 && (
                <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  {subtitles.length} lines
                </span>
              )}
            </div>

            <button
              onClick={() => scriptInputRef.current?.click()}
              className="w-full py-2.5 px-3 rounded-lg bg-[#121215] border border-[#2b2b36] hover:border-emerald-500 text-slate-200 text-xs font-semibold flex items-center justify-center space-x-2 transition-colors"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              <span>Import Script (.txt / .srt)</span>
            </button>
            <input
              ref={scriptInputRef}
              type="file"
              accept=".txt,.srt,.vtt,text/plain"
              className="hidden"
              onChange={handleScriptUpload}
            />

            {/* Typography Controls */}
            <div className="space-y-2 pt-1 border-t border-[#2b2b36] text-xs">
              <div className="flex items-center justify-between">
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
                  className="w-28 accent-emerald-500 h-1.5 bg-[#121215] rounded-lg cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Position</span>
                <div className="flex items-center space-x-1 p-0.5 bg-[#121215] rounded-md border border-[#2b2b36]">
                  {(["top", "center", "bottom"] as const).map((pos) => (
                    <button
                      key={pos}
                      onClick={() => onUpdateSubtitleStyle({ ...subtitleStyle, position: pos })}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold capitalize ${
                        subtitleStyle.position === pos
                          ? "bg-emerald-500 text-slate-950 font-bold"
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
        )}

        {/* TAB 5: AUDIO SFX LIBRARY */}
        {activeTab === "audio" && (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-[#2b2b36]">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200 block">
                  Transition SFX
                </span>
                <span className="text-[10px] text-teal-400">
                  Default: Fast Swoosh on every cut
                </span>
              </div>
              <button
                onClick={() => {
                  const next = !settings.enableSfx;
                  onUpdateSettings({ enableSfx: next });
                  if (next) playAudioSfx(activeSfxId);
                }}
                className={`w-9 h-5 rounded-full transition-colors relative p-0.5 ${
                  settings.enableSfx ? "bg-teal-600" : "bg-slate-800"
                }`}
                title={settings.enableSfx ? "Disable Transition SFX" : "Enable Transition SFX"}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    settings.enableSfx ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-slate-400 font-semibold block">
                Active Transition SFX
              </label>
              <select
                value={activeSfxId}
                onChange={(e) => {
                  const sfxId = e.target.value;
                  onUpdateSettings({ selectedSfxId: sfxId });
                  playAudioSfx(sfxId);
                }}
                className="w-full bg-[#121215] border border-[#2b2b36] rounded-lg px-2.5 py-1.5 text-teal-300 text-xs font-semibold focus:outline-none focus:border-teal-500"
              >
                {SFX_LIBRARY.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Categorized SFX Test & Select Grid */}
            <div className="space-y-2 pt-1 border-t border-[#2b2b36]">
              <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                Sound Effects Library ({SFX_LIBRARY.length} Sounds)
              </div>

              <div className="grid grid-cols-2 gap-1.5 max-h-52 overflow-y-auto pr-1 scrollbar-thin">
                {SFX_LIBRARY.map((item) => {
                  const isSelected = activeSfxId === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onUpdateSettings({ selectedSfxId: item.id });
                        playAudioSfx(item.id);
                      }}
                      className={`flex items-center justify-between p-2 rounded-lg text-left text-xs border transition-all ${
                        isSelected
                          ? "bg-teal-950/80 border-teal-500 text-teal-200"
                          : "bg-[#121215] border-[#2b2b36] text-slate-300 hover:border-slate-600"
                      }`}
                    >
                      <span className="truncate text-[11px]">{item.name}</span>
                      <Play className="w-3 h-3 text-teal-400 shrink-0 ml-1 fill-teal-400" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: EFFECTS & OVERLAYS */}
        {activeTab === "effects" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#2b2b36]">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200 block">
                  Visual FX & Overlays
                </span>
                <span className="text-[10px] text-pink-400">
                  GPU-Accelerated 60FPS Compositor Filters
                </span>
              </div>
            </div>

            {/* SECTION 1: FILM, NOIR & TEXTURE */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                🎞️ Film & Texture Overlays
              </span>

              {/* 1. Old Film Grain */}
              <div className="p-2 rounded-lg bg-[#121215] border border-[#2b2b36] flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-200">
                    Old Film Grain & Scratches
                  </div>
                  <p className="text-[10px] text-slate-500">
                    High-density 35mm film grain & flickering scratch lines
                  </p>
                </div>
                <button
                  onClick={() =>
                    onUpdateSettings({
                      enableFilmGrain: !settings.enableFilmGrain,
                    })
                  }
                  className={`w-9 h-5 rounded-full transition-colors relative p-0.5 ${
                    settings.enableFilmGrain ? "bg-amber-600" : "bg-slate-800"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      settings.enableFilmGrain
                        ? "translate-x-4"
                        : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* 2. Old Cinema Projector Particles */}
              <div className="p-2 rounded-lg bg-[#121215] border border-[#2b2b36] flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-200">
                    Old Cinema Projector & Dust
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Projector beam light flicker & drifting dust motes
                  </p>
                </div>
                <button
                  onClick={() =>
                    onUpdateSettings({
                      enableOldCinema: !settings.enableOldCinema,
                    })
                  }
                  className={`w-9 h-5 rounded-full transition-colors relative p-0.5 ${
                    settings.enableOldCinema ? "bg-amber-500" : "bg-slate-800"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      settings.enableOldCinema
                        ? "translate-x-4"
                        : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* 3. Black & White Noir */}
              <div className="p-2 rounded-lg bg-[#121215] border border-[#2b2b36] flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-200">
                    Black & White Film Noir
                  </div>
                  <p className="text-[10px] text-slate-500">
                    High-contrast classic monochrome cinema grade
                  </p>
                </div>
                <button
                  onClick={() =>
                    onUpdateSettings({
                      enableBlackAndWhite: !settings.enableBlackAndWhite,
                    })
                  }
                  className={`w-9 h-5 rounded-full transition-colors relative p-0.5 ${
                    settings.enableBlackAndWhite ? "bg-slate-300" : "bg-slate-800"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-slate-900 transition-transform ${
                      settings.enableBlackAndWhite
                        ? "translate-x-4"
                        : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* 4. Vintage Sepia */}
              <div className="p-2 rounded-lg bg-[#121215] border border-[#2b2b36] flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-200">
                    Vintage Sepia / Warm 35mm
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Atmospheric golden cinema amber tone
                  </p>
                </div>
                <button
                  onClick={() =>
                    onUpdateSettings({
                      enableVintageSepia: !settings.enableVintageSepia,
                    })
                  }
                  className={`w-9 h-5 rounded-full transition-colors relative p-0.5 ${
                    settings.enableVintageSepia
                      ? "bg-amber-600"
                      : "bg-slate-800"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      settings.enableVintageSepia
                        ? "translate-x-4"
                        : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* SECTION 2: GEOMETRIC & RETRO HUD */}
            <div className="space-y-2 pt-1 border-t border-[#2b2b36]">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                📐 Geometric & Retro HUD Overlays
              </span>

              {/* 5. Geometric Tech Grid */}
              <div className="p-2 rounded-lg bg-[#121215] border border-[#2b2b36] flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-200">
                    Geometric Tech Grid & HUD
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Framing brackets, crosshairs, reticle & rule-of-thirds
                  </p>
                </div>
                <button
                  onClick={() =>
                    onUpdateSettings({
                      enableGeometricGrid: !settings.enableGeometricGrid,
                    })
                  }
                  className={`w-9 h-5 rounded-full transition-colors relative p-0.5 ${
                    settings.enableGeometricGrid
                      ? "bg-indigo-600"
                      : "bg-slate-800"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      settings.enableGeometricGrid
                        ? "translate-x-4"
                        : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* 6. VHS Retro Scanlines */}
              <div className="p-2 rounded-lg bg-[#121215] border border-[#2b2b36] flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-200">
                    VHS Retro Glitch & CRT
                  </div>
                  <p className="text-[10px] text-slate-500">
                    80s CRT scanlines, tracking jitter & red REC
                  </p>
                </div>
                <button
                  onClick={() =>
                    onUpdateSettings({
                      enableVhsScanlines: !settings.enableVhsScanlines,
                    })
                  }
                  className={`w-9 h-5 rounded-full transition-colors relative p-0.5 ${
                    settings.enableVhsScanlines ? "bg-red-600" : "bg-slate-800"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      settings.enableVhsScanlines
                        ? "translate-x-4"
                        : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* SECTION 3: CINEMA & OPTICS */}
            <div className="space-y-2 pt-1 border-t border-[#2b2b36]">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                🎬 Cinema & Optics Overlays
              </span>

              {/* 7. Cinemascope Letterbox */}
              <div className="p-2 rounded-lg bg-[#121215] border border-[#2b2b36] flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-200">
                    Cinemascope Letterbox (2.39:1)
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Classic theatrical widescreen black matte bars
                  </p>
                </div>
                <button
                  onClick={() =>
                    onUpdateSettings({
                      enableLetterbox: !settings.enableLetterbox,
                    })
                  }
                  className={`w-9 h-5 rounded-full transition-colors relative p-0.5 ${
                    settings.enableLetterbox ? "bg-cyan-600" : "bg-slate-800"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      settings.enableLetterbox
                        ? "translate-x-4"
                        : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* 8. Prism Glow */}
              <div className="p-2 rounded-lg bg-[#121215] border border-[#2b2b36] flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-200">
                    Prism / Dreamy Optical Glow
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Chromatic dispersion flare & soft warm haze
                  </p>
                </div>
                <button
                  onClick={() =>
                    onUpdateSettings({
                      enablePrismGlow: !settings.enablePrismGlow,
                    })
                  }
                  className={`w-9 h-5 rounded-full transition-colors relative p-0.5 ${
                    settings.enablePrismGlow ? "bg-purple-600" : "bg-slate-800"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      settings.enablePrismGlow
                        ? "translate-x-4"
                        : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* 9. Floating Particles */}
              <div className="p-2 rounded-lg bg-[#121215] border border-[#2b2b36] flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-200">
                    Floating Golden Particles
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Drifting illuminated embers & ambient bokeh
                  </p>
                </div>
                <button
                  onClick={() =>
                    onUpdateSettings({
                      enableParticles: !settings.enableParticles,
                    })
                  }
                  className={`w-9 h-5 rounded-full transition-colors relative p-0.5 ${
                    settings.enableParticles ? "bg-amber-500" : "bg-slate-800"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      settings.enableParticles
                        ? "translate-x-4"
                        : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* 10. Ambient Vignette */}
              <div className="p-2 rounded-lg bg-[#121215] border border-[#2b2b36] flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-200">
                    Ambient Dark Vignette
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Deep cinematic edge gradient shading
                  </p>
                </div>
                <button
                  onClick={() =>
                    onUpdateSettings({ enableGlow: !settings.enableGlow })
                  }
                  className={`w-9 h-5 rounded-full transition-colors relative p-0.5 ${
                    settings.enableGlow ? "bg-slate-300" : "bg-slate-800"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-slate-900 transition-transform ${
                      settings.enableGlow ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
