import type { Appearance, Kit } from "../types";

const ROOT = "/assets/";
const imageCache = new Map<string, Promise<HTMLImageElement>>();
const tintCache = new Map<string, HTMLCanvasElement>();
const characterCache = new Map<string, HTMLCanvasElement>();
const portraitCache = new Map<string, string>();

export const CANVAS_W = 256;
export const CANVAS_H = 512;
export const FEET_Y = 500;
export const CENTER_X = 128;

interface Anchor {
  file: string;
  crop_x: number;
  crop_y: number;
  anchor_x: number;
  anchor_y: number;
}

interface Geometry {
  neckY: number;
  hipY: number;
  faceTop: number;
  faceBottom: number;
  faceCenterX: number;
  faceWidth: number;
  faceHeight: number;
  eyeY: number;
  eyeDx: number;
  eyeHalfW: number;
  eyeHalfH: number;
  shoulderY: number;
  shirtBottom: number;
  feetY: number;
}

let anchorsPromise: Promise<Record<string, Anchor>> | null = null;
let rigPromise: Promise<Record<string, any>> | null = null;

export interface CharacterRig {
  neckY: number;
  hipY: number;
  hipLX: number;
  hipRX: number;
  centerX: number;
  feetY: number;
}

const DEFAULT_RIG: CharacterRig = {
  neckY: 232,
  hipY: 340,
  hipLX: 108,
  hipRX: 148,
  centerX: 128,
  feetY: 500,
};

const geometryCache = new Map<string, Geometry>();

function loadImage(path: string): Promise<HTMLImageElement> {
  if (!imageCache.has(path)) {
    imageCache.set(
      path,
      new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Falhou a carregar " + path));
        img.src = ROOT + path;
      }),
    );
  }
  return imageCache.get(path) as Promise<HTMLImageElement>;
}

function loadAnchors(): Promise<Record<string, Anchor>> {
  if (!anchorsPromise) {
    anchorsPromise = fetch(ROOT + "hair_library/hair_library.json")
      .then((r) => r.json())
      .catch(() => ({}));
  }
  return anchorsPromise;
}

function loadRig(): Promise<Record<string, any>> {
  if (!rigPromise) {
    rigPromise = fetch(ROOT + "rig/rig.json")
      .then((r) => r.json())
      .catch(() => ({}));
  }
  return rigPromise;
}

/** Returns the cut-out pivots used to animate the supplied chibi characters. */
export async function getCharacterRig(baseId: string): Promise<CharacterRig> {
  try {
    const rig = await loadRig();
    const entry = rig[baseId];
    if (entry?.neck_pivot && entry?.hip_pivot_l && entry?.hip_pivot_r) {
      return {
        neckY: entry.neck_pivot[1],
        hipY: entry.hip_pivot_l[1],
        hipLX: entry.hip_pivot_l[0],
        hipRX: entry.hip_pivot_r[0],
        centerX: entry.center_x ?? CENTER_X,
        feetY: entry.feet_baseline_y ?? FEET_Y,
      };
    }
  } catch {
    // Use the shared fallback when the optional rig file is unavailable.
  }
  return DEFAULT_RIG;
}

function makeCanvas(w = CANVAS_W, h = CANVAS_H): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return (r * 299 + g * 587 + b * 114) / 1000;
}

