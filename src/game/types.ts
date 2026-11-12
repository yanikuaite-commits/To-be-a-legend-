/** Shared types for the whole game. */

export type PositionCode =
  | "DC"
  | "DD"
  | "DE"
  | "MC"
  | "MD"
  | "ME"
  | "MO"
  | "ED"
  | "EE"
  | "PL";

export type AttrKey =
  | "finishing"
  | "passing"
  | "dribbling"
  | "speed"
  | "acceleration"
  | "ballControl"
  | "positioning"
  | "stamina"
  | "strength"
  | "defending"
  | "heading"
  | "vision"
  | "agility"
  | "reaction"
  | "interception"
  | "tackling";

export type Attributes = Record<AttrKey, number>;

export type Foot = "right" | "left";
export type Accessory = "none" | "headband" | "wristband" | "gloves";
export type BrowStyle = "natural" | "strong" | "arched" | "none";

export interface Appearance {
  baseId: string;
  skin: string;
  hairStyle: string;
  hairColor: string;
  brow: BrowStyle;
  eyeColor: string;
  accessory: Accessory;
  height: number; // -1 | 0 | 1
  build: number; // -1 | 0 | 1
}

export interface Kit {
  pattern: "solid" | "stripes" | "halves" | "sash" | "hoops";
  primary: string;
  secondary: string;
  shorts: string;
  socks: string;
  trim: string;
  number: string;
  gk: boolean;
}

export interface Country {
  code: string;
  name: string;
  flag: string;
  colors: [string, string];
}

export interface Club {
  id: string;
  name: string;
  short: string;
  city: string;
  country: string;
  leagueId: string;
  overall: number;
  reputation: number;
  stadium: string;
  budget: number;
  coach: string;
  tactic: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  form: string;
  founded: number;
}

export interface League {
  id: string;
  name: string;
  short: string;
  country: string;
  tier: number;
  color: string;
  prize: number;
  reputation: number;
  description: string;
}

export interface NewsItem {
  id: string;
  week: number;
  season: number;
  title: string;
  body: string;
  type: "match" | "transfer" | "training" | "injury" | "national" | "award" | "club" | "career";
  icon: string;
  read: boolean;
}

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  icon: string;
  rewardCoins: number;
  rewardEvo: number;
  category: "career" | "goals" | "titles" | "individual" | "club" | "national";
}

export interface StatBlock {
  apps: number;
  starts: number;
  minutes: number;
  goals: number;
  assists: number;
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
  ratingSum: number;
  ratingCount: number;
  motm: number;
  bestRating: number;
}

export type CompetitionKey = "league" | "cup" | "continental" | "national" | "friendly" | "worldcup";

export interface Fixture {
  id: string;
  week: number;
  season: number;
  competition: CompetitionKey;
  competitionName: string;
  opponentId: string;
  opponentName: string;
  opponentShort: string;
  opponentOverall: number;
  home: boolean;
  played: boolean;
  homeGoals?: number;
  awayGoals?: number;
  result?: "V" | "E" | "D";
  playerPlayed?: boolean;
  playerStarted?: boolean;
  playerMinutes?: number;
  playerRating?: number;
  playerGoals?: number;
  playerAssists?: number;
  reportText?: string;
  countsForLeague?: boolean;
}

