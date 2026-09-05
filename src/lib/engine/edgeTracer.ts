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

const DOODLE_ENGINE_VERSION = 7;

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
  const sourceWithVer = mediaSource as any;
  if (sourceWithVer.__doodleEngineVer === DOODLE_ENGINE_VERSION) {
    const cached = vectorCache.get(mediaSource);
    if (cached) return cached;
  }

  const vectorData = extractStrokesFromSource(mediaSource);
  sourceWithVer.__doodleEngineVer = DOODLE_ENGINE_VERSION;
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

  // 4. Extract dense-color painting/sketching strokes (VideoScribe / Doodly style for colored props like red car)
  const denseColorStrokes = extractDenseColorPaintingStrokes(
    data,
    w,
    h,
    detectedBgColor
  );

  if (rawStrokes.length === 0 && denseColorStrokes.length === 0) {
    return createFallbackVectorData(detectedBgColor);
  }

  // 5. Strict Text Completion & Stroke Sequencing with Default Speed
  const {
    finalStrokes,
    actions,
    totalLength,
    strokeStartDistances,
    actionStartDistances,
  } = sequenceDoodleStrokes(rawStrokes, denseColorStrokes);

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
 * Disjoint Set (Union-Find) for spatial clustering of text lines and words
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

interface ColorPatch {
  cells: Array<{ cx: number; cy: number }>;
  minCx: number;
  maxCx: number;
  minCy: number;
  maxCy: number;
}

/**
 * Detects regions with dense/saturated color fills (e.g. solid red car, colorful props/items)
 * and synthesizes back-and-forth zigzag / diagonal hatching painting strokes.
 * In VideoScribe / Doodly whiteboard style, the marker hand sweeps over the colored item
 * and reveals the rich color as if painting/sketching it in!
 */
