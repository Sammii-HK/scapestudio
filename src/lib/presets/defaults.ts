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
  {
    id: "preset-noir",
    name: "Noir",
    curves: [
      { x: 0, y: 0 },
      { x: 40, y: 5 },
      { x: 90, y: 55 },
      { x: 200, y: 240 },
      { x: 255, y: 255 },
    ],
    threshold: 35,
  },
  {
    id: "preset-mono",
    name: "Mono",
    curves: [
      { x: 0, y: 0 },
      { x: 128, y: 128 },
      { x: 255, y: 255 },
    ],
    threshold: 20,
  },
  {
    id: "preset-silvertone",
    name: "Silvertone",
    curves: [
      { x: 0, y: 20 },
      { x: 60, y: 55 },
      { x: 180, y: 195 },
      { x: 255, y: 235 },
    ],
    threshold: 18,
  },
  {
    id: "preset-dramatic",
    name: "Dramatic",
    curves: [
      { x: 0, y: 0 },
      { x: 50, y: 10 },
      { x: 130, y: 110 },
      { x: 210, y: 245 },
      { x: 255, y: 255 },
    ],
    threshold: 45,
  },
];
