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
  CheckCircle2,
} from "lucide-react";
import { CanvasSettings, CanvasPreset, ResolutionPreset } from "@/types";
import { SUBSCRIBE_BADGE_DATA_URL } from "@/lib/subscribeBadgeDataUrl";

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
  const [bgVideoElement, setBgVideoElement] = useState<HTMLVideoElement | null>(null);
  const [logoImageElement, setLogoImageElement] = useState<HTMLImageElement | null>(null);
  const [badgeImgElement, setBadgeImgElement] = useState<HTMLImageElement | null>(null);
  const [animTick, setAnimTick] = useState(0);

  // Load 3D Subscribe Bell Badge Image Asset
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => setBadgeImgElement(img);
    img.src = SUBSCRIBE_BADGE_DATA_URL;
  }, []);

  // 1 FPS animation tick timer (0% CPU overhead)
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimTick((prev) => (prev + 1) % 1000);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Load custom bg image when customBgImage changes
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

  // Load custom background video when customBgVideo changes
  useEffect(() => {
    if (settings.customBgVideo) {
      const vid = document.createElement("video");
      vid.crossOrigin = "anonymous";
      vid.muted = true;
      vid.loop = true;
      vid.playsInline = true;
      vid.autoplay = true;
      vid.src = settings.customBgVideo;
      vid.onloadeddata = () => {
        vid.play().catch(() => {});
        setBgVideoElement(vid);
      };
    } else {
      setBgVideoElement(null);
    }
  }, [settings.customBgVideo]);

  // Load custom channel logo when channelLogo changes
  useEffect(() => {
    if (settings.channelLogo) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => setLogoImageElement(img);
      img.src = settings.channelLogo;
    } else {
      setLogoImageElement(null);
    }
  }, [settings.channelLogo]);

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
    if (bgVideoElement && bgVideoElement.readyState >= 2) {
      ctx.drawImage(bgVideoElement, 0, 0, width, height);
      ctx.fillStyle = `rgba(15, 23, 42, ${Math.min(settings.overlayOpacity, 0.45)})`;
      ctx.fillRect(0, 0, width, height);
    } else if (bgImageElement) {
      ctx.drawImage(bgImageElement, 0, 0, width, height);
      ctx.fillStyle = `rgba(15, 23, 42, ${Math.min(settings.overlayOpacity, 0.45)})`;
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

    // 1.5 Geometric Style Particle Effect (1 FPS Animated Loop)
    if (settings.showParticles) {
      ctx.save();
      const numParticles = 24;
      const points: { x: number; y: number }[] = [];

      for (let i = 0; i < numParticles; i++) {
        const seedX = (i * 137.5 + 50) % width;
        const seedY = (i * 223.1 + 40) % height;
        const px = seedX + Math.sin(animTick * 0.4 + i * 0.7) * 45;
        const py = seedY + Math.cos(animTick * 0.3 + i * 1.1) * 35;
        points.push({ x: px, y: py });

        ctx.save();
        ctx.translate(px, py);
        ctx.rotate((animTick + i) * 0.15);

        ctx.strokeStyle =
          i % 3 === 0
            ? "rgba(129, 140, 248, 0.45)"
            : i % 3 === 1
            ? "rgba(236, 72, 153, 0.4)"
            : "rgba(6, 182, 212, 0.4)";
        ctx.lineWidth = 1.5;

        if (i % 4 === 0) {
          ctx.beginPath();
          for (let h = 0; h < 6; h++) {
            const hAngle = (h / 6) * 2 * Math.PI;
            const hx = Math.cos(hAngle) * 12;
            const hy = Math.sin(hAngle) * 12;
            if (h === 0) ctx.moveTo(hx, hy);
            else ctx.lineTo(hx, hy);
          }
          ctx.closePath();
          ctx.stroke();
        } else if (i % 4 === 1) {
          ctx.beginPath();
          ctx.moveTo(0, -10);
          ctx.lineTo(9, 7);
          ctx.lineTo(-9, 7);
          ctx.closePath();
          ctx.stroke();
        } else if (i % 4 === 2) {
          ctx.beginPath();
          ctx.rect(-6, -6, 12, 12);
          ctx.stroke();
        } else {
          ctx.fillStyle = "rgba(168, 85, 247, 0.6)";
          ctx.beginPath();
          ctx.arc(0, 0, 3.5, 0, 2 * Math.PI);
          ctx.fill();
        }
        ctx.restore();
      }

      // Connecting constellation lines between nearby particles
      ctx.strokeStyle = "rgba(99, 102, 241, 0.12)";
      ctx.lineWidth = 1;
      for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
          const dx = points[i].x - points[j].x;
          const dy = points[i].y - points[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 180) {
            ctx.beginPath();
            ctx.moveTo(points[i].x, points[i].y);
            ctx.lineTo(points[j].x, points[j].y);
            ctx.stroke();
          }
        }
      }
      ctx.restore();
    }

    // 2. Container frame
    const padding = width * 0.06;
    const cardX = padding;
    const cardY = padding;
    const cardWidth = width - padding * 2;
    const cardHeight = height - padding * 2;

    ctx.save();
    ctx.beginPath();
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
      ctx.beginPath();
      const badgeFontSize = 14;
      ctx.font = `700 ${badgeFontSize}px 'Poppins', 'Open Sans', system-ui, -apple-system, sans-serif`;
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

    ctx.font = `800 ${titleFontSize}px 'Poppins', sans-serif`;
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
      ctx.font = `600 ${subFontSize}px 'Open Sans', 'Poppins', system-ui, -apple-system, sans-serif`;
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
      ctx.font = `500 ${partFontSize}px 'Open Sans', 'Poppins', system-ui, -apple-system, sans-serif`;
      ctx.fillStyle = "#94a3b8";
      ctx.textAlign = settings.textAlign;
      ctx.textBaseline = "top";

      const partY = startY + lines.length * lineHeight + 52;
      ctx.fillText(settings.participants, textX, partY);
      ctx.restore();
    }

    // 7. Rotating Vinyl Record Turntable (1 FPS Animation) & Subscribe CTA Badge
    let vinylX = cardX + 155;
    let vinylY = cardY + cardHeight - 125; // Restored back to original higher position!
    let ctaX = cardX + cardWidth - 160;
    let ctaY = cardY + cardHeight - 95; // Down at bottom side!

    if (settings.textAlign === "center") {
      vinylX = width / 2;
      vinylY = startY + lines.length * lineHeight + (settings.meetingSubtitle ? 35 : 0) + (settings.participants ? 30 : 0) + 115;
      if (vinylY > cardY + cardHeight - 130) {
        vinylY = cardY + cardHeight - 130;
      }
      ctaX = width / 2;
      ctaY = cardY + cardHeight - 35;
    } else if (settings.textAlign === "right") {
      vinylX = cardX + cardWidth - 155;
      vinylY = cardY + cardHeight - 125;
      ctaX = cardX + 160;
      ctaY = cardY + cardHeight - 95;
    }

    const vinylRadius = 112; // Even larger & extra crisp!
    const rotAngle = (animTick % 1000) * (Math.PI / 12); // 1 FPS rotation step

    ctx.save();

    // --- A. ROTATING VINYL DISC & CENTER ORANGE LABEL ---
    ctx.save();
    ctx.translate(vinylX, vinylY);
    ctx.rotate(rotAngle);

    // 1. Outer Dark Vinyl Disc
    ctx.beginPath();
    ctx.arc(0, 0, vinylRadius, 0, 2 * Math.PI);
    const discGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, vinylRadius);
    discGrad.addColorStop(0, "#22262e");
    discGrad.addColorStop(0.4, "#0f1115");
    discGrad.addColorStop(0.8, "#1a1d24");
    discGrad.addColorStop(1, "#07080a");
    ctx.fillStyle = discGrad;
    ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
    ctx.shadowBlur = 15;
    ctx.fill();

    ctx.strokeStyle = "#383d47";
    ctx.lineWidth = 2;
    ctx.stroke();

    // 2. Concentric Vinyl Grooves
    const grooveRadii = [102, 93, 84, 75, 66, 57];
    grooveRadii.forEach((r) => {
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, 2 * Math.PI);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // 3. Glossy Refraction Sheen Highlight
    ctx.beginPath();
    ctx.arc(0, 0, vinylRadius - 4, -Math.PI / 4, Math.PI / 6);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
    ctx.lineWidth = 6;
    ctx.stroke();

    // 4. Center Orange Label
    const labelRadius = 40;
    // Outer Red Border Ring
    ctx.beginPath();
    ctx.arc(0, 0, labelRadius + 3, 0, 2 * Math.PI);
    ctx.fillStyle = "#b91c1c";
    ctx.fill();

    // Inner Amber/Orange Circle
    ctx.beginPath();
    ctx.arc(0, 0, labelRadius, 0, 2 * Math.PI);
    ctx.fillStyle = "#f59e0b";
    ctx.fill();

    // 5. Inside Orange Label: Uploaded Channel Logo or Spindle Center
    if (logoImageElement) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, labelRadius, 0, 2 * Math.PI);
      ctx.clip(); // Clips image cleanly into center orange circle!
      ctx.drawImage(
        logoImageElement,
        -labelRadius,
        -labelRadius,
        labelRadius * 2,
        labelRadius * 2
      );
      ctx.restore();
    } else {
      // Center Spindle Hole
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, 2 * Math.PI);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.strokeStyle = "#92400e";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    ctx.restore(); // End vinyl rotation transform

    // --- B. METALLIC TONEARM NEEDLE (Rests Stationary on Vinyl Grooves) ---
    ctx.save();
    const armPivotX = vinylX - vinylRadius - 22;
    const armPivotY = vinylY - vinylRadius / 2 - 12;

    // Tonearm metallic curved arm
    ctx.beginPath();
    ctx.moveTo(armPivotX, armPivotY);
    ctx.quadraticCurveTo(vinylX - 70, vinylY - 70, vinylX - 32, vinylY + 22);
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 6;
    ctx.stroke();

    // Needle cartridge & pin resting on grooves
    ctx.save();
    ctx.translate(vinylX - 32, vinylY + 22);
    ctx.rotate(Math.PI / 6);
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(-5, -3, 14, 8);
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(5, -1.5, 4, 5);
    ctx.restore();

    // Arm pivot base
    ctx.beginPath();
    ctx.arc(armPivotX, armPivotY, 9, 0, 2 * Math.PI);
    ctx.fillStyle = "#475569";
    ctx.fill();
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // --- C. DYNAMIC 3D YOUTUBE SUBSCRIBE & GOLDEN BELL BADGE ---
    if (settings.showCta && settings.ctaText) {
      ctx.save();
      const textUpper = settings.ctaText.toUpperCase();

      ctx.font = `800 14px 'Poppins', sans-serif`;
      const textMetrics = ctx.measureText(textUpper);
      const textW = textMetrics.width;

      const badgeH = 46;
      const playDiscRadius = 20;
      const bellRadius = 18;
      const badgeW = Math.max(180, playDiscRadius * 2 + textW + bellRadius * 2 + 22);

      const ctaLeft = ctaX - badgeW / 2;
      const ctaTop = ctaY - badgeH / 2;

      // 1. Red 3D Pill Container Body (Gradient + 3D drop shadow)
      ctx.save();
      ctx.shadowColor = "rgba(220, 38, 38, 0.65)";
      ctx.shadowBlur = 16;
      ctx.shadowOffsetY = 4;

      const redGrad = ctx.createLinearGradient(
        ctaLeft,
        ctaTop,
        ctaLeft,
        ctaTop + badgeH
      );
      redGrad.addColorStop(0, "#ef4444");
      redGrad.addColorStop(0.4, "#dc2626");
      redGrad.addColorStop(1, "#b91c1c");
      ctx.fillStyle = redGrad;

      ctx.beginPath();
      ctx.roundRect(ctaLeft + 8, ctaTop, badgeW - 16, badgeH, 100);
      ctx.fill();

      // Top Highlight Edge for 3D Bevel
      ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      // 2. Left 3D White Circular Play Button Disc
      const discCenterX = ctaLeft + playDiscRadius + 6;
      const discCenterY = ctaTop + badgeH / 2;

      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, 0.35)";
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 2;

      ctx.beginPath();
      ctx.arc(discCenterX, discCenterY, playDiscRadius, 0, 2 * Math.PI);
      const discGrad = ctx.createLinearGradient(
        discCenterX - playDiscRadius,
        discCenterY - playDiscRadius,
        discCenterX + playDiscRadius,
        discCenterY + playDiscRadius
      );
      discGrad.addColorStop(0, "#ffffff");
      discGrad.addColorStop(1, "#e2e8f0");
      ctx.fillStyle = discGrad;
      ctx.fill();

      ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Inner Red Play Triangle
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#dc2626";
      ctx.beginPath();
      ctx.moveTo(discCenterX - 4, discCenterY - 7);
      ctx.lineTo(discCenterX + 7, discCenterY);
      ctx.lineTo(discCenterX - 4, discCenterY + 7);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // 3. Dynamic Custom Text
      ctx.save();
      ctx.font = `800 13px 'Poppins', sans-serif`;
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
      ctx.shadowBlur = 4;
      ctx.shadowOffsetY = 1;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(textUpper, ctaLeft + playDiscRadius * 2 + 13, discCenterY + 1);
      ctx.restore();

      // 4. Right 3D Golden Notification Bell Icon (Bigger & 3D Shaded)
      const bellCenterX = ctaLeft + badgeW - 10;
      const bellCenterY = ctaTop + badgeH / 2;

      ctx.save();
      ctx.translate(bellCenterX, bellCenterY);
      ctx.rotate(-Math.PI / 16); // Tilted 3D dynamic angle
      ctx.scale(1.45, 1.45); // 1.45x bigger!

      // Bell 3D Glow Drop Shadow
      ctx.shadowColor = "rgba(245, 158, 11, 0.85)";
      ctx.shadowBlur = 18;
      ctx.shadowOffsetY = 3;

      // Main Golden Bell Dome Body
      ctx.beginPath();
      ctx.moveTo(-13, 6);
      ctx.bezierCurveTo(-13, -10, -10, -15, 0, -15);
      ctx.bezierCurveTo(10, -15, 13, -10, 13, 6);
      ctx.lineTo(16, 10);
      ctx.lineTo(-16, 10);
      ctx.closePath();

      const bellGrad = ctx.createLinearGradient(-13, -15, 13, 10);
      bellGrad.addColorStop(0, "#fff59d");
      bellGrad.addColorStop(0.3, "#fde047");
      bellGrad.addColorStop(0.7, "#f59e0b");
      bellGrad.addColorStop(1, "#b45309");
      ctx.fillStyle = bellGrad;
      ctx.fill();

      ctx.strokeStyle = "#fef08a";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 3D Glossy Reflection Line
      ctx.beginPath();
      ctx.moveTo(-6, -8);
      ctx.bezierCurveTo(-6, -4, -5, 0, -5, 4);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.stroke();

      // Bell Top Handle Ring
      ctx.beginPath();
      ctx.arc(0, -15, 4.5, Math.PI, 2 * Math.PI);
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Bell Clapper Ball (Bottom)
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(0, 12.5, 4.5, 0, 2 * Math.PI);
      const clapperGrad = ctx.createRadialGradient(0, 12.5, 1, 0, 12.5, 4.5);
      clapperGrad.addColorStop(0, "#f59e0b");
      clapperGrad.addColorStop(1, "#78350f");
      ctx.fillStyle = clapperGrad;
      ctx.fill();

      ctx.restore(); // End Bell transform

      ctx.restore(); // End CTA badge transform
    }

    ctx.restore();

    const footerFontSize = 13;
    ctx.font = `600 ${footerFontSize}px 'Open Sans', 'Poppins', system-ui, -apple-system, sans-serif`;
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.textAlign = "right";
    ctx.fillText(
      "Powered by VidFlash.in",
      cardX + cardWidth - 35,
      cardY + cardHeight - 25
    );
    ctx.restore();

    const dataUrl = canvas.toDataURL("image/png");
    onCanvasDataUrlChange(dataUrl);
  }, [settings, bgImageElement, bgVideoElement, logoImageElement, animTick]);

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

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onChangeSettings({
          ...settings,
          channelLogo: event.target?.result as string,
        });
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const applyTemplate = (tpl: "google-meet" | "confidential" | "minimal" | "podcast") => {
    const keepPreset = settings.customBgImage ? "custom-image" : undefined;
    switch (tpl) {
      case "google-meet":
        onChangeSettings({
          ...settings,
          template: "google-meet",
          preset: keepPreset || "gradient-indigo",
          showBadge: true,
          badgeText: "Presented by VidFlash",
          badgeColor: "#7c3aed",
          titleColor: "#ffffff",
          subtitleColor: "#cbd5e1",
          textAlign: "left",
        });
        break;
      case "confidential":
        onChangeSettings({
          ...settings,
          template: "confidential",
          preset: keepPreset || "gradient-sunset",
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
          preset: keepPreset || "solid-midnight",
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
          preset: keepPreset || "gradient-emerald",
          showBadge: true,
          badgeText: "Presented by VidFlash",
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
                  className={`relative p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${settings.resolutionPreset === r.id
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

              <div className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold text-[11px] shrink-0 ml-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>PERMANENT LOSSLESS</span>
              </div>
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
                  className={`p-2 rounded-xl border text-xs font-medium flex items-center space-x-2 transition-all ${settings.preset === p.id
                    ? "border-indigo-500 bg-indigo-950/60 text-white ring-1 ring-indigo-500/50"
                    : "border-slate-800 bg-slate-950/50 text-slate-400 hover:text-slate-200"
                    }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full ${p.color}`} />
                  <span className="truncate">{p.name}</span>
                </button>
              ))}
            </div>

            <div className="pt-2 flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
              <label htmlFor="showParticles" className="text-xs font-semibold text-indigo-300 flex items-center space-x-2 cursor-pointer">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>Enable 1 FPS Geometry Particle Effects</span>
              </label>
              <input
                id="showParticles"
                type="checkbox"
                checked={settings.showParticles}
                onChange={(e) =>
                  onChangeSettings({
                    ...settings,
                    showParticles: e.target.checked,
                  })
                }
                className="w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-950 cursor-pointer"
              />
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
              <p className="text-[11px] text-slate-400 mt-1">
                Supports PNG, JPG, WebP & custom photo background images.
              </p>
            </div>

            <div className="pt-2">
              <label className="block text-xs font-semibold text-indigo-300 mb-1 flex items-center justify-between">
                <span>Channel / Brand Logo (Inside Vinyl Center):</span>
                {settings.channelLogo && (
                  <button
                    onClick={() => onChangeSettings({ ...settings, channelLogo: null })}
                    className="text-[10px] text-red-400 hover:text-red-300 underline"
                  >
                    Remove Logo
                  </button>
                )}
              </label>
              <input
                type="file"
                accept="image/*,.gif"
                onChange={handleLogoUpload}
                className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-950 file:text-indigo-300 hover:file:bg-indigo-900 border border-indigo-500/30 rounded-xl cursor-pointer"
              />
              {settings.channelLogo && (
                <p className="text-[11px] text-emerald-400 font-semibold mt-1">
                  ✓ Channel logo loaded into center orange vinyl disc!
                </p>
              )}
            </div>
          </div>

          {/* Text Fields */}
          <div className="space-y-4 pt-3 border-t border-slate-800">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
              <Type className="w-4 h-4 text-purple-400" />
              <span>Text Overlay & CTA Content</span>
            </label>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Call To Action (CTA) Button Text
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={settings.ctaText}
                  onChange={(e) =>
                    onChangeSettings({
                      ...settings,
                      ctaText: e.target.value,
                    })
                  }
                  placeholder="SUBSCRIBE NOW"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-red-500"
                />
                <button
                  type="button"
                  onClick={() =>
                    onChangeSettings({
                      ...settings,
                      showCta: !settings.showCta,
                    })
                  }
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    settings.showCta
                      ? "bg-red-600 text-white border-red-500"
                      : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                  }`}
                >
                  {settings.showCta ? "Shown" : "Hidden"}
                </button>
              </div>
            </div>

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
                placeholder="Hosted by VidFlash.in"
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
                    className={`py-1.5 rounded-lg border text-xs font-medium uppercase transition-colors ${settings.textAlign === align
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
