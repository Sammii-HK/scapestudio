import { test } from "node:test";
import assert from "node:assert/strict";
import { withPngDpi } from "../src/lib/export/png-metadata.ts";
const pixel =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==";
function chunks(bytes: Uint8Array) {
  const out: Record<string, Uint8Array[]> = {};
  const v = new DataView(bytes.buffer);
  for (let o = 8; o < bytes.length; ) {
    const n = v.getUint32(o);
    const type = String.fromCharCode(...bytes.slice(o + 4, o + 8));
    (out[type] ??= []).push(bytes.slice(o + 8, o + 8 + n));
    o += n + 12;
  }
  return out;
}
test("a 300 DPI PNG carries physical density without changing its compressed pixels", async () => {
  const original = new Uint8Array(Buffer.from(pixel, "base64"));
  const first = await withPngDpi(new Blob([original]), 300);
  const bytes = new Uint8Array(await first.arrayBuffer());
  const c = chunks(bytes);
  assert.equal(
    new DataView(c.pHYs[0].buffer, c.pHYs[0].byteOffset).getUint32(0),
    11811,
  );
  assert.equal(c.pHYs[0][8], 1);
  assert.deepEqual(c.IDAT, chunks(original).IDAT);
  const repeated = chunks(
    new Uint8Array(await (await withPngDpi(first, 300)).arrayBuffer()),
  );
  assert.equal(repeated.pHYs.length, 1);
});
