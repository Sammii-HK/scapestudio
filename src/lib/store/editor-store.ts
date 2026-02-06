import { create } from "zustand";
import type {
  CropRegion,
  CurvePoints,
  ExportSize,
  PreviewMode,
} from "@/types/editor";
import {
  DEFAULT_CROP,
  DEFAULT_CURVES,
  DEFAULT_EXPORT_SIZES,
} from "@/types/editor";

export type AspectRatio = "free" | "1:1" | "4:5" | "3:4";

interface EditorStore {
  // State
  sourceImage: ImageBitmap | null;
  sourceFileName: string;
  crop: CropRegion;
  aspectRatio: AspectRatio;
  showGrid: boolean;
  curves: CurvePoints;
  threshold: number;
  feather: number;
  previewMode: PreviewMode;
  tshirtBackground: string;
  exportSizes: ExportSize[];

  // Processed output
  processedImage: ImageBitmap | null;
  tshirtImage: ImageBitmap | null;
  histogram: Uint32Array | null;
  isProcessing: boolean;

  // Viewport
  zoom: number;
  panX: number;
  panY: number;

  // Actions
  setSourceImage: (image: ImageBitmap, fileName: string) => void;
  clearImage: () => void;
  setCrop: (crop: Partial<CropRegion>) => void;
  setAspectRatio: (ratio: AspectRatio) => void;
  setShowGrid: (show: boolean) => void;
  setCurves: (curves: CurvePoints) => void;
  setThreshold: (threshold: number) => void;
  setFeather: (feather: number) => void;
  setPreviewMode: (mode: PreviewMode) => void;
  setTshirtBackground: (bg: string) => void;
  setExportSizes: (sizes: ExportSize[]) => void;
  setProcessedImages: (print: ImageBitmap, tshirt: ImageBitmap, histogram: Uint32Array) => void;
  setIsProcessing: (processing: boolean) => void;
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  resetViewport: () => void;
  rotateCrop90: () => void;
}

export const useEditorStore = create<EditorStore>((set) => ({
  // Initial state
  sourceImage: null,
  sourceFileName: "",
  crop: DEFAULT_CROP,
  aspectRatio: "free" as AspectRatio,
  showGrid: true,
  curves: DEFAULT_CURVES,
  threshold: 25,
  feather: 5,
  previewMode: "split",
  tshirtBackground: "checkerboard",
  exportSizes: DEFAULT_EXPORT_SIZES,
  processedImage: null,
  tshirtImage: null,
  histogram: null,
  isProcessing: false,
  zoom: 1,
  panX: 0,
  panY: 0,

  // Actions
  setSourceImage: (image, fileName) =>
    set({
      sourceImage: image,
      sourceFileName: fileName,
      crop: DEFAULT_CROP,
      zoom: 1,
      panX: 0,
      panY: 0,
    }),

  clearImage: () =>
    set({
      sourceImage: null,
      sourceFileName: "",
      crop: DEFAULT_CROP,
      curves: DEFAULT_CURVES,
      threshold: 25,
      processedImage: null,
      tshirtImage: null,
      histogram: null,
      isProcessing: false,
      zoom: 1,
      panX: 0,
      panY: 0,
    }),

  setCrop: (crop) =>
    set((state) => ({ crop: { ...state.crop, ...crop } })),

  setAspectRatio: (aspectRatio) =>
    set((state) => {
      if (aspectRatio === "free") return { aspectRatio };
      const ratioMap: Record<string, number> = {
        "1:1": 1,
        "4:5": 4 / 5,
        "3:4": 3 / 4,
      };
      const ratio = ratioMap[aspectRatio];
      const { crop, sourceImage } = state;
      if (!sourceImage) return { aspectRatio };

      // Adjust crop height to match aspect ratio, keeping it within bounds
      const imgAspect = sourceImage.width / sourceImage.height;
      let newWidth = crop.width;
      let newHeight = (newWidth * imgAspect) / ratio;
      if (newHeight > 1) {
        newHeight = 1;
        newWidth = (newHeight * ratio) / imgAspect;
      }
      const newX = Math.min(crop.x, 1 - newWidth);
      const newY = Math.min(crop.y, 1 - newHeight);
      return {
        aspectRatio,
        crop: { ...crop, width: newWidth, height: newHeight, x: newX, y: newY },
      };
    }),

  setShowGrid: (showGrid) => set({ showGrid }),

  setCurves: (curves) => set({ curves }),

  setThreshold: (threshold) => set({ threshold }),

  setFeather: (feather) => set({ feather }),

  setPreviewMode: (previewMode) => set({ previewMode }),

  setTshirtBackground: (tshirtBackground) => set({ tshirtBackground }),

  setExportSizes: (exportSizes) => set({ exportSizes }),

  setProcessedImages: (processedImage, tshirtImage, histogram) =>
    set({ processedImage, tshirtImage, histogram, isProcessing: false }),

  setIsProcessing: (isProcessing) => set({ isProcessing }),

  setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(10, zoom)) }),

  setPan: (panX, panY) => set({ panX, panY }),

  resetViewport: () => set({ zoom: 1, panX: 0, panY: 0 }),

  rotateCrop90: () =>
    set((state) => ({
      crop: { ...state.crop, rotation: (state.crop.rotation + 90) % 360 },
    })),
}));
