/**
 * High-Performance Client-Side Line-Art Vectorization & Contour Stroke Tracer
 * Automatically extracts point-to-point drawing trajectories from raster images (PNG/JPEG).
 */

export interface DoodlePoint {
  x: number; // Normalized 0.0 -> 1.0
  y: number; // Normalized 0.0 -> 1.0
}

export interface DoodleStroke {
  points: DoodlePoint[];
  length: number;
}

export interface DetectedBgColor {
  r: number;
  g: number;
  b: number;
  hex: string;
  isDark: boolean;
  isTransparent: boolean;
}

export interface DoodleVectorData {
  strokes: DoodleStroke[];
  totalLength: number;
  // Cumulative distances for O(1) binary-search traversal during 60FPS render
  strokeStartDistances: number[];
  detectedBgColor: DetectedBgColor;
  centroidXNorm?: number;
  centroidYNorm?: number;
  startCentroidXNorm?: number;
  startCentroidYNorm?: number;
  endCentroidXNorm?: number;
  endCentroidYNorm?: number;
}

const vectorCache = new WeakMap<HTMLImageElement | HTMLVideoElement, DoodleVectorData>();

/**
 * Extracts or retrieves cached vectorized contour stroke paths from an image/video source.
 */
export function getOrExtractDoodleVectorData(
  mediaSource: HTMLImageElement | HTMLVideoElement
): DoodleVectorData {
  const cached = vectorCache.get(mediaSource);
  if (cached) return cached;

  const vectorData = extractStrokesFromSource(mediaSource);
  vectorCache.set(mediaSource, vectorData);
  return vectorData;
}

/**
 * Samples the source on a fast downscaled canvas, detects dark/edge contours,
 * and traces connected lines into continuous point-to-point drawing chains.
 */
function extractStrokesFromSource(
  mediaSource: HTMLImageElement | HTMLVideoElement
): DoodleVectorData {
  if (typeof document === "undefined") {
    return createFallbackVectorData();
  }

  const srcW =
    mediaSource instanceof HTMLVideoElement
      ? mediaSource.videoWidth || 1920
      : mediaSource.naturalWidth || 1920;
  const srcH =
    mediaSource instanceof HTMLVideoElement
      ? mediaSource.videoHeight || 1080
      : mediaSource.naturalHeight || 1080;

  // Normalized processing resolution (~35,000 pixels for ~3-6ms execution)
  const targetWidth = 256;
  const targetHeight = Math.max(72, Math.round(targetWidth * (srcH / srcW)));

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return createFallbackVectorData();

  ctx.drawImage(mediaSource, 0, 0, targetWidth, targetHeight);
  let imgData: ImageData;
  try {
    imgData = ctx.getImageData(0, 0, targetWidth, targetHeight);
  } catch {
    return createFallbackVectorData();
  }

  const data = imgData.data;
  const w = targetWidth;
  const h = targetHeight;

  // 1. Automatically detect dominant image background color
  const detectedBgColor = detectImageBackgroundColor(data, w, h);

  // 2. Calculate luminance & edge presence
  const edgeGrid = new Uint8Array(w * h);

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = (y * w + x) * 4;
      const alpha = data[idx + 3];
      if (alpha < 40) continue; // Transparent background

      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

      // Dark ink line test (black/gray marker stroke)
      if (lum < 0.72) {
        edgeGrid[y * w + x] = 1;
        continue;
      }

      // Sobel gradient test for colored/contrast boundaries
      const lumL = getLuminance(data, (y * w + (x - 1)) * 4);
      const lumR = getLuminance(data, (y * w + (x + 1)) * 4);
      const lumU = getLuminance(data, ((y - 1) * w + x) * 4);
      const lumD = getLuminance(data, ((y + 1) * w + x) * 4);
      const grad = Math.abs(lumR - lumL) + Math.abs(lumD - lumU);

      if (grad > 0.38) {
        edgeGrid[y * w + x] = 1;
      }
    }
  }

  // 3. Connected Component Contour Graph Walking
  const visited = new Uint8Array(w * h);
  const rawStrokes: DoodlePoint[][] = [];

  // Scan grid from top-left to bottom-right for unvisited line pixels
  for (let y = 1; y < h - 1; y += 2) {
    for (let x = 1; x < w - 1; x += 2) {
      const pIdx = y * w + x;
      if (edgeGrid[pIdx] === 1 && visited[pIdx] === 0) {
        const stroke = traceContourLine(edgeGrid, visited, x, y, w, h);
        if (stroke.length >= 3) {
          rawStrokes.push(stroke);
        }
      }
    }
  }

  if (rawStrokes.length === 0) {
    return createFallbackVectorData(detectedBgColor);
  }

  // 4. Optimize Drawing Sequence (Greedy Nearest Neighbor to minimize pen jumps)
  const sortedStrokes = sortStrokesByProximity(rawStrokes);

  // 5. Simplify points and compute lengths
  const finalStrokes: DoodleStroke[] = [];
  let cumulativeLen = 0;
  const startDistances: number[] = [];

  for (const strokePoints of sortedStrokes) {
    const simplified = simplifyPoints(strokePoints, 0.005);
    if (simplified.length < 2) continue;

    let strokeLen = 0;
    for (let i = 0; i < simplified.length - 1; i++) {
      const dx = simplified[i + 1].x - simplified[i].x;
      const dy = simplified[i + 1].y - simplified[i].y;
      strokeLen += Math.sqrt(dx * dx + dy * dy);
    }

    // Minimum visual length threshold
    if (strokeLen > 0.008) {
      startDistances.push(cumulativeLen);
      finalStrokes.push({
        points: simplified,
        length: strokeLen,
      });
      cumulativeLen += strokeLen;
    }
  }

  if (finalStrokes.length === 0) {
    return createFallbackVectorData(detectedBgColor);
  }

  // 6. Compute overall and start/end stroke centroids for rock-solid smooth camera tracking
  let totalPts = 0;
  let sumX = 0;
  let sumY = 0;

  const startLimit = Math.max(1, Math.floor(finalStrokes.length * 0.25));
  let startPts = 0;
  let startSumX = 0;
  let startSumY = 0;

  const endStartIdx = Math.max(0, finalStrokes.length - startLimit);
  let endPts = 0;
  let endSumX = 0;
  let endSumY = 0;

  for (let s = 0; s < finalStrokes.length; s++) {
    const pts = finalStrokes[s].points;
    for (let p = 0; p < pts.length; p++) {
      sumX += pts[p].x;
      sumY += pts[p].y;
      totalPts++;

      if (s < startLimit) {
        startSumX += pts[p].x;
        startSumY += pts[p].y;
        startPts++;
      }
      if (s >= endStartIdx) {
        endSumX += pts[p].x;
        endSumY += pts[p].y;
        endPts++;
      }
    }
  }

  const centroidXNorm = totalPts > 0 ? sumX / totalPts : 0.5;
  const centroidYNorm = totalPts > 0 ? sumY / totalPts : 0.5;
  const startCentroidXNorm = startPts > 0 ? startSumX / startPts : centroidXNorm;
  const startCentroidYNorm = startPts > 0 ? startSumY / startPts : centroidYNorm;
  const endCentroidXNorm = endPts > 0 ? endSumX / endPts : centroidXNorm;
  const endCentroidYNorm = endPts > 0 ? endSumY / endPts : centroidYNorm;

  return {
    strokes: finalStrokes,
    totalLength: cumulativeLen,
    strokeStartDistances: startDistances,
    detectedBgColor,
    centroidXNorm,
    centroidYNorm,
    startCentroidXNorm,
    startCentroidYNorm,
    endCentroidXNorm,
    endCentroidYNorm,
  };
}

