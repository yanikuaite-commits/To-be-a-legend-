import type { AttrKey, PositionCode, StatBlock } from "./types";

export const SAVE_PREFIX = "ttbl.career.";
export const SAVE_INDEX = "ttbl.saves";
export const SETTINGS_KEY = "ttbl.settings";

export const GAME_VERSION = 1;
export const TOTAL_WEEKS = 24;
export const LEAGUE_SIZE = 10;
export const LEAGUE_ROUNDS = 18;

export const POSITIONS: PositionCode[] = ["DC", "DD", "DE", "MC", "MD", "ME", "MO", "ED", "EE", "PL"];

export const POSITION_LABEL: Record<PositionCode, string> = {
  DC: "Defesa Central",
  DD: "Lateral Direito",
  DE: "Lateral Esquerdo",
  MC: "Médio Centro",
  MD: "Médio Defensivo",
  ME: "Médio Esquerdo",
  MO: "Médio Ofensivo",
  ED: "Extremo Direito",
  EE: "Extremo Esquerdo",
  PL: "Ponta de Lança",
};

export const POSITION_SHORT: Record<PositionCode, string> = {
  DC: "DC",
  DD: "DD",
  DE: "DE",
  MC: "MC",
  MD: "MD",
  ME: "ME",
  MO: "MO",
  ED: "ED",
  EE: "EE",
  PL: "PL",
};

export const ATTR_META: Record<AttrKey, { label: string; group: string; short: string }> = {
  finishing: { label: "Finalização", group: "Ataque", short: "FIN" },
  passing: { label: "Passe", group: "Técnica", short: "PAS" },
  dribbling: { label: "Drible", group: "Técnica", short: "DRI" },
  speed: { label: "Velocidade", group: "Físico", short: "VEL" },
  acceleration: { label: "Aceleração", group: "Físico", short: "ACL" },
  ballControl: { label: "Controlo de Bola", group: "Técnica", short: "CTL" },
  positioning: { label: "Posicionamento", group: "Mental", short: "POS" },
  stamina: { label: "Resistência", group: "Físico", short: "RES" },
  strength: { label: "Força", group: "Físico", short: "FOR" },
  defending: { label: "Defesa", group: "Defesa", short: "DEF" },
  heading: { label: "Cabeceamento", group: "Ataque", short: "CAB" },
  vision: { label: "Visão de Jogo", group: "Mental", short: "VIS" },
  agility: { label: "Agilidade", group: "Físico", short: "AGI" },
  reaction: { label: "Reação", group: "Mental", short: "REA" },
  interception: { label: "Interceção", group: "Defesa", short: "INT" },
  tackling: { label: "Desarme", group: "Defesa", short: "DES" },
};

export const ATTR_KEYS = Object.keys(ATTR_META) as AttrKey[];

export const ATTR_GROUPS = ["Ataque", "Técnica", "Físico", "Mental", "Defesa"];

