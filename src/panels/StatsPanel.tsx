import { useMemo, useState } from "react";
import { BarChart3, ListOrdered, Star, Target, Trophy } from "lucide-react";
import { LEAGUE_MAP, getClub } from "../game/data/clubs";
import { averageRating } from "../game/engine/careerUtils";
import type { Career, StatBlock } from "../game/types";
import { Crest, EmptyState, Segmented } from "../components/ui";

type StatsTab = "season" | "career" | "competitions" | "clubs" | "national";

const COMPETITION_LABEL: Record<string, string> = {
  league: "Liga",
  cup: "Taça Nacional",
  continental: "Liga Continental",
  national: "Seleção",
  friendly: "Amigáveis",
  worldcup: "Mundial",
};

const EMPTY = (): StatBlock => ({
  apps: 0, starts: 0, minutes: 0, goals: 0, assists: 0, passes: 0, passesCompleted: 0,
  shots: 0, shotsOn: 0, dribbles: 0, dribblesCompleted: 0, tackles: 0, interceptions: 0,
  fouls: 0, yellow: 0, red: 0, ratingSum: 0, ratingCount: 0, motm: 0, bestRating: 0,
});

function pct(part: number, total: number): string {
  if (!total) return "—";
  return `${Math.round((part / total) * 100)}%`;
}

function StatRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="stat-row">
      <span className="sr-label">{label}</span>
      <span className="sr-value">{value}</span>
    </div>
  );
}

function StatsGrid({ stats }: { stats: StatBlock }) {
  const avg = averageRating(stats);
  return (
    <div className="two-col">
      <div className="panel panel-pad">
        <div className="label" style={{ marginBottom: 4 }}>Ataque</div>
        <StatRow label="Partidas" value={stats.apps} />
        <StatRow label="Titular" value={stats.starts} />
        <StatRow label="Minutos" value={stats.minutes} />
        <StatRow label="Golos" value={stats.goals} />
        <StatRow label="Assistências" value={stats.assists} />
        <StatRow label="Remates" value={stats.shots} />
        <StatRow label="Remates certos" value={stats.shotsOn} />
        <StatRow label="Dribles" value={stats.dribbles} />
        <StatRow label="Dribles certos" value={`${stats.dribblesCompleted} (${pct(stats.dribblesCompleted, stats.dribbles)})`} />
      </div>
      <div className="panel panel-pad">
        <div className="label" style={{ marginBottom: 4 }}>Técnica e defesa</div>
        <StatRow label="Passes" value={stats.passes} />
        <StatRow label="Passes certos" value={`${stats.passesCompleted} (${pct(stats.passesCompleted, stats.passes)})`} />
        <StatRow label="Desarmes" value={stats.tackles} />
        <StatRow label="Interceções" value={stats.interceptions} />
        <StatRow label="Faltas" value={stats.fouls} />
        <StatRow label="Amarelos" value={stats.yellow} />
        <StatRow label="Vermelhos" value={stats.red} />
        <StatRow label="Nota média" value={<span className="gold-text">{avg > 0 ? avg.toFixed(2) : "—"}</span>} />
        <StatRow label="Melhor nota" value={stats.bestRating > 0 ? stats.bestRating.toFixed(1) : "—"} />
        <StatRow label="MVP" value={stats.motm} />
      </div>
    </div>
  );
}

