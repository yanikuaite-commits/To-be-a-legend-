import {
  CUP_WEEKS,
  CONTINENTAL_WEEKS,
  EMPTY_STATS,
  GAME_VERSION,
  LEAGUE_ROUNDS,
  NAT_WEEKS,
  SAVE_INDEX,
  SAVE_PREFIX,
  TOTAL_WEEKS,
  TRAINING_PROGRAMS,
} from "../config";
import { CLUBS, LEAGUE_MAP, buildInitialClubLeagues, getClub } from "../data/clubs";
import { COUNTRY_MAP } from "../data/countries";
import { randomName } from "../data/names";
import type {
  Appearance,
  Attributes,
  Career,
  Fixture,
  Foot,
  LeagueState,
  MatchLogEntry,
  PositionCode,
  SaveSlotMeta,
  StatBlock,
  TransferOffer,
} from "../types";
import {
  calculateOverall,
  createInitialAttributes,
  specialtyFor,
  suggestedSalary,
  marketValue,
  applyGrowth,
} from "./attributes";
import {
  addNews,
  bestRatingColor,
  checkAchievements,
  cloneCareer,
  currentClub,
  nextSeasonLabel,
  playerLeague,
  uid,
} from "./careerUtils";
import { createLeagueState, simulateScore, standings } from "./league";
import { clamp, hashString, mulberry32, pick, randInt, shuffle } from "./rng";
import { generateOffers, completePendingTransfer, acceptOffer } from "./transfers";
import { addXp } from "./training";

export interface CreateCareerInput {
  firstName: string;
  lastName: string;
  nationality: string;
  position: PositionCode;
  shirtNumber: number;
  foot: Foot;
  appearance: Appearance;
  clubId: string;
  age?: number;
}

const START_YEAR = 2026;

function clubsForLeague(career: Career, leagueId: string): string[] {
  const fromMap = CLUBS.filter((c) => (career.clubLeagues[c.id] ?? c.leagueId) === leagueId).map((c) => c.id);
  if (fromMap.length >= 10) return fromMap.slice(0, 10);
  const fillers = CLUBS.filter((c) => c.leagueId === leagueId && !fromMap.includes(c.id)).map((c) => c.id);
  return [...fromMap, ...fillers].slice(0, 10);
}

function buildLeagues(career: Career): LeagueState[] {
  return Object.keys(LEAGUE_MAP).map((leagueId, idx) =>
    createLeagueState(
      leagueId,
      clubsForLeague(career, leagueId),
      career.seed + idx * 7919 + career.season * 31,
      (round) => 2 + round,
    ),
  );
}

function makeFixture(
  career: Career,
  params: {
    week: number;
    competition: Fixture["competition"];
    competitionName: string;
    opponentId: string;
    opponentName: string;
    opponentShort: string;
    opponentOverall: number;
    home: boolean;
  },
): Fixture {
  return {
    id: uid(`fx-${career.season}-${params.week}`),
    week: params.week,
    season: career.season,
    competition: params.competition,
    competitionName: params.competitionName,
    opponentId: params.opponentId,
    opponentName: params.opponentName,
    opponentShort: params.opponentShort,
    opponentOverall: params.opponentOverall,
    home: params.home,
    played: false,
  };
}

