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
          className="h-7 w-7"
          onClick={() => setShowGrid(!showGrid)}
          title="Toggle grid"
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
              className="h-7 px-2.5 text-xs"
            >
              {opt.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {/* Rotation */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Rotation</Label>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="h-7 gap-1.5 text-xs"
            onClick={rotateCrop90}
          >
            <RotateCw className="h-3 w-3" />
            90°
          </Button>
          <span className="font-mono text-xs text-muted-foreground">
            {crop.rotation}°
          </span>
        </div>
      </div>

      <Separator className="my-1" />

      {/* Dimensions display */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Selection</Label>
        <div className="flex gap-3 font-mono text-xs text-muted-foreground">
          <span>{cropWidthPx} × {cropHeightPx} px</span>
        </div>
      </div>
    </div>
  );
}
