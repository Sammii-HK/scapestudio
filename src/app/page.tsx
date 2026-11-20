"use client";

import { useEditorStore } from "@/lib/store/editor-store";
import { useImageProcessing } from "@/hooks/use-image-processing";
import { useNativeShare } from "@/hooks/use-native-share";
import { ImageUpload } from "@/components/editor/ImageUpload";
import { EditorCanvas } from "@/components/editor/EditorCanvas";
import { Toolbar } from "@/components/editor/Toolbar";
import { CropControls } from "@/components/editor/CropControls";
import { CurvesEditor } from "@/components/controls/CurvesEditor";
import { PresetManager } from "@/components/controls/PresetManager";
import { ThresholdSlider } from "@/components/controls/ThresholdSlider";
import { ExportPanel } from "@/components/editor/ExportPanel";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { DEFAULT_CURVES } from "@/types/editor";

export default function Home() {
  const sourceImage = useEditorStore((s) => s.sourceImage);
  const histogram = useEditorStore((s) => s.histogram);
  const curves = useEditorStore((s) => s.curves);
  const setCurves = useEditorStore((s) => s.setCurves);

  // Trigger processing whenever source/curves/threshold change
  useImageProcessing();
  // Mounted unconditionally at the page root (not under the sourceImage
  // check below) so window.__scapeShareReceived exists as early as
  // possible - the native side polls for it briefly on cold launch, but
  // that window is only a few seconds.
  useNativeShare();

  const isDefaultCurves =
    curves.length === 2 &&
    curves[0].x === 0 &&
    curves[0].y === 0 &&
    curves[1].x === 255 &&
    curves[1].y === 255;

  return (
    <div className="flex min-h-dvh w-full flex-col lg:h-dvh lg:overflow-hidden">
      <Toolbar />
      <main className="flex min-h-0 flex-1 flex-col lg:flex-row lg:overflow-hidden">
        {/* Canvas area */}
        <div
          className={`min-w-0 ${sourceImage ? "h-[min(60dvh,560px)] min-h-80 shrink-0 lg:h-auto lg:min-h-0 lg:flex-1" : "flex-1"}`}
        >
          {sourceImage ? <EditorCanvas /> : <ImageUpload />}
        </div>

        {/* Right panel */}
        {sourceImage && (
          <aside className="flex w-full shrink-0 flex-col border-t border-border bg-card lg:w-80 lg:overflow-y-auto lg:border-l lg:border-t-0">
            <CropControls />
            <Separator />

            {/* Curves section */}
            <div className="flex flex-col gap-3 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Curves
                </p>
                {!isDefaultCurves && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="min-h-11 min-w-11"
                    onClick={() => setCurves(DEFAULT_CURVES)}
                    title="Reset curves"
                    aria-label="Reset curves"
                  >
                    <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                )}
              </div>
              <PresetManager />
              <CurvesEditor histogram={histogram} />
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">
                  {curves.length} point{curves.length !== 1 ? "s" : ""}
                </Label>
              </div>
            </div>

            <Separator />

            {/* Threshold section */}
            <div className="flex flex-col gap-3 p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Threshold
              </p>
              <ThresholdSlider />
            </div>

            <Separator />

            {/* Export section */}
            <ExportPanel />
          </aside>
        )}
      </main>
    </div>
  );
}
