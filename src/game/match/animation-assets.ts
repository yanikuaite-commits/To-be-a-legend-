export type MatchAnimationFrames = Map<string, HTMLCanvasElement[]>;

interface SpriteSheet {
  file: string;
  columns: number;
  rows: number;
  frames: number;
}

const SHEETS: Record<string, SpriteSheet> = {
  walk_front: { file: "caminhada_frente.png", columns: 5, rows: 2, frames: 10 },
  walk_back: { file: "caminhada_costas_.png", columns: 4, rows: 2, frames: 8 },
  walk_side_right: { file: "caminhada_lado_direita.png", columns: 4, rows: 2, frames: 8 },
  walk_side_left: { file: "caminhada_lado_esquerda.png", columns: 4, rows: 2, frames: 8 },
  walk_diagonal_right: { file: "caminhada_diagonal_direita.png", columns: 4, rows: 2, frames: 8 },
  walk_diagonal_left: { file: "caminhada_diagonal_esquerda.png", columns: 4, rows: 2, frames: 8 },
  run_front: { file: "corrida_frente.png", columns: 4, rows: 2, frames: 8 },
  run_back_1: { file: "corrida_costas_1.png", columns: 4, rows: 2, frames: 8 },
  run_back_2: { file: "corrida_costas_2.png", columns: 4, rows: 2, frames: 8 },
  run_side_right: { file: "corrida_lado_direita.png", columns: 4, rows: 2, frames: 8 },
  run_side_left: { file: "corrida_lado_esquerda.png", columns: 4, rows: 2, frames: 8 },
  run_diagonal_right: { file: "corrida_diagonal_direita.png", columns: 4, rows: 2, frames: 8 },
  run_diagonal_left: { file: "corrida_diagonal_esquerda.png", columns: 4, rows: 2, frames: 8 },
};

const TARGET_WIDTH = 256;
const TARGET_HEIGHT = 512;
let framesPromise: Promise<MatchAnimationFrames> | null = null;

function loadImage(path: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Falhou a carregar a animação ${path}`));
    image.src = path;
  });
}

function isBackdrop(data: Uint8ClampedArray, index: number): boolean {
  const red = data[index];
  const green = data[index + 1];
  const blue = data[index + 2];
  const darkest = Math.min(red, green, blue);
  const lightest = Math.max(red, green, blue);
  return darkest > 20 && lightest < 100 && lightest - darkest < 22;
}

function removeBackdrop(canvas: HTMLCanvasElement): void {
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Não foi possível preparar os quadros de animação.");

  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = image;
  const width = canvas.width;
  const height = canvas.height;
  const visited = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let readIndex = 0;
  let writeIndex = 0;

  const enqueue = (pixel: number) => {
    if (visited[pixel]) return;
    visited[pixel] = 1;
    if (isBackdrop(data, pixel * 4)) queue[writeIndex++] = pixel;
  };

  for (let x = 0; x < width; x++) {
    enqueue(x);
    enqueue((height - 1) * width + x);
  }
  for (let y = 1; y < height - 1; y++) {
    enqueue(y * width);
    enqueue(y * width + width - 1);
  }

  while (readIndex < writeIndex) {
    const pixel = queue[readIndex++];
    data[pixel * 4 + 3] = 0;
    const x = pixel % width;
    const y = Math.floor(pixel / width);
    if (x > 0) enqueue(pixel - 1);
    if (x + 1 < width) enqueue(pixel + 1);
    if (y > 0) enqueue(pixel - width);
    if (y + 1 < height) enqueue(pixel + width);
  }

  context.putImageData(image, 0, 0);
}

async function loadFrames(): Promise<MatchAnimationFrames> {
  const entries = await Promise.all(
    Object.entries(SHEETS).map(async ([name, sheet]) => {
      const path = `/assets/animations/${sheet.file}`;
      const image = await loadImage(path);
      const frameWidth = image.width / sheet.columns;
      const frameHeight = image.height / sheet.rows;
      if (!Number.isInteger(frameWidth) || !Number.isInteger(frameHeight)) {
        throw new Error(`O spritesheet ${path} não tem dimensões compatíveis com a grelha.`);
      }

      const frames: HTMLCanvasElement[] = [];
      for (let frame = 0; frame < sheet.frames; frame++) {
        const canvas = document.createElement("canvas");
        canvas.width = TARGET_WIDTH;
        canvas.height = TARGET_HEIGHT;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Não foi possível preparar os quadros de animação.");
        const column = frame % sheet.columns;
        const row = Math.floor(frame / sheet.columns);
        context.drawImage(
          image,
          column * frameWidth,
          row * frameHeight,
          frameWidth,
          frameHeight,
          0,
          0,
          TARGET_WIDTH,
          TARGET_HEIGHT,
        );
        removeBackdrop(canvas);
        frames.push(canvas);
      }
      return [name, frames] as const;
    }),
  );
  return new Map(entries);
}

export function loadMatchAnimations(): Promise<MatchAnimationFrames> {
  if (!framesPromise) framesPromise = loadFrames();
  return framesPromise;
}
