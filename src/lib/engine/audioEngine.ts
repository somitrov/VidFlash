import { AudioTrackState, AudioTrackPart } from "@/types/autoeditor";

/**
 * High-Resilience WebAudio Decoding, Multi-Clip Concatenation and Waveform Engine
 * Supports all voiceover formats: MP3, WAV, M4A, AAC, FLAC, OGG, OPUS, WEBA
 */

/**
 * Sorts audio files in ascending numerical order if numbers are present,
 * or by file creation timestamp (oldest first -> latest last) for unstructured names.
 */
export function sortAudioFiles(files: File[]): File[] {
  if (files.length <= 1) return files;

  const extractNumber = (name: string): number | null => {
    // Check for sequence patterns: part1, audio_02, track-3, 04_scene, (5), etc.
    const match =
      name.match(
        /(?:part|track|audio|clip|scene|section|chapter)?[_\-\s\(]*(\d+)[_\-\s\)]*/i
      ) || name.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  };

  return [...files].sort((a, b) => {
    const numA = extractNumber(a.name);
    const numB = extractNumber(b.name);

    if (numA !== null && numB !== null && numA !== numB) {
      return numA - numB; // Ascending numerical order
    }

    // Natural filename comparison
    const strCompare = a.name.localeCompare(b.name, undefined, {
      numeric: true,
      sensitivity: "base",
    });
    if (strCompare !== 0 && (numA !== null || !a.lastModified)) {
      return strCompare;
    }

    // Fallback for unstructured filenames: creation/generation time (oldest first)
    const timeA = a.lastModified || 0;
    const timeB = b.lastModified || 0;
    return timeA - timeB;
  });
}

/**
 * Probes audio duration via HTML5 Audio element fallback if WebAudio decode fails
 */
function probeAudioDurationHtml5(url: string): Promise<number> {
  return new Promise((resolve) => {
    const audio = new Audio();
    audio.preload = "metadata";
    audio.src = url;
    audio.onloadedmetadata = () => {
      resolve(audio.duration || 10);
    };
    audio.onerror = () => {
      resolve(10);
    };
  });
}

/**
 * Ingests and seamlessly concatenates single or multiple audio files into a unified master audio track.
 */
export async function decodeAudioFiles(
  rawFiles: File[]
): Promise<AudioTrackState> {
  if (!rawFiles || rawFiles.length === 0) {
    throw new Error("No audio files provided.");
  }

  const sortedFiles = sortAudioFiles(rawFiles);
  const audioContext = new (window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext)();

  if (audioContext.state === "suspended") {
    try {
      await audioContext.resume();
    } catch {}
  }

  // If single file, attempt fast direct decoding with HTML5 fallback
  if (sortedFiles.length === 1) {
    const file = sortedFiles[0];
    const audioUrl = URL.createObjectURL(file);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(
        arrayBuffer.slice(0)
      );
      const durationSec = audioBuffer.duration;
      const waveformPeaks = extractWaveformPeaks(audioBuffer, 200);

      return {
        file,
        fileName: file.name,
        parts: [
          {
            fileName: file.name,
            durationSec,
            startSec: 0,
            endSec: durationSec,
          },
        ],
        durationSec,
        audioBuffer,
        waveformPeaks,
        audioUrl,
      };
    } catch (decodeErr) {
      console.warn(
        "WebAudio direct decode failed, falling back to HTML5 metadata:",
        decodeErr
      );
      const durationSec = await probeAudioDurationHtml5(audioUrl);
      const fallbackPeaks = generateSyntheticWaveform(200);

      return {
        file,
        fileName: file.name,
        parts: [
          {
            fileName: file.name,
            durationSec,
            startSec: 0,
            endSec: durationSec,
          },
        ],
        durationSec,
        audioBuffer: null,
        waveformPeaks: fallbackPeaks,
        audioUrl,
      };
    }
  }

  // Multiple files: Decode all buffers in order
  const decodedBuffers: AudioBuffer[] = [];
  const parts: AudioTrackPart[] = [];
  let currentOffsetSec = 0;

  for (const file of sortedFiles) {
    try {
      const ab = await file.arrayBuffer();
      const decoded = await audioContext.decodeAudioData(ab.slice(0));
      decodedBuffers.push(decoded);

      const dur = decoded.duration;
      parts.push({
        fileName: file.name,
        durationSec: dur,
        startSec: Number(currentOffsetSec.toFixed(2)),
        endSec: Number((currentOffsetSec + dur).toFixed(2)),
      });
      currentOffsetSec += dur;
    } catch (partErr) {
      console.warn(`Could not decode audio part ${file.name}:`, partErr);
    }
  }

  if (decodedBuffers.length === 0) {
    // If all failed WebAudio decode, use first file as fallback
    const file = sortedFiles[0];
    const audioUrl = URL.createObjectURL(file);
    const durationSec = await probeAudioDurationHtml5(audioUrl);
    return {
      file: sortedFiles,
      fileName: file.name,
      parts: [
        {
          fileName: file.name,
          durationSec,
          startSec: 0,
          endSec: durationSec,
        },
      ],
      durationSec,
      audioBuffer: null,
      waveformPeaks: generateSyntheticWaveform(200),
      audioUrl,
    };
  }

  // Determine master sample rate & channel count
  const sampleRate = decodedBuffers[0].sampleRate || 44100;
  const numberOfChannels = Math.max(
    ...decodedBuffers.map((b) => b.numberOfChannels)
  );
  const totalSampleLength = decodedBuffers.reduce(
    (sum, b) => sum + b.length,
    0
  );

  // Allocate unified master AudioBuffer
  const masterBuffer = audioContext.createBuffer(
    numberOfChannels,
    totalSampleLength,
    sampleRate
  );

  // Stitch PCM audio channels seamlessly
  for (let ch = 0; ch < numberOfChannels; ch++) {
    const masterChannelData = masterBuffer.getChannelData(ch);
    let sampleOffset = 0;

    for (const buf of decodedBuffers) {
      const srcChannel = ch < buf.numberOfChannels ? ch : 0;
      masterChannelData.set(buf.getChannelData(srcChannel), sampleOffset);
      sampleOffset += buf.length;
    }
  }

  const durationSec = masterBuffer.duration;
  const waveformPeaks = extractWaveformPeaks(masterBuffer, 200);

  // Encode merged AudioBuffer to WAV Blob for local HTML5 Audio element
  const wavBlob = audioBufferToWavBlob(masterBuffer);
  const audioUrl = URL.createObjectURL(wavBlob);

  const displayFileName = `${sortedFiles.length} Audio Clips (${sortedFiles[0].name} … ${sortedFiles[sortedFiles.length - 1].name})`;

  return {
    file: sortedFiles,
    fileName: displayFileName,
    parts,
    durationSec,
    audioBuffer: masterBuffer,
    waveformPeaks,
    audioUrl,
  };
}