function buildFixtures(career: Career): Fixture[] {
  const rand = mulberry32(career.seed + career.season * 1013 + hashString(career.clubId));
  const fixtures: Fixture[] = [];
  const state = career.leagues.find((l) => l.leagueId === career.seasonLeagueId);
  if (state) {
    for (const match of state.matches) {
      if (match.homeId !== career.clubId && match.awayId !== career.clubId) continue;
      const isHome = match.homeId === career.clubId;
      const opp = getClub(isHome ? match.awayId : match.homeId);
      fixtures.push(
        makeFixture(career, {
          week: match.week,
          competition: "league",
          competitionName: LEAGUE_MAP[career.seasonLeagueId]?.name ?? "Liga",
          opponentId: opp.id,
          opponentName: opp.name,
          opponentShort: opp.short,
          opponentOverall: opp.overall,
          home: isHome,
        }),
      );
    }
  }

  const club = getClub(career.clubId);
  const cupPool = shuffle(
    rand,
    CLUBS.filter((c) => c.country === club.country && c.id !== club.id),
  );
  const cupOpponents: string[] = [];
  for (let i = 0; i < 4; i++) {
    const sorted = [...cupPool].sort((a, b) => a.overall - b.overall);
    const minIdx = Math.min(sorted.length - 1, Math.floor((i / 4) * sorted.length));
    const maxIdx = Math.min(sorted.length - 1, Math.floor(((i + 1.5) / 4) * sorted.length));
    let candidate = sorted[randInt(rand, minIdx, maxIdx)];
    let guard = 0;
    while (cupOpponents.includes(candidate.id) && guard < 30) {
      candidate = sorted[randInt(rand, minIdx, maxIdx)];
      guard++;
    }
    cupOpponents.push(candidate.id);
  }
  const cupRounds = ["Oitavos de Final", "Quartos de Final", "Meia-final", "Final"];
  cupOpponents.forEach((opponentId, i) => {
    const opp = getClub(opponentId);
    fixtures.push(
      makeFixture(career, {
        week: CUP_WEEKS[i],
        competition: "cup",
        competitionName: `Taça Nacional · ${cupRounds[i]}`,
        opponentId: opp.id,
        opponentName: opp.name,
        opponentShort: opp.short,
        opponentOverall: opp.overall,
        home: i % 2 === 0,
      }),
    );
  });

  const qualifiesContinental = club.overall >= 79 || (club.leagueId === "por1" && career.season > START_YEAR + 0);
  if (qualifiesContinental) {
    const foreign = CLUBS.filter((c) => c.country !== "POR" && c.overall >= 74);
    const pool = shuffle(rand, foreign);
    const stages = ["Oitavos de Final", "Quartos de Final", "Final"];
    stages.forEach((stage, i) => {
      const opp = pool[i % pool.length];
      fixtures.push(
        makeFixture(career, {
          week: CONTINENTAL_WEEKS[i],
          competition: "continental",
          competitionName: `Liga Continental · ${stage}`,
          opponentId: opp.id,
          opponentName: opp.name,
          opponentShort: opp.short,
          opponentOverall: opp.overall,
          home: i !== 1,
        }),
      );
    });
  }

  return fixtures.sort((a, b) => a.week - b.week);
}

function buildScorers(career: Career): Career["scorers"] {
  const rand = mulberry32(career.seed + career.season * 409);
  const leagueClubs = clubsForLeague(career, career.seasonLeagueId).filter((id) => id !== career.clubId);
  const scorers: Career["scorers"] = [];
  for (const clubId of leagueClubs.slice(0, 7)) {
    const club = getClub(clubId);
    const name = randomName(club.country, rand);
    scorers.push({
      name: `${name.first} ${name.last}`,
      clubId,
      goals: 0,
      assists: 0,
    });
  }
  return scorers;
}

