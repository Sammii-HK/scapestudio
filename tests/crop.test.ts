import { test } from "node:test";
import assert from "node:assert/strict";
import { swapCropOrientation } from "../src/lib/image-processing/crop.ts";
test("swapping a landscape crop changes real proportions and keeps the result in bounds", () => {
  const next = swapCropOrientation(
    { x: 0, y: 0, width: 1, height: 1, rotation: 0 },
    { width: 1200, height: 900 },
  );
  assert.equal((next.width * 1200) / (next.height * 900), 3 / 4);
  assert.ok(
    next.x >= 0 &&
      next.y >= 0 &&
      next.x + next.width <= 1 &&
      next.y + next.height <= 1,
  );
});
test("a smaller crop swaps about its centre when space allows", () => {
  const next = swapCropOrientation(
    { x: 0.2, y: 0.2, width: 0.3, height: 0.2, rotation: 0 },
    { width: 1200, height: 900 },
  );
  assert.ok(Math.abs(next.x + next.width / 2 - 0.35) < 1e-10);
  assert.ok(Math.abs(next.y + next.height / 2 - 0.3) < 1e-10);
  assert.ok(Math.abs(next.width * 1200 - 180) < 1e-10);
  assert.ok(Math.abs(next.height * 900 - 360) < 1e-10);
});
