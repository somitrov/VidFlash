import {
  TimelineClip,
  SubtitleCue,
  SubtitleStyleConfig,
  MotionEffect,
  TransitionEffect,
} from "@/types/autoeditor";
import {
  getOrExtractDoodleVectorData,
  evaluateDoodlePositionAtProgress,
  DetectedBgColor,
} from "./edgeTracer";

/**
 * High-performance, clean-room 60FPS Video Canvas Compositor
 * Supports Ken Burns Pan/Zoom, Multi-Transitions, Dynamic Subtitles, Scene Fades,
 * Old Film Grain, Old Cinema Projector Particles, Geometric Tech Grid, Black & White Noir,
 * VHS Scanlines, Cinemascope Letterbox, and Optical Overlays.
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
  enableVintageFilmReel = false,
  enableFilmGrain = false,
  enableOldCinema = false,
  enableGeometricGrid = false,
  enableBlackAndWhite = false,
  enableVhsScanlines = false,
  enableLetterbox = false,
  enablePrismGlow = false,
  enableVintageSepia = false,
  enableDoodle = false,
  enableDoodleZoom = false,
  doodleDrawDurationRatio = 0.75,
  doodlePaperStyle = "auto",
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
  enableVintageFilmReel?: boolean;
  enableFilmGrain?: boolean;
  enableOldCinema?: boolean;
  enableGeometricGrid?: boolean;
  enableBlackAndWhite?: boolean;
  enableVhsScanlines?: boolean;
  enableLetterbox?: boolean;
  enablePrismGlow?: boolean;
  enableVintageSepia?: boolean;
  enableDoodle?: boolean;
  enableDoodleZoom?: boolean;
  doodleDrawDurationRatio?: number;
  doodlePaperStyle?: "auto" | "whiteboard" | "paper" | "chalkboard";
}) {
  // 1. Base Stage Background
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  if (enableDoodle) {
    // Find active clip for auto background matching
    const activeClip = clips.find(
      (c) => currentTimeSec >= c.startSec && currentTimeSec < c.endSec
    ) || clips[0];
    let detectedBg: DetectedBgColor | undefined;
    if (activeClip) {
      const mediaSource =
        activeClip.fileType === "video"
          ? activeClip.videoElement
          : activeClip.imageElement;
      if (mediaSource) {
        const vData = getOrExtractDoodleVectorData(mediaSource);
        detectedBg = vData.detectedBgColor;
      }
    }
    renderPaperBackground(ctx, width, height, doodlePaperStyle, detectedBg);
  } else {
    ctx.fillStyle = "#020617";
    ctx.fillRect(0, 0, width, height);
  }

  // Setup color filters for media render
  let baseFilter = "none";
  if (enableBlackAndWhite) {
    baseFilter = "grayscale(100%) contrast(120%) brightness(105%)";
  } else if (enableVintageSepia) {
    baseFilter = "sepia(75%) contrast(110%) brightness(95%)";
  } else if (enableVintageFilmReel) {
    baseFilter = "sepia(30%) contrast(110%) brightness(96%) saturate(85%)";
  }

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

    // Check transition overlap with next clip (for both regular video & Doodle Flash)
    const timeRemaining = currentClip.endSec - currentTimeSec;
    const isTransitioning =
      nextClip &&
      nextClip.transition !== "cut" &&
      timeRemaining <= (nextClip.transitionDuration || 0.6);

    if (isTransitioning && nextClip) {
      const transDuration = Math.max(0.1, nextClip.transitionDuration || 0.6);
      const transProgress = Math.max(
        0,
        Math.min(1, 1 - timeRemaining / transDuration)
      );

      const incomingProgress = Math.max(
        0,
        Math.min(
          1,
          (currentTimeSec - nextClip.startSec) /
            Math.max(0.1, nextClip.durationSec)
        )
      );

      // Render transition composite
      ctx.save();
      renderTransitionComposite(
        ctx,
        currentClip,
        nextClip,
        clipProgress,
        incomingProgress,
        transProgress,
        nextClip.transition,
        width,
        height,
        baseFilter,
        enableVintageFilmReel,
        currentTimeSec,
        enableDoodle,
        doodlePaperStyle,
        doodleDrawDurationRatio,
        enableDoodleZoom
      );
      ctx.restore();
    } else if (enableDoodle) {
      // Normal Doodle Whiteboard Hand-Drawn Animation
      renderDoodleClip({
        ctx,
        clip: currentClip,
        clipProgress,
        canvasWidth: width,
        canvasHeight: height,
        drawDurationRatio: doodleDrawDurationRatio,
        paperStyle: doodlePaperStyle,
        enableDoodleZoom,
        currentTimeSec,
      });
    } else {
      // Normal single clip rendering with Ken Burns
      ctx.save();
      renderSingleClip(
        ctx,
        currentClip,
        clipProgress,
        width,
        height,
        1.0,
        baseFilter,
        enableVintageFilmReel,
        currentTimeSec
      );
      ctx.restore();
    }
  } else if (clips.length > 0) {
    // Clamped fallback to first or last clip
    const fallbackClip =
      currentTimeSec <= 0 ? clips[0] : clips[clips.length - 1];
    if (enableDoodle) {
      renderDoodleClip({
        ctx,
        clip: fallbackClip,
        clipProgress: 1.0,
        canvasWidth: width,
        canvasHeight: height,
        drawDurationRatio: doodleDrawDurationRatio,
        paperStyle: doodlePaperStyle,
        enableDoodleZoom,
        currentTimeSec,
      });
    } else {
      ctx.save();
      renderSingleClip(
        ctx,
        fallbackClip,
        1.0,
        width,
        height,
        1.0,
        baseFilter,
        enableVintageFilmReel,
        currentTimeSec
      );
      ctx.restore();
    }
  }

  // Reset filter for procedural overlays
  ctx.filter = "none";

  // 3. Vintage Film Reel & Gate Weave Overlay (Optional)
  if (enableVintageFilmReel) {
    renderVintageFilmReelOverlay(ctx, width, height, currentTimeSec);
  }

  // 4. Prism / Dreamy Optical Glow Overlay (Optional)
  if (enablePrismGlow) {
    renderPrismGlow(ctx, width, height, currentTimeSec);
  }

  // 5. Ambient Vignette Overlay (Optional)
  if (enableGlow) {
    renderAmbientVignette(ctx, width, height);
  }

  // 6. Floating Golden Particles (Optional)
  if (enableParticles) {
    renderFloatingParticles(ctx, width, height, currentTimeSec);
  }

  // 7. Old Cinema Projector Particles & Light Flicker Overlay (Optional)
  if (enableOldCinema) {
    renderOldCinema(ctx, width, height, currentTimeSec);
  }

  // 8. Old Film Grain & Scratches Overlay (Optional)
  if (enableFilmGrain) {
    renderFilmGrain(ctx, width, height, currentTimeSec);
  }

  // 8. Geometric Tech Grid & HUD Overlay (Optional)
  if (enableGeometricGrid) {
    renderGeometricGrid(ctx, width, height, currentTimeSec);
  }

  // 9. VHS Retro Glitch & CRT Scanlines Overlay (Optional)
  if (enableVhsScanlines) {
    renderVhsScanlines(ctx, width, height, currentTimeSec);
  }

  // 10. Cinemascope 2.39:1 Letterbox Bars Overlay (Optional)
  if (enableLetterbox) {
    renderLetterbox(ctx, width, height);
  }

  // 11. Scene Opening & Ending Fades
  if (fadeInSec > 0 && currentTimeSec < fadeInSec) {
    const fadeProgress = 1 - currentTimeSec / fadeInSec;
    ctx.save();
    ctx.fillStyle = `rgba(0, 0, 0, ${Math.max(0, Math.min(1, fadeProgress))})`;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  const effectiveTotal =
    totalDurationSec ||
    (clips.length > 0 ? clips[clips.length - 1].endSec : 10);
  if (fadeOutSec > 0 && currentTimeSec > effectiveTotal - fadeOutSec) {
    const fadeOutProgress =
      (currentTimeSec - (effectiveTotal - fadeOutSec)) / fadeOutSec;
    ctx.save();
    ctx.fillStyle = `rgba(0, 0, 0, ${Math.max(0, Math.min(1, fadeOutProgress))})`;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  // 12. Subtitles & Captions Overlay
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
  height: number,
  filterStr: string = "none",
  enableVintageFilmReel: boolean = false,
  currentTimeSec: number = 0,
  enableDoodle: boolean = false,
  doodlePaperStyle: "auto" | "whiteboard" | "paper" | "chalkboard" = "auto",
  doodleDrawDurationRatio: number = 0.75,
  enableDoodleZoom: boolean = false
) {
  const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

  const renderClip = (
    clip: TimelineClip,
    prog: number,
    alpha: number = 1.0
  ) => {
    if (alpha <= 0.001) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    if (enableDoodle) {
      renderDoodleClip({
        ctx,
        clip,
        clipProgress: prog,
        canvasWidth: width,
        canvasHeight: height,
        drawDurationRatio: doodleDrawDurationRatio,
        paperStyle: doodlePaperStyle,
        enableDoodleZoom,
        currentTimeSec,
      });
    } else {
      renderClip(clip, prog, 1.0);
    }
    ctx.restore();
  };

  switch (transition) {
    case "crossfade": {
      ctx.save();
      renderClip(outgoingClip, outgoingProgress, 1.0);
      ctx.restore();

      ctx.save();
      renderClip(incomingClip, incomingProgress, t);
      ctx.restore();
      break;
    }

    case "fade-to-black": {
      ctx.save();
      if (t < 0.5) {
        const outAlpha = 1 - t * 2;
        renderClip(outgoingClip, outgoingProgress, outAlpha);
      } else {
        const inAlpha = (t - 0.5) * 2;
        renderClip(incomingClip, incomingProgress, inAlpha);
      }
      ctx.restore();
      break;
    }

    case "flash-white": {
      ctx.save();
      if (t < 0.5) {
        renderClip(outgoingClip, outgoingProgress, 1.0);
        ctx.fillStyle = `rgba(255, 255, 255, ${t * 2})`;
        ctx.fillRect(0, 0, width, height);
      } else {
        renderClip(incomingClip, incomingProgress, 1.0);
        ctx.fillStyle = `rgba(255, 255, 255, ${(1 - t) * 2})`;
        ctx.fillRect(0, 0, width, height);
      }
      ctx.restore();
      break;
    }

    case "light-leak": {
      ctx.save();
      renderClip(outgoingClip, outgoingProgress, 1.0);
      ctx.restore();

      ctx.save();
      renderClip(incomingClip, incomingProgress, t);
      ctx.restore();

      ctx.save();
      ctx.globalCompositeOperation = "screen";
      const leakIntensity = Math.sin(t * Math.PI);

      const leakX = width * (1.2 - t * 1.4);
      const leakY = height * (t * 0.8);
      const leakGrad = ctx.createRadialGradient(
        leakX,
        leakY,
        10,
        leakX,
        leakY,
        width * 0.9
      );
      leakGrad.addColorStop(0, `rgba(255, 200, 100, ${leakIntensity * 0.9})`);
      leakGrad.addColorStop(0.3, `rgba(255, 80, 120, ${leakIntensity * 0.7})`);
      leakGrad.addColorStop(0.6, `rgba(160, 40, 255, ${leakIntensity * 0.4})`);
      leakGrad.addColorStop(1, "rgba(0, 0, 0, 0)");

      ctx.fillStyle = leakGrad;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
      break;
    }

    case "glow-flash": {
      ctx.save();
      renderClip(outgoingClip, outgoingProgress, 1.0);
      ctx.restore();

      ctx.save();
      renderClip(incomingClip, incomingProgress, t);
      ctx.restore();

      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const bloomIntensity = Math.sin(t * Math.PI);
      const bloomGrad = ctx.createRadialGradient(
        width / 2,
        height / 2,
        0,
        width / 2,
        height / 2,
        width * 0.75
      );
      bloomGrad.addColorStop(0, `rgba(255, 255, 240, ${bloomIntensity * 0.95})`);
      bloomGrad.addColorStop(0.4, `rgba(255, 200, 120, ${bloomIntensity * 0.6})`);
      bloomGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = bloomGrad;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
      break;
    }

    case "zoom-in": {
      ctx.save();
      const outScale = 1.0 + ease * 0.9;
      ctx.translate(width / 2, height / 2);
      ctx.scale(outScale, outScale);
      ctx.translate(-width / 2, -height / 2);
      renderClip(outgoingClip, outgoingProgress, 1.0 - t);
      ctx.restore();

      ctx.save();
      const inScale = 0.4 + ease * 0.6;
      ctx.translate(width / 2, height / 2);
      ctx.scale(inScale, inScale);
      ctx.translate(-width / 2, -height / 2);
      renderClip(incomingClip, incomingProgress, t);
      ctx.restore();
      break;
    }

    case "zoom-out": {
      ctx.save();
      const outScale = 1.0 - ease * 0.6;
      ctx.translate(width / 2, height / 2);
      ctx.scale(Math.max(0.1, outScale), Math.max(0.1, outScale));
      ctx.translate(-width / 2, -height / 2);
      renderClip(outgoingClip, outgoingProgress, 1.0 - t);
      ctx.restore();

      ctx.save();
      const inScale = 2.0 - ease * 1.0;
      ctx.translate(width / 2, height / 2);
      ctx.scale(inScale, inScale);
      ctx.translate(-width / 2, -height / 2);
      renderClip(incomingClip, incomingProgress, t);
      ctx.restore();
      break;
    }

    case "zoom-blur": {
      ctx.save();
      const blurScale = 1.0 + ease * 1.2;
      ctx.translate(width / 2, height / 2);
      ctx.scale(blurScale, blurScale);
      ctx.translate(-width / 2, -height / 2);
      renderClip(outgoingClip, outgoingProgress, 1.0 - t);
      ctx.restore();

      ctx.save();
      const inScale = 0.5 + ease * 0.5;
      ctx.translate(width / 2, height / 2);
      ctx.scale(inScale, inScale);
      ctx.translate(-width / 2, -height / 2);
      renderClip(incomingClip, incomingProgress, t);
      ctx.restore();
      break;
    }

    case "glitch": {
      const glitchJitter = Math.sin(t * Math.PI * 8) * 18;
      const sliceCount = 8;
      const sliceHeight = height / sliceCount;

      ctx.save();
      renderClip(t < 0.5 ? outgoingClip : incomingClip, t < 0.5 ? outgoingProgress : incomingProgress, 1.0);

      ctx.globalCompositeOperation = "screen";
      ctx.save();
      ctx.translate(glitchJitter, 0);
      ctx.fillStyle = "rgba(255, 0, 80, 0.25)";
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      ctx.save();
      ctx.translate(-glitchJitter, 0);
      ctx.fillStyle = "rgba(0, 220, 255, 0.25)";
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
      for (let s = 0; s < sliceCount; s += 2) {
        ctx.fillRect(0, s * sliceHeight, width, sliceHeight * 0.5);
      }
      ctx.restore();
      break;
    }

    case "stretch-glow": {
      ctx.save();
      const stretchX = 1.0 + Math.sin(t * Math.PI) * 1.5;
      ctx.translate(width / 2, height / 2);
      ctx.scale(stretchX, 1.0);
      ctx.translate(-width / 2, -height / 2);
      renderClip(t < 0.5 ? outgoingClip : incomingClip, t < 0.5 ? outgoingProgress : incomingProgress, 1.0);
      ctx.restore();
      break;
    }

    case "whip-pan-left": {
      const offset = ease * width;
      ctx.save();
      ctx.translate(-offset, 0);
      renderClip(outgoingClip, outgoingProgress, 1.0);
      ctx.restore();

      ctx.save();
      ctx.translate(width - offset, 0);
      renderClip(incomingClip, incomingProgress, 1.0);
      ctx.restore();
      break;
    }

    case "whip-pan-right": {
      const offset = ease * width;
      ctx.save();
      ctx.translate(offset, 0);
      renderClip(outgoingClip, outgoingProgress, 1.0);
      ctx.restore();

      ctx.save();
      ctx.translate(-width + offset, 0);
      renderClip(incomingClip, incomingProgress, 1.0);
      ctx.restore();
      break;
    }

    case "whip-pan-up": {
      const offset = ease * height;
      ctx.save();
      ctx.translate(0, -offset);
      renderClip(outgoingClip, outgoingProgress, 1.0);
      ctx.restore();

      ctx.save();
      ctx.translate(0, height - offset);
      renderClip(incomingClip, incomingProgress, 1.0);
      ctx.restore();
      break;
    }

    case "whip-pan-down": {
      const offset = ease * height;
      ctx.save();
      ctx.translate(0, -offset);
      renderClip(outgoingClip, outgoingProgress, 1.0);
      ctx.restore();

      ctx.save();
      ctx.translate(0, -height + offset);
      renderClip(incomingClip, incomingProgress, 1.0);
      ctx.restore();
      break;
    }

    case "slide-left": {
      ctx.save();
      ctx.translate(-t * width, 0);
      renderClip(outgoingClip, outgoingProgress, 1.0);
      ctx.restore();

      ctx.save();
      ctx.translate((1 - t) * width, 0);
      renderClip(incomingClip, incomingProgress, 1.0);
      ctx.restore();
      break;
    }

    case "slide-right": {
      ctx.save();
      ctx.translate(t * width, 0);
      renderClip(outgoingClip, outgoingProgress, 1.0);
      ctx.restore();

      ctx.save();
      ctx.translate(-(1 - t) * width, 0);
      renderClip(incomingClip, incomingProgress, 1.0);
      ctx.restore();
      break;
    }

    case "circle-open": {
      ctx.save();
      renderClip(outgoingClip, outgoingProgress, 1.0);
      ctx.restore();

      ctx.save();
      const maxRadius = Math.sqrt(width * width + height * height) * 0.65;
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, maxRadius * ease, 0, Math.PI * 2);
      ctx.clip();
      renderClip(incomingClip, incomingProgress, 1.0);
      ctx.restore();
      break;
    }

    case "spin-360": {
      const angle = ease * Math.PI * 2;
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.rotate(angle);
      ctx.scale(Math.max(0.01, 1 - ease), Math.max(0.01, 1 - ease));
      ctx.translate(-width / 2, -height / 2);
      renderClip(outgoingClip, outgoingProgress, 1.0 - t);
      ctx.restore();

      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.rotate(angle);
      ctx.scale(Math.max(0.01, ease), Math.max(0.01, ease));
      ctx.translate(-width / 2, -height / 2);
      renderClip(incomingClip, incomingProgress, t);
      ctx.restore();
      break;
    }

    case "wipe-left": {
      ctx.save();
      renderClip(outgoingClip, outgoingProgress, 1.0);
      ctx.beginPath();
      ctx.rect(width * (1 - t), 0, width * t, height);
      ctx.clip();
      renderClip(incomingClip, incomingProgress, 1.0);
      ctx.restore();
      break;
    }

    case "wipe-right": {
      ctx.save();
      renderClip(outgoingClip, outgoingProgress, 1.0);
      ctx.beginPath();
      ctx.rect(0, 0, width * t, height);
      ctx.clip();
      renderClip(incomingClip, incomingProgress, 1.0);
      ctx.restore();
      break;
    }

    default: {
      renderClip(incomingClip, incomingProgress, 1.0);
      break;
    }
  }
}

let cachedHandImg: HTMLImageElement | null = null;
function getCachedHandImage(): HTMLImageElement | null {
  if (typeof window === "undefined") return null;
  if (!cachedHandImg) {
    cachedHandImg = new Image();
    cachedHandImg.src = "/assets/hand2.png";
  }
  return cachedHandImg;
}

let offscreenDoodleCanvas: HTMLCanvasElement | null = null;
function getOffscreenCanvas(w: number, h: number): HTMLCanvasElement {
  if (!offscreenDoodleCanvas) {
    offscreenDoodleCanvas = document.createElement("canvas");
  }
  if (offscreenDoodleCanvas.width !== w || offscreenDoodleCanvas.height !== h) {
    offscreenDoodleCanvas.width = w;
    offscreenDoodleCanvas.height = h;
  }
  return offscreenDoodleCanvas;
}

/**
 * Renders Whiteboard / Paper background textures for Doodle mode with auto-color matching
 */
function renderPaperBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  style: "auto" | "whiteboard" | "paper" | "chalkboard" = "auto",
  detectedBg?: DetectedBgColor
) {
  ctx.save();
  const fillX = -width * 2;
  const fillY = -height * 2;
  const fillW = width * 5;
  const fillH = height * 5;

  if (style === "chalkboard") {
    // Pure AMOLED Deep Black (#000000) for seamless dark canvas blending
    ctx.fillStyle = "#000000";
    ctx.fillRect(fillX, fillY, fillW, fillH);
  } else if (style === "paper") {
    // Vintage sketch parchment
    ctx.fillStyle = "#f5f0e6";
    ctx.fillRect(fillX, fillY, fillW, fillH);
    const rad = ctx.createRadialGradient(
      width / 2,
      height / 2,
      width * 0.3,
      width / 2,
      height / 2,
      width * 0.8
    );
    rad.addColorStop(0, "rgba(255, 255, 255, 0)");
    rad.addColorStop(1, "rgba(180, 150, 110, 0.25)");
    ctx.fillStyle = rad;
    ctx.fillRect(fillX, fillY, fillW, fillH);
  } else {
    // "auto" or "whiteboard": Pure flat canvas background matching
    const isAuto = style === "auto";
    const hasImageBg = detectedBg && !detectedBg.isTransparent;
    const bgColorHex =
      isAuto && hasImageBg
        ? detectedBg.hex
        : style === "whiteboard"
        ? "#EAEAEA"
        : hasImageBg
        ? detectedBg.hex
        : "#EAEAEA";

    ctx.fillStyle = bgColorHex;
    ctx.fillRect(fillX, fillY, fillW, fillH);
  }
  ctx.restore();
}