/**
 * Traces a continuous line along 8-connected edge pixels
 */
function traceContourLine(
  edgeGrid: Uint8Array,
  visited: Uint8Array,
  startX: number,
  startY: number,
  w: number,
  h: number
): DoodlePoint[] {
  const points: DoodlePoint[] = [];
  let cx = startX;
  let cy = startY;
  let prevDx = 1;
  let prevDy = 0;

  const maxSteps = 400; // Limit single stroke length to prevent infinite loops
  let steps = 0;

  while (steps < maxSteps) {
    visited[cy * w + cx] = 1;
    points.push({ x: cx / w, y: cy / h });
    steps++;

    // Check 8-neighborhood for unvisited edge pixels, prioritizing momentum direction
    let bestNx = -1;
    let bestNy = -1;
    let bestScore = -999;

    const neighbors = [
      [1, 0],
      [1, 1],
      [0, 1],
      [-1, 1],
      [-1, 0],
      [-1, -1],
      [0, -1],
      [1, -1],
    ];

    for (const [dx, dy] of neighbors) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
        const nIdx = ny * w + nx;
        if (edgeGrid[nIdx] === 1 && visited[nIdx] === 0) {
          // Direction alignment score
          const dot = dx * prevDx + dy * prevDy;
          if (dot > bestScore) {
            bestScore = dot;
            bestNx = nx;
            bestNy = ny;
          }
        }
      }
    }

    if (bestNx !== -1 && bestNy !== -1) {
      prevDx = bestNx - cx;
      prevDy = bestNy - cy;
      cx = bestNx;
      cy = bestNy;
    } else {
      // Look up to 2 pixels away for nearby stroke continuation
      let jumped = false;
      for (let r = 2; r <= 3; r++) {
        for (let dy = -r; dy <= r; dy++) {
          for (let dx = -r; dx <= r; dx++) {
            if (Math.abs(dx) === r || Math.abs(dy) === r) {
              const nx = cx + dx;
              const ny = cy + dy;
              if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                const nIdx = ny * w + nx;
                if (edgeGrid[nIdx] === 1 && visited[nIdx] === 0) {
                  prevDx = dx;
                  prevDy = dy;
                  cx = nx;
                  cy = ny;
                  jumped = true;
                  break;
                }
              }
            }
          }
          if (jumped) break;
        }
        if (jumped) break;
      }

      if (!jumped) break; // End of this line
    }
  }

  return points;
}