export function createCareer(input: CreateCareerInput): Career {
  // A new career always starts from the original football pyramid, even if a
  // previously loaded save had promotions/relegations in this browser session.
  const initialLeagues = buildInitialClubLeagues();
  for (const item of CLUBS) {
    const originalLeague = initialLeagues[item.id];
    if (originalLeague) item.leagueId = originalLeague;
  }
  const seed = hashString(
    `${input.firstName}${input.lastName}${input.clubId}${input.position}${Date.now()}`,
  );
  const rand = mulberry32(seed);
  const club = getClub(input.clubId);
  const leagueId = club.leagueId;
  const attributes = createInitialAttributes(rand, input.position);
  const overall = calculateOverall(attributes, input.position);
  const potential = clamp(overall + randInt(rand, 24, 38), 76, 95);
  const baseCareer: Career = {
    version: GAME_VERSION,
    id: uid("career"),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    nationality: input.nationality,
    position: input.position,
    shirtNumber: input.shirtNumber,
    foot: input.foot,
    age: input.age ?? 16,
    appearance: input.appearance,
    attributes,
    potential,
    overall,
    morale: 72,
    energy: 94,
    form: 55,
    reputation: 7,
    popularity: 4,
    coachTrust: 52,
    leadership: 24,
    xp: 0,
    level: 1,
    evoPoints: 2,
    specialty: specialtyFor(attributes, input.position),
    injuryWeeks: 0,
    suspensionWeeks: 0,
    clubId: input.clubId,
    contract: {
      clubId: input.clubId,
      salary: suggestedSalary(marketValue({ overall, age: 16, potential, reputation: 7, seasonStats: EMPTY_STATS() }), club.overall),
      years: 3,
      role: "Promessa",
      signedSeason: START_YEAR,
      releaseClause: 0,
      bonuses: { goals: 800, assists: 400, apps: 600 },
    },
    season: START_YEAR,
    seasonLabel: `${START_YEAR}/27`,
    week: 1,
    totalWeeks: TOTAL_WEEKS,
    coins: 320,
    hasAgent: false,
    training: null,
    trainingCount: 0,
    stats: EMPTY_STATS(),
    seasonStats: EMPTY_STATS(),
    competitionStats: {},
    seasonCompetitionStats: {},
    clubStats: {},
    scorers: [],
    pendingTransfer: null,
    requestedTransfer: false,
    seasonSummary: null,
    matchLog: [],
    fixtures: [],
    leagues: [],
    news: [],
    achievements: [],
    offers: [],
    history: [],
    national: {
      calledUp: false,
      caps: 0,
      goals: 0,
      assists: 0,
      tournaments: [],
      debut: false,
    },
    seasonStartOverall: overall,
    positionInLeague: 0,
    captain: false,
    retired: false,
    lastReport: null,
    seasonTrophies: [],
    seasonAwards: [],
    transferWindowOpen: false,
    seasonLeagueId: leagueId,
    lastSavedWeek: 0,
    difficulty: "normal",
    seed,
    clubLeagues: buildInitialClubLeagues(),
    settings: { sound: true, haptics: true, quality: "alta" },
  };
  baseCareer.contract.releaseClause = Math.round(marketValue(baseCareer) * 2.2);
  baseCareer.leagues = buildLeagues(baseCareer);
  baseCareer.fixtures = buildFixtures(baseCareer);
  baseCareer.scorers = buildScorers(baseCareer);
  addNews(baseCareer, {
    title: "A tua história começa agora",
    body: `Tens 16 anos e assinaste pelo ${club.name}. O sonho é chegar a lenda. Tudo depende de ti.`,
    type: "career",
    icon: "Sparkles",
  });
  addNews(baseCareer, {
    title: `Bem-vindo ao ${club.name}`,
    body: `${club.stadium}. Treinador: ${club.coach}. O clube aposta em ti para o futuro.`,
    type: "club",
    icon: "Shield",
  });
  checkAchievements(baseCareer);
  return baseCareer;
}

function ensureNationalFixture(career: Career, week: number): void {
  if (career.fixtures.some((f) => f.competition === "national" && f.week === week)) return;
  const rand = mulberry32(career.seed + career.season * 617 + week);
  const others = Object.values(COUNTRY_MAP).filter((c) => c.code !== career.nationality);
  const opp = pick(rand, others);
  const strength: Record<string, number> = {
    BRA: 88, FRA: 87, ESP: 86, ENG: 85, ARG: 86, GER: 84, POR: 84, ITA: 83, NED: 83, BEL: 82,
    URU: 80, COL: 80, CRO: 80, MAR: 79, MEX: 78, USA: 77, JPN: 77, DEN: 78, SWE: 76, SRB: 78,
    NGA: 77, SEN: 78, GHA: 74, NOR: 75,
  };
  career.fixtures.push(
    makeFixture(career, {
      week,
      competition: "national",
      competitionName: week === NAT_WEEKS[0] ? "Particular Internacional" : "Qualificação Continental",
      opponentId: `nat-${opp.code}`,
      opponentName: opp.name,
      opponentShort: opp.code,
      opponentOverall: strength[opp.code] ?? 77,
      home: rand() > 0.5,
    }),
  );
  career.fixtures.sort((a, b) => a.week - b.week);
}

export function maybeCallUp(career: Career): boolean {
  if (career.national.calledUp) return false;
  const nextWeek = NAT_WEEKS.find((w) => w > career.week);
  if (!nextWeek) return false;
  const threshold = clamp(62 + (100 - career.reputation) * 0.14, 63, 78);
  const eligible =
    career.overall >= threshold &&
    career.age >= 18 &&
    career.reputation >= 34 &&
    career.injuryWeeks === 0;
  if (!eligible) return false;
  career.national.calledUp = true;
  ensureNationalFixture(career, nextWeek);
  addNews(career, {
    title: `Convocado por ${COUNTRY_MAP[career.nationality]?.name ?? "Portugal"}`,
    body: `O selecionador chamou-te para os próximos compromissos internacionais. Mostra o teu valor.`,
    type: "national",
    icon: "Flag",
  });
  return true;
}