/**
 * Renders progressive hand-drawn whiteboard doodle animation with point-to-point edge contour tracing
 */
function renderDoodleClip({
  ctx,
  clip,
  clipProgress,
  canvasWidth,
  canvasHeight,
  drawDurationRatio,
  paperStyle = "auto",
  enableDoodleZoom = false,
  currentTimeSec = 0,
}: {
  ctx: CanvasRenderingContext2D;
  clip: TimelineClip;
  clipProgress: number;
  canvasWidth: number;
  canvasHeight: number;
  drawDurationRatio?: number;
  paperStyle?: "auto" | "whiteboard" | "paper" | "chalkboard";
  enableDoodleZoom?: boolean;
  currentTimeSec: number;
}) {
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

  // Fit image proportionally within the canvas
  const paddingRatio = 0.90;
  const scaleRatio = Math.min(
    (canvasWidth * paddingRatio) / srcWidth,
    (canvasHeight * paddingRatio) / srcHeight
  );
  const targetW = srcWidth * scaleRatio;
  const targetH = srcHeight * scaleRatio;
  const imgX = (canvasWidth - targetW) / 2;
  const imgY = (canvasHeight - targetH) / 2;

  // Dynamically compute optimal drawing speed from clip duration:
  // Short clips (e.g. 2-5s) draw fast; long clips (10s - 60s+) always complete drawing in max 10-12s
  const clipDur = Math.max(0.5, clip.durationSec || 5);
  const maxDrawDurationSec = Math.min(11.0, clipDur * 0.82);
  const effectiveDrawRatio =
    drawDurationRatio !== undefined &&
    drawDurationRatio > 0.3 &&
    drawDurationRatio !== 0.75
      ? drawDurationRatio
      : maxDrawDurationSec / clipDur;
  const safeDrawRatio = Math.max(0.05, Math.min(0.95, effectiveDrawRatio));

  // Organic artist acceleration curve: starts at a deliberate, human speed
  // and smoothly accelerates through intricate details to finish 100% of the sketch
  const rawT = Math.max(0, Math.min(1, clipProgress / safeDrawRatio));
  const drawProgress = Math.max(
    0,
    Math.min(1, 0.38 * rawT + 0.62 * Math.pow(rawT, 1.4))
  );

  // Extract / retrieve cached vector contours with auto background color
  const vectorData = getOrExtractDoodleVectorData(mediaSource);
  const {
    tipXNorm,
    tipYNorm,
    completedStrokes,
    strokeProgress,
  } = evaluateDoodlePositionAtProgress(vectorData, drawProgress);

  const baseTipX = imgX + tipXNorm * targetW;
  const baseTipY = imgY + tipYNorm * targetH;

  // Realistic marker scribbling micro-jitter (applied only to the pen tip, not the camera)
  const isActivelyDrawing = drawProgress < 1.0;
  const jitterX = isActivelyDrawing
    ? Math.sin(currentTimeSec * 45) * (canvasWidth * 0.0035) +
      Math.cos(currentTimeSec * 29) * (canvasWidth * 0.002)
    : 0;
  const jitterY = isActivelyDrawing
    ? Math.cos(currentTimeSec * 48) * (canvasHeight * 0.0035) +
      Math.sin(currentTimeSec * 31) * (canvasHeight * 0.002)
    : 0;

  const markerTipX = Math.max(0, Math.min(canvasWidth, baseTipX + jitterX));
  const markerTipY = Math.max(0, Math.min(canvasHeight, baseTipY + jitterY));

  ctx.save();

  // Dynamic Camera Focus Zoom & Smooth Tracking of Active Hand Drawing Area
  if (enableDoodleZoom) {
    // 1. Mild, cinematic zoom (+12% zoom) following a smooth continuous bell curve
    const zoomBell = Math.sin(Math.max(0, Math.min(1, rawT)) * Math.PI);
    const zoomScale = 1.0 + 0.12 * easeInOutQuad(zoomBell);

    // 2. Smoothly track the drawing area from the initial starting strokes to the ending strokes
    // Uses pre-computed macroscopic stroke centroids (100% immune to stroke-to-stroke pen jumping & jitter)
    const startX =
      imgX +
      (vectorData.startCentroidXNorm ?? vectorData.centroidXNorm ?? 0.5) *
        targetW;
    const startY =
      imgY +
      (vectorData.startCentroidYNorm ?? vectorData.centroidYNorm ?? 0.5) *
        targetH;
    const endX =
      imgX +
      (vectorData.endCentroidXNorm ?? vectorData.centroidXNorm ?? 0.5) * targetW;
    const endY =
      imgY +
      (vectorData.endCentroidYNorm ?? vectorData.centroidYNorm ?? 0.5) * targetH;

    // Smoothly glide the focus point across the drawing sequence
    const focusX = startX + (endX - startX) * drawProgress;
    const focusY = startY + (endY - startY) * drawProgress;

    const maxPanX = (canvasWidth * (zoomScale - 1)) / (2 * zoomScale);
    const maxPanY = (canvasHeight * (zoomScale - 1)) / (2 * zoomScale);

    const desiredOffsetX = focusX - canvasWidth / 2;
    const desiredOffsetY = focusY - canvasHeight / 2;

    const trackPanX =
      Math.max(-maxPanX, Math.min(maxPanX, desiredOffsetX * 0.75)) * zoomBell;
    const trackPanY =
      Math.max(-maxPanY, Math.min(maxPanY, desiredOffsetY * 0.75)) * zoomBell;

    const camX = canvasWidth / 2 + trackPanX;
    const camY = canvasHeight / 2 + trackPanY;

    ctx.translate(canvasWidth / 2, canvasHeight / 2);
    ctx.scale(zoomScale, zoomScale);
    ctx.translate(-camX, -camY);
  }

  // 1. Draw Paper / Whiteboard Canvas Background with matched image background color
  renderPaperBackground(
    ctx,
    canvasWidth,
    canvasHeight,
    paperStyle,
    vectorData.detectedBgColor
  );

  // 2. Progressive Stroke-by-Stroke Line-Art Masking
  try {
    const offscreen = getOffscreenCanvas(canvasWidth, canvasHeight);
    const offCtx = offscreen.getContext("2d");
    if (offCtx) {
      offCtx.clearRect(0, 0, canvasWidth, canvasHeight);
      offCtx.save();

      if (drawProgress >= 1.0) {
        // 100% Revealed
        offCtx.fillStyle = "#ffffff";
        offCtx.fillRect(0, 0, canvasWidth, canvasHeight);
      } else {
        const strokeLineWidth = Math.max(16, targetW * 0.032);
        offCtx.strokeStyle = "#ffffff";
        offCtx.fillStyle = "#ffffff";
        offCtx.lineWidth = strokeLineWidth;
        offCtx.lineCap = "round";
        offCtx.lineJoin = "round";

        const strokes = vectorData.strokes;

        // Draw all completed strokes
        for (let s = 0; s < completedStrokes && s < strokes.length; s++) {
          const pts = strokes[s].points;
          if (pts.length >= 2) {
            offCtx.beginPath();
            offCtx.moveTo(imgX + pts[0].x * targetW, imgY + pts[0].y * targetH);
            for (let p = 1; p < pts.length; p++) {
              offCtx.lineTo(
                imgX + pts[p].x * targetW,
                imgY + pts[p].y * targetH
              );
            }
            offCtx.stroke();
          }
        }

        // Draw active stroke up to current needle point
        if (completedStrokes < strokes.length) {
          const activePts = strokes[completedStrokes].points;
          if (activePts.length >= 2) {
            offCtx.beginPath();
            offCtx.moveTo(
              imgX + activePts[0].x * targetW,
              imgY + activePts[0].y * targetH
            );
            const numPtsToDraw = Math.max(
              1,
              Math.floor(strokeProgress * (activePts.length - 1))
            );
            for (let p = 1; p <= numPtsToDraw; p++) {
              offCtx.lineTo(
                imgX + activePts[p].x * targetW,
                imgY + activePts[p].y * targetH
              );
            }
            offCtx.lineTo(baseTipX, baseTipY);
            offCtx.stroke();
          }
        }

        // Scribble circle cap directly at marker tip
        offCtx.beginPath();
        offCtx.arc(markerTipX, markerTipY, strokeLineWidth * 1.25, 0, Math.PI * 2);
        offCtx.fill();
      }

      // Composite sketch image through reveal mask
      offCtx.globalCompositeOperation = "source-in";
      const isDarkChalkboard =
        paperStyle === "chalkboard" ||
        (paperStyle === "auto" && vectorData.detectedBgColor.isDark);

      if (isDarkChalkboard) {
        if (vectorData.detectedBgColor.isDark) {
          // Source image already has dark/black background: enhance contrast to pure AMOLED black & crisp white
          offCtx.filter = "grayscale(100%) contrast(200%) brightness(115%)";
          offCtx.drawImage(mediaSource, imgX, imgY, targetW, targetH);
          offCtx.restore();
          ctx.drawImage(offscreen, 0, 0);
        } else {
          // Source image has light/white background: invert to dark chalkboard with chalk white strokes
          offCtx.filter =
            "grayscale(100%) invert(100%) contrast(180%) brightness(120%)";
          offCtx.drawImage(mediaSource, imgX, imgY, targetW, targetH);
          offCtx.restore();
          ctx.drawImage(offscreen, 0, 0);
        }
      } else {
        // High-contrast ink extraction + Multiply compositing:
        // Pushes any white/light paper background to pure white #FFFFFF
        // and sharpens marker ink to pure #000000
        offCtx.filter = "grayscale(100%) contrast(220%) brightness(105%)";
        offCtx.drawImage(mediaSource, imgX, imgY, targetW, targetH);
        offCtx.restore();

        // In multiply blend mode, pure white (#FFFFFF) becomes 100% transparent on #EAEAEA,
        // drawing ONLY the black marker lines directly onto the #EAEAEA canvas!
        ctx.save();
        ctx.globalCompositeOperation = "multiply";
        ctx.drawImage(offscreen, 0, 0);
        ctx.restore();
      }
    }
  } catch {}

  // 3. Render Hand with Marker Pen pinned at (markerTipX, markerTipY)
  const handImg = getCachedHandImage();
  if (handImg && handImg.complete && handImg.naturalWidth > 0) {
    const handScale = (canvasWidth * 0.70) / handImg.naturalWidth;
    const handW = handImg.naturalWidth * handScale;
    const handH = handImg.naturalHeight * handScale;

    // Calibrated EXPO Marker Tip Anchor for updated hand image (1024x1536 Portrait)
    const TIP_X_RATIO = 0.0713;
    const TIP_Y_RATIO = 0.1732;

    let handX = markerTipX - TIP_X_RATIO * handW;
    let handY = markerTipY - TIP_Y_RATIO * handH;

    // Slide hand off-screen in a clean ~0.65s window when drawing is finished
    let shouldDrawHand = true;
    if (drawProgress >= 1.0) {
      const elapsedAfterDrawSec = (clipProgress - safeDrawRatio) * clipDur;
      const exitProgress = Math.min(
        1,
        Math.max(0, elapsedAfterDrawSec / 0.65)
      );
      const slideDist = easeInOutQuad(exitProgress) * canvasHeight * 1.5;
      handX += slideDist * 0.65;
      handY += slideDist * 1.15;
      if (exitProgress >= 1.0) {
        shouldDrawHand = false;
      }
    }

    if (shouldDrawHand) {
      ctx.save();
      // Natural soft hand shadow for depth
      ctx.shadowColor = "rgba(0, 0, 0, 0.22)";
      ctx.shadowBlur = Math.round(16 * (canvasWidth / 1920));
      ctx.shadowOffsetX = Math.round(12 * (canvasWidth / 1920));
      ctx.shadowOffsetY = Math.round(14 * (canvasWidth / 1920));
      ctx.drawImage(handImg, handX, handY, handW, handH);
      ctx.restore();
    }
  }

  ctx.restore();
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
  alpha: number = 1.0,
  filterStr: string = "none",
  enableVintageFilmReel: boolean = false,
  currentTimeSec: number = 0
) {
  if (alpha <= 0.001) return;
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  if (filterStr && filterStr !== "none") {
    ctx.filter = filterStr;
  }

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

  const scaleRatio = Math.max(canvasWidth / srcWidth, canvasHeight / srcHeight);
  const baseWidth = srcWidth * scaleRatio;
  const baseHeight = srcHeight * scaleRatio;

  let scaleMultiplier = 1.0;
  let offsetX = 0;
  let offsetY = 0;
  const easeProgress = easeInOutQuad(progress);

  // 1. Subtle & Cinematic Ken Burns Motion
  switch (clip.motion) {
    case "ken-burns-zoom-in":
      scaleMultiplier = 1.0 + 0.12 * easeProgress;
      break;
    case "ken-burns-zoom-out":
      scaleMultiplier = 1.12 - 0.12 * easeProgress;
      break;
    case "pan-left":
      scaleMultiplier = 1.08;
      offsetX = canvasWidth * 0.05 * (1 - easeProgress * 2);
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
      if (enableVintageFilmReel) {
        // Automatic subtle Ken Burns push-in for vintage reel
        scaleMultiplier = 1.0 + 0.065 * easeProgress;
      } else {
        scaleMultiplier = 1.0;
      }
      break;
  }

  // 2. Film Gate Weave / Subtle Projector Jitter (Gentle vintage organic mechanical instability)
  let weaveX = 0;
  let weaveY = 0;
  if (enableVintageFilmReel) {
    const frameId = Math.floor(currentTimeSec * 24);
    // Slight 2.5% overscan padding to prevent any edge reveal during sub-pixel weave
    scaleMultiplier *= 1.025;

    // Organic mechanical film reel drift (low frequency) + frame registration flutter (high frequency)
    const scaleFactor = canvasWidth / 1920;
    weaveX =
      (Math.sin(currentTimeSec * 5.8) * 1.6 +
       Math.cos(currentTimeSec * 11.3) * 0.9 +
       ((Math.sin(frameId * 17.31) * 1000) % 1.4 - 0.7)) * scaleFactor;
    weaveY =
      (Math.cos(currentTimeSec * 4.6) * 1.3 +
       Math.sin(currentTimeSec * 9.1) * 0.8 +
       ((Math.cos(frameId * 23.47) * 1000) % 1.2 - 0.6)) * scaleFactor;
  }

  const finalWidth = baseWidth * scaleMultiplier;
  const finalHeight = baseHeight * scaleMultiplier;
  const drawX = (canvasWidth - finalWidth) / 2 + offsetX + weaveX;
  const drawY = (canvasHeight - finalHeight) / 2 + offsetY + weaveY;

  ctx.drawImage(mediaSource, drawX, drawY, finalWidth, finalHeight);
}

