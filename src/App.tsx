import { useCallback, useEffect, useRef, useState } from "react";
import { Check, RotateCcw, Star, Trophy } from "lucide-react";
import { MainMenu, type GameSettings } from "./screens/MainMenu";
import { PlayerCreator } from "./screens/PlayerCreator";
import { CareerDashboard } from "./screens/CareerDashboard";
import { MatchScreen } from "./screens/MatchScreen";
import {
  advanceWeek,
  createCareer,
  deleteCareer,
  latestCareer,
  loadCareer,
  loadSaveIndex,
  saveCareer,
  type CreateCareerInput,
} from "./game/engine/career";
import { applyMatchResult, quickSimReport } from "./game/engine/matchResult";
import { currentWeekFixtures } from "./game/engine/careerUtils";
import { ACHIEVEMENT_MAP } from "./game/data/achievements";
import { SETTINGS_KEY } from "./game/config";
import { careerKit } from "./game/uiHelpers";
import type { Career, Fixture, SaveSlotMeta } from "./game/types";
import type { MatchReport } from "./game/match/types";
import { Modal, Toast } from "./components/ui";

type Screen = "menu" | "create" | "career" | "match";

const DEFAULT_SETTINGS: GameSettings = { sound: true, haptics: true, reducedMotion: false };

function readSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<GameSettings>;
    return {
      sound: parsed.sound ?? true,
      haptics: parsed.haptics ?? true,
      reducedMotion: parsed.reducedMotion ?? false,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("menu");
  const [career, setCareer] = useState<Career | null>(null);
  const [preview, setPreview] = useState<Career | null>(() => latestCareer());
  const [saves, setSaves] = useState<SaveSlotMeta[]>(() => loadSaveIndex());
  const [settings, setSettings] = useState<GameSettings>(() => readSettings());
  const [activeFixture, setActiveFixture] = useState<Fixture | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [seasonOpen, setSeasonOpen] = useState(false);
  const toastTimer = useRef<number | null>(null);

  const notify = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 3600);
  }, []);

  useEffect(() => () => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
  }, []);

  const refreshSaves = useCallback(() => {
    const next = loadSaveIndex();
    setSaves(next);
    setPreview(latestCareer());
  }, []);

  const commit = useCallback((next: Career, message?: string) => {
    setCareer(next);
    setPreview(next);
    saveCareer(next);
    setSaves(loadSaveIndex());
    if (message) notify(message);
  }, [notify]);

  const changeSettings = useCallback((next: GameSettings) => {
    setSettings(next);
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
    } catch {
      // settings remain in memory even when storage is unavailable
    }
  }, []);

  const startNew = useCallback(() => {
    setScreen("create");
  }, []);

  const createNewCareer = useCallback((input: CreateCareerInput) => {
    try {
      const next = createCareer(input);
      commit(next);
      setActiveFixture(null);
      setReportOpen(false);
      setSeasonOpen(false);
      setScreen("career");
      notify("A tua carreira começou. Bem-vindo ao futebol profissional.");
    } catch (error) {
      console.error(error);
      notify("Não foi possível criar a carreira. Tenta novamente.");
    }
  }, [commit, notify]);

  const continueCareer = useCallback(() => {
    const latest = latestCareer();
    if (!latest) {
      refreshSaves();
      notify("Não encontrámos uma carreira guardada.");
      setScreen("menu");
      return;
    }
    setCareer(latest);
    setPreview(latest);
    setActiveFixture(null);
    setReportOpen(false);
    setSeasonOpen(false);
    setScreen("career");
    notify(`Bem-vindo de volta, ${latest.firstName}.`);
  }, [notify, refreshSaves]);

  const load = useCallback((id: string) => {
    const loaded = loadCareer(id);
    if (!loaded) {
      notify("Não foi possível carregar essa carreira.");
      refreshSaves();
      return;
    }
    setCareer(loaded);
    setPreview(loaded);
    setActiveFixture(null);
    setReportOpen(false);
    setSeasonOpen(false);
    setScreen("career");
    notify("Carreira carregada.");
  }, [notify, refreshSaves]);

  const removeSave = useCallback((id: string) => {
    const remaining = deleteCareer(id);
    setSaves(remaining);
    setPreview(latestCareer());
    if (career?.id === id) setCareer(null);
    notify("Carreira apagada.");
  }, [career, notify]);

  const playMatch = useCallback((fixtureId: string) => {
    if (!career) return;
    if (career.retired) {
      notify("A tua carreira terminou. Consulta o histórico do teu legado.");
      return;
    }
    const fixture = career.fixtures.find((item) => item.id === fixtureId);
    if (!fixture) {
      notify("Partida indisponível.");
      return;
    }
    if (career.injuryWeeks > 0 || career.suspensionWeeks > 0) {
      notify("Não estás disponível para jogar. Avança a semana para recuperares.");
      return;
    }
    setActiveFixture(fixture);
    setScreen("match");
  }, [career, notify]);

  const advance = useCallback((input: Career) => {
    let working = input;
    const pending = working.fixtures.filter((fixture) => !fixture.played && fixture.week <= working.week);
    for (const fixture of pending) {
      const unavailable = working.injuryWeeks > 0 || working.suspensionWeeks > 0 || working.energy <= 8;
      working = applyMatchResult(working, quickSimReport(working, fixture, unavailable));
    }
    const result = advanceWeek(working);
    setCareer(result.career);
    setPreview(result.career);
    saveCareer(result.career);
    setSaves(loadSaveIndex());
    setActiveFixture(null);
    setScreen("career");
    if (result.seasonEnded) {
      setSeasonOpen(true);
    } else if (result.callup) {
      notify("Convocado para a seleção nacional!");
    } else {
      notify(`Semana ${result.career.week} · ${result.career.seasonLabel}`);
    }
    if (result.retired) {
      setTimeout(() => setSeasonOpen(true), 80);
    }
  }, [notify]);

  const finishMatch = useCallback((report: MatchReport) => {
    if (!career) return;
    const next = applyMatchResult(career, report);
    commit(next);
    setActiveFixture(null);
    setScreen("career");
    setReportOpen(true);
  }, [career, commit]);

  const simulateMatch = useCallback((fixtureId: string) => {
    if (!career) return;
    if (career.retired) {
      notify("A tua carreira terminou. Consulta o histórico do teu legado.");
      return;
    }
    const fixture = career.fixtures.find((item) => item.id === fixtureId);
    if (!fixture) {
      notify("Partida indisponível.");
      return;
    }
    const unavailable = career.injuryWeeks > 0 || career.suspensionWeeks > 0;
    const report = quickSimReport(career, fixture, unavailable);
    const next = applyMatchResult(career, report);
    commit(next);
    setReportOpen(true);
  }, [career, commit, notify]);

  const advanceWeekFromDashboard = useCallback(() => {
    if (!career) return;
    if (career.retired) {
      notify("A tua carreira terminou. Consulta o histórico no painel.");
      return;
    }
    advance(career);
  }, [advance, career, notify]);

  const continueFromReport = useCallback(() => {
    setReportOpen(false);
    if (!career) return;
    const remaining = currentWeekFixtures(career);
    if (remaining.length > 0) {
      notify("Ainda há desafios esta semana.");
      return;
    }
    if (!career.retired) advance(career);
  }, [advance, career, notify]);

  const exitToMenu = useCallback(() => {
    if (career) saveCareer(career);
    refreshSaves();
    setActiveFixture(null);
    setReportOpen(false);
    setSeasonOpen(false);
    setScreen("menu");
  }, [career, refreshSaves]);

  const abandonMatch = useCallback(() => {
    setActiveFixture(null);
    setScreen("career");
    notify("Partida abandonada. Nada foi alterado.");
  }, [notify]);

  const report = career?.lastReport ?? null;
  const summary = career?.seasonSummary ?? null;
  const lastSeason = career?.history[career.history.length - 1] ?? null;
  const menuKit = preview ? careerKit(preview) : undefined;

  return (
    <div className={settings.reducedMotion ? "reduce-motion" : undefined}>
      {screen === "menu" ? (
        <MainMenu
          saves={saves}
          latestAppearance={preview?.appearance}
          latestKit={menuKit}
          hasSave={saves.length > 0}
          onContinue={continueCareer}
          onNew={startNew}
          onLoad={load}
          onDeleteSave={removeSave}
          settings={settings}
          onSettingsChange={changeSettings}
        />
      ) : null}

      {screen === "create" ? (
        <PlayerCreator onBack={() => setScreen("menu")} onCreate={createNewCareer} />
      ) : null}

      {screen === "career" && career ? (
        <CareerDashboard
          career={career}
          settings={settings}
          onCareerChange={commit}
          onPlayMatch={playMatch}
          onSimMatch={simulateMatch}
          onAdvanceWeek={advanceWeekFromDashboard}
          onSettingsChange={changeSettings}
          onExit={exitToMenu}
        />
      ) : null}

      {screen === "match" && career && activeFixture ? (
        <MatchScreen
          key={activeFixture.id}
          career={career}
          fixture={activeFixture}
          settings={settings}
          onFinish={finishMatch}
          onAbandon={abandonMatch}
        />
      ) : null}

      <Modal open={reportOpen && !!report} width={560}>
        {report ? (
          <div>
            <div className="kicker" style={{ color: "var(--lime)" }}>Relatório de jogo</div>
            <h2 className="display" style={{ fontSize: "1.8rem", margin: "4px 0 10px" }}>
              {report.homeName} {report.homeGoals} <span style={{ color: "var(--muted-2)" }}>–</span> {report.awayGoals} {report.awayName}
            </h2>
            <div className="report-hero">
              <div
                className="rating-circle"
                style={
                  {
                    "--rating": report.rating,
                    "--rating-color": report.rating >= 7.5 ? "#6ee7a0" : report.rating >= 6 ? "#f5c451" : "#fca5a5",
                  } as React.CSSProperties
                }
              >
                <div className="rc-value">{report.rating.toFixed(1)}</div>
                <div className="rc-label">NOTA</div>
              </div>
              <div className="stack-8" style={{ flex: 1 }}>
                <div className="inline-6" style={{ flexWrap: "wrap" }}>
                  <span className={`chip ${report.goals > 0 ? "chip-lime" : ""}`}>{report.goals} golos</span>
                  <span className="chip">{report.assists} assist.</span>
                  <span className="chip">{report.minutes}′</span>
                  {report.motm ? <span className="chip chip-gold"><Trophy size={10} /> MVP</span> : null}
                  {report.unlocked.length ? <span className="chip chip-gold"><Star size={10} /> {report.unlocked.length} conquista(s)</span> : null}
                </div>
                <div className="small-note">
                  +{report.xpGain} XP · moral {report.moraleChange >= 0 ? "+" : ""}{report.moraleChange}
                </div>
              </div>
            </div>
            <div className="stack-8" style={{ marginTop: 10 }}>
              {report.summary.map((line, index) => (
                <div key={index} style={{ fontSize: "0.8rem", color: "var(--muted)" }}>{line}</div>
              ))}
            </div>
            {report.unlocked.length ? (
              <div className="panel panel-pad" style={{ marginTop: 10 }}>
                <div className="label" style={{ marginBottom: 6 }}>Novas conquistas</div>
                <div className="inline-6" style={{ flexWrap: "wrap" }}>
                  {report.unlocked.map((id) => (
                    <span key={id} className="chip chip-gold">{ACHIEVEMENT_MAP[id]?.title ?? id}</span>
                  ))}
                </div>
              </div>
            ) : null}
            <button type="button" className="btn btn-primary btn-block" style={{ marginTop: 14 }} onClick={continueFromReport}>
              <RotateCcw size={15} /> Continuar carreira
            </button>
            <div className="small-note" style={{ textAlign: "center", marginTop: 6 }}>
              Avança para a próxima semana. A evolução, moral e estatísticas já foram aplicadas.
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal open={seasonOpen && !!career} width={520}>
        {career ? (
          <div style={{ textAlign: "center" }}>
            <div className="kicker" style={{ color: "var(--lime)" }}>
              {career.retired ? "Fim de carreira" : "Fim de época"}
            </div>
            <h2 className="display" style={{ fontSize: "2rem", margin: "6px 0 8px" }}>
              {career.retired ? "Penduraste as chuteiras" : `Época ${summary?.seasonLabel ?? lastSeason?.seasonLabel ?? career.seasonLabel}`}
            </h2>
            {career.retired ? (
              <p className="small-note" style={{ lineHeight: 1.7 }}>
                Uma carreira de {career.history.length} época(s), {career.stats.apps} jogos, {career.stats.goals} golos e {career.stats.assists} assistências.
                O teu nome fica na história.
              </p>
            ) : null}
            <div className="stack-8" style={{ textAlign: "left", marginTop: 12 }}>
              {summary?.lines.map((line, index) => (
                <div key={index} className="report-line"><Check size={13} className="lime-text" /> {line}</div>
              ))}
            </div>
            {summary && (summary.trophies.length || summary.awards.length) ? (
              <div className="inline-6" style={{ flexWrap: "wrap", justifyContent: "center", marginTop: 10 }}>
                {summary.trophies.map((trophy) => <span key={trophy} className="chip chip-gold"><Trophy size={10} /> {trophy}</span>)}
                {summary.awards.map((award) => <span key={award} className="chip chip-lime"><Star size={10} /> {award}</span>)}
              </div>
            ) : null}
            {lastSeason ? (
              <div className="panel panel-pad" style={{ marginTop: 12, textAlign: "left" }}>
                <div className="small-note">{lastSeason.clubName} · {lastSeason.position}.º na {lastSeason.leagueName}</div>
                <div className="inline-6" style={{ flexWrap: "wrap", marginTop: 6 }}>
                  <span className="chip">{lastSeason.apps} jogos</span>
                  <span className="chip">{lastSeason.goals} golos</span>
                  <span className="chip">{lastSeason.assists} assist.</span>
                  <span className="chip chip-gold">OVR {lastSeason.overallStart}→{lastSeason.overallEnd}</span>
                </div>
              </div>
            ) : null}
            {career.pendingTransfer ? (
              <div className="small-note" style={{ marginTop: 10 }}>
                A transferência para o {career.pendingTransfer.clubName} será concluída no início da próxima época.
              </div>
            ) : null}
            <button
              type="button"
              className="btn btn-primary btn-block"
              style={{ marginTop: 14 }}
              onClick={() => {
                setSeasonOpen(false);
                setScreen("career");
              }}
            >
              Continuar
            </button>
          </div>
        ) : null}
      </Modal>

      <Toast message={toast} />
    </div>
  );
}
