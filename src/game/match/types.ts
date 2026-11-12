export interface MatchStatsLine {
  passes: number;
  passesCompleted: number;
  shots: number;
  shotsOn: number;
  dribbles: number;
  dribblesCompleted: number;
  tackles: number;
  interceptions: number;
  fouls: number;
  yellow: number;
  red: number;
}

export type MatchEventType =
  | "kickoff"
  | "goal"
  | "chance"
  | "save"
  | "card"
  | "sub"
  | "info"
  | "half"
  | "full"
  | "offside"
  | "corner";

export interface MatchEvent {
  minute: number;
  type: MatchEventType;
  text: string;
  team?: 0 | 1;
}

export interface MatchReport {
  fixtureId: string;
  homeName: string;
  awayName: string;
  homeShort: string;
  awayShort: string;
  homeGoals: number;
  awayGoals: number;
  playerTeam: 0 | 1;
  playerPlayed: boolean;
  playerStarted: boolean;
  playerMinutes: number;
  rating: number;
  goals: number;
  assists: number;
  motm: boolean;
  stats: MatchStatsLine;
  events: MatchEvent[];
  possession: [number, number];
}

export const EMPTY_MATCH_STATS = (): MatchStatsLine => ({
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
});

export interface MatchPlayerSetup {
  name: string;
  number: number;
  position: string;
  attributes: Record<string, number>;
  appearance: import("../types").Appearance;
}

export interface MatchSetup {
  fixtureId: string;
  competitionName: string;
  playerTeam: 0 | 1;
  teamName: [string, string];
  teamShort: [string, string];
  teamOverall: [number, number];
  teamCountry: [string, string];
  kit: [import("../types").Kit, import("../types").Kit];
  gkKit: [import("../types").Kit, import("../types").Kit];
  player: MatchPlayerSetup;
  seed: number;
}

export interface MatchFixtureInfo {
  fixtureId: string;
  competitionName: string;
  homeName: string;
  awayName: string;
  homeShort: string;
  awayShort: string;
  homeOverall: number;
  awayOverall: number;
  playerTeam: 0 | 1;
}
