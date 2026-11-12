import { ATTR_KEYS, OVERALL_WEIGHTS, SPECIALTIES } from "../config";
import type { AttrKey, Attributes, Career, PositionCode } from "../types";
import { clamp, randInt, type Rand } from "./rng";

export function calculateOverall(attrs: Attributes, position: PositionCode): number {
  const weights = OVERALL_WEIGHTS[position];
  let total = 0;
  let sum = 0;
  for (const key of ATTR_KEYS) {
    const weight = weights[key] ?? 0;
    if (weight > 0) {
      total += attrs[key] * weight;
      sum += weight;
    }
  }
  return Math.round(total / (sum || 1));
}

const POSITION_PROFILE: Record<PositionCode, AttrKey[]> = {
  PL: ["finishing", "positioning", "heading", "speed", "dribbling"],
  ED: ["speed", "dribbling", "acceleration", "ballControl", "finishing"],
  EE: ["speed", "dribbling", "acceleration", "ballControl", "finishing"],
  MO: ["passing", "vision", "dribbling", "ballControl", "finishing"],
  MC: ["passing", "vision", "stamina", "ballControl", "positioning"],
  MD: ["tackling", "interception", "stamina", "passing", "positioning"],
  ME: ["speed", "stamina", "passing", "dribbling", "positioning"],
  DC: ["defending", "tackling", "heading", "positioning", "strength"],
  DD: ["defending", "speed", "stamina", "tackling", "passing"],
  DE: ["defending", "speed", "stamina", "tackling", "passing"],
};

export function createInitialAttributes(rand: Rand, position: PositionCode): Attributes {
  const profile = (POSITION_PROFILE[position] ?? []).filter((k) => ATTR_KEYS.includes(k));
  const attrs = {} as Attributes;
  for (const key of ATTR_KEYS) {
    attrs[key] = clamp(38 + randInt(rand, -4, 5), 30, 55);
  }
  for (const key of profile) {
    attrs[key] = clamp(attrs[key] + randInt(rand, 9, 17), 40, 66);
  }
  // A 16-year-old has physical room but is not developed yet.
  attrs.stamina = clamp(attrs.stamina - 4, 30, 60);
  attrs.strength = clamp(attrs.strength - 6, 28, 58);
  return attrs;
}

export function generateAIAttributes(
  rand: Rand,
  position: PositionCode,
  clubOverall: number,
  isGK = false,
): Attributes {
  const attrs = {} as Attributes;
  const profile = POSITION_PROFILE[position] ?? [];
  for (const key of ATTR_KEYS) {
    attrs[key] = clamp(Math.round(clubOverall + (rand() - 0.5) * 16), 32, 96);
  }
  for (const key of profile) {
    attrs[key] = clamp(Math.round(clubOverall + randInt(rand, 2, 10)), 35, 97);
  }
  if (isGK) {
    attrs.reaction = clamp(clubOverall + randInt(rand, 3, 9), 40, 97);
    attrs.agility = clamp(clubOverall + randInt(rand, 1, 8), 40, 97);
    attrs.positioning = clamp(clubOverall + randInt(rand, 2, 8), 40, 97);
    attrs.strength = clamp(clubOverall + randInt(rand, -4, 6), 35, 95);
    attrs.heading = clamp(clubOverall + randInt(rand, -8, 2), 30, 95);
    attrs.finishing = clamp(30 + randInt(rand, 0, 10), 25, 60);
    attrs.defending = clamp(30 + randInt(rand, 0, 12), 25, 60);
    attrs.passing = clamp(clubOverall - randInt(rand, 2, 12), 35, 90);
  }
  return attrs;
}

export function attributeCap(career: Pick<Career, "potential" | "age">): number {
  let cap = career.potential + 4;
  if (career.age >= 31) cap -= (career.age - 30) * 1.5;
  return clamp(Math.round(cap), 45, 99);
}

