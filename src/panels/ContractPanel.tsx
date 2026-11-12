import { useState } from "react";
import { BadgeEuro, CalendarRange, FileSignature, HandCoins, ShieldCheck, TrendingUp } from "lucide-react";
import { getClub } from "../game/data/clubs";
import { renewContract } from "../game/engine/transfers";
import { formatMoney } from "../game/engine/rng";
import type { Career } from "../game/types";
import { Crest, MeterBar } from "../components/ui";
import { playerMarketValue, recommendSalary } from "../game/uiHelpers";

export function ContractPanel({
  career,
  onCareer,
}: {
  career: Career;
  onCareer: (career: Career, message: string) => void;
}) {
  const [message, setMessage] = useState("");
  const club = getClub(career.clubId);
  const contract = career.contract;
  const expiry = contract.signedSeason + contract.years - 1;
  const canRenew = contract.years <= 1 && !career.pendingTransfer && !career.retired;
  const suggested = recommendSalary(career);

  function renew() {
    const result = renewContract(career);
    setMessage(result.message);
    if (result.ok) onCareer(result.career, result.message);
  }

  return (
    <div className="stack-12">
      <div className="panel panel-pad">
        <div className="row-between" style={{ marginBottom: 10 }}>
          <div className="inline-6">
            <Crest clubId={career.clubId} />
            <div>
              <div className="kicker">{club.stadium} · {club.city}</div>
              <h3 className="display" style={{ fontSize: "1.45rem", margin: "2px 0 0" }}>{club.name}</h3>
            </div>
          </div>
          <span className="chip chip-gold">{contract.role}</span>
        </div>
        <div className="stat-grid">
          <div className="offer-stat"><div className="os-l">Salário semanal</div><div className="os-v">{formatMoney(contract.salary)}</div></div>
          <div className="offer-stat"><div className="os-l">Duração</div><div className="os-v">{contract.years} ano(s)</div></div>
          <div className="offer-stat"><div className="os-l">Termina</div><div className="os-v">{expiry}</div></div>
          <div className="offer-stat"><div className="os-l">Valor de mercado</div><div className="os-v">{formatMoney(playerMarketValue(career))}</div></div>
        </div>
        <div className="bars-row" style={{ marginTop: 12 }}>
          <div className="bar-block">
            <div className="bb-top"><span className="bb-label">Confiança do treinador</span><span className="bb-value">{career.coachTrust}/100</span></div>
            <MeterBar value={career.coachTrust} color="blue" />
          </div>
          <div className="bar-block">
            <div className="bb-top"><span className="bb-label">Salário face ao mercado</span><span className="bb-value">{suggested > 0 ? `${Math.round((contract.salary / suggested) * 100)}%` : "—"}</span></div>
            <MeterBar value={suggested > 0 ? Math.min(100, (contract.salary / suggested) * 100) : 0} color={contract.salary >= suggested ? "lime" : "gold"} />
          </div>
        </div>
      </div>

      <div className="panel panel-pad">
        <div className="label" style={{ marginBottom: 8 }}>Cláusulas e prémios</div>
        <div className="stat-grid">
          <div className="offer-stat"><div className="os-l">Cláusula de rescisão</div><div className="os-v">{formatMoney(contract.releaseClause)}</div></div>
          <div className="offer-stat"><div className="os-l">Prémio por golo</div><div className="os-v">{formatMoney(contract.bonuses.goals)}</div></div>
          <div className="offer-stat"><div className="os-l">Prémio por assistência</div><div className="os-v">{formatMoney(contract.bonuses.assists)}</div></div>
          <div className="offer-stat"><div className="os-l">Prémio por jogo</div><div className="os-v">{formatMoney(contract.bonuses.apps)}</div></div>
        </div>
        <div className="small-note" style={{ marginTop: 8 }}>
          Os prémios são pagos ao clube no final de cada época, juntamente com o salário acumulado.
        </div>
      </div>

      <div className="panel panel-pad">
        <div className="inline-6" style={{ marginBottom: 8 }}><FileSignature size={16} className="gold-text" /><span className="label">Renovação</span></div>
        {career.pendingTransfer ? (
          <div className="chip chip-gold">Tens uma transferência acordada com o {career.pendingTransfer.clubName}. A renovação fica indisponível.</div>
        ) : (
          <>
            <p className="small-note">
              {canRenew
                ? `Estás no último ano de contrato. A direção propõe ${formatMoney(suggested)}/semana por 3 épocas.`
                : `Só podes renovar no último ano de contrato (termina em ${expiry}). A tua relação com o treinador (${career.coachTrust}) influencia a proposta.`}
            </p>
            <button type="button" className="btn btn-primary btn-block" disabled={!canRenew} onClick={renew} style={{ marginTop: 8 }}>
              <HandCoins size={15} /> {canRenew ? "Aceitar renovação por 3 anos" : "Renovação ainda indisponível"}
            </button>
          </>
        )}
        {message ? <div className="chip chip-gold" style={{ marginTop: 10 }}>{message}</div> : null}
      </div>

      <div className="two-col">
        <div className="panel panel-pad">
          <div className="inline-6" style={{ marginBottom: 8 }}><CalendarRange size={15} className="gold-text" /><span className="label">Histórico contratual</span></div>
          <p className="small-note">
            Assinaste pelo {club.short} na época {contract.signedSeason}. Tens {contract.years <= 1 ? "apenas este ano" : `${contract.years} anos`} de vínculo.
          </p>
        </div>
        <div className="panel panel-pad">
          <div className="inline-6" style={{ marginBottom: 8 }}><TrendingUp size={15} className="lime-text" /><span className="label">Valorização</span></div>
          <p className="small-note">
            O teu valor de mercado é {formatMoney(playerMarketValue(career))}. Golos, assistências, notas altas e prémios
            fazem subir a cotação e atraem clubes maiores.
          </p>
        </div>
      </div>

      <div className="panel panel-pad" style={{ borderColor: "rgba(96,211,148,0.25)" }}>
        <div className="inline-6">
          <ShieldCheck size={15} style={{ color: "var(--lime)" }} />
          <span className="small-note">
            {career.captain ? "És o capitão do clube." : "Ainda não és capitão. Conquista a confiança do treinador e a braçadeira pode chegar."}
          </span>
        </div>
        <div className="inline-6" style={{ marginTop: 6 }}>
          <BadgeEuro size={15} className="gold-text" />
          <span className="small-note">Moedas atuais: {career.coins}. Usa-as em treino extra, fisioterapia ou no teu empresário.</span>
        </div>
      </div>
    </div>
  );
}
