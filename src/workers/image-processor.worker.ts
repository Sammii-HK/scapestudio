/// <reference lib="webworker" />

/**
 * Web Worker for image processing.
 * Produces both print (grayscale + curves) and tshirt (+ threshold knockout) bitmaps.
 */

export interface ProcessMessage {
  type: "process";
  imageBitmap: ImageBitmap;
  curveLUT: Uint8Array;
  threshold: number;
  feather: number;
  previewMaxSize: number;
}

export interface ProcessResult {
  type: "result";
  printBitmap: ImageBitmap;
  tshirtBitmap: ImageBitmap;
  histogram: Uint32Array;
}

// Inline processing functions (workers can't use @ path aliases)

function applyGrayscale(data: Uint8ClampedArray): void {
  for (let i = 0; i < data.length; i += 4) {
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    data[i] = lum;
    data[i + 1] = lum;
    data[i + 2] = lum;
  }
}

function computeHistogram(data: Uint8ClampedArray): Uint32Array {
  const histogram = new Uint32Array(256);
  for (let i = 0; i < data.length; i += 4) {
    const lum = Math.round(
      0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
    );
    histogram[lum]++;
  }
  return histogram;
}

function applyCurveLUT(data: Uint8ClampedArray, lut: Uint8Array): void {
  for (let i = 0; i < data.length; i += 4) {
    const v = lut[data[i]];
    data[i] = v;
    data[i + 1] = v;
    data[i + 2] = v;
  }
}

function applyThreshold(
  data: Uint8ClampedArray,
  threshold: number,
  feather: number
): void {
  const lower = Math.max(0, threshold - feather);

  for (let i = 0; i < data.length; i += 4) {
    const lum = data[i];

    if (lum <= lower) {
      data[i + 3] = 0;
    } else if (lum <= threshold && feather > 0) {
      const alpha = ((lum - lower) / feather) * 255;
      data[i + 3] = Math.round(alpha);
    }
  }
}

const ctx = self as unknown as DedicatedWorkerGlobalScope;

ctx.addEventListener("message", async (e: MessageEvent<ProcessMessage>) => {
  if (e.data.type !== "process") return;

  const { imageBitmap, curveLUT, threshold, feather, previewMaxSize } = e.data;

  // Determine preview dimensions
  const scale = Math.min(
    1,
    previewMaxSize / Math.max(imageBitmap.width, imageBitmap.height)
  );
  const width = Math.round(imageBitmap.width * scale);
  const height = Math.round(imageBitmap.height * scale);

  // Draw source onto OffscreenCanvas
  const canvas = new OffscreenCanvas(width, height);
  const canvasCtx = canvas.getContext("2d")!;
  canvasCtx.drawImage(imageBitmap, 0, 0, width, height);

  // Get pixel data
  const imageData = canvasCtx.getImageData(0, 0, width, height);

  // Compute histogram from original color data
  const histogram = computeHistogram(imageData.data);

  // Apply grayscale + curves
  applyGrayscale(imageData.data);
  applyCurveLUT(imageData.data, curveLUT);

  // Print version: create bitmap directly from ImageData (avoids canvas premultiply)
  const printBitmap = await createImageBitmap(imageData);

  // Tshirt version: clone processed data, apply threshold, create bitmap directly
  const tshirtData = new ImageData(
    new Uint8ClampedArray(imageData.data),
    width,
    height
  );
  applyThreshold(tshirtData.data, threshold, feather);
  const tshirtBitmap = await createImageBitmap(tshirtData);

  const result: ProcessResult = {
    type: "result",
    printBitmap,
    tshirtBitmap,
    histogram,
  };

  ctx.postMessage(result, [printBitmap, tshirtBitmap, histogram.buffer]);
});
