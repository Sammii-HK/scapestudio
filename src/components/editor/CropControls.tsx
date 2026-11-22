"use client";

import { useEditorStore, type AspectRatio } from "@/lib/store/editor-store";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Grid3X3, RotateCw } from "lucide-react";

const ASPECT_OPTIONS: { value: AspectRatio; label: string }[] = [
  { value: "free", label: "Free" },
  { value: "1:1", label: "1:1" },
  { value: "4:5", label: "4:5" },
  { value: "3:4", label: "3:4" },
];

export function CropControls() {
  const aspectRatio = useEditorStore((s) => s.aspectRatio);
  const showGrid = useEditorStore((s) => s.showGrid);
  const setAspectRatio = useEditorStore((s) => s.setAspectRatio);
  const setShowGrid = useEditorStore((s) => s.setShowGrid);
  const rotateCrop90 = useEditorStore((s) => s.rotateCrop90);
  const sourceImage = useEditorStore((s) => s.sourceImage);
  const crop = useEditorStore((s) => s.crop);
  const setCrop = useEditorStore((s) => s.setCrop);

  if (!sourceImage) return null;

  // Compute current crop pixel dims for display
  const cropWidthPx = Math.round(crop.width * sourceImage.width);
  const cropHeightPx = Math.round(crop.height * sourceImage.height);

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Crop
        </p>
        <Button
          variant="ghost"
          size="icon"
          className="h-11 w-11"
          onClick={() => setShowGrid(!showGrid)}
          title="Toggle grid"
          aria-label="Toggle crop grid in controls"
          aria-pressed={showGrid}
        >
          <Grid3X3
            className={`h-3.5 w-3.5 ${showGrid ? "text-primary" : "text-muted-foreground"}`}
          />
        </Button>
      </div>

      {/* Aspect ratio */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Aspect Ratio</Label>
        <ToggleGroup
          type="single"
          value={aspectRatio}
          onValueChange={(v) => {
            if (v) setAspectRatio(v as AspectRatio);
          }}
          className="justify-start"
        >
          {ASPECT_OPTIONS.map((opt) => (
            <ToggleGroupItem
              key={opt.value}
              value={opt.value}
              className="h-11 px-2.5 text-xs"
            >
              {opt.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {/* Rotation */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Orientation</Label>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="h-11 gap-1.5 text-xs"
            onClick={rotateCrop90}
            aria-label="Swap crop orientation"
          >
            <RotateCw className="h-3 w-3" />
            Swap orientation
          </Button>
        </div>
      </div>

      <Separator className="my-1" />

      <details className="text-xs text-muted-foreground">
        <summary className="flex min-h-11 cursor-pointer items-center">
          Edit exact crop
        </summary>
        <p className="mb-3">Pixel values use a free crop ratio.</p>
        <div className="grid grid-cols-2 gap-3">
          {(["x", "y", "width", "height"] as const).map((field) => {
            const dimension =
              field === "x" || field === "width"
                ? sourceImage.width
                : sourceImage.height;
            const sizeField = field === "width" || field === "height";
            const max =
              field === "x"
                ? (1 - crop.width) * dimension
                : field === "y"
                  ? (1 - crop.height) * dimension
                  : field === "width"
                    ? (1 - crop.x) * dimension
                    : (1 - crop.y) * dimension;
            return (
              <label key={field} className="flex flex-col gap-1 capitalize">
                {field} (px)
                <input
                  className="h-11 w-full rounded border border-border bg-background px-2"
                  type="number"
                  min={sizeField ? 1 : 0}
                  max={Math.floor(max)}
                  step={1}
                  value={Math.round(crop[field] * dimension)}
                  onChange={(event) => {
                    const value = Math.max(
                      sizeField ? 1 : 0,
                      Math.min(max, Number(event.target.value) || 0),
                    );
                    setAspectRatio("free");
                    setCrop({ [field]: value / dimension });
                  }}
                />
              </label>
            );
          })}
        </div>
      </details>

      {/* Dimensions display */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Selection</Label>
        <div className="flex gap-3 font-mono text-xs text-muted-foreground">
          <span>
            {cropWidthPx} × {cropHeightPx} px
          </span>
        </div>
      </div>
    </div>
  );
}
