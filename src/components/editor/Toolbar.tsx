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
  Check,
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
    <header className="flex min-h-16 shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-4 py-2">
      {/* Left: Logo */}
      <div className="flex min-w-0 items-center gap-3">
        <h1 className="font-mono text-sm font-semibold tracking-tight text-foreground">
          ScapeStudio
        </h1>
        {sourceFileName && (
          <>
            <span className="text-border">/</span>
            <span className="max-w-36 sm:max-w-48 truncate font-mono text-xs text-muted-foreground">
              {sourceFileName}
            </span>
          </>
        )}
      </div>

      {/* Center: Preview mode toggle */}
      {sourceImage && (
        <div className="flex flex-wrap items-center gap-2">
          <ToggleGroup
            type="single"
            value={previewMode}
            onValueChange={(v) => {
              if (v) setPreviewMode(v as PreviewMode);
            }}
          >
            <ToggleGroupItem
              value="split"
              className="min-h-11 gap-1 px-3 text-xs"
            >
              <Columns2 className="h-3 w-3" />
              Split
            </ToggleGroupItem>
            <ToggleGroupItem
              value="print"
              className="min-h-11 gap-1 px-3 text-xs"
            >
              <ImageIcon className="h-3 w-3" />
              Print
            </ToggleGroupItem>
            <ToggleGroupItem
              value="tshirt"
              className="min-h-11 gap-1 px-3 text-xs"
            >
              <Shirt className="h-3 w-3" />
              T-Shirt
            </ToggleGroupItem>
          </ToggleGroup>

          {/* T-shirt background color */}
          {(previewMode === "tshirt" || previewMode === "split") && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="min-h-11 min-w-11"
                  aria-label="Apparel preview background"
                >
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
                      <Check
                        size={15}
                        className="ml-auto text-primary"
                        aria-hidden
                      />
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
            className="min-h-11 min-w-11"
            onClick={() => setZoom(zoom / 1.2)}
            aria-label="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="w-12 text-center font-mono text-xs text-muted-foreground">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="min-h-11 min-w-11"
            onClick={() => setZoom(zoom * 1.2)}
            aria-label="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="min-h-11 min-w-11"
            onClick={resetViewport}
            aria-label="Fit image"
          >
            <Maximize className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="min-h-11 min-w-11"
            onClick={() => setShowGrid(!showGrid)}
            aria-label="Toggle crop grid"
          >
            <Grid3X3
              className={`h-4 w-4 ${showGrid ? "text-primary" : "text-muted-foreground"}`}
            />
          </Button>

          <div className="mx-2 h-4 w-px bg-border" />

          <Button
            variant="ghost"
            size="icon"
            className="min-h-11 min-w-11 text-muted-foreground hover:text-destructive"
            onClick={clearImage}
            aria-label="Close image"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </header>
  );
}
