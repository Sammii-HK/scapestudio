"use client";

import { useEditorStore } from "@/lib/store/editor-store";
import { ImageUpload } from "@/components/editor/ImageUpload";
import { EditorCanvas } from "@/components/editor/EditorCanvas";
import { Toolbar } from "@/components/editor/Toolbar";
import { CropControls } from "@/components/editor/CropControls";
import { Separator } from "@/components/ui/separator";

export default function Home() {
  const sourceImage = useEditorStore((s) => s.sourceImage);

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
            {/* Phase 3+ controls will go here */}
            <div className="p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Curves
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Coming in Phase 3.
              </p>
            </div>
          </aside>
        )}
      </main>
    </div>
  );
}
