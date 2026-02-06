"use client";

import { useEditorStore } from "@/lib/store/editor-store";
import { useImageProcessing } from "@/hooks/use-image-processing";
import { ImageUpload } from "@/components/editor/ImageUpload";
import { EditorCanvas } from "@/components/editor/EditorCanvas";
import { Toolbar } from "@/components/editor/Toolbar";
import { CropControls } from "@/components/editor/CropControls";
import { CurvesEditor } from "@/components/controls/CurvesEditor";
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

  // Trigger processing whenever source/curves change
  useImageProcessing();

  const isDefaultCurves =
    curves.length === 2 &&
    curves[0].x === 0 && curves[0].y === 0 &&
    curves[1].x === 255 && curves[1].y === 255;

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden">
      <Toolbar />
      <main className="flex flex-1 overflow-hidden">
        {/* Canvas area */}
        <div className="flex-1">
          {sourceImage ? <EditorCanvas /> : <ImageUpload />}
        </div>

        {/* Right panel */}
        {sourceImage && (
          <aside className="flex w-72 flex-col overflow-y-auto border-l border-border bg-card">
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
                    className="h-7 w-7"
                    onClick={() => setCurves(DEFAULT_CURVES)}
                    title="Reset curves"
                  >
                    <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                )}
              </div>
              <CurvesEditor histogram={histogram} />
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">
                  {curves.length} point{curves.length !== 1 ? "s" : ""}
                </Label>
              </div>
            </div>

            <Separator />

            {/* Threshold placeholder for Phase 5 */}
            <div className="p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Threshold
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Coming in Phase 5.
              </p>
            </div>
          </aside>
        )}
      </main>
    </div>
  );
}
