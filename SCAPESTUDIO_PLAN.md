# ScapeStudio — Photo Editing PWA for Print & T-Shirt Workflow

## Overview

A streamlined Next.js PWA that replaces a multi-step Photoshop workflow for preparing photography for two outputs: **fine art prints** and **t-shirt prints**. The user shoots on iPhone, imports photos, and the app produces both versions simultaneously with batch multi-size export.

## The Workflow (What This App Replaces)

**Current Photoshop process (2 passes):**
1. Import color photo → convert to B&W → adjust curves → export print version
2. Take print version → select all pure blacks via Color Range → mask/delete them → left with grays + whites on transparency → export t-shirt version

**This app (1 pass):**
1. Import photo → crop/position → B&W + curves (with presets) → adjust threshold slider → preview BOTH outputs side-by-side → batch export all sizes at once

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS + shadcn/ui (component library)
- **Icons:** Lucide React
- **Image Processing:** OffscreenCanvas in Web Workers
- **State Management:** Zustand (lightweight, good for editor state)
- **PWA:** next-pwa or @serwist/next
- **Storage:** IndexedDB (via idb library) for presets and recent projects
- **Export:** canvas.toBlob() → JSZip for batch download

## Design Direction

Dark theme — this is a photo editing tool, dark backgrounds are standard so images read correctly. Think Lightroom/Capture One aesthetic, not Canva.

