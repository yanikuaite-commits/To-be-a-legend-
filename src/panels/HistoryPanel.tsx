import { Award, History, Trophy } from "lucide-react";
import type { Career } from "../game/types";
import { averageCareerRating } from "../game/uiHelpers";
import { EmptyState } from "../components/ui";

export function HistoryPanel({ career }: { career: Career }) {
  const totals = career.stats;
  const avg = averageCareerRating(career);

  return (
    <div className="stack-12">
      <div className="panel panel-pad">
        <div className="row-between">
          <div>
            <div className="kicker" style={{ color: "var(--lime)" }}>Legado</div>
            <h3 className="display" style={{ fontSize: "1.7rem", margin: "2px 0 0" }}>Histórico da carreira</h3>
          </div>
          {career.retired ? <span className="chip chip-gold">Aposentado</span> : <span className="chip">Época {career.seasonLabel}</span>}
        </div>
        <div className="stat-grid" style={{ marginTop: 10 }}>
          <div className="offer-stat"><div className="os-l">Épocas</div><div className="os-v">{career.history.length + (career.retired ? 0 : 1)}</div></div>
          <div className="offer-stat"><div className="os-l">Jogos</div><div className="os-v">{totals.apps}</div></div>
          <div className="offer-stat"><div className="os-l">Golos</div><div className="os-v">{totals.goals}</div></div>
          <div className="offer-stat"><div className="os-l">Assistências</div><div className="os-v">{totals.assists}</div></div>
          <div className="offer-stat"><div className="os-l">Nota média</div><div className="os-v">{avg.toFixed(2)}</div></div>
          <div className="offer-stat"><div className="os-l">MVP</div><div className="os-v">{totals.motm}</div></div>
        </div>
      </div>

      {career.seasonSummary ? (
        <div className="panel panel-pad" style={{ borderColor: "rgba(245,196,81,0.35)" }}>
          <div className="inline-6"><Trophy size={16} className="gold-text" /><span className="label">Resumo da última época</span></div>
          <div className="stack-8" style={{ marginTop: 6, fontSize: "0.8rem", color: "var(--muted)" }}>
            {career.seasonSummary.lines.map((line, index) => <div key={index}>• {line}</div>)}
          </div>
          {(career.seasonSummary.trophies.length || career.seasonSummary.awards.length) ? (
            <div className="inline-6" style={{ flexWrap: "wrap", marginTop: 8 }}>
              {career.seasonSummary.trophies.map((trophy) => <span className="chip chip-gold" key={trophy}>{trophy}</span>)}
              {career.seasonSummary.awards.map((award) => <span className="chip chip-lime" key={award}>{award}</span>)}
            </div>
          ) : null}
        </div>
      ) : null}

      {career.history.length === 0 ? (
        <EmptyState icon={<History size={20} />}>A tua primeira época ainda está a decorrer. O histórico aparece quando terminares a temporada.</EmptyState>
      ) : (
        <div className="panel panel-pad">
          <div className="label" style={{ marginBottom: 8 }}>Época a época</div>
          <div className="table-wrap">
          <table className="lg-table">
            <thead>
              <tr><th>Época</th><th>Clube</th><th>Liga</th><th>J</th><th>G</th><th>A</th><th>Nota</th><th>OVR</th><th>Pos.</th></tr>
            </thead>
            <tbody>
              {[...career.history].reverse().map((row) => (
                <tr key={row.season}>
                  <td>{row.seasonLabel}</td>
                  <td>{row.clubName}</td>
                  <td className="muted">{row.leagueName.replace("Liga ", "")}</td>
                  <td>{row.apps}</td>
                  <td>{row.goals}</td>
                  <td>{row.assists}</td>
                  <td>{row.rating > 0 ? row.rating.toFixed(2) : "—"}</td>
                  <td>{row.overallStart}→{row.overallEnd}</td>
                  <td>{row.position}º</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      <div className="panel panel-pad">
        <div className="inline-6" style={{ marginBottom: 8 }}><Award size={15} className="gold-text" /><span className="label">Troféus e prémios</span></div>
        {career.history.every((row) => !row.trophy && row.awards.length === 0) && career.seasonTrophies.length === 0 ? (
          <div className="small-note">Ainda sem troféus. Conquista o primeiro título para começar a coleção.</div>
        ) : (
          <div className="stack-8">
            {career.history.filter((row) => row.trophy || row.awards.length).map((row) => (
              <div key={row.season} className="fixture">
                <div className="fx-week">{row.seasonLabel}<br />{row.clubName}</div>
                <div className="fx-main" style={{ flexWrap: "wrap", gap: 4 }}>
                  {row.trophy ? <span className="chip chip-gold">{row.trophy}</span> : null}
                  {row.awards.map((award) => <span className="chip chip-lime" key={award}>{award}</span>)}
                </div>
              </div>
            ))}
            {career.seasonTrophies.map((trophy) => (
              <div key={trophy} className="inline-6"><Trophy size={12} className="gold-text" /> <span className="small-note">{trophy} · {career.seasonLabel}</span></div>
            ))}
          </div>
        )}
      </div>

      {career.retired ? (
        <div className="panel panel-pad" style={{ textAlign: "center", borderColor: "rgba(245,196,81,0.4)" }}>
          <Trophy size={26} className="gold-text" style={{ margin: "0 auto 6px" }} />
          <div className="display" style={{ fontSize: "1.4rem" }}>Uma carreira para a história</div>
          <p className="small-note" style={{ marginTop: 4 }}>
            {totals.goals} golos em {totals.apps} jogos. {career.national.caps} internacionalizações e {career.national.goals} golos pela seleção.
          </p>
        </div>
      ) : null}
    </div>
  );
}