/** Position-specific weighting used to compute the overall rating. */
export const OVERALL_WEIGHTS: Record<PositionCode, Partial<Record<AttrKey, number>>> = {
  PL: {
    finishing: 0.22,
    positioning: 0.16,
    speed: 0.12,
    dribbling: 0.12,
    ballControl: 0.1,
    heading: 0.1,
    acceleration: 0.08,
    strength: 0.06,
    passing: 0.04,
  },
  ED: {
    speed: 0.16,
    acceleration: 0.13,
    dribbling: 0.15,
    ballControl: 0.11,
    finishing: 0.12,
    passing: 0.09,
    positioning: 0.1,
    agility: 0.08,
    vision: 0.06,
  },
  EE: {
    speed: 0.16,
    acceleration: 0.13,
    dribbling: 0.15,
    ballControl: 0.11,
    finishing: 0.12,
    passing: 0.09,
    positioning: 0.1,
    agility: 0.08,
    vision: 0.06,
  },
  MO: {
    passing: 0.16,
    vision: 0.16,
    dribbling: 0.12,
    ballControl: 0.12,
    finishing: 0.08,
    positioning: 0.1,
    agility: 0.07,
    speed: 0.06,
    stamina: 0.05,
    acceleration: 0.05,
    reaction: 0.03,
  },
  MC: {
    passing: 0.18,
    vision: 0.15,
    stamina: 0.1,
    ballControl: 0.1,
    positioning: 0.1,
    dribbling: 0.07,
    tackling: 0.07,
    interception: 0.06,
    strength: 0.05,
    agility: 0.04,
    speed: 0.04,
    acceleration: 0.04,
  },
  MD: {
    stamina: 0.12,
    passing: 0.13,
    dribbling: 0.09,
    speed: 0.11,
    acceleration: 0.09,
    positioning: 0.09,
    ballControl: 0.08,
    tackling: 0.07,
    interception: 0.06,
    vision: 0.06,
    agility: 0.05,
    strength: 0.05,
  },
  ME: {
    stamina: 0.12,
    passing: 0.13,
    dribbling: 0.09,
    speed: 0.11,
    acceleration: 0.09,
    positioning: 0.09,
    ballControl: 0.08,
    tackling: 0.07,
    interception: 0.06,
    vision: 0.06,
    agility: 0.05,
    strength: 0.05,
  },
  DC: {
    defending: 0.18,
    tackling: 0.15,
    positioning: 0.13,
    heading: 0.12,
    strength: 0.1,
    interception: 0.11,
    reaction: 0.06,
    speed: 0.05,
    stamina: 0.04,
    passing: 0.03,
    ballControl: 0.03,
  },
  DD: {
    defending: 0.14,
    tackling: 0.12,
    speed: 0.12,
    stamina: 0.1,
    positioning: 0.1,
    interception: 0.09,
    acceleration: 0.09,
    passing: 0.06,
    heading: 0.06,
    strength: 0.05,
    reaction: 0.04,
    ballControl: 0.03,
  },
  DE: {
    defending: 0.14,
    tackling: 0.12,
    speed: 0.12,
    stamina: 0.1,
    positioning: 0.1,
    interception: 0.09,
    acceleration: 0.09,
    passing: 0.06,
    heading: 0.06,
    strength: 0.05,
    reaction: 0.04,
    ballControl: 0.03,
  },
};

/** 4-2-3-1 lineup slots used by the match engine. */
export const LINEUP_SLOTS: {
  role: PositionCode | "GK";
  x: number;
  y: number;
}[] = [
  { role: "GK", x: -46, y: 0 },
  { role: "DD", x: -33, y: -24 },
  { role: "DC", x: -35, y: -8 },
  { role: "DC", x: -35, y: 9 },
  { role: "DE", x: -33, y: 24 },
  { role: "MD", x: -19, y: -12 },
  { role: "MC", x: -22, y: 10 },
  { role: "MO", x: -4, y: 0 },
  { role: "ED", x: 14, y: -22 },
  { role: "PL", x: 22, y: 0 },
  { role: "EE", x: 14, y: 22 },
];

export interface TrainingProgram {
  id: string;
  name: string;
  icon: string;
  description: string;
  attrs: AttrKey[];
  energy: number;
  color: string;
}

export const TRAINING_PROGRAMS: TrainingProgram[] = [
  {
    id: "finishing",
    name: "Finalização",
    icon: "Target",
    description: "Remates, colocação e frieza na área.",
    attrs: ["finishing", "positioning", "heading"],
    energy: 14,
    color: "#f5c451",
  },
  {
    id: "dribbling",
    name: "Drible",
    icon: "Sparkles",
    description: "Condução, fintas e mudanças de direção.",
    attrs: ["dribbling", "ballControl", "agility"],
    energy: 15,
    color: "#c084fc",
  },
  {
    id: "passing",
    name: "Passe",
    icon: "Route",
    description: "Precisão curta, longa e visão de jogo.",
    attrs: ["passing", "vision", "ballControl"],
    energy: 12,
    color: "#38bdf8",
  },
  {
    id: "speed",
    name: "Velocidade",
    icon: "Zap",
    description: "Aceleração, sprint e explosão.",
    attrs: ["speed", "acceleration", "agility"],
    energy: 18,
    color: "#f87171",
  },
  {
    id: "stamina",
    name: "Resistência",
    icon: "HeartPulse",
    description: "Fôlego para os 90 minutos.",
    attrs: ["stamina", "strength", "positioning"],
    energy: 17,
    color: "#fb923c",
  },
  {
    id: "defending",
    name: "Defesa",
    icon: "Shield",
    description: "Desarme, interceção e marcação.",
    attrs: ["defending", "tackling", "interception"],
    energy: 16,
    color: "#4ade80",
  },
  {
    id: "control",
    name: "Controlo de Bola",
    icon: "CircleDot",
    description: "Primeiro toque, proteção e reação.",
    attrs: ["ballControl", "dribbling", "reaction"],
    energy: 13,
    color: "#a3e635",
  },
  {
    id: "positioning",
    name: "Posicionamento",
    icon: "Crosshair",
    description: "Leitura do jogo e movimentos sem bola.",
    attrs: ["positioning", "reaction", "vision"],
    energy: 11,
    color: "#facc15",
  },
  {
    id: "specific",
    name: "Treino de Posição",
    icon: "Flag",
    description: "Rotina específica para a tua posição.",
    attrs: [],
    energy: 15,
    color: "#22d3ee",
  },
];

