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
  Trash2,
  Clapperboard,
  Film,
  FileText,
  Pencil,
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
  BgmTrackState,
} from "@/types/autoeditor";
import { formatSecondsToTimecode } from "@/lib/engine/timestampParser";
import { parseScriptOrSRTContent } from "./StudioSubtitlesPanel";
import { SFX_LIBRARY, playAudioSfx } from "@/lib/engine/sfxEngine";
import { StudioSubtitleEditorModal } from "./StudioSubtitleEditorModal";

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
  bgmTrack?: BgmTrackState | null;
  onUploadBgm?: (file: File) => void;
  onRemoveBgm?: () => void;
  onUpdateBgm?: (updates: Partial<BgmTrackState>) => void;
  onChangeAspectRatio: (ratio: AspectRatioPreset) => void;
  onUpdateSettings: (newSettings: Partial<StudioSettings>) => void;
  onUpdateSubtitles: (cues: SubtitleCue[]) => void;
  onUpdateSubtitleStyle: (style: SubtitleStyleConfig) => void;
  onApplyTransitionToAll: (transition: TransitionEffect) => void;
  onShuffleTransitions: () => void;
  onStartRender: () => void;
  onOpenRenderSettings?: () => void;
}

type InspectorTab = "video" | "audio" | "transitions" | "captions" | "effects" | "doodle";