export function upgradeCost(value: number): number {
  if (value < 60) return 1;
  if (value < 70) return 2;
  if (value < 78) return 3;
  if (value < 85) return 4;
  return 5;
}

export function xpForLevel(level: number): number {
  return 100 + level * 55;
}

export function marketValue(career: Pick<Career, "overall" | "age" | "potential" | "reputation" | "seasonStats">): number {
  const base = 190_000 * Math.pow(1.245, career.overall - 50);
  let ageFactor = 1;
  if (career.age <= 18) ageFactor = 1.65;
  else if (career.age <= 21) ageFactor = 1.5;
  else if (career.age <= 25) ageFactor = 1.3;
  else if (career.age <= 28) ageFactor = 1.05;
  else if (career.age <= 31) ageFactor = 0.72;
  else if (career.age <= 34) ageFactor = 0.38;
  else ageFactor = 0.15;
  const potentialFactor = 1 + Math.max(0, career.potential - career.overall) * 0.018;
  const repFactor = 0.75 + career.reputation / 220;
  return Math.round(base * ageFactor * potentialFactor * repFactor);
}

export function suggestedSalary(value: number, clubOverall: number): number {
  const base = value * 0.0018;
  const clubFactor = 0.6 + clubOverall / 100;
  return Math.max(420, Math.round(base * clubFactor));
}

export function specialtyFor(attrs: Attributes, position: PositionCode): string | null {
  const candidates = SPECIALTIES.filter((s) => {
    const avg = s.attrs.reduce((sum, key) => sum + attrs[key], 0) / s.attrs.length;
    return avg >= 66;
  });
  if (!candidates.length) return null;
  const isDef = ["DC", "DD", "DE"].includes(position);
  const isMid = ["MC", "MD", "ME", "MO"].includes(position);
  const preferred: Record<string, string> = {
    rock: "defender",
    "deep-lying": "mid",
    playmaker: "mid",
    finisher: "attack",
    dribbler: "attack",
    sprinter: "any",
    "complete-forward": "attack",
  };
  const scored = candidates
    .map((s) => {
      let score = s.attrs.reduce((sum, key) => sum + attrs[key], 0);
      const kind = preferred[s.id];
      if (kind === "defender" && isDef) score += 40;
      if (kind === "mid" && isMid) score += 30;
      if (kind === "attack" && !isDef && !isMid) score += 30;
      return { id: s.id, score };
    })
    .sort((a, b) => b.score - a.score);
  return scored[0]?.id ?? null;
}

export function bestAttribute(attrs: Attributes): { key: AttrKey; value: number } {
  let best: { key: AttrKey; value: number } = { key: "speed", value: 0 };
  for (const key of ATTR_KEYS) {
    if (attrs[key] > best.value) best = { key, value: attrs[key] };
  }
  return best;
}

export function applyGrowth(
  attrs: Attributes,
  rand: Rand,
  cap: number,
  amount: number,
  keys: AttrKey[],
): AttrKey[] {
  const gained: AttrKey[] = [];
  const pool = keys.length ? keys : ATTR_KEYS;
  for (let i = 0; i < amount; i++) {
    const key = pool[Math.floor(rand() * pool.length)];
    if (attrs[key] < cap) {
      attrs[key] += 1;
      if (!gained.includes(key)) gained.push(key);
    }
  }
  return gained;
}

export function trainingGain(
  rand: Rand,
  potential: number,
  overall: number,
  age: number,
  intensity: "leve" | "normal" | "intenso",
): number {
  const headroom = Math.max(0, potential - overall);
  const ageFactor = age <= 20 ? 1.35 : age <= 24 ? 1.15 : age <= 28 ? 0.9 : age <= 31 ? 0.6 : 0.3;
  const intensityFactor = intensity === "leve" ? 0.7 : intensity === "normal" ? 1 : 1.35;
  const base = 0.9 + rand() * 1.5;
  return Math.round(base * ageFactor * intensityFactor * (headroom > 12 ? 1.2 : headroom > 5 ? 1 : 0.6));
}
