import { ACHIEVEMENT_MAP } from "../data/achievements";
import { LEAGUE_MAP, getClub } from "../data/clubs";
import { EMPTY_STATS } from "../config";
import type { Career, CompetitionKey, LeagueState, NewsItem, StatBlock } from "../types";
import type { MatchReport, MatchStatsLine } from "../match/types";

export function cloneCareer(career: Career): Career {
  return structuredClone(career);
}

export function uid(prefix = "id"): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function addNews(
  career: Career,
  item: Omit<NewsItem, "id" | "week" | "season" | "read">,
): void {
  career.news.unshift({
    ...item,
    id: uid("news"),
    week: career.week,
    season: career.season,
    read: false,
  });
  if (career.news.length > 45) career.news.length = 45;
}

export function addStats(target: StatBlock, line: Partial<StatBlock>): void {
  target.apps += line.apps ?? 0;
  target.starts += line.starts ?? 0;
  target.minutes += line.minutes ?? 0;
  target.goals += line.goals ?? 0;
  target.assists += line.assists ?? 0;
  target.passes += line.passes ?? 0;
  target.passesCompleted += line.passesCompleted ?? 0;
  target.shots += line.shots ?? 0;
  target.shotsOn += line.shotsOn ?? 0;
  target.dribbles += line.dribbles ?? 0;
  target.dribblesCompleted += line.dribblesCompleted ?? 0;
  target.tackles += line.tackles ?? 0;
  target.interceptions += line.interceptions ?? 0;
  target.fouls += line.fouls ?? 0;
  target.yellow += line.yellow ?? 0;
  target.red += line.red ?? 0;
  target.ratingSum += line.ratingSum ?? 0;
  target.ratingCount += line.ratingCount ?? 0;
  target.motm += line.motm ?? 0;
  if ((line.bestRating ?? 0) > target.bestRating) target.bestRating = line.bestRating ?? 0;
}

export function statFromReport(report: MatchReport): StatBlock {
  const block = EMPTY_STATS();
  addStats(block, {
    apps: report.playerPlayed ? 1 : 0,
    starts: report.playerStarted ? 1 : 0,
    minutes: report.playerMinutes,
    goals: report.goals,
    assists: report.assists,
    passes: report.stats.passes,
    passesCompleted: report.stats.passesCompleted,
    shots: report.stats.shots,
    shotsOn: report.stats.shotsOn,
    dribbles: report.stats.dribbles,
    dribblesCompleted: report.stats.dribblesCompleted,
    tackles: report.stats.tackles,
    interceptions: report.stats.interceptions,
    fouls: report.stats.fouls,
    yellow: report.stats.yellow,
    red: report.stats.red,
    ratingSum: report.rating,
    ratingCount: 1,
    motm: report.motm ? 1 : 0,
    bestRating: report.rating,
  });
  return block;
}

export function mergeMatchStats(career: Career, report: MatchReport, competition: CompetitionKey): void {
  const block = statFromReport(report);
  addStats(career.stats, block);
  addStats(career.seasonStats, block);
  if (!career.competitionStats[competition]) career.competitionStats[competition] = EMPTY_STATS();
  if (!career.seasonCompetitionStats[competition]) career.seasonCompetitionStats[competition] = EMPTY_STATS();
  addStats(career.competitionStats[competition], block);
  addStats(career.seasonCompetitionStats[competition], block);
  if (!career.clubStats[career.clubId]) career.clubStats[career.clubId] = EMPTY_STATS();
  addStats(career.clubStats[career.clubId], block);
}

export function statLineToStats(line: MatchStatsLine): Partial<StatBlock> {
  return {
    passes: line.passes,
    passesCompleted: line.passesCompleted,
    shots: line.shots,
    shotsOn: line.shotsOn,
    dribbles: line.dribbles,
    dribblesCompleted: line.dribblesCompleted,
    tackles: line.tackles,
    interceptions: line.interceptions,
    fouls: line.fouls,
    yellow: line.yellow,
    red: line.red,
  };
}

export function averageRating(stat: StatBlock): number {
  if (!stat.ratingCount) return 0;
  return stat.ratingSum / stat.ratingCount;
}

