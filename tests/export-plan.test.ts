import { test } from "node:test";
import assert from "node:assert/strict";
import { exportDimensions } from "../src/lib/export/export-plan.ts";
const size = {
  label: "Small",
  widthCm: 25,
  heightCm: 25,
  dpi: 300,
  enabled: true,
};
test("landscape and portrait crops retain their proportions in the real export plan", () => {
  const landscape = exportDimensions(
    size,
    { width: 1200, height: 900 },
    { width: 1, height: 1 },
  );
  assert.equal(landscape.widthPx, 2953);
  assert.equal(landscape.heightPx, 2215);
  const portrait = exportDimensions(
    size,
    { width: 1200, height: 900 },
    { width: 0.5, height: 1 },
  );
  assert.equal(portrait.heightPx, 4430);
});
test("invalid crop dimensions fail before a worker begins exporting", () => {
  assert.throws(() =>
    exportDimensions(
      size,
      { width: 1200, height: 900 },
      { width: 0, height: 1 },
    ),
  );
  assert.throws(() =>
    exportDimensions(
      { ...size, widthCm: NaN },
      { width: 1200, height: 900 },
      { width: 1, height: 1 },
    ),
  );
});
