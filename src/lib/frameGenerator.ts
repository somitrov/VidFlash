import { CanvasSettings } from "@/types";
import { SUBSCRIBE_BADGE_DATA_URL } from "@/lib/subscribeBadgeDataUrl";

export async function generate1FPSAnimationSequence(
  settings: CanvasSettings,
  canvasDataUrl: string,
  frameCount: number = 12
): Promise<string[]> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return [canvasDataUrl];
  }

  const frames: string[] = [];
  const offscreen = document.createElement("canvas");
  offscreen.width = 1280;
  offscreen.height = 720;
  const ctx = offscreen.getContext("2d");

  if (!ctx) return [canvasDataUrl];

  // Preload 3D Subscribe Bell Badge image asset
  let badgeImg: HTMLImageElement | null = null;
  if (settings.showCta) {
    badgeImg = new Image();
    badgeImg.crossOrigin = "anonymous";
    badgeImg.src = SUBSCRIBE_BADGE_DATA_URL;
    await new Promise((res) => {
      if (badgeImg) badgeImg.onload = res;
      setTimeout(res, 250);
    });
  }

  // Preload logo image if present
  let logoImg: HTMLImageElement | null = null;
  if (settings.channelLogo) {
    logoImg = new Image();
    logoImg.crossOrigin = "anonymous";
    logoImg.src = settings.channelLogo;
    await new Promise((res) => {
      if (logoImg) logoImg.onload = res;
      setTimeout(res, 250);
    });
  }

  // Preload custom bg image if present
  let bgImg: HTMLImageElement | null = null;
  if (settings.preset === "custom-image" && settings.customBgImage) {
    bgImg = new Image();
    bgImg.crossOrigin = "anonymous";
    bgImg.src = settings.customBgImage;
    await new Promise((res) => {
      if (bgImg) bgImg.onload = res;
      setTimeout(res, 250);
    });
  }

  const width = 1280;
  const height = 720;
  const padding = width * 0.06;
  const cardX = padding;
  const cardY = padding;
  const cardWidth = width - padding * 2;
  const cardHeight = height - padding * 2;

  for (let tick = 0; tick < frameCount; tick++) {
    ctx.clearRect(0, 0, width, height);

    // 1. Draw Background
    if (bgImg) {
      ctx.drawImage(bgImg, 0, 0, width, height);
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
        const px = seedX + Math.sin(tick * 0.4 + i * 0.7) * 45;
        const py = seedY + Math.cos(tick * 0.3 + i * 1.1) * 35;
        points.push({ x: px, y: py });

        ctx.save();
        ctx.translate(px, py);
        ctx.rotate((tick + i) * 0.15);

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

      // Connecting constellation lines
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
      ctx.font = `700 ${badgeFontSize}px 'Poppins', 'Open Sans', sans-serif`;
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
      ctx.font = `600 ${subFontSize}px 'Open Sans', 'Poppins', sans-serif`;
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
      ctx.font = `500 ${partFontSize}px 'Open Sans', 'Poppins', sans-serif`;
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

    const vinylRadius = 96; // Extra large & crisp!
    const rotAngle = tick * (Math.PI / 12); // 1 FPS vinyl rotation step

    ctx.save();

    // ROTATING VINYL DISC & CENTER LABEL
    ctx.save();
    ctx.translate(vinylX, vinylY);
    ctx.rotate(rotAngle);

    // Outer Dark Vinyl Disc
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

    // Concentric Vinyl Grooves
    const grooveRadii = [88, 80, 72, 64, 56, 48];
    grooveRadii.forEach((r) => {
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, 2 * Math.PI);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Glossy Sheen
    ctx.beginPath();
    ctx.arc(0, 0, vinylRadius - 4, -Math.PI / 4, Math.PI / 6);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
    ctx.lineWidth = 6;
    ctx.stroke();

    // Center Orange Label
    const labelRadius = 35;
    ctx.beginPath();
    ctx.arc(0, 0, labelRadius + 3, 0, 2 * Math.PI);
    ctx.fillStyle = "#b91c1c";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, 0, labelRadius, 0, 2 * Math.PI);
    ctx.fillStyle = "#f59e0b";
    ctx.fill();

    // Inside Orange Label: Uploaded Channel Logo or Spindle Hole
    if (logoImg) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, labelRadius, 0, 2 * Math.PI);
      ctx.clip();
      ctx.drawImage(
        logoImg,
        -labelRadius,
        -labelRadius,
        labelRadius * 2,
        labelRadius * 2
      );
      ctx.restore();
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, 2 * Math.PI);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.strokeStyle = "#92400e";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    ctx.restore(); // End vinyl rotation

    // METALLIC TONEARM NEEDLE
    ctx.save();
    const armPivotX = vinylX - vinylRadius - 20;
    const armPivotY = vinylY - vinylRadius / 2 - 10;

    ctx.beginPath();
    ctx.moveTo(armPivotX, armPivotY);
    ctx.quadraticCurveTo(vinylX - 60, vinylY - 60, vinylX - 28, vinylY + 18);
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 6;
    ctx.stroke();

    ctx.save();
    ctx.translate(vinylX - 28, vinylY + 18);
    ctx.rotate(Math.PI / 6);
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(-5, -3, 14, 8);
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(5, -1.5, 4, 5);
    ctx.restore();

    ctx.beginPath();
    ctx.arc(armPivotX, armPivotY, 9, 0, 2 * Math.PI);
    ctx.fillStyle = "#475569";
    ctx.fill();
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // DYNAMIC 3D YOUTUBE SUBSCRIBE & GOLDEN BELL BADGE
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

      // 1. Red 3D Pill Container Body
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

    // Watermark
    const footerFontSize = 13;
    ctx.font = `600 ${footerFontSize}px 'Open Sans', 'Poppins', sans-serif`;
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.textAlign = "right";
    ctx.fillText(
      "Powered by VidFlash.hirelancer.in",
      cardX + cardWidth - 35,
      cardY + cardHeight - 25
    );

    frames.push(offscreen.toDataURL("image/png"));
  }

  return frames;
}
