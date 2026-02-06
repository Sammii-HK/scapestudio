"use client";

import { useEditorStore } from "@/lib/store/editor-store";
import { Button } from "@/components/ui/button";
import { X, ZoomIn, ZoomOut, Maximize, Grid3X3 } from "lucide-react";

export function Toolbar() {
  const sourceImage = useEditorStore((s) => s.sourceImage);
  const sourceFileName = useEditorStore((s) => s.sourceFileName);
  const zoom = useEditorStore((s) => s.zoom);
  const showGrid = useEditorStore((s) => s.showGrid);
  const setZoom = useEditorStore((s) => s.setZoom);
  const setShowGrid = useEditorStore((s) => s.setShowGrid);
  const resetViewport = useEditorStore((s) => s.resetViewport);
  const clearImage = useEditorStore((s) => s.clearImage);

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-card px-4">
      {/* Left: Logo */}
      <div className="flex items-center gap-3">
        <h1 className="font-mono text-sm font-semibold tracking-tight text-foreground">
          ScapeStudio
        </h1>
        {sourceFileName && (
          <>
            <span className="text-border">/</span>
            <span className="max-w-48 truncate font-mono text-xs text-muted-foreground">
              {sourceFileName}
            </span>
          </>
        )}
      </div>

      {/* Right: Actions */}
      {sourceImage && (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setZoom(zoom / 1.2)}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="w-12 text-center font-mono text-xs text-muted-foreground">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setZoom(zoom * 1.2)}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={resetViewport}
          >
            <Maximize className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setShowGrid(!showGrid)}
          >
            <Grid3X3
              className={`h-4 w-4 ${showGrid ? "text-primary" : "text-muted-foreground"}`}
            />
          </Button>

          <div className="mx-2 h-4 w-px bg-border" />

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={clearImage}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </header>
  );
}
