import { useMemo, useState } from "react";
import {
  Activity,
  Brain,
  CircleDot,
  Coins,
  Crosshair,
  Flag,
  Heart,
  HeartPulse,
  Route,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { ATTR_META, TRAINING_PROGRAMS } from "../game/config";
import { doTraining, recoverEnergy, sleepRest } from "../game/engine/training";
import type { AttrKey, Career } from "../game/types";
import { MeterBar } from "../components/ui";

const ICONS: Record<string, LucideIcon> = {
  Target, Sparkles, Route, Zap, HeartPulse, Shield, CircleDot, Crosshair, Flag, Brain,
};

type Intensity = "leve" | "normal" | "intenso";

export function TrainingPanel({
  career,
  onCareer,
}: {
  career: Career;
  onCareer: (career: Career, message: string) => void;
}) {
  const [focus, setFocus] = useState<string>(
    career.training?.focus ?? (career.position === "PL" ? "finishing" : career.position === "MC" ? "passing" : "specific"),
  );
  const [intensity, setIntensity] = useState<Intensity>(career.training?.intensity ?? "normal");
  const [gained, setGained] = useState<AttrKey[]>([]);
  const [message, setMessage] = useState<string>("");

  const alreadyTrained = career.training?.week === career.week && career.training.done;
  const program = useMemo(() => TRAINING_PROGRAMS.find((p) => p.id === focus) ?? TRAINING_PROGRAMS[0], [focus]);
  const energyFactor = intensity === "leve" ? 0.75 : intensity === "normal" ? 1 : 1.3;
  const cost = Math.round(program.energy * energyFactor);
  const predictedGain = Math.max(
    1,
    Math.round(
      (career.age <= 20 ? 2.4 : career.age <= 24 ? 1.9 : career.age <= 28 ? 1.3 : 0.7) *
        energyFactor *
        (career.potential - career.overall > 8 ? 1.15 : 0.8),
    ),
  );

  function run() {
    const result = doTraining(career, focus, intensity);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    setMessage(result.message);
    setGained(result.gained);
    onCareer(result.career, result.message);
  }

  function runExtra() {
    const result = doTraining(career, focus, intensity, true);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    setMessage(`Sessão extra: ${result.message}`);
    setGained(result.gained);
    onCareer(result.career, "Sessão extra concluída.");
  }

  function physio() {
    const result = recoverEnergy(career);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    setMessage(result.message);
    onCareer(result.career, result.message);
  }

  function rest() {
    const result = sleepRest(career);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    setMessage(result.message);
    onCareer(result.career, result.message);
  }

  return (
    <div className="stack-12">
      <div className="panel panel-pad">
        <div className="row-between" style={{ marginBottom: 6 }}>
          <div>
            <div className="kicker" style={{ color: "var(--lime)" }}>Semana {career.week} · {career.seasonLabel}</div>
            <h3 className="display" style={{ fontSize: "1.6rem", margin: "2px 0 0" }}>
              {alreadyTrained ? "Treino concluído" : "Treino semanal"}
            </h3>
          </div>
          <span className={alreadyTrained ? "chip chip-lime" : "chip chip-gold"}>
            {alreadyTrained ? "Feito" : "Disponível"}
          </span>
        </div>
        <div className="bars-row">
          <div className="bar-block">
            <div className="bb-top"><span className="bb-label">Energia</span><span className="bb-value">{career.energy}/100</span></div>
            <MeterBar value={career.energy} color={career.energy > 50 ? "lime" : "red"} />
          </div>
          <div className="bar-block">
            <div className="bb-top"><span className="bb-label">Confiança</span><span className="bb-value">{career.coachTrust}</span></div>
            <MeterBar value={career.coachTrust} color="blue" />
          </div>
          <div className="bar-block">
            <div className="bb-top"><span className="bb-label">Forma</span><span className="bb-value">{career.form}</span></div>
            <MeterBar value={career.form} color="gold" />
          </div>
          <div className="bar-block">
            <div className="bb-top"><span className="bb-label">Sessões</span><span className="bb-value">{career.trainingCount}</span></div>
            <MeterBar value={Math.min(100, career.trainingCount * 3)} color="lime" />
          </div>
        </div>
      </div>

      <div>
        <div className="section-head" style={{ marginTop: 0 }}>
          <h2>Escolhe o foco</h2>
          <span className="small-note">{program.attrs.length ? program.attrs.map((a) => ATTR_META[a].short).join(" · ") : `Chave para ${career.position}`}</span>
        </div>
        <div className="training-grid">
          {TRAINING_PROGRAMS.map((p) => {
            const Icon = ICONS[p.icon] ?? Target;
            return (
              <button
                key={p.id}
                type="button"
                className={`training-card ${focus === p.id ? "active" : ""}`}
                onClick={() => setFocus(p.id)}
              >
                <div className="tc-top">
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <Icon size={16} />
                    <span className="tc-title">{p.name}</span>
                  </span>
                  <span className="tc-meta">{Math.round(p.energy * energyFactor)} EN</span>
                </div>
                <span className="tc-desc">{p.description}</span>
                <span className="tc-meta">
                  {p.id === "specific" ? `Foco ${career.position}` : p.attrs.map((a) => ATTR_META[a].label).join(", ")}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="panel panel-pad">
        <div className="label" style={{ marginBottom: 6 }}>Intensidade</div>
        <div className="seg">
          {(["leve", "normal", "intenso"] as Intensity[]).map((level) => (
            <button
              key={level}
              type="button"
              className={intensity === level ? "active" : ""}
              onClick={() => setIntensity(level)}
            >
              {level === "leve" ? "Leve" : level === "normal" ? "Normal" : "Intenso"}
              <span style={{ display: "block", fontSize: "0.55rem", opacity: 0.6, fontWeight: 500 }}>
                {level === "leve" ? "menos energia" : level === "normal" ? "equilibrado" : "+risco de lesão"}
              </span>
            </button>
          ))}
        </div>
        <div className="three-col" style={{ marginTop: 10 }}>
          <div className="offer-stat"><div className="os-l">Custo energia</div><div className="os-v">{cost}</div></div>
          <div className="offer-stat"><div className="os-l">Ganho previsto</div><div className="os-v">+{predictedGain} attr.</div></div>
          <div className="offer-stat"><div className="os-l">Recompensa</div><div className="os-v">+{Math.round(12 * energyFactor)} XP</div></div>
        </div>
        <div className="stack-8" style={{ marginTop: 12 }}>
          <button type="button" className="btn btn-primary btn-block" disabled={alreadyTrained || career.injuryWeeks > 0 || career.retired} onClick={run}>
            <TrendingUp size={16} /> {alreadyTrained ? "Já treinaste esta semana" : "Realizar treino"}
          </button>
          {career.injuryWeeks > 0 ? <div className="chip chip-red">Lesionado: apenas recuperação.</div> : null}
        </div>
      </div>

      <div className="two-col">
        <div className="panel panel-pad">
          <div className="label" style={{ marginBottom: 8 }}>Recuperação</div>
          <div className="stack-8">
            <button type="button" className="btn btn-ghost btn-block" disabled={career.retired} onClick={physio}>
              <HeartPulse size={15} /> Fisioterapia <span className="chip" style={{ marginLeft: "auto" }}><Coins size={11} /> 140</span>
            </button>
            <button type="button" className="btn btn-ghost btn-block" disabled={career.retired} onClick={rest}>
              <Heart size={15} /> Dia de descanso <span className="chip" style={{ marginLeft: "auto" }}>grátis</span>
            </button>
          </div>
          <p className="small-note" style={{ marginTop: 8 }}>
            A fisioterapia recupera energia e reduz uma semana de lesão. O descanso é gratuito mas recupera menos.
          </p>
        </div>
        <div className="panel panel-pad">
          <div className="label" style={{ marginBottom: 8 }}>Sessão extra</div>
          <button type="button" className="btn btn-lime btn-block" onClick={runExtra} disabled={career.coins < 260 || career.energy < 10 || career.injuryWeeks > 0 || career.retired}>
            <Activity size={15} /> + Sessão individual · 260 moedas
          </button>
          <p className="small-note" style={{ marginTop: 8 }}>
            Um treino adicional além do plano semanal. Ganhos reduzidos, mas acelera a evolução do teu jogador.
          </p>
          <div className="inline-6" style={{ marginTop: 8 }}><Coins size={12} className="gold-text" /> {career.coins} moedas disponíveis</div>
        </div>
      </div>

      {message ? (
        <div className="panel panel-pad" style={{ borderColor: "rgba(245,196,81,0.28)" }}>
          <div className="label" style={{ color: "var(--gold)" }}>Resultado</div>
          <div style={{ fontSize: "0.82rem", marginTop: 4 }}>{message}</div>
          {gained.length ? (
            <div className="inline-6" style={{ flexWrap: "wrap", marginTop: 8 }}>
              {gained.map((key) => (
                <span key={key} className="chip chip-lime">{ATTR_META[key].label} +1</span>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