function extractDenseColorPaintingStrokes(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  detectedBgColor: DetectedBgColor
): DoodlePoint[][] {
  const cellSize = 8;
  const gridW = Math.ceil(w / cellSize);
  const gridH = Math.ceil(h / cellSize);
  const colorGrid = new Uint8Array(gridW * gridH);
  const cellColorCounts = new Uint16Array(gridW * gridH);

  // 1. Mark dense colored pixels into coarse grid cells
  for (let y = 1; y < h - 1; y += 2) {
    const rowOffset = y * w;
    const cy = Math.floor(y / cellSize);
    for (let x = 1; x < w - 1; x += 2) {
      const idx = (rowOffset + x) * 4;
      const alpha = data[idx + 3];
      if (alpha < 40) continue;

      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      const maxC = Math.max(r, g, b);
      const minC = Math.min(r, g, b);
      const chroma = maxC - minC;
      const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

      // Distance from detected background color
      const bgDist =
        Math.abs(r - detectedBgColor.r) +
        Math.abs(g - detectedBgColor.g) +
        Math.abs(b - detectedBgColor.b);

      // Dense color test: saturated color prop/item (e.g. red car, colorful prop)
      // Excludes pure black line-art (lum < 0.12) and paper background (bgDist < 45 or lum > 0.90)
      if (chroma >= 32 && lum >= 0.12 && lum <= 0.88 && bgDist >= 45) {
        const cx = Math.floor(x / cellSize);
        cellColorCounts[cy * gridW + cx]++;
      }
    }
  }

  // A cell is colored if it has sufficient dense-color samples
  for (let i = 0; i < gridW * gridH; i++) {
    if (cellColorCounts[i] >= 3) {
      colorGrid[i] = 1;
    }
  }

  // 2. Connected-component flood fill to find distinct color props/patches
  const visited = new Uint8Array(gridW * gridH);
  const patches: ColorPatch[] = [];

  for (let cy = 0; cy < gridH; cy++) {
    for (let cx = 0; cx < gridW; cx++) {
      const idx = cy * gridW + cx;
      if (colorGrid[idx] === 1 && visited[idx] === 0) {
        const queue: Array<[number, number]> = [[cx, cy]];
        visited[idx] = 1;
        const cells: Array<{ cx: number; cy: number }> = [];
        let minCx = cx, maxCx = cx, minCy = cy, maxCy = cy;

        while (queue.length > 0) {
          const [currX, currY] = queue.pop()!;
          cells.push({ cx: currX, cy: currY });
          if (currX < minCx) minCx = currX;
          if (currX > maxCx) maxCx = currX;
          if (currY < minCy) minCy = currY;
          if (currY > maxCy) maxCy = currY;

          const neighbors = [
            [currX + 1, currY],
            [currX - 1, currY],
            [currX, currY + 1],
            [currX, currY - 1],
          ];

          for (const [nx, ny] of neighbors) {
            if (nx >= 0 && nx < gridW && ny >= 0 && ny < gridH) {
              const nIdx = ny * gridW + nx;
              if (colorGrid[nIdx] === 1 && visited[nIdx] === 0) {
                visited[nIdx] = 1;
                queue.push([nx, ny]);
              }
            }
          }
        }

        // Keep significant colored items/props (at least 5 coarse cells ~ 300+ pixels)
        if (cells.length >= 5) {
          patches.push({ cells, minCx, maxCx, minCy, maxCy });
        }
      }
    }
  }

  // 3. For each patch, synthesize back-and-forth zigzag / diagonal hatching painting strokes
  const paintingStrokes: DoodlePoint[][] = [];

  for (const patch of patches) {
    const rowMap = new Map<number, { minX: number; maxX: number }>();
    for (const cell of patch.cells) {
      const existing = rowMap.get(cell.cy);
      if (!existing) {
        rowMap.set(cell.cy, { minX: cell.cx, maxX: cell.cx });
      } else {
        if (cell.cx < existing.minX) existing.minX = cell.cx;
        if (cell.cx > existing.maxX) existing.maxX = cell.cx;
      }
    }

    const strokePoints: DoodlePoint[] = [];
    let ltr = true;

    // Scan through rows with step = 1 cell (8px step ensures 18-24px marker stroke fully overlaps)
    for (let r = patch.minCy; r <= patch.maxCy; r++) {
      const rowInfo = rowMap.get(r);
      if (!rowInfo) continue;

      const yNorm = Math.max(0.01, Math.min(0.99, (r * cellSize + cellSize / 2) / h));
      const leftXNorm = Math.max(0.01, Math.min(0.99, (rowInfo.minX * cellSize) / w));
      const rightXNorm = Math.max(0.01, Math.min(0.99, ((rowInfo.maxX + 1) * cellSize) / w));

      if (ltr) {
        strokePoints.push({ x: leftXNorm, y: yNorm });
        strokePoints.push({ x: rightXNorm, y: yNorm });
      } else {
        strokePoints.push({ x: rightXNorm, y: yNorm });
        strokePoints.push({ x: leftXNorm, y: yNorm });
      }
      ltr = !ltr;
    }

    if (strokePoints.length >= 2) {
      paintingStrokes.push(strokePoints);
    }
  }

  return paintingStrokes;
}

interface StrokeItem {
  id: number;
  points: DoodlePoint[];
  length: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  centerX: number;
  centerY: number;
  isSpanningLine: boolean;
  isDenseColor: boolean;
}

interface VisualEntity {
  id: number;
  strokes: StrokeItem[];
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  centerX: number;
  centerY: number;
  totalLength: number;
}

/**
 * Sequences strokes with strict localized visual entity cohesion:
 * 1. Each character, prop, or item is clustered into a bounded visual entity.
 * 2. Scene-spanning lines (e.g. broad table surface line, floor line) are separated so they never bridge characters together.
 * 3. Dense color painting strokes (e.g. green jacket, credit card colors) are merged directly into the entity occupying that region.
 * 4. Invariant: While drawing entity K, ALL of its strokes (contours, details, colors) are completed 100%
 *    before moving to entity K + 1. The hand draws step-by-step gracefully, completely eliminating random jumping!
 */
