import type { CropRegion } from "../../types/editor";

/** Swap physical crop proportions around its centre, scaling down to fit. */
export function swapCropOrientation(
  crop: CropRegion,
  image: { width: number; height: number },
): CropRegion {
  const imageAspect = image.width / image.height;
  let width = crop.height / imageAspect;
  let height = crop.width * imageAspect;
  const scale = Math.min(1, 1 / width, 1 / height);
  width *= scale;
  height *= scale;
  return {
    ...crop,
    width,
    height,
    x: Math.max(0, Math.min(1 - width, crop.x + crop.width / 2 - width / 2)),
    y: Math.max(0, Math.min(1 - height, crop.y + crop.height / 2 - height / 2)),
    rotation: 0,
  };
}
