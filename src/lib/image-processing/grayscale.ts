/**
 * Convert RGBA image data to grayscale using luminosity method.
 * Modifies the ImageData in place: sets R=G=B=luminance, preserves alpha.
 */
export function applyGrayscale(data: Uint8ClampedArray): void {
  for (let i = 0; i < data.length; i += 4) {
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    data[i] = lum;
    data[i + 1] = lum;
    data[i + 2] = lum;
    // alpha (data[i + 3]) unchanged
  }
}

/**
 * Compute a luminance histogram from RGBA image data.
 * Returns a Uint32Array of length 256 with pixel counts per luminance value.
 */
export function computeHistogram(data: Uint8ClampedArray): Uint32Array {
  const histogram = new Uint32Array(256);
  for (let i = 0; i < data.length; i += 4) {
    const lum = Math.round(
      0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
    );
    histogram[lum]++;
  }
  return histogram;
}
