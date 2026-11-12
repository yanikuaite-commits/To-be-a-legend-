import type { Appearance, Club, Country, Kit } from "../types";
import { COUNTRY_MAP } from "./countries";

export const SKIN_TONES: { id: string; label: string; hex: string }[] = [
  { id: "tom_1_porcelana", label: "Porcelana", hex: "#FDDCC0" },
  { id: "tom_2_claro", label: "Claro", hex: "#F6C39C" },
  { id: "tom_3_medio_claro", label: "Médio Claro", hex: "#F8AC6B" },
  { id: "tom_4_dourado", label: "Dourado", hex: "#D9895A" },
  { id: "tom_5_moreno", label: "Moreno", hex: "#B96B3E" },
  { id: "tom_6_castanho", label: "Castanho", hex: "#94502C" },
  { id: "tom_7_escuro", label: "Escuro", hex: "#6E3A20" },
  { id: "tom_8_ebano", label: "Ébano", hex: "#4A2616" },
];

export const HAIR_COLORS: { id: string; label: string; hex: string }[] = [
  { id: "preto", label: "Preto", hex: "#1B1514" },
  { id: "castanho_escuro", label: "Castanho Escuro", hex: "#3B2415" },
  { id: "castanho", label: "Castanho", hex: "#6A4325" },
  { id: "louro_escuro", label: "Louro Escuro", hex: "#A97C45" },
  { id: "louro", label: "Louro", hex: "#E3C58A" },
  { id: "platina", label: "Platina", hex: "#F0E6C8" },
  { id: "ruivo", label: "Ruivo", hex: "#A33A1E" },
  { id: "vermelho", label: "Vermelho", hex: "#B3202A" },
  { id: "cinza", label: "Cinza", hex: "#9A9A9A" },
  { id: "branco", label: "Branco", hex: "#EDEDED" },
  { id: "azul", label: "Azul", hex: "#2E5FBF" },
  { id: "roxo", label: "Roxo", hex: "#7A3FBF" },
  { id: "rosa", label: "Rosa", hex: "#E05A9C" },
];

export const EYE_COLORS: { id: string; label: string; hex: string }[] = [
  { id: "castanho", label: "Castanho", hex: "#5B3A1E" },
  { id: "mel", label: "Mel", hex: "#B77A2B" },
  { id: "verde", label: "Verde", hex: "#3E7A4A" },
  { id: "azul", label: "Azul", hex: "#3B6EA5" },
  { id: "cinza", label: "Cinza", hex: "#6B7280" },
  { id: "avela", label: "Avelã", hex: "#8A6B3D" },
];

export const HAIR_STYLES: { id: string; label: string }[] = [
  { id: "original", label: "Original" },
  { id: "none", label: "Raspado" },
  { id: "base_01", label: "Curto Clássico" },
  { id: "base_02", label: "Curto Texturado" },
  { id: "base_03", label: "Franja Longa" },
  { id: "base_04", label: "Médio Ondulado" },
  { id: "base_05", label: "Topete" },
  { id: "base_06", label: "Cacheado" },
  { id: "base_07", label: "Médio Lateral" },
  { id: "base_08", label: "Buzz Cut" },
  { id: "base_09", label: "Risca ao Lado" },
  { id: "base_10", label: "Longo Solto" },
  { id: "base_11", label: "Coque Alto" },
  { id: "base_12", label: "Pixie" },
  { id: "base_13", label: "Ondas Curtas" },
  { id: "casual_01", label: "Cacheado Volumoso" },
  { id: "casual_02", label: "Curls Médios" },
  { id: "casual_03", label: "Longo Ondulado" },
  { id: "casual_04", label: "Bob Curto" },
  { id: "casual_05", label: "Franja Reta" },
  { id: "casual_06", label: "Afro Redondo" },
  { id: "casual_07", label: "Médio Repicado" },
  { id: "casual_08", label: "Curto Frisado" },
  { id: "casual_09", label: "Tranças Curtas" },
  { id: "casual_10", label: "Coque Baixo" },
  { id: "casual_11", label: "Ondas Longas" },
  { id: "casual_12", label: "Franja Lateral" },
  { id: "casual_13", label: "Rastas" },
  { id: "casual_14", label: "Longo Liso" },
  { id: "football_01", label: "Futebol Clássico" },
  { id: "football_02", label: "Médio Desportivo" },
  { id: "football_03", label: "Curto Aparado" },
  { id: "football_04", label: "Topete Desportivo" },
  { id: "football_05", label: "Médio Frisado" },
  { id: "football_06", label: "Cacheado Curto" },
  { id: "football_07", label: "Corte Fade" },
  { id: "football_08", label: "Raspado Fade" },
  { id: "football_09", label: "Médio Liso" },
  { id: "football_10", label: "Longo Desportivo" },
  { id: "football_11", label: "Penteado para Trás" },
  { id: "football_12", label: "Franja Desportiva" },
  { id: "football_13", label: "Coque Desportivo" },
];

