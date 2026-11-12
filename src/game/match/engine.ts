import { LINEUP_SLOTS } from "../config";
import { HAIR_COLORS, SKIN_TONES, presetAppearance } from "../data/appearance";
import { randomName } from "../data/names";
import { generateAIAttributes } from "../engine/attributes";
import { chance, clamp, mulberry32, randInt, type Rand } from "../engine/rng";
import type { CharacterRig } from "../characters/assets";
import type { Appearance, Attributes, AttrKey, Kit, PositionCode } from "../types";
import { EMPTY_MATCH_STATS, type MatchEvent, type MatchReport, type MatchSetup, type MatchStatsLine } from "./types";

export const PITCH_HALF_L = 52.5;
export const PITCH_HALF_W = 34;
export const GOAL_HALF = 3.66;
export const GOAL_HEIGHT = 2.44;
const PLAYER_WORLD_HEIGHT = 4.1;
const MINUTES_PER_SECOND = 0.5;

export interface Vec {
  x: number;
  y: number;
}

export type MatchPhase = "kickoff" | "play" | "restart" | "goal" | "halftime" | "fulltime";

export interface MatchPlayer {
  id: number;
  team: 0 | 1;
  slot: number;
  role: PositionCode | "GK";
  name: string;
  number: number;
  isGK: boolean;
  isProtagonist: boolean;
  attrs: Attributes;
  appearance: Appearance;
  kit: Kit;
  x: number;
  y: number;
  vx: number;
  vy: number;
  fx: number;
  fy: number;
  targetX: number;
  targetY: number;
  maxSpeed: number;
  accel: number;
  stamina: number;
  thinkTimer: number;
  /** Distance-driven gait phase; keeps the run pose intact when time freezes. */
  stridePhase: number;
  cooldown: number;
  hasBall: boolean;
  slideTimer: number;
  stunnedTimer: number;
  active: boolean;
  stats: MatchStatsLine;
  goals: number;
  assists: number;
  yellow: number;
  red: number;
  offsideFlag: boolean;
}

export interface BallState {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  ownerId: number | null;
  lastTouchId: number;
  lastTouchTeam: 0 | 1;
  shot: boolean;
  shotBy: number;
  intendedFor: number | null;
  passBy: number | null;
  passTeam: 0 | 1;
  spin: number;
}

export interface CameraState {
  x: number;
  y: number;
  scale: number;
  rot: number;
}

export type TapTarget =
  | { kind: "teammate"; id: number; at: number }
  | null;

export interface MatchHud {
  homeShort: string;
  awayShort: string;
  homeScore: number;
  awayScore: number;
  minute: number;
  phase: MatchPhase;
  frozen: boolean;
  competitionName: string;
  playerName: string;
  playerNumber: number;
  playerRating: number;
  playerGoals: number;
  playerAssists: number;
  playerStamina: number;
  hasBall: boolean;
  tacklePrompt: boolean;
  passPrompt: boolean;
  goalPrompt: boolean;
  tackleOpportunity: boolean;
  eventText: string;
  lastEventType: string;
  homeKit: Kit;
  awayKit: Kit;
  homeName: string;
  awayName: string;
  paused: boolean;
  finished: boolean;
  possession: [number, number];
  shots: [number, number];
}

export class MatchEngine {
  readonly setup: MatchSetup;
  readonly players: MatchPlayer[] = [];
  protagonist!: MatchPlayer;
  ball: BallState = {
    x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0,
    ownerId: null, lastTouchId: -1, lastTouchTeam: 0, shot: false, shotBy: -1,
    intendedFor: null, passBy: null, passTeam: 0, spin: 0,
  };
  phase: MatchPhase = "kickoff";
  minute = 0;
  score: [number, number] = [0, 0];
  events: MatchEvent[] = [];
  frozen = false;
  freezeReason: "receive" | "dribble" | "kickoff" | "restart" | "tackle" | "penalty" | null = null;
  gestureActive = false;
  gestureStart: Vec = { x: 0, y: 0 };
  gestureCurrent: Vec = { x: 0, y: 0 };
  camera: CameraState = { x: 0, y: 0, scale: 12, rot: 0 };
  viewport = { w: 900, h: 600 };
  sprites: Map<number, HTMLCanvasElement> = new Map();
  spriteRigs: Map<number, CharacterRig> = new Map();
  animationFrames: Map<string, HTMLCanvasElement[]> = new Map();
  ballImage: HTMLImageElement | null = null;
  paused = false;
  feedback = "";
  feedbackUntil = 0;
  possessionTime: [number, number] = [0, 0];
  shotsCount: [number, number] = [0, 0];
  lastPass: { by: number; team: 0 | 1; at: number; intended: number | null; credited?: boolean } | null = null;
  private rand: Rand;
  private realTime = 0;
  private phaseTimer = 0;
  private restartTimer = 0;
  private lastKickoffTeam: 0 | 1 = 0;
  private pendingTap: TapTarget = null;
  private dribbleTarget: Vec | null = null;
  private dribbleUntil = 0;
  private lastResumeAt = 0;
  private lastFreezeAt = 0;
  private lastKickAt = 0;
  private lastProtagonistTouchAt = 0;
  private shotBlockTried = false;
  private subbedOff = false;
  private playerSubMinute: number | null = null;
  private subsDone = { 0: 0, 1: 0 };
  private noAssistWindow = 8;
  private firstHalfEnded = false;
  private eventsSent = 0;

  constructor(setup: MatchSetup) {
    this.setup = setup;
    this.rand = mulberry32(setup.seed || 12345);
    this.buildTeams();
    this.kickoff(setup.playerTeam);
    this.addEvent("info", `Bem-vindo ao ${setup.competitionName}.`, undefined);
  }

  private protagonistSlotIndex(): number {
    const pos = this.setup.player.position;
    const exact = LINEUP_SLOTS.findIndex((slot) => slot.role === pos);
    if (exact >= 0) return exact;
    // The base XI uses a MD/MO shape; a left midfielder slots into the MD role.
    if (pos === "ME") return LINEUP_SLOTS.findIndex((slot) => slot.role === "MD");
    return LINEUP_SLOTS.findIndex((slot) => slot.role === "MC");
  }

  private buildTeams(): void {
    const protagonistSlot = this.protagonistSlotIndex();
    for (const team of [0, 1] as const) {
      const overall = this.setup.teamOverall[team];
      const country = this.setup.teamCountry[team];
      const usedNumbers = new Set<number>([1]);
      let idOffset = team * 20;
      for (let i = 0; i < LINEUP_SLOTS.length; i++) {
        const slot = LINEUP_SLOTS[i];
        const isPlayerTeam = team === this.setup.playerTeam;
        const isProtagonist = isPlayerTeam && i === protagonistSlot;
        const id = idOffset + i;
        const role: PositionCode | "GK" = isProtagonist
          ? (this.setup.player.position as PositionCode)
          : slot.role;
        const rng = this.rand;
        const appearance = this.randomAppearance(rng);
        const name = isProtagonist ? this.setup.player.name : this.randomAiName(rng, country);
        let number = 1;
        if (role !== "GK") {
          if (isProtagonist) number = this.setup.player.number;
          else {
            let candidate = randInt(rng, 2, 30);
            let guard = 0;
            while (usedNumbers.has(candidate) && guard < 60) {
              candidate = randInt(rng, 2, 30);
              guard++;
            }
            usedNumbers.add(candidate);
            number = candidate;
          }
        }
        const attrs = isProtagonist
          ? this.toAttributes(this.setup.player.attributes)
          : generateAIAttributes(rng, role === "GK" ? "DC" : role, overall, role === "GK");
        const weather = 1;
        const maxSpeed = (role === "GK" ? 5.1 : 5.4) + ((attrs.speed - 50) / 50) * 1.6 * weather;
        const accel = 7.5 + ((attrs.acceleration - 50) / 50) * 5.2;
        const slotX = slot.x * (team === 0 ? 1 : -1);
        const slotY = slot.y * (team === 0 ? 1 : -1);
        if (isProtagonist) usedNumbers.add(number);
        this.players.push({
          id,
          team,
          slot: i,
          role,
          name,
          number,
          isGK: role === "GK",
          isProtagonist,
          attrs,
          appearance: isProtagonist ? this.setup.player.appearance : appearance,
          kit: role === "GK" ? this.setup.gkKit[team] : this.setup.kit[team],
          x: slotX,
          y: slotY,
          vx: 0,
          vy: 0,
          fx: team === 0 ? 1 : -1,
          fy: 0,
          targetX: slotX,
          targetY: slotY,
          maxSpeed,
          accel,
          stamina: 100,
          thinkTimer: randInt(rng, 0, 25) / 100,
          stridePhase: randInt(rng, 0, 628) / 100,
          cooldown: 0,
          hasBall: false,
          slideTimer: 0,
          stunnedTimer: 0,
          active: true,
          stats: EMPTY_MATCH_STATS(),
          goals: 0,
          assists: 0,
          yellow: 0,
          red: 0,
          offsideFlag: false,
        });
        if (isProtagonist) this.protagonist = this.players[this.players.length - 1];
      }
    }
  }