function simulateOtherLeagues(career: Career): void {
  const rand = mulberry32(career.seed + career.seed * 3 + career.week * 997);
  for (const state of career.leagues) {
    const rounds = new Set(
      state.matches.filter((m) => m.week === career.week && !m.played).map((m) => m.round),
    );
    for (const round of rounds) {
      for (const match of state.matches) {
        if (match.round !== round || match.played) continue;
        const home = getClub(match.homeId);
        const away = getClub(match.awayId);
        const [gh, ga] = simulateScore(rand, home.overall, away.overall);
        match.played = true;
        match.homeGoals = gh;
        match.awayGoals = ga;
        const homeRow = state.table[match.homeId];
        const awayRow = state.table[match.awayId];
        if (homeRow && awayRow) {
          homeRow.played += 1;
          awayRow.played += 1;
          homeRow.goalsFor += gh;
          homeRow.goalsAgainst += ga;
          awayRow.goalsFor += ga;
          awayRow.goalsAgainst += gh;
          if (gh > ga) {
            homeRow.won += 1;
            homeRow.points += 3;
            awayRow.lost += 1;
          } else if (gh === ga) {
            homeRow.drawn += 1;
            homeRow.points += 1;
            awayRow.drawn += 1;
            awayRow.points += 1;
          } else {
            awayRow.won += 1;
            awayRow.points += 3;
            homeRow.lost += 1;
          }
        }
      }
    }
  }
}

function progressScorers(career: Career): void {
  const rand = mulberry32(career.seed + career.week * 173 + career.season * 31);
  for (const s of career.scorers) {
    if (rand() < 0.48) {
      s.goals += rand() < 0.18 ? 2 : 1;
    }
    if (rand() < 0.3) s.assists += 1;
  }
}

function weeklyRecovery(career: Career): void {
  const trained = career.training?.week === career.week && career.training.done;
  career.energy = clamp(career.energy + (trained ? 14 : 20), 0, 100);
  career.morale = clamp(career.morale + (career.morale < 55 ? 3 : -1), 0, 100);
  career.coachTrust = clamp(career.coachTrust + (career.coachTrust < 45 ? 2 : 0), 0, 100);
  if (career.injuryWeeks > 0) {
    career.injuryWeeks -= 1;
    if (career.injuryWeeks === 0) {
      addNews(career, {
        title: "Regresso após lesão",
        body: "Estás recuperado e disponível para o próximo jogo.",
        type: "injury",
        icon: "HeartPulse",
      });
    }
  }
  if (career.suspensionWeeks > 0) career.suspensionWeeks -= 1;
  career.coins += career.contract.salary;
  if (career.seasonStats.apps > 0 && career.seasonStats.apps % 10 === 0) {
    career.coins += career.contract.bonuses.apps;
  }
}

function swapClubLeague(career: Career, clubId: string, newLeagueId: string, counterpartIndexFromBottom = true): void {
  const targetClubs = clubsForLeague(career, newLeagueId).filter((id) => id !== clubId);
  if (!targetClubs.length) return;
  const targetState = career.leagues.find((l) => l.leagueId === newLeagueId);
  const sorted = targetState ? [...standings(targetState)] : [];
  let counterpart = targetClubs[0];
  if (sorted.length) {
    const ordered = counterpartIndexFromBottom ? [...sorted].reverse() : sorted;
    counterpart = ordered.find((r) => r.clubId !== clubId)?.clubId ?? counterpart;
  }
  const oldLeagueId = career.clubLeagues[clubId] ?? getClub(clubId).leagueId;
  career.clubLeagues[clubId] = newLeagueId;
  career.clubLeagues[counterpart] = oldLeagueId;
  const c = getClub(counterpart);
  c.leagueId = oldLeagueId;
  const playerClub = getClub(clubId);
  playerClub.leagueId = newLeagueId;
}

