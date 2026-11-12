import { Flag, Globe2, Star, Trophy, ShieldCheck } from "lucide-react";
import { clamp } from "../game/engine/rng";
import { NAT_WEEKS } from "../game/config";
import { COUNTRY_MAP } from "../game/data/countries";
import { nextFixture } from "../game/engine/careerUtils";
import type { Career } from "../game/types";
import { MeterBar } from "../components/ui";
import { averageRating } from "../game/engine/careerUtils";

export function NationalPanel({ career }: { career: Career }) {
  const country = COUNTRY_MAP[career.nationality];
  const threshold = clamp(62 + (100 - career.reputation) * 0.14, 63, 78);
  const next = nextFixture(career);
  const thresholdPct = Math.min(100, (career.overall / threshold) * 100);
  const nextCall = NAT_WEEKS.find((w) => w >= career.week);
  const nationalStats = career.competitionStats.national;

  return (
    <div className="stack-12">
      <div className="panel panel-pad">
        <div className="row-between" style={{ marginBottom: 10 }}>
          <div>
            <div className="kicker" style={{ color: "var(--lime)" }}>Seleção Nacional</div>
            <h3 className="display" style={{ fontSize: "1.8rem", margin: "2px 0 0" }}>
              {country?.flag} {country?.name}
            </h3>
          </div>
          <span className={career.national.calledUp ? "chip chip-lime" : "chip chip-gold"}>
            {career.national.calledUp ? "Convocado" : "Elegível para convocatória"}
          </span>
        </div>
        <div className="stat-grid">
          <div className="offer-stat"><div className="os-l">Internacionalizações</div><div className="os-v">{career.national.caps}</div></div>
          <div className="offer-stat"><div className="os-l">Golos</div><div className="os-v">{career.national.goals}</div></div>
          <div className="offer-stat"><div className="os-l">Assistências</div><div className="os-v">{career.national.assists}</div></div>
          <div className="offer-stat"><div className="os-l">Nota média</div><div className="os-v">{nationalStats && nationalStats.apps > 0 ? averageRating(nationalStats).toFixed(2) : "—"}</div></div>
        </div>
        <div style={{ marginTop: 12 }}>
          <div className="row-between" style={{ marginBottom: 4 }}>
            <span className="label">Overall face ao necessário ({threshold.toFixed(1)})</span>
            <span className="small-note">{career.overall} OVR</span>
          </div>
          <MeterBar value={thresholdPct} color={thresholdPct >= 100 ? "lime" : "gold"} />
        </div>
      </div>

      <div className="two-col">
        <div className="panel panel-pad">
          <div className="inline-6" style={{ marginBottom: 8 }}><ShieldCheck size={15} className="lime-text" /><span className="label">Critérios de convocatória</span></div>
          <div className="stack-8" style={{ fontSize: "0.78rem" }}>
            <div className="row-between"><span>Overall mínimo</span><span className={career.overall >= threshold ? "lime-text" : "muted"}>{threshold.toFixed(0)}</span></div>
            <div className="row-between"><span>Idade mínima</span><span className={career.age >= 18 ? "lime-text" : "muted"}>{career.age}/18</span></div>
            <div className="row-between"><span>Reputação</span><span className={career.reputation >= 34 ? "lime-text" : "muted"}>{Math.round(career.reputation)}/34</span></div>
            <div className="row-between"><span>Sem lesão</span><span className={career.injuryWeeks === 0 ? "lime-text" : "red-text"}>{career.injuryWeeks === 0 ? "Sim" : "Não"}</span></div>
          </div>
          <div className="small-note" style={{ marginTop: 8 }}>
            {nextCall ? `Próxima janela internacional na semana ${nextCall}.` : "A época internacional termina na semana 21."}
          </div>
        </div>
        <div className="panel panel-pad">
          <div className="inline-6" style={{ marginBottom: 8 }}><Globe2 size={15} className="gold-text" /><span className="label">Próximo compromisso</span></div>
          {next && (next.competition === "national" || next.competition === "worldcup" || next.competition === "friendly") ? (
            <>
              <div style={{ fontWeight: 800 }}>{next.home ? "vs" : "@"} {next.opponentName}</div>
              <div className="small-note">{next.competitionName} · semana {next.week} · {next.opponentOverall} OVR</div>
            </>
          ) : (
            <div className="small-note">Sem convocatória ativa. Eleva o overall, a reputação e o desempenho no clube para entrares nas escolhas.</div>
          )}
          <div className="divider" style={{ margin: "10px 0" }} />
          <div className="inline-6"><Flag size={13} /> <span className="small-note">{career.national.debut ? "Já representaste o teu país." : "Ainda sem estreia internacional."}</span></div>
        </div>
      </div>

      <div className="panel panel-pad">
        <div className="inline-6" style={{ marginBottom: 8 }}><Trophy size={15} className="gold-text" /><span className="label">Torneios internacionais</span></div>
        {career.national.tournaments.length === 0 ? (
          <div className="small-note">Os torneios internacionais ficam registados aqui. Mundial e competições continentais surgem conforme a tua carreira.</div>
        ) : (
          <div className="stack-8">
            {career.national.tournaments.map((tournament) => (
              <div className="fixture" key={`${tournament.name}-${tournament.season}`}>
                <div className="fx-week">{tournament.season}<br />SEL</div>
                <div className="fx-main"><div className="fx-opp">{tournament.name}</div><div className="fx-comp">{tournament.goals} golos</div></div>
                <div className="fx-score"><span className={tournament.result === "Campeão" ? "chip chip-gold" : "chip"}>{tournament.result}</span></div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="panel panel-pad">
        <div className="inline-6" style={{ marginBottom: 8 }}><Star size={15} className="gold-text" /><span className="label">Internacionais recentes</span></div>
        {career.matchLog.filter((m) => m.competitionName.includes("Seleção") || m.competitionName.includes("Particular") || m.competitionName.includes("Mundial") || m.competitionName.includes("Qualificação")).length === 0 ? (
          <div className="small-note">Ainda sem jogos pela seleção registados.</div>
        ) : (
          <div className="stack-8">
            {career.matchLog
              .filter((m) => m.competitionName.includes("Seleção") || m.competitionName.includes("Particular") || m.competitionName.includes("Mundial") || m.competitionName.includes("Qualificação"))
              .slice(0, 6)
              .map((m) => (
                <div className="fixture" key={m.id}>
                  <div className="fx-week">S{m.week}<br />SEL</div>
                  <div className="fx-main"><div className="fx-opp">{m.home ? "vs" : "@"} {m.opponentShort}</div><div className="fx-comp">{m.competitionName}</div></div>
                  <div className="fx-score"><span className="chip">{m.rating.toFixed(1)}</span></div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