function shade(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  const target = amount > 0 ? 255 : 0;
  const t = Math.abs(amount);
  const mix = (v: number) => Math.round(v + (target - v) * t);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

export function isLightColor(hex: string): boolean {
  return luminance(hex) > 150;
}

function tinted(img: HTMLImageElement, color: string, key: string): HTMLCanvasElement {
  const cacheKey = `${key}|${color}`;
  const cached = tintCache.get(cacheKey);
  if (cached) return cached;
  const c = makeCanvas(img.width, img.height);
  const g = c.getContext("2d");
  if (!g) return c;
  g.drawImage(img, 0, 0);
  g.globalCompositeOperation = "multiply";
  g.fillStyle = color;
  g.fillRect(0, 0, c.width, c.height);
  g.globalCompositeOperation = "destination-in";
  g.drawImage(img, 0, 0);
  tintCache.set(cacheKey, c);
  return c;
}

function alphaBounds(img: HTMLImageElement, topLimit?: number): { x0: number; y0: number; x1: number; y1: number } {
  const c = makeCanvas(img.width, img.height);
  const g = c.getContext("2d");
  if (!g) return { x0: 0, y0: 0, x1: img.width, y1: img.height };
  g.drawImage(img, 0, 0);
  const data = g.getImageData(0, 0, img.width, img.height).data;
  let x0 = img.width;
  let y0 = img.height;
  let x1 = 0;
  let y1 = 0;
  const limit = topLimit ?? img.height;
  for (let y = 0; y < Math.min(limit, img.height); y++) {
    for (let x = 0; x < img.width; x++) {
      const a = data[(y * img.width + x) * 4 + 3];
      if (a > 40) {
        if (x < x0) x0 = x;
        if (y < y0) y0 = y;
        if (x > x1) x1 = x;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < x0) return { x0: 0, y0: 0, x1: img.width, y1: img.height };
  return { x0, y0, x1, y1 };
}

async function getGeometry(baseId: string): Promise<Geometry> {
  const cached = geometryCache.get(baseId);
  if (cached) return cached;
  let neckY = 232;
  let hipY = 340;
  try {
    const rig = await loadRig();
    const entry = rig[baseId];
    if (entry) {
      neckY = entry.neck_pivot[1];
      hipY = entry.hip_pivot_l[1];
    }
  } catch {
    // fallback geometry
  }
  let face = { x0: 80, y0: 130, x1: 176, y1: neckY };
  try {
    const skin = await loadImage(`layers/${baseId}/skin.png`);
    const bounds = alphaBounds(skin, neckY + 4);
    // Skin includes hands below the neck: restrict to the head band.
    if (bounds.x1 > bounds.x0 && bounds.y1 < neckY + 10) face = bounds;
  } catch {
    // fallback
  }
  const faceWidth = Math.max(80, face.x1 - face.x0);
  const faceHeight = Math.max(70, face.y1 - face.y0);
  const faceCenterX = (face.x0 + face.x1) / 2;
  const geometry: Geometry = {
    neckY,
    hipY,
    faceTop: face.y0,
    faceBottom: face.y1,
    faceCenterX,
    faceWidth,
    faceHeight,
    eyeY: face.y1 - faceHeight * 0.4,
    eyeDx: faceWidth * 0.195,
    eyeHalfW: faceWidth * 0.105,
    eyeHalfH: faceHeight * 0.1,
    shoulderY: neckY + 4,
    shirtBottom: hipY + 20,
    feetY: FEET_Y,
  };
  geometryCache.set(baseId, geometry);
  return geometry;
}

function eyeTintCanvas(body: HTMLImageElement, geom: Geometry, eyeColor: string, key: string): HTMLCanvasElement {
  const cacheKey = `eyes|${key}|${eyeColor}`;
  const cached = tintCache.get(cacheKey);
  if (cached) return cached;
  const c = makeCanvas();
  const g = c.getContext("2d");
  if (!g) return c;
  g.drawImage(body, 0, 0);
  const boxes: [number, number, number, number][] = [
    [
      Math.round(geom.faceCenterX - geom.eyeDx - geom.eyeHalfW),
      Math.round(geom.eyeY - geom.eyeHalfH),
      Math.round(geom.eyeHalfW * 2),
      Math.round(geom.eyeHalfH * 2),
    ],
    [
      Math.round(geom.faceCenterX + geom.eyeDx - geom.eyeHalfW),
      Math.round(geom.eyeY - geom.eyeHalfH),
      Math.round(geom.eyeHalfW * 2),
      Math.round(geom.eyeHalfH * 2),
    ],
  ];
  const [r, gg, b] = hexToRgb(eyeColor);
  for (const [x, y, w, h] of boxes) {
    const data = g.getImageData(x, y, w, h);
    for (let i = 0; i < data.data.length; i += 4) {
      const rr = data.data[i];
      const ggg = data.data[i + 1];
      const bb = data.data[i + 2];
      const a = data.data[i + 3];
      const lum = (rr * 299 + ggg * 587 + bb * 114) / 1000;
      if (a > 80 && lum < 95) {
        data.data[i] = r;
        data.data[i + 1] = gg;
        data.data[i + 2] = b;
      }
    }
    g.putImageData(data, x, y);
  }
  const overlay = makeCanvas();
  const og = overlay.getContext("2d");
  if (!og) return overlay;
  og.drawImage(c, 0, 0);
  og.globalCompositeOperation = "destination-in";
  og.drawImage(body, 0, 0);
  tintCache.set(cacheKey, overlay);
  return overlay;
}

function drawBrows(ctx: CanvasRenderingContext2D, geom: Geometry, style: Appearance["brow"], hairColor: string) {
  if (style === "none") return;
  const thickness = style === "strong" ? 5 : 3;
  const arch = style === "arched" ? 5 : 2;
  ctx.save();
  ctx.strokeStyle = shade(hairColor, -0.15);
  ctx.lineCap = "round";
  ctx.lineWidth = thickness;
  for (const dir of [-1, 1]) {
    const cx = geom.faceCenterX + dir * geom.eyeDx;
    const y = geom.eyeY - geom.eyeHalfH * 1.55;
    ctx.beginPath();
    ctx.moveTo(cx - geom.eyeHalfW * 0.9, y + arch);
    ctx.quadraticCurveTo(cx, y - arch, cx + geom.eyeHalfW * 0.9, y + arch * 0.3);
    ctx.stroke();
  }
  ctx.restore();
}

function buildKitCanvas(kit: Kit, geom: Geometry): HTMLCanvasElement {
  const c = makeCanvas();
  const g = c.getContext("2d");
  if (!g) return c;
  const top = Math.round(geom.neckY - 12);
  const hip = Math.round(geom.hipY);
  const bottom = FEET_Y;
  const shoulder = Math.round(geom.neckY + 2);
  const jerseyBottom = hip + 24;

  // Jersey base (clipped later to the clothing silhouette).
  g.fillStyle = kit.primary;
  g.beginPath();
  g.roundRect(38, top, 180, jerseyBottom - top, 26);
  g.fill();

  // Pattern layer.
  g.save();
  g.beginPath();
  g.rect(30, top, 200, jerseyBottom - top);
  g.clip();
  if (kit.pattern === "stripes") {
    g.fillStyle = kit.secondary;
    for (let x = 30; x < 240; x += 34) g.fillRect(x, top, 16, jerseyBottom - top);
  } else if (kit.pattern === "hoops") {
    g.fillStyle = kit.secondary;
    for (let y = top + 16; y < jerseyBottom; y += 34) g.fillRect(30, y, 200, 16);
  } else if (kit.pattern === "halves") {
    g.fillStyle = kit.secondary;
    g.fillRect(30, top, 98, jerseyBottom - top);
  } else if (kit.pattern === "sash") {
    g.strokeStyle = kit.secondary;
    g.lineWidth = 32;
    g.beginPath();
    g.moveTo(24, jerseyBottom);
    g.lineTo(228, top + 10);
    g.stroke();
  }
  g.restore();

  // Sleeve cuffs + hem trim.
  g.fillStyle = kit.trim;
  g.fillRect(38, jerseyBottom - 12, 180, 7);
  g.fillRect(38, top + 48, 14, 48);
  g.fillRect(204, top + 48, 14, 48);

  // Collar V.
  g.fillStyle = kit.trim;
  g.beginPath();
  g.moveTo(112, top + 2);
  g.lineTo(128, top + 28);
  g.lineTo(144, top + 2);
  g.closePath();
  g.fill();
  g.fillStyle = shade(kit.primary, -0.28);
  g.beginPath();
  g.moveTo(118, top + 2);
  g.lineTo(128, top + 20);
  g.lineTo(138, top + 2);
  g.closePath();
  g.fill();

  // Crest.
  g.fillStyle = kit.trim;
  g.beginPath();
  g.arc(92, top + 76, 11, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = kit.secondary;
  g.beginPath();
  g.arc(92, top + 76, 7, 0, Math.PI * 2);
  g.fill();

  // Shorts.
  g.fillStyle = kit.shorts;
  g.beginPath();
  g.roundRect(52, hip + 8, 152, 82, 14);
  g.fill();
  g.fillStyle = kit.trim;
  g.fillRect(84, hip + 8, 6, 82);
  g.fillRect(166, hip + 8, 6, 82);
  g.fillStyle = shade(kit.shorts, -0.22);
  g.fillRect(52, hip + 78, 152, 8);

  // Socks.
  g.fillStyle = kit.socks;
  g.fillRect(30, hip + 78, 196, bottom - (hip + 78));
  g.fillStyle = kit.trim;
  for (const y of [hip + 116, hip + 134]) g.fillRect(30, y, 196, 7);

  // Boots.
  g.fillStyle = shade(kit.secondary, -0.55);
  g.beginPath();
  g.roundRect(52, bottom - 26, 82, 24, 8);
  g.fill();
  g.beginPath();
  g.roundRect(122, bottom - 26, 82, 24, 8);
  g.fill();
  g.fillStyle = kit.trim;
  g.fillRect(52, bottom - 6, 152, 4);

  return c;
}

function clothingMask(body: HTMLImageElement, skin: HTMLImageElement): HTMLCanvasElement {
  const c = makeCanvas();
  const g = c.getContext("2d");
  if (!g) return c;
  g.drawImage(body, 0, 0);
  g.globalCompositeOperation = "destination-out";
  g.drawImage(skin, 0, 0);
  return c;
}

function drawAccessory(
  ctx: CanvasRenderingContext2D,
  appearance: Appearance,
  geometry: Geometry,
  kit: Kit,
) {
  const { accessory } = appearance;
  if (accessory === "none") return;
  if (accessory === "headband") {
    ctx.save();
    ctx.fillStyle = kit.trim;
    ctx.beginPath();
    ctx.roundRect(
      geometry.faceCenterX - geometry.faceWidth * 0.45,
      geometry.faceTop + geometry.faceHeight * 0.33,
      geometry.faceWidth * 0.9,
      geometry.faceHeight * 0.09,
      5,
    );
    ctx.fill();
    ctx.fillStyle = kit.secondary;
    ctx.fillRect(
      geometry.faceCenterX - geometry.faceWidth * 0.45,
      geometry.faceTop + geometry.faceHeight * 0.36,
      geometry.faceWidth * 0.9,
      3,
    );
    ctx.restore();
  }
  if (accessory === "wristband" || accessory === "gloves") {
    const glove = accessory === "gloves";
    const y = geometry.hipY - 14;
    ctx.save();
    ctx.fillStyle = glove ? kit.secondary : "#f8fafc";
    for (const x of [54, 184]) {
      ctx.beginPath();
      ctx.roundRect(x, y, 20, 18, 5);
      ctx.fill();
    }
    ctx.fillStyle = glove ? kit.trim : kit.primary;
    for (const x of [54, 184]) {
      ctx.fillRect(x, y + 6, 20, 4);
    }
    ctx.restore();
  }
}

function drawNumber(ctx: CanvasRenderingContext2D, number: number, kit: Kit, geometry: Geometry) {
  const size = Math.round((geometry.hipY - geometry.neckY) * 0.48);
  ctx.save();
  ctx.font = `900 ${size}px "Arial Black", Impact, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const y = geometry.neckY + (geometry.hipY - geometry.neckY) * 0.64;
  ctx.lineWidth = Math.max(2, size * 0.08);
  ctx.strokeStyle = isLightColor(kit.primary) ? "rgba(2,8,20,0.55)" : "rgba(255,255,255,0.4)";
  ctx.strokeText(String(number), 128, y);
  ctx.fillStyle = kit.number;
  ctx.fillText(String(number), 128, y);
  ctx.restore();
}

function drawPlaceholder(ctx: CanvasRenderingContext2D, appearance: Appearance) {
  ctx.save();
  ctx.fillStyle = appearance.skin || "#d9895a";
  ctx.beginPath();
  ctx.arc(128, 170, 62, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(80, 230, 96, 170, 34);
  ctx.fill();
  ctx.fillStyle = appearance.hairColor || "#1b1514";
  ctx.beginPath();
  ctx.arc(128, 140, 58, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export async function composeCharacter(
  appearance: Appearance,
  kit: Kit,
  number = 10,
): Promise<HTMLCanvasElement> {
  const cacheKey = JSON.stringify([
    number,
    appearance.baseId,
    appearance.skin,
    appearance.hairStyle,
    appearance.hairColor,
    appearance.brow,
    appearance.eyeColor,
    appearance.accessory,
    appearance.height,
    appearance.build,
    kit.pattern,
    kit.primary,
    kit.secondary,
    kit.shorts,
    kit.socks,
    kit.trim,
    kit.number,
  ]);
  const cached = characterCache.get(cacheKey);
  if (cached) return cached;

  const [body, skin] = await Promise.all([
    loadImage(`layers/${appearance.baseId}/body.png`),
    loadImage(`layers/${appearance.baseId}/skin.png`),
  ]);
  const geometry = await getGeometry(appearance.baseId);
  const out = makeCanvas();
  const ctx = out.getContext("2d");
  if (!ctx) return out;

  ctx.drawImage(body, 0, 0);
  ctx.drawImage(tinted(skin, appearance.skin, `layers/${appearance.baseId}/skin.png`), 0, 0);
  ctx.drawImage(eyeTintCanvas(body, geometry, appearance.eyeColor, appearance.baseId), 0, 0);
  drawBrows(ctx, geometry, appearance.brow, appearance.hairColor);

  try {
    if (appearance.hairStyle === "original") {
      const hair = await loadImage(`layers/${appearance.baseId}/hair.png`);
      ctx.drawImage(tinted(hair, appearance.hairColor, `layers/${appearance.baseId}/hair.png`), 0, 0);
    } else {
      const [fill, outline, anchors] = await Promise.all([
        loadImage(`layers/${appearance.baseId}/skull_fill.png`),
        loadImage(`layers/${appearance.baseId}/head_outline.png`),
        loadAnchors(),
      ]);
      ctx.drawImage(tinted(fill, appearance.skin, `layers/${appearance.baseId}/skull_fill.png`), 0, 0);
      ctx.drawImage(outline, 0, 0);
      if (appearance.hairStyle !== "none") {
        const src = anchors[appearance.hairStyle];
        const dst = anchors[appearance.baseId];
        if (src && dst) {
          const hairImg = await loadImage("hair_library/" + src.file);
          const dx = Math.round(dst.anchor_x - src.anchor_x);
          const dy = Math.round(dst.anchor_y - src.anchor_y);
          const tintedHair = tinted(hairImg, appearance.hairColor, `hair_library/${src.file}`);
          ctx.drawImage(tintedHair, src.crop_x + dx, src.crop_y + dy);
        }
      }
    }
  } catch {
    // Hair styles can fail silently; the base character remains usable.
  }

  drawAccessory(ctx, appearance, geometry, kit);

  const kitCanvas = buildKitCanvas(kit, geometry);
  const kg = kitCanvas.getContext("2d");
  if (kg) {
    kg.globalCompositeOperation = "destination-in";
    kg.drawImage(clothingMask(body, skin), 0, 0);
    ctx.drawImage(kitCanvas, 0, 0);
  }
  drawNumber(ctx, number, kit, geometry);

  // Vertical squeeze/stretch for character variety.
  const heightScale = 1 + (appearance.height ?? 0) * 0.035;
  const buildScale = 1 + (appearance.build ?? 0) * 0.035;
  if (heightScale !== 1 || buildScale !== 1) {
    const scaled = makeCanvas();
    const sg = scaled.getContext("2d");
    if (sg) {
      const w = CANVAS_W * buildScale;
      const h = CANVAS_H * heightScale;
      const dx = (CANVAS_W - w) / 2;
      const dy = FEET_Y - FEET_Y * heightScale;
      sg.drawImage(out, 0, 0, CANVAS_W, CANVAS_H, dx, dy, w, h);
      characterCache.set(cacheKey, scaled);
      return scaled;
    }
  }

  characterCache.set(cacheKey, out);
  return out;
}

export function composeCharacterSyncFallback(appearance: Appearance): HTMLCanvasElement {
  const c = makeCanvas();
  const g = c.getContext("2d");
  if (g) drawPlaceholder(g, appearance);
  return c;
}

export async function getPortrait(
  appearance: Appearance,
  kit: Kit,
  mode: "head" | "full" = "head",
  number = 10,
): Promise<string> {
  const key = JSON.stringify([appearance, kit, mode, number]);
  const cached = portraitCache.get(key);
  if (cached) return cached;
  const canvas = await composeCharacter(appearance, kit, number);
  const out = makeCanvas(mode === "head" ? 230 : 256, mode === "head" ? 300 : 512);
  const g = out.getContext("2d");
  if (!g) return "";
  if (mode === "head") {
    // Head + shoulders, keeping the asset's big chibi proportions.
    g.drawImage(canvas, 20, 40, 216, 300, 0, 0, 230, 300);
  } else {
    g.drawImage(canvas, 0, 0);
  }
  const url = out.toDataURL("image/png");
  portraitCache.set(key, url);
  return url;
}

export function clearAssetCaches(): void {
  characterCache.clear();
  portraitCache.clear();
}