export function advanceWeek(
  careerInput: Career,
): { career: Career; seasonEnded: boolean; retired: boolean; callup: boolean; message: string } {
  if (careerInput.retired) {
    return { career: careerInput, seasonEnded: false, retired: true, callup: false, message: "" };
  }
  const career = cloneCareer(careerInput);
  simulateOtherLeagues(career);
  weeklyRecovery(career);
  progressScorers(career);
  const callup = maybeCallUp(career);

  if (career.week >= 21 && !career.offers.length && !career.pendingTransfer) {
    career.offers = generateOffers(career, career.week);
    career.transferWindowOpen = true;
    if (career.offers.length) {
      addNews(career, {
        title: "Janela de transferências aberta",
        body: "O teu empresário recebeu propostas. Analisa as opções na secção de transferências.",
        type: "transfer",
        icon: "ArrowRightLeft",
      });
    }
  }

  career.training = null;
  if (career.week > NAT_WEEKS[0] && career.week < NAT_WEEKS[1]) career.national.calledUp = false;
  career.week += 1;
  career.transferWindowOpen = career.week >= 21;

  if (career.week > TOTAL_WEEKS) {
    const ended = endSeason(career);
    return { career: ended.career, seasonEnded: true, retired: ended.retired, callup, message: ended.message };
  }

  career.updatedAt = Date.now();
  return { career, seasonEnded: false, retired: false, callup, message: "" };
}

function historyEntry(career: Career, position: number, trophies: string[], awards: string[]): void {
  const leagueName = LEAGUE_MAP[career.seasonLeagueId]?.name ?? "Liga";
  career.history.push({
    season: career.season,
    seasonLabel: career.seasonLabel,
    clubName: getClub(career.clubId).name,
    leagueName,
    apps: career.seasonStats.apps,
    goals: career.seasonStats.goals,
    assists: career.seasonStats.assists,
    rating: career.seasonStats.ratingCount ? career.seasonStats.ratingSum / career.seasonStats.ratingCount : 0,
    overallStart: career.seasonStartOverall,
    overallEnd: career.overall,
    position,
    trophy: trophies[0] ?? null,
    awards,
  });
}

