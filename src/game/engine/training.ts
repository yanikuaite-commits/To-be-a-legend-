import { ATTR_KEYS, OVERALL_WEIGHTS, SPECIALTIES, TRAINING_PROGRAMS } from "../config";
import type { AttrKey, Career } from "../types";
import { applyGrowth, attributeCap, calculateOverall, trainingGain, upgradeCost, xpForLevel } from "./attributes";
import { addNews, checkAchievements, cloneCareer } from "./careerUtils";
import { clamp, type Rand } from "./rng";

function seededRand(seed: number): Rand {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function intensityFactor(intensity: "leve" | "normal" | "intenso"): number {
  return intensity === "leve" ? 0.75 : intensity === "normal" ? 1 : 1.3;
}

export function addXp(career: Career, amount: number): { levels: number; evo: number } {
  career.xp += Math.max(0, Math.round(amount));
  let levels = 0;
  let evo = 0;
  while (career.xp >= xpForLevel(career.level)) {
    career.xp -= xpForLevel(career.level);
    career.level += 1;
    career.evoPoints += 2;
    levels += 1;
    evo += 2;
  }
  if (levels > 0) {
    addNews(career, {
      title: `Nível ${career.level} alcançado`,
      body: `A tua experiência cresceu. Ganhaste ${evo} pontos de evolução.`,
      type: "training",
      icon: "TrendingUp",
    });
  }
  return { levels, evo };
}

export interface TrainingResult {
  career: Career;
  ok: boolean;
  message: string;
  gained: AttrKey[];
  evo: number;
  xp: number;
}

export function doTraining(
  careerInput: Career,
  programId: string,
  intensity: "leve" | "normal" | "intenso",
  extra = false,
): TrainingResult {
  const career = cloneCareer(careerInput);
  const program = TRAINING_PROGRAMS.find((p) => p.id === programId);
  if (!program) return { career: careerInput, ok: false, message: "Treino inválido.", gained: [], evo: 0, xp: 0 };
  if (career.training?.week === career.week && career.training.done && !extra) {
    return { career: careerInput, ok: false, message: "Já treinaste esta semana.", gained: [], evo: 0, xp: 0 };
  }
  const energyCost = Math.round(program.energy * intensityFactor(intensity) * (extra ? 1.15 : 1));
  if (career.energy < energyCost) {
    return {
      career: careerInput,
      ok: false,
      message: "Sem energia suficiente. Descansa ou paga fisioterapia.",
      gained: [],
      evo: 0,
      xp: 0,
    };
  }
  if (extra && career.coins < 260) {
    return { career: careerInput, ok: false, message: "Precisas de 260 moedas para a sessão extra.", gained: [], evo: 0, xp: 0 };
  }

  const rand = seededRand(career.seed + career.week * 719 + career.trainingCount * 37 + (programId.length * 13));
  career.energy = clamp(career.energy - energyCost, 0, 100);
  career.coachTrust = clamp(career.coachTrust + Math.round(rand() * 2) - (intensity === "intenso" ? 0 : 0), 0, 100);
  career.morale = clamp(career.morale + 1, 0, 100);

  const attrs = program.id === "specific"
    ? (Object.entries(OVERALL_WEIGHTS[career.position])
        .filter(([, w]) => (w ?? 0) > 0.03)
        .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
        .slice(0, 4)
        .map(([key]) => key as AttrKey))
    : program.attrs;

  const gainCount = Math.max(1, trainingGain(rand, career.potential, career.overall, career.age, intensity) - (extra ? 1 : 0));
  const gained = applyGrowth(career.attributes, rand, attributeCap(career), gainCount, attrs);
  const xpGain = Math.round(
    (12 + rand() * 8 + career.coachTrust / 14) * intensityFactor(intensity) * (extra ? 0.7 : 1) * (career.age <= 21 ? 1.25 : 1),
  );
  const evoGain = Math.round((1 + rand() * 2) * (extra ? 0.6 : 1) + (intensity === "intenso" ? 1 : 0));
  career.evoPoints += evoGain;
  addXp(career, xpGain);
  career.trainingCount += 1;

  if (extra) career.coins -= 260;
  career.training = { week: career.week, focus: programId, intensity, done: true };
  career.overall = calculateOverall(career.attributes, career.position);
  career.specialty = career.specialty ?? (career.level >= 4 ? null : career.specialty);

  if (intensity === "intenso" && rand() < 0.055 + (career.age > 30 ? 0.05 : 0) && career.injuryWeeks === 0) {
    career.injuryWeeks = 1;
    addNews(career, {
      title: "Lesão no treino",
      body: "Um esforço excessivo deixou-te com uma sobrecarga muscular. Vais falhar o próximo jogo.",
      type: "injury",
      icon: "HeartPulse",
    });
  }

  const gainedLabels = gained.map((g) => g);
  checkAchievements(career);

  return {
    career,
    ok: true,
    message: gained.length
      ? `Treino concluído. Evoluíste em ${gainedLabels.length} atributo(s), ganhaste ${xpGain} XP e ${evoGain} pontos.`
      : `Treino concluído. Ganhaste ${xpGain} XP e ${evoGain} pontos de evolução.`,
    gained,
    evo: evoGain,
    xp: xpGain,
  };
}

export function recoverEnergy(careerInput: Career): { career: Career; ok: boolean; message: string } {
  const career = cloneCareer(careerInput);
  const cost = 140;
  if (career.coins < cost) return { career: careerInput, ok: false, message: "Moedas insuficientes." };
  if (career.energy >= 98) return { career: careerInput, ok: false, message: "Já estás a 100% de energia." };
  career.coins -= cost;
  career.energy = clamp(career.energy + 26, 0, 100);
  if (career.injuryWeeks > 0) career.injuryWeeks = Math.max(0, career.injuryWeeks - 1);
  return { career, ok: true, message: "Sessão de fisioterapia concluída (+26 energia)." };
}

export function sleepRest(careerInput: Career): { career: Career; ok: boolean; message: string } {
  const career = cloneCareer(careerInput);
  if (career.energy >= 99) return { career: careerInput, ok: false, message: "Estás descansado." };
  career.energy = clamp(career.energy + 18, 0, 100);
  career.morale = clamp(career.morale + 3, 0, 100);
  return { career, ok: true, message: "Dia de descanso. Recuperaste 18 de energia." };
}

export function upgradeAttribute(
  careerInput: Career,
  key: AttrKey,
): { career: Career; ok: boolean; message: string } {
  const career = cloneCareer(careerInput);
  const value = career.attributes[key];
  const cost = upgradeCost(value);
  const cap = attributeCap(career);
  if (career.evoPoints < cost) return { career: careerInput, ok: false, message: `Precisas de ${cost} pontos de evolução.` };
  if (value >= cap) return { career: careerInput, ok: false, message: "Limite de potencial atingido neste atributo." };
  if (career.overall >= career.potential) return { career: careerInput, ok: false, message: "Atingiste o teu potencial máximo atual." };
  career.evoPoints -= cost;
  career.attributes[key] += 1;
  const newOverall = calculateOverall(career.attributes, career.position);
  if (newOverall > career.potential) {
    career.attributes[key] -= 1;
    career.evoPoints += cost;
    return { career: careerInput, ok: false, message: "Atingiste o teu potencial máximo." };
  }
  career.overall = newOverall;
  checkAchievements(career);
  return { career, ok: true, message: `${key}: ${value} → ${career.attributes[key]}.` };
}

export function chooseSpecialty(
  careerInput: Career,
  specialtyId: string,
): { career: Career; ok: boolean; message: string } {
  const career = cloneCareer(careerInput);
  const specialty = SPECIALTIES.find((s) => s.id === specialtyId);
  if (!specialty) return { career: careerInput, ok: false, message: "Especialização inválida." };
  if (career.level < 6) return { career: careerInput, ok: false, message: "Precisas do nível 6." };
  if (career.overall < specialty.minOverall) {
    return { career: careerInput, ok: false, message: `Precisas de Overall ${specialty.minOverall}.` };
  }
  const avg = specialty.attrs.reduce((sum, key) => sum + career.attributes[key], 0) / specialty.attrs.length;
  if (avg < 62) return { career: careerInput, ok: false, message: "Atributos-chave insuficientes (média 62)." };
  career.specialty = specialty.id;
  addNews(career, {
    title: `Nova especialização: ${specialty.name}`,
    body: specialty.description,
    type: "training",
    icon: specialty.icon,
  });
  return { career, ok: true, message: `Especialização ativa: ${specialty.name}.` };
}export function hireAgent(careerInput: Career): { career: Career; ok: boolean; message: string } {
  const career = cloneCareer(careerInput);
  const cost = 450;
  if (career.hasAgent) return { career: careerInput, ok: false, message: "Já tens um empresário." };
  if (career.coins < cost) return { career: careerInput, ok: false, message: "Moedas insuficientes." };

  career.coins -= cost;
  career.hasAgent = true;
  career.reputation = clamp(career.reputation + 2, 0, 100);
  addNews(career, {
    title: "Novo empresário contratado",
    body: "Um agente experiente vai abrir portas no mercado. Espera novas propostas.",
    type: "transfer",
    icon: "Briefcase",
  });
  return { career, ok: true, message: "Empresário contratado. Novas propostas em breve." };
}

export function allTrainingAttrs(): AttrKey[] {
  return ATTR_KEYS;
}