function sequenceDoodleStrokes(
  rawStrokes: DoodlePoint[][],
  denseColorStrokes: DoodlePoint[][] = []
): {
  finalStrokes: DoodleStroke[];
  actions: DoodleAction[];
  totalLength: number;
  strokeStartDistances: number[];
  actionStartDistances: number[];
} {
  const strokeItems: StrokeItem[] = [];
  let itemCounter = 0;

  // 1. Process raw edge contour strokes
  for (let i = 0; i < rawStrokes.length; i++) {
    const simplified = simplifyPoints(rawStrokes[i], 0.002);
    if (simplified.length < 2) continue;

    let len = 0;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

    for (let p = 0; p < simplified.length; p++) {
      const pt = simplified[p];
      if (pt.x < minX) minX = pt.x;
      if (pt.x > maxX) maxX = pt.x;
      if (pt.y < minY) minY = pt.y;
      if (pt.y > maxY) maxY = pt.y;
      if (p < simplified.length - 1) {
        len += Math.hypot(simplified[p + 1].x - pt.x, simplified[p + 1].y - pt.y);
      }
    }

    if (len < 0.003) continue; // Filter tiny single-pixel noise

    const width = maxX - minX;
    const height = maxY - minY;

    // Environmental spanning lines (e.g. broad horizontal table edge or tall room divider)
    // These must NOT bridge separate characters together into a single giant cluster
    const isSpanningLine =
      (width > 0.35 && height < 0.12) ||
      (height > 0.45 && width < 0.08);

    strokeItems.push({
      id: itemCounter++,
      points: simplified,
      length: len,
      minX,
      maxX,
      minY,
      maxY,
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2,
      isSpanningLine,
      isDenseColor: false,
    });
  }

  // 2. Process dense color painting strokes (VideoScribe / Doodly marker painting style)
  for (let i = 0; i < denseColorStrokes.length; i++) {
    const simplified = simplifyPoints(denseColorStrokes[i], 0.003);
    if (simplified.length < 2) continue;

    let len = 0;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

    for (let p = 0; p < simplified.length; p++) {
      const pt = simplified[p];
      if (pt.x < minX) minX = pt.x;
      if (pt.x > maxX) maxX = pt.x;
      if (pt.y < minY) minY = pt.y;
      if (pt.y > maxY) maxY = pt.y;
      if (p < simplified.length - 1) {
        len += Math.hypot(simplified[p + 1].x - pt.x, simplified[p + 1].y - pt.y);
      }
    }

    if (len < 0.015) continue;

    strokeItems.push({
      id: itemCounter++,
      points: simplified,
      length: len,
      minX,
      maxX,
      minY,
      maxY,
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2,
      isSpanningLine: false,
      isDenseColor: true,
    });
  }

  if (strokeItems.length === 0) {
    return {
      finalStrokes: [],
      actions: [],
      totalLength: 0,
      strokeStartDistances: [],
      actionStartDistances: [],
    };
  }

  // Separate spanning environment lines (table lines, horizon) from foreground entities
  const foregroundItems: StrokeItem[] = [];
  const spanningItems: StrokeItem[] = [];

  for (const item of strokeItems) {
    if (item.isSpanningLine) {
      spanningItems.push(item);
    } else {
      foregroundItems.push(item);
    }
  }

  // 3. Spatial clustering of foreground items using Union-Find
  const uf = new UnionFind(foregroundItems.length);

  interface ClusterBox {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    count: number;
    totalLen: number;
  }

  const clusterBoxes: ClusterBox[] = foregroundItems.map((s) => ({
    minX: s.minX,
    maxX: s.maxX,
    minY: s.minY,
    maxY: s.maxY,
    count: 1,
    totalLen: s.length,
  }));

  for (let i = 0; i < foregroundItems.length; i++) {
    const a = foregroundItems[i];
    for (let j = i + 1; j < foregroundItems.length; j++) {
      const b = foregroundItems[j];

      // Fast bounding box gap test
      const gapX = Math.max(0, Math.max(a.minX - b.maxX, b.minX - a.maxX));
      const gapY = Math.max(0, Math.max(a.minY - b.maxY, b.minY - a.maxY));
      if (gapX > 0.035 || gapY > 0.035) continue;

      let isClose = false;
      if (a.isDenseColor || b.isDenseColor) {
        // Dense color stroke merges directly with contour strokes in the same area
        if (gapX <= 0.020 && gapY <= 0.020) {
          isClose = true;
        }
      } else {
        // Point sampling test
        const stepA = Math.max(1, Math.floor(a.points.length / 5));
        const stepB = Math.max(1, Math.floor(b.points.length / 5));
        for (let pa = 0; pa < a.points.length; pa += stepA) {
          for (let pb = 0; pb < b.points.length; pb += stepB) {
            const d = Math.hypot(
              a.points[pa].x - b.points[pb].x,
              a.points[pa].y - b.points[pb].y
            );
            if (d <= 0.022) {
              isClose = true;
              break;
            }
          }
          if (isClose) break;
        }
      }

      if (isClose) {
        const rootI = uf.find(i);
        const rootJ = uf.find(j);
        if (rootI !== rootJ) {
          const boxI = clusterBoxes[rootI];
          const boxJ = clusterBoxes[rootJ];
          const combinedWidth = Math.max(boxI.maxX, boxJ.maxX) - Math.min(boxI.minX, boxJ.minX);

          // Entity Boundary Guard:
          // If merging these two clusters would create an entity wider than 0.32 of screen,
          // AND both clusters are already substantial visual objects, keep them as separate entities!
          if (
            combinedWidth > 0.32 &&
            (boxI.count >= 4 || boxI.totalLen > 0.15) &&
            (boxJ.count >= 4 || boxJ.totalLen > 0.15)
          ) {
            continue;
          }

          uf.union(i, j);
          const newRoot = uf.find(i);
          clusterBoxes[newRoot] = {
            minX: Math.min(boxI.minX, boxJ.minX),
            maxX: Math.max(boxI.maxX, boxJ.maxX),
            minY: Math.min(boxI.minY, boxJ.minY),
            maxY: Math.max(boxI.maxY, boxJ.maxY),
            count: boxI.count + boxJ.count,
            totalLen: boxI.totalLen + boxJ.totalLen,
          };
        }
      }
    }
  }

  // 4. Assemble Visual Entities
  const entityMap = new Map<number, StrokeItem[]>();
  for (let i = 0; i < foregroundItems.length; i++) {
    const root = uf.find(i);
    if (!entityMap.has(root)) entityMap.set(root, []);
    entityMap.get(root)!.push(foregroundItems[i]);
  }

  const visualEntities: VisualEntity[] = [];
  let entId = 0;

  for (const members of entityMap.values()) {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    let totalLen = 0;
    for (const m of members) {
      if (m.minX < minX) minX = m.minX;
      if (m.maxX > maxX) maxX = m.maxX;
      if (m.minY < minY) minY = m.minY;
      if (m.maxY > maxY) maxY = m.maxY;
      totalLen += m.length;
    }
    visualEntities.push({
      id: entId++,
      strokes: members,
      minX,
      maxX,
      minY,
      maxY,
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2,
      totalLength: totalLen,
    });
  }

  // 5. Sequence entities across the canvas (Left-to-Right / Top-to-Bottom)
  visualEntities.sort((a, b) => a.minX + a.minY * 0.4 - (b.minX + b.minY * 0.4));

  const orderedEntities: VisualEntity[] = [];
  let currentEntityPos = { x: 0.15, y: 0.20 };
  const remainingEntities = [...visualEntities];

  while (remainingEntities.length > 0) {
    let bestIdx = 0;
    let bestDist = Infinity;

    for (let i = 0; i < remainingEntities.length; i++) {
      const ent = remainingEntities[i];
      const dx = ent.centerX - currentEntityPos.x;
      const dy = ent.centerY - currentEntityPos.y;
      const xPenalty = dx < -0.05 ? 1.6 : 1.0;
      const dist = Math.hypot(dx * xPenalty, dy);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    }

    const nextEntity = remainingEntities.splice(bestIdx, 1)[0];
    orderedEntities.push(nextEntity);
    currentEntityPos = { x: nextEntity.centerX, y: nextEntity.centerY };
  }

  // 6. Sequence strokes WITHIN each entity:
  // INVARIANT: Every single stroke of entity K (contours, details, dense color fills)
  // is completed 100% before any stroke of entity K + 1 begins!
  const finalStrokes: DoodleStroke[] = [];
  let clusterIdx = 0;

  for (const entity of orderedEntities) {
    const contours = entity.strokes.filter((s) => !s.isDenseColor);
    const colorStrokes = entity.strokes.filter((s) => s.isDenseColor);

    if (contours.length > 0) {
      // Start at top-left of this entity
      contours.sort((a, b) => a.minY + a.minX * 0.3 - (b.minY + b.minX * 0.3));
      let current = contours.shift()!;

      const pStart = current.points[0];
      const pEnd = current.points[current.points.length - 1];
      if (
        pStart.y > pEnd.y + 0.01 ||
        (Math.abs(pStart.y - pEnd.y) <= 0.01 && pStart.x > pEnd.x)
      ) {
        current.points = current.points.slice().reverse();
      }

      finalStrokes.push({
        points: current.points,
        length: current.length,
        clusterIndex: clusterIdx,
      });

      // Nearest Neighbor strictly within this entity
      while (contours.length > 0) {
        const lastPt = current.points[current.points.length - 1];
        let bestIdx = 0;
        let bestDist = Infinity;
        let shouldReverse = false;

        for (let i = 0; i < contours.length; i++) {
          const s = contours[i];
          const sStart = s.points[0];
          const sEnd = s.points[s.points.length - 1];

          const dStart =
            (sStart.x - lastPt.x) ** 2 + (sStart.y - lastPt.y) ** 2;
          const dEnd =
            (sEnd.x - lastPt.x) ** 2 + (sEnd.y - lastPt.y) ** 2;

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

        const nextCandidate = contours.splice(bestIdx, 1)[0];
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
          clusterIndex: clusterIdx,
        });
      }
    }

    // Dense color painting strokes for this entity (e.g. coloring character's jacket)
    for (const cs of colorStrokes) {
      finalStrokes.push({
        points: cs.points,
        length: cs.length,
        clusterIndex: clusterIdx,
      });
    }

    clusterIdx++;
  }

  // 7. Finally, draw environmental / scene spanning lines (table edge, floor, background)
  if (spanningItems.length > 0) {
    spanningItems.sort((a, b) => a.minX - b.minX);
    for (const item of spanningItems) {
      const pStart = item.points[0];
      const pEnd = item.points[item.points.length - 1];
      if (pStart.x > pEnd.x) {
        item.points = item.points.slice().reverse();
      }
      finalStrokes.push({
        points: item.points,
        length: item.length,
        clusterIndex: clusterIdx,
      });
    }
    clusterIdx++;
  }

  // 8. Build Action Timeline with DEFAULT uniform speed
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

      // Smooth in-air transit between disconnected strokes/entities
      if (jumpDist > 0.003) {
        const transitLen = Math.max(0.006, Math.min(0.05, jumpDist * 0.35));
        actionStartDistances.push(cumulativeDist);
        actions.push({
          type: "transit",
          strokeIndex: s - 1,
          length: transitLen,
          startDistance: cumulativeDist,
          fromPoint: prevEnd,
          toPoint: currStart,
        });
        cumulativeDist += transitLen;
      }
    }

    // Default uniform stroke length (no speed analogies or artificial modulation)
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
 * Samples perimeter and corner pixels to accurately detect dominant background color of the image.
 * Uses dominant color histogram bucketing (16-step quantization) to ignore dark line art,
 * border strokes, or text that touch the perimeter.
 */
