/// <reference lib="webworker" />

/**
 * Web Worker for batch export.
 * Produces print (grayscale + curves) and tshirt (+ threshold knockout) PNGs
 * at multiple target sizes.
 */

export interface ExportSizeSpec {
  label: string;
  widthPx: number;
  heightPx: number;
}

export interface ExportMessage {
  type: "export";
  sourceImageBitmap: ImageBitmap;
  curveLUT: Uint8Array;
  threshold: number;
  feather: number;
  crop: { x: number; y: number; width: number; height: number };
  sizes: ExportSizeSpec[];
  fileName: string;
}

export interface ExportProgress {
  type: "progress";
  current: number;
  total: number;
}

export interface ExportDone {
  type: "done";
  files: Array<{ name: string; blob: Blob }>;
}

// Inline processing functions (workers can't use @ aliases)

function applyGrayscale(data: Uint8ClampedArray): void {
  for (let i = 0; i < data.length; i += 4) {
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    data[i] = lum;
    data[i + 1] = lum;
    data[i + 2] = lum;
  }
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

ctx.addEventListener("message", async (e: MessageEvent<ExportMessage>) => {
  if (e.data.type !== "export") return;

  const { sourceImageBitmap, curveLUT, threshold, feather, crop, sizes, fileName } = e.data;

  const total = sizes.length * 2; // 2 outputs per size (print + tshirt)
  let current = 0;
  const files: Array<{ name: string; blob: Blob }> = [];

  // Source crop region in pixels
  const srcX = Math.round(crop.x * sourceImageBitmap.width);
  const srcY = Math.round(crop.y * sourceImageBitmap.height);
  const srcW = Math.round(crop.width * sourceImageBitmap.width);
  const srcH = Math.round(crop.height * sourceImageBitmap.height);

  for (const size of sizes) {
    const { label, widthPx, heightPx } = size;

    // Create canvas at target dimensions
    const canvas = new OffscreenCanvas(widthPx, heightPx);
    const canvasCtx = canvas.getContext("2d")!;

    // Draw cropped region scaled to target size
    canvasCtx.drawImage(
      sourceImageBitmap,
      srcX, srcY, srcW, srcH,
      0, 0, widthPx, heightPx
    );

    // Get pixel data and apply grayscale + curves
    const imageData = canvasCtx.getImageData(0, 0, widthPx, heightPx);
    applyGrayscale(imageData.data);
    applyCurveLUT(imageData.data, curveLUT);

    // Print PNG: put processed data back and export
    canvasCtx.putImageData(imageData, 0, 0);
    const printBlob = await canvas.convertToBlob({ type: "image/png" });
    files.push({
      name: `print/${fileName}_print_${label}_${widthPx}px.png`,
      blob: printBlob,
    });

    current++;
    ctx.postMessage({ type: "progress", current, total } as ExportProgress);

    // Tshirt PNG: clone data, apply threshold, export
    const tshirtData = new ImageData(
      new Uint8ClampedArray(imageData.data),
      widthPx,
      heightPx
    );
    applyThreshold(tshirtData.data, threshold, feather);
    canvasCtx.putImageData(tshirtData, 0, 0);
    const tshirtBlob = await canvas.convertToBlob({ type: "image/png" });
    files.push({
      name: `tshirt/${fileName}_tshirt_${label}_${widthPx}px.png`,
      blob: tshirtBlob,
    });

    current++;
    ctx.postMessage({ type: "progress", current, total } as ExportProgress);
  }

  ctx.postMessage({ type: "done", files } as ExportDone);
});
