import { Activity, Award, MapPin, Shield, Star } from "lucide-react";
import { ATTR_GROUPS, ATTR_KEYS, ATTR_META, SPECIALTIES } from "../game/config";
import { attributeCap, xpForLevel } from "../game/engine/attributes";
import { playerMarketValue, careerKit, nationality, salaryLabel } from "../game/uiHelpers";
import { getClub } from "../game/data/clubs";
import { formatMoney } from "../game/engine/rng";
import type { Career } from "../game/types";
import { CharacterImage } from "../components/CharacterArt";
import { Crest, MeterBar, StatBox } from "../components/ui";

export function PlayerPanel({ career }: { career: Career }) {
  const club = getClub(career.clubId);
  const specialty = SPECIALTIES.find((s) => s.id === career.specialty);
  const nat = nationality(career.nationality);
  const xpNeeded = xpForLevel(career.level);
  const xpPct = Math.min(100, (career.xp / xpNeeded) * 100);
  const cap = attributeCap(career);

  return (
    <div className="stack-12">
      <div className="panel" style={{ padding: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 14, alignItems: "end" }}>
          <div
            style={{
              position: "relative",
              borderRadius: 14,
              overflow: "hidden",
              background: "radial-gradient(70% 60% at 50% 20%, rgba(245,196,81,0.18), transparent 65%), linear-gradient(180deg,#0d2638,#071421)",
              border: "1px solid var(--line)",
              height: 150,
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
            }}
          >
            <CharacterImage
              appearance={career.appearance}
              kit={careerKit(career)}
              number={career.shirtNumber}
              mode="head"
              alt={`${career.firstName} ${career.lastName}`}
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center" }}
            />
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="kicker" style={{ color: "var(--lime)" }}>{career.position} · #{career.shirtNumber}</div>
            <h3 className="display" style={{ fontSize: "1.7rem", margin: "2px 0 4px" }}>
              {career.firstName} <span style={{ color: "var(--gold)" }}>{career.lastName}</span>
            </h3>
            <div className="hero-sub" style={{ fontSize: "0.72rem" }}>
              <span>{nat.flag} {nat.name}</span>
              <span>· {career.age} anos</span>
              <span>· {career.foot === "right" ? "Pé direito" : "Pé esquerdo"}</span>
            </div>
            <div className="inline-6" style={{ marginTop: 8 }}>
              <Crest clubId={career.clubId} size="sm" />
              <div>
                <div style={{ fontSize: "0.76rem", fontWeight: 700 }}>{club.name}</div>
                <div style={{ fontSize: "0.6rem", color: "var(--muted-2)" }}>{club.tactic} · {club.coach}</div>
              </div>
              <span className="chip chip-gold" style={{ marginLeft: "auto" }}>{career.overall} OVR</span>
            </div>
          </div>
        </div>
        <div className="stat-grid" style={{ marginTop: 14 }}>
          <StatBox label="Potencial" value={<>{career.potential}<small>máx.</small></>} hint="Limite de evolução" />
          <StatBox label="Nível" value={career.level} hint={`${Math.round(xpPct)}% para o próximo`} />
          <StatBox label="Valor" value={formatMoney(playerMarketValue(career))} hint="Mercado" />
          <StatBox label="Salário" value={salaryLabel(career.contract.salary)} hint={career.contract.role} />
        </div>
        <div style={{ marginTop: 12 }}>
          <div className="row-between" style={{ marginBottom: 4 }}>
            <span className="label">Experiência</span>
            <span className="small-note">{Math.round(career.xp)} / {xpNeeded} XP</span>
          </div>
          <MeterBar value={xpPct} color="gold" />
        </div>
      </div>

      <div className="three-col">
        <div className="panel panel-pad">
          <div className="label">Moral</div>
          <div className="row-between"><span className="value">{career.morale}</span><span className="small-note">{career.morale >= 70 ? "Feliz" : career.morale >= 45 ? "Estável" : "Em baixo"}</span></div>
          <MeterBar value={career.morale} color="lime" />
        </div>
        <div className="panel panel-pad">
          <div className="label">Condição</div>
          <div className="row-between"><span className="value">{career.energy}</span><span className="small-note">{career.energy >= 70 ? "Fresco" : career.energy >= 40 ? "Cansado" : "Exausto"}</span></div>
          <MeterBar value={career.energy} color="gold" />
        </div>
        <div className="panel panel-pad">
          <div className="label">Confiança do treinador</div>
          <div className="row-between"><span className="value">{career.coachTrust}</span><span className="small-note">{career.coachTrust >= 65 ? "Intocável" : career.coachTrust >= 45 ? "Conta contigo" : "Em risco"}</span></div>
          <MeterBar value={career.coachTrust} color="blue" />
        </div>
      </div>

      <div className="panel panel-pad">
        <div className="row-between" style={{ marginBottom: 6 }}>
          <div className="label">Estatuto</div>
          <span className="chip">{career.reputation} reputação</span>
        </div>
        <div className="bars-row">
          <div className="bar-block"><div className="bb-top"><span className="bb-label">Forma</span><span className="bb-value">{career.form}</span></div><MeterBar value={career.form} color="lime" /></div>
          <div className="bar-block"><div className="bb-top"><span className="bb-label">Popularidade</span><span className="bb-value">{career.popularity}</span></div><MeterBar value={career.popularity} color="gold" /></div>
          <div className="bar-block"><div className="bb-top"><span className="bb-label">Liderança</span><span className="bb-value">{career.leadership}</span></div><MeterBar value={career.leadership} color="blue" /></div>
          <div className="bar-block"><div className="bb-top"><span className="bb-label">Reputação</span><span className="bb-value">{career.reputation}</span></div><MeterBar value={career.reputation} color="red" /></div>
        </div>
      </div>

      <div className="panel panel-pad">
        <div className="row-between" style={{ marginBottom: 8 }}>
          <div className="label">Atributos · limite {cap}</div>
          <span className="chip chip-gold">{career.evoPoints} pts evolução</span>
        </div>
        {ATTR_GROUPS.map((group) => (
          <div key={group}>
            <div className="attr-group-title">{group}</div>
            {ATTR_KEYS.filter((key) => ATTR_META[key].group === group).map((key) => {
              const value = career.attributes[key];
              const tone = value >= cap - 2 ? "hi" : value >= 65 ? "mid" : "low";
              return (
                <div className="attr-row" key={key}>
                  <span className="ar-name">{ATTR_META[key].label}</span>
                  <MeterBar value={value} color={value >= 75 ? "lime" : value >= 60 ? "gold" : "blue"} max={99} />
                  <span className={`ar-value ${tone}`}>{value}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="panel panel-pad">
        <div className="inline-6" style={{ marginBottom: 10 }}>
          <Award size={16} style={{ color: "var(--gold)" }} />
          <div className="label">Especialização</div>
        </div>
        {specialty ? (
          <div className="achv unlocked">
            <div className="achv-icon"><Star size={16} /></div>
            <div>
              <div className="achv-title">{specialty.name}</div>
              <div className="achv-desc">{specialty.description}</div>
            </div>
          </div>
        ) : (
          <div className="small-note">
            Ainda sem especialização. No separador Evolução podes escolher uma quando cumprires os requisitos (nível 6 e atributos-chave).
          </div>
        )}
        <hr className="divider" style={{ margin: "12px 0" }} />
        <div className="stat-grid">
          <StatBox label="Clube atual" value={club.short} hint={club.stadium} />
          <StatBox label="Contrato" value={`${career.contract.years} ano(s)`} hint={`${career.contract.role}`} />
          <StatBox label="Nº camisola" value={`#${career.shirtNumber}`} hint={career.captain ? "Capitão" : "Plantel principal"} />
          <StatBox label="Pé" value={career.foot === "right" ? "Direito" : "Esquerdo"} hint={career.captain ? <Shield size={11} /> : <Activity size={11} />} />
        </div>
        <div className="inline-6" style={{ marginTop: 10, color: "var(--muted-2)", fontSize: "0.64rem" }}>
          <MapPin size={12} /> {nat.name} · {club.city}
        </div>
      </div>
    </div>
  );
}
