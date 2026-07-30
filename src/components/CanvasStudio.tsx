"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Palette,
  Type,
  Shield,
  Zap,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Volume2,
  Cpu,
} from "lucide-react";
import { CanvasSettings, CanvasPreset, ResolutionPreset } from "@/types";

interface CanvasStudioProps {
  settings: CanvasSettings;
  onChangeSettings: (settings: CanvasSettings) => void;
  onCanvasDataUrlChange: (dataUrl: string) => void;
  onNextStep: () => void;
  onPrevStep: () => void;
}

export const CanvasStudio: React.FC<CanvasStudioProps> = ({
  settings,
  onChangeSettings,
  onCanvasDataUrlChange,
  onNextStep,
  onPrevStep,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [bgImageElement, setBgImageElement] = useState<HTMLImageElement | null>(null);

  // Load custom image when customBgImage changes
  useEffect(() => {
    if (settings.preset === "custom-image" && settings.customBgImage) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => setBgImageElement(img);
      img.src = settings.customBgImage;
    } else {
      setBgImageElement(null);
    }
  }, [settings.preset, settings.customBgImage]);

  // Render canvas at crisp 1280x720 baseline for live preview & PNG export
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Use baseline 1280x720 for crystal clear preview canvas
    const width = 1280;
    const height = 720;
    canvas.width = width;
    canvas.height = height;

    // 1. Draw Background
    if (settings.preset === "custom-image" && bgImageElement) {
      ctx.drawImage(bgImageElement, 0, 0, width, height);
      ctx.fillStyle = `rgba(15, 23, 42, ${settings.overlayOpacity})`;
      ctx.fillRect(0, 0, width, height);
    } else {
      let grad = ctx.createLinearGradient(0, 0, width, height);
      switch (settings.preset) {
        case "gradient-indigo":
          grad.addColorStop(0, "#0f172a");
          grad.addColorStop(0.5, "#1e1b4b");
          grad.addColorStop(1, "#311b92");
          break;
        case "gradient-sunset":
          grad.addColorStop(0, "#0f172a");
          grad.addColorStop(0.5, "#4c1d95");
          grad.addColorStop(1, "#831843");
          break;
        case "gradient-emerald":
          grad.addColorStop(0, "#022c22");
          grad.addColorStop(0.5, "#064e3b");
          grad.addColorStop(1, "#0f172a");
          break;
        case "gradient-cyber":
          grad.addColorStop(0, "#030712");
          grad.addColorStop(0.5, "#111827");
          grad.addColorStop(1, "#1f2937");
          break;
        case "solid-slate":
          grad.addColorStop(0, "#1e293b");
          grad.addColorStop(1, "#0f172a");
          break;
        case "solid-midnight":
          grad.addColorStop(0, "#090d16");
          grad.addColorStop(1, "#030712");
          break;
        default:
          grad.addColorStop(0, "#0f172a");
          grad.addColorStop(1, "#1e1b4b");
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    }

    // Grid pattern
    ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
    ctx.lineWidth = 1;
    const gridSize = 45;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 2. Container frame
    const padding = width * 0.06;
    const cardX = padding;
    const cardY = padding;
    const cardWidth = width - padding * 2;
    const cardHeight = height - padding * 2;

    ctx.save();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.fillStyle = "rgba(15, 23, 42, 0.5)";
    ctx.roundRect(cardX, cardY, cardWidth, cardHeight, 20);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 3. Confidentiality / Badge
    if (settings.showBadge && settings.badgeText) {
      ctx.save();
      const badgeFontSize = 14;
      ctx.font = `700 ${badgeFontSize}px system-ui, -apple-system, sans-serif`;
      const badgeMetrics = ctx.measureText(settings.badgeText.toUpperCase());
      const badgePaddingX = 18;
      const badgePaddingY = 8;
      const badgeW = badgeMetrics.width + badgePaddingX * 2;
      const badgeH = badgeFontSize + badgePaddingY * 2;

      let badgeX = cardX + 35;
      if (settings.textAlign === "center") badgeX = width / 2 - badgeW / 2;
      if (settings.textAlign === "right") badgeX = cardX + cardWidth - badgeW - 35;
      const badgeY = cardY + 30;

      ctx.fillStyle = settings.badgeColor || "#ef4444";
      ctx.shadowColor = settings.badgeColor || "#ef4444";
      ctx.shadowBlur = 12;
      ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 100);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        settings.badgeText.toUpperCase(),
        badgeX + badgeW / 2,
        badgeY + badgeH / 2 + 1
      );
      ctx.restore();
    }

    // 4. Main Title
    ctx.save();
    let titleFontSize = 48;
    if (settings.fontSize === "large") titleFontSize = 56;
    if (settings.fontSize === "huge") titleFontSize = 64;

    ctx.font = `800 ${titleFontSize}px system-ui, -apple-system, sans-serif`;
    ctx.fillStyle = settings.titleColor || "#ffffff";
    ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
    ctx.shadowBlur = 10;

    let textX = cardX + 35;
    if (settings.textAlign === "center") textX = width / 2;
    if (settings.textAlign === "right") textX = cardX + cardWidth - 35;

    ctx.textAlign = settings.textAlign;
    ctx.textBaseline = "top";

    const startY = cardY + (settings.showBadge ? 95 : 50);

    const maxTitleWidth = cardWidth - 70;
    const words = settings.meetingTitle.split(" ");
    let currentLine = "";
    const lines: string[] = [];

    for (let i = 0; i < words.length; i++) {
      const testLine = currentLine + words[i] + " ";
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxTitleWidth && i > 0) {
        lines.push(currentLine.trim());
        currentLine = words[i] + " ";
      } else {
        currentLine = testLine;
      }
    }
    lines.push(currentLine.trim());

    const lineHeight = titleFontSize * 1.2;
    lines.forEach((line, index) => {
      ctx.fillText(line, textX, startY + index * lineHeight);
    });
    ctx.restore();

    // 5. Subtitle
    if (settings.meetingSubtitle) {
      ctx.save();
      const subFontSize = 22;
      ctx.font = `600 ${subFontSize}px system-ui, -apple-system, sans-serif`;
      ctx.fillStyle = settings.subtitleColor || "#cbd5e1";
      ctx.textAlign = settings.textAlign;
      ctx.textBaseline = "top";

      const subY = startY + lines.length * lineHeight + 15;
      ctx.fillText(settings.meetingSubtitle, textX, subY);
      ctx.restore();
    }

    // 6. Participants
    if (settings.participants) {
      ctx.save();
      const partFontSize = 16;
      ctx.font = `500 ${partFontSize}px system-ui, -apple-system, sans-serif`;
      ctx.fillStyle = "#94a3b8";
      ctx.textAlign = settings.textAlign;
      ctx.textBaseline = "top";

      const partY = startY + lines.length * lineHeight + 52;
      ctx.fillText(settings.participants, textX, partY);
      ctx.restore();
    }

    // 7. Audio Waveform Bar
    const waveY = cardY + cardHeight - 65;
    const waveWidth = cardWidth - 70;
    const waveX = cardX + 35;
    const barsCount = 50;
    const barSpacing = waveWidth / barsCount;

    ctx.save();
    ctx.fillStyle = "rgba(99, 102, 241, 0.45)";
    for (let i = 0; i < barsCount; i++) {
      const barH = 12 + Math.abs(Math.sin(i * 0.3) * 28) + (i % 3 === 0 ? 12 : 0);
      const bx = waveX + i * barSpacing;
      ctx.fillRect(bx, waveY - barH / 2, barSpacing * 0.6, barH);
    }

    const footerFontSize = 13;
    ctx.font = `600 ${footerFontSize}px system-ui, -apple-system, sans-serif`;
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.textAlign = "right";
    ctx.fillText(
      `VIDMEET MATRIX • ${settings.resolutionPreset.toUpperCase()} 1FPS ULTRA-FAST MODE`,
      cardX + cardWidth - 35,
      cardY + cardHeight - 25
    );
    ctx.restore();

    const dataUrl = canvas.toDataURL("image/png");
    onCanvasDataUrlChange(dataUrl);
  }, [settings, bgImageElement]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onChangeSettings({
          ...settings,
          preset: "custom-image",
          customBgImage: event.target?.result as string,
        });
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const applyTemplate = (tpl: "google-meet" | "confidential" | "minimal" | "podcast") => {
    switch (tpl) {
      case "google-meet":
        onChangeSettings({
          ...settings,
          template: "google-meet",
          preset: "gradient-indigo",
          showBadge: true,
          badgeText: "GOOGLE MEET RECORDING",
          badgeColor: "#6366f1",
          titleColor: "#ffffff",
          subtitleColor: "#cbd5e1",
          textAlign: "left",
        });
        break;
      case "confidential":
        onChangeSettings({
          ...settings,
          template: "confidential",
          preset: "gradient-sunset",
          showBadge: true,
          badgeText: "INTERNAL DISCUSSION • CONFIDENTIAL",
          badgeColor: "#ef4444",
          titleColor: "#ffffff",
          subtitleColor: "#fca5a5",
          textAlign: "left",
        });
        break;
      case "minimal":
        onChangeSettings({
          ...settings,
          template: "minimal",
          preset: "solid-midnight",
          showBadge: false,
          titleColor: "#f8fafc",
          subtitleColor: "#94a3b8",
          textAlign: "center",
        });
        break;
      case "podcast":
        onChangeSettings({
          ...settings,
          template: "podcast",
          preset: "gradient-emerald",
          showBadge: true,
          badgeText: "AUDIO TRANSCRIPTION MODE",
          badgeColor: "#10b981",
          titleColor: "#ffffff",
          subtitleColor: "#6ee7b7",
          textAlign: "left",
        });
        break;
    }
  };

  const resolutions: {
    id: ResolutionPreset;
    label: string;
    width: number;
    height: number;
    speed: string;
    recommended?: boolean;
  }[] = [
    {
      id: "144p",
      label: "144p Turbo",
      width: 256,
      height: 144,
      speed: "⚡ 50x Ultra Speed (Recommended)",
      recommended: true,
    },
    {
      id: "240p",
      label: "240p Fast",
      width: 426,
      height: 240,
      speed: "⚡ 25x Speed",
    },
    {
      id: "360p",
      label: "360p Standard",
      width: 640,
      height: 360,
      speed: "⚡ 10x Speed",
    },
    {
      id: "720p",
      label: "720p HD",
      width: 1280,
      height: 720,
      speed: "Standard Speed",
    },
    {
      id: "1080p",
      label: "1080p Full HD",
      width: 1920,
      height: 1080,
      speed: "Slower",
    },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
          Step 2: Customize Visual Banner Overlay
        </h2>
        <p className="text-sm text-slate-400 max-w-2xl mx-auto">
          Design the static thumbnail frame. Select <span className="text-emerald-400 font-semibold">144p Turbo Mode</span> for maximum rendering speed on 45m+ meeting files!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Studio Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-6 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-md">
          {/* Resolution Selector Section */}
          <div className="space-y-3 pb-3 border-b border-slate-800">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <Zap className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span>Export Resolution & Speed</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                YouTube Accepted
              </span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {resolutions.map((r) => (
                <button
                  key={r.id}
                  onClick={() =>
                    onChangeSettings({
                      ...settings,
                      resolutionPreset: r.id,
                      resolution: { width: r.width, height: r.height },
                    })
                  }
                  className={`relative p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    settings.resolutionPreset === r.id
                      ? "border-emerald-500 bg-emerald-950/40 text-white ring-1 ring-emerald-500/50 shadow-lg shadow-emerald-500/10"
                      : "border-slate-800 bg-slate-950/50 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {r.recommended && (
                    <span className="absolute -top-2 -right-1 px-1.5 py-0.5 rounded-full bg-emerald-500 text-[9px] font-extrabold text-slate-950 uppercase shadow-md">
                      Fastest
                    </span>
                  )}
                  <span className="text-xs font-bold">{r.label}</span>
                  <span className="text-[10px] text-slate-400 mt-1">
                    {r.width}x{r.height}
                  </span>
                </button>
              ))}
            </div>

            {/* Audio Stream Copy Optimization Toggle */}
            <div className="pt-2 flex items-center justify-between p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-indigo-300 flex items-center space-x-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Direct Audio Stream Copy (-c:a copy)</span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Preserves 100% original audio quality with 0% CPU audio re-encoding cost.
                </p>
              </div>

              <input
                type="checkbox"
                checked={settings.audioCopyMode}
                onChange={(e) =>
                  onChangeSettings({
                    ...settings,
                    audioCopyMode: e.target.checked,
                  })
                }
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer shrink-0 ml-2"
              />
            </div>
          </div>

          {/* Quick Presets */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2 mb-3">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Visual Templates</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => applyTemplate("google-meet")}
                className="p-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-xs font-medium text-slate-200 flex items-center justify-center space-x-1.5 transition-colors"
              >
                <span>Google Meet</span>
              </button>
              <button
                onClick={() => applyTemplate("confidential")}
                className="p-2.5 rounded-xl border border-red-500/30 bg-red-950/20 hover:bg-red-950/40 text-xs font-medium text-red-300 flex items-center justify-center space-x-1.5 transition-colors"
              >
                <span>Confidential</span>
              </button>
              <button
                onClick={() => applyTemplate("minimal")}
                className="p-2.5 rounded-xl border border-slate-700 bg-slate-950 hover:bg-slate-800 text-xs font-medium text-slate-300 flex items-center justify-center space-x-1.5 transition-colors"
              >
                <span>Minimal Dark</span>
              </button>
              <button
                onClick={() => applyTemplate("podcast")}
                className="p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-950/20 hover:bg-emerald-950/40 text-xs font-medium text-emerald-300 flex items-center justify-center space-x-1.5 transition-colors"
              >
                <span>Audiobook</span>
              </button>
            </div>
          </div>

          {/* Background Styling */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
              <Palette className="w-4 h-4 text-indigo-400" />
              <span>Background Theme</span>
            </label>

            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "gradient-indigo", name: "Neon Indigo", color: "bg-indigo-900" },
                { id: "gradient-sunset", name: "Cyber Sunset", color: "bg-purple-900" },
                { id: "gradient-emerald", name: "Deep Emerald", color: "bg-emerald-900" },
                { id: "gradient-cyber", name: "Dark Metal", color: "bg-slate-900" },
                { id: "solid-slate", name: "Solid Slate", color: "bg-slate-800" },
                { id: "solid-midnight", name: "Midnight", color: "bg-black" },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() =>
                    onChangeSettings({
                      ...settings,
                      preset: p.id as CanvasPreset,
                    })
                  }
                  className={`p-2 rounded-xl border text-xs font-medium flex items-center space-x-2 transition-all ${
                    settings.preset === p.id
                      ? "border-indigo-500 bg-indigo-950/60 text-white ring-1 ring-indigo-500/50"
                      : "border-slate-800 bg-slate-950/50 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full ${p.color}`} />
                  <span className="truncate">{p.name}</span>
                </button>
              ))}
            </div>

            <div className="pt-2">
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Custom Background Image:
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-indigo-300 hover:file:bg-slate-700 cursor-pointer"
              />
            </div>
          </div>

          {/* Text Fields */}
          <div className="space-y-4 pt-3 border-t border-slate-800">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
              <Type className="w-4 h-4 text-purple-400" />
              <span>Text Overlay Content</span>
            </label>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Meeting Title
              </label>
              <input
                type="text"
                value={settings.meetingTitle}
                onChange={(e) =>
                  onChangeSettings({
                    ...settings,
                    meetingTitle: e.target.value,
                  })
                }
                placeholder="Project Discussion - July 2026"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Subtitle / Date
              </label>
              <input
                type="text"
                value={settings.meetingSubtitle}
                onChange={(e) =>
                  onChangeSettings({
                    ...settings,
                    meetingSubtitle: e.target.value,
                  })
                }
                placeholder="Google Meet Hindi Recording • 45 Mins"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Participants / Tags
              </label>
              <input
                type="text"
                value={settings.participants}
                onChange={(e) =>
                  onChangeSettings({
                    ...settings,
                    participants: e.target.value,
                  })
                }
                placeholder="Hosted by Somit • Hindi/Hinglish Audio Track"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Badge & Alignment */}
          <div className="space-y-4 pt-3 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                <Shield className="w-4 h-4 text-red-400" />
                <span>Confidentiality Pill Badge</span>
              </label>
              <input
                type="checkbox"
                checked={settings.showBadge}
                onChange={(e) =>
                  onChangeSettings({
                    ...settings,
                    showBadge: e.target.checked,
                  })
                }
                className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
              />
            </div>

            {settings.showBadge && (
              <div>
                <input
                  type="text"
                  value={settings.badgeText}
                  onChange={(e) =>
                    onChangeSettings({
                      ...settings,
                      badgeText: e.target.value,
                    })
                  }
                  placeholder="INTERNAL USE ONLY"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">
                Text Alignment:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["left", "center", "right"] as const).map((align) => (
                  <button
                    key={align}
                    onClick={() =>
                      onChangeSettings({ ...settings, textAlign: align })
                    }
                    className={`py-1.5 rounded-lg border text-xs font-medium uppercase transition-colors ${
                      settings.textAlign === align
                        ? "border-indigo-500 bg-indigo-600/30 text-indigo-300"
                        : "border-slate-800 bg-slate-950/60 text-slate-400"
                    }`}
                  >
                    {align}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Live Preview (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Live Canvas Preview</span>
              </h3>

              <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                <Zap className="w-3.5 h-3.5" />
                <span>{settings.resolutionPreset.toUpperCase()} 1FPS TURBO MODE</span>
              </div>
            </div>

            <div className="relative rounded-xl overflow-hidden border border-slate-700/80 shadow-2xl bg-black aspect-video flex items-center justify-center">
              <canvas
                ref={canvasRef}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span>
                Output Resolution:{" "}
                <span className="text-emerald-400 font-bold">
                  {settings.resolution.width} x {settings.resolution.height} px ({settings.resolutionPreset})
                </span>
              </span>
              <span>
                Audio Mode:{" "}
                <span className="text-indigo-300 font-semibold">
                  {settings.audioCopyMode ? "Direct Copy (-c:a copy)" : "AAC Re-encoded"}
                </span>
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={onPrevStep}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Upload</span>
            </button>

            <button
              onClick={onNextStep}
              className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all transform hover:-translate-y-0.5"
            >
              <span>Next: Convert & Export MP4</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
