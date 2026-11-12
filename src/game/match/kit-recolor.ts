import type { Kit } from "../types";

/**
 * Cores-chave que o artista pinta na roupa do sprite. O jogo troca-as pela
 * paleta do clube, por isso um só jogo de sprites serve todas as equipas.
 * Se os sprites não usarem estas cores (os atuais, neutros), nada é alterado.
 */
export const KIT_KEY_COLORS = {
  trim: [255, 255, 0],
  primary: [255, 0, 255],
  shorts: [0, 255, 255],
  socks: [0, 255, 0],
} as const;

type KeyName = keyof typeof KIT_KEY_COLORS;
const KEY_NAMES = Object.keys(KIT_KEY_COLORS) as KeyName[];

const MATCH_TOLERANCE = 52;
const TOLERANCE_SQ = MATCH_TOLERANCE * MATCH_TOLERANCE;

/** Um sprite é tratado como "com cores-chave" a partir desta fração de roupa. */
export const KEY_COLOR_COVERAGE_THRESHOLD = 0.01;

/**
 * Cada sequência recolhida ocupa ~4 MB, por isso só se guardam as últimas
 * usadas. Como um jogador só usa uma direção de cada vez, os quadros
 * reciclados voltam a ser pedidos logo a seguir e raramente se recalcula.
 */
const MAX_CACHED_SEQUENCES = 10;
const cache = new Map<string, HTMLCanvasElement[]>();
const coverageCache = new Map<string, boolean>();

function hexToRgb(hex: string): [number, number, number] {
  const value = parseInt(hex.replace("#", ""), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function luminance(r: number, g: number, b: number): number {
  return (r * 0.299 + g * 0.587 + b * 0.114) / 255;
}

const KEY_LUMINANCE = KEY_NAMES.map((name) => {
  const [r, g, b] = KIT_KEY_COLORS[name];
  return luminance(r, g, b);
});

/** Índice da cor-chave mais próxima, ou -1 se o píxel não for roupa. */
function keyColorIndex(r: number, g: number, b: number): number {
  // As cores-chave têm um canal quase a 0 e outro quase a 255; a pele e o
  // contorno não passam aqui, o que evita a busca exata na maioria dos píxeis.
  const min = Math.min(r, g, b);
  if (min > 60) return -1;
  if (Math.max(r, g, b) < 195) return -1;

  let best = -1;
  let bestDistance = TOLERANCE_SQ;
  for (let i = 0; i < KEY_NAMES.length; i++) {
    const [kr, kg, kb] = KIT_KEY_COLORS[KEY_NAMES[i]];
    const distance = (r - kr) ** 2 + (g - kg) ** 2 + (b - kb) ** 2;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = i;
    }
  }
  return best;
}

/**
 * Troca as cores-chave presentes no quadro pela cor correspondente do clube,
 * preservando a luminosidade do píxel para manter sombreado e contorno.
 */
function recolorFrame(source: HTMLCanvasElement, targets: [number, number, number][]): HTMLCanvasElement {
  const out = document.createElement("canvas");
  out.width = source.width;
  out.height = source.height;
  const context = out.getContext("2d");
  if (!context) return source;
  context.drawImage(source, 0, 0);

  const image = context.getImageData(0, 0, out.width, out.height);
  const { data } = image;

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const index = keyColorIndex(r, g, b);
    if (index < 0) continue;

    const factor = Math.min(1.25, luminance(r, g, b) / KEY_LUMINANCE[index]);
    const [tr, tg, tb] = targets[index];
    data[i] = Math.min(255, Math.round(tr * factor));
    data[i + 1] = Math.min(255, Math.round(tg * factor));
    data[i + 2] = Math.min(255, Math.round(tb * factor));
  }

  context.putImageData(image, 0, 0);
  return out;
}

/**
 * Devolve os quadros já com as cores do clube. A recolha é memorizada por
 * sequência + uniforme, por isso cada combinação só é processada uma vez.
 */
export function recolorFrames(
  sequence: string,
  frames: HTMLCanvasElement[],
  kit: Kit,
): HTMLCanvasElement[] {
  const key = `${sequence}|${kit.primary}|${kit.shorts}|${kit.socks}|${kit.trim}`;
  const hit = cache.get(key);
  if (hit) {
    cache.delete(key);
    cache.set(key, hit);
    return hit;
  }

  const targets: [number, number, number][] = [
    hexToRgb(kit.trim),
    hexToRgb(kit.primary),
    hexToRgb(kit.shorts),
    hexToRgb(kit.socks),
  ];
  const recolored = frames.map((frame) => recolorFrame(frame, targets));

  cache.set(key, recolored);
  while (cache.size > MAX_CACHED_SEQUENCES) {
    const oldest = cache.keys().next().value;
    if (oldest === undefined) break;
    cache.delete(oldest);
  }
  return recolored;
}

/**
 * Verifica se uma sequência traz a roupa em cores-chave. Serve para decidir se
 * ainda é preciso pintar o uniforme por cima com o polígono antigo.
 */
export function kitHasKeyColors(sequence: string, frames: HTMLCanvasElement[]): boolean {
  const cached = coverageCache.get(sequence);
  if (cached !== undefined) return cached;

  let coverage = false;
  const sample = frames[0];
  const context = sample?.getContext("2d");
  if (context) {
    const { data } = context.getImageData(0, 0, sample.width, sample.height);
    let hits = 0;
    let body = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] === 0) continue;
      body++;
      if (keyColorIndex(data[i], data[i + 1], data[i + 2]) >= 0) hits++;
    }
    coverage = body > 0 && hits / body >= KEY_COLOR_COVERAGE_THRESHOLD;
  }

  coverageCache.set(sequence, coverage);
  return coverage;
}

/**
 * Pré-calcula a recolha de todas as sequências para os uniformes da partida.
 * Chamado durante o carregamento, para a primeira jogada não engasgar.
 */
export function prewarmKitFrames(
  frames: Map<string, HTMLCanvasElement[]>,
  kits: Kit[],
): void {
  const unique = new Map<string, Kit>();
  for (const kit of kits) {
    unique.set(`${kit.primary}|${kit.shorts}|${kit.socks}|${kit.trim}`, kit);
  }
  for (const sequence of frames.keys()) {
    const sheet = frames.get(sequence);
    if (!sheet?.length) continue;
    for (const kit of unique.values()) recolorFrames(sequence, sheet, kit);
  }
}
