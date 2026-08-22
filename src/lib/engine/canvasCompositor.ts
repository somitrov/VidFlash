import {
  TimelineClip,
  SubtitleCue,
  SubtitleStyleConfig,
  MotionEffect,
  TransitionEffect,
} from "@/types/autoeditor";

/**
 * High-performance, clean-room 60FPS Video Canvas Compositor
 * Supports Ken Burns Pan/Zoom, Multi-Transitions, Dynamic Subtitles, Scene Fades, and Geometric Overlays.
 */

export function renderCompositorFrame({
  ctx,
  width,
  height,
  currentTimeSec,
  totalDurationSec,
  clips,
  subtitles,
  subtitleStyle,
  fadeInSec = 0.5,
  fadeOutSec = 0.6,
  enableParticles = false,
  enableGlow = false,
}: {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  currentTimeSec: number;
  totalDurationSec?: number;
  clips: TimelineClip[];
  subtitles: SubtitleCue[];
  subtitleStyle: SubtitleStyleConfig;
  fadeInSec?: number;
  fadeOutSec?: number;
  enableParticles?: boolean;
  enableGlow?: boolean;
}) {
  // 1. Base dark stage
  ctx.save();
  ctx.fillStyle = "#020617";
  ctx.fillRect(0, 0, width, height);

  // 2. Active Clip & Transition Evaluation
  const activeClipIndex = clips.findIndex(
    (c) => currentTimeSec >= c.startSec && currentTimeSec < c.endSec
  );

  if (activeClipIndex !== -1) {
    const currentClip = clips[activeClipIndex];
    const nextClip =
      activeClipIndex + 1 < clips.length ? clips[activeClipIndex + 1] : null;

    const clipProgress = Math.max(
      0,
      Math.min(
        1,
        (currentTimeSec - currentClip.startSec) /
          Math.max(0.1, currentClip.durationSec)
      )
    );

    // Check transition overlap with next clip
    const timeRemaining = currentClip.endSec - currentTimeSec;
    const isTransitioning =
      nextClip &&
      nextClip.transition !== "cut" &&
      timeRemaining <= (nextClip.transitionDuration || 0.6);

    if (isTransitioning && nextClip) {
      const transDuration = Math.max(0.1, nextClip.transitionDuration || 0.6);
      const transProgress = Math.max(0, Math.min(1, 1 - timeRemaining / transDuration));

      const incomingProgress = Math.max(
        0,
        Math.min(
          1,
          (currentTimeSec - nextClip.startSec) /
            Math.max(0.1, nextClip.durationSec)
        )
      );

      // Render transition composite
      renderTransitionComposite(
        ctx,
        currentClip,
        nextClip,
        clipProgress,
        incomingProgress,
        transProgress,
        nextClip.transition,
        width,
        height
      );
    } else {
      // Normal single clip rendering with Ken Burns
      ctx.save();
      renderSingleClip(ctx, currentClip, clipProgress, width, height, 1.0);
      ctx.restore();
    }
  } else if (clips.length > 0) {
    // Clamped fallback to first or last clip
    const fallbackClip =
      currentTimeSec <= 0 ? clips[0] : clips[clips.length - 1];
    ctx.save();
    renderSingleClip(ctx, fallbackClip, 1.0, width, height, 1.0);
    ctx.restore();
  }

  // 3. Ambient Glow / Vignette (Optional)
  if (enableGlow) {
    ctx.save();
    const radial = ctx.createRadialGradient(
      width / 2,
      height / 2,
      width * 0.2,
      width / 2,
      height / 2,
      width * 0.75
    );
    radial.addColorStop(0, "rgba(99, 102, 241, 0.04)");
    radial.addColorStop(0.7, "rgba(0, 0, 0, 0.25)");
    radial.addColorStop(1, "rgba(0, 0, 0, 0.7)");
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  // 4. Floating Geometric Particles (Optional)
  if (enableParticles) {
    renderFloatingParticles(ctx, width, height, currentTimeSec);
  }

  // 5. Scene Opening & Ending Fades
  if (fadeInSec > 0 && currentTimeSec < fadeInSec) {
    const fadeProgress = 1 - currentTimeSec / fadeInSec;
    ctx.save();
    ctx.fillStyle = `rgba(0, 0, 0, ${Math.max(0, Math.min(1, fadeProgress))})`;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  const effectiveTotal = totalDurationSec || (clips.length > 0 ? clips[clips.length - 1].endSec : 10);
  if (fadeOutSec > 0 && currentTimeSec > effectiveTotal - fadeOutSec) {
    const fadeOutProgress = (currentTimeSec - (effectiveTotal - fadeOutSec)) / fadeOutSec;
    ctx.save();
    ctx.fillStyle = `rgba(0, 0, 0, ${Math.max(0, Math.min(1, fadeOutProgress))})`;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  // 6. Subtitles & Captions Overlay
  renderSubtitles(ctx, width, height, currentTimeSec, subtitles, subtitleStyle);

  ctx.restore();
}

/**
 * Renders transition between outgoing and incoming clip
 */
function renderTransitionComposite(
  ctx: CanvasRenderingContext2D,
  outgoingClip: TimelineClip,
  incomingClip: TimelineClip,
  outgoingProgress: number,
  incomingProgress: number,
  t: number, // 0.0 -> 1.0
  transition: TransitionEffect,
  width: number,
  height: number
) {
  switch (transition) {
    case "crossfade": {
      ctx.save();
      renderSingleClip(ctx, outgoingClip, outgoingProgress, width, height, 1.0);
      ctx.restore();

      ctx.save();
      renderSingleClip(ctx, incomingClip, incomingProgress, width, height, t);
      ctx.restore();
      break;
    }

    case "fade-to-black": {
      ctx.save();
      if (t < 0.5) {
        const outAlpha = 1 - t * 2;
        renderSingleClip(ctx, outgoingClip, outgoingProgress, width, height, outAlpha);
      } else {
        const inAlpha = (t - 0.5) * 2;
        renderSingleClip(ctx, incomingClip, incomingProgress, width, height, inAlpha);
      }
      ctx.restore();
      break;
    }

    case "flash-white": {
      ctx.save();
      if (t < 0.5) {
        renderSingleClip(ctx, outgoingClip, outgoingProgress, width, height, 1.0);
        ctx.fillStyle = `rgba(255, 255, 255, ${t * 2})`;
        ctx.fillRect(0, 0, width, height);
      } else {
        renderSingleClip(ctx, incomingClip, incomingProgress, width, height, 1.0);
        ctx.fillStyle = `rgba(255, 255, 255, ${(1 - t) * 2})`;
        ctx.fillRect(0, 0, width, height);
      }
      ctx.restore();
      break;
    }

    case "wipe-left": {
      ctx.save();
      renderSingleClip(ctx, outgoingClip, outgoingProgress, width, height, 1.0);
      ctx.beginPath();
      ctx.rect(width * (1 - t), 0, width * t, height);
      ctx.clip();
      renderSingleClip(ctx, incomingClip, incomingProgress, width, height, 1.0);
      ctx.restore();
      break;
    }

    case "wipe-right": {
      ctx.save();
      renderSingleClip(ctx, outgoingClip, outgoingProgress, width, height, 1.0);
      ctx.beginPath();
      ctx.rect(0, 0, width * t, height);
      ctx.clip();
      renderSingleClip(ctx, incomingClip, incomingProgress, width, height, 1.0);
      ctx.restore();
      break;
    }

    case "slide-left": {
      ctx.save();
      ctx.translate(-t * width, 0);
      renderSingleClip(ctx, outgoingClip, outgoingProgress, width, height, 1.0);
      ctx.restore();

      ctx.save();
      ctx.translate((1 - t) * width, 0);
      renderSingleClip(ctx, incomingClip, incomingProgress, width, height, 1.0);
      ctx.restore();
      break;
    }

    case "slide-right": {
      ctx.save();
      ctx.translate(t * width, 0);
      renderSingleClip(ctx, outgoingClip, outgoingProgress, width, height, 1.0);
      ctx.restore();

      ctx.save();
      ctx.translate(-(1 - t) * width, 0);
      renderSingleClip(ctx, incomingClip, incomingProgress, width, height, 1.0);
      ctx.restore();
      break;
    }

    case "zoom-in":
    case "circle-open": {
      ctx.save();
      renderSingleClip(ctx, outgoingClip, outgoingProgress, width, height, 1.0);
      ctx.restore();

      ctx.save();
      const maxRadius = Math.sqrt(width * width + height * height) * 0.6;
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, maxRadius * t, 0, Math.PI * 2);
      ctx.clip();
      renderSingleClip(ctx, incomingClip, incomingProgress, width, height, 1.0);
      ctx.restore();
      break;
    }

    default: {
      renderSingleClip(ctx, incomingClip, incomingProgress, width, height, 1.0);
      break;
    }
  }
}

/**
 * Renders an individual clip with Ken Burns motion effect and cover scaling
 */
function renderSingleClip(
  ctx: CanvasRenderingContext2D,
  clip: TimelineClip,
  progress: number,
  canvasWidth: number,
  canvasHeight: number,
  alpha: number = 1.0
) {
  if (alpha <= 0.001) return;
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

  const mediaSource =
    clip.fileType === "video" ? clip.videoElement : clip.imageElement;
  if (!mediaSource) return;

  const srcWidth =
    clip.fileType === "video"
      ? clip.videoElement?.videoWidth || 1920
      : clip.imageElement?.naturalWidth || 1920;
  const srcHeight =
    clip.fileType === "video"
      ? clip.videoElement?.videoHeight || 1080
      : clip.imageElement?.naturalHeight || 1080;

  // Aspect fill / cover math
  const scaleRatio = Math.max(
    canvasWidth / srcWidth,
    canvasHeight / srcHeight
  );

  const baseWidth = srcWidth * scaleRatio;
  const baseHeight = srcHeight * scaleRatio;

  // Ken Burns Motion Matrices
  let scaleMultiplier = 1.0;
  let offsetX = 0;
  let offsetY = 0;

  const easeProgress = easeInOutQuad(progress);

  switch (clip.motion) {
    case "ken-burns-zoom-in":
      scaleMultiplier = 1.0 + 0.12 * easeProgress;
      break;
    case "ken-burns-zoom-out":
      scaleMultiplier = 1.12 - 0.12 * easeProgress;
      break;
    case "pan-left":
      scaleMultiplier = 1.08;
      offsetX = (canvasWidth * 0.05) * (1 - easeProgress * 2);
      break;
    case "pan-right":
      scaleMultiplier = 1.08;
      offsetX = -(canvasWidth * 0.05) * (1 - easeProgress * 2);
      break;
    case "pulse":
      scaleMultiplier = 1.0 + Math.sin(progress * Math.PI) * 0.06;
      break;
    case "none":
    default:
      scaleMultiplier = 1.0;
      break;
  }

  const finalWidth = baseWidth * scaleMultiplier;
  const finalHeight = baseHeight * scaleMultiplier;
  const drawX = (canvasWidth - finalWidth) / 2 + offsetX;
  const drawY = (canvasHeight - finalHeight) / 2 + offsetY;

  ctx.drawImage(mediaSource, drawX, drawY, finalWidth, finalHeight);
}

/**
 * Renders glowing floating particles
 */
function renderFloatingParticles(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  timeSec: number
) {
  ctx.save();
  const particleCount = 20;

  for (let i = 0; i < particleCount; i++) {
    const seed = i * 137.5;
    const speed = 0.3 + (i % 5) * 0.15;
    const x = ((Math.sin(seed + timeSec * speed) * 0.5 + 0.5) * width) % width;
    const y = ((Math.cos(seed * 1.3 + timeSec * speed * 0.8) * 0.5 + 0.5) * height) % height;
    const size = 2 + (i % 4) * 2.5;
    const opacity = 0.15 + Math.sin(timeSec * 2 + i) * 0.1;

    ctx.fillStyle = i % 2 === 0 ? `rgba(168, 85, 247, ${opacity})` : `rgba(56, 189, 248, ${opacity})`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Dynamic Subtitle Renderer
 */
function renderSubtitles(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  currentTimeSec: number,
  subtitles: SubtitleCue[],
  style: SubtitleStyleConfig
) {
  const activeCue = subtitles.find(
    (s) => currentTimeSec >= s.startSec && currentTimeSec <= s.endSec
  );
  if (!activeCue || !activeCue.text.trim()) return;

  ctx.save();
  const scale = width / 1920;
  const scaledFontSize = Math.max(16, Math.round(style.fontSize * scale));

  ctx.font = `bold ${scaledFontSize}px '${style.fontFamily}', -apple-system, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const lines = wrapText(ctx, activeCue.text, width * 0.85);
  const lineHeight = scaledFontSize * 1.35;
  const totalTextHeight = lines.length * lineHeight;

  let startY = height * 0.82;
  if (style.position === "top") startY = height * 0.15;
  if (style.position === "center") startY = height * 0.5;

  lines.forEach((line, index) => {
    const y = startY + (index - (lines.length - 1) / 2) * lineHeight;

    // Optional Background Pill
    if (style.showBackground) {
      const textMetrics = ctx.measureText(line);
      const paddingX = scaledFontSize * 0.45;
      const paddingY = scaledFontSize * 0.25;

      ctx.fillStyle = style.bgColor || "rgba(0, 0, 0, 0.75)";
      ctx.beginPath();
      ctx.roundRect(
        width / 2 - textMetrics.width / 2 - paddingX,
        y - lineHeight / 2 + paddingY / 2,
        textMetrics.width + paddingX * 2,
        lineHeight - paddingY,
        8 * scale
      );
      ctx.fill();
    }

    // Text Outline / Stroke
    if (style.strokeWidth > 0) {
      ctx.strokeStyle = style.strokeColor || "#000000";
      ctx.lineWidth = style.strokeWidth * scale * 2;
      ctx.lineJoin = "round";
      ctx.strokeText(line, width / 2, y);
    }

    // Text Fill
    ctx.fillStyle = style.color || "#ffffff";
    ctx.fillText(line, width / 2, y);
  });

  ctx.restore();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}
