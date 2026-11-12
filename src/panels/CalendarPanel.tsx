import { useMemo, useState } from "react";
import { CalendarDays, Flag, Shield, Trophy } from "lucide-react";
import { LEAGUE_MAP, getClub } from "../game/data/clubs";
import { leaguePosition, standings } from "../game/engine/league";
import { currentWeekFixtures, nextFixture, playerLeague } from "../game/engine/careerUtils";
import type { Career, Fixture } from "../game/types";
import { Crest, EmptyState, Segmented } from "../components/ui";

type CalTab = "fixtures" | "table" | "cups";

function FixtureRow({ fixture, next }: { fixture: Fixture; next: boolean }) {
  return (
    <div className={`fixture ${next ? "next" : ""} ${fixture.played ? "done" : ""}`}>
      <div className="fx-week">S{fixture.week}<br />{fixture.competition === "league" ? "LIGA" : fixture.competition === "cup" ? "TAÇA" : fixture.competition === "continental" ? "CONT" : "SEL"}</div>
      <div className="fx-main">
        <div className="fx-opp">{fixture.home ? "vs" : "@"} {fixture.opponentName}</div>
        <div className="fx-comp">{fixture.competitionName} · {fixture.opponentOverall} OVR</div>
      </div>
      <div className="fx-score">
        {fixture.played ? (
          <span>
            {fixture.homeGoals}-{fixture.awayGoals}{" "}
            <span className={`result-badge ${fixture.result?.toLowerCase()}`}>{fixture.result}</span>
          </span>
        ) : next ? (
          <span className="chip chip-gold">Próximo</span>
        ) : (
          <span className="chip">Agendado</span>
        )}
      </div>
    </div>
  );
}