function endSeason(career: Career): { career: Career; retired: boolean; message: string } {
  const state = career.leagues.find((l) => l.leagueId === career.seasonLeagueId);
  const table = state ? standings(state) : [];
  const position = table.findIndex((r) => r.clubId === career.clubId) + 1;
  const trophies = [...career.seasonTrophies];
  const awards = [...career.seasonAwards];
  const league = LEAGUE_MAP[career.seasonLeagueId];
  const avg = career.seasonStats.ratingCount ? career.seasonStats.ratingSum / career.seasonStats.ratingCount : 0;
  const aiTopGoals = career.scorers.reduce((max, s) => Math.max(max, s.goals), 0);
  const aiTopAssists = career.scorers.reduce((max, s) => Math.max(max, s.assists), 0);

  if (position === 1 && league) {
    trophies.push("Campeão Nacional");
    addNews(career, {
      title: `🏆 CAMPEÃO NACIONAL — ${league.name}`,
      body: `O ${getClub(career.clubId).name} é campeão. Uma época inesquecível para todos.`,
      type: "award",
      icon: "Trophy",
    });
  }

  if (career.seasonStats.goals > aiTopGoals && career.seasonStats.goals >= 10) {
    awards.push("Melhor Marcador");
  }
  if (career.seasonStats.assists > aiTopAssists && career.seasonStats.assists >= 8) {
    awards.push("Rei das Assistências");
  }
  if (avg >= 7.3 && career.seasonStats.apps >= 16) {
    awards.push("MVP da Liga");
  }
  if (career.overall >= 86 && avg >= 7.5 && career.reputation >= 82) {
    awards.push("Bola de Ouro");
  }
  if (awards.length) {
    addNews(career, {
      title: `Prémios individuais: ${awards.join(", ")}`,
      body: `O teu desempenho em ${career.seasonLabel} foi reconhecido por toda a imprensa desportiva.`,
      type: "award",
      icon: "Star",
    });
  }
  career.seasonAwards = awards;

  // International tournament summary for seasons in which the player represented the country.
  const nationalSeason = career.seasonCompetitionStats.national;
  if (nationalSeason && nationalSeason.apps > 0) {
    const natRand = mulberry32(career.seed + career.season * 1237 + 17);
    const isWorldCup = (career.season - START_YEAR) % 4 === 0;
    const tournamentName = isWorldCup ? "Mundial" : "Taça Continental";
    const natAvg = nationalSeason.ratingCount ? nationalSeason.ratingSum / nationalSeason.ratingCount : 6.5;
    const power = career.overall + natAvg * 4 + nationalSeason.goals * 2.5 + nationalSeason.assists * 1.5 + (natRand() - 0.5) * 10;
    const result =
      power >= 117 ? "Campeão"
        : power >= 108 ? "Finalista"
          : power >= 98 ? "Meias-finais"
            : power >= 87 ? "Quartos de final"
              : "Fase de grupos";
    career.national.tournaments.push({
      name: tournamentName,
      season: career.season,
      result,
      goals: nationalSeason.goals,
    });
    if (result === "Campeão") {
      trophies.push(tournamentName);
      addNews(career, {
        title: `🏆 CAMPEÕES ${isWorldCup ? "DO MUNDO" : "CONTINENTAIS"}!`,
        body: `${COUNTRY_MAP[career.nationality]?.name ?? "A seleção"} venceu o ${tournamentName}. ${nationalSeason.goals} golos teus no torneio.`,
        type: "award",
        icon: "Trophy",
      });
    } else {
      addNews(career, {
        title: `${tournamentName}: ${result}`,
        body: `A campanha internacional terminou nos ${result.toLowerCase()}. ${nationalSeason.goals} golos em ${nationalSeason.apps} jogos.`,
        type: "national",
        icon: "Flag",
      });
    }
  }

  // Promotion / relegation inside the Portuguese pyramid.
  let promoted = false;
  let relegated = false;
  if (league && league.country === "POR") {
    if (league.tier === 3 && position > 0 && position <= 2) {
      swapClubLeague(career, career.clubId, "por2");
      trophies.push("Subida de divisão");
      promoted = true;
      addNews(career, {
        title: "Subida de divisão!",
        body: "O clube subiu à Liga Promessa. Um passo importante na tua carreira.",
        type: "club",
        icon: "ArrowUpCircle",
      });
    } else if (league.tier === 2 && position > 0 && position <= 2) {
      swapClubLeague(career, career.clubId, "por1");
      trophies.push("Subida de divisão");
      promoted = true;
      addNews(career, {
        title: "Subida à Liga Principal!",
        body: "O clube garantiu o acesso ao escalão máximo. Vais defrontar os gigantes.",
        type: "club",
        icon: "ArrowUpCircle",
      });
    } else if (league.tier === 1 && position >= 9) {
      swapClubLeague(career, career.clubId, "por2");
      relegated = true;
      addNews(career, {
        title: "Descida de divisão",
        body: "A época terminou com despromoção. O clube vai tentar regressar imediatamente.",
        type: "club",
        icon: "ArrowDownCircle",
      });
    } else if (league.tier === 2 && position >= 9) {
      swapClubLeague(career, career.clubId, "por3");
      relegated = true;
    }
  }

  historyEntry(career, position, trophies, awards);

  // Natural development and ageing.
  const rand = mulberry32(career.seed + career.season * 137);
  const minutes = career.seasonStats.minutes;
  const growth = clamp(
    Math.round(
      (career.age <= 20 ? 3.6 : career.age <= 24 ? 2.8 : career.age <= 28 ? 1.6 : career.age <= 30 ? 0.7 : 0.15) +
        minutes / 620 +
        avg * 0.18,
    ),
    0,
    7,
  );
  const cap = clamp(career.potential + 4 - Math.max(0, career.age - 28) * 1.3, 45, 99);
  const grew = applyGrowth(career.attributes, rand, cap, growth, []);
  if (grew.length) {
    addNews(career, {
      title: "Progressão de época",
      body: `A temporada de trabalho rendeu melhorias em ${grew.length} atributo(s).`,
      type: "training",
      icon: "TrendingUp",
    });
  }
  if (career.age >= 30) {
    const decline = career.age >= 35 ? 3 : career.age >= 32 ? 2 : 1;
    for (let i = 0; i < decline; i++) {
      const key = pick(rand, ["speed", "acceleration", "stamina", "agility"] as const);
      if (career.attributes[key] > 35) career.attributes[key] -= 1;
    }
    career.potential = clamp(career.potential - 1, 55, 95);
  }
  career.overall = calculateOverall(career.attributes, career.position);
  career.age += 1;

  career.seasonSummary = {
    seasonLabel: career.seasonLabel,
    lines: [
      `${getClub(career.clubId).name} terminou em ${position > 0 ? `${position}.º` : "posição indefinida"} na ${league?.name ?? "liga"}.`,
      `${career.seasonStats.apps} jogos · ${career.seasonStats.goals} golos · ${career.seasonStats.assists} assistências · média ${avg ? avg.toFixed(2) : "—"}.`,
      promoted ? "Subida de divisão conquistada." : relegated ? "Descida de divisão." : "Manutenção na mesma divisão.",
    ],
    trophies,
    awards,
  };

  // Contract / transfer decisions.
  if (career.pendingTransfer) {
    completePendingTransfer(career);
    addNews(career, {
      title: "Transferência concluída",
      body: `És oficialmente jogador do ${getClub(career.clubId).name}. Um novo capítulo começa.`,
      type: "transfer",
      icon: "ArrowRightLeft",
    });
  } else {
    career.contract.years -= 1;
    if (career.contract.years <= 0) {
      if (career.coachTrust >= 48) {
        career.contract.years = 2;
        career.contract.salary = Math.round(career.contract.salary * 1.1);
        addNews(career, {
          title: "Contrato renovado automaticamente",
          body: `O ${getClub(career.clubId).name} renovou contigo por 2 anos.`,
          type: "transfer",
          icon: "FileSignature",
        });
      } else {
        const offers = generateOffers(career, 99, 5);
        const other = offers.find((o) => o.clubId !== career.clubId);
        if (other) {
          const result = acceptOffer(career, other.id);
          career = result.career;
          completePendingTransfer(career);
        } else {
          career.contract.years = 1;
        }
      }
    }
  }
  // Register season honours before clearing the short-lived lists so the
  // achievement system can still see league titles and promotions.
  career.seasonTrophies = trophies;
  checkAchievements(career);

  career.offers = [];
  career.pendingTransfer = null;
  career.requestedTransfer = false;
  career.seasonTrophies = [];
  career.seasonAwards = [];
  career.matchLog = career.matchLog.slice(0, 120);
  career.season += 1;
  career.seasonLabel = nextSeasonLabel(career.season);
  career.week = 1;
  career.energy = 94;
  career.morale = clamp(career.morale + 5, 0, 100);
  career.coachTrust = 56;
  career.injuryWeeks = 0;
  career.suspensionWeeks = 0;
  career.training = null;
  career.seasonStats = EMPTY_STATS();
  career.seasonCompetitionStats = {};
  career.seasonStartOverall = career.overall;
  career.positionInLeague = 0;
  career.national.calledUp = false;
  career.transferWindowOpen = false;

  let retiring = false;
  if (career.age >= 39 || (career.age >= 36 && career.overall < 62)) {
    retiring = true;
    career.retired = true;
    addNews(career, {
      title: "Fim de carreira",
      body: `Aos ${career.age} anos, penduras as chuteiras. ${career.stats.goals} golos, ${career.stats.assists} assistências, ${career.stats.apps} jogos. Uma carreira para recordar.`,
      type: "career",
      icon: "Hourglass",
    });
  }

  if (!retiring) {
    career.leagues = buildLeagues(career);
    career.fixtures = buildFixtures(career);
    career.scorers = buildScorers(career);
    career.seasonLeagueId = getClub(career.clubId).leagueId;
  }

  checkAchievements(career);
  career.lastReport = null;
  career.updatedAt = Date.now();

  return {
    career,
    retired: retiring,
    message: `Época ${career.history[career.history.length - 1]?.seasonLabel ?? ""} concluída.`,
  };
}

