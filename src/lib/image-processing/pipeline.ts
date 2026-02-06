import type { CurvePoints } from "@/types/editor";
import { generateCurveLUT } from "./curves";

const PREVIEW_MAX_SIZE = 2000;
const DEBOUNCE_MS = 100;

interface ProcessResult {
  type: "result";
  printBitmap: ImageBitmap;
  tshirtBitmap: ImageBitmap;
  histogram: Uint32Array;
}

type ProcessCallback = (result: {
  printBitmap: ImageBitmap;
  tshirtBitmap: ImageBitmap;
  histogram: Uint32Array;
}) => void;

let worker: Worker | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let currentCallback: ProcessCallback | null = null;

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(
      new URL("../../workers/image-processor.worker.ts", import.meta.url)
    );
    worker.addEventListener("message", (e: MessageEvent<ProcessResult>) => {
      if (e.data.type === "result" && currentCallback) {
        currentCallback({
          printBitmap: e.data.printBitmap,
          tshirtBitmap: e.data.tshirtBitmap,
          histogram: e.data.histogram,
        });
      }
    });
  }
  return worker;
}

/**
 * Process an image through the grayscale + curves + threshold pipeline.
 * Debounced — rapid calls will only execute the last one.
 */
export function processImage(
  sourceImage: ImageBitmap,
  curves: CurvePoints,
  threshold: number,
  feather: number,
  onResult: ProcessCallback
): void {
  if (debounceTimer) clearTimeout(debounceTimer);

  debounceTimer = setTimeout(() => {
    currentCallback = onResult;
    const lut = generateCurveLUT(curves);
    const w = getWorker();

    w.postMessage({
      type: "process",
      imageBitmap: sourceImage,
      curveLUT: lut,
      threshold,
      feather,
      previewMaxSize: PREVIEW_MAX_SIZE,
    });
  }, DEBOUNCE_MS);
}

export function destroyWorker(): void {
  if (worker) {
    worker.terminate();
    worker = null;
  }
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  currentCallback = null;
}