  private randomAppearance(rand: Rand): Appearance {
    const preset = presetAppearance(randInt(rand, 0, 12));
    return {
      ...preset,
      skin: SKIN_TONES[randInt(rand, 0, SKIN_TONES.length - 1)].hex,
      hairColor: HAIR_COLORS[randInt(rand, 0, HAIR_COLORS.length - 1)].hex,
      brow: preset.brow,
      eyeColor: preset.eyeColor,
    };
  }

  private randomAiName(rand: Rand, country: string): string {
    const n = randomName(country, rand);
    return `${n.first} ${n.last}`;
  }

  private toAttributes(source: Record<string, number>): Attributes {
    const keys: AttrKey[] = [
      "finishing", "passing", "dribbling", "speed", "acceleration", "ballControl",
      "positioning", "stamina", "strength", "defending", "heading", "vision",
      "agility", "reaction", "interception", "tackling",
    ];
    const attrs = {} as Attributes;
    for (const key of keys) attrs[key] = clamp(Math.round(source[key] ?? 55), 20, 99);
    return attrs;
  }

  private get teamMates(): MatchPlayer[] {
    return this.players.filter((p) => p.team === this.protagonist.team);
  }

  private playersOf(team: 0 | 1): MatchPlayer[] {
    return this.players.filter((p) => p.team === team && p.active);
  }

  private opponentOf(team: 0 | 1): TeamSide {
    return (1 - team) as 0 | 1;
  }

  private attackingDir(team: 0 | 1): number {
    return team === 0 ? 1 : -1;
  }

  private ownGoalX(team: 0 | 1): number {
    return team === 0 ? -PITCH_HALF_L : PITCH_HALF_L;
  }

  private targetGoalX(team: 0 | 1): number {
    return team === 0 ? PITCH_HALF_L : -PITCH_HALF_L;
  }

  private goalCenter(team: 0 | 1): Vec {
    return { x: this.targetGoalX(team), y: 0 };
  }

