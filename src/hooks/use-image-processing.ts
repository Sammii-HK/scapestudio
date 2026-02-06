"use client";

import { useEffect, useRef } from "react";
import { useEditorStore } from "@/lib/store/editor-store";
import { processImage, destroyWorker } from "@/lib/image-processing/pipeline";

/**
 * Hook that triggers image processing whenever source image, curves,
 * threshold, or feather change. Uses a Web Worker with debouncing.
 */
export function useImageProcessing() {
  const sourceImage = useEditorStore((s) => s.sourceImage);
  const curves = useEditorStore((s) => s.curves);
  const threshold = useEditorStore((s) => s.threshold);
  const feather = useEditorStore((s) => s.feather);
  const setProcessedImages = useEditorStore((s) => s.setProcessedImages);
  const setIsProcessing = useEditorStore((s) => s.setIsProcessing);

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

    processImage(sourceImage, curves, threshold, feather, (result) => {
      if (mountedRef.current) {
        setProcessedImages(result.printBitmap, result.tshirtBitmap, result.histogram);
      }
    });
  }, [sourceImage, curves, threshold, feather, setProcessedImages, setIsProcessing]);
}