/**
 * Orders strokes so that each subsequent stroke starts near the end of the previous stroke
 */
function sortStrokesByProximity(strokes: DoodlePoint[][]): DoodlePoint[][] {
  if (strokes.length <= 1) return strokes;

  const result: DoodlePoint[][] = [];
  const remaining = [...strokes];

  // Start with the top-most, left-most stroke
  remaining.sort((a, b) => a[0].y + a[0].x * 0.5 - (b[0].y + b[0].x * 0.5));
  let current = remaining.shift()!;
  result.push(current);

  while (remaining.length > 0) {
    const lastPoint = current[current.length - 1];
    let nearestIdx = 0;
    let nearestDist = Infinity;
    let shouldReverse = false;

    for (let i = 0; i < remaining.length; i++) {
      const s = remaining[i];
      const startP = s[0];
      const endP = s[s.length - 1];

      const dStart =
        (startP.x - lastPoint.x) ** 2 + (startP.y - lastPoint.y) ** 2;
      const dEnd = (endP.x - lastPoint.x) ** 2 + (endP.y - lastPoint.y) ** 2;

      if (dStart < nearestDist) {
        nearestDist = dStart;
        nearestIdx = i;
        shouldReverse = false;
      }
      if (dEnd < nearestDist) {
        nearestDist = dEnd;
        nearestIdx = i;
        shouldReverse = true;
      }
    }

    let nextStroke = remaining.splice(nearestIdx, 1)[0];
    if (shouldReverse) {
      nextStroke = nextStroke.reverse();
    }
    result.push(nextStroke);
    current = nextStroke;
  }

  return result;
}

/**
 * Simplifies a sequence of points using Ramer-Douglas-Peucker distance threshold
 */
function simplifyPoints(points: DoodlePoint[], tolerance: number): DoodlePoint[] {
  if (points.length <= 2) return points;

  let maxDist = 0;
  let maxIdx = 0;
  const start = points[0];
  const end = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const d = perpendicularDistance(points[i], start, end);
    if (d > maxDist) {
      maxDist = d;
      maxIdx = i;
    }
  }

  if (maxDist > tolerance) {
    const left = simplifyPoints(points.slice(0, maxIdx + 1), tolerance);
    const right = simplifyPoints(points.slice(maxIdx), tolerance);
    return [...left.slice(0, -1), ...right];
  } else {
    return [start, end];
  }
}

function perpendicularDistance(
  p: DoodlePoint,
  p1: DoodlePoint,
  p2: DoodlePoint
): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const mag = Math.sqrt(dx * dx + dy * dy);
  if (mag < 0.00001) return Math.sqrt((p.x - p1.x) ** 2 + (p.y - p1.y) ** 2);
  return Math.abs(dy * p.x - dx * p.y + p2.x * p1.y - p2.y * p1.x) / mag;
}

function getLuminance(data: Uint8ClampedArray, idx: number): number {
  return (0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]) / 255;
}

/**
 * Samples perimeter and corner pixels to accurately detect dominant background color of the image
 */
function detectImageBackgroundColor(
  data: Uint8ClampedArray,
  w: number,
  h: number
): DetectedBgColor {
  let totalR = 0;
  let totalG = 0;
  let totalB = 0;
  let sampleCount = 0;
  let transparentCount = 0;

  const samplePixel = (x: number, y: number) => {
    if (x < 0 || x >= w || y < 0 || y >= h) return;
    const idx = (y * w + x) * 4;
    const a = data[idx + 3];
    if (a < 30) {
      transparentCount++;
      return;
    }
    totalR += data[idx];
    totalG += data[idx + 1];
    totalB += data[idx + 2];
    sampleCount++;
  };

  // Sample 4 corner patches (3x3 each)
  for (let dy = 0; dy < 3; dy++) {
    for (let dx = 0; dx < 3; dx++) {
      samplePixel(dx, dy);
      samplePixel(w - 1 - dx, dy);
      samplePixel(dx, h - 1 - dy);
      samplePixel(w - 1 - dx, h - 1 - dy);
    }
  }

  // Sample perimeter border edges
  for (let x = 3; x < w - 3; x += 3) {
    samplePixel(x, 1);
    samplePixel(x, h - 2);
  }
  for (let y = 3; y < h - 3; y += 3) {
    samplePixel(1, y);
    samplePixel(w - 2, y);
  }

  const totalTested = sampleCount + transparentCount;
  if (transparentCount > totalTested * 0.6 || sampleCount === 0) {
    return {
      r: 234,
      g: 234,
      b: 234,
      hex: "#EAEAEA",
      isDark: false,
      isTransparent: true,
    };
  }

  const avgR = Math.round(totalR / sampleCount);
  const avgG = Math.round(totalG / sampleCount);
  const avgB = Math.round(totalB / sampleCount);

  const hex = `#${((1 << 24) + (avgR << 16) + (avgG << 8) + avgB)
    .toString(16)
    .slice(1)}`;
  const lum = (0.299 * avgR + 0.587 * avgG + 0.114 * avgB) / 255;

  return {
    r: avgR,
    g: avgG,
    b: avgB,
    hex,
    isDark: lum < 0.45,
    isTransparent: false,
  };
}

