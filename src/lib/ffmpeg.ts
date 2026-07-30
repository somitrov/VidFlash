import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

let ffmpegInstance: FFmpeg | null = null;
let currentLogListener: (({ message }: { message: string }) => void) | null = null;
let currentProgressListener: (({ progress, time }: { progress: number; time: number }) => void) | null = null;

export async function getFFmpegInstance(
  onLog?: (message: string) => void,
  onProgress?: (progress: { ratio: number; time: number }) => void
): Promise<FFmpeg> {
  if (!ffmpegInstance) {
    ffmpegInstance = new FFmpeg();
  }

  const ffmpeg = ffmpegInstance;

  // Clear previous listeners to prevent accumulation
  if (currentLogListener) {
    ffmpeg.off("log", currentLogListener);
    currentLogListener = null;
  }
  if (currentProgressListener) {
    ffmpeg.off("progress", currentProgressListener);
    currentProgressListener = null;
  }

  if (onLog) {
    currentLogListener = ({ message }) => {
      onLog(message);
    };
    ffmpeg.on("log", currentLogListener);
  }

  if (onProgress) {
    currentProgressListener = ({ progress, time }) => {
      onProgress({ ratio: Math.min(Math.max(progress, 0), 1), time });
    };
    ffmpeg.on("progress", currentProgressListener);
  }

  if (!ffmpeg.loaded) {
    if (onLog) onLog("Loading FFmpeg WebAssembly core...");
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.wasm`,
        "application/wasm"
      ),
    });
    if (onLog) onLog("FFmpeg WebAssembly core loaded successfully!");
  }

  return ffmpeg;
}

export async function processAudioToVideo({
  mediaFile,
  canvasDataUrl,
  frameSequenceDataUrls,
  duration,
  resolution,
  audioCopyMode = true,
  onLog,
  onProgress,
}: {
  mediaFile: File;
  canvasDataUrl: string;
  frameSequenceDataUrls?: string[];
  duration: number;
  resolution: { width: number; height: number };
  audioCopyMode?: boolean;
  onLog: (msg: string) => void;
  onProgress: (p: number, timeProcessedSec: number) => void;
}): Promise<Blob> {
  const ffmpeg = await getFFmpegInstance(onLog, ({ ratio, time }) => {
    let percent = Math.round(ratio * 100);
    const processedSec = time > 0 ? time / 1000000 : 0;
    if (duration > 0 && processedSec > 0) {
      percent = Math.min(Math.round((processedSec / duration) * 100), 99);
    }
    onProgress(percent, processedSec);
  });

  onLog("Writing 1 FPS animated frames and media file to browser virtual memory...");

  let hasFrameSequence = false;
  if (frameSequenceDataUrls && frameSequenceDataUrls.length > 0) {
    hasFrameSequence = true;
    for (let i = 0; i < frameSequenceDataUrls.length; i++) {
      const res = await fetch(frameSequenceDataUrls[i]);
      const imageBlob = await res.blob();
      const imageBytes = new Uint8Array(await imageBlob.arrayBuffer());
      const numStr = String(i + 1).padStart(2, "0");
      await ffmpeg.writeFile(`frame_${numStr}.png`, imageBytes);
    }
  } else {
    // Write Single Banner Frame
    const res = await fetch(canvasDataUrl);
    const imageBlob = await res.blob();
    const imageBytes = new Uint8Array(await imageBlob.arrayBuffer());
    await ffmpeg.writeFile("banner.png", imageBytes);
  }

  // Write Media File to Virtual FS
  const fileExt = mediaFile.name.split(".").pop()?.toLowerCase() || "mp3";
  const mediaInputName = `input_media.${fileExt}`;
  const mediaData = await fetchFile(mediaFile);
  await ffmpeg.writeFile(mediaInputName, mediaData);

  // Ensure resolution width and height are even integers (required for H.264 yuv420p)
  const targetWidth = Math.floor(resolution.width / 2) * 2;
  const targetHeight = Math.floor(resolution.height / 2) * 2;

  onLog(
    `🚀 EXECUTING HYPER-TURBO ENGINE (${targetWidth}x${targetHeight}, 1 FPS Animated Sequence)...`
  );

  const outputFileName = "output.mp4";
  const scaleFilter = `scale=${targetWidth}:${targetHeight}`;

  const isDirectCopyableAudio =
    audioCopyMode && ["mp3", "aac", "m4a", "mp4"].includes(fileExt);

  // OPTIMIZED 1 FPS ANIMATED VIDEO PARAMETERS:
  const buildHyperArgs = (useCopy: boolean) => [
    ...(hasFrameSequence
      ? ["-stream_loop", "-1", "-framerate", "1", "-i", "frame_%02d.png"]
      : ["-loop", "1", "-framerate", "1", "-i", "banner.png"]),
    "-i",
    mediaInputName,
    "-map",
    "0:v:0",
    "-map",
    "1:a:0?",
    "-vf",
    scaleFilter,
    "-c:v",
    "libx264",
    "-preset",
    "ultrafast",
    "-profile:v",
    "baseline",
    "-level",
    "3.0",
    "-g",
    "1",
    "-r",
    "1",
    "-threads",
    "0",
    ...(useCopy
      ? ["-c:a", "copy"]
      : ["-c:a", "aac", "-b:a", "64k", "-ac", "1"]),
    "-shortest",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    outputFileName,
  ];

  let execSuccess = false;

  // Primary Hyper-Speed Execution
  try {
    onLog(
      isDirectCopyableAudio
        ? "⚡ Mode: Direct Audio Stream Copy (-c:a copy) + Hyper 144p x264..."
        : "⚡ Mode: Fast Voice AAC + Hyper 144p x264..."
    );
    await ffmpeg.exec(buildHyperArgs(isDirectCopyableAudio));
    execSuccess = true;
  } catch (err: any) {
    onLog(
      `Primary hyper-speed notice: ${
        err?.message || "Standard fallback triggered"
      }. Retrying with safe parameters...`
    );
  }

  // Fail-Safe Fallback Execution
  if (!execSuccess) {
    onLog("Executing Universal Safe Muxer...");
    await ffmpeg.exec([
      "-loop",
      "1",
      "-i",
      "banner.png",
      "-i",
      mediaInputName,
      "-map",
      "0:v:0",
      "-map",
      "1:a:0?",
      "-vf",
      `scale=${targetWidth}:${targetHeight}`,
      "-c:v",
      "libx264",
      "-preset",
      "ultrafast",
      "-tune",
      "stillimage",
      "-r",
      "1",
      "-c:a",
      "aac",
      "-b:a",
      "96k",
      "-shortest",
      "-pix_fmt",
      "yuv420p",
      outputFileName,
    ]);
  }

  onLog("Reading output video stream from browser RAM...");

  const outputData = await ffmpeg.readFile(outputFileName);

  // Cleanup Virtual FS
  try {
    await ffmpeg.deleteFile("banner.png");
    await ffmpeg.deleteFile(mediaInputName);
    await ffmpeg.deleteFile(outputFileName);
  } catch (e) {
    console.warn("Virtual FS cleanup notice:", e);
  }

  onLog("Hyper-speed conversion completed!");
  onProgress(100, duration);

  let uint8Array: Uint8Array;
  if (typeof outputData === "string") {
    uint8Array = new TextEncoder().encode(outputData);
  } else {
    uint8Array = outputData;
  }

  return new Blob([uint8Array as unknown as BlobPart], { type: "video/mp4" });
}
