import { COUNTRY_MAP } from "./data/countries";
import { LEAGUE_MAP, getClub } from "./data/clubs";
import { kitForClub } from "./data/appearance";
import { formatMoney, weeksToDate } from "./engine/rng";
import { marketValue, suggestedSalary } from "./engine/attributes";
import type { Career, Kit, LeagueState } from "./types";
import { averageRating, nextFixture, playerLeague } from "./engine/careerUtils";

export function careerKit(career: Career): Kit {
  return kitForClub(getClub(career.clubId), "home");
}

export function nationality(code: string) {
  return COUNTRY_MAP[code] ?? { name: code, flag: "🏳️", code };
}

export function careerDate(career: Career): string {
  return weeksToDate(career.season, career.week);
}

export function seasonDisplay(career: Career): string {
  return career.seasonLabel;
}

export function valueLabel(value: number): string {
  return formatMoney(value);
}

export function playerMarketValue(career: Career): number {
  return marketValue(career);
}

export function salaryLabel(value: number): string {
  return `${formatMoney(value)}/sem`;
}

export function clubOf(career: Career) {
  return getClub(career.clubId);
}

export function leagueOf(career: Career, leagueId = career.seasonLeagueId) {
  return LEAGUE_MAP[leagueId];
}

export function careerLeagueState(career: Career): LeagueState | undefined {
  return playerLeague(career);
}

export function nextCareerFixture(career: Career) {
  return nextFixture(career);
}

export function formLabel(rating: number): string {
  if (rating >= 8) return "Inspirado";
  if (rating >= 7) return "Em grande forma";
  if (rating >= 6.4) return "Regular";
  if (rating >= 5.5) return "Irregular";
  return "Em baixa";
}

export function conditionLabel(energy: number): string {
  if (energy >= 85) return "Fresco";
  if (energy >= 65) return "Bem";
  if (energy >= 45) return "Cansado";
  if (energy >= 25) return "Muito cansado";
  return "Exausto";
}

export function moraleLabel(morale: number): string {
  if (morale >= 85) return "Radiante";
  if (morale >= 70) return "Feliz";
  if (morale >= 55) return "Estável";
  if (morale >= 40) return "Insatisfeito";
  return "Em baixo";
}

export function contractYearsLeft(career: Career): string {
  const years = career.contract.years;
  if (years <= 1) return "Último ano";
  return `${years} anos`;
}

export function playerStatus(career: Career): {
  label: string;
  tone: "lime" | "gold" | "red" | "default";
} {
  if (career.injuryWeeks > 0) return { label: `Lesionado · ${career.injuryWeeks} sem.`, tone: "red" };
  if (career.suspensionWeeks > 0) return { label: `Castigado · ${career.suspensionWeeks} jogo(s)`, tone: "red" };
  if (career.energy < 35) return { label: "Muito cansado", tone: "gold" };
  if (career.morale < 40) return { label: "Moral em baixo", tone: "gold" };
  return { label: "Disponível", tone: "lime" };
}

export function averageSeasonRating(career: Career): number {
  return averageRating(career.seasonStats);
}

export function averageCareerRating(career: Career): number {
  return averageRating(career.stats);
}

export function recommendSalary(career: Career): number {
  return suggestedSalary(marketValue(career), getClub(career.clubId).overall);
}

export function positionStatus(career: Career): string {
  if (career.captain) return `${career.position} · Capitão`;
  return career.position;
}

export function competitionShort(name: string): string {
  if (name.includes("Taça")) return "TAÇA";
  if (name.includes("Continental")) return "CONT";
  if (name.includes("Particular") || name.includes("Qualificação")) return "SEL";
  return "LIGA";
}
