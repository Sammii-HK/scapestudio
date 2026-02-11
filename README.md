# ScapeStudio

A browser-based photo editing tool built for fine art photographers and print professionals. ScapeStudio replaces a multi-step Photoshop workflow by letting users prepare images for both fine art prints and t-shirt prints simultaneously — all from a single interface.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)

## What It Does

ScapeStudio takes a photograph and produces two outputs: a **grayscale print-ready image** and a **transparent-background t-shirt-ready image** — exported at multiple physical sizes (25cm, 50cm, 70cm at 300 DPI) and bundled into a single ZIP download.

### Core Features

- **Non-destructive editing pipeline** — Crop, convert to B&W, adjust curves, and apply threshold knockout without ever modifying the source image
- **Interactive curves editor** — Drag control points on a bezier curve to fine-tune tonality, with a real-time histogram overlay showing tonal distribution
- **Threshold knockout** — Convert dark pixels to transparency for t-shirt printing, with a feather/softness control for smooth edges
- **Dual preview** — Side-by-side split view comparing the print version against the t-shirt version in real time
- **Preset system** — Save and load curves + threshold combinations, with built-in defaults like "High Contrast" and "Soft & Airy", persisted to IndexedDB
- **Batch multi-size export** — Generate print and t-shirt PNGs at 3 sizes (up to 8268px), packaged into a ZIP

## How It Works

```
Source Photo (color)
      |
  [Web Worker]
      |
  Grayscale ─── Curves LUT ─── Print Output (PNG)
                    |
              Threshold Knockout ─── T-Shirt Output (transparent PNG)
```

All heavy image processing runs **off the main thread** via Web Workers with `OffscreenCanvas`, keeping the UI responsive during editing and export. The curves engine uses **monotone cubic Hermite interpolation** (Fritsch-Carlson method) to build a 256-entry lookup table, ensuring smooth tonal adjustments without overshoot.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS 4 + shadcn/ui + Radix primitives |
| State | Zustand |
| Image Processing | Canvas 2D API + Web Workers + OffscreenCanvas |
| Storage | IndexedDB (presets persistence) |
| Export | JSZip (multi-file ZIP bundling) |

## Technical Highlights

- **Web Worker architecture** — Two dedicated workers: one for real-time preview processing (debounced at 100ms), another for high-resolution export rendering
- **Threshold-after-scaling** — Knockout is applied after resizing to prevent bilinear interpolation from bleeding alpha into edges
- **Zero-copy transfers** — `ImageBitmap` objects are transferred (not copied) between workers and the main thread for memory efficiency
- **Normalized crop coordinates** — All crop values stored as 0-1 ratios, making them resolution-independent
- **DPI-aware export** — Physical dimensions (cm) are converted to pixel dimensions at 300 DPI for print-lab-ready output

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
