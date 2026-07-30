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
  Image as ImageIcon,
  Activity,
  AlertTriangle,
} from "lucide-react";
import { CanvasSettings, CanvasPreset, ResolutionPreset } from "@/types";

interface CanvasStudioProps {
  settings: CanvasSettings;
  onChangeSettings: (settings: CanvasSettings) => void;
  onCanvasDataUrlChange: (dataUrl: string) => void;
  onNextStep: () => void;
  onPrevStep: () => void;
}

const NATURE_PRESETS: { id: CanvasPreset; name: string; icon: string; url: string }[] = [
  {
    id: "nature-forest",
    name: "🌲 Misty Forest",
    icon: "🌲",
    url: "https://images.unsplash.com/photo-1511497584788-876761c119ef?auto=format&fit=crop&w=1920&q=80",
  },
  {
    id: "nature-aurora",
    name: "🌌 Northern Lights",
    icon: "🌌",
    url: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=1920&q=80",
  },
  {
    id: "nature-ocean",
    name: "🌊 Deep Ocean",
    icon: "🌊",
    url: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1920&q=80",
  },
  {
    id: "nature-sunset",
    name: "🌄 Alpine Sunset",
    icon: "🌄",
    url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1920&q=80",
  },
  {
    id: "nature-cosmic",
    name: "✨ Cosmic Nebula",
    icon: "✨",
    url: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1920&q=80",
  },
];