const TRANSITION_OPTIONS: { id: TransitionEffect; label: string; icon: string; category?: string }[] = [
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
  bgmTrack,
  onUploadBgm,
  onRemoveBgm,
  onUpdateBgm,
  onChangeAspectRatio,
  onUpdateSettings,
  onUpdateSubtitles,
  onUpdateSubtitleStyle,
  onApplyTransitionToAll,
  onShuffleTransitions,
  onStartRender,
  onOpenRenderSettings,
}) => {
  const [activeTab, setActiveTab] = useState<InspectorTab>("video");
  const [scriptFileName, setScriptFileName] = useState<string | null>(null);
  const [isSubtitleEditorOpen, setIsSubtitleEditorOpen] = useState<boolean>(false);
  const scriptInputRef = useRef<HTMLInputElement>(null);
  const bgmInputRef = useRef<HTMLInputElement>(null);

  const activeSfxId = settings.selectedSfxId || "clean-fast-swoosh";

  const handleScriptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setScriptFileName(file.name);
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        const parsed = parseScriptOrSRTContent(text);
        if (parsed.length > 0) {
          onUpdateSubtitles(parsed);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="bg-[#18181c] border border-[#2b2b36] rounded-xl overflow-hidden shadow-2xl flex flex-col h-[520px]">
      {/* Video Settings Top Bar (Clickable to open Render Settings Modal) */}
      <div className="bg-[#121215] border-b border-[#2b2b36] px-3 py-2 flex items-center justify-between">
        <button
          onClick={onOpenRenderSettings}
          type="button"
          className="group flex items-center space-x-2 -ml-1.5 px-2 py-0.5 rounded-lg hover:bg-slate-800/80 text-left transition-all cursor-pointer focus:outline-none"
          title="Click to Open Video Render Settings & Resolution Configuration"
        >
          <Sliders className="w-3.5 h-3.5 text-indigo-400 group-hover:text-indigo-300 group-hover:rotate-12 transition-all" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200 group-hover:text-white font-mono transition-colors">
            Video Settings
          </span>
          <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-indigo-400 font-sans font-medium flex items-center space-x-0.5 ml-1">
            <span>⚙️</span>
          </span>
        </button>

        <span className="text-[10px] font-mono text-slate-500">
          {clips.length} Clips Loaded
        </span>
      </div>

      {/* DaVinci Resolve Tab Navigation Header */}
      <div className="flex items-center border-b border-[#2b2b36] bg-[#141418] px-1 overflow-x-auto scrollbar-none text-[11px]">
        {/* Tab 1: Video */}
        <button
          onClick={() => setActiveTab("video")}
          className={`flex items-center space-x-1.5 px-3 py-2 border-b-2 font-semibold transition-colors shrink-0 ${
            activeTab === "video"
              ? "border-indigo-500 text-white bg-[#1f1f26]"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Video className="w-3.5 h-3.5 text-indigo-400" />
          <span>Video</span>
        </button>

        {/* Tab 2: Audio SFX */}
        <button
          onClick={() => setActiveTab("audio")}
          className={`flex items-center space-x-1.5 px-3 py-2 border-b-2 font-semibold transition-colors shrink-0 ${
            activeTab === "audio"
              ? "border-teal-500 text-white bg-[#1f1f26]"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Music className="w-3.5 h-3.5 text-teal-400" />
          <span>Audio SFX</span>
        </button>

        {/* Tab 3: Transitions */}
        <button
          onClick={() => setActiveTab("transitions")}
          className={`flex items-center space-x-1.5 px-3 py-2 border-b-2 font-semibold transition-colors shrink-0 ${
            activeTab === "transitions"
              ? "border-purple-500 text-white bg-[#1f1f26]"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Shuffle className="w-3.5 h-3.5 text-purple-400" />
          <span>Transitions</span>
        </button>

        {/* Tab 4: Captions */}
        <button
          onClick={() => setActiveTab("captions")}
          className={`flex items-center space-x-1.5 px-3 py-2 border-b-2 font-semibold transition-colors shrink-0 ${
            activeTab === "captions"
              ? "border-emerald-500 text-white bg-[#1f1f26]"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Type className="w-3.5 h-3.5 text-emerald-400" />
          <span>Captions</span>
        </button>

        {/* Tab 5: Effects */}
        <button
          onClick={() => setActiveTab("effects")}
          className={`flex items-center space-x-1.5 px-3 py-2 border-b-2 font-semibold transition-colors shrink-0 ${
            activeTab === "effects"
              ? "border-pink-500 text-white bg-[#1f1f26]"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Sparkle className="w-3.5 h-3.5 text-pink-400" />
          <span>Effects</span>
        </button>

        {/* Tab 6: Doodle Whiteboard */}
        <button
          onClick={() => setActiveTab("doodle")}
          className={`flex items-center space-x-1.5 px-3 py-2 border-b-2 font-semibold transition-colors shrink-0 ${
            activeTab === "doodle"
              ? "border-amber-500 text-white bg-[#1f1f26]"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Pencil className="w-3.5 h-3.5 text-amber-400" />
          <span>Doodle</span>
        </button>
      </div>

      {/* DaVinci Inspector Body Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {/* TAB 1: VIDEO & SCENE FADES */}
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
                  if (settings.randomTransitions) {
                    // Turn off random mix -> no transitions (clean cut)
                    onUpdateSettings({ randomTransitions: false, selectedTransition: undefined });
                    onApplyTransitionToAll("cut");
                  } else {
                    // Turn on random mix
                    onUpdateSettings({ randomTransitions: true, selectedTransition: undefined });
                    onShuffleTransitions();
                  }
                }}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-[10px] font-bold border transition-colors cursor-pointer ${
                  settings.randomTransitions
                    ? "bg-purple-950/80 border-purple-500 text-purple-300 shadow-sm shadow-purple-500/20"
                    : "bg-[#121215] border-[#2b2b36] text-slate-400 hover:text-slate-200"
                }`}
                title={
                  settings.randomTransitions
                    ? "Random transitions active (click to disable all transitions)"
                    : "Click to enable randomized transitions"
                }
              >
                <Shuffle className="w-3 h-3 text-purple-400" />
                <span>Random mix</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {TRANSITION_OPTIONS.map((opt) => {
                const isSelected = !settings.randomTransitions && settings.selectedTransition === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => {
                      if (isSelected) {
                        // Deselect on second click -> no transition (clean cut)
                        onUpdateSettings({
                          selectedTransition: undefined,
                          randomTransitions: false,
                        });
                        onApplyTransitionToAll("cut");
                      } else {
                        // Select this transition
                        onUpdateSettings({
                          selectedTransition: opt.id,
                          randomTransitions: false,
                        });
                        onApplyTransitionToAll(opt.id);
                      }
                    }}
                    className={`flex items-center space-x-2 px-2.5 py-2 rounded-lg text-xs font-medium border transition-all text-left cursor-pointer ${
                      isSelected
                        ? "bg-indigo-600/30 border-indigo-500 text-indigo-200 shadow-sm ring-1 ring-indigo-500/50"
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

            {/* ACTIVE SCRIPT FILE NOTIFICATION & METADATA CARD */}
            {subtitles.length > 0 ? (
              <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-slate-900/50 border border-emerald-500/40 shadow-lg shadow-emerald-500/5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                        <span className="text-xs font-bold text-emerald-200 truncate block">
                          {scriptFileName || "Active Subtitle Script"}
                        </span>
                      </div>
                      <span className="text-[10px] text-emerald-400/90 font-mono font-medium block">
                        ✓ {subtitles.length} Cues Loaded • Synced on Timeline
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      onClick={() => setIsSubtitleEditorOpen(true)}
                      title="Edit Subtitles & Cues"
                      className="p-1.5 text-emerald-400 hover:text-emerald-200 hover:bg-emerald-950/60 rounded-lg transition-colors cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        onUpdateSubtitles([]);
                        setScriptFileName(null);
                        if (scriptInputRef.current) scriptInputRef.current.value = "";
                      }}
                      title="Remove Loaded Script"
                      className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Subtitle Script Cue 1 Preview Snippet (Click to edit) */}
                {subtitles[0] && (
                  <div
                    onClick={() => setIsSubtitleEditorOpen(true)}
                    className="bg-[#121215]/90 hover:bg-[#15151a] cursor-pointer rounded-lg p-2 border border-emerald-500/20 hover:border-emerald-500/50 text-[11px] text-slate-300 transition-all group"
                  >
                    <div className="flex items-center justify-between text-[9px] font-mono text-emerald-400/80 mb-1">
                      <span className="font-semibold uppercase tracking-wider flex items-center space-x-1">
                        <span>Preview (Cue 1)</span>
                        <span className="text-[8px] text-slate-500 group-hover:text-emerald-300 font-normal">
                          • Click to edit
                        </span>
                      </span>
                      <span>
                        {subtitles[0].startSec.toFixed(1)}s -{" "}
                        {subtitles[0].endSec.toFixed(1)}s
                      </span>
                    </div>
                    <p className="line-clamp-2 italic text-slate-200 text-[11px] bg-slate-900/60 px-2 py-1 rounded border border-[#2b2b36] group-hover:border-emerald-500/30">
                      &ldquo;{subtitles[0].text}&rdquo;
                    </p>
                  </div>
                )}

                {/* Edit Subtitles & Cues Button */}
                <button
                  onClick={() => setIsSubtitleEditorOpen(true)}
                  className="w-full py-2 px-3 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/35 border border-emerald-500/40 hover:border-emerald-400 text-emerald-300 hover:text-emerald-200 text-xs font-semibold flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-sm group"
                >
                  <Pencil className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span>Edit Subtitles & Cues ({subtitles.length})</span>
                </button>
              </div>
            ) : (
              <div className="p-3 rounded-xl border border-dashed border-[#2b2b36] bg-[#121215]/40 text-center space-y-1">
                <FileText className="w-4 h-4 text-slate-600 mx-auto" />
                <p className="text-[11px] text-slate-400 font-medium">No script or subtitle file loaded</p>
                <p className="text-[9px] text-slate-500">Import a .txt or .srt file above to sync captions</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: AUDIO SFX LIBRARY */}
        {activeTab === "audio" && (() => {
          const isEnabled = settings.enableSfx && settings.selectedSfxId !== "none";
          const isRandom = isEnabled && (!settings.selectedSfxId || settings.selectedSfxId === "random");
          const selectedItem = SFX_LIBRARY.find((item) => item.id === settings.selectedSfxId);
          const currentSelectValue = !isEnabled ? "none" : (settings.selectedSfxId || "random");

          // Group sounds by category for clean dropdown
          const swooshes = SFX_LIBRARY.filter((s) => s.category === "swoosh");
          const actions = SFX_LIBRARY.filter((s) => s.category === "action");
          const impacts = SFX_LIBRARY.filter((s) => s.category === "impact");
          const uis = SFX_LIBRARY.filter((s) => s.category === "ui");

          return (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-[#2b2b36]">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-200 block">
                    Transition SFX
                  </span>
                  <span className="text-[10px] text-teal-400 font-medium">
                    {!isEnabled
                      ? "SFX Muted: No sounds on cuts"
                      : isRandom
                      ? "Default: Randomized SFX on every cut"
                      : `Default: ${selectedItem?.name || "Selected SFX"} on every cut`}
                  </span>
                </div>
                <button
                  onClick={() => {
                    if (isEnabled) {
                      onUpdateSettings({ enableSfx: false, selectedSfxId: "none" });
                    } else {
                      onUpdateSettings({ enableSfx: true, selectedSfxId: "random" });
                      playAudioSfx("random");
                    }
                  }}
                  className={`w-9 h-5 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                    isEnabled ? "bg-teal-600 shadow-sm shadow-teal-500/30" : "bg-slate-800"
                  }`}
                  title={isEnabled ? "Disable Transition SFX" : "Enable Transition SFX"}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      isEnabled ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* BACKGROUND MUSIC (BGM) & SMART AUTO-DUCKING */}
              <div className="bg-[#121215] border border-[#2b2b36] rounded-xl p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <Music className="w-3.5 h-3.5 text-teal-400" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200 font-mono">
                      Background Music (BGM)
                    </span>
                  </div>
                  {bgmTrack && onRemoveBgm && (
                    <button
                      onClick={onRemoveBgm}
                      className="text-[10px] text-red-400 hover:text-red-300 font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
                      title="Remove BGM Track"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>

                {!bgmTrack ? (
                  <div>
                    <input
                      ref={bgmInputRef}
                      type="file"
                      accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0] && onUploadBgm) {
                          onUploadBgm(e.target.files[0]);
                          e.target.value = "";
                        }
                      }}
                      className="hidden"
                    />
                    <button
                      onClick={() => bgmInputRef.current?.click()}
                      className="w-full py-2.5 px-3 rounded-lg border border-dashed border-teal-500/40 hover:border-teal-400 bg-teal-950/20 hover:bg-teal-950/40 text-teal-300 text-xs font-semibold flex items-center justify-center space-x-2 transition-all cursor-pointer group"
                    >
                      <Upload className="w-3.5 h-3.5 text-teal-400 group-hover:scale-110 transition-transform" />
                      <span>Upload Royalty-Free Music / BGM</span>
                    </button>
                    <p className="text-[10px] text-slate-500 text-center mt-1">
                      Supports MP3, WAV, AAC, M4A — Auto-loops seamlessly
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between bg-[#18181c] border border-[#2b2b36] px-2.5 py-1.5 rounded-lg">
                      <div className="flex items-center space-x-2 min-w-0">
                        <Volume2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                        <span className="text-xs text-white font-medium truncate">
                          {bgmTrack.fileName}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0 ml-2">
                        {formatSecondsToTimecode(bgmTrack.durationSec)}
                      </span>
                    </div>

                    {/* Auto-Ducking & Voice Priority Toggle */}
                    <div className="flex items-center justify-between pt-1 border-t border-[#2b2b36]">
                      <div className="pr-2">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-xs font-semibold text-slate-200">
                            Smart Auto-Ducking
                          </span>
                          <span className="text-[9px] font-bold text-teal-300 bg-teal-950/80 border border-teal-500/30 px-1.5 py-0.5 rounded">
                            -50% Voice Bed
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5 leading-tight">
                          {bgmTrack.autoDucking
                            ? "Music automatically lowered by ~50% during voiceover speech"
                            : "Music plays at fixed background level without voice ducking"}
                        </span>
                      </div>
                      {onUpdateBgm && (
                        <button
                          onClick={() =>
                            onUpdateBgm({ autoDucking: !bgmTrack.autoDucking })
                          }
                          className={`w-9 h-5 rounded-full transition-colors relative p-0.5 cursor-pointer shrink-0 ${
                            bgmTrack.autoDucking
                              ? "bg-teal-600 shadow-sm shadow-teal-500/30"
                              : "bg-slate-800"
                          }`}
                          title={
                            bgmTrack.autoDucking
                              ? "Disable Auto-Ducking"
                              : "Enable Auto-Ducking"
                          }
                        >
                          <div
                            className={`w-4 h-4 rounded-full bg-white transition-transform ${
                              bgmTrack.autoDucking ? "translate-x-4" : "translate-x-0"
                            }`}
                          />
                        </button>
                      )}
                    </div>

                    {/* BGM Volume Level Slider */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-[11px] text-slate-300">
                        <span>BGM Master Volume</span>
                        <div className="flex items-center space-x-1.5 font-mono text-xs">
                          <span className="text-teal-300 font-bold">
                            {Math.round(bgmTrack.volume * 100)}%
                          </span>
                          {bgmTrack.autoDucking ? (
                            <span className="text-[10px] text-teal-400/80 font-semibold">
                              (Ducks to {Math.round(bgmTrack.volume * 50)}% on voice)
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500">
                              (Fixed)
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Volume2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={bgmTrack.volume}
                          onInput={(e) =>
                            onUpdateBgm &&
                            onUpdateBgm({ volume: parseFloat((e.target as HTMLInputElement).value) })
                          }
                          onChange={(e) =>
                            onUpdateBgm &&
                            onUpdateBgm({ volume: parseFloat(e.target.value) })
                          }
                          className="w-full accent-teal-400 h-2 bg-[#1c1c24] rounded-lg cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-semibold block">
                  Default Transition SFX
                </label>
                <select
                  value={currentSelectValue}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "none") {
                      onUpdateSettings({ enableSfx: false, selectedSfxId: "none" });
                    } else if (val === "random") {
                      onUpdateSettings({ enableSfx: true, selectedSfxId: "random" });
                      playAudioSfx("random");
                    } else {
                      onUpdateSettings({ enableSfx: true, selectedSfxId: val });
                      playAudioSfx(val);
                    }
                  }}
                  className="w-full bg-[#121215] border border-[#2b2b36] rounded-lg px-2.5 py-2 text-teal-300 text-xs font-semibold focus:outline-none focus:border-teal-500 cursor-pointer"
                >
                  <option value="random">🎲 Random Mix (Default - Varied on Cuts)</option>
                  <option value="none">⊘ None (Mute Transition Sounds)</option>
                  <optgroup label="── Swooshes & Transitions ──">
                    {swooshes.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="── Actions & Clicks ──">
                    {actions.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="── Impacts & Hits ──">
                    {impacts.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="── UI & Chimes ──">
                    {uis.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Categorized SFX Test & Select Grid */}
              <div className="space-y-2 pt-1 border-t border-[#2b2b36]">
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                  <span>Sound Effects Library ({SFX_LIBRARY.length} Sounds)</span>
                  {isRandom && isEnabled && (
                    <span className="text-purple-400 font-bold lowercase bg-purple-950/70 border border-purple-500/30 px-1.5 py-0.5 rounded text-[9px]">
                      🎲 random active
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-1.5 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
                  {SFX_LIBRARY.map((item) => {
                    const isSelected = isEnabled && settings.selectedSfxId === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          if (isSelected) {
                            // Toggle off specific sound -> revert to random mix
                            onUpdateSettings({ enableSfx: true, selectedSfxId: "random" });
                          } else {
                            // Select this specific sound as default
                            onUpdateSettings({ enableSfx: true, selectedSfxId: item.id });
                            playAudioSfx(item.id);
                          }
                        }}
                        className={`flex items-center justify-between p-2 rounded-lg text-left text-xs border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-teal-950/80 border-teal-500 text-teal-200 ring-1 ring-teal-500/40 shadow-sm"
                            : "bg-[#121215] border-[#2b2b36] text-slate-300 hover:border-slate-600 hover:text-white"
                        }`}
                        title={isSelected ? "Selected as Default SFX (Click to switch to Random Mix)" : `Set "${item.name}" as Default SFX`}
                      >
                        <span className="truncate text-[11px] font-medium">{item.name}</span>
                        <Play
                          className={`w-3 h-3 shrink-0 ml-1 ${
                            isSelected ? "text-teal-300 fill-teal-300" : "text-slate-500 fill-slate-500 group-hover:text-teal-400"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}

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

            {/* MASTER PRESET: VINTAGE ARCHIVAL FILM REEL */}
            <div className="p-3 rounded-xl bg-gradient-to-r from-amber-950/40 via-yellow-950/30 to-orange-950/20 border border-amber-500/40 shadow-lg shadow-amber-500/5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                    <Film className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-amber-200 block">
                      Vintage Archival Film Reel
                    </span>
                    <span className="text-[9px] font-mono text-amber-400/90 uppercase tracking-wider font-semibold">
                      🎞️ Ken Burns • Gate Weave • 16mm Film FX
                    </span>
                  </div>
                </div>
                <button
                  onClick={() =>
                    onUpdateSettings({
                      enableVintageFilmReel: !settings.enableVintageFilmReel,
                    })
                  }
                  className={`w-9 h-5 rounded-full transition-colors relative p-0.5 cursor-pointer shrink-0 ${
                    settings.enableVintageFilmReel
                      ? "bg-amber-500 shadow-md shadow-amber-500/30"
                      : "bg-slate-800"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      settings.enableVintageFilmReel
                        ? "translate-x-4"
                        : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
              <p className="text-[10px] text-slate-300 leading-relaxed">
                Applies a subtle continuous Ken Burns motion, authentic projector film gate-weave jitter, fine 16mm grain, faint scratches, dust specks, light flicker & faded archival vintage tone in one click.
              </p>
            </div>

            {/* SECTION 1: FILM & PROJECTOR OVERLAYS */}
            <div className="space-y-2 pt-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                🎞️ Film & Projector Overlays
              </span>

              {/* 1. Old Cinema Projector Particles */}
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
                  className={`w-9 h-5 rounded-full transition-colors relative p-0.5 cursor-pointer shrink-0 ${
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

              {/* 2. 16mm Film Grain & Scratches */}
              <div className="p-2 rounded-lg bg-[#121215] border border-[#2b2b36] flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-200">
                    16mm Film Grain & Scratches
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Authentic optical film noise & vertical jitter lines
                  </p>
                </div>
                <button
                  onClick={() =>
                    onUpdateSettings({
                      enableFilmGrain: !settings.enableFilmGrain,
                    })
                  }
                  className={`w-9 h-5 rounded-full transition-colors relative p-0.5 cursor-pointer shrink-0 ${
                    settings.enableFilmGrain ? "bg-amber-500" : "bg-slate-800"
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

              {/* 3. Vintage Warm Sepia Tone */}
              <div className="p-2 rounded-lg bg-[#121215] border border-[#2b2b36] flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-200">
                    Vintage Warm Sepia Tone
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Classic 1920s historical warm sepia color grading
                  </p>
                </div>
                <button
                  onClick={() =>
                    onUpdateSettings({
                      enableVintageSepia: !settings.enableVintageSepia,
                    })
                  }
                  className={`w-9 h-5 rounded-full transition-colors relative p-0.5 cursor-pointer shrink-0 ${
                    settings.enableVintageSepia ? "bg-orange-500" : "bg-slate-800"
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

              {/* 4. Archival Black & White Monochrome */}
              <div className="p-2 rounded-lg bg-[#121215] border border-[#2b2b36] flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-200">
                    Archival B&W Monochrome
                  </div>
                  <p className="text-[10px] text-slate-500">
                    High-contrast historical black & white film grade
                  </p>
                </div>
                <button
                  onClick={() =>
                    onUpdateSettings({
                      enableBlackAndWhite: !settings.enableBlackAndWhite,
                    })
                  }
                  className={`w-9 h-5 rounded-full transition-colors relative p-0.5 cursor-pointer shrink-0 ${
                    settings.enableBlackAndWhite ? "bg-slate-300" : "bg-slate-800"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-slate-950 transition-transform ${
                      settings.enableBlackAndWhite
                        ? "translate-x-4"
                        : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* SECTION 2: CINEMA & OPTICS */}
            <div className="space-y-2 pt-1 border-t border-[#2b2b36]">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                🎬 Cinema & Optics Overlays
              </span>

              {/* 5. Cinemascope Letterbox */}
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
                  className={`w-9 h-5 rounded-full transition-colors relative p-0.5 cursor-pointer shrink-0 ${
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

              {/* 6. Floating Golden Particles */}
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
                  className={`w-9 h-5 rounded-full transition-colors relative p-0.5 cursor-pointer shrink-0 ${
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
            </div>
          </div>
        )}

        {/* TAB 6: DOODLE WHITEBOARD HAND-DRAWN ANIMATION */}
        {activeTab === "doodle" && (
          <div className="space-y-3.5">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-[#2b2b36]">
              <div className="flex items-center space-x-1.5">
                <Pencil className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                  Doodle Whiteboard Mode
                </span>
              </div>
              <span className="text-[9px] font-bold text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono">
                VideoScribe / Doodly
              </span>
            </div>

            {/* Master Toggle */}
            <div className="p-3 rounded-xl bg-[#121215] border border-[#2b2b36] flex items-center justify-between shadow-lg">
              <div>
                <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                  <span>Hand-Drawn Sketch Animation</span>
                  {settings.enableDoodle && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Draws images stroke-by-stroke with animated marker hand
                </p>
              </div>
              <button
                onClick={() =>
                  onUpdateSettings({
                    enableDoodle: !settings.enableDoodle,
                  })
                }
                className={`w-10 h-5 rounded-full transition-colors relative p-0.5 cursor-pointer shrink-0 ${
                  settings.enableDoodle
                    ? "bg-amber-500 shadow-md shadow-amber-500/30"
                    : "bg-slate-800"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    settings.enableDoodle
                      ? "translate-x-5"
                      : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Active Hand Asset Preview Badge */}
            <div className="p-2.5 rounded-xl bg-gradient-to-r from-amber-950/30 via-slate-900/60 to-slate-900/40 border border-amber-500/30 flex items-center justify-between">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Pencil className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-amber-200 truncate">
                    EXPO Black Marker (16:9 Transparent)
                  </div>
                  <div className="text-[9px] text-slate-400 font-mono">
                    ✓ Calibrated Marker Tip • High Precision Jitter
                  </div>
                </div>
              </div>
            </div>

            {/* Dynamic Camera Focus Zoom Toggle */}
            <div className="p-2.5 rounded-lg bg-[#121215] border border-[#2b2b36] flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-200 flex items-center space-x-1.5">
                  <span>Camera Focus Zoom-In</span>
                  <span className="text-[8px] font-bold uppercase bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 px-1.5 py-0.5 rounded">
                    Doodly Zoom
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Zooms in & follows marker tip during sketch, then zooms out
                </p>
              </div>
              <button
                onClick={() =>
                  onUpdateSettings({
                    enableDoodleZoom: !settings.enableDoodleZoom,
                  })
                }
                className={`w-9 h-5 rounded-full transition-colors relative p-0.5 cursor-pointer shrink-0 ${
                  settings.enableDoodleZoom ? "bg-indigo-500 shadow-sm" : "bg-slate-800"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    settings.enableDoodleZoom
                      ? "translate-x-4"
                      : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Drawing Duration Ratio Slider */}
            <div className="space-y-1.5 p-2.5 rounded-lg bg-[#121215] border border-[#2b2b36]">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Drawing Speed Ratio</span>
                <span className="font-mono text-amber-400 font-bold">
                  {Math.round((settings.doodleDrawDurationRatio ?? 0.75) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.4"
                max="0.95"
                step="0.05"
                value={settings.doodleDrawDurationRatio ?? 0.75}
                onChange={(e) =>
                  onUpdateSettings({
                    doodleDrawDurationRatio: parseFloat(e.target.value),
                  })
                }
                className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                <span>Fast Draw (40%)</span>
                <span>Hold Drawing ({Math.round((1 - (settings.doodleDrawDurationRatio ?? 0.75)) * 100)}%)</span>
              </div>
            </div>

            {/* Canvas Paper / Board Background Style */}
            <div className="space-y-2 pt-1 border-t border-[#2b2b36]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  Board & Paper Color
                </span>
                <span className="text-[9px] text-amber-400/80 font-mono">
                  Auto-Detects Image BG
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "auto", label: "Auto Match Image", icon: "🎨" },
                  { id: "whiteboard", label: "Matte Whiteboard", icon: "📋" },
                  { id: "paper", label: "Vintage Paper", icon: "📜" },
                  { id: "blueprint", label: "Blueprint Grid", icon: "📐" },
                  { id: "chalkboard", label: "Dark Chalkboard", icon: "⬛" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() =>
                      onUpdateSettings({
                        doodlePaperStyle: opt.id as any,
                      })
                    }
                    className={`p-2 rounded-lg border text-left text-xs transition-all cursor-pointer flex items-center space-x-2 ${
                      (settings.doodlePaperStyle || "auto") === opt.id
                        ? "bg-amber-500/20 border-amber-500 text-amber-200 shadow-sm"
                        : "bg-[#121215] border-[#2b2b36] text-slate-400 hover:border-slate-600 hover:text-slate-200"
                    }`}
                  >
                    <span>{opt.icon}</span>
                    <span className="truncate text-[11px] font-semibold">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sidebar Quick Render Action Footer */}
      <div className="p-2.5 bg-[#121215] border-t border-[#2b2b36] shrink-0">
        <button
          onClick={onStartRender}
          disabled={clips.length === 0 || isExporting}
          className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-lg ${
            isExporting
              ? "bg-slate-800 text-slate-400 cursor-wait"
              : clips.length > 0
              ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-indigo-500/25 cursor-pointer transform hover:scale-[1.01]"
              : "bg-slate-800 text-slate-600 cursor-not-allowed opacity-50"
          }`}
        >
          <Clapperboard className="w-3.5 h-3.5 text-amber-300" />
          <span>{isExporting ? `Rendering (${exportProgress}%)` : "Render MP4 Video"}</span>
        </button>
      </div>

      {/* Subtitle & SRT Transcript Editor Modal */}
      <StudioSubtitleEditorModal
        isOpen={isSubtitleEditorOpen}
        onClose={() => setIsSubtitleEditorOpen(false)}
        subtitles={subtitles}
        scriptFileName={scriptFileName}
        onSaveSubtitles={(updatedCues) => onUpdateSubtitles(updatedCues)}
      />
    </div>
  );
};
