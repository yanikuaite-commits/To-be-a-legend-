import { CUP_WEEKS } from "../config";
import { COUNTRY_MAP } from "../data/countries";
import { getClub } from "../data/clubs";
import type { Career, Fixture, StatBlock } from "../types";
import { EMPTY_MATCH_STATS, type MatchEvent, type MatchReport } from "../match/types";
import { clamp, mulberry32, randInt } from "./rng";
import { addNews, checkAchievements, cloneCareer, mergeMatchStats, statFromReport, uid } from "./careerUtils";
import { addXp } from "./training";
import { calculateOverall } from "./attributes";
import { finishRound, simulateScore } from "./league";

function playerTeamName(career: Career, fixture: Fixture): { home: string; away: string; homeShort: string; awayShort: string } {
  const club = getClub(career.clubId);
  const isHome = fixture.home;
  const pName = fixture.competition === "national" || fixture.competition === "worldcup" ? countryNameOf(career) : club.name;
  const pShort = fixture.competition === "national" || fixture.competition === "worldcup" ? career.nationality : club.short;
  return {
    home: isHome ? pName : fixture.opponentName,
    away: isHome ? fixture.opponentName : pName,
    homeShort: isHome ? pShort : fixture.opponentShort,
    awayShort: isHome ? fixture.opponentShort : pShort,
  };
}

function countryNameOf(career: Career): string {
  return COUNTRY_MAP[career.nationality]?.name ?? "Seleção";
}

export function isNationalFixture(fixture: Fixture): boolean {
  return fixture.competition === "national" || fixture.competition === "worldcup";
}

export function quickSimReport(career: Career, fixture: Fixture, skipPlayer = false): MatchReport {
  const rand = mulberry32(career.seed + career.season * 7919 + career.week * 131 + fixture.id.length * 37);
  const playerAvailable =
    !skipPlayer && career.injuryWeeks === 0 && career.suspensionWeeks === 0 && career.energy > 8;
  const playerTeam = fixture.home ? 0 : 1;
  const club = getClub(career.clubId);
  const national = isNationalFixture(fixture);
  const teamStrength = national
    ? clamp(70 + career.overall * 0.22, 68, 92)
    : clamp(club.overall + (playerAvailable ? (career.overall - club.overall) * 0.18 : -2), 40, 99);
  const oppStrength = fixture.opponentOverall;
  const [homeGoals, awayGoals] = simulateScore(
    rand,
    fixture.home ? teamStrength : oppStrength,
    fixture.home ? oppStrength : teamStrength,
  );

  const names = playerTeamName(career, fixture);
  const events: MatchEvent[] = [
    { minute: 0, type: "kickoff", text: `${names.home} vs ${names.away} — começa a partida.` },
    { minute: 90, type: "full", text: `Apito final: ${names.home} ${homeGoals} - ${awayGoals} ${names.away}.` },
  ];

  let goals = 0;
  let assists = 0;
  let minutes = 0;
  let rating = 0;
  let motm = false;
  const stats = EMPTY_MATCH_STATS();
  const myGoals = fixture.home ? homeGoals : awayGoals;
  const oppGoals = fixture.home ? awayGoals : homeGoals;

  if (playerAvailable) {
    minutes = randInt(rand, 68, 90);
    const position = career.position;
    const attackFactor = ["PL"].includes(position) ? 0.65 : ["ED", "EE", "MO"].includes(position) ? 0.44 : ["MC", "MD", "ME"].includes(position) ? 0.22 : 0.09;
    const quality = clamp(career.overall / 72, 0.55, 1.6);
    const goalLambda = attackFactor * quality * (0.7 + myGoals * 0.32);
    for (let i = 0; i < 5; i++) {
      if (rand() < goalLambda / 5) goals += 1;
    }
    const assistFactor = attackFactor * 0.8;
    for (let i = 0; i < 4; i++) {
      if (rand() < (assistFactor * quality) / 5) assists += 1;
    }
    if (goals > 0) {
      const minute = randInt(rand, 4, 88);
      events.push({ minute, type: "goal", text: `⚽ GOLO! ${career.firstName} ${career.lastName} marca para ${names[playerTeam === 0 ? "home" : "away"]}.`, team: playerTeam });
    }
    if (assists > 0) {
      events.push({ minute: randInt(rand, 10, 85), type: "info", text: `Assistência de ${career.lastName} para um golo da equipa.`, team: playerTeam });
    }
    const baseRating = 6.0 + goals * 1.1 + assists * 0.7 + (myGoals > oppGoals ? 0.4 : myGoals === oppGoals ? 0.05 : -0.35) + (rand() - 0.4) * 1.1;
    rating = clamp(Math.round(baseRating * 10) / 10, 3.5, 10);
    motm = rating >= 8.3 && myGoals >= oppGoals;
    stats.passes = randInt(rand, 18, 46);
    stats.passesCompleted = Math.round(stats.passes * (0.62 + rand() * 0.28));
    stats.shots = clamp(goals + randInt(rand, 0, 3), 0, 6);
    stats.shotsOn = clamp(goals + (rand() < 0.5 ? 1 : 0), 0, stats.shots);
    stats.dribbles = randInt(rand, 0, 5);
    stats.dribblesCompleted = randInt(rand, 0, stats.dribbles);
    stats.tackles = randInt(rand, 0, 4);
    stats.interceptions = randInt(rand, 0, 3);
    if (rand() < 0.12) stats.fouls = 1;
    if (rand() < 0.06) stats.yellow = 1;
    if (rand() < 0.008) stats.red = 1;
  } else {
    events.push({ minute: 45, type: "info", text: `${career.firstName} ${career.lastName} não participou na partida.` });
  }

  return {
    fixtureId: fixture.id,
    homeName: names.home,
    awayName: names.away,
    homeShort: names.homeShort,
    awayShort: names.awayShort,
    homeGoals,
    awayGoals,
    playerTeam,
    playerPlayed: playerAvailable,
    playerStarted: playerAvailable,
    playerMinutes: minutes,
    rating,
    goals,
    assists,
    motm,
    stats,
    events,
    possession: [
      Math.round(50 + ((fixture.home ? teamStrength : oppStrength) - (fixture.home ? oppStrength : teamStrength)) / 2),
      Math.round(50 - ((fixture.home ? teamStrength : oppStrength) - (fixture.home ? oppStrength : teamStrength)) / 2),
    ],
  };
}

