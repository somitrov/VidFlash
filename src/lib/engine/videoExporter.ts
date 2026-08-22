import {
  TimelineClip,
  SubtitleCue,
  SubtitleStyleConfig,
  ExportConfig,
  AudioTrackState,
} from "@/types/autoeditor";
import { renderCompositorFrame } from "./canvasCompositor";

/**
 * Client-Side Video Rendering & Export Engine
 * Runs 100% locally in browser memory without sending media to external servers.
 */

export async function exportVideoClientSide({
  clips,
  audioTrack,
  subtitles,
  subtitleStyle,
  config,
  onProgress,
}: {
  clips: TimelineClip[];
  audioTrack: AudioTrackState | null;
  subtitles: SubtitleCue[];
  subtitleStyle: SubtitleStyleConfig;
  config: ExportConfig;
  onProgress: (percent: number, currentSec: number) => void;
}): Promise<Blob> {
  const width = config.resolution.width;
  const height = config.resolution.height;
  const fps = config.fps || 30;

  const totalDuration = audioTrack
    ? audioTrack.durationSec
    : clips.length > 0
    ? Math.max(...clips.map((c) => c.endSec))
    : 5;

  const offscreenCanvas = document.createElement("canvas");
  offscreenCanvas.width = width;
  offscreenCanvas.height = height;
  const ctx = offscreenCanvas.getContext("2d", { alpha: false });

  if (!ctx) throw new Error("Could not initialize 2D render context.");

  // Prepare Audio Stream via WebAudio
  const audioContext = new (window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext)();
  const audioDest = audioContext.createMediaStreamDestination();

  let audioSource: AudioBufferSourceNode | null = null;
  if (audioTrack && audioTrack.audioBuffer) {
    audioSource = audioContext.createBufferSource();
    audioSource.buffer = audioTrack.audioBuffer;
    audioSource.connect(audioDest);
  }

  // Combine Canvas Video Stream & Audio Stream
  const canvasStream = offscreenCanvas.captureStream(fps);
  const combinedStream = new MediaStream();

  canvasStream.getVideoTracks().forEach((t) => combinedStream.addTrack(t));
  if (audioTrack && audioDest.stream.getAudioTracks().length > 0) {
    audioDest.stream
      .getAudioTracks()
      .forEach((t) => combinedStream.addTrack(t));
  }

  // Select optimal supported mime type
  const mimeType = MediaRecorder.isTypeSupported("video/mp4;codecs=avc1")
    ? "video/mp4;codecs=avc1"
    : MediaRecorder.isTypeSupported("video/mp4")
    ? "video/mp4"
    : MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
    ? "video/webm;codecs=vp9,opus"
    : "video/webm";

  const recorder = new MediaRecorder(combinedStream, {
    mimeType,
    videoBitsPerSecond: 10_000_000, // 10 Mbps crisp quality
  });

  const recordedChunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      recordedChunks.push(e.data);
    }
  };

  return new Promise<Blob>((resolve, reject) => {
    recorder.onstop = () => {
      if (audioContext.state !== "closed") audioContext.close();
      const outputBlob = new Blob(recordedChunks, { type: mimeType });
      resolve(outputBlob);
    };

    recorder.onerror = (err) => {
      if (audioContext.state !== "closed") audioContext.close();
      reject(err);
    };

    recorder.start();
    if (audioSource) {
      audioSource.start(0);
    }

    const frameDurationSec = 1 / fps;
    let currentSec = 0;

    const renderStep = () => {
      if (currentSec >= totalDuration) {
        recorder.stop();
        return;
      }

      renderCompositorFrame({
        ctx,
        width,
        height,
        currentTimeSec: currentSec,
        totalDurationSec: totalDuration,
        clips,
        subtitles,
        subtitleStyle,
        fadeInSec: config.fadeInSec ?? 0.5,
        fadeOutSec: config.fadeOutSec ?? 0.6,
        enableParticles: config.enableParticles ?? false,
        enableGlow: config.enableGlow ?? false,
      });

      currentSec += frameDurationSec;
      const progressPercent = Math.min(
        100,
        Math.round((currentSec / totalDuration) * 100)
      );
      onProgress(progressPercent, currentSec);

      setTimeout(renderStep, 1000 / fps);
    };

    renderStep();
  });
}
