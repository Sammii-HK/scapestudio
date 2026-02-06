"use client";

import { useEffect, useRef } from "react";
import { useEditorStore } from "@/lib/store/editor-store";
import { processImage, destroyWorker } from "@/lib/image-processing/pipeline";

/**
 * Hook that triggers image processing whenever the source image or curves change.
 * Uses a Web Worker with debouncing for real-time preview.
 */
export function useImageProcessing() {
  const sourceImage = useEditorStore((s) => s.sourceImage);
  const curves = useEditorStore((s) => s.curves);
  const setProcessedImage = useEditorStore((s) => s.setProcessedImage);
  const setIsProcessing = useEditorStore((s) => s.setIsProcessing);

  // Track if component is mounted to avoid setState after unmount
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      destroyWorker();
    };
  }, []);

  useEffect(() => {
    if (!sourceImage) return;

    setIsProcessing(true);

    processImage(sourceImage, curves, (result) => {
      if (mountedRef.current) {
        setProcessedImage(result.printBitmap, result.histogram);
      }
    });
  }, [sourceImage, curves, setProcessedImage, setIsProcessing]);
}
