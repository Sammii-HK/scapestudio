"use client";

import { useRef, useEffect, useCallback, useState, useMemo } from "react";
import { useEditorStore } from "@/lib/store/editor-store";
import { CropOverlay } from "@/components/editor/CropOverlay";

const CHECKERBOARD_SIZE = 12;

function drawCheckerboard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  const light = "#1e1e1e";
  const dark = "#121212";

  for (let row = Math.floor(y / CHECKERBOARD_SIZE); row * CHECKERBOARD_SIZE < y + h; row++) {
    for (let col = Math.floor(x / CHECKERBOARD_SIZE); col * CHECKERBOARD_SIZE < x + w; col++) {
      ctx.fillStyle = (row + col) % 2 === 0 ? light : dark;
      ctx.fillRect(
        col * CHECKERBOARD_SIZE,
        row * CHECKERBOARD_SIZE,
        CHECKERBOARD_SIZE,
        CHECKERBOARD_SIZE
      );
    }
  }
  ctx.restore();
}

/**
 * Draw the tshirt preview showing only the cropped region, fit to the available area.
 */
function drawTshirtCropped(
  ctx: CanvasRenderingContext2D,
  tshirtImg: ImageBitmap,
  crop: { x: number; y: number; width: number; height: number },
  areaX: number,
  areaY: number,
  areaW: number,
  areaH: number,
  background: string,
  zoom: number,
  panX: number,
  panY: number
) {
  // Source region in the tshirt bitmap (crop is normalized 0-1)
  const sx = crop.x * tshirtImg.width;
  const sy = crop.y * tshirtImg.height;
  const sw = crop.width * tshirtImg.width;
  const sh = crop.height * tshirtImg.height;

  // Fit cropped region into available area
  const fitScale = Math.min(
    (areaW - 40) / sw,
    (areaH - 40) / sh
  );
  const displayW = sw * fitScale * zoom;
  const displayH = sh * fitScale * zoom;
  const dx = areaX + (areaW - displayW) / 2 + panX;
  const dy = areaY + (areaH - displayH) / 2 + panY;

  // Background
  if (background === "checkerboard") {
    drawCheckerboard(ctx, dx, dy, displayW, displayH);
  } else {
    ctx.fillStyle = background;
    ctx.fillRect(dx, dy, displayW, displayH);
  }

  // Draw cropped region
  ctx.drawImage(tshirtImg, sx, sy, sw, sh, dx, dy, displayW, displayH);
}

export function EditorCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sourceImage = useEditorStore((s) => s.sourceImage);
  const processedImage = useEditorStore((s) => s.processedImage);
  const tshirtImage = useEditorStore((s) => s.tshirtImage);
  const crop = useEditorStore((s) => s.crop);
  const previewMode = useEditorStore((s) => s.previewMode);
  const tshirtBackground = useEditorStore((s) => s.tshirtBackground);
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

  // Compute imageRect for the print/source image display
  const imageRect = useMemo(() => {
    if (!sourceImage || containerSize.width === 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    const availableWidth =
      previewMode === "split"
        ? (containerSize.width - 16) / 2
        : containerSize.width;

    const fitScale = Math.min(
      (availableWidth - 40) / sourceImage.width,
      (containerSize.height - 40) / sourceImage.height
    );

    const displayWidth = sourceImage.width * fitScale * zoom;
    const displayHeight = sourceImage.height * fitScale * zoom;

    if (previewMode === "split") {
      const halfW = containerSize.width / 2;
      const x = (halfW - displayWidth) / 2 + panX;
      const y = (containerSize.height - displayHeight) / 2 + panY;
      return { x, y, width: displayWidth, height: displayHeight };
    }

    const x = (containerSize.width - displayWidth) / 2 + panX;
    const y = (containerSize.height - displayHeight) / 2 + panY;
    return { x, y, width: displayWidth, height: displayHeight };
  }, [sourceImage, containerSize, zoom, panX, panY, previewMode]);

  // Draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !sourceImage || containerSize.width === 0) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = containerSize.width * dpr;
    canvas.height = containerSize.height * dpr;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, containerSize.width, containerSize.height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    const printImg = processedImage ?? sourceImage;
    const tshirtImg = tshirtImage;
    const ir = imageRect;

    if (previewMode === "split") {
      const halfW = containerSize.width / 2;

      // Left: Print (full image with crop overlay handled by DOM)
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, halfW - 1, containerSize.height);
      ctx.clip();
      ctx.drawImage(printImg, ir.x, ir.y, ir.width, ir.height);
      ctx.restore();

      // Divider
      ctx.fillStyle = "#2a2a2a";
      ctx.fillRect(halfW - 1, 0, 2, containerSize.height);

      // Right: T-shirt (cropped final)
      ctx.save();
      ctx.beginPath();
      ctx.rect(halfW + 1, 0, halfW - 1, containerSize.height);
      ctx.clip();

      if (tshirtImg) {
        drawTshirtCropped(
          ctx,
          tshirtImg,
          crop,
          halfW + 1,
          0,
          halfW - 1,
          containerSize.height,
          tshirtBackground,
          zoom,
          panX,
          panY
        );
      }
      ctx.restore();

      // Labels
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.font = "10px var(--font-geist-mono), monospace";
      ctx.textAlign = "center";
      ctx.fillText("PRINT", halfW / 2, 20);
      ctx.fillText("T-SHIRT", halfW + halfW / 2, 20);

    } else if (previewMode === "print") {
      ctx.drawImage(printImg, ir.x, ir.y, ir.width, ir.height);

    } else if (previewMode === "tshirt") {
      if (tshirtImg) {
        drawTshirtCropped(
          ctx,
          tshirtImg,
          crop,
          0,
          0,
          containerSize.width,
          containerSize.height,
          tshirtBackground,
          zoom,
          panX,
          panY
        );
      }
    }
  }, [sourceImage, processedImage, tshirtImage, crop, containerSize, imageRect, previewMode, tshirtBackground, zoom, panX, panY]);

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

      {/* Crop overlay — only show in print or split (left side only) */}
      {sourceImage && imageRect.width > 0 && previewMode !== "tshirt" && (
        <CropOverlay imageRect={imageRect} />
      )}

      {/* Zoom indicator */}
      <div className="absolute bottom-3 right-3 rounded-md bg-secondary/80 px-2 py-1 font-mono text-xs text-muted-foreground backdrop-blur-sm">
        {Math.round(zoom * 100)}%
      </div>
    </div>
  );
}
