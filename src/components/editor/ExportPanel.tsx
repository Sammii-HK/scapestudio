"use client";

import { useState } from "react";
import { exportDimensions } from "@/lib/export/export-plan";
import { useEditorStore } from "@/lib/store/editor-store";
import { runExport } from "@/lib/export/batch-export";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Download } from "lucide-react";

export function ExportPanel() {
  const sourceImage = useEditorStore((s) => s.sourceImage);
  const sourceFileName = useEditorStore((s) => s.sourceFileName);
  const crop = useEditorStore((s) => s.crop);
  const curves = useEditorStore((s) => s.curves);
  const threshold = useEditorStore((s) => s.threshold);
  const feather = useEditorStore((s) => s.feather);
  const exportSizes = useEditorStore((s) => s.exportSizes);
  const setExportSizes = useEditorStore((s) => s.setExportSizes);
  const isExporting = useEditorStore((s) => s.isExporting);
  const exportProgress = useEditorStore((s) => s.exportProgress);
  const setIsExporting = useEditorStore((s) => s.setIsExporting);
  const setExportProgress = useEditorStore((s) => s.setExportProgress);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const selectedCount = exportSizes.filter((size) => size.enabled).length;
  const anyEnabled = exportSizes.some((s) => s.enabled);

  function toggleSize(index: number) {
    const updated = exportSizes.map((s, i) =>
      i === index ? { ...s, enabled: !s.enabled } : s,
    );
    setExportSizes(updated);
  }

  async function handleExport() {
    if (!sourceImage || isExporting) return;

    setError("");
    setMessage("");
    setIsExporting(true);
    setExportProgress(0);

    try {
      await runExport(
        {
          sourceImage,
          curves,
          threshold,
          feather,
          crop: {
            x: crop.x,
            y: crop.y,
            width: crop.width,
            height: crop.height,
          },
          exportSizes,
          fileName: sourceFileName,
        },
        (progress) => setExportProgress(progress),
      );
      setMessage(
        `Your ZIP is ready: ${selectedCount * 3} PNGs, with colour, print and transparent artwork at each width.`,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? `${err.message} Try a smaller print width, then retry.`
          : "Export could not finish. Try a smaller print width, then retry.",
      );
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Export
      </p>

      <div className="flex flex-col gap-2">
        {exportSizes.map((size, i) => {
          const dimensions = sourceImage
            ? exportDimensions(size, sourceImage, crop)
            : null;
          return (
            <div key={size.label} className="flex min-h-11 items-center gap-2">
              <Checkbox
                id={`size-${i}`}
                checked={size.enabled}
                onCheckedChange={() => toggleSize(i)}
                disabled={isExporting}
              />
              <Label
                htmlFor={`size-${i}`}
                className="flex flex-1 items-center justify-between text-sm cursor-pointer"
              >
                <span>{size.widthCm} cm wide</span>
                <span className="text-xs text-muted-foreground">
                  {dimensions
                    ? `${dimensions.widthPx} × ${dimensions.heightPx}`
                    : ""}{" "}
                  px
                </span>
              </Label>
            </div>
          );
        })}
      </div>

      <div className="text-xs text-muted-foreground">
        300 DPI. Crop proportions are preserved.
      </div>

      {isExporting && (
        <Progress
          value={exportProgress}
          aria-label="Export progress"
          className="h-2"
        />
      )}

      <Button
        onClick={handleExport}
        disabled={!anyEnabled || isExporting || !sourceImage}
        className="min-h-11 w-full"
        size="sm"
      >
        <Download className="mr-2 h-4 w-4" />
        {isExporting
          ? `Exporting ${exportProgress}%`
          : `Download ${selectedCount * 3} PNGs`}
      </Button>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Each width includes the original colour crop, a grayscale print and
        transparent apparel artwork.
      </p>
      {!anyEnabled && (
        <p className="text-xs text-muted-foreground">
          Choose a print width to export.
        </p>
      )}
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
      <p role="status" className="text-xs text-muted-foreground">
        {isExporting ? `Preparing images: ${exportProgress}%` : message}
      </p>
    </div>
  );
}
