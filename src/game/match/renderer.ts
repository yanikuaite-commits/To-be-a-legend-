import { PITCH_HALF_L, PITCH_HALF_W, GOAL_HALF, type MatchEngine, type MatchPlayer } from "./engine";

const SPRITE_W = 256;
const SPRITE_H = 512;
const SPRITE_FEET_Y = 500;
const GOAL_DEPTH = 4.6;
// Deliberately taller than life: the chibi players have oversized heads, and the
// goal needs to read like a real, imposing goal behind them.
const GOAL_FRAME_HEIGHT = 3.6;

type ScreenPoint = { x: number; y: number };

const CROWD: { x: number; y: number; c: string; r: number }[] = [];
(function buildCrowd() {
  let seed = 9137;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const colors = ["#7dd3fc", "#f5c451", "#f8fafc", "#c084fc", "#fda4af", "#a3e635"];
  for (let i = 0; i < 460; i++) {
    const side = Math.floor(rand() * 4);
    let x = 0;
    let y = 0;
    if (side === 0) {
      x = -60 + rand() * 120;
      y = -34 - 3 - rand() * 16;
    } else if (side === 1) {
      x = -60 + rand() * 120;
      y = 34 + 3 + rand() * 16;
    } else if (side === 2) {
      x = -52.5 - 3 - rand() * 16;
      y = -38 + rand() * 76;
    } else {
      x = 52.5 + 3 + rand() * 16;
      y = -38 + rand() * 76;
    }
    CROWD.push({
      x,
      y,
      c: colors[Math.floor(rand() * colors.length)],
      r: 0.25 + rand() * 0.55,
    });
  }
})();

