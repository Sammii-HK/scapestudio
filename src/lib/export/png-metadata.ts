/** Stamp physical pixel density into a PNG without changing its image data. */
export async function withPngDpi(blob: Blob, dpi: number): Promise<Blob> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const view = new DataView(bytes.buffer);
  if (
    bytes.length < 33 ||
    view.getUint32(0) !== 0x89504e47 ||
    view.getUint32(4) !== 0x0d0a1a0a
  )
    throw new Error("The image encoder did not produce a PNG.");
  if (!Number.isFinite(dpi) || dpi <= 0)
    throw new Error("Print resolution must be positive.");
  const density = Math.round(dpi / 0.0254);
  const chunk = new Uint8Array(21);
  const cv = new DataView(chunk.buffer);
  cv.setUint32(0, 9);
  chunk.set([112, 72, 89, 115], 4);
  cv.setUint32(8, density);
  cv.setUint32(12, density);
  chunk[16] = 1;
  let crc = 0xffffffff;
  for (const byte of chunk.slice(4, 17)) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++)
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  cv.setUint32(17, (crc ^ 0xffffffff) >>> 0);
  const parts: Uint8Array[] = [bytes.slice(0, 8)];
  let inserted = false;
  for (let offset = 8; offset < bytes.length; ) {
    const length = view.getUint32(offset);
    const end = offset + 12 + length;
    if (end > bytes.length)
      throw new Error("The PNG encoder returned an incomplete image.");
    const type = String.fromCharCode(...bytes.slice(offset + 4, offset + 8));
    if (type !== "pHYs") parts.push(bytes.slice(offset, end));
    if (type === "IHDR" && !inserted) {
      parts.push(chunk);
      inserted = true;
    }
    offset = end;
  }
  if (!inserted) throw new Error("The PNG is missing its image header.");
  return new Blob(parts as BlobPart[], { type: "image/png" });
}