export interface Specialty {
  id: string;
  name: string;
  icon: string;
  description: string;
  attrs: AttrKey[];
  requirement: string;
  minOverall: number;
}

export const SPECIALTIES: Specialty[] = [
  {
    id: "finisher",
    name: "Finalizador",
    icon: "Target",
    description: "Instinto letal dentro da área. Bónus em remates e cabeceamentos.",
    attrs: ["finishing", "positioning", "heading"],
    requirement: "Finalização e Posicionamento elevados",
    minOverall: 62,
  },
  {
    id: "dribbler",
    name: "Driblador",
    icon: "Sparkles",
    description: "Um contra um devastador, difícil de desarmar.",
    attrs: ["dribbling", "ballControl", "agility"],
    requirement: "Drible e Controlo de Bola elevados",
    minOverall: 62,
  },
  {
    id: "playmaker",
    name: "Criador de Jogo",
    icon: "Brain",
    description: "Passes que abrem defesas. Bónus em assistências.",
    attrs: ["passing", "vision", "ballControl"],
    requirement: "Passe e Visão de Jogo elevados",
    minOverall: 64,
  },
  {
    id: "sprinter",
    name: "Velocista",
    icon: "Zap",
    description: "Explosão nos primeiros metros, rei das transições.",
    attrs: ["speed", "acceleration", "agility"],
    requirement: "Velocidade e Aceleração elevadas",
    minOverall: 60,
  },
  {
    id: "complete-forward",
    name: "Avançado Completo",
    icon: "Flame",
    description: "Finaliza, combina e cria. Perigo em qualquer zona do ataque.",
    attrs: ["finishing", "dribbling", "passing", "speed"],
    requirement: "Ataque completo e Overall elevado",
    minOverall: 72,
  },
  {
    id: "deep-lying",
    name: "Médio Organizador",
    icon: "Waypoints",
    description: "Dita o ritmo, liga defesa e ataque com classe.",
    attrs: ["passing", "vision", "stamina", "positioning"],
    requirement: "Passe, Visão e Resistência elevados",
    minOverall: 66,
  },
  {
    id: "rock",
    name: "Defesa Sólido",
    icon: "ShieldCheck",
    description: "Muralha defensiva. Bónus em desarmes e interceções.",
    attrs: ["defending", "tackling", "interception", "strength"],
    requirement: "Defesa, Desarme e Interceção elevados",
    minOverall: 64,
  },
];

export const EMPTY_STATS = (): StatBlock => ({
  apps: 0,
  starts: 0,
  minutes: 0,
  goals: 0,
  assists: 0,
  passes: 0,
  passesCompleted: 0,
  shots: 0,
  shotsOn: 0,
  dribbles: 0,
  dribblesCompleted: 0,
  tackles: 0,
  interceptions: 0,
  fouls: 0,
  yellow: 0,
  red: 0,
  ratingSum: 0,
  ratingCount: 0,
  motm: 0,
  bestRating: 0,
});

export const COMPETITION_LABEL: Record<string, string> = {
  league: "Liga",
  cup: "Taça Nacional",
  continental: "Liga Continental",
  national: "Seleção",
  friendly: "Amigável",
  worldcup: "Mundial",
};

export const CUP_WEEKS = [5, 10, 15, 22];
export const NAT_WEEKS = [9, 21];
export const CONTINENTAL_WEEKS = [6, 12, 18];

export const CUP_NAMES = ["Taça Nacional", "Taça de Portugal", "Taça da Liga"];

export const RATING_BANDS: { min: number; label: string; color: string }[] = [
  { min: 9, label: "Lendário", color: "#f5c451" },
  { min: 8, label: "Excelente", color: "#4ade80" },
  { min: 7, label: "Muito bom", color: "#a3e635" },
  { min: 6, label: "Cumpridor", color: "#38bdf8" },
  { min: 5, label: "Fraco", color: "#fb923c" },
  { min: 0, label: "Mau", color: "#f87171" },
];

export function ratingColor(rating: number): string {
  return RATING_BANDS.find((b) => rating >= b.min)?.color ?? "#f87171";
}