function drawPitch(ctx: CanvasRenderingContext2D, engine: MatchEngine) {
  const cam = engine.camera;
  ctx.save();
  ctx.translate(engine.viewport.w / 2, engine.viewport.h / 2);
  ctx.rotate(cam.rot);
  ctx.scale(cam.scale, cam.scale);
  ctx.translate(-cam.x, -cam.y);

  // Outer stadium floor.
  const bg = ctx.createRadialGradient(0, 0, 10, 0, 0, 120);
  bg.addColorStop(0, "#0a1d2e");
  bg.addColorStop(1, "#040a14");
  ctx.fillStyle = bg;
  ctx.fillRect(-115, -95, 230, 190);

  // Stands blocks.
  ctx.fillStyle = "#0b1a2b";
  ctx.fillRect(-95, -70, 190, 24);
  ctx.fillRect(-95, 46, 190, 24);
  ctx.fillRect(-95, -46, 34, 92);
  ctx.fillRect(61, -46, 34, 92);

  // Crowd.
  for (const dot of CROWD) {
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = dot.c;
    ctx.beginPath();
    ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Advertising boards.
  const adColors = ["#0f3b63", "#f5c451", "#0f3b63", "#e2e8f0"];
  for (let side = 0; side < 4; side++) {
    for (let i = 0; i < 12; i++) {
      ctx.fillStyle = i % 2 === 0 ? adColors[side % adColors.length] : "#081a2d";
      ctx.globalAlpha = 0.75;
      if (side === 0) ctx.fillRect(-52.5 + i * 8.75, -39, 8.2, 1.5);
      if (side === 1) ctx.fillRect(-52.5 + i * 8.75, 37.5, 8.2, 1.5);
      if (side === 2) ctx.fillRect(-57.5, -34 + i * 5.6, 1.5, 5.1);
      if (side === 3) ctx.fillRect(56, -34 + i * 5.6, 1.5, 5.1);
    }
  }
  ctx.globalAlpha = 1;

  // Grass with mowing stripes.
  const stripeW = (PITCH_HALF_L * 2) / 12;
  for (let i = 0; i < 12; i++) {
    ctx.fillStyle = i % 2 === 0 ? "#0d7a4a" : "#0b6b42";
    ctx.fillRect(-PITCH_HALF_L + i * stripeW, -PITCH_HALF_W, stripeW, PITCH_HALF_W * 2);
  }
  // Grass vignette / lighting.
  const glow = ctx.createRadialGradient(0, 0, 5, 0, 0, 75);
  glow.addColorStop(0, "rgba(140, 255, 200, 0.16)");
  glow.addColorStop(0.55, "rgba(14, 80, 55, 0.02)");
  glow.addColorStop(1, "rgba(0, 8, 12, 0.55)");
  ctx.fillStyle = glow;
  ctx.fillRect(-PITCH_HALF_L, -PITCH_HALF_W, PITCH_HALF_L * 2, PITCH_HALF_W * 2);

  // Pitch markings.
  const line = (alpha = 0.78) => {
    ctx.strokeStyle = `rgba(240, 250, 245, ${alpha})`;
    ctx.lineWidth = 0.16;
  };
  line();
  ctx.strokeRect(-PITCH_HALF_L, -PITCH_HALF_W, PITCH_HALF_L * 2, PITCH_HALF_W * 2);
  ctx.beginPath();
  ctx.moveTo(0, -PITCH_HALF_W);
  ctx.lineTo(0, PITCH_HALF_W);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, 9.15, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, 0.45, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(240, 250, 245, 0.8)";
  ctx.fill();

  for (const side of [-1, 1]) {
    const goalX = side * PITCH_HALF_L;
    // Penalty box.
    ctx.strokeRect(
      side === -1 ? goalX : goalX - 16.5,
      -20.16,
      16.5,
      40.32,
    );
    ctx.strokeRect(
      side === -1 ? goalX : goalX - 5.5,
      -9.16,
      5.5,
      18.32,
    );
    ctx.beginPath();
    ctx.arc(side * (PITCH_HALF_L - 11), 0, 0.4, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(240,250,245,0.8)";
    ctx.fill();
    // Arc outside the box.
    ctx.beginPath();
    const start = side === -1 ? -Math.acos(5.5 / 9.15) : Math.PI - Math.acos(5.5 / 9.15);
    ctx.arc(side * (PITCH_HALF_L - 11), 0, 9.15, start, start + Math.acos(5.5 / 9.15) * 2 * (side === -1 ? 1 : 1));
    ctx.stroke();

  }

  // Centre-circle attack arrows, hints of orientation.
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth = 0.14;
  ctx.beginPath();
  ctx.moveTo(-2.4, 0);
  ctx.lineTo(2.4, 0);
  ctx.stroke();
  ctx.restore();
}

function drawGoals(ctx: CanvasRenderingContext2D, engine: MatchEngine): void {
  for (const side of [-1, 1] as const) drawGoalCage(ctx, engine, side);
}

function drawGoalCage(ctx: CanvasRenderingContext2D, engine: MatchEngine, side: -1 | 1): void {
  const { w, h } = engine.viewport;
  const cameraScale = engine.camera.scale;
  const frontX = side * PITCH_HALF_L;
  const backX = frontX + side * GOAL_DEPTH;
  const frontL = engine.project(frontX, -GOAL_HALF);
  const frontR = engine.project(frontX, GOAL_HALF);
  const backL = engine.project(backX, -GOAL_HALF);
  const backR = engine.project(backX, GOAL_HALF);
  const frameHeight = GOAL_FRAME_HEIGHT * cameraScale;
  const topFrontL: ScreenPoint = { x: frontL.x, y: frontL.y - frameHeight };
  const topFrontR: ScreenPoint = { x: frontR.x, y: frontR.y - frameHeight };
  const topBackL: ScreenPoint = { x: backL.x, y: backL.y - frameHeight };
  const topBackR: ScreenPoint = { x: backR.x, y: backR.y - frameHeight };
  const all = [frontL, frontR, backL, backR, topFrontL, topFrontR, topBackL, topBackR];
  const minX = Math.min(...all.map((p) => p.x));
  const maxX = Math.max(...all.map((p) => p.x));
  const minY = Math.min(...all.map((p) => p.y));
  const maxY = Math.max(...all.map((p) => p.y));
  if (maxX < -80 || minX > w + 80 || maxY < -80 || minY > h + 80) return;

  const fillPoly = (points: ScreenPoint[]) => {
    ctx.beginPath();
    points.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.closePath();
    ctx.fill();
  };
  const seg = (a: ScreenPoint, b: ScreenPoint) => {
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  };
  const mix = (a: ScreenPoint, b: ScreenPoint, t: number): ScreenPoint => ({
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
  });

  const frameWidth = clampNumber(cameraScale * 0.16, 1.8, 3.8);
  const netWidth = Math.max(0.6, frameWidth * 0.27);

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Ground shadow and the dark net floor.
  ctx.fillStyle = "rgba(1,7,6,0.34)";
  fillPoly([frontL, frontR, backR, backL]);
  ctx.fillStyle = "rgba(9,24,28,0.28)";
  fillPoly([frontL, frontR, backR, backL]);

  // Back and side net planes give the goal real depth.
  ctx.fillStyle = "rgba(4,16,22,0.3)";
  fillPoly([backL, backR, topBackR, topBackL]);
  ctx.fillStyle = "rgba(4,16,22,0.16)";
  fillPoly([frontL, backL, topBackL, topFrontL]);
  fillPoly([frontR, backR, topBackR, topFrontR]);
  ctx.fillStyle = "rgba(225,244,255,0.035)";
  fillPoly([topFrontL, topFrontR, topBackR, topBackL]);

  // Fine net mesh, subtle enough to keep the keeper visible.
  ctx.strokeStyle = "rgba(225,242,252,0.24)";
  ctx.lineWidth = netWidth;
  for (let i = 1; i < 8; i++) {
    const t = i / 8;
    seg(mix(frontL, frontR, t), mix(backL, backR, t));
    seg(mix(topFrontL, topFrontR, t), mix(topBackL, topBackR, t));
    seg(mix(backL, backR, t), mix(topBackL, topBackR, t));
  }
  for (let i = 1; i < 4; i++) {
    const t = i / 4;
    seg(mix(frontL, backL, t), mix(frontR, backR, t));
    seg(mix(topFrontL, topBackL, t), mix(topFrontR, topBackR, t));
    seg(mix(backL, topBackL, t), mix(backR, topBackR, t));
  }
  for (let i = 1; i < 4; i++) {
    const t = i / 4;
    seg(mix(frontL, topFrontL, t), mix(backL, topBackL, t));
    seg(mix(frontR, topFrontR, t), mix(backR, topBackR, t));
  }
  ctx.strokeStyle = "rgba(226,244,255,0.2)";
  seg(frontL, backL);
  seg(frontR, backR);

  // Light back frame and roof rails.
  ctx.strokeStyle = "rgba(225,242,252,0.4)";
  ctx.lineWidth = Math.max(1, frameWidth * 0.5);
  seg(backL, topBackL);
  seg(backR, topBackR);
  seg(topBackL, topBackR);
  seg(topFrontL, topBackL);
  seg(topFrontR, topBackR);

  // Chunky front frame with a cast shadow, matching the reference goal.
  const shadowOffset = 2.4;
  const shadow = (p: ScreenPoint): ScreenPoint => ({ x: p.x, y: p.y + shadowOffset });
  ctx.strokeStyle = "rgba(1,8,12,0.46)";
  ctx.lineWidth = frameWidth + 3;
  seg(shadow(frontL), shadow(topFrontL));
  seg(shadow(frontR), shadow(topFrontR));
  seg(shadow(topFrontL), shadow(topFrontR));
  seg(shadow(frontL), shadow(frontR));

  ctx.save();
  ctx.shadowColor = "rgba(188,240,255,0.38)";
  ctx.shadowBlur = 8;
  ctx.strokeStyle = "rgba(250,254,255,0.98)";
  ctx.lineWidth = frameWidth;
  seg(frontL, topFrontL);
  seg(frontR, topFrontR);
  seg(topFrontL, topFrontR);
  ctx.lineWidth = frameWidth * 0.78;
  seg(frontL, frontR);
  ctx.restore();

  // Post caps catch the stadium light.
  ctx.fillStyle = "rgba(252,255,255,0.98)";
  for (const point of [frontL, frontR, topFrontL, topFrontR]) {
    ctx.beginPath();
    ctx.arc(point.x, point.y, Math.max(1.4, frameWidth * 0.7), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawSpriteSlice(
  ctx: CanvasRenderingContext2D,
  sprite: HTMLCanvasElement,
  displayScale: number,
  clipX: number,
  clipY: number,
  clipW: number,
  clipH: number,
  pivotX: number,
  pivotY: number,
  angle: number,
  lift = 0,
): void {
  ctx.save();
  const px = pivotX * displayScale;
  const py = (pivotY - SPRITE_FEET_Y) * displayScale;
  ctx.translate(px, py);
  ctx.rotate(angle);
  ctx.translate(-px, -py);
  ctx.translate(0, -lift);
  // Map the 256x512 source canvas into the character's feet space.
  ctx.translate(0, -SPRITE_FEET_Y * displayScale);
  ctx.scale(displayScale, displayScale);
  ctx.beginPath();
  ctx.rect(clipX, clipY, clipW, clipH);
  ctx.clip();
  ctx.drawImage(sprite, 0, 0);
  ctx.restore();
}

function animationForPlayer(
  engine: MatchEngine,
  p: MatchPlayer,
  speed: number,
  screenX: number,
  screenY: number,
  phase: number,
): { frame: HTMLCanvasElement; mirrorX: boolean } | null {
  if (p.slideTimer > 0) return null;
  const mode = speed > 3.2 ? "run" : "walk";
  let sequence: string;
  const mirrorX = false;

  if (Math.abs(screenY) > Math.abs(screenX) * 1.6) {
    if (screenY > 0) {
      sequence = `${mode}_front`;
    } else {
      sequence = mode === "run" ? `run_back_${(p.id % 2) + 1}` : "walk_back";
    }
  } else if (Math.abs(screenX) > Math.abs(screenY) * 1.6) {
    sequence = `${mode}_side_${screenX > 0 ? "right" : "left"}`;
  } else {
    sequence = `${mode}_diagonal_${screenX > 0 ? "right" : "left"}`;
  }

  const frames = engine.animationFrames.get(sequence);
  if (!frames?.length) return null;
  const progress = speed > 0.5
    ? ((phase % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) / (Math.PI * 2)
    : 0;
  const frameIndex = Math.min(frames.length - 1, Math.floor(progress * frames.length));
  return { frame: frames[frameIndex], mirrorX };
}

function drawAnimatedKit(ctx: CanvasRenderingContext2D, p: MatchPlayer): void {
  const jersey = () => {
    ctx.beginPath();
    ctx.moveTo(91, 183);
    ctx.lineTo(165, 183);
    ctx.lineTo(181, 195);
    ctx.lineTo(199, 219);
    ctx.lineTo(184, 239);
    ctx.lineTo(173, 228);
    ctx.lineTo(174, 302);
    ctx.lineTo(164, 313);
    ctx.lineTo(92, 313);
    ctx.lineTo(82, 302);
    ctx.lineTo(83, 228);
    ctx.lineTo(72, 239);
    ctx.lineTo(57, 219);
    ctx.lineTo(75, 195);
    ctx.closePath();
  };

  ctx.save();
  ctx.globalCompositeOperation = "source-atop";
  ctx.fillStyle = p.kit.primary;
  jersey();
  ctx.fill();

  ctx.save();
  jersey();
  ctx.clip();
  ctx.fillStyle = p.kit.secondary;
  if (p.kit.pattern === "stripes") {
    for (let x = 70; x < 190; x += 28) ctx.fillRect(x, 180, 13, 140);
  } else if (p.kit.pattern === "hoops") {
    for (let y = 196; y < 313; y += 30) ctx.fillRect(55, y, 150, 13);
  } else if (p.kit.pattern === "halves") {
    ctx.fillRect(128, 180, 90, 145);
  } else if (p.kit.pattern === "sash") {
    ctx.strokeStyle = p.kit.secondary;
    ctx.lineWidth = 22;
    ctx.beginPath();
    ctx.moveTo(65, 310);
    ctx.lineTo(188, 184);
    ctx.stroke();
  }
  ctx.restore();

  ctx.fillStyle = p.kit.trim;
  ctx.beginPath();
  ctx.moveTo(111, 183);
  ctx.lineTo(128, 207);
  ctx.lineTo(145, 183);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(84, 297);
  ctx.lineTo(173, 297);
  ctx.lineTo(183, 376);
  ctx.lineTo(160, 386);
  ctx.lineTo(132, 378);
  ctx.lineTo(103, 386);
  ctx.lineTo(77, 376);
  ctx.closePath();
  ctx.fillStyle = p.kit.shorts;
  ctx.fill();
  ctx.fillStyle = p.kit.trim;
  ctx.fillRect(126, 300, 5, 78);

  ctx.save();
  ctx.font = '900 29px "Arial Black", Impact, sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(2,8,20,0.65)";
  ctx.strokeText(String(p.number), 128, 259);
  ctx.fillStyle = p.kit.number;
  ctx.fillText(String(p.number), 128, 259);
  ctx.restore();
  ctx.restore();
}

function drawPlayer(
  ctx: CanvasRenderingContext2D,
  engine: MatchEngine,
  p: MatchPlayer,
  time: number,
) {
  const screen = engine.project(p.x, p.y);
  const cam = engine.camera;
  const h = 4.1 * cam.scale;
  const w = h * 0.5;
  const sprite = engine.sprites.get(p.id);
  const rig = engine.spriteRigs.get(p.id);
  const speed = Math.hypot(p.vx, p.vy);
  const moving = speed > 0.5;
  const animTime = engine.paused || engine.frozen ? 0 : time;
  const phase = p.stridePhase + p.id * 1.91;
  const stride = moving ? Math.sin(phase) : 0;
  const gaitBlend = clampNumber((speed - 0.25) / 1.15, 0, 1);
  const runBlend = clampNumber((speed - 3.1) / 1.5, 0, 1);
  const sprintBlend = clampNumber((speed - 5.9) / 1.1, 0, 1);
  const strideAmp = (0.19 + runBlend * 0.16 + sprintBlend * 0.1) * gaitBlend;
  const legSwing = stride * strideAmp;
  const legLiftAmp = cam.scale * (0.14 + runBlend * 0.2 + sprintBlend * 0.14) * gaitBlend;
  const leftLift = moving ? Math.max(0, stride) * legLiftAmp : 0;
  const rightLift = moving ? Math.max(0, -stride) * legLiftAmp : 0;
  const bobAmp = moving
    ? cam.scale * (0.07 + runBlend * 0.08 + sprintBlend * 0.06) * Math.max(0.35, gaitBlend)
    : cam.scale * 0.026;
  const bob = moving
    ? -Math.abs(Math.cos(phase)) * bobAmp
    : Math.sin(animTime * 2.2 + p.id) * bobAmp;
  const bodyLean = moving
    ? (0.018 + runBlend * 0.045 + sprintBlend * 0.035) * Math.max(0.4, gaitBlend) + stride * 0.012
    : Math.sin(animTime * 1.6 + p.id) * 0.008;
  const torsoSway = moving
    ? stride * cam.scale * (0.025 + runBlend * 0.03 + sprintBlend * 0.025) * gaitBlend
    : 0;
  const screenFacing = p.fx * Math.cos(cam.rot) - p.fy * Math.sin(cam.rot);
  const flip = screenFacing < -0.15 ? -1 : screenFacing > 0.15 ? 1 : 1;
  const screenFacingY = p.fx * Math.sin(cam.rot) + p.fy * Math.cos(cam.rot);
  const animated = animationForPlayer(engine, p, speed, screenFacing, screenFacingY, phase);

  // Shadow.
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = "#03150f";
  ctx.beginPath();
  ctx.ellipse(screen.x, screen.y + 1.5, w * 0.44, w * 0.19, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  if (animated) {
    const displayWidth = w;
    ctx.save();
    ctx.translate(screen.x, screen.y + bob);
    ctx.scale(animated.mirrorX ? -1 : 1, 1);
    ctx.translate(-displayWidth / 2, -h * (SPRITE_FEET_Y / SPRITE_H));
    ctx.scale(displayWidth / SPRITE_W, h / SPRITE_H);
    ctx.drawImage(animated.frame, 0, 0);
    drawAnimatedKit(ctx, p);
    ctx.restore();
  } else if (sprite && rig && p.slideTimer <= 0) {
    const heightScale = 1 + (p.appearance.height ?? 0) * 0.035;
    const buildScale = 1 + (p.appearance.build ?? 0) * 0.035;
    const xOffset = (SPRITE_W - SPRITE_W * buildScale) / 2;
    const yOffset = SPRITE_FEET_Y - SPRITE_FEET_Y * heightScale;
    const mapX = (x: number) => xOffset + x * buildScale;
    const mapY = (y: number) => yOffset + y * heightScale;
    const centerX = mapX(rig.centerX);
    const hipY = mapY(rig.hipY);
    const legTop = Math.min(SPRITE_H, mapY(rig.hipY + 40));
    const upperBottom = Math.min(SPRITE_H, mapY(rig.hipY + 55));
    const displayScale = h / SPRITE_H;
    const splitPad = 2;

    ctx.save();
    ctx.translate(screen.x, screen.y + bob);
    ctx.scale(flip, 1);

    // Legs are painted first so the shorts and shirt cover the hip seam.
    drawSpriteSlice(
      ctx, sprite, displayScale,
      0, legTop, centerX + splitPad, SPRITE_H - legTop,
      mapX(rig.hipLX), hipY, -legSwing, leftLift,
    );
    drawSpriteSlice(
      ctx, sprite, displayScale,
      centerX - splitPad, legTop, SPRITE_W - (centerX - splitPad), SPRITE_H - legTop,
      mapX(rig.hipRX), hipY, legSwing, rightLift,
    );
    // Torso, head and arms lean together while the legs scissor underneath.
    ctx.save();
    ctx.translate(torsoSway, 0);
    drawSpriteSlice(
      ctx, sprite, displayScale,
      0, 0, SPRITE_W, upperBottom,
      centerX, hipY, bodyLean,
    );
    ctx.restore();
    ctx.restore();
  } else {
    ctx.save();
    ctx.translate(screen.x, screen.y + bob);
    ctx.scale(flip, 1);
    if (p.slideTimer > 0) ctx.rotate(1.1);
    else ctx.rotate(bodyLean);
    if (sprite) {
      const dh = h;
      const dw = dh * 0.5;
      ctx.drawImage(sprite, -dw / 2, -dh * (SPRITE_FEET_Y / SPRITE_H), dw, dh);
    } else {
      ctx.fillStyle = p.kit.primary;
      ctx.beginPath();
      ctx.roundRect(-w * 0.22, -h * 0.45, w * 0.44, h * 0.4, 4);
      ctx.fill();
      ctx.fillStyle = "#d9895a";
      ctx.beginPath();
      ctx.arc(0, -h * 0.55, w * 0.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Protagonist indicator.
  if (p.isProtagonist) {
    const pulse = 1 + Math.sin(time * 5) * 0.09;
    ctx.save();
    ctx.strokeStyle = engine.frozen ? "#f5c451" : "rgba(182,243,106,0.85)";
    ctx.lineWidth = engine.frozen ? 2.5 : 1.8;
    ctx.beginPath();
    ctx.ellipse(screen.x, screen.y + 1, w * 0.52 * pulse, w * 0.22 * pulse, 0, 0, Math.PI * 2);
    ctx.stroke();
    // Chevron above the head.
    const top = screen.y - h * 0.96 + bob;
    ctx.fillStyle = "#f5c451";
    ctx.beginPath();
    ctx.moveTo(screen.x - 5, top - 9);
    ctx.lineTo(screen.x + 5, top - 9);
    ctx.lineTo(screen.x, top - 2);
    ctx.closePath();
    ctx.fill();
    ctx.font = "700 10px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#f5c451";
    ctx.fillText("TU", screen.x, top - 13);
    ctx.restore();
  } else if (engine.hasTackleOpportunity() && engine.ball.ownerId === p.id) {
    ctx.save();
    ctx.strokeStyle = "rgba(248,113,113,0.8)";
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(screen.x, screen.y + 1, w * 0.5, w * 0.22, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

function drawBall(ctx: CanvasRenderingContext2D, engine: MatchEngine) {
  const ball = engine.ball;
  const ground = engine.project(ball.x, ball.y);
  const lift = ball.z * engine.camera.scale * 0.55;
  const size = Math.max(7, 1.2 * engine.camera.scale);
  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = "#020d0a";
  ctx.beginPath();
  ctx.ellipse(ground.x, ground.y + 1, size * 0.55, size * 0.24, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  if (engine.ballImage) {
    ctx.save();
    ctx.translate(ground.x, ground.y - lift - size * 0.5);
    ctx.rotate((performance.now() / 400) * (Math.abs(ball.vx) + Math.abs(ball.vy) > 2 ? 1 : 0));
    ctx.drawImage(engine.ballImage, -size / 2, -size / 2, size, size);
    ctx.restore();
  } else {
    ctx.fillStyle = "#f8fafc";
    ctx.beginPath();
    ctx.arc(ground.x, ground.y - lift - size / 2, size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#0b1220";
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  if (engine.frozen) {
    ctx.save();
    ctx.strokeStyle = "rgba(245,196,81,0.9)";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(ground.x, ground.y - lift - size / 2, size * 0.8 + Math.sin(performance.now() / 250) * 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

function drawFreezeOverlay(ctx: CanvasRenderingContext2D, engine: MatchEngine, time: number) {
  const { w, h } = engine.viewport;
  const p = engine.project(engine.protagonist.x, engine.protagonist.y);
  const ball = engine.project(engine.ball.x, engine.ball.y);
  const cx = (p.x + ball.x) / 2;
  const cy = (p.y + ball.y) / 2;

  const dim = ctx.createRadialGradient(cx, cy, 40, cx, cy, Math.max(w, h) * 0.72);
  dim.addColorStop(0, "rgba(3, 10, 20, 0.05)");
  dim.addColorStop(0.55, "rgba(3, 10, 20, 0.38)");
  dim.addColorStop(1, "rgba(2, 6, 14, 0.72)");
  ctx.fillStyle = dim;
  ctx.fillRect(0, 0, w, h);

  // Pass options.
  const options = engine.getPassOptions();
  for (const option of options) {
    if (option.distance < 2) continue;
    const c = ctx.createRadialGradient(option.screen.x, option.screen.y, 2, option.screen.x, option.screen.y, 24);
    c.addColorStop(0, "rgba(255,255,255,0.2)");
    c.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(option.screen.x, option.screen.y, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(248,250,252,0.55)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(option.screen.x, option.screen.y, 15, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#f8fafc";
    ctx.font = "700 9px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(String(option.number), option.screen.x, option.screen.y + 3);
  }

  // Highlight the protagonist's action zone.
  ctx.save();
  ctx.strokeStyle = "rgba(245,196,81,0.38)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(p.x, p.y, 34 + Math.sin(time * 3) * 3, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Gesture line.
  if (engine.gestureActive) {
    // The drawn line always starts on the protagonist, even if the finger
    // touched down elsewhere on the pitch.
    const start = engine.project(engine.protagonist.x, engine.protagonist.y);
    const end = engine.gestureCurrent;
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const len = Math.hypot(dx, dy);
    if (len > 6) {
      ctx.save();
      const grad = ctx.createLinearGradient(start.x, start.y, end.x, end.y);
      grad.addColorStop(0, "rgba(245,196,81,0.2)");
      grad.addColorStop(1, "rgba(245,196,81,0.95)");
      ctx.strokeStyle = grad;
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 6]);
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
      const angle = Math.atan2(dy, dx);
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(245,196,81,0.95)";
      ctx.beginPath();
      ctx.moveTo(end.x, end.y);
      ctx.lineTo(end.x - Math.cos(angle - 0.4) * 14, end.y - Math.sin(angle - 0.4) * 14);
      ctx.lineTo(end.x - Math.cos(angle + 0.4) * 14, end.y - Math.sin(angle + 0.4) * 14);
      ctx.closePath();
      ctx.fill();
      // Power meter.
      ctx.fillStyle = "rgba(4,12,22,0.7)";
      ctx.fillRect(end.x + 12, end.y - 6, 62, 8);
      ctx.fillStyle = "#f5c451";
      ctx.fillRect(end.x + 13, end.y - 5, Math.min(60, len * 0.5), 6);
      ctx.restore();
    }
  }

  // Goal target marker when in range.
  const goal = engine.getGoalScreen();
  if (engine.protagonist && engine.hasBallForOverlay()) {
    ctx.save();
    ctx.strokeStyle = "rgba(182,243,106,0.5)";
    ctx.setLineDash([3, 7]);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(goal.x, goal.y);
    ctx.stroke();
    ctx.restore();
    const pulse = 5 + Math.sin(time * 4) * 2;
    ctx.save();
    ctx.strokeStyle = "#b6f36a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(goal.x, goal.y, 12 + pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#b6f36a";
    ctx.font = "700 9px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("GOLO", goal.x, goal.y - 20);
    ctx.restore();
  }
}

export function renderMatch(ctx: CanvasRenderingContext2D, engine: MatchEngine, time: number): void {
  const { w, h } = engine.viewport;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#030914";
  ctx.fillRect(0, 0, w, h);

  drawPitch(ctx, engine);
  drawGoals(ctx, engine);

  const cullMargin = Math.max(120, Math.min(w, h) * 0.25);
  const screenPlayers = engine.players
    .filter((p) => p.active)
    .map((p) => ({ p, screen: engine.project(p.x, p.y) }))
    .filter(({ screen }) =>
      screen.x > -cullMargin && screen.x < w + cullMargin &&
      screen.y > -cullMargin && screen.y < h + cullMargin,
    )
    .sort((a, b) => a.screen.y - b.screen.y);
  for (const { p } of screenPlayers) drawPlayer(ctx, engine, p, time);
  drawBall(ctx, engine);

  // Broadcast-style vignette.
  const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.8);
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(1, "rgba(2,6,14,0.48)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);

  if (engine.frozen) drawFreezeOverlay(ctx, engine, time);

  if (engine.phase === "goal") {
    const flash = ctx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, Math.max(w, h) * 0.7);
    flash.addColorStop(0, "rgba(245,196,81,0.22)");
    flash.addColorStop(1, "rgba(245,196,81,0)");
    ctx.fillStyle = flash;
    ctx.fillRect(0, 0, w, h);
  }

  // Attack direction indicator at the edge.
  const goalScreen = engine.getGoalScreen();
  const outside = goalScreen.x < 20 || goalScreen.x > w - 20 || goalScreen.y < 20 || goalScreen.y > h - 20;
  if (outside) {
    const px = clampNumber(goalScreen.x, 22, w - 22);
    const py = clampNumber(goalScreen.y, 58, h - 54);
    ctx.save();
    ctx.globalAlpha = 0.65;
    ctx.fillStyle = "rgba(182,243,106,0.9)";
    ctx.beginPath();
    ctx.arc(px, py, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#04120c";
    ctx.font = "700 10px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("→", px, py + 1);
    ctx.restore();
  }
}

function clampNumber(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