export function CalendarPanel({ career }: { career: Career }) {
  const [tab, setTab] = useState<CalTab>("fixtures");
  const next = nextFixture(career);
  const league = playerLeague(career);
  const leagueMeta = LEAGUE_MAP[career.seasonLeagueId];
  const table = useMemo(() => (league ? standings(league) : []), [league]);
  const position = league ? leaguePosition(league, career.clubId) : 0;
  const grouped = useMemo(() => {
    const map = new Map<number, Fixture[]>();
    career.fixtures.forEach((fixture) => {
      const list = map.get(fixture.week) ?? [];
      list.push(fixture);
      map.set(fixture.week, list);
    });
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [career.fixtures]);
  const thisWeek = currentWeekFixtures(career);
  const nationalFixtures = career.fixtures.filter((f) => f.competition === "national" || f.competition === "worldcup" || f.competition === "friendly");
  const cupFixtures = career.fixtures.filter((f) => f.competition === "cup");
  const contFixtures = career.fixtures.filter((f) => f.competition === "continental");

  return (
    <div className="stack-12">
      <Segmented<CalTab>
        value={tab}
        onChange={setTab}
        small
        options={[
          { value: "fixtures", label: "Jogos" },
          { value: "table", label: "Classificação" },
          { value: "cups", label: "Competições" },
        ]}
      />

      {tab === "fixtures" ? (
        <>
          <div className="panel panel-pad">
            <div className="inline-6">
              <CalendarDays size={16} className="gold-text" />
              <div>
                <div className="label">Semana {career.week} · {career.seasonLabel}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
                  {thisWeek.length ? `${thisWeek.length} jogo(s) esta semana` : "Sem jogos marcados esta semana"}
                </div>
              </div>
              {next ? <span className="chip chip-gold" style={{ marginLeft: "auto" }}>S{next.week} · {next.opponentShort}</span> : null}
            </div>
          </div>
          <div className="panel panel-pad">
            <div className="label" style={{ marginBottom: 8 }}>Calendário da época</div>
            {grouped.map(([week, fixtures]) => (
              <div key={week} style={{ marginBottom: 10 }}>
                <div className="week-separator"><span>Semana {week}{week === career.week ? " · atual" : ""}</span></div>
                {fixtures.map((fixture) => (
                  <FixtureRow key={fixture.id} fixture={fixture} next={next?.id === fixture.id} />
                ))}
              </div>
            ))}
          </div>
        </>
      ) : null}

      {tab === "table" ? (
        <>
          <div className="panel panel-pad">
            <div className="row-between">
              <div>
                <div className="kicker">{leagueMeta?.country ?? "Liga"}</div>
                <h3 className="display" style={{ fontSize: "1.5rem", margin: "2px 0 0" }}>{leagueMeta?.name ?? "Classificação"}</h3>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="label">Posição</div>
                <div className="display gold-text" style={{ fontSize: "1.9rem", lineHeight: 1 }}>{position}º</div>
              </div>
            </div>
            <div className="small-note" style={{ marginTop: 6 }}>
              {leagueMeta?.tier === 1 ? "1º–3º: Liga dos Campeões · 4º: Continente · 9º–10º: despromoção" : "1º–2º: subida de divisão"}
            </div>
          </div>
          <div className="panel panel-pad">
            <div className="table-wrap">
            <table className="lg-table">
              <thead>
                <tr><th>#</th><th>Clube</th><th className="num">J</th><th className="num">V</th><th className="num">E</th><th className="num">D</th><th className="num">DG</th><th className="num">Pts</th></tr>
              </thead>
              <tbody>
                {table.map((row, index) => {
                  const club = getClub(row.clubId);
                  const isPlayer = row.clubId === career.clubId;
                  return (
                    <tr key={row.clubId} className={isPlayer ? "player-row" : ""}>
                      <td>{index + 1}</td>
                      <td>
                        <span className="inline-6"><Crest clubId={row.clubId} size="sm" /> {club.short}</span>
                      </td>
                      <td>{row.played}</td>
                      <td>{row.won}</td>
                      <td>{row.drawn}</td>
                      <td>{row.lost}</td>
                      <td>{row.goalsFor - row.goalsAgainst > 0 ? "+" : ""}{row.goalsFor - row.goalsAgainst}</td>
                      <td style={{ fontWeight: 800 }}>{row.points}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </div>
        </>
      ) : null}

      {tab === "cups" ? (
        <div className="stack-8">
          <div className="panel panel-pad">
            <div className="inline-6" style={{ marginBottom: 8 }}><Trophy size={16} className="gold-text" /><span className="label">Taça Nacional</span></div>
            {cupFixtures.length === 0 ? <div className="small-note">Ainda sem jogos na Taça esta época.</div> : cupFixtures.map((f) => <FixtureRow key={f.id} fixture={f} next={next?.id === f.id} />)}
          </div>
          <div className="panel panel-pad">
            <div className="inline-6" style={{ marginBottom: 8 }}><Shield size={16} className="gold-text" /><span className="label">Competição Continental</span></div>
            {contFixtures.length === 0 ? <div className="small-note">O clube não está numa competição continental esta época.</div> : contFixtures.map((f) => <FixtureRow key={f.id} fixture={f} next={next?.id === f.id} />)}
          </div>
          <div className="panel panel-pad">
            <div className="inline-6" style={{ marginBottom: 8 }}><Flag size={16} className="gold-text" /><span className="label">Seleção Nacional</span></div>
            {nationalFixtures.length === 0 ? <div className="small-note">Sem convocatória nesta época. Eleva o teu overall e forma para seres chamado.</div> : nationalFixtures.map((f) => <FixtureRow key={f.id} fixture={f} next={next?.id === f.id} />)}
          </div>
          {career.seasonTrophies.length ? (
            <div className="panel panel-pad">
              <div className="label" style={{ marginBottom: 6 }}>Títulos desta época</div>
              <div className="inline-6" style={{ flexWrap: "wrap" }}>
                {career.seasonTrophies.map((trophy) => <span className="chip chip-gold" key={trophy}>{trophy}</span>)}
              </div>
            </div>
          ) : null}
          <EmptyState icon={<Trophy size={18} />}>
            Eliminatórias da Taça, continentais e Mundial são geradas ao longo da carreira.
          </EmptyState>
        </div>
      ) : null}
    </div>
  );
}