export function StatsPanel({ career }: { career: Career }) {
  const [tab, setTab] = useState<StatsTab>("season");
  const bestMatch = useMemo(
    () => [...career.matchLog].sort((a, b) => b.rating - a.rating)[0],
    [career.matchLog],
  );
  const bestSeason = useMemo(
    () => [...career.history].sort((a, b) => b.rating - a.rating)[0],
    [career.history],
  );
  const nationalStats = career.competitionStats.national ?? EMPTY();
  const competitionKeys = useMemo(() => {
    const keys = new Set<string>();
    Object.keys(career.seasonCompetitionStats).forEach((key) => keys.add(key));
    Object.keys(career.competitionStats).forEach((key) => keys.add(key));
    return Array.from(keys);
  }, [career.competitionStats, career.seasonCompetitionStats]);
  const clubKeys = useMemo(() => Object.keys(career.clubStats), [career.clubStats]);

  return (
    <div className="stack-12">
      <Segmented<StatsTab>
        value={tab}
        onChange={setTab}
        small
        options={[
          { value: "season", label: "Época" },
          { value: "career", label: "Carreira" },
          { value: "competitions", label: "Competições" },
          { value: "clubs", label: "Clubes" },
          { value: "national", label: "Seleção" },
        ]}
      />

      {tab === "season" || tab === "career" ? (
        <>
          <div className="panel panel-pad">
            <div className="row-between" style={{ marginBottom: 6 }}>
              <div>
                <div className="kicker" style={{ color: "var(--lime)" }}>{tab === "season" ? career.seasonLabel : "Carreira completa"}</div>
                <h3 className="display" style={{ fontSize: "1.4rem", margin: "2px 0 0" }}>
                  {tab === "season" ? "Estatísticas da época" : "Estatísticas totais"}
                </h3>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="label">Nota média</div>
                <div className="display gold-text" style={{ fontSize: "1.8rem", lineHeight: 1 }}>
                  {(tab === "season" ? career.seasonStats : career.stats).apps
                    ? averageRating(tab === "season" ? career.seasonStats : career.stats).toFixed(2)
                    : "—"}
                </div>
              </div>
            </div>
            <div className="stat-grid">
              <div className="offer-stat"><div className="os-l">Jogos</div><div className="os-v">{(tab === "season" ? career.seasonStats : career.stats).apps}</div></div>
              <div className="offer-stat"><div className="os-l">Golos</div><div className="os-v">{(tab === "season" ? career.seasonStats : career.stats).goals}</div></div>
              <div className="offer-stat"><div className="os-l">Assist.</div><div className="os-v">{(tab === "season" ? career.seasonStats : career.stats).assists}</div></div>
              <div className="offer-stat"><div className="os-l">MVP</div><div className="os-v">{(tab === "season" ? career.seasonStats : career.stats).motm}</div></div>
            </div>
          </div>
          <StatsGrid stats={tab === "season" ? career.seasonStats : career.stats} />
          <div className="two-col">
            <div className="panel panel-pad">
              <div className="inline-6" style={{ marginBottom: 8 }}><Star size={15} className="gold-text" /><span className="label">Melhor partida</span></div>
              {bestMatch ? (
                <div>
                  <div style={{ fontWeight: 700 }}>{bestMatch.home ? "vs" : "@"} {bestMatch.opponentShort} · {bestMatch.score}</div>
                  <div className="small-note">{bestMatch.competitionName} · {bestMatch.season} · {bestMatch.goals}G {bestMatch.assists}A · nota {bestMatch.rating.toFixed(1)}</div>
                </div>
              ) : <div className="small-note">Ainda sem partidas registadas.</div>}
            </div>
            <div className="panel panel-pad">
              <div className="inline-6" style={{ marginBottom: 8 }}><Trophy size={15} className="gold-text" /><span className="label">Melhor época</span></div>
              {bestSeason ? (
                <div>
                  <div style={{ fontWeight: 700 }}>{bestSeason.seasonLabel} · {bestSeason.clubName}</div>
                  <div className="small-note">{bestSeason.apps} jogos · {bestSeason.goals} golos · {bestSeason.assists} assist. · média {bestSeason.rating.toFixed(2)}</div>
                </div>
              ) : <div className="small-note">Termina a primeira época para desbloquear.</div>}
            </div>
          </div>

          <div className="panel panel-pad">
            <div className="inline-6" style={{ marginBottom: 8 }}><ListOrdered size={15} /><span className="label">Últimas partidas</span></div>
            {career.matchLog.length === 0 ? (
              <EmptyState icon={<BarChart3 size={18} />}>As tuas partidas aparecem aqui.</EmptyState>
            ) : (
              <div className="table-wrap">
                <table className="lg-table">
                  <thead>
                    <tr><th>Época</th><th>Comp.</th><th>Adversário</th><th>Res.</th><th className="num">Min</th><th className="num">G</th><th className="num">A</th><th className="num">Nota</th></tr>
                  </thead>
                  <tbody>
                    {career.matchLog.slice(0, 15).map((entry) => (
                      <tr key={entry.id}>
                        <td>{entry.season}</td>
                        <td className="muted">{entry.competitionName.replace("Liga ", "")}</td>
                        <td>{entry.home ? "vs " : "@ "}{entry.opponentShort}</td>
                        <td>{entry.score}</td>
                        <td>{entry.minutes}′</td>
                        <td>{entry.goals}</td>
                        <td>{entry.assists}</td>
                        <td>
                          <span className={`chip ${entry.rating >= 7.5 ? "chip-lime" : entry.rating < 5.5 ? "chip-red" : ""}`}>
                            {entry.rating.toFixed(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}

      {tab === "competitions" ? (
        <div className="stack-8">
          {competitionKeys.length === 0 ? <EmptyState icon={<Target size={18} />}>Ainda sem competições disputadas.</EmptyState> : null}
          {competitionKeys.map((key) => {
            const seasonBlock = career.seasonCompetitionStats[key] ?? EMPTY();
            const careerBlock = career.competitionStats[key] ?? EMPTY();
            return (
              <div className="panel panel-pad" key={key}>
                <div className="row-between" style={{ marginBottom: 6 }}>
                  <div className="display" style={{ fontSize: "1.1rem", letterSpacing: "0.02em" }}>{COMPETITION_LABEL[key] ?? key}</div>
                  <span className="chip">{careerBlock.apps} jogos na carreira</span>
                </div>
                <div className="two-col">
                  <div>
                    <div className="label" style={{ fontSize: "0.58rem" }}>Época atual</div>
                    <StatRow label="Jogos" value={seasonBlock.apps} />
                    <StatRow label="Golos" value={seasonBlock.goals} />
                    <StatRow label="Assist." value={seasonBlock.assists} />
                    <StatRow label="Nota" value={averageRating(seasonBlock).toFixed(2)} />
                  </div>
                  <div>
                    <div className="label" style={{ fontSize: "0.58rem" }}>Carreira</div>
                    <StatRow label="Jogos" value={careerBlock.apps} />
                    <StatRow label="Golos" value={careerBlock.goals} />
                    <StatRow label="Assist." value={careerBlock.assists} />
                    <StatRow label="Nota" value={averageRating(careerBlock).toFixed(2)} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {tab === "clubs" ? (
        <div className="stack-8">
          {clubKeys.length === 0 ? <EmptyState icon={<Trophy size={18} />}>Ainda sem clubes.</EmptyState> : null}
          {clubKeys.map((clubId) => {
            const block = career.clubStats[clubId] ?? EMPTY();
            const club = getClub(clubId);
            return (
              <div className="panel panel-pad" key={clubId}>
                <div className="inline-6" style={{ marginBottom: 6 }}>
                  <Crest clubId={clubId} size="sm" />
                  <div>
                    <div style={{ fontWeight: 700 }}>{club.name}</div>
                    <div className="small-note">{LEAGUE_MAP[club.leagueId]?.name}</div>
                  </div>
                  <span className="chip chip-lime" style={{ marginLeft: "auto" }}>{block.apps} jogos</span>
                </div>
                <div className="stat-grid">
                  <div className="offer-stat"><div className="os-l">Golos</div><div className="os-v">{block.goals}</div></div>
                  <div className="offer-stat"><div className="os-l">Assist.</div><div className="os-v">{block.assists}</div></div>
                  <div className="offer-stat"><div className="os-l">Minutos</div><div className="os-v">{block.minutes}</div></div>
                  <div className="offer-stat"><div className="os-l">Nota</div><div className="os-v">{averageRating(block).toFixed(2)}</div></div>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {tab === "national" ? (
        <div className="stack-8">
          <div className="panel panel-pad">
            <div className="row-between">
              <div>
                <div className="kicker" style={{ color: "var(--lime)" }}>Seleção Nacional</div>
                <h3 className="display" style={{ fontSize: "1.5rem", margin: "2px 0 0" }}>
                  {career.national.calledUp ? "Convocado" : "A aguardar convocatória"}
                </h3>
              </div>
              <div className="stat-grid" style={{ width: "auto" }}>
                <div className="offer-stat"><div className="os-l">Intern.</div><div className="os-v">{career.national.caps}</div></div>
                <div className="offer-stat"><div className="os-l">Golos</div><div className="os-v">{career.national.goals}</div></div>
              </div>
            </div>
            <StatsGrid stats={nationalStats} />
          </div>
          {career.national.tournaments.length === 0 ? (
            <EmptyState icon={<Trophy size={18} />}>As competições internacionais aparecem aqui quando fores convocado.</EmptyState>
          ) : (
            career.national.tournaments.map((tournament) => (
              <div className="panel panel-pad" key={`${tournament.name}-${tournament.season}`}>
                <div className="row-between">
                  <div style={{ fontWeight: 700 }}>{tournament.name} · {tournament.season}</div>
                  <span className="chip">{tournament.result}</span>
                </div>
                <div className="small-note">{tournament.goals} golos no torneio</div>
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
