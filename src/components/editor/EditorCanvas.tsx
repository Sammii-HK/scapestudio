"use client";

import { useRef, useEffect, useCallback, useState, useMemo } from "react";
import { useEditorStore } from "@/lib/store/editor-store";
import { CropOverlay } from "@/components/editor/CropOverlay";

export function EditorCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sourceImage = useEditorStore((s) => s.sourceImage);
  const processedImage = useEditorStore((s) => s.processedImage);
  const zoom = useEditorStore((s) => s.zoom);
  const panX = useEditorStore((s) => s.panX);
  const panY = useEditorStore((s) => s.panY);
  const setZoom = useEditorStore((s) => s.setZoom);
  const setPan = useEditorStore((s) => s.setPan);

  const [isPanning, setIsPanning] = useState(false);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  // Track container size via ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Compute imageRect from state (no side effects)
  const imageRect = useMemo(() => {
    if (!sourceImage || containerSize.width === 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    const fitScale = Math.min(
      (containerSize.width - 40) / sourceImage.width,
      (containerSize.height - 40) / sourceImage.height
    );

    const displayWidth = sourceImage.width * fitScale * zoom;
    const displayHeight = sourceImage.height * fitScale * zoom;
    const x = (containerSize.width - displayWidth) / 2 + panX;
    const y = (containerSize.height - displayHeight) / 2 + panY;

    return { x, y, width: displayWidth, height: displayHeight };
  }, [sourceImage, containerSize, zoom, panX, panY]);

  // Draw the image on the canvas (processed if available, otherwise source)
  const displayImage = processedImage ?? sourceImage;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !displayImage || containerSize.width === 0) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = containerSize.width * dpr;
    canvas.height = containerSize.height * dpr;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, containerSize.width, containerSize.height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(displayImage, imageRect.x, imageRect.y, imageRect.width, imageRect.height);
  }, [displayImage, containerSize, imageRect]);

  // Mouse wheel zoom
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom(zoom * delta);
    },
    [zoom, setZoom]
  );

  // Pan handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 1 || (e.button === 0 && e.altKey)) {
        setIsPanning(true);
        panStartRef.current = {
          x: e.clientX,
          y: e.clientY,
          panX,
          panY,
        };
      }
    },
    [panX, panY]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning) return;
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      setPan(panStartRef.current.panX + dx, panStartRef.current.panY + dy);
    },
    [isPanning, setPan]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden bg-[#0a0a0a]"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <canvas
        ref={canvasRef}
        className={`h-full w-full ${isPanning ? "cursor-grabbing" : "cursor-default"}`}
      />

      {/* Crop overlay */}
      {sourceImage && imageRect.width > 0 && (
        <CropOverlay imageRect={imageRect} />
      )}

      {/* Zoom indicator */}
      <div className="absolute bottom-3 right-3 rounded-md bg-secondary/80 px-2 py-1 font-mono text-xs text-muted-foreground backdrop-blur-sm">
        {Math.round(zoom * 100)}%
      </div>
    </div>
  );
}