  private distance(a: Vec, b: Vec): number {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  private playerVec(p: MatchPlayer): Vec {
    return { x: p.x, y: p.y };
  }

  addEvent(type: MatchEvent["type"], text: string, team?: 0 | 1): void {
    const minute = Math.max(0, Math.round(this.minute));
    this.events.unshift({ minute, type, text, team });
    if (this.events.length > 60) this.events.length = 60;
    this.eventsSent = this.events.length;
  }

  private nearestOpponent(p: MatchPlayer): { player: MatchPlayer | null; dist: number } {
    let best: MatchPlayer | null = null;
    let bestDist = Infinity;
    for (const other of this.players) {
      if (!other.active || other.team === p.team) continue;
      const d = this.distance(p, other);
      if (d < bestDist) {
        bestDist = d;
        best = other;
      }
    }
    return { player: best, dist: bestDist };
  }

  private nearestTeammate(p: MatchPlayer, excludeGK = true): MatchPlayer | null {
    let best: MatchPlayer | null = null;
    let bestDist = Infinity;
    for (const other of this.players) {
      if (!other.active || other.team !== p.team || other.id === p.id) continue;
      if (excludeGK && other.isGK) continue;
      const d = this.distance(p, other);
      if (d < bestDist) {
        bestDist = d;
        best = other;
      }
    }
    return best;
  }

  private setViewportInternal(w: number, h: number): void {
    this.viewport = { w: Math.max(320, w), h: Math.max(360, h) };
    this.updateCamera(0.016);
  }

  setViewport(w: number, h: number): void {
    this.setViewportInternal(w, h);
  }

  private computeCameraZoom(): number {
    const { w, h } = this.viewport;
    const portrait = h > w * 1.05;
    // A tighter, action-camera view instead of showing almost the full pitch.
    const base = portrait
      ? Math.min(h / 52, w / 24)
      : Math.min(w / 54, h / 34);
    const goalDist = Math.min(
      this.distance(this.ball, this.goalCenter(0)),
      this.distance(this.ball, this.goalCenter(1)),
    );
    const nearGoal = clamp(1 - goalDist / 30, 0, 1);
    const scale = base * (1 + nearGoal * 0.12) * (this.frozen ? 0.95 : 1);
    return clamp(scale, 8, 32);
  }

  updateCamera(dt: number): void {
    const targetZoom = this.computeCameraZoom();
    this.camera.scale += (targetZoom - this.camera.scale) * Math.min(1, dt * 5);

    const owner = this.players.find((p) => p.active && p.id === this.ball.ownerId);
    const focusTeam: 0 | 1 = owner?.team ?? (this.ball.lastTouchId >= 0 ? this.ball.lastTouchTeam : this.protagonist.team);
    const attackGoal = this.goalCenter(focusTeam);
    const goalDx = attackGoal.x - this.ball.x;
    const goalDy = attackGoal.y - this.ball.y;
    const goalDistance = Math.hypot(goalDx, goalDy);
    const nearGoal = clamp(1 - goalDistance / 36, 0, 1);
    // Push the framing towards the goal being attacked, leaving room ahead of play.
    const lead = 2.2 + nearGoal * 4.8;
    const leadX = (Math.sign(goalDx) || this.attackingDir(focusTeam)) * lead;
    const leadY = Math.sign(goalDy) * lead * 0.35;
    const heroDistance = this.distance(this.ball, this.protagonist);
    const heroWeight = this.frozen ? 0.46 : clamp(0.32 - heroDistance * 0.006, 0.12, 0.3);
    const lookX = clamp(this.ball.vx * 0.16, -2.4, 2.4);
    const lookY = clamp(this.ball.vy * 0.16, -2.4, 2.4);
    let targetX = this.ball.x * (1 - heroWeight) + this.protagonist.x * heroWeight + leadX + lookX;
    let targetY = this.ball.y * (1 - heroWeight) + this.protagonist.y * heroWeight + leadY + lookY;
    targetX = clamp(targetX, -PITCH_HALF_L + 4, PITCH_HALF_L - 4);
    targetY = clamp(targetY, -PITCH_HALF_W + 4, PITCH_HALF_W - 4);
    const k = 1 - Math.exp(-dt * (this.frozen ? 5 : 6.5));
    this.camera.x += (targetX - this.camera.x) * k;
    this.camera.y += (targetY - this.camera.y) * k;
    this.camera.rot = this.getRotation();
  }

  private getRotation(): number {
    const portrait = this.viewport.h > this.viewport.w * 1.05;
    if (portrait) {
      return this.setup.playerTeam === 0 ? -Math.PI / 2 : Math.PI / 2;
    }
    return this.setup.playerTeam === 0 ? 0 : Math.PI;
  }

  project(x: number, y: number): Vec {
    const { w, h } = this.viewport;
    const rot = this.camera.rot;
    const dx = x - this.camera.x;
    const dy = y - this.camera.y;
    const cos = Math.cos(rot);
    const sin = Math.sin(rot);
    return {
      x: w / 2 + (dx * cos - dy * sin) * this.camera.scale,
      y: h / 2 + (dx * sin + dy * cos) * this.camera.scale,
    };
  }

  unproject(sx: number, sy: number): Vec {
    const { w, h } = this.viewport;
    const rot = this.camera.rot;
    const u = (sx - w / 2) / this.camera.scale;
    const v = (sy - h / 2) / this.camera.scale;
    const cos = Math.cos(rot);
    const sin = Math.sin(rot);
    return {
      x: this.camera.x + u * cos + v * sin,
      y: this.camera.y - u * sin + v * cos,
    };
  }

  private kickoff(team: 0 | 1): void {
    this.phase = "kickoff";
    this.phaseTimer = 0.9;
    this.restartTimer = 0;
    this.ball.x = 0;
    this.ball.y = 0;
    this.ball.z = 0;
    this.ball.vx = 0;
    this.ball.vy = 0;
    this.ball.vz = 0;
    this.ball.shot = false;
    this.ball.intendedFor = null;
    this.ball.passBy = null;
    this.ball.ownerId = null;
    this.pendingTap = null;
    this.dribbleTarget = null;
    for (const p of this.players) {
      const slot = LINEUP_SLOTS[p.slot];
      p.x = slot.x * (p.team === 0 ? 1 : -1);
      p.y = slot.y * (p.team === 0 ? 1 : -1);
      p.vx = 0;
      p.vy = 0;
      p.targetX = p.x;
      p.targetY = p.y;
      p.hasBall = false;
      p.stamina = clamp(p.stamina + 4, 0, 100);
      p.fx = p.team === 0 ? 1 : -1;
      p.fy = 0;
    }
    const taker =
      (team === this.setup.playerTeam && this.protagonist?.active ? this.protagonist : undefined) ??
      this.players.find((p) => p.active && p.team === team && p.role === "MC") ??
      this.players.find((p) => p.active && p.team === team && !p.isGK);
    if (taker) {
      taker.x = 0;
      taker.y = 0;
      taker.x = -0.7 * this.attackingDir(team);
      taker.hasBall = true;
      this.ball.ownerId = taker.id;
      this.ball.x = taker.x;
      this.ball.y = taker.y;
      this.ball.lastTouchTeam = team;
    }
    this.lastKickoffTeam = team;
    this.frozen = false;
    this.freezeReason = null;
    if (this.minute === 0) {
      this.addEvent("kickoff", `${this.setup.teamName[team]} começa com a bola.`, team);
    }
    if (taker?.isProtagonist) {
      this.lastProtagonistTouchAt = this.realTime;
      this.openIntervention("kickoff");
    }
  }

  start(): void {
    this.phaseTimer = 1;
    this.updateCamera(0.016);
  }

  setPaused(p: boolean): void {
    this.paused = p;
  }

  getHud(): MatchHud {
    const p = this.protagonist;
    const event = this.events[0];
    return {
      homeShort: this.setup.teamShort[0],
      awayShort: this.setup.teamShort[1],
      homeName: this.setup.teamName[0],
      awayName: this.setup.teamName[1],
      homeScore: this.score[0],
      awayScore: this.score[1],
      minute: Math.min(90, Math.round(this.minute)),
      phase: this.phase,
      frozen: this.frozen,
      competitionName: this.setup.competitionName,
      playerName: p.name,
      playerNumber: p.number,
      playerRating: this.liveRating(),
      playerGoals: p.goals,
      playerAssists: p.assists,
      playerStamina: Math.round(this.players.find((pl) => pl.isProtagonist)?.stamina ?? 100),
      hasBall: p.hasBall,
      tacklePrompt: this.hasTackleOpportunity(),
      passPrompt: this.frozen && p.hasBall,
      goalPrompt: this.frozen && p.hasBall && this.distance(p, this.goalCenter(p.team)) < 32,
      tackleOpportunity: this.hasTackleOpportunity(),
      eventText: event?.text ?? "",
      lastEventType: event?.type ?? "",
      homeKit: this.setup.kit[0],
      awayKit: this.setup.kit[1],
      paused: this.paused,
      finished: this.phase === "fulltime",
      possession: this.possessionPercent(),
      shots: this.shotsCount,
    };
  }

  private possessionPercent(): [number, number] {
    const total = this.possessionTime[0] + this.possessionTime[1] || 1;
    return [
      Math.round((this.possessionTime[0] / total) * 100),
      Math.round((this.possessionTime[1] / total) * 100),
    ];
  }

  private liveRating(): number {
    const p = this.protagonist;
    const s = p.stats;
    return clamp(
      6 +
        p.goals * 1.1 +
        p.assists * 0.7 +
        s.tackles * 0.07 +
        s.interceptions * 0.05 +
        s.passesCompleted * 0.006 -
        s.fouls * 0.08 -
        s.yellow * 0.15,
      4,
      10,
    );
  }

  hasTackleOpportunity(): boolean {
    if (this.phase !== "play" || this.frozen) return false;
    const owner = this.players.find((p) => p.id === this.ball.ownerId);
    if (!owner || owner.team === this.protagonist.team) return false;
    return this.distance(owner, this.protagonist) < 8.5;
  }

  private canShootFor(p: MatchPlayer): boolean {
    return this.distance(p, this.goalCenter(p.team)) < 34;
  }

  private openIntervention(reason: NonNullable<MatchEngine["freezeReason"]>): void {
    if (this.phase === "fulltime" || this.subbedOff) return;
    this.frozen = true;
    this.freezeReason = reason;
    this.pendingTap = null;
    this.gestureActive = false;
    this.lastFreezeAt = this.realTime;
  }

  private resume(): void {
    this.frozen = false;
    this.freezeReason = null;
    this.pendingTap = null;
    this.gestureActive = false;
    this.lastResumeAt = this.realTime;
  }

  private isProtagonistBall(): boolean {
    return this.ball.ownerId === this.protagonist.id && this.protagonist.hasBall;
  }

  releaseAI(): void {
    if (!this.frozen) return;
    this.dribbleTarget = null;
    this.resume();
    this.feedback = "A IA continua a jogada.";
    this.feedbackUntil = this.realTime + 1.6;
  }

  dribbleTo(target: Vec): void {
    if (!this.frozen) return;
    const tx = clamp(target.x, -PITCH_HALF_L + 1, PITCH_HALF_L - 1);
    const ty = clamp(target.y, -PITCH_HALF_W + 1, PITCH_HALF_W - 1);
    this.dribbleTarget = { x: tx, y: ty };
    this.dribbleUntil = this.realTime + 3.2;
    this.protagonist.targetX = tx;
    this.protagonist.targetY = ty;
    this.protagonist.stats.dribbles += 1;
    this.resume();
  }

  passTo(teammateId: number, lofted: boolean): void {
    if (!this.frozen) return;
    const teammate = this.players.find((p) => p.id === teammateId);
    if (!teammate) return;
    this.performPass(this.protagonist, teammate, lofted);
    this.resume();
    this.dribbleTarget = null;
  }

  tapAt(target: Vec): void {
    if (!this.frozen || !this.isProtagonistBall()) return;
    // A tap always means "carry the ball" (or target a team-mate); shooting is
    // reserved for the drawn gesture exactly as the controls specify.
    const teammate = this.findTeammateNear(target, 7.5);
    if (teammate) {
      if (this.pendingTap && "id" in this.pendingTap && this.pendingTap.id === teammate.id) {
        this.pendingTap = null;
        this.passTo(teammate.id, true);
      } else {
        this.pendingTap = { kind: "teammate", id: teammate.id, at: this.realTime };
        this.feedback = "Toca outra vez para passe aéreo.";
        this.feedbackUntil = this.realTime + 1.2;
      }
      return;
    }
    this.dribbleTo(target);
  }

  private findTeammateNear(target: Vec, radius: number): MatchPlayer | null {
    let best: MatchPlayer | null = null;
    let bestDist = radius;
    for (const p of this.players) {
      if (!p.active || p.team !== this.protagonist.team || p.id === this.protagonist.id) continue;
      const dist = this.distance(this.playerVec(p), target);
      if (dist < bestDist) {
        bestDist = dist;
        best = p;
      }
    }
    return best;
  }

  shootAt(target: Vec, power = 1): void {
    if (!this.frozen) return;
    const p = this.protagonist;
    const goal = this.goalCenter(p.team);
    const distanceToGoal = this.distance(p, goal);
    const pressure = this.nearestOpponent(p).dist;
    const aim = { x: target.x, y: target.y };
    const accuracy =
      p.attrs.finishing * 0.55 +
      p.attrs.positioning * 0.2 +
      p.attrs.vision * 0.1 +
      clamp(pressure * 5, 0, 45) * 0.15;
    const errorScale = clamp((100 - accuracy) / 100, 0.02, 0.75);
    const err = (this.rand() - 0.5) * errorScale * Math.min(1.4, distanceToGoal / 18 + 0.25);
    aim.y += err * 4.2;
    aim.x += err * 1.2;
    const speed = clamp((distanceToGoal > 24 ? 24 : 21) * (0.75 + power * 0.35), 15, 32);
    this.kickBall(p, aim, speed, false, true);
    p.stats.shots += 1;
    this.shotsCount[p.team] += 1;
    this.resume();
    this.dribbleTarget = null;
    this.addEvent("chance", `${p.name} remata!`, p.team);
  }

  private kickBall(
    p: MatchPlayer,
    target: Vec,
    speed: number,
    lofted: boolean,
    shot: boolean,
    assistIntent = false,
  ): void {
    const dx = target.x - p.x;
    const dy = target.y - p.y;
    const len = Math.hypot(dx, dy) || 1;
    p.fx = dx / len;
    p.fy = dy / len;
    p.hasBall = false;
    this.ball.ownerId = null;
    this.ball.lastTouchId = p.id;
    this.ball.lastTouchTeam = p.team;
    this.ball.intendedFor = null;
    this.ball.shot = shot;
    this.ball.shotBy = shot ? p.id : -1;
    this.ball.passBy = !shot ? p.id : null;
    this.ball.passTeam = p.team;
    this.ball.x = p.x + p.fx * 0.7;
    this.ball.y = p.y + p.fy * 0.7;
    this.ball.vx = (dx / len) * speed;
    this.ball.vy = (dy / len) * speed;
    this.ball.z = lofted ? 0.4 : 0.05;
    this.ball.vz = lofted ? 3.4 + speed * 0.05 : 0;
    this.ball.spin = (this.rand() - 0.5) * 4;
    // The kicker cannot instantly re-take their own pass or shot.
    this.lastKickAt = this.realTime;
    if (shot) this.shotBlockTried = false;
    void assistIntent;
  }

  private performPass(from: MatchPlayer, to: MatchPlayer, lofted: boolean): void {
    const distance = this.distance(from, to);
    const lead = lofted ? 0.5 : 0.35;
    const target = { x: to.x + to.vx * lead, y: to.y + to.vy * lead };
    const pressure = this.nearestOpponent(from).dist;
    const errorAmount = clamp(1 - from.attrs.passing / 100, 0.02, 0.55) * (0.16 + pressure * 0.008) * (distance / 22);
    target.x += (this.rand() - 0.5) * errorAmount * 2;
    target.y += (this.rand() - 0.5) * errorAmount * 3.2;
    const speed = lofted ? clamp(distance * 0.9, 14, 24) : clamp(distance * 1.35, 10, 27);
    // A new pass clears any stale offside flag from a previous move.
    for (const q of this.players) q.offsideFlag = false;
    // Offside check on the intended receiver at the moment of the pass.
    if ((to.x - from.x) * this.attackingDir(from.team) > 0.5) {
      const defenders = this.players
        .filter((q) => q.active && q.team !== from.team)
        .map((q) => q.x * this.attackingDir(from.team))
        .sort((a, b) => b - a);
      const secondLast = defenders[1] ?? defenders[0] ?? 0;
      const receiverAdvance = to.x * this.attackingDir(from.team);
      if (receiverAdvance > Math.max(0, secondLast) + 0.6 && receiverAdvance > 0) {
        to.offsideFlag = true;
      }
    }
    from.stats.passes += 1;
    this.kickBall(from, target, speed, lofted, false);
    this.ball.intendedFor = to.id;
    this.lastPass = { by: from.id, team: from.team, at: this.realTime, intended: to.id, credited: false };
    if (to.isProtagonist) {
      this.feedback = "Bola a caminho...";
    }
    void this.noAssistWindow;
  }

  private attemptUserTackle(target: Vec): void {
    const p = this.protagonist;
    const owner = this.players.find((x) => x.id === this.ball.ownerId && x.active);
    if (!owner || owner.team === p.team) {
      this.feedback = "Sem adversário com bola ao alcance.";
      this.feedbackUntil = this.realTime + 1.4;
      return;
    }
    const dist = this.distance(p, owner);
    if (dist > 11) {
      this.feedback = "Estás demasiado longe para desarmar.";
      this.feedbackUntil = this.realTime + 1.4;
      return;
    }
    const toCarrier = { x: owner.x - p.x, y: owner.y - p.y };
    const toTarget = { x: target.x - p.x, y: target.y - p.y };
    const norm = (v: Vec) => {
      const l = Math.hypot(v.x, v.y) || 1;
      return { x: v.x / l, y: v.y / l };
    };
    const a = norm(toCarrier);
    const b = norm(toTarget);
    const alignment = a.x * b.x + a.y * b.y;
    if (alignment < 0.25) {
      this.feedback = "Arrasta o dedo na direção do adversário.";
      this.feedbackUntil = this.realTime + 1.4;
      return;
    }
    p.slideTimer = 0.5;
    p.stunnedTimer = 0.35;
    p.fx = a.x;
    p.fy = a.y;
    p.targetX = owner.x;
    p.targetY = owner.y;
    p.stats.tackles += 1;
    const success = clamp(
      0.28 + (p.attrs.tackling - owner.attrs.dribbling) / 150 + (1 - dist / 11) * 0.26,
      0.06,
      0.86,
    );
    if (this.rand() < success) {
      this.gainPossession(p, owner);
      this.addEvent("info", `Desarme limpo de ${p.name}!`, p.team);
      this.openIntervention("tackle");
    } else {
      const foulChance = 0.42 + (p.attrs.tackling < 60 ? 0.1 : 0);
      if (this.rand() < foulChance) {
        p.stats.fouls += 1;
        const yellow = this.rand() < 0.34;
        const red = yellow && this.rand() < 0.07;
        if (yellow) {
          p.stats.yellow += 1;
          p.yellow += 1;
          if (red || p.yellow >= 2) {
            p.stats.red = 1;
            p.red = 1;
            p.active = false;
            this.addEvent("card", `Cartão vermelho para ${p.name}.`, p.team);
            this.finishProtagonistMatch(this.minute);
            this.awardFoulRestart(p.team, owner.x, owner.y);
            return;
          }
          this.addEvent("card", `Cartão amarelo para ${p.name}.`, p.team);
        }
        this.addEvent("info", `Falta de ${p.name}.`, p.team);
        this.awardFoulRestart(p.team, owner.x, owner.y);
      } else {
        this.addEvent("info", `${p.name} falhou o desarme.`, p.team);
      }
      this.feedback = "Desarme falhado.";
      this.feedbackUntil = this.realTime + 1.2;
    }
  }

  private gainPossession(player: MatchPlayer, from?: MatchPlayer): void {
    const previousOwner = this.players.find((p) => p.id === this.ball.ownerId);
    if (previousOwner) previousOwner.hasBall = false;
    const wasOpponentBall = previousOwner && previousOwner.team !== player.team;
    this.ball.ownerId = player.id;
    this.ball.shot = false;
    this.ball.intendedFor = null;
    this.ball.vz = 0;
    this.ball.z = 0;
    this.ball.passBy = null;
    player.hasBall = true;
    if (this.lastPass && this.lastPass.team !== player.team) {
      // A completed pass only belongs to the team that made it; an interception
      // ends that passing move for statistical purposes.
      this.lastPass = null;
    } else if (this.lastPass && this.lastPass.team === player.team && this.lastPass.by !== player.id && !this.lastPass.credited) {
      const passer = this.players.find((p) => p.id === this.lastPass?.by);
      if (passer) passer.stats.passesCompleted += 1;
      this.lastPass.credited = true;
    }
    if (wasOpponentBall) {
      if (player.isProtagonist) {
        player.stats.interceptions += 1;
      }
    }
    if (player.isProtagonist) {
      this.lastProtagonistTouchAt = this.realTime;
      this.openIntervention("receive");
    }
    void from;
  }

  private finishProtagonistMatch(minute: number): void {
    if (this.subbedOff) return;
    this.subbedOff = true;
    this.playerSubMinute = Math.round(minute);
    this.protagonist.active = false;
    this.protagonist.hasBall = false;
    this.frozen = false;
    this.freezeReason = null;
  }

  private awardFoulRestart(foulingTeam: 0 | 1, x: number, y: number): void {
    const ownGoal = this.ownGoalX(foulingTeam);
    const inBox = Math.abs(x - ownGoal) < 16.5 && Math.abs(y) < 20.2;
    this.awardRestart(this.opponentOf(foulingTeam), x, y, inBox ? "penalty" : "free");
  }

  private awardRestart(team: 0 | 1, x: number, y: number, kind: "throw" | "corner" | "goalKick" | "free" | "kickoff" | "penalty"): void {
    const clampX = clamp(x, -PITCH_HALF_L + 1, PITCH_HALF_L - 1);
    const clampY = clamp(y, -PITCH_HALF_W + 1, PITCH_HALF_W - 1);
    this.ball.x = clampX;
    this.ball.y = clampY;
    this.ball.z = 0;
    this.ball.vx = 0;
    this.ball.vy = 0;
    this.ball.vz = 0;
    this.ball.shot = false;
    this.ball.intendedFor = null;
    this.ball.passBy = null;
    this.ball.ownerId = null;
    this.phase = "restart";
    this.restartTimer = kind === "penalty" ? 1.4 : 1.15;
    this.pendingTap = null;
    this.dribbleTarget = null;
    for (const p of this.players) p.hasBall = false;
    let taker: MatchPlayer | undefined;
    if (kind === "goalKick") {
      taker = this.players.find((p) => p.active && p.team === team && p.isGK);
    } else if (kind === "penalty") {
      taker = this.players.find((p) => p.active && p.team === team && p.isProtagonist);
      if (!taker) {
        taker = this.players
          .filter((p) => p.active && p.team === team && !p.isGK)
          .sort((a, b) => b.attrs.finishing - a.attrs.finishing)[0];
      }
    } else {
      taker = this.players
        .filter((p) => p.active && p.team === team && !p.isGK)
        .sort((a, b) => this.distance(a, { x: clampX, y: clampY }) - this.distance(b, { x: clampX, y: clampY }))[0];
    }
    if (taker) {
      // Set-piece duties keep the protagonist involved in the match.
      if ((kind === "corner" || kind === "free") && team === this.setup.playerTeam && this.protagonist.active) {
        taker = this.protagonist;
      }
      if (kind === "penalty") {
        const spotX = this.targetGoalX(team) - this.attackingDir(team) * 11;
        this.ball.x = spotX;
        this.ball.y = 0;
        taker.x = spotX - this.attackingDir(team) * 0.4;
        taker.y = 0;
      } else {
        taker.x = clampX - this.attackingDir(team) * 0.4;
        taker.y = clampY;
      }
      taker.hasBall = true;
      taker.fx = this.attackingDir(team);
      taker.fy = 0;
      this.ball.ownerId = taker.id;
    }
    if (kind === "corner") this.addEvent("corner", `Canto para ${this.setup.teamShort[team]}.`, team);
    else if (kind === "penalty") this.addEvent("chance", `Penálti para ${this.setup.teamShort[team]}!`, team);
    else if (kind === "free") this.addEvent("info", `Livre para ${this.setup.teamShort[team]}.`, team);
    else if (kind === "goalKick") this.addEvent("info", `Pontapé de baliza para ${this.setup.teamShort[team]}.`, team);
    else this.addEvent("info", `Lançamento para ${this.setup.teamShort[team]}.`, team);
    this.restartKind = kind;
    this.restartTeam = team;
  }

  private restartKind: "throw" | "corner" | "goalKick" | "free" | "kickoff" | "penalty" = "throw";
  private restartTeam: 0 | 1 = 0;

  private autoRestart(): void {
    const team = this.restartTeam;
    const kind = this.restartKind;
    const taker = this.players.find((p) => p.id === this.ball.ownerId);
    if (!taker) {
      this.phase = "play";
      return;
    }
    const goal = this.goalCenter(team);
    if (kind === "goalKick") {
      const candidate = this.players
        .filter((p) => p.active && p.team === team && !p.isGK && p !== taker)
        .sort((a, b) => this.distance(a, goal) - this.distance(b, goal))[0];
      if (candidate) this.performPass(taker, candidate, false);
      else this.kickBall(taker, { x: 0, y: 0 }, 20, true, false);
    } else if (kind === "corner") {
      const target = this.players
        .filter((p) => p.active && p.team === team && !p.isGK && p.id !== taker.id)
        .sort((a, b) => Math.abs(a.x - goal.x) - Math.abs(b.x - goal.x))[0];
      this.performPass(taker, target ?? taker, true);
    } else if (kind === "penalty") {
      const gk = this.players.find((p) => p.active && p.team !== team && p.isGK);
      const scored = this.rand() < 0.76;
      this.ball.ownerId = null;
      this.ball.x = this.goalCenter(team).x - this.attackingDir(team) * 11;
      this.ball.y = 0;
      this.ball.vx = this.attackingDir(team) * 24;
      this.ball.vy = (this.rand() - 0.5) * 3;
      this.ball.vz = 0.3;
      this.ball.shot = true;
      this.ball.shotBy = taker.id;
      taker.stats.shots += 1;
      this.shotsCount[team] += 1;
      void gk;
      if (scored) {
        this.scoreGoal(team, taker, null);
      } else {
        this.addEvent("save", "O guarda-redes defende o penálti!", this.opponentOf(team));
        this.phase = "play";
      }
    } else if (kind === "free") {
      const distGoal = this.distance(taker, goal);
      if (distGoal < 28 && this.rand() < 0.5) {
        this.shootFromAi(taker, goal, true);
      } else {
        const candidates = this.players.filter((p) => p.active && p.team === team && p.id !== taker.id);
        const best = candidates.sort(
          (a, b) =>
            this.distance(a, goal) - this.distance(b, goal) - (this.nearestOpponent(a).dist - this.nearestOpponent(b).dist),
        )[0];
        if (best) this.performPass(taker, best, false);
      }
    } else {
      const closest = this.nearestTeammate(taker, false);
      if (closest) this.performPass(taker, closest, false);
      else this.kickBall(taker, { x: 0, y: 0 }, 18, true, false);
    }
    this.phase = "play";
    this.restartTimer = 0;
  }

  private shootFromAi(p: MatchPlayer, goal: Vec, lofted = false): void {
    const pressure = this.nearestOpponent(p).dist;
    const distance = this.distance(p, goal);
    const accuracy =
      p.attrs.finishing * 0.55 + p.attrs.positioning * 0.2 + clamp(pressure * 5, 0, 40) * 0.2;
    const error = (this.rand() - 0.5) * clamp((100 - accuracy) / 100, 0.05, 0.7) * 6.4;
    const target = { x: goal.x, y: goal.y + error * (0.4 + distance / 40) };
    const speed = clamp(16 + p.attrs.finishing * 0.12 + this.rand() * 4, 16, 31);
    this.kickBall(p, target, speed, lofted, true);
    p.stats.shots += 1;
    this.shotsCount[p.team] += 1;
    this.addEvent("chance", `Remate de ${p.name}.`, p.team);
  }

  private scoreGoal(team: 0 | 1, scorer: MatchPlayer, assist: MatchPlayer | null): void {
    if (this.phase === "goal" || this.phase === "fulltime") return;
    this.score[team] += 1;
    scorer.goals += 1;
    if (assist && assist.team === team) assist.assists += 1;
    this.addEvent("goal", `⚽ GOLO! ${scorer.name} marca para ${this.setup.teamShort[team]} (${this.score[0]}-${this.score[1]}).`, team);
    if (scorer.isProtagonist) {
      this.feedback = "GOLO!";
      this.feedbackUntil = this.realTime + 3;
    }
    this.ball.ownerId = null;
    this.ball.vx = 0;
    this.ball.vy = 0;
    this.ball.vz = 0;
    this.phase = "goal";
    this.phaseTimer = 2.2;
    this.frozen = false;
    this.freezeReason = null;
    this.lastScoringTeam = team;
  }

  private lastScoringTeam: 0 | 1 = 0;

  private updateFrozen(dt: number): void {
    this.updateCamera(dt);
    if (this.pendingTap && this.realTime - this.pendingTap.at > 0.28) {
      const tap = this.pendingTap;
      this.pendingTap = null;
      if (this.players.find((p) => p.id === tap.id)) this.passTo(tap.id, false);
    }
  }

  private advanceClock(dt: number): void {
    this.minute += dt * MINUTES_PER_SECOND;
    if (!this.firstHalfEnded && this.minute >= 45) {
      this.firstHalfEnded = true;
      this.phase = "halftime";
      this.phaseTimer = 1.4;
      this.addEvent("half", "Intervalo. As equipas vão para o balneário.");
      this.frozen = false;
      this.freezeReason = null;
    } else if (this.minute >= 90) {
      this.minute = 90;
      this.phase = "fulltime";
      this.frozen = false;
      this.freezeReason = null;
      this.addEvent("full", `Apito final: ${this.setup.teamShort[0]} ${this.score[0]} - ${this.score[1]} ${this.setup.teamShort[1]}.`);
    }
  }

  update(dt: number): void {
    const step = Math.min(dt, 0.05);
    this.realTime += step;
    if (this.paused || this.phase === "fulltime") {
      this.updateCamera(step);
      return;
    }
    this.updateCamera(step);

    if (this.phase === "goal") {
      this.phaseTimer -= step;
      if (this.phaseTimer <= 0) {
        this.kickoff(this.opponentOf(this.lastScoringTeam));
        this.phase = "kickoff";
        this.phaseTimer = 0.8;
      }
      return;
    }
    if (this.phase === "halftime") {
      this.phaseTimer -= step;
      if (this.phaseTimer <= 0) {
        this.minute = Math.max(this.minute, 45);
        this.kickoff(this.opponentOf(this.lastKickoffTeam));
        this.phase = "kickoff";
        this.phaseTimer = 0.8;
      }
      return;
    }
    if (this.frozen) {
      this.updateFrozen(step);
      return;
    }
    if (this.phase === "kickoff") {
      this.phaseTimer -= step;
      if (this.phaseTimer <= 0) {
        this.phase = "play";
        this.addEvent("info", "Bola ao centro. Joga!");
      }
      return;
    }
    if (this.phase === "restart") {
      this.restartTimer -= step;
      this.positionForRestart(step);
      if (this.restartTimer <= 0) {
        const taker = this.players.find((p) => p.id === this.ball.ownerId);
        if (taker?.isProtagonist && !this.subbedOff) {
          this.openIntervention(this.restartKind === "penalty" ? "penalty" : "restart");
          this.phase = "play";
        } else {
          this.autoRestart();
        }
      }
      return;
    }

    if (this.phase === "play") {
      this.advanceClock(step);
      if (this.phase !== "play") return;
      this.simulatePlay(step);
    }
  }

  private positionForRestart(dt: number): void {
    for (const p of this.players) {
      if (!p.active) continue;
      if (p.id === this.ball.ownerId) {
        p.targetX = this.ball.x;
        p.targetY = this.ball.y;
      } else {
        const slot = LINEUP_SLOTS[p.slot];
        const baseX = slot.x * (p.team === 0 ? 1 : -1);
        const baseY = slot.y * (p.team === 0 ? 1 : -1);
        p.targetX = baseX;
        p.targetY = baseY;
      }
      this.movePlayer(p, dt, 0.75);
    }
  }

  private simulatePlay(dt: number): void {
    for (const p of this.players) {
      if (!p.active) continue;
      p.cooldown = Math.max(0, p.cooldown - dt);
      p.stunnedTimer = Math.max(0, p.stunnedTimer - dt);
      p.slideTimer = Math.max(0, p.slideTimer - dt);
      p.thinkTimer -= dt;
      if (p.thinkTimer <= 0) {
        this.decidePlayer(p);
        p.thinkTimer = 0.12 + this.rand() * 0.16;
      }
    }
    for (const p of this.players) {
      if (!p.active) continue;
      this.movePlayer(p, dt, 1);
    }
    this.updateBall(dt);
    if (this.phase === "play") this.resolveBallContacts(dt);
    if (this.phase === "play") this.attemptAiTackles(dt);
    if (this.isProtagonistBall() && this.dribbleTarget) {
      const d = this.distance(this.protagonist, this.dribbleTarget);
      const pressure = this.nearestOpponent(this.protagonist).dist;
      const reached = d < 1.5;
      const pressured = pressure < 3.4;
      const inRange = this.distance(this.protagonist, this.goalCenter(this.protagonist.team)) < 21;
      const timedOut = this.realTime > this.dribbleUntil;
      if ((reached || pressured || inRange || timedOut) && this.realTime - this.lastResumeAt > 0.55) {
        if (reached) this.protagonist.stats.dribblesCompleted += 1;
        this.dribbleTarget = null;
        this.openIntervention("dribble");
      }
    }
    if (this.ball.ownerId !== null) {
      const owner = this.players.find((p) => p.id === this.ball.ownerId);
      if (owner?.active) {
        this.possessionTime[owner.team] += dt;
      }
    }
    if (this.phase === "play" && !this.frozen) {
      this.checkProtagonistSubstitution();
    }
  }

  private checkProtagonistSubstitution(): void {
    if (this.subbedOff || this.minute < 72) return;
    const p = this.protagonist;
    if (p.stats.red > 0 || !p.active) return;
    const teamLosing = this.score[p.team] < this.score[this.opponentOf(p.team)];
    if ((p.stamina < 22 && teamLosing) || (this.liveRating() < 5.2 && p.stamina < 45)) {
      this.finishProtagonistMatch(this.minute);
      this.addEvent("sub", `Substituição: ${p.name} sai aos ${Math.round(this.minute)}'.`, p.team);
      this.feedback = "O treinador substituiu-te.";
      this.feedbackUntil = this.realTime + 2.5;
    }
  }

  private decidePlayer(p: MatchPlayer): void {
    if (!p.active) return;
    const isOwner = this.ball.ownerId === p.id;
    if (p.isGK) {
      if (isOwner) {
        this.gkDistribute(p);
        return;
      }
      const goalX = this.ownGoalX(p.team);
      const boxEdge = goalX + (p.team === 0 ? 16 : -16);
      const ballInBox = p.team === 0 ? this.ball.x < boxEdge : this.ball.x > boxEdge;
      if (ballInBox && this.distance(p, { x: this.ball.x, y: this.ball.y }) < 16) {
        p.targetX = clamp(this.ball.x, goalX, boxEdge);
        p.targetY = clamp(this.ball.y, -13, 13);
      } else {
        p.targetX = goalX + (p.team === 0 ? 3.2 : -3.2);
        p.targetY = clamp(this.ball.y * 0.35, -4.4, 4.4);
      }
      return;
    }

    // Nobody owns a pass/shot in flight: the intended receiver and the two
    // nearest team-mates must attack the ball instead of drifting back into
    // their formation shape. Without this, passes simply roll into empty grass.
    if (this.ball.ownerId === null && this.shouldChaseLooseBall(p)) {
      const lead = clamp(0.16 + this.ball.z * 0.04, 0.16, 0.4);
      p.targetX = clamp(this.ball.x + this.ball.vx * lead, -PITCH_HALF_L + 2, PITCH_HALF_L - 2);
      p.targetY = clamp(this.ball.y + this.ball.vy * lead, -PITCH_HALF_W + 2, PITCH_HALF_W - 2);
      return;
    }

    if (isOwner) {
      if (p.isProtagonist) {
        if (this.dribbleTarget) {
          p.targetX = this.dribbleTarget.x;
          p.targetY = this.dribbleTarget.y;
        } else {
          // When the user releases the play to the AI, it must be able to pass
          // and shoot, not only dribble until the next freeze.
          this.aiOwnerDecision(p);
        }
        return;
      }
      this.aiOwnerDecision(p);
      return;
    }

    const hasPossession = this.ball.ownerId !== null && this.players.find((x) => x.id === this.ball.ownerId)?.team === p.team;
    const slot = LINEUP_SLOTS[p.slot];
    const dir = p.team === 0 ? 1 : -1;
    let baseX = slot.x * dir;
    let baseY = slot.y * dir;
    const ballAdvance = (this.ball.x - baseX) * 0.12;
    if (hasPossession) {
      baseX += dir * (p.role === "PL" || p.role === "ED" || p.role === "EE" ? 9 : 6);
      if (p.isProtagonist) {
        // Drift into the middle of the pitch as a visible passing outlet.
        baseX += dir * 2.5;
        baseY *= 0.8;
      }
    } else {
      baseX -= dir * (p.role === "DD" || p.role === "DE" || p.role === "DC" ? 2 : 4);
    }
    baseX = clamp(baseX + ballAdvance, -PITCH_HALF_L + 4, PITCH_HALF_L - 4);
    baseY = clamp(baseY + (this.ball.y - baseY) * 0.22, -PITCH_HALF_W + 3, PITCH_HALF_W - 3);
    p.targetX = baseX;
    p.targetY = baseY;

    const defending = this.ball.ownerId !== null && this.players.find((x) => x.id === this.ball.ownerId)?.team !== p.team;
    if (defending && !this.ball.shot) {
      const owner = this.players.find((x) => x.id === this.ball.ownerId);
      if (owner) {
        const nearest = this.nearestOpponentOfTeam(owner, p.team);
        if (nearest?.id === p.id) {
          p.targetX = owner.x + (this.ball.x - owner.x) * 0.1;
          p.targetY = owner.y;
          p.maxSpeed;
        }
      }
    }

    if (hasPossession && (p.role === "PL" || p.role === "ED" || p.role === "EE" || p.role === "MO")) {
      // Forwards attack space ahead of the ball.
      const runDistance = p.role === "PL" ? 22 : 17;
      const runTargetX = p.team === 0
        ? Math.min(PITCH_HALF_L - 6, this.ball.x + runDistance)
        : Math.max(-PITCH_HALF_L + 6, this.ball.x - runDistance);
      p.targetX = clamp(runTargetX + (this.rand() - 0.5) * 6, -PITCH_HALF_L + 5, PITCH_HALF_L - 5);
      p.targetY = clamp(p.targetY + (this.rand() - 0.5) * 10, -PITCH_HALF_W + 4, PITCH_HALF_W - 4);
    }
  }

  private shouldChaseLooseBall(p: MatchPlayer): boolean {
    if (this.ball.ownerId !== null || p.isGK) return false;
    if (this.ball.intendedFor === p.id) return true;
    const myDistance = this.distance(p, this.ball);
    let closerTeamMates = 0;
    for (const mate of this.players) {
      if (!mate.active || mate.team !== p.team || mate.id === p.id || mate.isGK) continue;
      if (this.distance(mate, this.ball) < myDistance) closerTeamMates += 1;
    }
    return closerTeamMates < 2;
  }

  private nearestOpponentOfTeam(player: MatchPlayer, team: 0 | 1): MatchPlayer | null {
    let best: MatchPlayer | null = null;
    let bestDist = Infinity;
    for (const p of this.players) {
      if (!p.active || p.team !== team) continue;
      const d = this.distance(player, p);
      if (d < bestDist) {
        bestDist = d;
        best = p;
      }
    }
    return best;
  }

  private gkDistribute(p: MatchPlayer): void {
    if (p.cooldown > 0) return;
    p.cooldown = 1.6;
    const candidates = this.players.filter((q) => q.active && q.team === p.team && q.id !== p.id && !q.isGK);
    const best = candidates.sort(
      (a, b) => this.nearestOpponent(b).dist - this.nearestOpponent(a).dist,
    )[0];
    if (best && this.distance(p, best) < 40) {
      this.performPass(p, best, false);
    } else if (best) {
      this.kickBall(p, { x: p.team === 0 ? 15 : -15, y: best.y }, 22, true, false);
    } else {
      this.kickBall(p, { x: 0, y: 0 }, 20, true, false);
    }
  }

  private aiDribble(p: MatchPlayer): void {
    const goal = this.goalCenter(p.team);
    const dir = this.attackingDir(p.team);
    const pressure = this.nearestOpponent(p);
    let tx = p.x + dir * 6;
    let ty = p.y + (this.rand() - 0.5) * 5;
    if (pressure.dist < 4 && pressure.player) {
      ty = p.y + (p.y - pressure.player.y > 0 ? 1 : -1) * 6;
    }
    tx = clamp(tx, -PITCH_HALF_L + 4, PITCH_HALF_L - 4);
    ty = clamp(ty, -PITCH_HALF_W + 3, PITCH_HALF_W - 3);
    p.targetX = tx;
    p.targetY = ty;
    void goal;
  }

  private aiOwnerDecision(p: MatchPlayer): void {
    if (p.cooldown > 0) {
      this.aiDribble(p);
      return;
    }
    const goal = this.goalCenter(p.team);
    const distance = this.distance(p, goal);
    const pressure = this.nearestOpponent(p);
    const dir = this.attackingDir(p.team);
    const defendersBetween = this.players.filter(
      (q) => q.active && q.team !== p.team && Math.abs(q.x - p.x) < distance && Math.sign(q.x - p.x) === dir && Math.abs(q.y - p.y) < 9,
    ).length;

    // Decisions repeat several times per second; keep shooting selective so
    // low-league attacks do not spam hopeless 30-metre attempts.
    const shootChance = distance < 12 ? 0.55 : distance < 22 ? 0.32 : distance < 30 ? 0.08 : distance < 36 ? 0.01 : 0;
    if (this.rand() < shootChance && pressure.dist > 1.3) {
      p.cooldown = 0.8;
      this.shootFromAi(p, goal);
      return;
    }

    const teammates = this.players.filter((q) => q.active && q.team === p.team && q.id !== p.id);
    const best = teammates
      .map((q) => {
        const qDist = this.distance(p, q);
        if (qDist < 4 || qDist > 38) return { q, score: -Infinity };
        const openness = this.nearestOpponent(q).dist;
        const forward = (q.x - p.x) * dir;
        // The user's player should be a real outlet, but not a magnet that
        // causes endless give-and-go loops with the same team-mate.
        const starvingForBall = this.realTime - this.lastProtagonistTouchAt > 12;
        const protagonistBias = q.isProtagonist ? (starvingForBall ? 8 : 2.2) : 0;
        const returnPassPenalty = this.lastPass?.by === q.id ? 3.2 : 0;
        const score = openness * 1.1 + forward * 0.85 - qDist * 0.12 - (q.isGK ? 16 : 0) + protagonistBias - returnPassPenalty;
        return { q, score };
      })
      .sort((a, b) => b.score - a.score)[0];
    const passChance = pressure.dist < 3.2 ? 0.72 : pressure.dist < 6 ? 0.45 : 0.24;
    if (best && Number.isFinite(best.score) && this.rand() < passChance) {
      p.cooldown = 0.6;
      const lofted = this.distance(p, best.q) > 24 && this.rand() < 0.5;
      this.performPass(p, best.q, lofted);
      return;
    }

    if (defendersBetween >= 3 || (pressure.dist < 2.2 && this.rand() < 0.5)) {
      p.cooldown = 0.5;
      this.aiDribble(p);
      return;
    }
    this.aiDribble(p);
  }

  private movePlayer(p: MatchPlayer, dt: number, effort: number): void {
    if (p.stunnedTimer > 0 && !p.hasBall) {
      p.vx *= 0.9;
      p.vy *= 0.9;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      return;
    }
    const dx = p.targetX - p.x;
    const dy = p.targetY - p.y;
    const dist = Math.hypot(dx, dy);
    const staminaFactor = 0.68 + (p.stamina / 100) * 0.32;
    const maxSpeed = p.maxSpeed * staminaFactor * (p.hasBall ? 0.9 : 1) * effort;
    const desiredVX = dist > 0.35 ? (dx / dist) * maxSpeed : 0;
    const desiredVY = dist > 0.35 ? (dy / dist) * maxSpeed : 0;
    const accel = p.accel * (p.slideTimer > 0 ? 1.8 : 1);
    p.vx += clamp(desiredVX - p.vx, -accel * dt, accel * dt);
    p.vy += clamp(desiredVY - p.vy, -accel * dt, accel * dt);
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.x = clamp(p.x, -PITCH_HALF_L + 1, PITCH_HALF_L - 1);
    p.y = clamp(p.y, -PITCH_HALF_W + 1, PITCH_HALF_W - 1);
    const speed = Math.hypot(p.vx, p.vy);
    if (speed > 0.35) {
      p.fx = p.vx / speed;
      p.fy = p.vy / speed;
      p.stridePhase = (p.stridePhase + speed * dt * 1.45) % (Math.PI * 2);
      p.stamina = clamp(p.stamina - (0.85 + speed * 0.2) * dt, 0, 100);
    }
    if (p.hasBall) {
      this.ball.x = p.x + p.fx * 0.6;
      this.ball.y = p.y + p.fy * 0.6;
      this.ball.z = 0;
      this.ball.vx = p.vx;
      this.ball.vy = p.vy;
    }
    // Soft separation so players do not stack.
    for (const other of this.players) {
      if (other.id === p.id || !other.active) continue;
      const sx = p.x - other.x;
      const sy = p.y - other.y;
      const d = Math.hypot(sx, sy);
      if (d > 0.01 && d < 1.5) {
        const push = (1.5 - d) * 0.5;
        p.x += (sx / d) * push;
        p.y += (sy / d) * push;
      }
    }
  }

  private updateBall(dt: number): void {
    const owner = this.players.find((p) => p.id === this.ball.ownerId);
    if (owner?.hasBall) {
      this.ball.vx = owner.vx;
      this.ball.vy = owner.vy;
      return;
    }
    if (this.ball.ownerId !== null) {
      this.ball.ownerId = null;
    }
    this.ball.x += this.ball.vx * dt;
    this.ball.y += this.ball.vy * dt;
    if (this.ball.z > 0 || this.ball.vz !== 0) {
      this.ball.vz -= 11 * dt;
      this.ball.z += this.ball.vz * dt;
      if (this.ball.z < 0) {
        this.ball.z = 0;
        this.ball.vz = Math.abs(this.ball.vz) > 2 ? -this.ball.vz * 0.45 : 0;
      }
    }
    // Exponential damping keeps a struck ball alive for the whole flight.
    // Multiplying by (1 - k·dt) every frame was slowing shots to a crawl
    // long before they reached the goal.
    const drag = this.ball.z > 0.2 ? 0.16 : 0.28;
    const damping = Math.exp(-drag * dt);
    this.ball.vx *= damping;
    this.ball.vy *= damping;
    this.ball.spin *= Math.exp(-0.8 * dt);

    const inGoalMouth = Math.abs(this.ball.y) < GOAL_HALF && this.ball.z < GOAL_HEIGHT;
    if (this.ball.x > PITCH_HALF_L) {
      if (inGoalMouth) {
        this.tryGoal(0);
      } else {
        this.handleGoalLine(0);
      }
      return;
    }
    if (this.ball.x < -PITCH_HALF_L) {
      if (inGoalMouth) {
        this.tryGoal(1);
      } else {
        this.handleGoalLine(1);
      }
      return;
    }
    if (Math.abs(this.ball.y) > PITCH_HALF_W) {
      const team = this.ball.lastTouchTeam === 0 ? 1 : 0;
      this.awardRestart(team, this.ball.x, this.ball.y > 0 ? PITCH_HALF_W - 1 : -PITCH_HALF_W + 1, "throw");
    }
  }

  private tryGoal(attackingTeam: 0 | 1): void {
    const gk = this.players.find((p) => p.active && p.team === this.opponentOf(attackingTeam) && p.isGK);
    const shotBy = this.players.find((p) => p.id === this.ball.shotBy);
    if (gk) {
      const saveChance = clamp(0.3 + gk.attrs.reaction / 400 - Math.abs(gk.y - this.ball.y) * 0.05, 0.06, 0.68);
      if (this.ball.shot && Math.abs(gk.y - this.ball.y) < 4.3 && this.rand() < saveChance) {
        if (shotBy?.isProtagonist) shotBy.stats.shotsOn += 1;
        gk.hasBall = true;
        this.ball.ownerId = gk.id;
        this.ball.shot = false;
        this.ball.x = gk.x;
        this.ball.y = gk.y;
        this.ball.z = 0;
        this.addEvent("save", `Defesa de ${gk.name}!`, gk.team);
        this.phase = "restart";
        this.restartKind = "goalKick";
        this.restartTeam = gk.team;
        this.restartTimer = 1.1;
        return;
      }
    }
    // A pass or deflection can cross the line without a registered shooter.
    // Credit the nearest attacker instead of accidentally crediting the GK.
    const fallback = this.players
      .filter((p) => p.active && p.team === attackingTeam && p.id !== gk?.id)
      .sort((a, b) => this.distance(a, this.ball) - this.distance(b, this.ball))[0];
    const scorer = shotBy ?? fallback ?? gk;
    if (!scorer) return;
    if (scorer.isProtagonist) scorer.stats.shotsOn += 1;
    const assistSource = this.lastPass && this.lastPass.team === attackingTeam && this.realTime - this.lastPass.at < this.noAssistWindow
      ? this.players.find((p) => p.id === this.lastPass?.by)
      : null;
    // Own goals are not scored by defenders here; a shot credited to the attacker.
    this.scoreGoal(attackingTeam, scorer, assistSource && assistSource.id !== scorer.id ? assistSource : null);
  }

  private handleGoalLine(defendingTeam: 0 | 1): void {
    const attackingTeam = this.opponentOf(defendingTeam);
    if (this.ball.lastTouchTeam === attackingTeam) {
      this.awardRestart(defendingTeam, this.ownGoalX(defendingTeam), 0, "goalKick");
    } else {
      const cornerY = this.ball.y >= 0 ? PITCH_HALF_W - 1 : -PITCH_HALF_W + 1;
      this.awardRestart(attackingTeam, this.targetGoalX(attackingTeam) - this.attackingDir(attackingTeam) * 0.5, cornerY, "corner");
    }
  }

  private resolveBallContacts(dt: number): void {
    if (this.ball.ownerId !== null) return;
    if (this.ball.z > 2.8) return;
    const candidates = this.players
      .filter((p) => p.active)
      .map((p) => ({ p, dist: this.distance(p, { x: this.ball.x, y: this.ball.y }) }))
      .filter((x) => x.dist < 2.2)
      .sort((a, b) => a.dist - b.dist);
    if (!candidates.length) return;
    for (const { p, dist } of candidates) {
      if (p.id === this.ball.lastTouchId && this.realTime - this.lastKickAt < 0.55) continue;
      if (p.isGK) {
        const ownGoal = this.ownGoalX(p.team);
        const inBox = Math.abs(this.ball.x - ownGoal) < 17 && Math.abs(this.ball.y) < 21;
        if (inBox && dist < 2.2) {
          const wasShot = this.ball.shot;
          const catchChance = clamp(0.28 + p.attrs.reaction / 450 - this.ball.z * 0.06, 0.12, 0.72);
          // A keeper gets one cumulative reaction per flight, not a fresh 40%
          // chance on every animation frame while the ball crosses the box.
          if (this.rand() < catchChance * Math.min(1, dt * 6 + 0.05)) {
            if (wasShot) {
              const shooter = this.players.find((q) => q.id === this.ball.shotBy);
              if (shooter?.isProtagonist) shooter.stats.shotsOn += 1;
              this.addEvent("save", `${p.name} segura a bola.`, p.team);
            } else {
              this.addEvent("info", `${p.name} controla a bola na área.`, p.team);
            }
            p.hasBall = true;
            this.ball.ownerId = p.id;
            this.ball.shot = false;
            this.ball.z = 0;
            return;
          }
        }
      }
      if (this.ball.shot && !p.isGK) {
        if (!this.shotBlockTried && this.ball.lastTouchTeam !== p.team && dist < 1.6) {
          this.shotBlockTried = true;
          if (this.rand() < 0.4) {
            this.ball.vx *= -0.35;
            this.ball.vy += (this.rand() - 0.5) * 8;
            this.ball.shot = false;
            this.addEvent("info", `${p.name} bloqueia o remate!`, p.team);
            return;
          }
        }
        // A shot in flight cannot be magically trapped by outfield players.
        continue;
      }
      if (p.isProtagonist && this.ball.shot && this.ball.lastTouchTeam !== p.team) {
        p.stats.interceptions += 1;
      }
      const isIntended = this.ball.intendedFor === p.id;
      const controlChance = isIntended
        ? 0.97
        : clamp(0.42 + p.attrs.reaction / 220 - Math.hypot(this.ball.vx, this.ball.vy) / 90, 0.045, 0.9);
      if (this.rand() < controlChance * Math.min(1, dt * 7 + 0.5)) {
        if (p.offsideFlag) {
          p.offsideFlag = false;
          this.awardRestart(this.opponentOf(p.team), p.x, p.y, "free");
          this.addEvent("offside", `Fora de jogo de ${p.name}.`, p.team);
          return;
        }
        this.gainPossession(p);
        return;
      }
    }
  }

  private attemptAiTackles(dt: number): void {
    const owner = this.players.find((p) => p.id === this.ball.ownerId && p.active);
    if (!owner || owner.isGK) return;
    // Only the closest defender commits; otherwise every nearby body becomes a
    // guaranteed tackler and possession never survives long enough to attack.
    const p = this.players
      .filter((q) => q.active && q.team !== owner.team && !q.isGK && q.cooldown <= 0)
      // The user's player only auto-tackles when he is the one carrying the
      // ball and an opponent presses him. Without the ball, the swipe gesture
      // remains the player's own decision.
      .filter((q) => !(q.isProtagonist && !owner.isProtagonist))
      .sort((a, b) => this.distance(a, owner) - this.distance(b, owner))[0];
    if (!p) return;
    const d = this.distance(p, owner);
    if (d > 2.1) return;
    p.cooldown = 0.75 + this.rand() * 0.5;
    const success = clamp(0.2 + (p.attrs.tackling - owner.attrs.dribbling) / 180 + (1 - d / 2.1) * 0.2, 0.04, 0.62);
    if (this.rand() < success * Math.min(0.7, dt * 10 + 0.05)) {
      p.stats.tackles += 1;
      this.gainPossession(p, owner);
      this.addEvent("info", `${p.name} recupera a bola.`, p.team);
      if (owner.isProtagonist) {
        this.feedback = "Perdeste a bola!";
        this.feedbackUntil = this.realTime + 1.2;
      }
      return;
    }
    if (this.rand() < 0.045) {
      p.stats.fouls += 1;
      if (this.rand() < 0.22) {
        p.yellow += 1;
        p.stats.yellow += 1;
        if (p.yellow >= 2) {
          p.stats.red = 1;
          p.red = 1;
          p.active = false;
          this.addEvent("card", `Cartão vermelho por acumulação para ${p.name}.`, p.team);
        } else {
          this.addEvent("card", `Cartão amarelo para ${p.name}.`, p.team);
        }
      }
      this.awardFoulRestart(p.team, owner.x, owner.y);
      this.addEvent("info", `Falta sobre ${owner.name}.`, p.team);
    }
  }

  finishEarly(): void {
    if (this.phase === "fulltime") return;
    const remaining = Math.max(0, 90 - this.minute);
    const chances = Math.round(remaining / 35);
    for (let i = 0; i < chances; i++) {
      const team = this.rand() < 0.5 ? 0 : 1;
      const scorer = this.playersOf(team)
        .filter((x) => !x.isGK)
        .sort((a, b) => b.attrs.finishing - a.attrs.finishing)[0];
      if (scorer) {
        this.score[team] += 1;
        scorer.goals += 1;
        this.addEvent("goal", `⚽ GOLO! ${scorer.name} (simulação) para ${this.setup.teamShort[team]}.`, team);
      }
    }
    this.minute = 90;
    this.phase = "fulltime";
    this.frozen = false;
    this.freezeReason = null;
    this.addEvent("full", `Apito final: ${this.setup.teamShort[0]} ${this.score[0]} - ${this.score[1]} ${this.setup.teamShort[1]}.`);
  }

  hasBallForOverlay(): boolean {
    return this.isProtagonistBall();
  }

  getPassOptions(): { id: number; screen: Vec; distance: number; name: string; number: number }[] {
    const p = this.protagonist;
    return this.players
      .filter((q) => q.active && q.team === p.team && q.id !== p.id)
      .map((q) => ({
        id: q.id,
        screen: this.project(q.x, q.y),
        distance: this.distance(p, q),
        name: q.name,
        number: q.number,
      }))
      .filter((q) => q.distance < 55);
  }

  getGoalScreen(): Vec {
    return this.project(this.targetGoalX(this.protagonist.team), 0);
  }

  onPointerDown(sx: number, sy: number): void {
    this.gestureActive = true;
    this.gestureStart = { x: sx, y: sy };
    this.gestureCurrent = { x: sx, y: sy };
  }

  onPointerMove(sx: number, sy: number): void {
    if (!this.gestureActive) return;
    this.gestureCurrent = { x: sx, y: sy };
  }

  onPointerUp(sx: number, sy: number, duration: number): void {
    if (!this.gestureActive) return;
    this.gestureActive = false;
    const screenDx = sx - this.gestureStart.x;
    const screenDy = sy - this.gestureStart.y;
    const screenDistance = Math.hypot(screenDx, screenDy);
    const world = this.unproject(sx, sy);
    if (this.frozen) {
      if (!this.isProtagonistBall()) return;
      if (screenDistance > 26) {
        const startWorld = this.unproject(this.gestureStart.x, this.gestureStart.y);
        const meterDistance = Math.hypot(world.x - startWorld.x, world.y - startWorld.y);
        const power = clamp(meterDistance / 34, 0.2, 1.3);
        this.shootAt(world, power);
      } else {
        this.tapAt(world);
      }
      return;
    }
    if (screenDistance > 26 && duration < 1.2) {
      this.attemptUserTackle(world);
    }
  }

  private updateCameraIfNeeded(): void {
    this.updateCamera(0.016);
  }

  buildReport(): MatchReport {
    const p = this.protagonist;
    const s = p.stats;
    const playerTeam = p.team;
    const teamGoals = this.score[playerTeam];
    const oppGoals = this.score[this.opponentOf(playerTeam)];
    const resultBonus = teamGoals > oppGoals ? 0.45 : teamGoals === oppGoals ? 0.1 : -0.4;
    const minutes = this.playerSubMinute ?? Math.min(90, Math.max(0, Math.round(this.minute)));
    const base =
      6 +
      p.goals * 1.05 +
      p.assists * 0.65 +
      s.passesCompleted * 0.012 +
      s.tackles * 0.08 +
      s.interceptions * 0.06 +
      s.shotsOn * 0.06 -
      s.fouls * 0.1 -
      s.yellow * 0.18 -
      (s.red > 0 ? 1.8 : 0) +
      resultBonus;
    const rating = clamp(Math.round(base * 10) / 10, 3.2, 10);
    const motm = rating >= 8.2 && teamGoals >= oppGoals;
    const homeName = this.setup.teamName[0];
    const awayName = this.setup.teamName[1];
    return {
      fixtureId: this.setup.fixtureId,
      homeName,
      awayName,
      homeShort: this.setup.teamShort[0],
      awayShort: this.setup.teamShort[1],
      homeGoals: this.score[0],
      awayGoals: this.score[1],
      playerTeam,
      playerPlayed: true,
      playerStarted: true,
      playerMinutes: minutes,
      rating,
      goals: p.goals,
      assists: p.assists,
      motm,
      stats: { ...s },
      events: [...this.events].reverse(),
      possession: this.possessionPercent(),
    };
  }

  setBallImage(img: HTMLImageElement): void {
    this.ballImage = img;
  }

  setSpriteMap(sprites: Map<number, HTMLCanvasElement>): void {
    this.sprites = sprites;
  }

  setSpriteRigs(rigs: Map<number, CharacterRig>): void {
    this.spriteRigs = rigs;
  }

  setAnimationFrames(frames: Map<string, HTMLCanvasElement[]>): void {
    this.animationFrames = frames;
  }

  getPlayerWorldHeight(): number {
    return PLAYER_WORLD_HEIGHT;
  }

  getFeedback(): string {
    if (this.realTime < this.feedbackUntil) return this.feedback;
    return "";
  }

  getInterventionHint(): string {
    if (!this.frozen) return "";
    if (this.freezeReason === "penalty") return "Penálti: arrasta em direção à baliza para rematar.";
    if (this.freezeReason === "restart") return "Reposição: toca num companheiro ou conduz.";
    if (this.freezeReason === "receive") return "Recebeste a bola! Decide o próximo movimento.";
    if (this.freezeReason === "dribble") return "Nova decisão: conduz, passa ou remata.";
    if (this.freezeReason === "kickoff") return "Kickoff. Inicia a jogada.";
    return "";
  }

  private setTargetForPlayer(p: MatchPlayer, x: number, y: number): void {
    p.targetX = x;
    p.targetY = y;
  }

  debugSetViewport(w: number, h: number): void {
    this.setViewportInternal(w, h);
    this.updateCameraIfNeeded();
  }
}

type TeamSide = 0 | 1;
