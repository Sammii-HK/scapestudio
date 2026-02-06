"use client";

import { useEditorStore } from "@/lib/store/editor-store";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ThresholdSlider() {
  const threshold = useEditorStore((s) => s.threshold);
  const feather = useEditorStore((s) => s.feather);
  const setThreshold = useEditorStore((s) => s.setThreshold);
  const setFeather = useEditorStore((s) => s.setFeather);

  return (
    <div className="flex flex-col gap-3">
      {/* Main threshold slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Black Knockout</Label>
          <Input
            type="number"
            min={0}
            max={255}
            value={threshold}
            onChange={(e) => setThreshold(Math.max(0, Math.min(255, Number(e.target.value) || 0)))}
            className="h-6 w-14 px-1.5 text-center font-mono text-xs"
          />
        </div>
        <Slider
          min={0}
          max={255}
          step={1}
          value={[threshold]}
          onValueChange={([v]) => setThreshold(v)}
        />
      </div>

      {/* Feather slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Feather</Label>
          <Input
            type="number"
            min={0}
            max={50}
            value={feather}
            onChange={(e) => setFeather(Math.max(0, Math.min(50, Number(e.target.value) || 0)))}
            className="h-6 w-14 px-1.5 text-center font-mono text-xs"
          />
        </div>
        <Slider
          min={0}
          max={50}
          step={1}
          value={[feather]}
          onValueChange={([v]) => setFeather(v)}
        />
      </div>
    </div>
  );
}