export const BASE_FACES: { id: string; label: string }[] = [
  { id: "base_01", label: "Face 01" },
  { id: "base_02", label: "Face 02" },
  { id: "base_03", label: "Face 03" },
  { id: "base_04", label: "Face 04" },
  { id: "base_05", label: "Face 05" },
  { id: "base_06", label: "Face 06" },
  { id: "base_07", label: "Face 07" },
  { id: "base_08", label: "Face 08" },
  { id: "base_09", label: "Face 09" },
  { id: "base_10", label: "Face 10" },
  { id: "base_11", label: "Face 11" },
  { id: "base_12", label: "Face 12" },
  { id: "base_13", label: "Face 13" },
];

export const ACCESSORY_OPTIONS: { id: Appearance["accessory"]; label: string }[] = [
  { id: "none", label: "Nenhum" },
  { id: "headband", label: "Faixa na cabeça" },
  { id: "wristband", label: "Pulseiras" },
  { id: "gloves", label: "Luvas" },
];

export const BROW_OPTIONS: { id: Appearance["brow"]; label: string }[] = [
  { id: "natural", label: "Naturais" },
  { id: "strong", label: "Marcadas" },
  { id: "arched", label: "Arqueadas" },
  { id: "none", label: "Suaves" },
];

export function defaultAppearance(): Appearance {
  return {
    baseId: "base_01",
    skin: SKIN_TONES[3].hex,
    hairStyle: "original",
    hairColor: HAIR_COLORS[0].hex,
    brow: "natural",
    eyeColor: EYE_COLORS[0].hex,
    accessory: "none",
    height: 0,
    build: 0,
  };
}

export interface CharacterPreset {
  id: string;
  baseId: string;
  skin: string;
  hairStyle: string;
  hairColor: string;
  eyeColor: string;
  height: number;
  build: number;
}

export const CHARACTER_PRESETS: CharacterPreset[] = [
  { id: "c01", baseId: "base_01", skin: "#F8AC6B", hairStyle: "original", hairColor: "#1B1514", eyeColor: "#5B3A1E", height: 0, build: 0 },
  { id: "c02", baseId: "base_02", skin: "#D9895A", hairStyle: "casual_02", hairColor: "#3B2415", eyeColor: "#8A6B3D", height: 1, build: 0 },
  { id: "c03", baseId: "base_03", skin: "#94502C", hairStyle: "casual_06", hairColor: "#1B1514", eyeColor: "#5B3A1E", height: -1, build: 1 },
  { id: "c04", baseId: "base_04", skin: "#FDDCC0", hairStyle: "base_05", hairColor: "#E3C58A", eyeColor: "#3B6EA5", height: 0, build: -1 },
  { id: "c05", baseId: "base_05", skin: "#F6C39C", hairStyle: "casual_09", hairColor: "#A97C45", eyeColor: "#3E7A4A", height: 1, build: 0 },
  { id: "c06", baseId: "base_06", skin: "#6E3A20", hairStyle: "casual_10", hairColor: "#1B1514", eyeColor: "#5B3A1E", height: 0, build: 1 },
  { id: "c07", baseId: "base_07", skin: "#B96B3E", hairStyle: "casual_13", hairColor: "#3B2415", eyeColor: "#B77A2B", height: 0, build: 0 },
  { id: "c08", baseId: "base_08", skin: "#4A2616", hairStyle: "casual_08", hairColor: "#1B1514", eyeColor: "#5B3A1E", height: 1, build: 1 },
  { id: "c09", baseId: "base_09", skin: "#FDDCC0", hairStyle: "football_04", hairColor: "#6A4325", eyeColor: "#3B6EA5", height: -1, build: -1 },
  { id: "c10", baseId: "base_10", skin: "#D9895A", hairStyle: "casual_12", hairColor: "#B3202A", eyeColor: "#3E7A4A", height: 0, build: 0 },
  { id: "c11", baseId: "base_11", skin: "#F8AC6B", hairStyle: "football_07", hairColor: "#A97C45", eyeColor: "#8A6B3D", height: 0, build: -1 },
  { id: "c12", baseId: "base_12", skin: "#94502C", hairStyle: "football_11", hairColor: "#3B2415", eyeColor: "#5B3A1E", height: 1, build: 0 },
  { id: "c13", baseId: "base_13", skin: "#6E3A20", hairStyle: "casual_11", hairColor: "#1B1514", eyeColor: "#B77A2B", height: -1, build: 0 },
];

