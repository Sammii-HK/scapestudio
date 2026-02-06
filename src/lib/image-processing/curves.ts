import type { CurvePoints } from "@/types/editor";

/**
 * Generate a 256-entry lookup table from curve control points using
 * monotone cubic Hermite interpolation (Fritsch-Carlson method).
 *
 * This ensures:
 * - The curve passes through all control points exactly
 * - No overshoot (monotone within each segment)
 * - Smooth, natural-looking results
 */
export function generateCurveLUT(points: CurvePoints): Uint8Array {
  const lut = new Uint8Array(256);

  // Need at least 2 points
  if (points.length < 2) {
    for (let i = 0; i < 256; i++) lut[i] = i;
    return lut;
  }

  // Sort by x
  const sorted = [...points].sort((a, b) => a.x - b.x);
  const n = sorted.length;

  // If only 2 points, use linear interpolation
  if (n === 2) {
    const [p0, p1] = sorted;
    for (let x = 0; x < 256; x++) {
      if (x <= p0.x) {
        lut[x] = clamp(p0.y);
      } else if (x >= p1.x) {
        lut[x] = clamp(p1.y);
      } else {
        const t = (x - p0.x) / (p1.x - p0.x);
        lut[x] = clamp(p0.y + t * (p1.y - p0.y));
      }
    }
    return lut;
  }

  // Compute deltas and slopes between consecutive points
  const dx: number[] = [];
  const dy: number[] = [];
  const slopes: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx.push(sorted[i + 1].x - sorted[i].x);
    dy.push(sorted[i + 1].y - sorted[i].y);
    slopes.push(dx[i] === 0 ? 0 : dy[i] / dx[i]);
  }

  // Compute tangents using Fritsch-Carlson method
  const tangents: number[] = new Array(n);

  // Endpoints: use one-sided differences
  tangents[0] = slopes[0];
  tangents[n - 1] = slopes[n - 2];

  // Interior points
  for (let i = 1; i < n - 1; i++) {
    if (slopes[i - 1] * slopes[i] <= 0) {
      // Sign change or zero — flat tangent to ensure monotonicity
      tangents[i] = 0;
    } else {
      // Harmonic mean of slopes (Fritsch-Carlson)
      tangents[i] = (3 * (dx[i - 1] + dx[i])) /
        ((2 * dx[i] + dx[i - 1]) / slopes[i - 1] +
         (dx[i] + 2 * dx[i - 1]) / slopes[i]);
    }
  }

  // Fritsch-Carlson: adjust tangents to ensure monotonicity
  for (let i = 0; i < n - 1; i++) {
    if (Math.abs(slopes[i]) < 1e-10) {
      tangents[i] = 0;
      tangents[i + 1] = 0;
    } else {
      const alpha = tangents[i] / slopes[i];
      const beta = tangents[i + 1] / slopes[i];
      // Restrict to the circle of radius 3
      const mag = alpha * alpha + beta * beta;
      if (mag > 9) {
        const tau = 3 / Math.sqrt(mag);
        tangents[i] = tau * alpha * slopes[i];
        tangents[i + 1] = tau * beta * slopes[i];
      }
    }
  }

  // Evaluate the cubic Hermite spline for each x from 0-255
  for (let x = 0; x < 256; x++) {
    if (x <= sorted[0].x) {
      lut[x] = clamp(sorted[0].y);
      continue;
    }
    if (x >= sorted[n - 1].x) {
      lut[x] = clamp(sorted[n - 1].y);
      continue;
    }

    // Find which segment x falls in
    let seg = 0;
    for (let i = 0; i < n - 1; i++) {
      if (x >= sorted[i].x && x <= sorted[i + 1].x) {
        seg = i;
        break;
      }
    }

    const p0 = sorted[seg];
    const p1 = sorted[seg + 1];
    const h = p1.x - p0.x;

    if (h === 0) {
      lut[x] = clamp(p0.y);
      continue;
    }

    const t = (x - p0.x) / h;
    const t2 = t * t;
    const t3 = t2 * t;

    // Hermite basis functions
    const h00 = 2 * t3 - 3 * t2 + 1;
    const h10 = t3 - 2 * t2 + t;
    const h01 = -2 * t3 + 3 * t2;
    const h11 = t3 - t2;

    const value = h00 * p0.y + h10 * h * tangents[seg] +
                  h01 * p1.y + h11 * h * tangents[seg + 1];

    lut[x] = clamp(value);
  }

  return lut;
}

/**
 * Apply a curve LUT to grayscale image data in place.
 * Assumes R=G=B (grayscale). Maps each channel through the LUT.
 */
export function applyCurveLUT(
  data: Uint8ClampedArray,
  lut: Uint8Array
): void {
  for (let i = 0; i < data.length; i += 4) {
    const v = lut[data[i]];
    data[i] = v;
    data[i + 1] = v;
    data[i + 2] = v;
    // alpha unchanged
  }
}

function clamp(v: number): number {
  return Math.max(0, Math.min(255, Math.round(v)));
}