export function playerLeague(career: Career): LeagueState | undefined {
  return career.leagues.find((l) => l.leagueId === career.seasonLeagueId);
}

export function playerLeagueName(career: Career): string {
  return LEAGUE_MAP[career.seasonLeagueId]?.name ?? "Liga";
}

export function currentClub(career: Career) {
  return getClub(career.clubId);
}

export function nextFixture(career: Career) {
  const pending = career.fixtures
    .filter((f) => !f.played)
    .sort((a, b) => a.week - b.week);
  return pending[0] ?? null;
}

export function currentWeekFixtures(career: Career) {
  return career.fixtures.filter((f) => f.week === career.week && !f.played);
}

export function weekComplete(career: Career): boolean {
  return currentWeekFixtures(career).length === 0;
}

export function isTransferWindow(career: Career): boolean {
  return career.week >= 20 || career.week <= 2;
}

export function addTrophy(career: Career, trophy: string) {
  if (!career.seasonTrophies.includes(trophy)) career.seasonTrophies.push(trophy);
}

export function checkAchievements(career: Career): string[] {
  const unlocked: string[] = [];
  const unlock = (id: string) => {
    if (career.achievements.includes(id)) return;
    const def = ACHIEVEMENT_MAP[id];
    if (!def) return;
    career.achievements.push(id);
    career.coins += def.rewardCoins;
    career.evoPoints += def.rewardEvo;
    unlocked.push(id);
    addNews(career, {
      title: `Conquista desbloqueada: ${def.title}`,
      body: `${def.description} Recompensa: ${def.rewardCoins} moedas e ${def.rewardEvo} pontos de evolução.`,
      type: "award",
      icon: def.icon,
    });
  };

  if (career.stats.apps >= 1) unlock("debut");
  if (career.stats.goals >= 1) unlock("first-goal");
  if (career.stats.assists >= 1) unlock("first-assist");
  if (career.stats.motm >= 1) unlock("first-motm");
  if (career.matchLog.some((m) => m.goals >= 3)) unlock("first-hattrick");
  if (career.seasonTrophies.length > 0 || career.history.some((h) => h.trophy)) unlock("first-title");
  if (career.seasonTrophies.includes("Subida de divisão")) unlock("promotion");
  if (career.national.caps >= 1) unlock("national-debut");
  if (career.seasonAwards.includes("Melhor Marcador")) unlock("top-scorer");
  if (career.seasonAwards.includes("Rei das Assistências")) unlock("top-assists");
  if (career.seasonTrophies.includes("Campeão Nacional")) unlock("league-champion");
  if (career.seasonTrophies.includes("Taça Nacional")) unlock("cup-champion");
  if (career.seasonTrophies.includes("Liga Continental")) unlock("continental-champion");
  if (career.seasonTrophies.includes("Mundial")) unlock("world-champion");
  if (career.seasonAwards.includes("MVP da Liga")) unlock("season-mvp");
  if (career.seasonAwards.includes("Bola de Ouro")) unlock("ballon-dor");
  if (career.stats.goals >= 100) unlock("century");
  if (career.national.caps >= 50) unlock("national-legend");
  if (career.age >= 34) unlock("veteran");
  if (career.reputation >= 92) unlock("world-star");
  if (getClub(career.clubId).overall >= 85 && career.stats.apps > 0) unlock("transfer-big");
  for (const [clubId, stats] of Object.entries(career.clubStats)) {
    if (stats.apps >= 150 && stats.goals >= 50) {
      unlock("club-legend");
      void clubId;
      break;
    }
  }
  if (career.national.tournaments.some((t) => t.result === "Campeão" && t.name.includes("Mundial"))) {
    unlock("world-champion");
  }

  return unlocked;
}

export function bestRatingColor(rating: number): string {
  if (rating >= 8.5) return "#f5c451";
  if (rating >= 7.5) return "#4ade80";
  if (rating >= 6.5) return "#38bdf8";
  if (rating >= 5.5) return "#fb923c";
  return "#f87171";
}

export function nextSeasonLabel(season: number): string {
  return `${season}/${String((season + 1) % 100).padStart(2, "0")}`;
}
