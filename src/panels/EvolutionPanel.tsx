import { useState } from "react";
import { Brain, Check, Flame, Lock, ShieldCheck, Sparkles, Target, TrendingUp, Waypoints, Zap, type LucideIcon } from "lucide-react";
import { ATTR_GROUPS, ATTR_KEYS, ATTR_META, SPECIALTIES } from "../game/config";
import { attributeCap, upgradeCost, xpForLevel } from "../game/engine/attributes";
import { chooseSpecialty, upgradeAttribute } from "../game/engine/training";
import type { Career } from "../game/types";
import { MeterBar } from "../components/ui";

const SPECIALTY_ICONS: Record<string, LucideIcon> = {
  Target, Sparkles, Brain, Zap, Flame, Waypoints, ShieldCheck,
};

export function EvolutionPanel({
  career,
  onCareer,
}: {
  career: Career;
  onCareer: (career: Career, message: string) => void;
}) {
  const [message, setMessage] = useState("");
  const cap = attributeCap(career);
  const xpNeeded = xpForLevel(career.level);
  const xpPct = Math.min(100, (career.xp / xpNeeded) * 100);

  function upgrade(key: keyof Career["attributes"]) {
    const result = upgradeAttribute(career, key);
    setMessage(result.message);
    if (result.ok) onCareer(result.career, result.message);
  }

  function pickSpecialty(id: string) {
    const result = chooseSpecialty(career, id);
    setMessage(result.message);
    if (result.ok) onCareer(result.career, result.message);
  }

  return (
    <div className="stack-12">
      <div className="panel panel-pad">
        <div className="row-between">
          <div>
            <div className="kicker" style={{ color: "var(--lime)" }}>Progressão</div>
            <h3 className="display" style={{ fontSize: "1.7rem", margin: "2px 0 0" }}>Evolução</h3>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="label">Pontos disponíveis</div>
            <div className="display" style={{ fontSize: "2rem", color: "var(--gold)", lineHeight: 1 }}>{career.evoPoints}</div>
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <div className="row-between" style={{ marginBottom: 4 }}>
            <span className="label">Nível {career.level}</span>
            <span className="small-note">{Math.round(career.xp)} / {xpNeeded} XP</span>
          </div>
          <MeterBar value={xpPct} color="gold" />
        </div>
        <div className="stat-grid" style={{ marginTop: 12 }}>
          <div className="offer-stat"><div className="os-l">Overall</div><div className="os-v">{career.overall}</div></div>
          <div className="offer-stat"><div className="os-l">Potencial</div><div className="os-v">{career.potential}</div></div>
          <div className="offer-stat"><div className="os-l">Limite attr.</div><div className="os-v">{cap}</div></div>
          <div className="offer-stat"><div className="os-l">Idade</div><div className="os-v">{career.age}</div></div>
        </div>
        {message ? <div className="chip chip-gold" style={{ marginTop: 10 }}>{message}</div> : null}
      </div>

      <div className="panel panel-pad">
        <div className="row-between" style={{ marginBottom: 8 }}>
          <div className="label">Atributos · evoluir</div>
          <span className="small-note">Custo cresce com o valor</span>
        </div>
        {ATTR_GROUPS.map((group) => (
          <div key={group}>
            <div className="attr-group-title">{group}</div>
            {ATTR_KEYS.filter((key) => ATTR_META[key].group === group).map((key) => {
              const value = career.attributes[key];
              const cost = upgradeCost(value);
              const blocked = career.retired || career.evoPoints < cost || value >= cap || career.overall >= career.potential;
              return (
                <div key={key} style={{ display: "grid", gridTemplateColumns: "82px 1fr 44px 62px", gap: 8, alignItems: "center", padding: "5px 0" }}>
                  <span className="ar-name">{ATTR_META[key].label}</span>
                  <MeterBar value={value} color={value >= 75 ? "lime" : value >= 60 ? "gold" : "blue"} />
                  <span className={`ar-value ${value >= cap - 2 ? "hi" : ""}`}>{value}</span>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    style={{ minHeight: 30, padding: "4px 6px", fontSize: "0.62rem" }}
                    disabled={blocked}
                    onClick={() => upgrade(key)}
                  >
                    +1 · {cost}p
                  </button>
                </div>
              );
            })}
          </div>
        ))}
        {career.overall >= career.potential ? (
          <div className="chip chip-red" style={{ marginTop: 10 }}>Atingiste o potencial máximo atual. Ganha experiência para o aumentar na próxima época.</div>
        ) : null}
      </div>

      <div className="panel panel-pad">
        <div className="inline-6" style={{ marginBottom: 10 }}>
          <TrendingUp size={16} style={{ color: "var(--gold)" }} />
          <div className="label">Especializações</div>
        </div>
        <div className="stack-8">
          {SPECIALTIES.map((specialty) => {
            const Icon = SPECIALTY_ICONS[specialty.icon] ?? Sparkles;
            const avg = specialty.attrs.reduce((sum, key) => sum + career.attributes[key], 0) / specialty.attrs.length;
            const unlocked = career.overall >= specialty.minOverall && avg >= 62 && career.level >= 6;
            const active = career.specialty === specialty.id;
            return (
              <div key={specialty.id} className={`achv ${active ? "unlocked" : unlocked ? "" : "locked"}`}>
                <div className="achv-icon">{unlocked ? <Icon size={16} /> : <Lock size={14} />}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="row-between" style={{ gap: 8 }}>
                    <div className="achv-title">{specialty.name}</div>
                    {active ? <span className="chip chip-lime" style={{ fontSize: "0.55rem" }}>Ativa</span> : null}
                  </div>
                  <div className="achv-desc">{specialty.description}</div>
                  <div className="small-note" style={{ marginTop: 3 }}>
                    {specialty.requirement} · OVR {specialty.minOverall} · média {Math.round(avg)}/62
                    {career.level < 6 ? ` · nível ${career.level}/6` : ""}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  disabled={career.retired || !unlocked || active}
                  onClick={() => pickSpecialty(specialty.id)}
                >
                  {active ? <Check size={13} /> : "Escolher"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
