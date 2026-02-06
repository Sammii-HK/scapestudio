"use client";

import { useEditorStore } from "@/lib/store/editor-store";
import type { PreviewMode } from "@/types/editor";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  X,
  ZoomIn,
  ZoomOut,
  Maximize,
  Grid3X3,
  Columns2,
  Image as ImageIcon,
  Shirt,
  Palette,
} from "lucide-react";

const TSHIRT_BACKGROUNDS = [
  { value: "checkerboard", label: "Transparency" },
  { value: "#000000", label: "Black" },
  { value: "#ffffff", label: "White" },
  { value: "#1a1a2e", label: "Navy" },
  { value: "#4a4a4a", label: "Gray" },
];

export function Toolbar() {
  const sourceImage = useEditorStore((s) => s.sourceImage);
  const sourceFileName = useEditorStore((s) => s.sourceFileName);
  const zoom = useEditorStore((s) => s.zoom);
  const showGrid = useEditorStore((s) => s.showGrid);
  const previewMode = useEditorStore((s) => s.previewMode);
  const tshirtBackground = useEditorStore((s) => s.tshirtBackground);
  const setZoom = useEditorStore((s) => s.setZoom);
  const setShowGrid = useEditorStore((s) => s.setShowGrid);
  const setPreviewMode = useEditorStore((s) => s.setPreviewMode);
  const setTshirtBackground = useEditorStore((s) => s.setTshirtBackground);
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

      {/* Center: Preview mode toggle */}
      {sourceImage && (
        <div className="flex items-center gap-2">
          <ToggleGroup
            type="single"
            value={previewMode}
            onValueChange={(v) => {
              if (v) setPreviewMode(v as PreviewMode);
            }}
          >
            <ToggleGroupItem value="split" className="h-7 gap-1 px-2 text-xs">
              <Columns2 className="h-3 w-3" />
              Split
            </ToggleGroupItem>
            <ToggleGroupItem value="print" className="h-7 gap-1 px-2 text-xs">
              <ImageIcon className="h-3 w-3" />
              Print
            </ToggleGroupItem>
            <ToggleGroupItem value="tshirt" className="h-7 gap-1 px-2 text-xs">
              <Shirt className="h-3 w-3" />
              T-Shirt
            </ToggleGroupItem>
          </ToggleGroup>

          {/* T-shirt background color */}
          {(previewMode === "tshirt" || previewMode === "split") && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <Palette className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center">
                {TSHIRT_BACKGROUNDS.map((bg) => (
                  <DropdownMenuItem
                    key={bg.value}
                    className="flex items-center gap-2 text-xs"
                    onClick={() => setTshirtBackground(bg.value)}
                  >
                    <div
                      className={`h-3 w-3 rounded-sm border border-border ${
                        bg.value === "checkerboard" ? "checkerboard" : ""
                      }`}
                      style={
                        bg.value !== "checkerboard"
                          ? { backgroundColor: bg.value }
                          : undefined
                      }
                    />
                    <span>{bg.label}</span>
                    {tshirtBackground === bg.value && (
                      <span className="ml-auto text-primary">&#10003;</span>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}

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