/**
 * Downsamples multi-channel audio data into normalized peak points [0.0 - 1.0] for visual timeline waveforms.
 */
export function extractWaveformPeaks(
  audioBuffer: AudioBuffer,
  totalSamples: number = 200
): number[] {
  const channelData = audioBuffer.getChannelData(0);
  const blockSize = Math.floor(channelData.length / totalSamples);
  const peaks: number[] = [];

  for (let i = 0; i < totalSamples; i++) {
    const start = i * blockSize;
    let max = 0;
    for (let j = 0; j < blockSize; j++) {
      const val = Math.abs(channelData[start + j] || 0);
      if (val > max) max = val;
    }
    peaks.push(Math.min(1.0, Number(max.toFixed(3))));
  }

  return peaks;
}

/**
 * Fallback synthetic waveform generator
 */
function generateSyntheticWaveform(totalSamples: number = 200): number[] {
  const peaks: number[] = [];
  for (let i = 0; i < totalSamples; i++) {
    const v =
      0.3 + 0.5 * Math.sin(i * 0.15) * Math.cos(i * 0.08) + Math.random() * 0.2;
    peaks.push(Math.min(1.0, Math.max(0.1, Number(v.toFixed(3)))));
  }
  return peaks;
}

/**
 * Encodes an AudioBuffer into an uncompressed 16-bit PCM WAV Blob.
 */
export function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  let interleaved: Float32Array;
  if (numChannels === 2) {
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);
    interleaved = new Float32Array(left.length + right.length);
    let inputIdx = 0;
    let outputIdx = 0;
    while (inputIdx < left.length) {
      interleaved[outputIdx++] = left[inputIdx];
      interleaved[outputIdx++] = right[inputIdx];
      inputIdx++;
    }
  } else {
    interleaved = buffer.getChannelData(0);
  }

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = interleaved.length * bytesPerSample;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;

  const arrayBuffer = new ArrayBuffer(totalSize);
  const view = new DataView(arrayBuffer);

  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  // RIFF identifier
  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");

  // fmt subchunk
  writeString(12, "fmt ");
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, format, true); // AudioFormat
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);

  // data subchunk
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  // Write PCM samples
  let offset = 44;
  for (let i = 0; i < interleaved.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, interleaved[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return new Blob([view], { type: "audio/wav" });
}
