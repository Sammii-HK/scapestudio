"use client";

import { useCallback, useRef, useState } from "react";
import { useEditorStore } from "@/lib/store/editor-store";

type HandlePosition =
  | "tl" | "tr" | "bl" | "br"
  | "t" | "b" | "l" | "r"
  | "move";

interface ImageRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CropOverlayProps {
  imageRect: ImageRect;
}

const HANDLE_SIZE = 8;

export function CropOverlay({ imageRect }: CropOverlayProps) {
  const crop = useEditorStore((s) => s.crop);
  const aspectRatio = useEditorStore((s) => s.aspectRatio);
  const showGrid = useEditorStore((s) => s.showGrid);
  const setCrop = useEditorStore((s) => s.setCrop);
  const sourceImage = useEditorStore((s) => s.sourceImage);

  const [activeHandle, setActiveHandle] = useState<HandlePosition | null>(null);
  const dragStartRef = useRef({
    mouseX: 0,
    mouseY: 0,
    cropX: 0,
    cropY: 0,
    cropW: 0,
    cropH: 0,
  });

  // Convert normalized crop coords to pixel coords within the container
  const cropPixels = {
    x: imageRect.x + crop.x * imageRect.width,
    y: imageRect.y + crop.y * imageRect.height,
    width: crop.width * imageRect.width,
    height: crop.height * imageRect.height,
  };

  const getAspectRatioValue = useCallback(() => {
    if (aspectRatio === "free" || !sourceImage) return null;
    const ratioMap: Record<string, number> = {
      "1:1": 1,
      "4:5": 4 / 5,
      "3:4": 3 / 4,
    };
    return ratioMap[aspectRatio] ?? null;
  }, [aspectRatio, sourceImage]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, handle: HandlePosition) => {
      e.stopPropagation();
      e.preventDefault();
      setActiveHandle(handle);
      dragStartRef.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        cropX: crop.x,
        cropY: crop.y,
        cropW: crop.width,
        cropH: crop.height,
      };

      const handleMouseMove = (ev: MouseEvent) => {
        const dx = (ev.clientX - dragStartRef.current.mouseX) / imageRect.width;
        const dy = (ev.clientY - dragStartRef.current.mouseY) / imageRect.height;
        const s = dragStartRef.current;
        const ratio = getAspectRatioValue();
        const imgAspect = sourceImage ? sourceImage.width / sourceImage.height : 1;

        let newX = s.cropX;
        let newY = s.cropY;
        let newW = s.cropW;
        let newH = s.cropH;

        if (handle === "move") {
          newX = Math.max(0, Math.min(1 - s.cropW, s.cropX + dx));
          newY = Math.max(0, Math.min(1 - s.cropH, s.cropY + dy));
        } else {
          // Resize based on handle
          if (handle.includes("r")) {
            newW = Math.max(0.05, Math.min(1 - s.cropX, s.cropW + dx));
          }
          if (handle.includes("l")) {
            const dxClamped = Math.max(-s.cropX, Math.min(s.cropW - 0.05, dx));
            newX = s.cropX + dxClamped;
            newW = s.cropW - dxClamped;
          }
          if (handle.includes("b")) {
            newH = Math.max(0.05, Math.min(1 - s.cropY, s.cropH + dy));
          }
          if (handle.includes("t")) {
            const dyClamped = Math.max(-s.cropY, Math.min(s.cropH - 0.05, dy));
            newY = s.cropY + dyClamped;
            newH = s.cropH - dyClamped;
          }

          // Enforce aspect ratio
          if (ratio !== null) {
            const targetH = (newW * imgAspect) / ratio;
            if (targetH <= 1 - newY) {
              newH = targetH;
            } else {
              newH = 1 - newY;
              newW = (newH * ratio) / imgAspect;
            }
          }
        }

        setCrop({ x: newX, y: newY, width: newW, height: newH });
      };

      const handleMouseUp = () => {
        setActiveHandle(null);
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [crop, imageRect, setCrop, getAspectRatioValue, sourceImage]
  );

  const handleCursors: Record<HandlePosition, string> = {
    tl: "cursor-nwse-resize",
    tr: "cursor-nesw-resize",
    bl: "cursor-nesw-resize",
    br: "cursor-nwse-resize",
    t: "cursor-ns-resize",
    b: "cursor-ns-resize",
    l: "cursor-ew-resize",
    r: "cursor-ew-resize",
    move: "cursor-move",
  };

  const handles: { pos: HandlePosition; x: number; y: number }[] = [
    { pos: "tl", x: cropPixels.x, y: cropPixels.y },
    { pos: "tr", x: cropPixels.x + cropPixels.width, y: cropPixels.y },
    { pos: "bl", x: cropPixels.x, y: cropPixels.y + cropPixels.height },
    { pos: "br", x: cropPixels.x + cropPixels.width, y: cropPixels.y + cropPixels.height },
    { pos: "t", x: cropPixels.x + cropPixels.width / 2, y: cropPixels.y },
    { pos: "b", x: cropPixels.x + cropPixels.width / 2, y: cropPixels.y + cropPixels.height },
    { pos: "l", x: cropPixels.x, y: cropPixels.y + cropPixels.height / 2 },
    { pos: "r", x: cropPixels.x + cropPixels.width, y: cropPixels.y + cropPixels.height / 2 },
  ];

  return (
    <div className="pointer-events-none absolute inset-0">
      {/* Darkened overlay outside crop */}
      <svg className="absolute inset-0 h-full w-full">
        <defs>
          <mask id="crop-mask">
            <rect width="100%" height="100%" fill="white" />
            <rect
              x={cropPixels.x}
              y={cropPixels.y}
              width={cropPixels.width}
              height={cropPixels.height}
              fill="black"
            />
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.6)"
          mask="url(#crop-mask)"
        />
      </svg>

      {/* Crop border */}
      <div
        className={`pointer-events-auto absolute border border-white/80 ${
          activeHandle === "move" ? "cursor-grabbing" : "cursor-move"
        }`}
        style={{
          left: cropPixels.x,
          top: cropPixels.y,
          width: cropPixels.width,
          height: cropPixels.height,
        }}
        onMouseDown={(e) => handleMouseDown(e, "move")}
      >
        {/* Rule of thirds grid */}
        {showGrid && (
          <svg className="pointer-events-none absolute inset-0 h-full w-full">
            {/* Vertical lines */}
            <line x1="33.33%" y1="0" x2="33.33%" y2="100%" stroke="white" strokeOpacity="0.3" strokeWidth="0.5" />
            <line x1="66.67%" y1="0" x2="66.67%" y2="100%" stroke="white" strokeOpacity="0.3" strokeWidth="0.5" />
            {/* Horizontal lines */}
            <line x1="0" y1="33.33%" x2="100%" y2="33.33%" stroke="white" strokeOpacity="0.3" strokeWidth="0.5" />
            <line x1="0" y1="66.67%" x2="100%" y2="66.67%" stroke="white" strokeOpacity="0.3" strokeWidth="0.5" />
          </svg>
        )}
      </div>

      {/* Resize handles */}
      {handles.map(({ pos, x, y }) => (
        <div
          key={pos}
          className={`pointer-events-auto absolute ${handleCursors[pos]}`}
          style={{
            left: x - HANDLE_SIZE / 2,
            top: y - HANDLE_SIZE / 2,
            width: HANDLE_SIZE,
            height: HANDLE_SIZE,
          }}
          onMouseDown={(e) => handleMouseDown(e, pos)}
        >
          <div className="h-full w-full rounded-sm border border-white/90 bg-white/20 shadow-sm" />
        </div>
      ))}
    </div>
  );
}