export interface TableRow {
  clubId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

export interface LeagueMatch {
  id: string;
  round: number;
  week: number;
  homeId: string;
  awayId: string;
  homeGoals?: number;
  awayGoals?: number;
  played: boolean;
}

export interface LeagueState {
  leagueId: string;
  matches: LeagueMatch[];
  table: Record<string, TableRow>;
}

export interface TransferOffer {
  id: string;
  clubId: string;
  clubName: string;
  clubShort: string;
  country: string;
  leagueName: string;
  clubOverall: number;
  interest: number; // 0..100
  salary: number; // weekly
  years: number;
  role: "Titular indiscutível" | "Titular" | "Rotação" | "Promessa" | "Suplente";
  type: "permanent" | "loan";
  marketValue: number;
  objectives: string;
  expiresWeek: number;
  negotiated?: boolean;
  isRenewal?: boolean;
}

export interface Contract {
  clubId: string;
  salary: number;
  years: number;
  role: "Titular indiscutível" | "Titular" | "Rotação" | "Promessa" | "Suplente";
  signedSeason: number;
  releaseClause: number;
  bonuses: { goals: number; assists: number; apps: number };
}

export interface SeasonHistory {
  season: number;
  seasonLabel: string;
  clubName: string;
  leagueName: string;
  apps: number;
  goals: number;
  assists: number;
  rating: number;
  overallStart: number;
  overallEnd: number;
  position: number;
  trophy: string | null;
  awards: string[];
}

export interface NationalState {
  calledUp: boolean;
  caps: number;
  goals: number;
  assists: number;
  tournaments: { name: string; season: number; result: string; goals: number }[];
  debut: boolean;
}

export interface PendingEvent {
  id: string;
  kind: "match" | "seasonEnd" | "transfer" | "national" | "award";
  payload?: unknown;
}

export interface MatchLogEntry {
  id: string;
  season: number;
  week: number;
  competitionName: string;
  opponentShort: string;
  home: boolean;
  score: string;
  rating: number;
  goals: number;
  assists: number;
  minutes: number;
  motm: boolean;
}

export interface Career {
  version: number;
  id: string;
  createdAt: number;
  updatedAt: number;
  firstName: string;
  lastName: string;
  nationality: string;
  position: PositionCode;
  shirtNumber: number;
  foot: Foot;
  age: number;
  appearance: Appearance;
  attributes: Attributes;
  potential: number;
  overall: number;
  morale: number;
  energy: number;
  form: number;
  reputation: number;
  popularity: number;
  coachTrust: number;
  leadership: number;
  xp: number;
  level: number;
  evoPoints: number;
  specialty: string | null;
  injuryWeeks: number;
  suspensionWeeks: number;
  clubId: string;
  contract: Contract;
  season: number;
  seasonLabel: string;
  week: number;
  totalWeeks: number;
  coins: number;
  hasAgent?: boolean;
  training: {
    week: number;
    focus: string;
    intensity: "leve" | "normal" | "intenso";
    done: boolean;
  } | null;
  trainingCount: number;
  stats: StatBlock;
  seasonStats: StatBlock;
  competitionStats: Record<string, StatBlock>;
  seasonCompetitionStats: Record<string, StatBlock>;
  clubStats: Record<string, StatBlock>;
  scorers: { name: string; clubId: string; goals: number; assists: number }[];
  pendingTransfer: TransferOffer | null;
  requestedTransfer: boolean;
  seasonSummary: {
    seasonLabel: string;
    lines: string[];
    trophies: string[];
    awards: string[];
  } | null;
  matchLog: MatchLogEntry[];
  fixtures: Fixture[];
  leagues: LeagueState[];
  news: NewsItem[];
  achievements: string[];
  offers: TransferOffer[];
  history: SeasonHistory[];
  national: NationalState;
  seasonStartOverall: number;
  positionInLeague: number;
  captain: boolean;
  retired: boolean;
  lastReport: {
    fixtureId: string;
    homeName: string;
    awayName: string;
    homeGoals: number;
    awayGoals: number;
    rating: number;
    goals: number;
    assists: number;
    minutes: number;
    motm: boolean;
    xpGain: number;
    moraleChange: number;
    unlocked: string[];
    summary: string[];
  } | null;
  seasonTrophies: string[];
  seasonAwards: string[];
  transferWindowOpen: boolean;
  seasonLeagueId: string;
  clubLeagues: Record<string, string>;
  lastSavedWeek: number;
  difficulty: "normal";
  seed: number;
  settings?: {
    sound: boolean;
    haptics: boolean;
    quality: "alta" | "média";
  };
}

export interface SaveSlotMeta {
  id: string;
  name: string;
  club: string;
  seasonLabel: string;
  overall: number;
  age: number;
  position: PositionCode;
  updatedAt: number;
  week: number;
  lastResult?: string;
}