function detectImageBackgroundColor(
  data: Uint8ClampedArray,
  w: number,
  h: number
): DetectedBgColor {
  const samples: Array<[number, number, number]> = [];
  let transparentCount = 0;

  const samplePixel = (x: number, y: number) => {
    if (x < 0 || x >= w || y < 0 || y >= h) return;
    const idx = (y * w + x) * 4;
    const a = data[idx + 3];
    if (a < 30) {
      transparentCount++;
      return;
    }
    samples.push([data[idx], data[idx + 1], data[idx + 2]]);
  };

  // Sample 4 corner patches (4x4 each for robust corner coverage)
  for (let dy = 0; dy < 4; dy++) {
    for (let dx = 0; dx < 4; dx++) {
      samplePixel(dx, dy);
      samplePixel(w - 1 - dx, dy);
      samplePixel(dx, h - 1 - dy);
      samplePixel(w - 1 - dx, h - 1 - dy);
    }
  }

  // Sample perimeter border edges (step 2px for dense perimeter sampling)
  for (let x = 4; x < w - 4; x += 2) {
    samplePixel(x, 1);
    samplePixel(x, 2);
    samplePixel(x, h - 3);
    samplePixel(x, h - 2);
  }
  for (let y = 4; y < h - 4; y += 2) {
    samplePixel(1, y);
    samplePixel(2, y);
    samplePixel(w - 3, y);
    samplePixel(w - 2, y);
  }

  const totalTested = samples.length + transparentCount;
  if (transparentCount > totalTested * 0.6 || samples.length === 0) {
    return {
      r: 255,
      g: 255,
      b: 255,
      hex: "#FFFFFF",
      isDark: false,
      isTransparent: true,
    };
  }

  // Find dominant color bucket using 16-step quantization
  // This isolates the true paper background and rejects dark line art or colored edge objects
  const buckets = new Map<
    number,
    { count: number; sumR: number; sumG: number; sumB: number }
  >();

  for (const [r, g, b] of samples) {
    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    let bkt = buckets.get(key);
    if (!bkt) {
      bkt = { count: 0, sumR: 0, sumG: 0, sumB: 0 };
      buckets.set(key, bkt);
    }
    bkt.count++;
    bkt.sumR += r;
    bkt.sumG += g;
    bkt.sumB += b;
  }

  // Pick the dominant majority bucket
  let dominantBucket = { count: 0, sumR: 0, sumG: 0, sumB: 0 };
  for (const bkt of buckets.values()) {
    if (bkt.count > dominantBucket.count) {
      dominantBucket = bkt;
    }
  }

  let avgR = Math.round(dominantBucket.sumR / dominantBucket.count);
  let avgG = Math.round(dominantBucket.sumG / dominantBucket.count);
  let avgB = Math.round(dominantBucket.sumB / dominantBucket.count);

  // Whiteboard / light paper images often have faint compression noise (e.g. 245-254 RGB).
  // Snap near-white to pure #FFFFFF so the canvas and image match 100.000% seamlessly.
  if (avgR >= 240 && avgG >= 240 && avgB >= 240) {
    avgR = 255;
    avgG = 255;
    avgB = 255;
  } else if (avgR <= 16 && avgG <= 16 && avgB <= 16) {
    // Chalkboard deep black snapping
    avgR = 0;
    avgG = 0;
    avgB = 0;
  }

  const hex = `#${((1 << 24) + (avgR << 16) + (avgG << 8) + avgB)
    .toString(16)
    .slice(1)
    .toUpperCase()}`;
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

