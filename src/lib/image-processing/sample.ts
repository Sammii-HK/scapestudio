/** A synthetic tonal study for exploring the real editor without choosing a personal photo. */
export function drawSample(canvas: HTMLCanvasElement): HTMLCanvasElement {
  canvas.width = 1200;
  canvas.height = 900;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("This browser could not open the sample.");
  const sky = ctx.createLinearGradient(0, 0, 0, 900);
  sky.addColorStop(0, "#ded7cf");
  sky.addColorStop(1, "#918694");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 1200, 900);
  ctx.fillStyle = "#f3e9cf";
  ctx.beginPath();
  ctx.arc(830, 230, 95, 0, Math.PI * 2);
  ctx.fill();
  const layers = [
    {
      color: "#9d979f",
      points: [
        [0, 540],
        [190, 300],
        [380, 520],
        [650, 360],
        [960, 610],
        [1200, 430],
      ],
    },
    {
      color: "#605b6a",
      points: [
        [0, 660],
        [230, 550],
        [530, 260],
        [820, 620],
        [1050, 470],
        [1200, 650],
      ],
    },
    {
      color: "#302e3b",
      points: [
        [0, 760],
        [280, 630],
        [520, 780],
        [820, 590],
        [1200, 730],
      ],
    },
    {
      color: "#12131c",
      points: [
        [0, 850],
        [300, 750],
        [560, 840],
        [900, 735],
        [1200, 810],
      ],
    },
  ];
  for (const layer of layers) {
    ctx.fillStyle = layer.color;
    ctx.beginPath();
    ctx.moveTo(0, 900);
    for (const [x, y] of layer.points) ctx.lineTo(x, y);
    ctx.lineTo(1200, 900);
    ctx.closePath();
    ctx.fill();
  }
  return canvas;
}

export async function createSampleImage(): Promise<ImageBitmap> {
  return createImageBitmap(drawSample(document.createElement("canvas")));
}
