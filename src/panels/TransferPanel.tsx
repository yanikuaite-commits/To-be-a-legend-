import { useState } from "react";
import {
  ArrowRightLeft,
  BadgeEuro,
  Briefcase,
  CalendarClock,
  Check,
  Handshake,
  LogOut,
  MessageSquare,
  ShieldCheck,
  X,
} from "lucide-react";
import { LEAGUE_MAP, getClub } from "../game/data/clubs";
import { acceptOffer, negotiateOffer, rejectOffer, requestTransfer } from "../game/engine/transfers";
import { hireAgent } from "../game/engine/training";
import type { Career, TransferOffer } from "../game/types";
import { Crest, EmptyState, MeterBar } from "../components/ui";
import { formatMoney } from "../game/engine/rng";
import { playerMarketValue, salaryLabel } from "../game/uiHelpers";

function roleUp(role: TransferOffer["role"]): TransferOffer["role"] {
  switch (role) {
    case "Suplente": return "Rotação";
    case "Promessa": return "Rotação";
    case "Rotação": return "Titular";
    case "Titular": return "Titular indiscutível";
    default: return role;
  }
}

export function TransferPanel({
  career,
  onCareer,
}: {
  career: Career;
  onCareer: (career: Career, message: string) => void;
}) {
  const [message, setMessage] = useState("");
  const club = getClub(career.clubId);
  const agentHired = !!career.hasAgent;

  function accept(offer: TransferOffer) {
    const result = acceptOffer(career, offer.id);
    setMessage(result.message);
    if (result.ok) onCareer(result.career, result.message);
  }

  function negotiate(offer: TransferOffer) {
    const result = negotiateOffer(career, offer.id);
    setMessage(result.message);
    if (result.ok) onCareer(result.career, result.message);
    else onCareer(result.career, "Negociação sem acordo.");
  }

  function reject(offer: TransferOffer) {
    const next = rejectOffer(career, offer.id);
    setMessage("Proposta recusada.");
    onCareer(next, "Proposta recusada.");
  }

  function requestMinutes(offer: TransferOffer) {
    const improved = roleUp(offer.role);
    if (improved === offer.role) {
      setMessage("Esta proposta já te dá um papel de destaque.");
      return;
    }
    if (offer.interest < 45) {
      setMessage("O clube não tem interesse suficiente para aumentar o teu papel.");
      return;
    }
    const next: Career = {
      ...career,
      offers: career.offers.map((item) =>
        item.id === offer.id
          ? { ...item, role: improved, interest: Math.max(0, item.interest - 4), negotiated: true }
          : item,
      ),
    };
    setMessage(`O ${offer.clubShort} aceita discutir um papel de ${improved}.`);
    onCareer(next, "Papel na equipa negociado.");
  }

  function requestMove() {
    const result = requestTransfer(career);
    setMessage(result.message);
    onCareer(result.career, result.message);
  }

  function hireAgentAction() {
    const result = hireAgent(career);
    setMessage(result.message);
    if (result.ok) onCareer(result.career, result.message);
  }

  return (
    <div className="stack-12">
      <div className="panel panel-pad">
        <div className="row-between" style={{ marginBottom: 8 }}>
          <div>
            <div className="kicker" style={{ color: "var(--lime)" }}>Mercado</div>
            <h3 className="display" style={{ fontSize: "1.6rem", margin: "2px 0 0" }}>Transferências</h3>
          </div>
          <span className={career.transferWindowOpen ? "chip chip-lime" : "chip"}>
            <CalendarClock size={11} style={{ marginRight: 4 }} />
            {career.transferWindowOpen ? "Janela aberta" : "Fora da janela"}
          </span>
        </div>
        <div className="stat-grid">
          <div className="offer-stat"><div className="os-l">Valor de mercado</div><div className="os-v">{formatMoney(playerMarketValue(career))}</div></div>
          <div className="offer-stat"><div className="os-l">Salário atual</div><div className="os-v">{salaryLabel(career.contract.salary)}</div></div>
          <div className="offer-stat"><div className="os-l">Propostas</div><div className="os-v">{career.offers.length}</div></div>
          <div className="offer-stat"><div className="os-l">Clube</div><div className="os-v" style={{ fontSize: "0.8rem" }}>{club.short}</div></div>
        </div>
        <div className="small-note" style={{ marginTop: 8 }}>
          As propostas chegam a partir da semana 21. Se aceitares, a mudança de clube é concluída no fim da época.
        </div>
      </div>

      {career.pendingTransfer ? (
        <div className="panel panel-pad" style={{ borderColor: "rgba(96,211,148,0.45)" }}>
          <div className="inline-6" style={{ marginBottom: 6 }}>
            <ShieldCheck size={16} style={{ color: "var(--lime)" }} />
            <span className="label" style={{ color: "var(--lime)" }}>Transferência acordada</span>
          </div>
          <div className="inline-6">
            <Crest clubId={career.pendingTransfer.clubId} />
            <div>
              <div style={{ fontWeight: 800 }}>{career.pendingTransfer.clubName}</div>
              <div className="small-note">{career.pendingTransfer.leagueName} · {career.pendingTransfer.role}</div>
            </div>
          </div>
          <div className="stat-grid" style={{ marginTop: 10 }}>
            <div className="offer-stat"><div className="os-l">Salário</div><div className="os-v">{salaryLabel(career.pendingTransfer.salary)}</div></div>
            <div className="offer-stat"><div className="os-l">Duração</div><div className="os-v">{career.pendingTransfer.years} anos</div></div>
            <div className="offer-stat"><div className="os-l">Tipo</div><div className="os-v">{career.pendingTransfer.type === "loan" ? "Empréstimo" : "Definitiva"}</div></div>
            <div className="offer-stat"><div className="os-l">Conclusão</div><div className="os-v">Fim da época</div></div>
          </div>
        </div>
      ) : null}

      {career.offers.length === 0 ? (
        <EmptyState icon={<ArrowRightLeft size={20} />}>
          Sem propostas nesta altura. Marca golos, melhora a tua nota média e espera pela janela de transferências.
        </EmptyState>
      ) : (
        career.offers.map((offer) => (
          <div className="offer-card" key={offer.id}>
            <div className="offer-top">
              <Crest clubId={offer.clubId} />
              <div style={{ minWidth: 0 }}>
                <div className="offer-club">{offer.clubName}</div>
                <div className="offer-meta">{offer.leagueName} · {offer.country} · {offer.clubOverall} OVR</div>
              </div>
              <span className={offer.isRenewal ? "chip chip-gold" : offer.type === "loan" ? "chip" : "chip chip-lime"}>
                {offer.isRenewal ? "Renovação" : offer.type === "loan" ? "Empréstimo" : "Definitiva"}
              </span>
            </div>
            <div className="offer-stats">
              <div className="offer-stat"><div className="os-l">Salário semanal</div><div className="os-v">{formatMoney(offer.salary)}</div></div>
              <div className="offer-stat"><div className="os-l">Duração</div><div className="os-v">{offer.years} anos</div></div>
              <div className="offer-stat"><div className="os-l">Papel</div><div className="os-v" style={{ fontSize: "0.78rem" }}>{offer.role}</div></div>
              <div className="offer-stat"><div className="os-l">Valor</div><div className="os-v">{formatMoney(offer.marketValue)}</div></div>
            </div>
            <div className="interested-row">
              <span className="label" style={{ fontSize: "0.58rem" }}>Interesse</span>
              <MeterBar value={offer.interest} color="gold" />
              <span className="small-note">{Math.round(offer.interest)}%</span>
            </div>
            <div className="offer-objective"><MessageSquare size={12} /> {offer.objectives}</div>
            <div className="offer-actions">
              <button type="button" className="btn btn-primary btn-sm" disabled={career.retired || !!career.pendingTransfer} onClick={() => accept(offer)}>
                <Check size={13} /> Aceitar
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => negotiate(offer)} disabled={career.retired || (offer.negotiated && offer.isRenewal)}>
                <Handshake size={13} /> Negociar
              </button>
              <button type="button" className="btn btn-ghost btn-sm" disabled={career.retired || !!career.pendingTransfer} onClick={() => requestMinutes(offer)}>
                <BadgeEuro size={13} /> Mais minutos
              </button>
              <button type="button" className="btn btn-danger btn-sm" onClick={() => reject(offer)}>
                <X size={13} /> Recusar
              </button>
            </div>
          </div>
        ))
      )}

      <div className="two-col">
        <div className="panel panel-pad">
          <div className="inline-6" style={{ marginBottom: 8 }}><Briefcase size={15} className="gold-text" /><span className="label">Empresário</span></div>
          <p className="small-note">
            {agentHired
              ? "Tens um empresário a trabalhar o mercado. A tua reputação mantém as portas abertas."
              : "Sem representação, as propostas dependem apenas do teu desempenho. Contrata um empresário para aumentar a reputação."}
          </p>
          <button type="button" className="btn btn-ghost btn-block" style={{ marginTop: 8 }} disabled={career.retired || agentHired || career.coins < 450} onClick={hireAgentAction}>
            <Briefcase size={14} /> {agentHired ? "Já tens empresário" : "Contratar empresário · 450"}
          </button>
        </div>
        <div className="panel panel-pad">
          <div className="inline-6" style={{ marginBottom: 8 }}><LogOut size={15} className="gold-text" /><span className="label">Sair do clube</span></div>
          <p className="small-note">
            {career.requestedTransfer
              ? "Pedido entregue. O clube vai ouvir propostas e a confiança do treinador ressentiu-se."
              : "Pede para sair se quiseres forçar uma mudança de ares. Afeta a confiança do treinador."}
          </p>
          <button type="button" className="btn btn-danger btn-block" style={{ marginTop: 8 }} disabled={career.retired || career.requestedTransfer || !!career.pendingTransfer} onClick={requestMove}>
            <LogOut size={14} /> {career.requestedTransfer ? "Pedido entregue" : "Solicitar transferência"}
          </button>
        </div>
      </div>

      {message ? <div className="panel panel-pad" style={{ borderColor: "rgba(245,196,81,0.3)" }}><div className="label" style={{ color: "var(--gold)" }}>Mercado</div><div style={{ fontSize: "0.82rem", marginTop: 4 }}>{message}</div></div> : null}
      <div className="small-note">
        {LEAGUE_MAP[career.seasonLeagueId]?.name} · janela atual: semana {career.week} de 24.
      </div>
    </div>
  );
}
