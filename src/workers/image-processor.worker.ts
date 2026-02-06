/// <reference lib="webworker" />

/**
 * Web Worker for image processing.
 * Note: We inline the processing functions here because workers
 * can't use @ path aliases with Next.js bundling.
 */

export interface ProcessMessage {
  type: "process";
  imageBitmap: ImageBitmap;
  curveLUT: Uint8Array;
  previewMaxSize: number;
}

export interface ProcessResult {
  type: "result";
  printBitmap: ImageBitmap;
  histogram: Uint32Array;
}

// Inline grayscale processing
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

// Inline curves LUT application
function applyCurveLUT(data: Uint8ClampedArray, lut: Uint8Array): void {
  for (let i = 0; i < data.length; i += 4) {
    const v = lut[data[i]];
    data[i] = v;
    data[i + 1] = v;
    data[i + 2] = v;
  }
}

const ctx = self as unknown as DedicatedWorkerGlobalScope;

ctx.addEventListener("message", (e: MessageEvent<ProcessMessage>) => {
  if (e.data.type !== "process") return;

  const { imageBitmap, curveLUT, previewMaxSize } = e.data;

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

  // Apply grayscale
  applyGrayscale(imageData.data);

  // Apply curves LUT
  applyCurveLUT(imageData.data, curveLUT);

  // Write back
  canvasCtx.putImageData(imageData, 0, 0);

  // Transfer as ImageBitmap
  const printBitmap = canvas.transferToImageBitmap();

  const result: ProcessResult = {
    type: "result",
    printBitmap,
    histogram,
  };

  ctx.postMessage(result, [printBitmap, histogram.buffer]);
});
