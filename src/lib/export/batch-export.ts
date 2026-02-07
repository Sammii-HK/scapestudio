import JSZip from "jszip";
import { saveAs } from "file-saver";
import type { CurvePoints, ExportSize } from "@/types/editor";
import { generateCurveLUT } from "@/lib/image-processing/curves";

interface ExportParams {
  sourceImage: ImageBitmap;
  curves: CurvePoints;
  threshold: number;
  feather: number;
  crop: { x: number; y: number; width: number; height: number };
  exportSizes: ExportSize[];
  fileName: string;
}

type ProgressCallback = (progress: number) => void;

export async function runExport(
  params: ExportParams,
  onProgress: ProgressCallback
): Promise<void> {
  const { sourceImage, curves, threshold, feather, crop, exportSizes, fileName } = params;

  const enabledSizes = exportSizes.filter((s) => s.enabled);
  if (enabledSizes.length === 0) return;

  const curveLUT = generateCurveLUT(curves);

  const sizes = enabledSizes.map((s) => ({
    label: s.label,
    widthPx: Math.round((s.widthCm / 2.54) * s.dpi),
    heightPx: Math.round((s.heightCm / 2.54) * s.dpi),
  }));

  // Strip file extension from fileName for naming
  const baseName = fileName.replace(/\.[^.]+$/, "");

  // Create a copy of the source bitmap so the original in the store isn't consumed by transfer
  const bitmapCopy = await createImageBitmap(sourceImage);

  return new Promise<void>((resolve, reject) => {
    const worker = new Worker(
      new URL("../../workers/export.worker.ts", import.meta.url)
    );

    worker.addEventListener("message", async (e) => {
      const msg = e.data;

      if (msg.type === "progress") {
        const pct = Math.round((msg.current / msg.total) * 100);
        onProgress(pct);
      }

      if (msg.type === "done") {
        try {
          // Package into ZIP
          const zip = new JSZip();
          const folder = zip.folder(`${baseName}_export`)!;

          for (const file of msg.files as Array<{ name: string; blob: Blob }>) {
            folder.file(file.name, file.blob);
          }

          const zipBlob = await zip.generateAsync({ type: "blob" });
          saveAs(zipBlob, `${baseName}_export.zip`);

          onProgress(100);
        } catch (err) {
          reject(err);
        } finally {
          worker.terminate();
          resolve();
        }
      }
    });

    worker.addEventListener("error", (err) => {
      worker.terminate();
      reject(err);
    });

    worker.postMessage(
      {
        type: "export",
        sourceImageBitmap: bitmapCopy,
        curveLUT,
        threshold,
        feather,
        crop,
        sizes,
        fileName: baseName,
      },
      [bitmapCopy]
    );
  });
}
