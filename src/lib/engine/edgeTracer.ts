/**
 * High-Performance Client-Side Line-Art Vectorization & Contour Stroke Tracer
 * Automatically extracts point-to-point drawing trajectories from raster images (PNG/JPEG)
 * with semantic object clustering (props/characters/words completion) and needle-precision line-by-line tracing.
 */

export interface DoodlePoint {
  x: number; // Normalized 0.0 -> 1.0
  y: number; // Normalized 0.0 -> 1.0
}

export interface DoodleStroke {
  points: DoodlePoint[];
  length: number;
  clusterIndex?: number;
}

export interface DoodleAction {
  type: "draw" | "transit";
  strokeIndex: number;
  length: number;
  startDistance: number;
  fromPoint?: DoodlePoint;
  toPoint?: DoodlePoint;
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
  actions: DoodleAction[];
  totalLength: number;
  // Cumulative distances for binary-search traversal during 60FPS render
  strokeStartDistances: number[];
  actionStartDistances: number[];
  detectedBgColor: DetectedBgColor;
  centroidXNorm?: number;
  centroidYNorm?: number;
  startCentroidXNorm?: number;
  startCentroidYNorm?: number;
  endCentroidXNorm?: number;
  endCentroidYNorm?: number;
}

const vectorCache = new WeakMap<
  HTMLImageElement | HTMLVideoElement,
  DoodleVectorData
>();

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
 * clusters strokes into semantic visual objects (props/characters/words),
 * and generates a continuous point-to-point drawing timeline with pen-up transits.
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

  // High-fidelity processing resolution (512px width for crisp curves & letters)
  const targetWidth = 512;
  const targetHeight = Math.max(96, Math.round(targetWidth * (srcH / srcW)));

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

  // Scan grid for unvisited edge pixels
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

  // 4. Object-Complete Spatial Clustering & Sequential Ordering
  const { finalStrokes, actions, totalLength, strokeStartDistances, actionStartDistances } =
    clusterAndSequenceStrokes(rawStrokes);

  if (finalStrokes.length === 0) {
    return createFallbackVectorData(detectedBgColor);
  }

  // 5. Compute overall and start/end stroke centroids for rock-solid camera tracking
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
    actions,
    totalLength,
    strokeStartDistances,
    actionStartDistances,
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
 * Traces a continuous line along 8-connected edge pixels with directional momentum.
 * Suppresses immediate 1px footprint along the line to prevent duplicate parallel ghost strokes.
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

  const maxSteps = 1200; // Allow full continuous strokes at 512px resolution
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
      // Look up to 2-3 pixels away for nearby stroke continuation
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

  // Suppress immediate 1-pixel parallel footprint of this stroke in visited
  // to avoid redundant duplicate ghost lines across the same broad marker stroke
  for (let i = 0; i < points.length; i += 2) {
    const px = Math.round(points[i].x * w);
    const py = Math.round(points[i].y * h);
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const ny = py + dy;
        const nx = px + dx;
        if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
          visited[ny * w + nx] = 1;
        }
      }
    }
  }

  return points;
}

/**
 * Disjoint Set (Union-Find) for spatial clustering
 */
class UnionFind {
  parent: Int32Array;

  constructor(n: number) {
    this.parent = new Int32Array(n);
    for (let i = 0; i < n; i++) this.parent[i] = i;
  }

  find(i: number): number {
    let root = i;
    while (root !== this.parent[root]) {
      root = this.parent[root];
    }
    let curr = i;
    while (curr !== root) {
      const nxt = this.parent[curr];
      this.parent[curr] = root;
      curr = nxt;
    }
    return root;
  }

  union(i: number, j: number) {
    const rootI = this.find(i);
    const rootJ = this.find(j);
    if (rootI !== rootJ) {
      this.parent[rootI] = rootJ;
    }
  }
}

interface StrokeCandidate {
  rawIndex: number;
  points: DoodlePoint[];
  length: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  centerX: number;
  centerY: number;
}

interface StrokeCluster {
  id: number;
  candidates: StrokeCandidate[];
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  centerX: number;
  centerY: number;
}

/**
 * Groups strokes into semantic visual objects (props, characters, words)
 * and enforces that each object is 100% completed before moving on to the next.
 * Also builds smooth pen-up transit actions between strokes.
 */