/**
 * Fallback procedural strokes for images with no edge data
 */
function createFallbackVectorData(
  bg?: DetectedBgColor
): DoodleVectorData {
  const detectedBgColor: DetectedBgColor = bg || {
    r: 234,
    g: 234,
    b: 234,
    hex: "#EAEAEA",
    isDark: false,
    isTransparent: false,
  };

  const strokes: DoodleStroke[] = [];
  const numBands = 8;
  let totalLen = 0;
  const startDists: number[] = [];

  for (let b = 0; b < numBands; b++) {
    const yNorm = (b + 0.5) / numBands;
    const isLtoR = b % 2 === 0;
    const points: DoodlePoint[] = [];
    const steps = 12;

    for (let s = 0; s <= steps; s++) {
      const xNorm = isLtoR ? s / steps : 1 - s / steps;
      points.push({
        x: 0.08 + xNorm * 0.84,
        y: yNorm,
      });
    }

    startDists.push(totalLen);
    const len = 0.84;
    strokes.push({ points, length: len });
    totalLen += len;
  }

  return {
    strokes,
    totalLength: totalLen,
    strokeStartDistances: startDists,
    detectedBgColor,
    centroidXNorm: 0.5,
    centroidYNorm: 0.5,
    startCentroidXNorm: 0.5,
    startCentroidYNorm: 0.35,
    endCentroidXNorm: 0.5,
    endCentroidYNorm: 0.65,
  };
}

/**
 * Computes exact marker tip location and active stroke progress at normalized time t (0.0 -> 1.0)
 */
export function evaluateDoodlePositionAtProgress(
  vectorData: DoodleVectorData,
  progress: number
): {
  tipXNorm: number;
  tipYNorm: number;
  activeStrokeIndex: number;
  completedStrokes: number;
  strokeProgress: number;
} {
  const t = Math.max(0, Math.min(1, progress));
  const targetDistance = t * vectorData.totalLength;

  const strokes = vectorData.strokes;
  if (strokes.length === 0) {
    return {
      tipXNorm: 0.5,
      tipYNorm: 0.5,
      activeStrokeIndex: 0,
      completedStrokes: 0,
      strokeProgress: 0,
    };
  }

  // Binary search for active stroke
  let strokeIdx = 0;
  for (let i = 0; i < strokes.length; i++) {
    const startD = vectorData.strokeStartDistances[i];
    const endD = startD + strokes[i].length;
    if (targetDistance >= startD && (targetDistance <= endD || i === strokes.length - 1)) {
      strokeIdx = i;
      break;
    }
  }

  const activeStroke = strokes[strokeIdx];
  const strokeStartD = vectorData.strokeStartDistances[strokeIdx];
  const distInStroke = Math.max(
    0,
    Math.min(activeStroke.length, targetDistance - strokeStartD)
  );
  const strokeProgress =
    activeStroke.length > 0 ? distInStroke / activeStroke.length : 0;

  // Walk points along the active stroke
  const pts = activeStroke.points;
  let accumDist = 0;
  let tipX = pts[0].x;
  let tipY = pts[0].y;

  for (let p = 0; p < pts.length - 1; p++) {
    const p1 = pts[p];
    const p2 = pts[p + 1];
    const segLen = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);

    if (accumDist + segLen >= distInStroke || p === pts.length - 2) {
      const segT =
        segLen > 0.0001
          ? Math.max(0, Math.min(1, (distInStroke - accumDist) / segLen))
          : 0;
      tipX = p1.x + (p2.x - p1.x) * segT;
      tipY = p1.y + (p2.y - p1.y) * segT;
      break;
    }
    accumDist += segLen;
  }

  return {
    tipXNorm: tipX,
    tipYNorm: tipY,
    activeStrokeIndex: strokeIdx,
    completedStrokes: strokeIdx,
    strokeProgress,
  };
}