/**
 * 0. Vintage Archival Film Reel Overlay (1-Click Master Film FX)
 * Authentic 16mm/35mm Film Grain + Projector Bulb Shutter Exposure Flicker + Faint Vertical Scratches + Dust Particles + Soft Archival Vignette
 */
function renderVintageFilmReelOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  timeSec: number
) {
  ctx.save();
  const frameId = Math.floor(timeSec * 24);

  // 1. Projector Lamp Shutter Exposure Flicker (Authentic organic luminance pulse)
  const lampFlicker =
    0.032 +
    Math.sin(timeSec * 29.5) * 0.022 +
    Math.sin(frameId * 11.7) * 0.012;
  ctx.fillStyle = `rgba(255, 240, 210, ${Math.max(0.01, lampFlicker)})`;
  ctx.fillRect(0, 0, width, height);

  // 2. Fine Dynamic 16mm Film Grain (Realistic density)
  ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
  const grainCount = 360;
  for (let i = 0; i < grainCount; i++) {
    const gx =
      ((Math.sin(frameId * 19.31 + i * 83.17) * 43758.5453) % 1) * width;
    const gy =
      ((Math.cos(frameId * 37.19 + i * 51.43) * 23421.6312) % 1) * height;
    ctx.fillRect(Math.abs(gx), Math.abs(gy), 1.8, 1.8);
  }

  // Dynamic Soft Dark Grain Specks
  ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
  for (let i = 0; i < 200; i++) {
    const gx =
      ((Math.sin(frameId * 59.23 + i * 31.79) * 12345.6789) % 1) * width;
    const gy =
      ((Math.cos(frameId * 23.41 + i * 71.67) * 98765.4321) % 1) * height;
    ctx.fillRect(Math.abs(gx), Math.abs(gy), 1.4, 1.4);
  }

  // 3. Faint Vertical Hair & Film Scratches (Subtle and occasional)
  if (frameId % 3 === 0) {
    const scratchX = (Math.abs(Math.sin(frameId * 89.7)) * width) % width;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(scratchX, 0);
    ctx.lineTo(scratchX + (Math.sin(frameId * 2) - 0.5) * 5, height);
    ctx.stroke();
  }

  if (frameId % 5 === 0) {
    const scratchDarkX = (Math.abs(Math.cos(frameId * 53.3)) * width) % width;
    ctx.strokeStyle = "rgba(0, 0, 0, 0.28)";
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(scratchDarkX, 0);
    ctx.lineTo(scratchDarkX + (Math.cos(frameId * 3) - 0.5) * 3, height);
    ctx.stroke();
  }

  // 4. Projector Floating Dust Motes & Specks
  const dustCount = 28;
  for (let i = 0; i < dustCount; i++) {
    const seed = i * 43.19;
    const speed = 0.18 + (i % 5) * 0.07;
    const px = ((Math.sin(seed + timeSec * speed) * 0.5 + 0.5) * width) % width;
    const py =
      ((Math.cos(seed * 1.5 + timeSec * speed * 0.8) * 0.5 + 0.5) * height) %
      height;
    const size = 1.2 + (i % 4) * 1.6;
    const opacity = 0.16 + Math.sin(timeSec * 2.2 + i) * 0.1;

    ctx.fillStyle = `rgba(255, 235, 175, ${opacity})`;
    ctx.beginPath();
    ctx.arc(px, py, size, 0, Math.PI * 2);
    ctx.fill();
  }

  // 5. Soft Archival Edge Vignette
  const vignette = ctx.createRadialGradient(
    width / 2,
    height / 2,
    Math.min(width, height) * 0.35,
    width / 2,
    height / 2,
    Math.max(width, height) * 0.72
  );
  vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
  vignette.addColorStop(0.65, "rgba(18, 12, 8, 0.18)");
  vignette.addColorStop(1, "rgba(5, 3, 2, 0.65)");

  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);

  ctx.restore();
}