export function finishCurrentSeason(career: Career): Career {
  return cloneCareer(career);
}

export function saveCareer(career: Career): SaveSlotMeta {
  const toSave = cloneCareer(career);
  toSave.updatedAt = Date.now();
  toSave.lastSavedWeek = toSave.week;
  try {
    localStorage.setItem(SAVE_PREFIX + toSave.id, JSON.stringify(toSave));
    const index = loadSaveIndex().filter((s) => s.id !== toSave.id);
    const meta: SaveSlotMeta = {
      id: toSave.id,
      name: `${toSave.firstName} ${toSave.lastName}`,
      club: getClub(toSave.clubId).short,
      seasonLabel: toSave.seasonLabel,
      overall: toSave.overall,
      age: toSave.age,
      position: toSave.position,
      updatedAt: toSave.updatedAt,
      week: toSave.week,
      lastResult: toSave.lastReport
        ? `${toSave.lastReport.homeGoals}-${toSave.lastReport.awayGoals} vs ${toSave.lastReport.awayName}`
        : undefined,
    };
    localStorage.setItem(SAVE_INDEX, JSON.stringify([meta, ...index].slice(0, 12)));
    return meta;
  } catch {
    return {
      id: toSave.id,
      name: `${toSave.firstName} ${toSave.lastName}`,
      club: getClub(toSave.clubId).short,
      seasonLabel: toSave.seasonLabel,
      overall: toSave.overall,
      age: toSave.age,
      position: toSave.position,
      updatedAt: toSave.updatedAt,
      week: toSave.week,
    };
  }
}

