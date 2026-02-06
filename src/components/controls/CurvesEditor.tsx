"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useEditorStore } from "@/lib/store/editor-store";
import { generateCurveLUT } from "@/lib/image-processing/curves";
import type { CurvePoint } from "@/types/editor";

const CANVAS_SIZE = 200;
const POINT_RADIUS = 5;
const MAX_POINTS = 5;
const PADDING = 8;
const INNER = CANVAS_SIZE - PADDING * 2;

interface CurvesEditorProps {
  histogram: Uint32Array | null;
}

export function CurvesEditor({ histogram }: CurvesEditorProps) {
  const curves = useEditorStore((s) => s.curves);
  const setCurves = useEditorStore((s) => s.setCurves);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [hoverInfo, setHoverInfo] = useState<{ x: number; y: number } | null>(null);

  // Convert curve coords (0-255) to canvas coords
  const toCanvas = useCallback(
    (p: CurvePoint) => ({
      cx: PADDING + (p.x / 255) * INNER,
      cy: PADDING + (1 - p.y / 255) * INNER,
    }),
    []
  );

  // Convert canvas coords to curve coords (0-255)
  const fromCanvas = useCallback(
    (cx: number, cy: number): CurvePoint => ({
      x: Math.round(Math.max(0, Math.min(255, ((cx - PADDING) / INNER) * 255))),
      y: Math.round(Math.max(0, Math.min(255, (1 - (cy - PADDING) / INNER) * 255))),
    }),
    []
  );

  // Draw the curves editor
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = CANVAS_SIZE * dpr;
    canvas.height = CANVAS_SIZE * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Background
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Histogram
    if (histogram) {
      let maxCount = 0;
      for (let i = 0; i < 256; i++) {
        if (histogram[i] > maxCount) maxCount = histogram[i];
      }
      if (maxCount > 0) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
        for (let i = 0; i < 256; i++) {
          const barH = (histogram[i] / maxCount) * INNER;
          const x = PADDING + (i / 255) * INNER;
          ctx.fillRect(x, PADDING + INNER - barH, INNER / 256 + 0.5, barH);
        }
      }
    }

    // Grid lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
    ctx.lineWidth = 0.5;
    for (let i = 1; i < 4; i++) {
      const pos = PADDING + (i / 4) * INNER;
      ctx.beginPath();
      ctx.moveTo(pos, PADDING);
      ctx.lineTo(pos, PADDING + INNER);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(PADDING, pos);
      ctx.lineTo(PADDING + INNER, pos);
      ctx.stroke();
    }

    // Diagonal reference line
    ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(PADDING, PADDING + INNER);
    ctx.lineTo(PADDING + INNER, PADDING);
    ctx.stroke();

    // Draw curve from LUT
    const lut = generateCurveLUT(curves);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let x = 0; x < 256; x++) {
      const cx = PADDING + (x / 255) * INNER;
      const cy = PADDING + (1 - lut[x] / 255) * INNER;
      if (x === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    }
    ctx.stroke();

    // Draw control points
    const sorted = [...curves].sort((a, b) => a.x - b.x);
    sorted.forEach((p, i) => {
      const { cx, cy } = toCanvas(p);

      // Outer ring
      ctx.beginPath();
      ctx.arc(cx, cy, POINT_RADIUS + 1, 0, Math.PI * 2);
      ctx.fillStyle = "#0a0a0a";
      ctx.fill();

      // Point
      ctx.beginPath();
      ctx.arc(cx, cy, POINT_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle =
        i === draggingIdx ? "hsl(35, 90%, 60%)" : "rgba(255, 255, 255, 0.9)";
      ctx.fill();
    });

    // Hover info
    if (hoverInfo) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      ctx.font = "10px var(--font-geist-mono), monospace";
      ctx.textAlign = "right";
      ctx.fillText(
        `${hoverInfo.x}, ${hoverInfo.y}`,
        CANVAS_SIZE - PADDING,
        CANVAS_SIZE - 2
      );
    }
  }, [curves, histogram, draggingIdx, hoverInfo, toCanvas]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Find the nearest control point to a canvas position
  const findNearestPoint = useCallback(
    (cx: number, cy: number): number | null => {
      const sorted = [...curves].sort((a, b) => a.x - b.x);
      let nearestIdx: number | null = null;
      let nearestDist = Infinity;

      sorted.forEach((p, i) => {
        const pc = toCanvas(p);
        const dist = Math.hypot(cx - pc.cx, cy - pc.cy);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestIdx = i;
        }
      });

      return nearestDist < POINT_RADIUS * 3 ? nearestIdx : null;
    },
    [curves, toCanvas]
  );

  const getCanvasPos = useCallback(
    (e: React.MouseEvent): { cx: number; cy: number } => {
      const rect = canvasRef.current!.getBoundingClientRect();
      return {
        cx: ((e.clientX - rect.left) / rect.width) * CANVAS_SIZE,
        cy: ((e.clientY - rect.top) / rect.height) * CANVAS_SIZE,
      };
    },
    []
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const { cx, cy } = getCanvasPos(e);
      const sorted = [...curves].sort((a, b) => a.x - b.x);

      // Right-click or double-click to remove (not endpoints)
      if (e.button === 2) {
        e.preventDefault();
        const idx = findNearestPoint(cx, cy);
        if (idx !== null && idx > 0 && idx < sorted.length - 1) {
          const newCurves = sorted.filter((_, i) => i !== idx);
          setCurves(newCurves);
        }
        return;
      }

      const idx = findNearestPoint(cx, cy);
      if (idx !== null) {
        // Start dragging existing point
        setDraggingIdx(idx);
      } else if (sorted.length < MAX_POINTS) {
        // Add new point
        const newPoint = fromCanvas(cx, cy);
        const newCurves = [...sorted, newPoint].sort((a, b) => a.x - b.x);
        setCurves(newCurves);
        // Find index of the new point to start dragging it
        const newIdx = newCurves.findIndex(
          (p) => p.x === newPoint.x && p.y === newPoint.y
        );
        setDraggingIdx(newIdx);
      }
    },
    [curves, setCurves, findNearestPoint, fromCanvas, getCanvasPos]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const { cx, cy } = getCanvasPos(e);
      const newPoint = fromCanvas(cx, cy);
      setHoverInfo(newPoint);

      if (draggingIdx === null) return;

      const sorted = [...curves].sort((a, b) => a.x - b.x);
      const updated = [...sorted];
      const isFirst = draggingIdx === 0;
      const isLast = draggingIdx === sorted.length - 1;

      // Endpoints: lock x at 0 or 255
      if (isFirst) {
        updated[draggingIdx] = { x: 0, y: newPoint.y };
      } else if (isLast) {
        updated[draggingIdx] = { x: 255, y: newPoint.y };
      } else {
        // Interior points: clamp x between neighbors
        const minX = sorted[draggingIdx - 1].x + 1;
        const maxX = sorted[draggingIdx + 1].x - 1;
        updated[draggingIdx] = {
          x: Math.max(minX, Math.min(maxX, newPoint.x)),
          y: newPoint.y,
        };
      }

      setCurves(updated);
    },
    [draggingIdx, curves, setCurves, fromCanvas, getCanvasPos]
  );

  const handleMouseUp = useCallback(() => {
    setDraggingIdx(null);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setDraggingIdx(null);
    setHoverInfo(null);
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  return (
    <div className="space-y-1.5">
      <canvas
        ref={canvasRef}
        style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}
        className="w-full cursor-crosshair rounded border border-border"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onContextMenu={handleContextMenu}
      />
      <p className="text-center font-mono text-[10px] text-muted-foreground">
        Click to add point · Right-click to remove
      </p>
    </div>
  );
}
