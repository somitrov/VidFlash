import { TimelineClip, MotionEffect, TransitionEffect } from "@/types/autoeditor";
import { parseTimestampFromFilename, sortClipsByTimestamp } from "./timestampParser";

const MOTION_ROTATION: MotionEffect[] = [
  "ken-burns-zoom-in",
  "pan-left",
  "ken-burns-zoom-out",
  "pan-right",
  "pulse",
];

export async function processMediaFilesToClips(
  files: File[]
): Promise<TimelineClip[]> {
  const mediaFiles = files.filter(
    (f) => f.type.startsWith("image/") || f.type.startsWith("video/")
  );

  const clipPromises = mediaFiles.map(async (file, index) => {
    const isVideo = file.type.startsWith("video/");
    const mediaUrl = URL.createObjectURL(file);
    const parsedTs = parseTimestampFromFilename(file.name);

    let naturalWidth = 1920;
    let naturalHeight = 1080;
    let imageEl: HTMLImageElement | null = null;
    let videoEl: HTMLVideoElement | null = null;

    if (!isVideo) {
      imageEl = new Image();
      await new Promise<void>((resolve) => {
        if (!imageEl) return resolve();
        imageEl.onload = () => {
          naturalWidth = imageEl?.naturalWidth || 1920;
          naturalHeight = imageEl?.naturalHeight || 1080;
          resolve();
        };
        imageEl.onerror = () => resolve();
        imageEl.src = mediaUrl;
      });
    } else {
      videoEl = document.createElement("video");
      videoEl.preload = "metadata";
      await new Promise<void>((resolve) => {
        if (!videoEl) return resolve();
        videoEl.onloadedmetadata = () => {
          naturalWidth = videoEl?.videoWidth || 1920;
          naturalHeight = videoEl?.videoHeight || 1080;
          resolve();
        };
        videoEl.onerror = () => resolve();
        videoEl.src = mediaUrl;
      });
    }

    const clip: TimelineClip = {
      id: `clip_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 6)}`,
      file,
      fileName: file.name,
      fileType: isVideo ? "video" : "image",
      mediaUrl,
      imageElement: imageEl,
      videoElement: videoEl,
      naturalWidth,
      naturalHeight,
      startSec: parsedTs !== null ? parsedTs : index * 4,
      endSec: parsedTs !== null ? parsedTs + 4 : (index + 1) * 4,
      durationSec: 4,
      parsedTimestampSec: parsedTs,
      motion: MOTION_ROTATION[index % MOTION_ROTATION.length],
      transition: index === 0 ? "cut" : "crossfade",
      transitionDuration: 0.5,
    };

    return clip;
  });

  const createdClips = await Promise.all(clipPromises);
  return sortClipsByTimestamp(createdClips);
}

/**
 * Builds an autonomous, synchronized timeline based on audio duration and timestamps.
 */
export function buildAutonomousTimeline(
  clips: TimelineClip[],
  totalAudioDurationSec: number
): TimelineClip[] {
  if (clips.length === 0) return [];

  // Strictly sort clips chronologically by timestamp
  const sortedClips = sortClipsByTimestamp(clips);

  const effectiveTotalDuration = Math.max(
    totalAudioDurationSec,
    sortedClips.length * 3
  );

  const builtClips: TimelineClip[] = [];

  for (let i = 0; i < sortedClips.length; i++) {
    const current = sortedClips[i];
    const isFirst = i === 0;
    const isLast = i === sortedClips.length - 1;
    const next = !isLast ? sortedClips[i + 1] : null;

    let start = current.parsedTimestampSec !== null ? current.parsedTimestampSec : 0;
    if (isFirst && start > 0) {
      // First clip anchors from 0.0 to prevent opening black frame
      start = 0;
    } else if (builtClips.length > 0 && start < builtClips[builtClips.length - 1].endSec) {
      // If timestamp falls before previous clip ended, chain smoothly
      start = builtClips[builtClips.length - 1].endSec;
    }

    let end: number;
    if (next && next.parsedTimestampSec !== null && next.parsedTimestampSec > start) {
      end = next.parsedTimestampSec;
    } else if (isLast) {
      end = Math.max(start + 3, effectiveTotalDuration);
    } else {
      // Equal distribution fallback for remaining time
      const remainingTime = Math.max(0, effectiveTotalDuration - start);
      const remainingClips = sortedClips.length - i;
      const avgDuration = Math.max(3, remainingTime / remainingClips);
      end = start + avgDuration;
    }

    builtClips.push({
      ...current,
      startSec: Number(start.toFixed(2)),
      endSec: Number(end.toFixed(2)),
      durationSec: Number((end - start).toFixed(2)),
      motion: MOTION_ROTATION[i % MOTION_ROTATION.length],
      transition: isFirst ? "cut" : "crossfade",
    });
  }

  return builtClips;
}
