import { TimelineClip } from "@/types/autoeditor";

/**
 * Proprietary Timestamp Parsing Engine for VidFlash AutoEditor
 * Automatically detects and standardizes timecodes embedded within image/video filenames.
 */

export function parseTimestampFromFilename(filename: string): number | null {
  if (!filename) return null;

  // Clean filename extension and query strings
  const name = filename.replace(/\.[^/.]+$/, "").trim();

  // Pattern 1: HH_MM_SS or HH-MM-SS or HH:MM:SS (e.g., 01_02_15 or 01-02-15)
  const hmsMatch = name.match(/(?:^|[_\-\s])(\d{1,2})[_\-\:](\d{2})[_\-\:](\d{2})(?:[_\-\s]|$)/);
  if (hmsMatch) {
    const hours = parseInt(hmsMatch[1], 10);
    const mins = parseInt(hmsMatch[2], 10);
    const secs = parseInt(hmsMatch[3], 10);
    return hours * 3600 + mins * 60 + secs;
  }

  // Pattern 2: MM_SS_MS or MM-SS-MS (e.g., 0-06-5 -> 6.5s, 01-24-3 -> 84.3s)
  const msmsMatch = name.match(/(?:^|[_\-\s])(\d{1,3})[_\-\:\.](\d{1,2})[_\-\:\.](\d{1,3})(?:[_\-\s\.]|$)/);
  if (msmsMatch) {
    const mins = parseInt(msmsMatch[1], 10);
    const secs = parseInt(msmsMatch[2], 10);
    const msFraction = parseFloat(`0.${msmsMatch[3]}`);
    if (secs < 60) {
      return mins * 60 + secs + msFraction;
    }
  }

  // Pattern 3: MM_SS or MM-SS or MM.SS or M-SS (e.g., 0-06, 1-05, 2-05, 10-10, 15-35)
  const msMatch = name.match(/(?:^|[_\-\s])(\d{1,3})[_\-\:\.](\d{1,2})(?:[_\-\s\.]|$)/);
  if (msMatch) {
    const mins = parseInt(msMatch[1], 10);
    const secs = parseInt(msMatch[2], 10);
    if (secs < 60) {
      return mins * 60 + secs;
    }
  }

  // Pattern 4: Explicit seconds suffix e.g., 15s, 85.5s, t_45, time_120
  const secMatch = name.match(/(?:^|[_\-\stT])(\d+(?:\.\d+)?)\s*(?:s|sec|seconds?)(?:[_\-\s]|$)/i);
  if (secMatch) {
    return parseFloat(secMatch[1]);
  }

  // Pattern 5: Raw 4-digit timestamp e.g. 0115 (1 min 15 sec) or sequence number prefix
  const rawPrefixMatch = name.match(/^(\d{1,4})(?:[_\-\s]|$)/);
  if (rawPrefixMatch) {
    const numStr = rawPrefixMatch[1];
    if (numStr.length === 4) {
      const mins = parseInt(numStr.slice(0, 2), 10);
      const secs = parseInt(numStr.slice(2, 4), 10);
      if (secs < 60) return mins * 60 + secs;
    }
    if (numStr.length <= 3) {
      return parseInt(numStr, 10);
    }
  }

  return null;
}

export function formatSecondsToTimecode(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "00:00.0";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);
  return `${mins < 10 ? "0" : ""}${mins}:${secs < 10 ? "0" : ""}${secs}.${ms}`;
}

/**
 * Sorts clips strictly by chronological timestamp.
 * Fallbacks to natural alphanumeric sequence (1, 2, 10) and file creation time (oldest first).
 */
export function sortClipsByTimestamp(clips: TimelineClip[]): TimelineClip[] {
  return [...clips].sort((a, b) => {
    // 1. Both clips have detected timestamps
    if (a.parsedTimestampSec !== null && b.parsedTimestampSec !== null) {
      if (a.parsedTimestampSec !== b.parsedTimestampSec) {
        return a.parsedTimestampSec - b.parsedTimestampSec;
      }
    }

    // 2. Timestamped clips always precede non-timestamped clips
    if (a.parsedTimestampSec !== null && b.parsedTimestampSec === null) return -1;
    if (a.parsedTimestampSec === null && b.parsedTimestampSec !== null) return 1;

    // 3. Natural numerical alphanumeric sorting (e.g. 2-05 comes before 10-10)
    const naturalCompare = a.fileName.localeCompare(b.fileName, undefined, {
      numeric: true,
      sensitivity: "base",
    });
    if (naturalCompare !== 0) return naturalCompare;

    // 4. File creation timestamp fallback (oldest first)
    const timeA = a.file?.lastModified || 0;
    const timeB = b.file?.lastModified || 0;
    return timeA - timeB;
  });
}