/**
 * 1. Old Film Grain & Vintage Dust / Scratches
 */
function renderFilmGrain(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  timeSec: number
) {
  ctx.save();
  const frameId = Math.floor(timeSec * 24);

  // Dynamic High-Density Film Grain Noise
  ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
  const grainCount = 350;
  for (let i = 0; i < grainCount; i++) {
    const gx =
      ((Math.sin(frameId * 17.13 + i * 93.71) * 43758.5453) % 1) * width;
    const gy =
      ((Math.cos(frameId * 31.37 + i * 47.93) * 23421.6312) % 1) * height;
    ctx.fillRect(Math.abs(gx), Math.abs(gy), 2, 2);
  }

  // Dynamic Dark Grain
  ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
  for (let i = 0; i < 200; i++) {
    const gx =
      ((Math.sin(frameId * 53.11 + i * 29.17) * 12345.6789) % 1) * width;
    const gy =
      ((Math.cos(frameId * 19.87 + i * 67.23) * 98765.4321) % 1) * height;
    ctx.fillRect(Math.abs(gx), Math.abs(gy), 1.5, 1.5);
  }

  // Vintage Vertical Hair / Scratch Lines
  if (frameId % 2 === 0) {
    const scratchX = (Math.abs(Math.sin(frameId * 103.7)) * width) % width;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.28)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(scratchX, 0);
    ctx.lineTo(scratchX + (Math.sin(frameId) - 0.5) * 8, height);
    ctx.stroke();
  }

  if (frameId % 5 === 0) {
    const scratch2X = (Math.abs(Math.cos(frameId * 77.3)) * width) % width;
    ctx.strokeStyle = "rgba(0, 0, 0, 0.35)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(scratch2X, 0);
    ctx.lineTo(scratch2X + 4, height);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * 2. Old Cinema Projector Particles & Beam Flicker
 */
function renderOldCinema(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  timeSec: number
) {
  ctx.save();
  const frameId = Math.floor(timeSec * 24);

  // 1920s Projector Beam Light Flicker Pulse
  const flicker = 0.04 + Math.sin(timeSec * 36) * 0.03 + (Math.random() - 0.5) * 0.02;
  ctx.fillStyle = `rgba(255, 245, 220, ${flicker})`;
  ctx.fillRect(0, 0, width, height);

  // Projector Dust Motes & Film Particles
  const particleCount = 45;
  for (let i = 0; i < particleCount; i++) {
    const seed = i * 43.17;
    const speed = 0.2 + (i % 6) * 0.1;
    const px = ((Math.sin(seed + timeSec * speed) * 0.5 + 0.5) * width) % width;
    const py =
      ((Math.cos(seed * 1.7 + timeSec * speed * 0.9) * 0.5 + 0.5) * height) %
      height;
    const size = 1.5 + (i % 5) * 2;
    const opacity = 0.2 + Math.sin(timeSec * 3 + i) * 0.15;

    ctx.fillStyle = `rgba(255, 230, 160, ${opacity})`;
    ctx.beginPath();
    ctx.arc(px, py, size, 0, Math.PI * 2);
    ctx.fill();
  }

  // Film Sprocket Border Vibration
  ctx.fillStyle = "rgba(120, 90, 40, 0.06)";
  ctx.fillRect(0, 0, width, height);

  ctx.restore();
}

/**
 * 3. Modern Geometric Tech Grid & HUD Viewfinder
 */
function renderGeometricGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  timeSec: number
) {
  ctx.save();
  const pad = Math.round(width * 0.04);
  const bracketLen = Math.round(width * 0.05);

  ctx.strokeStyle = "rgba(99, 102, 241, 0.75)";
  ctx.lineWidth = 2.5;

  // 4 Corner HUD Framing Brackets
  // Top-Left ┌
  ctx.beginPath();
  ctx.moveTo(pad, pad + bracketLen);
  ctx.lineTo(pad, pad);
  ctx.lineTo(pad + bracketLen, pad);
  ctx.stroke();

  // Top-Right ┐
  ctx.beginPath();
  ctx.moveTo(width - pad - bracketLen, pad);
  ctx.lineTo(width - pad, pad);
  ctx.lineTo(width - pad, pad + bracketLen);
  ctx.stroke();

  // Bottom-Left └
  ctx.beginPath();
  ctx.moveTo(pad, height - pad - bracketLen);
  ctx.lineTo(pad, height - pad);
  ctx.lineTo(pad + bracketLen, height - pad);
  ctx.stroke();

  // Bottom-Right ┘
  ctx.beginPath();
  ctx.moveTo(width - pad - bracketLen, height - pad);
  ctx.lineTo(width - pad, height - pad);
  ctx.lineTo(width - pad, height - pad - bracketLen);
  ctx.stroke();

  // Center Viewfinder Circular Reticle ◎
  const cx = width / 2;
  const cy = height / 2;
  const reticleRadius = Math.round(width * 0.035);

  ctx.strokeStyle = "rgba(56, 189, 248, 0.65)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, reticleRadius, 0, Math.PI * 2);
  ctx.stroke();

  // Crosshairs +
  const crossSize = reticleRadius * 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - crossSize, cy);
  ctx.lineTo(cx - reticleRadius * 0.4, cy);
  ctx.moveTo(cx + reticleRadius * 0.4, cy);
  ctx.lineTo(cx + crossSize, cy);
  ctx.moveTo(cx, cy - crossSize);
  ctx.lineTo(cx, cy - reticleRadius * 0.4);
  ctx.moveTo(cx, cy + reticleRadius * 0.4);
  ctx.lineTo(cx, cy + crossSize);
  ctx.stroke();

  // Rule of thirds technical grid lines
  ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(width / 3, 0);
  ctx.lineTo(width / 3, height);
  ctx.moveTo((width * 2) / 3, 0);
  ctx.lineTo((width * 2) / 3, height);
  ctx.moveTo(0, height / 3);
  ctx.lineTo(width, height / 3);
  ctx.moveTo(0, (height * 2) / 3);
  ctx.lineTo(width, (height * 2) / 3);
  ctx.stroke();

  // HUD Tech Coordinates
  ctx.fillStyle = "rgba(129, 140, 248, 0.9)";
  ctx.font = "bold 11px monospace";
  ctx.fillText(
    `[GEO-GRID 60FPS]  TC:${timeSec.toFixed(2)}s  FOCAL:AUTO`,
    pad + 8,
    pad + 18
  );

  ctx.restore();
}

