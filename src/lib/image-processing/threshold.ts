/**
 * Apply threshold knockout: pixels with luminance <= threshold become transparent.
 * With feather > 0, pixels between (threshold - feather) and threshold get partial alpha.
 *
 * Operates on already-grayscale data (R=G=B), modifies alpha channel in place.
 */
export function applyThreshold(
  data: Uint8ClampedArray,
  threshold: number,
  feather: number = 0
): void {
  const lower = Math.max(0, threshold - feather);

  for (let i = 0; i < data.length; i += 4) {
    const lum = data[i]; // R channel (same as G and B for grayscale)

    if (lum <= lower) {
      // Fully transparent
      data[i + 3] = 0;
    } else if (lum <= threshold && feather > 0) {
      // Feathered zone: partial transparency
      const alpha = ((lum - lower) / feather) * 255;
      data[i + 3] = Math.round(alpha);
    }
    // else: alpha unchanged (fully opaque)
  }
}
