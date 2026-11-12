import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { ArrowLeft, CircleStop, Footprints, Pause, Play, RotateCcw, Shield, Sparkles, Trophy, X } from "lucide-react";
import { MatchEngine } from "../game/match/engine";
import { renderMatch } from "../game/match/renderer";
import { buildMatchSetup } from "../game/match/setup";
import type { MatchReport } from "../game/match/types";
import { composeCharacter, composeCharacterSyncFallback, getCharacterRig } from "../game/characters/assets";
import { haptic, sfxGoal, sfxKick, sfxWhistle } from "../game/audio";
import type { Career, Fixture } from "../game/types";
import type { GameSettings } from "./MainMenu";

export function MatchScreen({
  career,
  fixture,
  settings,
  onFinish,
  onAbandon,
}: {
  career: Career;
  fixture: Fixture;
  settings: GameSettings;
  onFinish: (report: MatchReport) => void;
  onAbandon: () => void;
}) {
  const setup = useMemo(() => buildMatchSetup(career, fixture), [career, fixture]);
  const engine = useMemo(() => new MatchEngine(setup), [setup]);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const readyRef = useRef(false);
  const finishedRef = useRef(false);
  const lastScoreRef = useRef(0);
  const lastPhaseRef = useRef(engine.phase);
  const pointerStartRef = useRef(0);

  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hud, setHud] = useState(() => engine.getHud());
  const [paused, setPaused] = useState(false);
  const [finishedReport, setFinishedReport] = useState<MatchReport | null>(null);
  const [feedback, setFeedback] = useState("");

  // Preload every layered sprite plus the ball before kickoff.
  useEffect(() => {
    let cancelled = false;
    readyRef.current = false;
    finishedRef.current = false;
    setReady(false);
    setProgress(0);
    setFinishedReport(null);
    setPaused(false);
    engine.setPaused(false);

    const ball = new Image();
    const ballReady = new Promise<HTMLImageElement>((resolve) => {
      ball.onload = () => resolve(ball);
      ball.onerror = () => resolve(ball);
      ball.src = "/assets/props/ball.png";
    });

    async function preload() {
      let done = 0;
      const total = engine.players.length;
      const entries = await Promise.all(
        engine.players.map(async (player) => {
          let canvas: HTMLCanvasElement;
          const rigPromise = getCharacterRig(player.appearance.baseId);
          try {
            canvas = await composeCharacter(player.appearance, player.kit, player.number);
          } catch {
            canvas = composeCharacterSyncFallback(player.appearance);
          }
          const rig = await rigPromise;
          done += 1;
          if (!cancelled) setProgress(done / total);
          return { id: player.id, canvas, rig };
        }),
      );
      const image = await ballReady;
      if (cancelled) return;
      engine.setSpriteMap(new Map(entries.map((entry) => [entry.id, entry.canvas])));
      engine.setSpriteRigs(new Map(entries.map((entry) => [entry.id, entry.rig])));
      engine.setBallImage(image);
      engine.start();
      readyRef.current = true;
      setReady(true);
      setHud(engine.getHud());
    }

    void preload();
    return () => {
      cancelled = true;
      readyRef.current = false;
    };
  }, [engine]);

  // Canvas sizing at device pixel ratio, engine viewport in CSS pixels.
  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;
    const resize = () => {
      const rect = root.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = Math.max(320, Math.floor(rect.width));
      const h = Math.max(360, Math.floor(rect.height));
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      engine.setViewport(w, h);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(root);
    window.addEventListener("orientationchange", resize);
    return () => {
      observer.disconnect();
      window.removeEventListener("orientationchange", resize);
    };
  }, [engine]);

  // Game loop.
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let hudClock = 0;
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (readyRef.current) engine.update(dt);
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (ctx && readyRef.current) renderMatch(ctx, engine, now / 1000);

      hudClock += dt;
      if (hudClock > 0.09) {
        hudClock = 0;
        const nextHud = engine.getHud();
        setHud(nextHud);
        setFeedback(engine.getFeedback());
      }

      const totalScore = engine.score[0] + engine.score[1];
      if (totalScore > lastScoreRef.current) {
        lastScoreRef.current = totalScore;
        if (settings.sound) sfxGoal();
        if (settings.haptics) haptic([16, 40, 30]);
      }
      const phase = engine.phase;
      if (phase !== lastPhaseRef.current) {
        if (phase === "halftime" || phase === "fulltime") {
          if (settings.sound) sfxWhistle();
          if (settings.haptics) haptic(phase === "fulltime" ? [20, 60, 20] : 12);
        }
        lastPhaseRef.current = phase;
      }
      if (engine.phase === "fulltime" && !finishedRef.current) {
        finishedRef.current = true;
        setFinishedReport(engine.buildReport());
      }
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [engine, settings.sound, settings.haptics]);

  function toCanvas(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function pauseMatch() {
    engine.setPaused(true);
    setPaused(true);
  }

  function resumeMatch() {
    engine.setPaused(false);
    setPaused(false);
  }

  function finishNow() {
    engine.setPaused(false);
    engine.finishEarly();
    setPaused(false);
    finishedRef.current = false;
    if (settings.sound) sfxWhistle();
  }

  const playerTeam = setup.playerTeam;
  const interventionHint = engine.getInterventionHint();
  const passOptions = engine.getPassOptions().slice(0, 3);
  const ftPlayerScore = finishedReport ? finishedReport[playerTeam === 0 ? "homeGoals" : "awayGoals"] : 0;
  const ftOppScore = finishedReport ? finishedReport[playerTeam === 0 ? "awayGoals" : "homeGoals"] : 0;
  const ftResult = ftPlayerScore > ftOppScore ? "Vitória" : ftPlayerScore === ftOppScore ? "Empate" : "Derrota";
  const ratingColor = finishedReport
    ? finishedReport.rating >= 7.5
      ? "#6ee7a0"
      : finishedReport.rating >= 6
        ? "#f5c451"
        : "#fca5a5"
    : "#f5c451";

  return (
    <div className="match-root" ref={rootRef}>
      <canvas
        ref={canvasRef}
        className="match-canvas"
        onPointerDown={(e) => {
          e.preventDefault();
          try {
            e.currentTarget.setPointerCapture(e.pointerId);
          } catch {
            // Pointer capture is best-effort on older Android WebViews.
          }
          pointerStartRef.current = performance.now();
          const point = toCanvas(e);
          engine.onPointerDown(point.x, point.y);
        }}
        onPointerMove={(e) => {
          const point = toCanvas(e);
          engine.onPointerMove(point.x, point.y);
        }}
        onPointerUp={(e) => {
          if (!readyRef.current || finishedRef.current) return;
          const point = toCanvas(e);
          const duration = (performance.now() - pointerStartRef.current) / 1000;
          const wasFrozen = engine.frozen;
          engine.onPointerUp(point.x, point.y, duration);
          if (wasFrozen && !engine.frozen && settings.sound) sfxKick();
          if (wasFrozen && !engine.frozen && settings.haptics) haptic(8);
        }}
        aria-label="Campo de futebol"
      />

      <div className="match-hud">
        <div className="scorebar">
          <div className="sb-team">
            <span className="sb-color" style={{ background: hud.homeKit.primary }} />
            <span className="sb-short">{hud.homeShort}</span>
          </div>
          <div className="sb-score">
            <span className="digits">{hud.homeScore}</span>
            <span style={{ color: "var(--muted-2)" }}>–</span>
            <span className="digits">{hud.awayScore}</span>
          </div>
          <div className="sb-clock">
            <span className={`sb-min ${hud.phase === "play" ? "live" : ""}`}>{hud.minute}′</span>
            <span className="sb-sub">{hud.phase === "halftime" ? "Intervalo" : hud.phase === "fulltime" ? "Final" : hud.phase === "goal" ? "Golo" : "1ª / 2ª"}</span>
          </div>
          <div className="sb-team right">
            <span className="sb-short">{hud.awayShort}</span>
            <span className="sb-color" style={{ background: hud.awayKit.primary }} />
          </div>
        </div>

        <div className="match-top-right">
          <button
            type="button"
            className="match-btn"
            aria-label="Pausa"
            onClick={() => {
              if (finishedReport) return;
              pauseMatch();
            }}
            disabled={!!finishedReport}
          >
            <Pause size={15} />
          </button>
        </div>

        <div className="player-hud">
          <span className="ph-num">{hud.playerNumber}</span>
          <div className="ph-info">
            <div className="ph-name">{hud.playerName}</div>
            <div className="ph-meta">
              <span className="rating-pill">{hud.playerRating.toFixed(1)}</span>
              <span className="stamina-mini"><span style={{ width: `${hud.playerStamina}%`, background: hud.playerStamina < 35 ? "#fca5a5" : "#b6f36a" }} /></span>
              {hud.playerGoals > 0 ? <span className="sb-sub" style={{ color: "var(--gold)" }}>{hud.playerGoals}G</span> : null}
              {hud.playerAssists > 0 ? <span className="sb-sub" style={{ color: "var(--lime)" }}>{hud.playerAssists}A</span> : null}
            </div>
          </div>
        </div>

        <div className="match-ticker">{feedback || hud.eventText}</div>

        <div className="match-spacer" />

        {hud.tackleOpportunity && !hud.frozen ? (
          <div className="tackle-prompt">
            <Footprints size={14} /> Desliza o dedo na direção do adversário com bola
          </div>
        ) : null}

        {hud.frozen && hud.hasBall ? (
          <div className="intervention">
            <div className="intervention-head">
              <div>
                <div className="ih-title">Decisão</div>
                <div className="ih-sub">{interventionHint || "Tens a bola. Escolhe o próximo movimento."}</div>
              </div>
              <span className="chip chip-gold" style={{ fontSize: "0.55rem" }}><Sparkles size={10} /> {hud.minute}′</span>
            </div>
            <div className="action-chips">
              <span className="action-chip">Toca no campo <b>conduzir</b></span>
              <span className="action-chip">Toca colega <b>passe</b></span>
              <span className="action-chip">Duplo toque <b>aéreo</b></span>
              <span className="action-chip">Arrasta <b>remate</b></span>
            </div>
            {passOptions.length ? (
              <div className="action-chips" style={{ marginTop: 4 }}>
                {passOptions.map((option) => (
                  <span className="action-chip" key={option.id}>
                    <b>#{option.number}</b> {option.name.split(" ")[0]} · {Math.round(option.distance)}m
                  </span>
                ))}
              </div>
            ) : null}
            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
              <button type="button" className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => engine.releaseAI()}>
                <Play size={13} /> Deixar a IA decidir
              </button>
            </div>
          </div>
        ) : null}

        {hud.frozen && !hud.hasBall ? (
          <div className="tackle-prompt" style={{ background: "rgba(245,196,81,0.12)", borderColor: "rgba(245,196,81,0.4)", color: "var(--gold-soft)" }}>
            <Sparkles size={13} /> Decide rápido: toca no campo para te posicionares ou desliza para desarmar.
          </div>
        ) : null}

        <div className="match-bottom">
          <div className="control-hint">
            <span><Footprints size={12} /> Toca: conduzir</span>
            <span><Shield size={12} /> Sem bola: desliza para desarmar</span>
            <span><Trophy size={12} /> {hud.competitionName}</span>
          </div>
        </div>
      </div>

      {hud.phase === "goal" && hud.lastEventType === "goal" ? (
        <div className="goal-banner">
          <div className="gb-goal">Golo</div>
          <div className="gb-team">{hud.eventText}</div>
        </div>
      ) : null}

      {!ready ? (
        <div className="loading-overlay">
          <div className="loading-card">
            <div className="spinner" />
            <div className="display" style={{ fontSize: "1.4rem" }}>A preparar o relvado</div>
            <p className="small-note" style={{ marginTop: 6 }}>A carregar personagens e equipamentos… {Math.round(progress * 100)}%</p>
            <div style={{ width: 180, margin: "12px auto 0" }} className="bar bar-gold">
              <span style={{ width: `${progress * 100}%` }} />
            </div>
          </div>
        </div>
      ) : null}

      {paused && !finishedReport ? (
        <div className="pause-overlay">
          <div className="pause-card">
            <div className="kicker">Jogo em pausa</div>
            <h2 className="display" style={{ fontSize: "1.7rem", margin: "4px 0 8px" }}>
              {hud.homeShort} {hud.homeScore} – {hud.awayScore} {hud.awayShort}
            </h2>
            <p className="small-note" style={{ marginBottom: 14 }}>
              {hud.minute}′ · {hud.competitionName}. A partida espera por ti. Podes continuar, terminar já ou sair.
            </p>
            <div className="stack-8">
              <button type="button" className="btn btn-primary btn-block" onClick={resumeMatch}>
                <Play size={15} /> Retomar
              </button>
              <button type="button" className="btn btn-ghost btn-block" onClick={finishNow}>
                <CircleStop size={15} /> Terminar jogo (simular resto)
              </button>
              <button type="button" className="btn btn-danger btn-block" onClick={onAbandon}>
                <ArrowLeft size={15} /> Abandonar partida
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {finishedReport ? (
        <div className="pause-overlay">
          <div className="pause-card" style={{ width: "min(560px, 100%)", textAlign: "left" }}>
            <div style={{ textAlign: "center" }}>
              <div className="kicker">Apito final · {hud.competitionName}</div>
              <div className="ft-score">
                <div className="ft-team">
                  <div className="ft-n">{finishedReport.homeShort}</div>
                  <div className="ft-s">{finishedReport.homeGoals}</div>
                </div>
                <div className="ft-vs">—</div>
                <div className="ft-team">
                  <div className="ft-n">{finishedReport.awayShort}</div>
                  <div className="ft-s">{finishedReport.awayGoals}</div>
                </div>
              </div>
              <div className="ft-tags">
                <span className={`chip ${ftResult === "Vitória" ? "chip-lime" : ftResult === "Derrota" ? "chip-red" : "chip-gold"}`}>{ftResult}</span>
                {finishedReport.motm ? <span className="chip chip-gold"><Trophy size={10} /> MVP</span> : null}
                <span className="chip">{finishedReport.playerMinutes}′</span>
              </div>
              <div
                className="rating-circle"
                style={{ "--rating": finishedReport.rating, "--rating-color": ratingColor } as CSSProperties}
              >
                <div className="rc-value" style={{ color: ratingColor }}>{finishedReport.rating.toFixed(1)}</div>
                <div className="rc-label">NOTA</div>
              </div>
              <div className="ft-tags">
                <span className="chip chip-lime">{finishedReport.goals} golos</span>
                <span className="chip">{finishedReport.assists} assist.</span>
                <span className="chip">{finishedReport.stats.passesCompleted}/{finishedReport.stats.passes} passes</span>
                <span className="chip">{finishedReport.stats.tackles} desarmes</span>
              </div>
            </div>
            <div style={{ maxHeight: 150, overflow: "auto", margin: "4px 0 12px" }}>
              {finishedReport.events
                .filter((event) => event.type === "goal" || event.type === "card" || event.type === "full")
                .slice(0, 8)
                .map((event, index) => (
                  <div className="ft-event" key={`${event.minute}-${index}`}>
                    <b className="gold-text">{event.minute}′</b> {event.text}
                  </div>
                ))}
            </div>
            <button type="button" className="btn btn-primary btn-block" onClick={() => onFinish(finishedReport)}>
              <RotateCcw size={15} /> Continuar carreira
            </button>
            <div className="small-note" style={{ textAlign: "center", marginTop: 6 }}>
              O resultado, a nota e a evolução serão aplicados ao teu percurso.
            </div>
          </div>
        </div>
      ) : null}

      {finishedReport ? null : (
        <button type="button" className="match-quit" aria-label="Sair" onClick={onAbandon}>
          <X size={13} />
        </button>
      )}

    </div>
  );
}