/**
 * 4. VHS Retro Glitch & CRT Scanlines
 */
function renderVhsScanlines(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  timeSec: number
) {
  ctx.save();

  // Horizontal CRT scanlines
  ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
  for (let y = 0; y < height; y += 4) {
    ctx.fillRect(0, y, width, 1.8);
  }

  // Bottom Tracking Jitter Band
  const trackingY = ((timeSec * 70) % height) * 0.95;
  ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
  ctx.fillRect(0, trackingY, width, 18);

  // Retro REC OSD Text
  const isBlinkOn = Math.floor(timeSec * 2) % 2 === 0;
  if (isBlinkOn) {
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.arc(45, 45, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 13px 'Courier New', monospace";
    ctx.fillText("REC", 60, 49);
  }

  ctx.fillStyle = "#e2e8f0";
  ctx.font = "bold 12px 'Courier New', monospace";
  ctx.fillText("PLAY ▶  SP", width - 120, 48);

  ctx.restore();
}

/**
 * 5. Cinemascope 2.39:1 Letterbox Black Bars
 */
function renderLetterbox(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  ctx.save();
  const barHeight = Math.round(height * 0.12);
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, width, barHeight);
  ctx.fillRect(0, height - barHeight, width, barHeight);
  ctx.restore();
}

/**
 * 6. Prism / Dreamy Optical Glow
 */
