"use client";

import { useEditorStore } from "@/lib/store/editor-store";
import { runExport } from "@/lib/export/batch-export";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Download } from "lucide-react";

function cmToPx(cm: number, dpi: number): number {
  return Math.round((cm / 2.54) * dpi);
}

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

  const anyEnabled = exportSizes.some((s) => s.enabled);

  function toggleSize(index: number) {
    const updated = exportSizes.map((s, i) =>
      i === index ? { ...s, enabled: !s.enabled } : s
    );
    setExportSizes(updated);
  }

  async function handleExport() {
    if (!sourceImage || isExporting) return;

    setIsExporting(true);
    setExportProgress(0);

    try {
      await runExport(
        {
          sourceImage,
          curves,
          threshold,
          feather,
          crop: { x: crop.x, y: crop.y, width: crop.width, height: crop.height },
          exportSizes,
          fileName: sourceFileName,
        },
        (progress) => setExportProgress(progress)
      );
    } catch (err) {
      console.error("Export failed:", err);
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
          const wpx = cmToPx(size.widthCm, size.dpi);
          return (
            <div key={size.label} className="flex items-center gap-2">
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
                <span>
                  {size.label} ({size.widthCm}cm)
                </span>
                <span className="text-xs text-muted-foreground">{wpx}px</span>
              </Label>
            </div>
          );
        })}
      </div>

      <div className="text-xs text-muted-foreground">DPI: 300</div>

      {isExporting && (
        <Progress value={exportProgress} className="h-2" />
      )}

      <Button
        onClick={handleExport}
        disabled={!anyEnabled || isExporting || !sourceImage}
        className="w-full"
        size="sm"
      >
        <Download className="mr-2 h-4 w-4" />
        {isExporting ? `Exporting ${exportProgress}%` : "Export ZIP"}
      </Button>
    </div>
  );
}
