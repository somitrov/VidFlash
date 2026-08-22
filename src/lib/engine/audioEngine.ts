import { AudioTrackState, AudioTrackPart } from "@/types/autoeditor";

/**
 * Proprietary WebAudio Decoding, Multi-Clip Concatenation and Waveform Engine
 */

/**
 * Sorts audio files in ascending numerical order if numbers are present,
 * or by file creation timestamp (oldest first -> latest last) for unstructured names.
 */
export function sortAudioFiles(files: File[]): File[] {
  if (files.length <= 1) return files;

  const extractNumber = (name: string): number | null => {
    // Check for sequence patterns: part1, audio_02, track-3, 04_scene, (5), etc.
    const match = name.match(/(?:part|track|audio|clip|scene|section|chapter)?[_\-\s\(]*(\d+)[_\-\s\)]*/i) || name.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  };

  const allHaveNumbers = files.every((f) => extractNumber(f.name) !== null);

  return [...files].sort((a, b) => {
    const numA = extractNumber(a.name);
    const numB = extractNumber(b.name);

    if (numA !== null && numB !== null && numA !== numB) {
      return numA - numB; // Ascending numerical order
    }

    // Natural filename comparison
    const strCompare = a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" });
    if (strCompare !== 0 && (numA !== null || !a.lastModified)) {
      return strCompare;
    }

    // Fallback for weird filenames: creation/generation time (oldest first)
    const timeA = a.lastModified || 0;
    const timeB = b.lastModified || 0;
    return timeA - timeB;
  });
}

/**
 * Ingests and seamlessly concatenates single or multiple audio files into a unified master audio track.
 */
export async function decodeAudioFiles(rawFiles: File[]): Promise<AudioTrackState> {
  if (!rawFiles || rawFiles.length === 0) {
    throw new Error("No audio files provided.");
  }

  const sortedFiles = sortAudioFiles(rawFiles);
  const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

  // If single file, decode directly
  if (sortedFiles.length === 1) {
    const file = sortedFiles[0];
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const durationSec = audioBuffer.duration;
    const waveformPeaks = extractWaveformPeaks(audioBuffer, 200);
    const audioUrl = URL.createObjectURL(file);

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
  }

  // Multiple files: Decode all buffers in order
  const decodedBuffers: AudioBuffer[] = [];
  const parts: AudioTrackPart[] = [];
  let currentOffsetSec = 0;

  for (const file of sortedFiles) {
    const ab = await file.arrayBuffer();
    const decoded = await audioContext.decodeAudioData(ab);
    decodedBuffers.push(decoded);

    const dur = decoded.duration;
    parts.push({
      fileName: file.name,
      durationSec: dur,
      startSec: Number(currentOffsetSec.toFixed(2)),
      endSec: Number((currentOffsetSec + dur).toFixed(2)),
    });
    currentOffsetSec += dur;
  }

  // Determine master sample rate & channel count
  const sampleRate = decodedBuffers[0].sampleRate || 44100;
  const numberOfChannels = Math.max(...decodedBuffers.map((b) => b.numberOfChannels));
  const totalSampleLength = decodedBuffers.reduce((sum, b) => sum + b.length, 0);

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
    let sum = 0;
    for (let j = 0; j < blockSize; j++) {
      sum += Math.abs(channelData[start + j] || 0);
    }
    const avg = sum / blockSize;
    peaks.push(Math.min(1.0, Math.max(0.05, avg * 3.5)));
  }

  return peaks;
}

/**
 * Converts a WebAudio AudioBuffer into a standard in-memory PCM WAV Blob
 */
export function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const out = new DataView(new ArrayBuffer(length));
  const channels: Float32Array[] = [];
  let offset = 0;
  let pos = 0;

  function writeString(str: string) {
    for (let i = 0; i < str.length; i++) {
      out.setUint8(pos++, str.charCodeAt(i));
    }
  }

  function setUint16(data: number) {
    out.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    out.setUint32(pos, data, true);
    pos += 4;
  }

  // RIFF Chunk
  writeString("RIFF");
  setUint32(length - 8);
  writeString("WAVE");

  // Format Chunk
  writeString("fmt ");
  setUint32(16); // subchunk size
  setUint16(1); // PCM format
  setUint16(numOfChan);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * numOfChan); // byte rate
  setUint16(numOfChan * 2); // block align
  setUint16(16); // bits per sample

  // Data Chunk
  writeString("data");
  setUint32(length - pos - 4);

  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (offset < buffer.length) {
    for (let i = 0; i < numOfChan; i++) {
      let sample = channels[i][offset];
      sample = Math.max(-1, Math.min(1, sample));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      out.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([out.buffer], { type: "audio/wav" });
}