function renderPrismGlow(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  timeSec: number
) {
  ctx.save();
  ctx.globalCompositeOperation = "screen";

  const glowX = width * (0.3 + Math.sin(timeSec * 0.5) * 0.2);
  const glowY = height * (0.3 + Math.cos(timeSec * 0.4) * 0.2);

  const prismGrad = ctx.createRadialGradient(
    glowX,
    glowY,
    10,
    glowX,
    glowY,
    width * 0.7
  );
  prismGrad.addColorStop(0, "rgba(255, 220, 180, 0.4)");
  prismGrad.addColorStop(0.5, "rgba(180, 100, 255, 0.2)");
  prismGrad.addColorStop(1, "rgba(0, 0, 0, 0)");

  ctx.fillStyle = prismGrad;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

/**
 * 7. Ambient Dark Vignette
 */
function renderAmbientVignette(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  ctx.save();
  const radial = ctx.createRadialGradient(
    width / 2,
    height / 2,
    width * 0.2,
    width / 2,
    height / 2,
    width * 0.75
  );
  radial.addColorStop(0, "rgba(0, 0, 0, 0)");
  radial.addColorStop(0.65, "rgba(0, 0, 0, 0.35)");
  radial.addColorStop(1, "rgba(0, 0, 0, 0.85)");
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

/**
 * 8. Glowing Floating Particles
 */
function renderFloatingParticles(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  timeSec: number
) {
  ctx.save();
  const particleCount = 28;

  for (let i = 0; i < particleCount; i++) {
    const seed = i * 137.5;
    const speed = 0.25 + (i % 5) * 0.15;
    const x = ((Math.sin(seed + timeSec * speed) * 0.5 + 0.5) * width) % width;
    const y =
      ((Math.cos(seed * 1.3 + timeSec * speed * 0.8) * 0.5 + 0.5) * height) %
      height;
    const size = 2 + (i % 4) * 2.5;
    const opacity = 0.22 + Math.sin(timeSec * 2 + i) * 0.15;

    ctx.fillStyle =
      i % 2 === 0
        ? `rgba(251, 191, 36, ${opacity})`
        : `rgba(244, 114, 182, ${opacity})`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Helper to safely draw rounded rectangles on canvas across all browser engines
 */
function drawSafeRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  if (w <= 0 || h <= 0) return;
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") {
    try {
      ctx.roundRect(x, y, w, h, radius);
      ctx.fill();
      return;
    } catch {}
  }
  // Fallback arc-based rounded rectangle
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.arcTo(x + w, y, x + w, y + radius, radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.arcTo(x + w, y + h, x + w - radius, y + h, radius);
  ctx.lineTo(x + radius, y + h);
  ctx.arcTo(x, y + h, x, y + h - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
  ctx.fill();
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
  if (!subtitles || !Array.isArray(subtitles) || subtitles.length === 0) return;

  const activeCue = subtitles.find(
    (s) =>
      currentTimeSec >= s.startSec - 0.05 && currentTimeSec <= s.endSec + 0.05
  );
  if (!activeCue || !activeCue.text || !activeCue.text.trim()) return;

  ctx.save();

  // Reset any lingering canvas context filters or blend modes
  ctx.globalAlpha = 1.0;
  ctx.filter = "none";
  ctx.globalCompositeOperation = "source-over";
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // Responsive scale based on aspect ratio & resolution
  const scale = width < height ? height / 1920 : width / 1920;
  const effectiveScale = Math.max(0.65, Math.min(2.5, scale));
  const rawFontSize = style?.fontSize || 34;
  const scaledFontSize = Math.max(20, Math.round(rawFontSize * effectiveScale));

  const cleanFont = (style?.fontFamily || "Poppins")
    .replace(/['"]/g, "")
    .trim();
  ctx.font = `bold ${scaledFontSize}px "${cleanFont}", Inter, system-ui, -apple-system, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const lines = wrapText(ctx, activeCue.text, width * 0.86);
  const lineHeight = scaledFontSize * 1.38;

  let startY = height * 0.82;
  if (style?.position === "top") {
    startY = height * 0.15;
  } else if (style?.position === "center") {
    startY = height * 0.5;
  } else if (style?.yOffsetPercent !== undefined) {
    startY = height * (style.yOffsetPercent / 100);
  }

  lines.forEach((line, index) => {
    const y = startY + (index - (lines.length - 1) / 2) * lineHeight;

    if (style?.showBackground !== false) {
      const textMetrics = ctx.measureText(line);
      const paddingX = Math.round(scaledFontSize * 0.48);
      const paddingY = Math.round(scaledFontSize * 0.26);
      const radius = Math.round(8 * effectiveScale);

      ctx.fillStyle = style?.bgColor || "rgba(0, 0, 0, 0.78)";
      drawSafeRoundedRect(
        ctx,
        width / 2 - textMetrics.width / 2 - paddingX,
        y - lineHeight / 2 + paddingY / 2,
        textMetrics.width + paddingX * 2,
        lineHeight - paddingY,
        radius
      );
    }

    const strokeWidth = style?.strokeWidth ?? 4;
    if (strokeWidth > 0) {
      ctx.strokeStyle = style?.strokeColor || "#000000";
      ctx.lineWidth = Math.max(2, strokeWidth * effectiveScale * 1.5);
      ctx.lineJoin = "round";
      ctx.miterLimit = 2;
      ctx.strokeText(line, width / 2, y);
    }

    ctx.fillStyle = style?.color || "#ffffff";
    ctx.fillText(line, width / 2, y);
  });

  ctx.restore();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  if (!text) return [];
  const paragraphs = text.split(/\r?\n/);
  const resultLines: string[] = [];

  for (const para of paragraphs) {
    const trimmedPara = para.trim();
    if (!trimmedPara) continue;
    const words = trimmedPara.split(/\s+/);
    let currentLine = "";

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && currentLine) {
        resultLines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) resultLines.push(currentLine);
  }
  return resultLines.length > 0 ? resultLines : [text];
}

function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}