export const CanvasStudio: React.FC<CanvasStudioProps> = ({
  settings,
  onChangeSettings,
  onCanvasDataUrlChange,
  onNextStep,
  onPrevStep,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [bgImageElement, setBgImageElement] = useState<HTMLImageElement | null>(null);

  // Load image when custom image or nature preset changes
  useEffect(() => {
    let srcUrl: string | null = null;

    if (settings.preset === "custom-image" && settings.customBgImage) {
      srcUrl = settings.customBgImage;
    } else if (settings.preset.startsWith("nature-")) {
      const match = NATURE_PRESETS.find((n) => n.id === settings.preset);
      if (match) srcUrl = match.url;
    }

    if (srcUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => setBgImageElement(img);
      img.onerror = () => setBgImageElement(null);
      img.src = srcUrl;
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
    if (bgImageElement) {
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
    ctx.fillStyle = "rgba(15, 23, 42, 0.55)";
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

    // 7. NCS-Style Particle Circular & Equalizer Spectrum Visualizer
    const spectrumStyle = settings.spectrumStyle || "ncs-circular";
    const primaryColor = settings.spectrumColor || "#818cf8";

    if (spectrumStyle === "ncs-circular") {
      const spectrumX =
        settings.textAlign === "right"
          ? cardX + 160
          : settings.textAlign === "center"
          ? width / 2
          : cardX + cardWidth - 170;
      const spectrumY = cardY + cardHeight - 120;
      const baseRadius = 52;
      const barsCount = 48;

      ctx.save();
      // Outer Glowing Ring
      ctx.shadowColor = primaryColor;
      ctx.shadowBlur = 18;
      ctx.lineWidth = 3;
      ctx.strokeStyle = primaryColor;
      ctx.beginPath();
      ctx.arc(spectrumX, spectrumY, baseRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Core Background Circle
      ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
      ctx.beginPath();
      ctx.arc(spectrumX, spectrumY, baseRadius - 4, 0, Math.PI * 2);
      ctx.fill();

      // Center Icon Emblem
      ctx.shadowBlur = 10;
      ctx.fillStyle = primaryColor;
      ctx.font = "bold 22px system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("⚡", spectrumX, spectrumY);

      // Radial Frequency Bars (NCS Style)
      ctx.lineWidth = 3.5;
      ctx.lineCap = "round";
      for (let i = 0; i < barsCount; i++) {
        const angle = (i / barsCount) * Math.PI * 2;
        const pseudoAmp =
          Math.abs(Math.sin(i * 0.45) * 26) + Math.abs(Math.cos(i * 0.75) * 14) + 8;
        const x1 = spectrumX + Math.cos(angle) * baseRadius;
        const y1 = spectrumY + Math.sin(angle) * baseRadius;
        const x2 = spectrumX + Math.cos(angle) * (baseRadius + pseudoAmp);
        const y2 = spectrumY + Math.sin(angle) * (baseRadius + pseudoAmp);

        ctx.strokeStyle = i % 2 === 0 ? primaryColor : "#c084fc";
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      // Ambient Floating Star Particles (NCS Style)
      const particleSeeds = [
        { angle: 0.2, dist: 85, r: 3 },
        { angle: 0.8, dist: 110, r: 2 },
        { angle: 1.5, dist: 95, r: 4 },
        { angle: 2.1, dist: 120, r: 2.5 },
        { angle: 2.9, dist: 88, r: 3.5 },
        { angle: 3.6, dist: 105, r: 2 },
        { angle: 4.3, dist: 130, r: 4 },
        { angle: 5.1, dist: 92, r: 3 },
        { angle: 5.8, dist: 115, r: 2.5 },
      ];
      ctx.shadowBlur = 12;
      particleSeeds.forEach((p) => {
        const px = spectrumX + Math.cos(p.angle) * p.dist;
        const py = spectrumY + Math.sin(p.angle) * p.dist;
        ctx.fillStyle = primaryColor;
        ctx.beginPath();
        ctx.arc(px, py, p.r, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();
    } else if (spectrumStyle === "frequency-bars") {
      const waveY = cardY + cardHeight - 65;
      const waveWidth = cardWidth - 70;
      const waveX = cardX + 35;
      const barsCount = 55;
      const barSpacing = waveWidth / barsCount;

      ctx.save();
      ctx.shadowColor = primaryColor;
      ctx.shadowBlur = 12;
      ctx.fillStyle = primaryColor;

      for (let i = 0; i < barsCount; i++) {
        const barH = 10 + Math.abs(Math.sin(i * 0.35) * 32) + (i % 4 === 0 ? 14 : 0);
        const bx = waveX + i * barSpacing;
        ctx.fillRect(bx, waveY - barH / 2, barSpacing * 0.65, barH);
      }
      ctx.restore();
    }

    // 8. Footer Brand Tag
    ctx.save();
    const footerFontSize = 13;
    ctx.font = `600 ${footerFontSize}px system-ui, -apple-system, sans-serif`;
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.textAlign = "right";
    ctx.fillText(
      `VIDSCRIBE MATRIX • ${settings.resolutionPreset.toUpperCase()} ${
        settings.animatedVideoSpectrum ? "ANIMATED SPECTRUM" : "1FPS TURBO MODE"
      }`,
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
          preset: "nature-aurora",
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
          Design your visual banner with <span className="text-indigo-300 font-semibold">NCS Particle Spectrum</span> & <span className="text-emerald-400 font-semibold">Royalty-Free Nature Wallpapers</span>.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Studio Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-6 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-md">
          
          {/* Audio Spectrum & Animated Video Mode Toggle */}
          <div className="space-y-3 pb-3 border-b border-slate-800">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <Activity className="w-4 h-4 text-purple-400" />
                <span>Audio Spectrum Style</span>
              </span>
            </label>

            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "ncs-circular", label: "⭕ NCS Circular" },
                { id: "frequency-bars", label: "📊 Equalizer Bars" },
                { id: "none", label: "🚫 None" },
              ].map((style) => (
                <button
                  key={style.id}
                  onClick={() =>
                    onChangeSettings({
                      ...settings,
                      spectrumStyle: style.id as any,
                    })
                  }
                  className={`p-2 rounded-xl border text-xs font-semibold text-center transition-all ${
                    settings.spectrumStyle === style.id
                      ? "border-purple-500 bg-purple-950/60 text-white ring-1 ring-purple-500/50"
                      : "border-slate-800 bg-slate-950/50 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {style.label}
                </button>
              ))}
            </div>

            {/* Speed Toggle Switch */}
            <div className="pt-2">
              <div
                className={`p-3 rounded-xl border transition-all ${
                  settings.animatedVideoSpectrum
                    ? "bg-amber-950/30 border-amber-500/40"
                    : "bg-emerald-950/30 border-emerald-500/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-200 flex items-center space-x-1.5">
                      <Zap className={`w-3.5 h-3.5 ${settings.animatedVideoSpectrum ? "text-amber-400" : "text-emerald-400"}`} />
                      <span>{settings.animatedVideoSpectrum ? "Animated Spectrum Video" : "⚡ 144p Turbo Mode (3s Export)"}</span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      {settings.animatedVideoSpectrum
                        ? "Renders dynamic particle video frames (Export time will be slightly longer)."
                        : "Encodes static banner with spectrum card in 3 seconds!"}
                    </p>
                  </div>

                  <input
                    type="checkbox"
                    checked={settings.animatedVideoSpectrum}
                    onChange={(e) =>
                      onChangeSettings({
                        ...settings,
                        animatedVideoSpectrum: e.target.checked,
                      })
                    }
                    className="w-4 h-4 accent-amber-500 rounded cursor-pointer shrink-0 ml-2"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Royalty-Free Nature Wallpapers */}
          <div className="space-y-3 pb-3 border-b border-slate-800">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
              <ImageIcon className="w-4 h-4 text-emerald-400" />
              <span>Royalty-Free Nature Wallpapers</span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {NATURE_PRESETS.map((n) => (
                <button
                  key={n.id}
                  onClick={() =>
                    onChangeSettings({
                      ...settings,
                      preset: n.id,
                    })
                  }
                  className={`p-2 rounded-xl border text-xs font-medium flex items-center space-x-1.5 truncate transition-all ${
                    settings.preset === n.id
                      ? "border-emerald-500 bg-emerald-950/60 text-white ring-1 ring-emerald-500/50"
                      : "border-slate-800 bg-slate-950/50 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <span className="truncate">{n.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Color & Solid Presets */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
              <Palette className="w-4 h-4 text-indigo-400" />
              <span>Gradient & Custom Themes</span>
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
                Upload Custom Image:
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
                placeholder="Project Discussion - 2026"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Subtitle / Details
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
                placeholder="Hindi/Hinglish Audio Recording • 45 Mins"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Participants / Presenter
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
                placeholder="Hosted by Somit • Internal Meeting Notes"
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
                Resolution:{" "}
                <span className="text-emerald-400 font-bold">
                  {settings.resolution.width} x {settings.resolution.height} px
                </span>
              </span>
              <span>
                Spectrum:{" "}
                <span className="text-purple-300 font-semibold">
                  {settings.spectrumStyle === "ncs-circular" ? "⭕ NCS Circular Particles" : settings.spectrumStyle === "frequency-bars" ? "📊 Frequency Bars" : "Off"}
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
