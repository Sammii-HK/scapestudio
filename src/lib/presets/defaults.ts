import type { Preset } from "@/types/editor";

export const DEFAULT_PRESETS: Omit<Preset, "createdAt" | "updatedAt">[] = [
  {
    id: "preset-standard-bw",
    name: "Standard B&W",
    curves: [
      { x: 0, y: 10 },
      { x: 80, y: 70 },
      { x: 180, y: 200 },
      { x: 255, y: 255 },
    ],
    threshold: 25,
  },
  {
    id: "preset-high-contrast",
    name: "High Contrast",
    curves: [
      { x: 0, y: 0 },
      { x: 60, y: 20 },
      { x: 190, y: 235 },
      { x: 255, y: 255 },
    ],
    threshold: 40,
  },
  {
    id: "preset-soft-airy",
    name: "Soft & Airy",
    curves: [
      { x: 0, y: 30 },
      { x: 128, y: 145 },
      { x: 255, y: 250 },
    ],
    threshold: 15,
  },
];
