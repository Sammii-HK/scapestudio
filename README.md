# ScapeStudio

A local image-to-print workspace. Crop a photograph, shape its tone and export a colour crop, a grayscale print and transparent apparel artwork in one ZIP.

## Working in the editor

Choose a JPG, PNG, WebP or HEIC image, or open the clearly labelled synthetic tonal study. Images are processed on the device. The editor offers crop ratios, exact pixel controls, a histogram-backed curve, dark-tone knockout and feathering. Preview print and apparel results separately or side by side. Presets are stored in this browser using IndexedDB.

Choose physical print widths before exporting. Height follows the crop proportions. Each selected width produces three PNGs with 300 DPI density metadata. Apparel transparency is based on luminance: it removes dark tones, not objects or backgrounds identified by a model. Enlarging a small source changes its output dimensions, not the detail in the original photograph.

## Development

Use Node 24 or newer. The web application uses Next.js, React, TypeScript, Zustand and Radix components, with Lucide icons.

```sh
npm install
npm run dev
npm run lint
npm run typecheck
npm test
npm run test:icons
npm run build
```

Preview and export work run in separate Web Workers using OffscreenCanvas. Preview processing is debounced and limited to a 2,000-pixel maximum dimension. Exports use a copy of the original bitmap. Tone curves use a monotone cubic Hermite lookup table; the alpha feather is a luminance interval rather than an image blur.

## Verification and limits

The 20 November 2026 local review decoded a ZIP from the real desktop editor: three 2,953 by 2,215 PNGs, approximately 300 DPI, with transparency present in the apparel version. Five tests cover proportional dimensions, invalid export inputs, crop orientation and PNG density metadata. Eight icon guard tests check the shared Lucide policy.

The 390-pixel workspace was checked without horizontal overflow. Final browser checks for the later crop/touch controls remain open after the browser connection stopped responding. Large photograph memory limits, HEIC across browsers, assistive technology and native iOS delivery still need verification. This is a local release candidate, not confirmation that the deployed site includes these changes.