function clusterAndSequenceStrokes(rawStrokes: DoodlePoint[][]): {
  finalStrokes: DoodleStroke[];
  actions: DoodleAction[];
  totalLength: number;
  strokeStartDistances: number[];
  actionStartDistances: number[];
} {
  // 1. Simplify points and compute lengths & bounding boxes
  const candidates: StrokeCandidate[] = [];

  for (let i = 0; i < rawStrokes.length; i++) {
    // Fine tolerance (0.002) preserves sharp corners and round letterforms
    const simplified = simplifyPoints(rawStrokes[i], 0.002);
    if (simplified.length < 2) continue;

    let len = 0;
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (let p = 0; p < simplified.length; p++) {
      const pt = simplified[p];
      if (pt.x < minX) minX = pt.x;
      if (pt.x > maxX) maxX = pt.x;
      if (pt.y < minY) minY = pt.y;
      if (pt.y > maxY) maxY = pt.y;

      if (p < simplified.length - 1) {
        const next = simplified[p + 1];
        len += Math.hypot(next.x - pt.x, next.y - pt.y);
      }
    }

    // Filter tiny pixel noise
    if (len >= 0.006) {
      candidates.push({
        rawIndex: i,
        points: simplified,
        length: len,
        minX,
        maxX,
        minY,
        maxY,
        centerX: (minX + maxX) / 2,
        centerY: (minY + maxY) / 2,
      });
    }
  }

  if (candidates.length === 0) {
    return {
      finalStrokes: [],
      actions: [],
      totalLength: 0,
      strokeStartDistances: [],
      actionStartDistances: [],
    };
  }

  // 2. Spatial Clustering using Disjoint Set (Union-Find)
  const uf = new UnionFind(candidates.length);
  // Spatial margins for word/prop clustering (horizontal bias for text kerning)
  const marginX = 0.040;
  const marginY = 0.030;

  for (let i = 0; i < candidates.length; i++) {
    const a = candidates[i];
    for (let j = i + 1; j < candidates.length; j++) {
      const b = candidates[j];
      const overlapX =
        a.minX - marginX <= b.maxX + marginX &&
        a.maxX + marginX >= b.minX - marginX;
      const overlapY =
        a.minY - marginY <= b.maxY + marginY &&
        a.maxY + marginY >= b.minY - marginY;

      if (overlapX && overlapY) {
        uf.union(i, j);
      }
    }
  }

  // 3. Assemble clusters
  const clusterMap = new Map<number, StrokeCandidate[]>();
  for (let i = 0; i < candidates.length; i++) {
    const root = uf.find(i);
    if (!clusterMap.has(root)) clusterMap.set(root, []);
    clusterMap.get(root)!.push(candidates[i]);
  }

  const clusters: StrokeCluster[] = [];
  for (const [id, members] of clusterMap.entries()) {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (const m of members) {
      if (m.minX < minX) minX = m.minX;
      if (m.maxX > maxX) maxX = m.maxX;
      if (m.minY < minY) minY = m.minY;
      if (m.maxY > maxY) maxY = m.maxY;
    }

    clusters.push({
      id,
      candidates: members,
      minX,
      maxX,
      minY,
      maxY,
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2,
    });
  }

  // 4. Sort Clusters in natural human reading/presentation order:
  // Top-to-bottom, left-to-right (headers/titles first, then secondary props/diagrams)
  clusters.sort((c1, c2) => {
    // If vertical difference between clusters exceeds row band (~12% canvas height)
    if (Math.abs(c1.minY - c2.minY) > 0.12) {
      return c1.minY - c2.minY;
    }
    // Otherwise on the same line/band: order left-to-right
    return c1.minX - c2.minX;
  });

  // 5. Sequence Strokes WITHIN each Cluster
  // Every stroke in cluster K is 100% completed before moving to cluster K + 1!
  const finalStrokes: DoodleStroke[] = [];

  for (let cIdx = 0; cIdx < clusters.length; cIdx++) {
    const cluster = clusters[cIdx];
    const remaining = [...cluster.candidates];

    // Start with top-left stroke of the cluster
    remaining.sort(
      (a, b) => a.minY + a.minX * 0.4 - (b.minY + b.minX * 0.4)
    );
    let current = remaining.shift()!;

    // Ensure initial stroke starts from top/left
    const pStart = current.points[0];
    const pEnd = current.points[current.points.length - 1];
    if (pStart.y > pEnd.y + 0.01 || (Math.abs(pStart.y - pEnd.y) <= 0.01 && pStart.x > pEnd.x)) {
      current.points = current.points.reverse();
    }

    finalStrokes.push({
      points: current.points,
      length: current.length,
      clusterIndex: cIdx,
    });

    // Nearest Neighbor confined STRICTLY to this cluster
    while (remaining.length > 0) {
      const lastPt = current.points[current.points.length - 1];
      let bestIdx = 0;
      let bestDist = Infinity;
      let shouldReverse = false;

      for (let i = 0; i < remaining.length; i++) {
        const s = remaining[i];
        const sStart = s.points[0];
        const sEnd = s.points[s.points.length - 1];

        const dStart =
          (sStart.x - lastPt.x) ** 2 + (sStart.y - lastPt.y) ** 2;
        const dEnd = (sEnd.x - lastPt.x) ** 2 + (sEnd.y - lastPt.y) ** 2;

        if (dStart < bestDist) {
          bestDist = dStart;
          bestIdx = i;
          shouldReverse = false;
        }
        if (dEnd < bestDist) {
          bestDist = dEnd;
          bestIdx = i;
          shouldReverse = true;
        }
      }

      const nextCandidate = remaining.splice(bestIdx, 1)[0];
      let pts = nextCandidate.points;
      if (shouldReverse) {
        pts = pts.slice().reverse();
      }

      current = {
        ...nextCandidate,
        points: pts,
      };

      finalStrokes.push({
        points: pts,
        length: nextCandidate.length,
        clusterIndex: cIdx,
      });
    }
  }

  // 6. Build Action Timeline (Draw Segments + Smooth Pen-Up Air Transits)
  const actions: DoodleAction[] = [];
  const strokeStartDistances: number[] = [];
  const actionStartDistances: number[] = [];
  let cumulativeDist = 0;

  for (let s = 0; s < finalStrokes.length; s++) {
    const stroke = finalStrokes[s];
    const currStart = stroke.points[0];
    const currEnd = stroke.points[stroke.points.length - 1];

    if (s > 0) {
      const prevStroke = finalStrokes[s - 1];
      const prevEnd = prevStroke.points[prevStroke.points.length - 1];
      const jumpDist = Math.hypot(currStart.x - prevEnd.x, currStart.y - prevEnd.y);

      // Add smooth pen-up in-air transit between disconnected strokes/letters/props
      if (jumpDist > 0.003) {
        // Virtual length for transit motion (proportional to jump distance, capped)
        const transitLen = Math.max(0.008, Math.min(0.065, jumpDist * 0.35));
        actionStartDistances.push(cumulativeDist);
        actions.push({
          type: "transit",
          strokeIndex: s - 1, // Last completed stroke index
          length: transitLen,
          startDistance: cumulativeDist,
          fromPoint: prevEnd,
          toPoint: currStart,
        });
        cumulativeDist += transitLen;
      }
    }

    strokeStartDistances.push(cumulativeDist);
    actionStartDistances.push(cumulativeDist);
    actions.push({
      type: "draw",
      strokeIndex: s,
      length: stroke.length,
      startDistance: cumulativeDist,
      fromPoint: currStart,
      toPoint: currEnd,
    });
    cumulativeDist += stroke.length;
  }

  return {
    finalStrokes,
    actions,
    totalLength: cumulativeDist,
    strokeStartDistances,
    actionStartDistances,
  };
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
  return (
    (0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]) / 255
  );
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
function createFallbackVectorData(bg?: DetectedBgColor): DoodleVectorData {
  const detectedBgColor: DetectedBgColor = bg || {
    r: 234,
    g: 234,
    b: 234,
    hex: "#EAEAEA",
    isDark: false,
    isTransparent: false,
  };

  const strokes: DoodleStroke[] = [];
  const actions: DoodleAction[] = [];
  const strokeStartDistances: number[] = [];
  const actionStartDistances: number[] = [];
  const numBands = 8;
  let totalLen = 0;

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

    const len = 0.84;
    strokeStartDistances.push(totalLen);
    actionStartDistances.push(totalLen);
    actions.push({
      type: "draw",
      strokeIndex: b,
      length: len,
      startDistance: totalLen,
      fromPoint: points[0],
      toPoint: points[points.length - 1],
    });

    strokes.push({ points, length: len, clusterIndex: b });
    totalLen += len;
  }

  return {
    strokes,
    actions,
    totalLength: totalLen,
    strokeStartDistances,
    actionStartDistances,
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
 * Computes exact marker needle tip location, active segment index, and pen-up/pen-down state
 * at normalized time progress t (0.0 -> 1.0).
 * Provides sub-pixel needle accuracy for realistic line-by-line drawing.
 */
export function evaluateDoodlePositionAtProgress(
  vectorData: DoodleVectorData,
  progress: number
): {
  tipXNorm: number;
  tipYNorm: number;
  activeStrokeIndex: number;
  activeSegmentIndex: number;
  completedStrokes: number;
  strokeProgress: number;
  isPenDown: boolean;
} {
  const t = Math.max(0, Math.min(1, progress));
  const targetDistance = t * vectorData.totalLength;

  const strokes = vectorData.strokes;
  const actions = vectorData.actions;

  if (strokes.length === 0 || actions.length === 0) {
    return {
      tipXNorm: 0.5,
      tipYNorm: 0.5,
      activeStrokeIndex: 0,
      activeSegmentIndex: 0,
      completedStrokes: 0,
      strokeProgress: 0,
      isPenDown: false,
    };
  }

  // Binary search for the active action
  let low = 0;
  let high = actions.length - 1;
  let actionIdx = 0;

  while (low <= high) {
    const mid = (low + high) >> 1;
    const act = actions[mid];
    const actStart = act.startDistance;
    const actEnd = actStart + act.length;

    if (targetDistance < actStart) {
      high = mid - 1;
    } else if (targetDistance > actEnd && mid < actions.length - 1) {
      low = mid + 1;
    } else {
      actionIdx = mid;
      break;
    }
  }

  const activeAction = actions[actionIdx];

  // Case A: DRAW ACTION (pen on paper, actively tracing line)
  if (activeAction.type === "draw") {
    const strokeIdx = activeAction.strokeIndex;
    const activeStroke = strokes[strokeIdx];
    const distInStroke = Math.max(
      0,
      Math.min(activeAction.length, targetDistance - activeAction.startDistance)
    );
    const strokeProgress =
      activeAction.length > 0 ? distInStroke / activeAction.length : 1;

    // Walk points to find exact active segment
    const pts = activeStroke.points;
    let accumDist = 0;
    let activeSegIdx = 0;
    let segT = 0;

    for (let p = 0; p < pts.length - 1; p++) {
      const p1 = pts[p];
      const p2 = pts[p + 1];
      const segLen = Math.hypot(p2.x - p1.x, p2.y - p1.y);

      if (accumDist + segLen >= distInStroke || p === pts.length - 2) {
        activeSegIdx = p;
        segT =
          segLen > 0.00001
            ? Math.max(0, Math.min(1, (distInStroke - accumDist) / segLen))
            : 0;
        break;
      }
      accumDist += segLen;
    }

    const tipX =
      pts[activeSegIdx].x +
      (pts[activeSegIdx + 1].x - pts[activeSegIdx].x) * segT;
    const tipY =
      pts[activeSegIdx].y +
      (pts[activeSegIdx + 1].y - pts[activeSegIdx].y) * segT;

    return {
      tipXNorm: tipX,
      tipYNorm: tipY,
      activeStrokeIndex: strokeIdx,
      activeSegmentIndex: activeSegIdx,
      completedStrokes: strokeIdx,
      strokeProgress,
      isPenDown: true,
    };
  }

  // Case B: TRANSIT ACTION (pen lifted in air, gliding smoothly to next stroke)
  const strokeIdx = activeAction.strokeIndex;
  const distInTransit = Math.max(
    0,
    Math.min(activeAction.length, targetDistance - activeAction.startDistance)
  );
  const transitT =
    activeAction.length > 0 ? distInTransit / activeAction.length : 1;
  // Natural smoothstep easing for in-air hand movement
  const easedT = transitT * transitT * (3 - 2 * transitT);

  const from = activeAction.fromPoint || { x: 0.5, y: 0.5 };
  const to = activeAction.toPoint || { x: 0.5, y: 0.5 };

  // Subtle upward arc lift simulating lifting marker tip slightly off the paper
  const jumpDist = Math.hypot(to.x - from.x, to.y - from.y);
  const arcLift = Math.min(0.012, jumpDist * 0.08);

  const tipX = from.x + (to.x - from.x) * easedT;
  const tipY =
    from.y + (to.y - from.y) * easedT - Math.sin(transitT * Math.PI) * arcLift;

  return {
    tipXNorm: tipX,
    tipYNorm: tipY,
    activeStrokeIndex: strokeIdx + 1,
    activeSegmentIndex: 0,
    completedStrokes: strokeIdx + 1, // Preceding stroke is fully completed
    strokeProgress: 0,
    isPenDown: false,
  };
}