export function loadSaveIndex(): SaveSlotMeta[] {
  try {
    const raw = localStorage.getItem(SAVE_INDEX);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SaveSlotMeta[];
    return Array.isArray(parsed) ? parsed.sort((a, b) => b.updatedAt - a.updatedAt) : [];
  } catch {
    return [];
  }
}

export function loadCareer(id: string): Career | null {
  try {
    const raw = localStorage.getItem(SAVE_PREFIX + id);
    if (!raw) return null;
    const career = JSON.parse(raw) as Career;
    if (!career || !career.attributes) return null;
    syncWorld(career);
    return career;
  } catch {
    return null;
  }
}

export function deleteCareer(id: string): SaveSlotMeta[] {
  try {
    localStorage.removeItem(SAVE_PREFIX + id);
    const next = loadSaveIndex().filter((s) => s.id !== id);
    localStorage.setItem(SAVE_INDEX, JSON.stringify(next));
    return next;
  } catch {
    return loadSaveIndex();
  }
}

export function latestCareer(): Career | null {
  const index = loadSaveIndex();
  for (const meta of index) {
    const career = loadCareer(meta.id);
    if (career) return career;
  }
  return null;
}

export function syncWorld(career: Career): void {
  if (!career.clubLeagues) career.clubLeagues = buildInitialClubLeagues();
  for (const club of CLUBS) {
    const leagueId = career.clubLeagues[club.id];
    if (leagueId) club.leagueId = leagueId;
  }
}

export function seasonFixtureWeeks(career: Career): Record<number, Fixture[]> {
  const map: Record<number, Fixture[]> = {};
  for (const fixture of career.fixtures) {
    if (!map[fixture.week]) map[fixture.week] = [];
    map[fixture.week].push(fixture);
  }
  return map;
}

export function nextTrainingOptions() {
  return TRAINING_PROGRAMS;
}

export function autoBenchPlayer(career: Career): boolean {
  return career.injuryWeeks > 0 || career.suspensionWeeks > 0 || career.energy <= 8;
}

export function f(player: Career): string {
  return `${player.firstName} ${player.lastName}`;
}

export function playerSummaryLine(career: Career): string {
  return `${playerSummaryPos(career)} · ${currentClub(career).short} · ${career.overall} OVR`;
}

function playerSummaryPos(career: Career): string {
  return career.position;
}

export function statBlockOrEmpty(blocks: Record<string, StatBlock>, key: string): StatBlock {
  return blocks[key] ?? EMPTY_STATS();
}

export function seasonTopScorers(
  career: Career,
): { name: string; club: string; goals: number; assists: number; isPlayer?: boolean }[] {
  const list: { name: string; club: string; goals: number; assists: number; isPlayer?: boolean }[] =
    career.scorers.map((s) => ({
      name: s.name,
      club: getClub(s.clubId).short,
      goals: s.goals,
      assists: s.assists,
    }));
  list.push({
    name: `${career.firstName} ${career.lastName}`,
    club: getClub(career.clubId).short,
    goals: career.seasonStats.goals,
    assists: career.seasonStats.assists,
    isPlayer: true,
  });
  return list.sort((a, b) => b.goals - a.goals || b.assists - a.assists).slice(0, 10);
}


