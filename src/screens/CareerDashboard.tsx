import { useMemo, useState } from "react";
import {
  ArrowRightLeft,
  BarChart3,
  CalendarDays,
  Check,
  ChevronRight,
  CirclePlay,
  Clock,
  Coins,
  Dumbbell,
  FileSignature,
  Flag,
  History,
  Home,
  Newspaper,
  Play,
  Settings as SettingsIcon,
  Shield,
  Sparkles,
  TrendingUp,
  Trophy,
  UserRound,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { getClub, LEAGUE_MAP } from "../game/data/clubs";
import { currentWeekFixtures, nextFixture, playerLeague } from "../game/engine/careerUtils";
import { standings } from "../game/engine/league";
import { formatMoney } from "../game/engine/rng";
import { ACHIEVEMENTS } from "../game/data/achievements";
import type { Career } from "../game/types";
import {
  careerDate,
  careerKit,
  conditionLabel,
  moraleLabel,
  nationality,
  playerMarketValue,
  playerStatus,
} from "../game/uiHelpers";
import { CharacterImage } from "../components/CharacterArt";
import { Crest, MeterBar, MiniStat, OvrRing, Sheet } from "../components/ui";
import { PlayerPanel } from "../panels/PlayerPanel";
import { TrainingPanel } from "../panels/TrainingPanel";
import { EvolutionPanel } from "../panels/EvolutionPanel";
import { StatsPanel } from "../panels/StatsPanel";
import { CalendarPanel } from "../panels/CalendarPanel";
import type { GameSettings } from "./MainMenu";
import { TransferPanel } from "../panels/TransferPanel";
import { ContractPanel } from "../panels/ContractPanel";
import { AchievementsPanel } from "../panels/AchievementsPanel";
import { NewsPanel } from "../panels/NewsPanel";
import { NationalPanel } from "../panels/NationalPanel";
import { HistoryPanel } from "../panels/HistoryPanel";

type PanelKey =
  | "player" | "training" | "evolution" | "stats" | "calendar" | "transfers"
  | "contract" | "achievements" | "news" | "national" | "history";

const PANEL_META: Record<PanelKey, { title: string; subtitle: string; icon: LucideIcon }> = {
  player: { title: "Meu Jogador", subtitle: "Perfil, atributos e estatuto", icon: UserRound },
  training: { title: "Treino", subtitle: "Plano semanal e recuperação", icon: Dumbbell },
  evolution: { title: "Evolução", subtitle: "Atributos e especializações", icon: TrendingUp },
  stats: { title: "Estatísticas", subtitle: "Época, carreira e competições", icon: BarChart3 },
  calendar: { title: "Calendário", subtitle: "Jogos, classificação e taças", icon: CalendarDays },
  transfers: { title: "Transferências", subtitle: "Propostas e mercado", icon: ArrowRightLeft },
  contract: { title: "Contrato", subtitle: "Salário, cláusulas e renovação", icon: FileSignature },
  achievements: { title: "Conquistas", subtitle: "O teu legado em troféus", icon: Trophy },
  news: { title: "Notícias", subtitle: "A imprensa e a tua carreira", icon: Newspaper },
  national: { title: "Seleção Nacional", subtitle: "Convocações e internacionalizações", icon: Flag },
  history: { title: "Histórico da Carreira", subtitle: "Época a época", icon: History },
};

export function CareerDashboard({
  career,
  settings,
  onCareerChange,
  onPlayMatch,
  onSimMatch,
  onAdvanceWeek,
  onSettingsChange,
  onExit,
}: {
  career: Career;
  settings: GameSettings;
  onCareerChange: (career: Career, message?: string) => void;
  onPlayMatch: (fixtureId: string) => void;
  onSimMatch: (fixtureId: string) => void;
  onAdvanceWeek: () => void;
  onSettingsChange: (settings: GameSettings) => void;
  onExit: () => void;
}) {
  const [openPanel, setOpenPanel] = useState<PanelKey | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const club = getClub(career.clubId);
  const kit = careerKit(career);
  const nat = nationality(career.nationality);
  const league = playerLeague(career);
  const next = nextFixture(career);
  const current = currentWeekFixtures(career)[0] ?? null;
  const healthy = career.injuryWeeks === 0 && career.suspensionWeeks === 0;
  const status = playerStatus(career);
  const unreadNews = career.news.filter((n) => !n.read).length;
  const trained = career.training?.week === career.week && career.training.done;
  const leagueMeta = LEAGUE_MAP[career.seasonLeagueId];
  const position = useMemo(() => {
    if (!league) return career.positionInLeague;
    return standings(league).findIndex((row) => row.clubId === career.clubId) + 1;
  }, [league, career.clubId, career.positionInLeague]);
  const displayFixture = current ?? next;
  const isNational = displayFixture?.competition === "national" || displayFixture?.competition === "worldcup";
  const playerTeamName = isNational ? nat.name : club.short;
  const playerTeamOverall = isNational ? Math.round(74 + career.overall * 0.16) : club.overall;
  const opponentName = displayFixture?.opponentShort ?? "";
  const playerHome = displayFixture?.home ?? true;
  const today = careerDate(career);
  const winRate = career.stats.apps ? Math.round((career.stats.goals / career.stats.apps) * 100) : 0;

  const tiles: {
    key: PanelKey; icon: LucideIcon; title: string; value: string; badge?: string; feature?: boolean;
  }[] = [
    { key: "player", icon: UserRound, title: "Meu Jogador", value: `${career.overall} OVR · ${career.age} anos` },
    { key: "training", icon: Dumbbell, title: "Treino", value: trained ? "Sessão concluída" : "Plano por realizar", badge: trained ? undefined : "!", feature: !trained },
    { key: "evolution", icon: TrendingUp, title: "Evolução", value: `${career.evoPoints} pontos disponíveis`, badge: career.evoPoints > 0 ? String(career.evoPoints) : undefined },
    { key: "stats", icon: BarChart3, title: "Estatísticas", value: `${career.seasonStats.apps} jogos · ${career.seasonStats.goals} golos` },
    { key: "calendar", icon: CalendarDays, title: "Calendário", value: position ? `${position}.º na ${leagueMeta?.name ?? "liga"}` : "Época em curso" },
    { key: "transfers", icon: ArrowRightLeft, title: "Transferências", value: career.pendingTransfer ? `Acordo: ${career.pendingTransfer.clubShort}` : `${career.offers.length} propostas`, badge: career.offers.length ? String(career.offers.length) : undefined },
    { key: "contract", icon: FileSignature, title: "Contrato", value: `${career.contract.years} ano(s) · ${career.contract.role}` },
    { key: "achievements", icon: Trophy, title: "Conquistas", value: `${career.achievements.length}/${ACHIEVEMENTS.length} desbloqueadas` },
    { key: "news", icon: Newspaper, title: "Notícias", value: unreadNews ? `${unreadNews} por ler` : "Tudo em dia", badge: unreadNews ? String(unreadNews) : undefined },
    { key: "national", icon: Flag, title: "Seleção Nacional", value: career.national.calledUp ? `${nat.flag} Convocado` : `${nat.flag} Sem convocatória` },
    { key: "history", icon: History, title: "Histórico", value: `${career.history.length} época(s) concluída(s)` },
  ];

  return (
    <div className="app-shell dash-shell">
      <header className="topbar">
        <button type="button" className="topbar-logo" onClick={onExit} aria-label="Menu principal">
          <span className="brand-ball" />
          <span className="tbl">TO BE A <span>LEGEND</span></span>
        </button>
        <div className="topbar-meta">
          <span className="dash-date"><CalendarDays size={13} /> {today} · S{career.week} · {career.seasonLabel}</span>
          <span className="coin-pill"><Coins size={13} /> {career.coins.toLocaleString("pt-PT")}</span>
          <span className="evo-pill"><Sparkles size={13} /> {career.evoPoints}</span>
          <button type="button" className="icon-btn-plain" onClick={() => setSettingsOpen(true)} aria-label="Definições">
            <SettingsIcon size={15} />
          </button>
          <button type="button" className="icon-btn-plain" onClick={onExit} aria-label="Sair ao menu">
            <Home size={15} />
          </button>
        </div>
      </header>

      {career.retired ? (
        <div className="panel panel-pad" style={{ marginBottom: 12, borderColor: "rgba(245,196,81,0.45)", textAlign: "center" }}>
          <Trophy size={22} className="gold-text" style={{ margin: "0 auto 4px" }} />
          <div className="display" style={{ fontSize: "1.3rem" }}>Carreira terminada</div>
          <div className="small-note">Aos {career.age} anos penduraste as chuteiras. Consulta o histórico para rever o teu legado.</div>
        </div>
      ) : null}

      <section className="hero">
        <div className="hero-portrait">
          <span className="shirt-badge"><Crest clubId={career.clubId} size="sm" /></span>
          <CharacterImage
            appearance={career.appearance}
            kit={kit}
            number={career.shirtNumber}
            mode="full"
            alt={`${career.firstName} ${career.lastName}`}
          />
        </div>
        <div className="hero-info">
          <div className="hero-name-row">
            <div style={{ minWidth: 0 }}>
              <div className="kicker">{career.position} · {nat.flag} {nat.name} · {career.age} anos</div>
              <h1 className="hero-name">
                {career.firstName} <br />
                {career.lastName} <span className="num">#{career.shirtNumber}</span>
              </h1>
              <div className="hero-sub">
                <span className="hero-club"><Crest clubId={career.clubId} size="sm" /> {club.name}</span>
                <span>· {leagueMeta?.name}</span>
                {career.captain ? <span className="chip chip-gold" style={{ fontSize: "0.55rem" }}><Shield size={10} /> Capitão</span> : null}
                <span className={`chip ${status.tone === "lime" ? "chip-lime" : status.tone === "gold" ? "chip-gold" : status.tone === "red" ? "chip-red" : ""}`} style={{ fontSize: "0.55rem" }}>
                  {status.label}
                </span>
              </div>
            </div>
            <OvrRing value={career.overall} />
          </div>

          <div className="hero-stats">
            <MiniStat label="Moral" value={moraleLabel(career.morale)} />
            <MiniStat label="Energia" value={conditionLabel(career.energy)} />
            <MiniStat label="Valor" value={formatMoney(playerMarketValue(career))} />
            <MiniStat label="Salário" value={`${formatMoney(career.contract.salary)}/sem`} />
          </div>

          <div className="bars-row">
            <div className="bar-block">
              <div className="bb-top"><span className="bb-label">Moral</span><span className="bb-value">{career.morale}</span></div>
              <MeterBar value={career.morale} color="lime" />
            </div>
            <div className="bar-block">
              <div className="bb-top"><span className="bb-label">Energia</span><span className="bb-value">{career.energy}</span></div>
              <MeterBar value={career.energy} color={career.energy > 45 ? "gold" : "red"} />
            </div>
            <div className="bar-block">
              <div className="bb-top"><span className="bb-label">Forma</span><span className="bb-value">{career.form}</span></div>
              <MeterBar value={career.form} color="blue" />
            </div>
            <div className="bar-block">
              <div className="bb-top"><span className="bb-label">Reputação</span><span className="bb-value">{Math.round(career.reputation)}</span></div>
              <MeterBar value={career.reputation} color="gold" />
            </div>
          </div>
        </div>
      </section>

      <div className="dash-quick-row">
        <button type="button" className="quick-pill" onClick={() => setOpenPanel("training")}>
          <Dumbbell size={14} /> {trained ? "Treino feito" : <>Treino <b>pendente</b></>}
        </button>
        <button type="button" className="quick-pill" onClick={() => setOpenPanel("evolution")}>
          <Sparkles size={14} /> <b>{career.evoPoints}</b> pontos evolução
        </button>
        <button type="button" className="quick-pill" onClick={() => setOpenPanel("transfers")}>
          <ArrowRightLeft size={14} /> <b>{career.offers.length}</b> propostas
        </button>
        <button type="button" className="quick-pill" onClick={() => setOpenPanel("news")}>
          <Newspaper size={14} /> <b>{unreadNews}</b> por ler
        </button>
        <span className="quick-pill saved"><Check size={13} /> Guardado</span>
      </div>

      <div className="section-head">
        <h2>Próximo Jogo</h2>
        <button type="button" className="link" onClick={() => setOpenPanel("calendar")}>Calendário <ChevronRight size={12} /></button>
      </div>

      {displayFixture ? (
        <div className="next-match">
          <div>
            <div className="kicker" style={{ color: "var(--lime)" }}>{displayFixture.competitionName} · Semana {displayFixture.week}</div>
            <div className="matchup" style={{ marginTop: 8 }}>
              <div className="match-team">
                <TeamMark clubId={playerHome ? (isNational ? `nat-${career.nationality}` : career.clubId) : displayFixture.opponentId} label={playerHome ? playerTeamName : opponentName} />
                <div>
                  <div className="name">{playerHome ? playerTeamName : opponentName}</div>
                  <div className="sub">{playerHome ? `${playerTeamOverall} OVR · Casa` : `${displayFixture.opponentOverall} OVR`}</div>
                </div>
              </div>
              <div className="match-vs">VS</div>
              <div className="match-team">
                <TeamMark clubId={playerHome ? displayFixture.opponentId : (isNational ? `nat-${career.nationality}` : career.clubId)} label={playerHome ? opponentName : playerTeamName} />
                <div>
                  <div className="name">{playerHome ? opponentName : playerTeamName}</div>
                  <div className="sub">{playerHome ? `${displayFixture.opponentOverall} OVR` : `${playerTeamOverall} OVR · Casa`}</div>
                </div>
              </div>
            </div>
            <div className="next-meta">
              <span className="chip chip-gold">{displayFixture.home ? "Em casa" : "Fora"}</span>
              <span className="chip">{displayFixture.competitionName}</span>
              <span className="chip"><Clock size={10} /> S{displayFixture.week} · {career.seasonLabel}</span>
              {!healthy ? <span className="chip chip-red">{status.label}</span> : null}
              {current && healthy ? <span className="chip chip-lime">Disponível para jogar</span> : null}
            </div>
          </div>
          <div className="next-actions">
            {current && healthy && !career.retired ? (
              <>
                <button type="button" className="btn btn-primary" onClick={() => onPlayMatch(current.id)}>
                  <Play size={15} fill="currentColor" /> Jogar partida
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => onSimMatch(current.id)}>
                  <Zap size={15} /> Simular
                </button>
              </>
            ) : (
              <button type="button" className="btn btn-primary" disabled={career.retired} onClick={onAdvanceWeek}>
                <CirclePlay size={15} /> {current ? "Avançar semana" : "Continuar semana"}
              </button>
            )}
            {!current && next && next.week > career.week && !career.retired ? (
              <button type="button" className="btn btn-ghost" onClick={onAdvanceWeek}>
                <Clock size={15} /> Próximo jogo S{next.week}
              </button>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="next-match">
          <div>
            <div className="kicker">Época {career.seasonLabel}</div>
            <div className="display" style={{ fontSize: "1.4rem", marginTop: 4 }}>Sem jogos marcados</div>
            <div className="small-note" style={{ marginTop: 4 }}>Avança a semana para continuares a tua carreira.</div>
          </div>
          <div className="next-actions">
            <button type="button" className="btn btn-primary" disabled={career.retired} onClick={onAdvanceWeek}>
              <CirclePlay size={15} /> Avançar semana
            </button>
          </div>
        </div>
      )}

      {career.lastReport ? (
        <div className="panel panel-pad" style={{ marginTop: 10 }}>
          <div className="row-between">
            <div className="inline-6">
              <Trophy size={14} className="gold-text" />
              <span className="label">Último resultado</span>
            </div>
            <span className="chip chip-gold">Nota {career.lastReport.rating.toFixed(1)}</span>
          </div>
          <div style={{ fontSize: "0.8rem", marginTop: 4 }}>
            {career.lastReport.homeName} {career.lastReport.homeGoals} - {career.lastReport.awayGoals} {career.lastReport.awayName}
          </div>
          <div className="small-note">{career.lastReport.summary[1] ?? career.lastReport.summary[0]}</div>
        </div>
      ) : null}

      <div className="section-head">
        <h2>Centro de Carreira</h2>
        <span className="small-note">Época {career.seasonLabel} · {career.week}/{career.totalWeeks} semanas</span>
      </div>

      <div className="card-grid">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <button
              key={tile.key}
              type="button"
              className={`tile ${tile.feature ? "tile-feature" : ""}`}
              onClick={() => setOpenPanel(tile.key)}
            >
              <div className="row-between" style={{ alignItems: "flex-start" }}>
                <div className="tile-icon"><Icon size={16} /></div>
                {tile.badge ? <span className="tile-badge">{tile.badge}</span> : null}
              </div>
              <div>
                <div className="tile-title">{tile.title}</div>
                <div className="tile-value">{tile.value}</div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="dash-lower">
        <div className="panel panel-pad">
          <div className="row-between" style={{ marginBottom: 8 }}>
            <div className="inline-6"><BarChart3 size={15} className="gold-text" /><span className="label">Resumo da época</span></div>
            <button type="button" className="link" onClick={() => setOpenPanel("stats")}>Ver tudo <ChevronRight size={12} /></button>
          </div>
          <div className="stat-grid">
            <div className="offer-stat"><div className="os-l">Jogos</div><div className="os-v">{career.seasonStats.apps}</div></div>
            <div className="offer-stat"><div className="os-l">Golos</div><div className="os-v">{career.seasonStats.goals}</div></div>
            <div className="offer-stat"><div className="os-l">Assistências</div><div className="os-v">{career.seasonStats.assists}</div></div>
            <div className="offer-stat"><div className="os-l">Golos/jogo</div><div className="os-v">{(winRate / 100).toFixed(2)}</div></div>
          </div>
        </div>
        <div className="panel panel-pad">
          <div className="row-between" style={{ marginBottom: 8 }}>
            <div className="inline-6"><Newspaper size={15} className="gold-text" /><span className="label">Últimas notícias</span></div>
            <button type="button" className="link" onClick={() => setOpenPanel("news")}>Abrir <ChevronRight size={12} /></button>
          </div>
          {career.news.length === 0 ? (
            <div className="small-note">A imprensa ainda não escreveu sobre ti.</div>
          ) : (
            <div className="stack-8">
              {career.news.slice(0, 3).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="dash-news-line"
                  onClick={() => setOpenPanel("news")}
                >
                  <span className={`dash-news-dot ${item.read ? "" : "active"}`} />
                  <span style={{ minWidth: 0 }}>
                    <span className="dnl-title">{item.title}</span>
                    <span className="dnl-meta">Semana {item.week} · {item.type}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <footer className="dash-footer">
        <span>To be a Legend · carreira individual</span>
        <span>Semanal {career.week}/{career.totalWeeks} · época {career.seasonLabel}</span>
      </footer>

      <Sheet
        open={openPanel !== null}
        onClose={() => setOpenPanel(null)}
        title={openPanel ? PANEL_META[openPanel].title : ""}
        subtitle={openPanel ? PANEL_META[openPanel].subtitle : undefined}
        icon={openPanel ? (() => { const Icon = PANEL_META[openPanel].icon; return <Icon size={16} />; })() : null}
      >
        {openPanel === "player" ? <PlayerPanel career={career} /> : null}
        {openPanel === "training" ? <TrainingPanel career={career} onCareer={(next, message) => onCareerChange(next, message)} /> : null}
        {openPanel === "evolution" ? <EvolutionPanel career={career} onCareer={(next, message) => onCareerChange(next, message)} /> : null}
        {openPanel === "stats" ? <StatsPanel career={career} /> : null}
        {openPanel === "calendar" ? <CalendarPanel career={career} /> : null}
        {openPanel === "transfers" ? <TransferPanel career={career} onCareer={(next, message) => onCareerChange(next, message)} /> : null}
        {openPanel === "contract" ? <ContractPanel career={career} onCareer={(next, message) => onCareerChange(next, message)} /> : null}
        {openPanel === "achievements" ? <AchievementsPanel career={career} /> : null}
        {openPanel === "news" ? <NewsPanel career={career} onCareer={(next, message) => onCareerChange(next, message)} /> : null}
        {openPanel === "national" ? <NationalPanel career={career} /> : null}
        {openPanel === "history" ? <HistoryPanel career={career} /> : null}
      </Sheet>

      <Sheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="Definições"
        subtitle="Preferências do jogo"
        icon={<SettingsIcon size={16} />}
      >
        <div className="stack-8">
          <button type="button" className="btn btn-ghost" style={{ justifyContent: "space-between" }} onClick={() => onSettingsChange({ ...settings, sound: !settings.sound })}>
            <span>Som</span><span className={settings.sound ? "chip chip-lime" : "chip"}>{settings.sound ? "Ligado" : "Desligado"}</span>
          </button>
          <button type="button" className="btn btn-ghost" style={{ justifyContent: "space-between" }} onClick={() => onSettingsChange({ ...settings, haptics: !settings.haptics })}>
            <span>Vibração</span><span className={settings.haptics ? "chip chip-lime" : "chip"}>{settings.haptics ? "Ligada" : "Desligada"}</span>
          </button>
          <button type="button" className="btn btn-ghost" style={{ justifyContent: "space-between" }} onClick={() => onSettingsChange({ ...settings, reducedMotion: !settings.reducedMotion })}>
            <span>Reduzir animações</span><span className={settings.reducedMotion ? "chip chip-lime" : "chip"}>{settings.reducedMotion ? "Sim" : "Não"}</span>
          </button>
          <p className="small-note">O progresso é guardado automaticamente neste dispositivo. Podes voltar ao menu a qualquer momento.</p>
          <button type="button" className="btn btn-primary btn-block" onClick={() => setSettingsOpen(false)}>Concluído</button>
        </div>
      </Sheet>
    </div>
  );
}

function TeamMark({ clubId, label }: { clubId: string; label: string }) {
  if (clubId.startsWith("nat-")) {
    return <span className="flag-mark" aria-label={label}>{label.slice(0, 3)}</span>;
  }
  return <Crest clubId={clubId} size="lg" />;
}
