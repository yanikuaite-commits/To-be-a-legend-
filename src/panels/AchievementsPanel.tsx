import {
  ArrowRightLeft,
  ArrowUpCircle,
  Castle,
  Crown,
  Earth,
  Flame,
  Flag,
  Gem,
  Globe2,
  Handshake,
  Hourglass,
  Medal,
  Shirt,
  Sparkles,
  Star,
  Target,
  Trophy,
  Wand2,
  type LucideIcon,
} from "lucide-react";
import { ACHIEVEMENTS } from "../game/data/achievements";
import type { Career } from "../game/types";
import { EmptyState, MeterBar } from "../components/ui";

const ICONS: Record<string, LucideIcon> = {
  Shirt, Target, Handshake, Star, Flame, Trophy, ArrowUpCircle, Flag, Crown, Wand2,
  Medal, Globe2, Earth, Sparkles, Gem, Castle, Hourglass, ArrowRightLeft,
};

export function AchievementsPanel({ career }: { career: Career }) {
  const unlocked = new Set(career.achievements);
  const pct = (unlocked.size / ACHIEVEMENTS.length) * 100;

  return (
    <div className="stack-12">
      <div className="panel panel-pad">
        <div className="row-between">
          <div>
            <div className="kicker" style={{ color: "var(--lime)" }}>Coleção</div>
            <h3 className="display" style={{ fontSize: "1.7rem", margin: "2px 0 0" }}>Conquistas</h3>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="label">Desbloqueadas</div>
            <div className="display gold-text" style={{ fontSize: "1.8rem", lineHeight: 1 }}>{unlocked.size}/{ACHIEVEMENTS.length}</div>
          </div>
        </div>
        <div style={{ marginTop: 10 }}><MeterBar value={pct} color="gold" /></div>
      </div>

      {career.seasonTrophies.length || career.seasonAwards.length ? (
        <div className="panel panel-pad">
          <div className="label" style={{ marginBottom: 8 }}>Época {career.seasonLabel}</div>
          <div className="inline-6" style={{ flexWrap: "wrap" }}>
            {career.seasonTrophies.map((trophy) => <span className="chip chip-gold" key={trophy}><Trophy size={11} /> {trophy}</span>)}
            {career.seasonAwards.map((award) => <span className="chip chip-lime" key={award}><Star size={11} /> {award}</span>)}
          </div>
        </div>
      ) : null}

      <div className="stack-8">
        {ACHIEVEMENTS.map((achievement) => {
          const isUnlocked = unlocked.has(achievement.id);
          const Icon = ICONS[achievement.icon] ?? Trophy;
          return (
            <div key={achievement.id} className={`achv ${isUnlocked ? "unlocked" : "locked"}`}>
              <div className="achv-icon"><Icon size={16} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="row-between" style={{ gap: 8 }}>
                  <div className="achv-title">{achievement.title}</div>
                  {isUnlocked ? <span className="chip chip-lime" style={{ fontSize: "0.55rem" }}>Obtida</span> : null}
                </div>
                <div className="achv-desc">{achievement.description}</div>
                <div className="small-note" style={{ marginTop: 2 }}>
                  Recompensa: {achievement.rewardCoins} moedas · {achievement.rewardEvo} pts evolução
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {career.achievements.length === 0 ? (
        <EmptyState icon={<Trophy size={18} />}>As conquistas aparecem à medida que constróis a tua carreira.</EmptyState>
      ) : null}
    </div>
  );
}
