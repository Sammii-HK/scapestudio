import type { ExportSize } from "../../types/editor";
/** The chosen physical width sets the scale; the crop determines height, without stretching. */
export function exportDimensions(
  size: ExportSize,
  source: { width: number; height: number },
  crop: { width: number; height: number },
) {
  if (
    ![
      size.widthCm,
      size.dpi,
      source.width,
      source.height,
      crop.width,
      crop.height,
    ].every((v) => Number.isFinite(v) && v > 0)
  )
    throw new Error("Choose a valid crop and print width before exporting.");
  const widthPx = Math.max(1, Math.round((size.widthCm / 2.54) * size.dpi));
  const heightPx = Math.max(
    1,
    Math.round(
      (widthPx * (source.height * crop.height)) / (source.width * crop.width),
    ),
  );
  return { label: size.label, widthPx, heightPx, dpi: size.dpi };
}