function competitionPrestige(competition: string): number {
  switch (competition) {
    case "continental":
      return 1.5;
    case "cup":
      return 1.2;
    case "national":
    case "worldcup":
      return 1.4;
    default:
      return 1;
  }
}

export function applyMatchResult(careerInput: Career, report: MatchReport): Career {
  const career = cloneCareer(careerInput);
  const fixture = career.fixtures.find((f) => f.id === report.fixtureId);
  if (!fixture) return careerInput;

  const playerTeam = report.playerTeam;
  const myGoals = playerTeam === 0 ? report.homeGoals : report.awayGoals;
  const oppGoals = playerTeam === 0 ? report.awayGoals : report.homeGoals;
  const result: "V" | "E" | "D" = myGoals > oppGoals ? "V" : myGoals === oppGoals ? "E" : "D";

  fixture.played = true;
  fixture.homeGoals = report.homeGoals;
  fixture.awayGoals = report.awayGoals;
  fixture.result = result;
  fixture.playerPlayed = report.playerPlayed;
  fixture.playerStarted = report.playerStarted;
  fixture.playerMinutes = report.playerMinutes;
  fixture.playerRating = report.rating;
  fixture.playerGoals = report.goals;
  fixture.playerAssists = report.assists;
  fixture.reportText = `${report.homeName} ${report.homeGoals} - ${report.awayGoals} ${report.awayName}`;

  if (report.playerPlayed) {
    mergeMatchStats(career, report, fixture.competition);
    career.matchLog.unshift({
      id: uid("match"),
      season: career.season,
      week: career.week,
      competitionName: fixture.competitionName,
      opponentShort: fixture.opponentShort,
      home: fixture.home,
      score: `${report.homeGoals}-${report.awayGoals}`,
      rating: report.rating,
      goals: report.goals,
      assists: report.assists,
      minutes: report.playerMinutes,
      motm: report.motm,
    });
    if (career.matchLog.length > 120) career.matchLog.length = 120;
  }

  const prestige = competitionPrestige(fixture.competition);
  const rating = report.playerPlayed ? report.rating : 6;
  const moraleDelta = report.playerPlayed
    ? Math.round((rating - 6.4) * 3.4 + (result === "V" ? 5 : result === "D" ? -4 : 1))
    : result === "V"
      ? 2
      : -1;
  career.morale = clamp(career.morale + moraleDelta, 0, 100);
  career.coachTrust = clamp(
    career.coachTrust + (report.playerPlayed ? Math.round((rating - 6.3) * 2.2) : 0) + (result === "V" ? 2 : -1),
    0,
    100,
  );
  career.form = clamp(career.form + (report.playerPlayed ? Math.round((rating - 6.2) * 3) : -1), 0, 100);
  career.energy = clamp(career.energy - (report.playerPlayed ? Math.round(6 + report.playerMinutes / 9) : 0), 0, 100);

  if (report.playerPlayed) {
    const ratingBonus = Math.max(0, rating - 6);
    career.reputation = clamp(career.reputation + Math.round(ratingBonus * 0.7 * prestige), 0, 100);
    career.popularity = clamp(career.popularity + Math.round(ratingBonus * 1.1 * prestige), 0, 100);
    addXp(career, (14 + rating * 5) * prestige);
    career.evoPoints += 1 + (rating >= 8 ? 2 : rating >= 7 ? 1 : 0) + (report.goals >= 2 ? 1 : 0);
    const cleanSheet = myGoals === 0 && oppGoals === 0;
    career.coins += Math.round(
      (career.contract.salary / 4 + rating * 38 + report.goals * 220 + report.assists * 120 + (report.motm ? 350 : 0)) * prestige,
    );
    if (report.stats.red > 0) {
      career.suspensionWeeks = Math.max(career.suspensionWeeks, 2);
      addNews(career, {
        title: "Expulsão e castigo",
        body: "Viste o cartão vermelho e vais falhar os próximos dois jogos.",
        type: "match",
        icon: "RectangleVertical",
      });
    } else if (report.stats.yellow > 0) {
      const yellows = career.seasonStats.yellow;
      if (yellows > 0 && yellows % 5 === 0 && !cleanSheet) {
        career.suspensionWeeks = Math.max(career.suspensionWeeks, 1);
        addNews(career, {
          title: "Castigo por acumulação",
          body: "Cinco cartões amarelos esta época. Falhas o próximo jogo.",
          type: "match",
          icon: "RectangleVertical",
        });
      }
    }
    if (report.playerMinutes > 25 && Math.random() < 0.018 + (career.energy < 35 ? 0.02 : 0)) {
      career.injuryWeeks = Math.max(career.injuryWeeks, randIntSafe(career, 1, 3));
      addNews(career, {
        title: "Lesão no jogo",
        body: `Saíste tocado da partida. A equipa médica prevê ${career.injuryWeeks} semana(s) de paragem.`,
        type: "injury",
        icon: "HeartPulse",
      });
    }
  }

  if (fixture.competition === "league") {
    const state = career.leagues.find((l) => l.leagueId === career.seasonLeagueId);
    if (state) {
      const rand = mulberry32(career.seed + career.week * 101 + fixture.id.length);
      finishRound(state, Math.max(0, fixture.week - 2), career.clubId, myGoals, oppGoals, fixture.home, rand);
      const rows = Object.values(state.table).sort((a, b) => b.points - a.points);
      career.positionInLeague = rows.findIndex((r) => r.clubId === career.clubId) + 1;
    }
  }

  if (fixture.competition === "cup") {
    const isFinal = fixture.week === CUP_WEEKS[CUP_WEEKS.length - 1];
    const shootoutRand = mulberry32(career.seed + fixture.week * 997 + 17);
    const shootoutWin = result === "E"
      ? shootoutRand() < clamp(0.5 + (getClub(career.clubId).overall - fixture.opponentOverall) / 220, 0.2, 0.8)
      : result === "V";
    const eliminated = result === "D" || (result === "E" && !shootoutWin);
    if (eliminated) {
      career.fixtures = career.fixtures.filter((f) => !(f.competition === "cup" && f.week > fixture.week && !f.played));
      addNews(career, {
        title: result === "E" ? "Eliminado da Taça nos penáltis" : "Eliminado da Taça",
        body: `O ${getClub(career.clubId).name} despede-se da Taça Nacional após ${result === "E" ? "uma decisão por penáltis" : "derrota"} com o ${fixture.opponentName}.`,
        type: "match",
        icon: "XCircle",
      });
    } else {
      if (result === "E") {
        addNews(career, {
          title: "Taça decidida nos penáltis",
          body: `O ${getClub(career.clubId).name} venceu o ${fixture.opponentName} nas grandes penalidades e segue em frente.`,
          type: "match",
          icon: "Target",
        });
      }
      if (isFinal) {
        if (!career.seasonTrophies.includes("Taça Nacional")) career.seasonTrophies.push("Taça Nacional");
        addNews(career, {
          title: "🏆 Vencedores da Taça Nacional!",
          body: `O ${getClub(career.clubId).name} conquistou a Taça Nacional. Uma noite histórica.`,
          type: "award",
          icon: "Trophy",
        });
      }
    }
  }

  if (fixture.competition === "continental") {
    const isFinal = fixture.week === 18;
    const shootoutRand = mulberry32(career.seed + fixture.week * 991 + 29);
    const shootoutWin = result === "E"
      ? shootoutRand() < clamp(0.5 + (getClub(career.clubId).overall - fixture.opponentOverall) / 220, 0.2, 0.8)
      : result === "V";
    const eliminated = result === "D" || (result === "E" && !shootoutWin);
    if (eliminated) {
      career.fixtures = career.fixtures.filter(
        (f) => !(f.competition === "continental" && f.week > fixture.week && !f.played),
      );
      addNews(career, {
        title: result === "E" ? "Liga Continental termina nos penáltis" : "Liga Continental termina",
        body: `Eliminação frente ao ${fixture.opponentName}. A campanha europeia terminou.`,
        type: "match",
        icon: "XCircle",
      });
    } else {
      if (result === "E") {
        addNews(career, {
          title: "Liga Continental decidida nos penáltis",
          body: `O ${getClub(career.clubId).name} venceu o ${fixture.opponentName} nas grandes penalidades.`,
          type: "match",
          icon: "Target",
        });
      }
      if (isFinal) {
        if (!career.seasonTrophies.includes("Liga Continental")) career.seasonTrophies.push("Liga Continental");
        addNews(career, {
          title: "🏆 CAMPEÕES DA LIGA CONTINENTAL!",
          body: "Conquistaste a Liga Continental. Um feito para a história do clube.",
          type: "award",
          icon: "Trophy",
        });
      }
    }
  }

  if (isNationalFixture(fixture)) {
    if (report.playerPlayed) {
      career.national.caps += 1;
      career.national.goals += report.goals;
      career.national.assists += report.assists;
      if (career.national.caps === 1) {
        addNews(career, {
          title: "Estreia pela Seleção",
          body: `Fizeste a tua estreia por ${countryNameOf(career)}. Um orgulho para sempre.`,
          type: "national",
          icon: "Flag",
        });
      }
    }
  }

  const unlocked = checkAchievements(career);
  career.overall = calculateOverall(career.attributes, career.position);
  career.lastReport = {
    fixtureId: fixture.id,
    homeName: report.homeName,
    awayName: report.awayName,
    homeGoals: report.homeGoals,
    awayGoals: report.awayGoals,
    rating: report.rating,
    goals: report.goals,
    assists: report.assists,
    minutes: report.playerMinutes,
    motm: report.motm,
    xpGain: Math.round((14 + rating * 5) * prestige),
    moraleChange: moraleDelta,
    unlocked,
    summary: [
      `${fixture.competitionName}: ${report.homeName} ${report.homeGoals} - ${report.awayGoals} ${report.awayName}`,
      report.playerPlayed
        ? `Nota ${report.rating.toFixed(1)} · ${report.goals} golos · ${report.assists} assistências · ${report.playerMinutes} min`
        : "Não participaste nesta partida.",
    ],
  };

  const opponent = fixture.opponentShort;
  if (report.playerPlayed) {
    addNews(career, {
      title:
        report.goals >= 3
          ? `Hat-trick de ${career.lastName}!`
          : report.goals > 0
            ? `${career.lastName} marca na vitória sobre ${opponent}`
            : result === "V"
              ? `Vitória do ${getClub(career.clubId).short} sobre ${opponent}`
              : `${getClub(career.clubId).short} ${result === "E" ? "empata" : "perde"} com ${opponent}`,
      body: `${report.homeName} ${report.homeGoals} - ${report.awayGoals} ${report.awayName}. A tua nota: ${report.rating.toFixed(1)}.`,
      type: "match",
      icon: report.goals > 0 ? "Target" : "Shirt",
    });
  }

  void EMPTY_MATCH_STATS;
  return career;
}

function randIntSafe(career: Career, min: number, max: number): number {
  const r = mulberry32(career.seed + career.week * 41 + career.season * 17)();
  return Math.floor(r * (max - min + 1)) + min;
}

export function simulatePlayerSeasonStats(career: Career, clubOverall: number): StatBlock {
  const stat = statFromReport(quickSimReport(career, career.fixtures[0]));
  void clubOverall;
  return stat;
}