- **Background:** Near-black (#0a0a0a) with subtle gray panels (#141414, #1a1a1a)
- **Accents:** A single warm accent color for active states and CTAs (warm amber/orange or cool blue — pick one)
- **Typography:** Monospace or geometric sans for labels/values (e.g., JetBrains Mono for numeric values, a clean sans like Geist for UI)
- **Borders:** Subtle 1px borders (#2a2a2a), no heavy dividers
- **Sliders/Controls:** Custom styled, thin, precise — not chunky default browser controls

---

## Architecture

### Directory Structure

```
src/
├── app/
│   ├── layout.tsx                 # Root layout with dark theme
│   ├── page.tsx                   # Main editor page (single-page app)
│   ├── manifest.ts                # PWA manifest
│   └── globals.css                # Tailwind + custom properties
├── components/
│   ├── editor/
│   │   ├── EditorCanvas.tsx       # Main canvas viewport with pan/zoom
│   │   ├── CropOverlay.tsx        # Crop handles + rule-of-thirds grid
│   │   ├── DualPreview.tsx        # Side-by-side print vs t-shirt preview
│   │   └── ImageUpload.tsx        # Drag-and-drop + file picker
│   ├── controls/
│   │   ├── CurvesEditor.tsx       # Interactive curves with draggable points
│   │   ├── ThresholdSlider.tsx    # Black knockout threshold control
│   │   ├── PresetManager.tsx      # Save/load/apply presets
│   │   ├── ExportPanel.tsx        # Multi-size export configuration
│   │   └── CropControls.tsx       # Aspect ratio controls
│   └── ui/
│       ├── Slider.tsx             # Custom styled slider
│       ├── Button.tsx             # Consistent button styles
│       ├── Panel.tsx              # Collapsible side panel section
│       └── Toolbar.tsx            # Top toolbar with actions
├── lib/
│   ├── image-processing/
│   │   ├── pipeline.ts            # Main processing pipeline orchestrator
│   │   ├── grayscale.ts           # Color → B&W conversion
│   │   ├── curves.ts              # Curves lookup table generation + application
│   │   ├── threshold.ts           # Black knockout (threshold → transparency)
│   │   ├── resize.ts              # Resize to exact pixel dimensions from cm + DPI
│   │   └── worker.ts              # Web Worker for heavy processing
│   ├── presets/
│   │   ├── types.ts               # Preset type definitions
│   │   ├── defaults.ts            # Built-in starter presets
│   │   └── storage.ts             # IndexedDB CRUD for presets
│   ├── export/
│   │   ├── batch-export.ts        # Multi-size export orchestrator
│   │   └── zip.ts                 # ZIP file generation
│   ├── canvas/
│   │   ├── viewport.ts            # Pan/zoom/fit logic
│   │   └── crop.ts                # Crop geometry calculations
│   └── store/
│       └── editor-store.ts        # Zustand store for all editor state
├── workers/
│   └── image-processor.worker.ts  # Web Worker entry point
└── types/
    └── editor.ts                  # Shared type definitions
```

---

## Core Types

```typescript
// types/editor.ts

interface EditorState {
  // Source image
  sourceImage: ImageBitmap | null;
  sourceFileName: string;

  // Crop
  crop: CropRegion;
  showGrid: boolean; // rule-of-thirds

  // Processing
  curves: CurvePoints;
  threshold: number; // 0-255, pixels darker than this become transparent

  // Preview
  previewMode: 'split' | 'print' | 'tshirt';

  // Export
  exportSizes: ExportSize[];
}

interface CropRegion {
  x: number;      // 0-1 normalized
  y: number;      // 0-1 normalized
  width: number;  // 0-1 normalized
  height: number; // 0-1 normalized
  rotation: number; // degrees
}

interface CurvePoint {
  x: number; // 0-255 input
  y: number; // 0-255 output
}

type CurvePoints = CurvePoint[]; // Minimum 2 (black + white endpoints), typically 3-5

interface Preset {
  id: string;
  name: string;
  curves: CurvePoints;
  threshold: number;
  createdAt: number;
  updatedAt: number;
}

interface ExportSize {
  label: string;        // e.g., "Small", "Medium", "Large"
  widthCm: number;      // e.g., 25, 50, 70
  heightCm: number;     // same as width for square, or different
  dpi: number;          // 300
  enabled: boolean;     // toggle individual sizes on/off
}

// Computed pixel dimensions: Math.round((cm / 2.54) * dpi)
// 25cm @ 300dpi = 2953px
// 50cm @ 300dpi = 5906px
// 70cm @ 300dpi = 8268px
```

---

## Implementation Plan (Ordered Phases)

### Phase 1: Project Setup + Image Upload

**Goal:** Next.js project with dark theme, image upload, and canvas display.

Tasks:
1. Initialize Next.js 14 project with TypeScript, Tailwind, App Router
2. Configure PWA (next-pwa or @serwist/next) with manifest, service worker, offline support
3. Set up dark theme with CSS custom properties
4. Build `ImageUpload` component — drag-and-drop zone with file picker fallback
5. Build `EditorCanvas` component — display uploaded image with fit-to-viewport
6. Implement basic pan and zoom (mouse wheel + drag) on the canvas viewport
7. Set up Zustand store with initial editor state
8. Install dependencies: `zustand`, `idb`, `jszip`, `file-saver`

**Acceptance:** Can upload an iPhone photo, see it displayed in a dark-themed canvas area, pan and zoom around it.

---

### Phase 2: Crop + Rule of Thirds

**Goal:** Crop the image with handles, rule-of-thirds overlay, and aspect ratio controls.

Tasks:
1. Build `CropOverlay` component — draggable crop rectangle over the image
2. Implement corner + edge drag handles for resizing the crop
3. Add rule-of-thirds grid lines (toggle on/off)
4. Build `CropControls` panel:
   - Aspect ratio presets: 1:1 (square), 4:5, 3:4, Free
   - Manual dimension input (cm) — the crop represents the final print area
   - Rotation (90° increments + free rotation if feasible)
5. Store crop state in Zustand, all coordinates normalized 0-1

**Acceptance:** Can crop an image with rule-of-thirds guides, lock aspect ratio to 1:1, rotate 90°.

---

### Phase 3: B&W Conversion + Curves

**Goal:** Convert to grayscale and apply adjustable curves.

Tasks:
1. Implement `grayscale.ts` — standard luminosity method: `0.299R + 0.587G + 0.114B`
2. Implement `curves.ts`:
   - Generate cubic spline interpolation from control points to 256-entry lookup table
   - Apply LUT to each pixel's luminance value
   - The curve maps input brightness (x-axis) to output brightness (y-axis)
3. Build `CurvesEditor` component:
   - 256×256 grid area with subtle gridlines
   - Display the histogram of the current image behind the curve
   - Draggable control points (minimum: black point at 0,0 and white point at 255,255)
   - Click on the curve to add a point (up to 5 total)
   - Right-click or double-click a point to remove it
   - Real-time preview update as points are dragged
   - Show input/output values on hover/drag
4. Set up Web Worker (`image-processor.worker.ts`) for processing:
   - Main thread sends ImageBitmap + curve LUT to worker
   - Worker applies grayscale + curves on OffscreenCanvas
   - Worker sends back processed ImageBitmap
   - Debounce processing during rapid curve adjustments (~100ms)

**Cubic spline implementation notes:**
- Use monotone cubic interpolation (Fritsch-Carlson) to prevent overshoot
- Clamp output values to 0-255
- The LUT is a Uint8Array of length 256

**Acceptance:** Can see a grayscale version of the image, drag curve points and see real-time changes, histogram updates.

---

### Phase 4: Preset System

**Goal:** Save, load, and manage curves + threshold presets.

Tasks:
1. Set up IndexedDB storage using `idb` library:
   - Database: `scapestudio`
   - Object store: `presets` (keyPath: `id`)
2. Implement `storage.ts` — CRUD operations for presets
3. Create 3 built-in default presets:
   - **"Standard B&W"**: Gentle S-curve, threshold 30
   - **"High Contrast"**: Aggressive S-curve (lift blacks, crush whites), threshold 45
   - **"Soft"**: Flat curve with raised shadows, threshold 20
4. Build `PresetManager` component:
   - Dropdown/list of saved presets
   - "Save Current" button (prompts for name)
   - "Update" button (overwrites current preset with current settings)
   - "Delete" button with confirmation
   - Clicking a preset applies its curves + threshold instantly
   - Visual indicator of which preset is active (or "Custom" if modified)

**Acceptance:** Can save current curves as a preset, select it later, and it restores the exact curve points + threshold.

---

### Phase 5: Black Knockout (Threshold)

**Goal:** Remove pure/near-black pixels to create the t-shirt version.

Tasks:
1. Implement `threshold.ts`:
   - Input: grayscale+curved image data + threshold value (0-255)
   - For each pixel: if luminance ≤ threshold, set alpha to 0 (fully transparent)
   - Optional: soft edge — pixels within a "feather" range get partial transparency
     - e.g., threshold=30, feather=10: pixels 0-20 are fully transparent, 20-30 fade in
2. Build `ThresholdSlider` component:
   - Horizontal slider, 0-255 range
   - Numeric input for precise values
   - Optional: small feather/softness sub-slider (0-20 range)
   - Real-time preview showing transparency as checkerboard pattern
3. Process in Web Worker alongside curves (single pipeline pass):
   - grayscale → curves LUT → threshold knockout
   - Output two ImageBitmaps: print version (no knockout) and tshirt version (with knockout)

**Acceptance:** Sliding threshold shows blacks disappearing to transparency, checkerboard visible through knocked-out areas.

---

### Phase 6: Dual Preview

**Goal:** See both outputs simultaneously.

Tasks:
1. Build `DualPreview` component with three modes:
   - **Split view**: Side-by-side, print left, t-shirt right (default)
   - **Print only**: Full canvas showing just the print version
   - **T-shirt only**: Full canvas showing t-shirt version on checkerboard
2. Toggle buttons in toolbar to switch modes
3. T-shirt preview should show:
   - Checkerboard background (standard transparency indicator)
   - Optional: colored background toggle (black, white, navy, gray) to simulate shirt color
4. Both previews respond to the same pan/zoom state

**Acceptance:** Can see both versions side-by-side, switch to full view of either, see t-shirt version on different background colors.

---

### Phase 7: Multi-Size Batch Export

**Goal:** One-click export of both versions at multiple print sizes.

Tasks:
1. Implement `resize.ts`:
   - Calculate pixel dimensions: `Math.round((cm / 2.54) * dpi)`
   - Resize using canvas drawImage with high-quality interpolation
   - For upscaling iPhone photos (4032×3024) to 5906×5906 or 8268×8268:
     - Use `imageSmoothingQuality: 'high'` on canvas context
     - Consider a 2-pass Lanczos-approximation resize for better quality (optional)
2. Implement `batch-export.ts`:
   - For each enabled export size:
     - Resize the crop+processed print version → PNG
     - Resize the cropped+processed t-shirt version → PNG (with transparency)
   - Package into a ZIP using JSZip
   - Naming convention: `{original-name}_print_{size}cm.png`, `{original-name}_tshirt_{size}cm.png`
3. Build `ExportPanel` component:
   - List of export sizes with checkboxes:
     - 25cm × 25cm (2953px @ 300dpi) — Small
     - 50cm × 50cm (5906px @ 300dpi) — Medium
     - 70cm × 70cm (8268px @ 300dpi) — Large
   - Custom size input (width cm × height cm)
   - DPI display (fixed at 300, shown for reference)
   - "Export All" button → generates ZIP → browser download
   - Progress bar during export (each size takes time for large images)
4. Run export in Web Worker to prevent UI freezing

**Export file structure in ZIP:**
```
{filename}_export/
├── print/
│   ├── {filename}_print_25cm_2953px.png
│   ├── {filename}_print_50cm_5906px.png
│   └── {filename}_print_70cm_8268px.png
└── tshirt/
    ├── {filename}_tshirt_25cm_2953px.png
    ├── {filename}_tshirt_50cm_5906px.png
    └── {filename}_tshirt_70cm_8268px.png
```

**Acceptance:** Click export, get a ZIP with 6 files (3 print, 3 t-shirt), all at correct pixel dimensions, t-shirt versions have transparent backgrounds.

---

### Phase 8: PWA Polish + UX

**Goal:** Installable, offline-capable, production-ready.

Tasks:
1. PWA configuration:
   - `manifest.json`: app name, icons, theme color, display: standalone
   - Service worker: cache app shell + assets for offline use
   - Install prompt handling
2. Keyboard shortcuts:
   - `Cmd/Ctrl+Z`: Undo
   - `Cmd/Ctrl+S`: Save preset (if modified)
   - `Cmd/Ctrl+E`: Export
   - `Space+drag`: Pan
   - `+/-`: Zoom
   - `G`: Toggle grid
   - `1/2/3`: Switch preview modes
3. Undo/Redo system:
   - Store history of editor state snapshots (curves, threshold, crop)
   - Limit to ~20 states to manage memory
4. Loading states:
   - Skeleton UI while processing
   - Progress indicators for export
5. Error handling:
   - File type validation (accept only jpg, png, heic, webp)
   - Memory warnings for very large images
   - Graceful Web Worker failure fallback (process on main thread)
6. Responsive layout:
   - Desktop: side panel for controls, main area for canvas
   - Tablet: collapsible bottom panel
   - Not optimized for phone (this is a desktop/tablet workflow tool)

---

## Image Processing Pipeline (Technical Detail)

The core pipeline runs in a Web Worker and processes the cropped region through these steps:

```
Source Image (color)
    ↓
[1] Crop to selected region
    ↓
[2] Convert to Grayscale (luminosity: 0.299R + 0.587G + 0.114B)
    ↓
[3] Apply Curves LUT (256-entry Uint8Array, cubic spline interpolated)
    ↓
[4] Output A: PRINT VERSION (grayscale + curves applied)
    ↓
[5] Apply Threshold Knockout (luminance ≤ threshold → alpha = 0)
    ↓
[6] Output B: T-SHIRT VERSION (grays + whites on transparency)
```

**Performance considerations:**
- iPhone 15 Pro Max photos: 4032 × 3024 = ~12.2 million pixels
- Each pixel needs: 1 grayscale calc + 1 LUT lookup + 1 threshold check
- On a modern device this should process in <200ms in a Web Worker
- Use `ImageBitmap` for zero-copy transfer between main thread and worker
- Generate a lower-res preview (max 2000px on longest side) for real-time editing
- Use full resolution only for final export
- Debounce processing during slider/curve drag (~100-150ms)

**Preview vs Export resolution:**
- While editing: process at preview resolution (~2000px max dimension)
- On export: process at full resolution for each target size
- This keeps the UI responsive during editing

---

## Curves Cubic Spline Implementation

The curves editor needs a smooth interpolation between control points. Use **monotone cubic Hermite interpolation** (Fritsch-Carlson method) which:
- Passes through all control points exactly
- Never overshoots (monotone — won't create negative values or values > 255)
- Looks natural and smooth

```
Algorithm:
1. Sort control points by x-coordinate
2. Calculate slopes between consecutive points (deltas)
3. Calculate tangents at each point using Fritsch-Carlson method
4. For each x from 0-255:
   a. Find which segment x falls in
   b. Calculate cubic Hermite value using the segment's points and tangents
   c. Clamp result to 0-255
   d. Store in LUT[x]
```

The resulting `Uint8Array(256)` is the lookup table applied to every pixel.

---

## Default Presets

```typescript
const DEFAULT_PRESETS: Omit<Preset, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: "Standard B&W",
    curves: [
      { x: 0, y: 10 },     // Slightly lift blacks
      { x: 80, y: 70 },    // Gentle shadow reduction
      { x: 180, y: 200 },  // Slightly boost highlights
      { x: 255, y: 255 },  // White point stays
    ],
    threshold: 25,
  },
  {
    name: "High Contrast",
    curves: [
      { x: 0, y: 0 },      // True blacks
      { x: 60, y: 20 },    // Crush shadows
      { x: 190, y: 235 },  // Boost highlights aggressively
      { x: 255, y: 255 },  // White stays
    ],
    threshold: 40,
  },
  {
    name: "Soft & Airy",
    curves: [
      { x: 0, y: 30 },     // Significantly lift blacks (matte look)
      { x: 128, y: 145 },  // Slight midtone boost
      { x: 255, y: 250 },  // Slightly pull back whites
    ],
    threshold: 15,
  },
];
```

---

## Export Size Calculations

| Label  | cm   | Pixels @ 300 DPI | File Size (est. PNG) |
|--------|------|-------------------|----------------------|
| Small  | 25   | 2,953 × 2,953    | ~5-10 MB             |
| Medium | 50   | 5,906 × 5,906    | ~15-30 MB            |
| Large  | 70   | 8,268 × 8,268    | ~30-50 MB            |

**Note:** T-shirt versions will be smaller (lots of transparent areas compress well in PNG).

**ZIP bundle estimated size:** 50-100 MB for all 6 files. Browser can handle this but show a progress bar.

For non-square outputs, the user sets width and height independently in CropControls.

---

## Key Libraries

| Library | Purpose | Install |
|---------|---------|---------|
| `next` | Framework | `npx create-next-app@latest` |
| `zustand` | State management | `npm i zustand` |
| `idb` | IndexedDB wrapper | `npm i idb` |
| `jszip` | ZIP generation | `npm i jszip` |
| `file-saver` | Trigger browser download | `npm i file-saver` |
| `@serwist/next` | PWA/service worker | `npm i @serwist/next` |

No heavy image processing libraries needed — Canvas API handles everything.

---

## Important Implementation Notes

1. **HEIC support**: iPhone photos may be in HEIC format. Canvas can't read HEIC directly. Options:
   - Tell user to export as JPEG from Photos app (simplest)
   - Use `heic2any` library to convert client-side (adds ~200KB)
   - Recommend: support HEIC conversion as a nice-to-have in Phase 8

2. **Memory management**: Processing 8268×8268 images uses ~260MB of memory per canvas. When exporting multiple sizes:
   - Process one size at a time, not all in parallel
   - Release canvas/bitmap references after each size is added to ZIP
   - Use `ImageBitmap.close()` to free memory explicitly

3. **Color profile**: iPhone photos often have P3 color profile. When converting to grayscale, this shouldn't matter much, but be aware that canvas operations use sRGB by default. For highest accuracy, create canvas with `{ colorSpace: 'display-p3' }` if the source is P3.

4. **T-shirt export format**: Must be PNG (not JPEG) to preserve transparency. Ensure the print version can be exported as either PNG or JPEG (PNG preferred for quality, JPEG for smaller files).

5. **Non-square crops**: While most of the user's work is square (50×50cm), the system should support any aspect ratio since canvas and t-shirt prints come in various dimensions.

---

## UI Layout (Desktop)

```
┌─────────────────────────────────────────────────────────────────┐
│ [Logo] ScapeStudio           [Undo][Redo]  [Grid]  [Export]     │
├────────────────────────────────────────────┬────────────────────┤
│                                            │ ▼ CROP             │
│                                            │   Ratio: [1:1 ▾]  │
│                                            │   W: [50] cm       │
│                                            │   H: [50] cm       │
│         CANVAS VIEWPORT                    │   [Rotate 90°]     │
│                                            │                    │
│     ┌──────────┐  ┌──────────┐             │ ▼ CURVES           │
│     │  PRINT   │  │ T-SHIRT  │             │   [Preset: ▾    ]  │
│     │ PREVIEW  │  │ PREVIEW  │             │   ┌────────────┐  │
│     │          │  │ ░░░░░░░░ │             │   │  ╱curve╱   │  │
│     │          │  │ ░░░░░░░░ │             │   │╱           │  │
│     └──────────┘  └──────────┘             │   └────────────┘  │
│                                            │   [Save Preset]   │
│                                            │                    │
│                                            │ ▼ THRESHOLD        │
│                                            │   [====○====] 30   │
│                                            │                    │
│                                            │ ▼ EXPORT           │
│                                            │   ☑ 25cm (2953px)  │
│                                            │   ☑ 50cm (5906px)  │
│                                            │   ☑ 70cm (8268px)  │
│                                            │   [+ Custom Size]  │
│                                            │                    │
│                                            │   [EXPORT ALL]     │
└────────────────────────────────────────────┴────────────────────┘
```

---

## Getting Started (for Claude Code)

```bash
npx create-next-app@latest scapestudio --typescript --tailwind --app --src-dir
cd scapestudio
npm install zustand idb jszip file-saver @serwist/next
npm install -D @types/file-saver
```

**Build order:** Follow phases 1-8 sequentially. Each phase builds on the previous. Test each phase before moving to the next. The Web Worker setup in Phase 3 is the most technically complex part — get that right and everything else flows from it.
