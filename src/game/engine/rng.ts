export function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Rand = () => number;

export function randInt(rand: Rand, min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}

export function pick<T>(rand: Rand, arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

export function shuffle<T>(rand: Rand, arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function gaussian(rand: Rand, mean = 0, sd = 1): number {
  const u = 1 - rand();
  const v = rand();
  return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function chance(rand: Rand, probability: number): boolean {
  return rand() < probability;
}

export function weightedPick<T>(rand: Rand, items: T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rand() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

export function formatMoney(value: number): string {
  if (value >= 1_000_000) return `€${(value / 1_000_000).toFixed(value >= 10_000_000 ? 1 : 2)}M`;
  if (value >= 1_000) return `€${Math.round(value / 1000)}k`;
  return `€${Math.round(value)}`;
}

export function ordinal(n: number): string {
  return `${n}.º`;
}

export function weeksToDate(seasonStartYear: number, week: number): string {
  const month = ((week + 6) % 12) + 1;
  const day = ((week * 7) % 27) + 1;
  const months = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  return `${day} ${months[month - 1]} ${seasonStartYear}`;
}

export function seasonLabel(year: number): string {
  return `${year}/${String((year + 1) % 100).padStart(2, "0")}`;
}
