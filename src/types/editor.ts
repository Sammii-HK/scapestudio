export interface CropRegion {
  x: number; // 0-1 normalized
  y: number; // 0-1 normalized
  width: number; // 0-1 normalized
  height: number; // 0-1 normalized
  rotation: number; // degrees
}

export interface CurvePoint {
  x: number; // 0-255 input
  y: number; // 0-255 output
}

export type CurvePoints = CurvePoint[];

export interface Preset {
  id: string;
  name: string;
  curves: CurvePoints;
  threshold: number;
  createdAt: number;
  updatedAt: number;
}

export interface ExportSize {
  label: string;
  widthCm: number;
  heightCm: number;
  dpi: number;
  enabled: boolean;
}

export type PreviewMode = "split" | "print" | "tshirt";

export interface EditorState {
  // Source image
  sourceImage: ImageBitmap | null;
  sourceFileName: string;

  // Crop
  crop: CropRegion;
  showGrid: boolean;

  // Processing
  curves: CurvePoints;
  threshold: number; // 0-255

  // Preview
  previewMode: PreviewMode;

  // Export
  exportSizes: ExportSize[];
}

export const DEFAULT_CROP: CropRegion = {
  x: 0,
  y: 0,
  width: 1,
  height: 1,
  rotation: 0,
};

export const DEFAULT_CURVES: CurvePoints = [
  { x: 0, y: 0 },
  { x: 255, y: 255 },
];

export const DEFAULT_EXPORT_SIZES: ExportSize[] = [
  { label: "Small", widthCm: 25, heightCm: 25, dpi: 300, enabled: true },
  { label: "Medium", widthCm: 50, heightCm: 50, dpi: 300, enabled: true },
  { label: "Large", widthCm: 70, heightCm: 70, dpi: 300, enabled: true },
];