export function presetAppearance(index: number): Appearance {
  const p = CHARACTER_PRESETS[index % CHARACTER_PRESETS.length];
  return {
    baseId: p.baseId,
    skin: p.skin,
    hairStyle: p.hairStyle,
    hairColor: p.hairColor,
    brow: "natural",
    eyeColor: p.eyeColor,
    accessory: "none",
    height: p.height,
    build: p.build,
  };
}

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function isLight(hex: string): boolean {
  const c = hex.replace("#", "");
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150;
}

const PATTERNS: Kit["pattern"][] = ["solid", "stripes", "halves", "sash", "hoops"];

export function kitForClub(club: Club, variant: "home" | "away" | "third" | "gk" = "home"): Kit {
  const h = hash(club.id);
  const primary = club.colors.primary;
  const secondary = club.colors.secondary;
  const accent = club.colors.accent;

  if (variant === "gk") {
    const gkPalette = ["#22d3ee", "#a3e635", "#f59e0b", "#c084fc", "#f472b6"];
    const shirt = gkPalette[h % gkPalette.length];
    return {
      pattern: "solid",
      primary: shirt,
      secondary: "#0b1220",
      shorts: "#0b1220",
      socks: shirt,
      trim: "#f8fafc",
      number: isLight(shirt) ? "#0b1220" : "#f8fafc",
      gk: true,
    };
  }

  let shirt = primary;
  let alt = secondary;
  let shorts = secondary;
  let socks = primary;
  let pattern = PATTERNS[h % PATTERNS.length];

  if (variant === "away") {
    shirt = secondary;
    alt = primary;
    shorts = primary;
    socks = secondary;
    pattern = isLight(secondary) ? "solid" : "stripes";
    if (primary === "#f8fafc" && secondary === "#f8fafc") shirt = accent;
  }
  if (variant === "third") {
    shirt = accent;
    alt = isLight(shirt) ? "#0b1220" : "#f8fafc";
    shorts = "#0b1220";
    socks = accent;
    pattern = "sash";
  }
  if (isLight(shirt) && isLight(alt) && Math.abs(h % 3) === 0) {
    shirt = accent;
  }

  return {
    pattern,
    primary: shirt,
    secondary: alt,
    shorts,
    socks,
    trim: isLight(shirt) ? "#0b1220" : "#f8fafc",
    number: isLight(shirt) ? "#0b1220" : "#f8fafc",
    gk: false,
  };
}

export function kitForNational(countryCode: string, variant: "home" | "away" = "home"): Kit {
  const country: Country = COUNTRY_MAP[countryCode] ?? COUNTRY_MAP.POR;
  const [primary, secondary] = country.colors;
  const shirt = variant === "home" ? primary : secondary;
  const alt = variant === "home" ? secondary : primary;
  return {
    pattern: variant === "home" ? "stripes" : "solid",
    primary: shirt,
    secondary: alt,
    shorts: alt,
    socks: shirt,
    trim: isLight(shirt) ? "#0b1220" : "#f8fafc",
    number: isLight(shirt) ? "#0b1220" : "#f8fafc",
    gk: false,
  };
}

export function faceForNumber(seed: number): Appearance {
  return presetAppearance(seed);
}
