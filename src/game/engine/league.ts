import type { LeagueMatch, LeagueState, TableRow } from "../types";
import { getClub } from "../data/clubs";
import { chance, clamp, mulberry32, randInt, shuffle, type Rand } from "./rng";

export function emptyTableRow(clubId: string): TableRow {
  return { clubId, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0 };
}

function poisson(rand: Rand, lambda: number): number {
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= rand();
  } while (p > L && k < 9);
  return k - 1;
}

export function simulateScore(rand: Rand, homeOverall: number, awayOverall: number): [number, number] {
  const diff = (homeOverall + 3 - awayOverall) / 10;
  const lambdaHome = clamp(1.32 + diff * 0.62, 0.2, 4.2);
  const lambdaAway = clamp(1.12 - diff * 0.52, 0.15, 3.8);
  return [poisson(rand, lambdaHome), poisson(rand, lambdaAway)];
}

export function buildRoundRobin(clubIds: string[], rand: Rand): string[][][] {
  const ids = shuffle(rand, clubIds);
  if (ids.length % 2 !== 0) ids.push("BYE");
  const n = ids.length;
  const rounds: string[][][] = [];
  const arr = [...ids];
  for (let r = 0; r < n - 1; r++) {
    const pairs: string[][] = [];
    for (let i = 0; i < n / 2; i++) {
      const home = arr[i];
      const away = arr[n - 1 - i];
      if (home === "BYE" || away === "BYE") continue;
      // alternate home/away
      if (r % 2 === 0) pairs.push([home, away]);
      else pairs.push([away, home]);
    }
    rounds.push(pairs);
    const fixed = arr[0];
    const rest = arr.slice(1);
    rest.unshift(rest.pop() as string);
    arr.splice(0, arr.length, fixed, ...rest);
  }
  const second = rounds.map((round) => round.map(([h, a]) => [a, h]));
  return [...rounds, ...second];
}

export function createLeagueState(
  leagueId: string,
  clubIds: string[],
  seed: number,
  weekForRound: (round: number) => number,
): LeagueState {
  const rand = mulberry32(seed);
  const rounds = buildRoundRobin(clubIds, rand);
  const table: Record<string, TableRow> = {};
  for (const id of clubIds) table[id] = emptyTableRow(id);

  const matches: LeagueMatch[] = [];
  rounds.forEach((round, roundIndex) => {
    round.forEach(([homeId, awayId], i) => {
      matches.push({
        id: `${leagueId}-r${roundIndex}-m${i}`,
        round: roundIndex,
        week: weekForRound(roundIndex),
        homeId,
        awayId,
        played: false,
      });
    });
  });

  return { leagueId, matches, table };
}

export function applyResult(table: Record<string, TableRow>, clubId: string, gf: number, ga: number) {
  const row = table[clubId];
  if (!row) return;
  row.played += 1;
  row.goalsFor += gf;
  row.goalsAgainst += ga;
  if (gf > ga) {
    row.won += 1;
    row.points += 3;
  } else if (gf === ga) {
    row.drawn += 1;
    row.points += 1;
  } else {
    row.lost += 1;
  }
}

export function standings(state: LeagueState): TableRow[] {
  const rows = Object.values(state.table).map((r) => ({ ...r }));
  rows.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const gdA = a.goalsFor - a.goalsAgainst;
    const gdB = b.goalsFor - b.goalsAgainst;
    if (gdB !== gdA) return gdB - gdA;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return getClub(a.clubId).name.localeCompare(getClub(b.clubId).name);
  });
  return rows;
}

export function leaguePosition(state: LeagueState, clubId: string): number {
  const idx = standings(state).findIndex((r) => r.clubId === clubId);
  return idx < 0 ? 0 : idx + 1;
}

export function currentRoundForWeek(state: LeagueState, week: number): number | null {
  const match = state.matches.find((m) => m.week === week);
  return match ? match.round : null;
}

export function simulateRound(
  state: LeagueState,
  round: number,
  rand: Rand,
  excludeClubId?: string,
): { homeId: string; awayId: string; homeGoals: number; awayGoals: number }[] {
  const results: { homeId: string; awayId: string; homeGoals: number; awayGoals: number }[] = [];
  for (const match of state.matches) {
    if (match.round !== round || match.played) continue;
    const home = getClub(match.homeId);
    const away = getClub(match.awayId);
    const [hg, ag] = simulateScore(rand, home.overall, away.overall);
    match.played = true;
    match.homeGoals = hg;
    match.awayGoals = ag;
    applyResult(state.table, match.homeId, hg, ag);
    applyResult(state.table, match.awayId, ag, hg);
    results.push({ homeId: match.homeId, awayId: match.awayId, homeGoals: hg, awayGoals: ag });
    void excludeClubId;
  }
  return results;
}

export function finishRound(
  state: LeagueState,
  round: number,
  playerClubId: string,
  playerGoals: number,
  playerOpponentGoals: number,
  playerWasHome: boolean,
  rand: Rand,
) {
  for (const match of state.matches) {
    if (match.round !== round || match.played) continue;
    if (match.homeId === playerClubId || match.awayId === playerClubId) {
      const isHome = match.homeId === playerClubId;
      const hg = isHome ? playerGoals : playerOpponentGoals;
      const ag = isHome ? playerOpponentGoals : playerGoals;
      match.played = true;
      match.homeGoals = hg;
      match.awayGoals = ag;
      applyResult(state.table, match.homeId, hg, ag);
      applyResult(state.table, match.awayId, ag, hg);
      continue;
    }
    const home = getClub(match.homeId);
    const away = getClub(match.awayId);
    const [hg, ag] = simulateScore(rand, home.overall, away.overall);
    match.played = true;
    match.homeGoals = hg;
    match.awayGoals = ag;
    applyResult(state.table, match.homeId, hg, ag);
    applyResult(state.table, match.awayId, ag, hg);
    void playerWasHome;
  }
}

export function simulatePenaltyWinner(rand: Rand, overallA: number, overallB: number): boolean {
  const pA = 0.5 + (overallA - overallB) * 0.01;
  return chance(rand, clamp(pA, 0.25, 0.75));
}

export function randomGoals(rand: Rand, overall: number): number {
  return randInt(rand, 0, overall > 78 ? 4 : 3);
}
