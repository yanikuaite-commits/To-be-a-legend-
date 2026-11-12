import {
  ArrowRightLeft,
  Award,
  Briefcase,
  CheckCheck,
  FileSignature,
  HeartPulse,
  Hourglass,
  Newspaper,
  PartyPopper,
  Shield,
  Sparkles,
  Stethoscope,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import type { Career, NewsItem } from "../game/types";
import { EmptyState } from "../components/ui";

const ICONS: Record<string, LucideIcon> = {
  ArrowRightLeft, FileSignature, PartyPopper, Hourglass, Briefcase, Shield, Trophy,
  Sparkles, Award, HeartPulse, Stethoscope, Newspaper,
};

const TYPE_ICON: Record<NewsItem["type"], LucideIcon> = {
  match: Sparkles,
  transfer: ArrowRightLeft,
  training: Award,
  injury: HeartPulse,
  national: Shield,
  award: Trophy,
  club: PartyPopper,
  career: Hourglass,
};

const TYPE_LABEL: Record<NewsItem["type"], string> = {
  match: "Partida",
  transfer: "Transferência",
  training: "Treino",
  injury: "Lesão",
  national: "Seleção",
  award: "Prémio",
  club: "Clube",
  career: "Carreira",
};

export function NewsPanel({
  career,
  onCareer,
}: {
  career: Career;
  onCareer: (career: Career, message: string) => void;
}) {
  const unread = career.news.filter((n) => !n.read).length;

  function markAllRead() {
    const next: Career = { ...career, news: career.news.map((n) => ({ ...n, read: true })) };
    onCareer(next, "Notícias marcadas como lidas.");
  }

  return (
    <div className="stack-12">
      <div className="panel panel-pad">
        <div className="row-between">
          <div>
            <div className="kicker" style={{ color: "var(--lime)" }}>Imprensa</div>
            <h3 className="display" style={{ fontSize: "1.7rem", margin: "2px 0 0" }}>Notícias</h3>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="label">Não lidas</div>
            <div className="display" style={{ fontSize: "1.7rem", lineHeight: 1, color: unread ? "var(--gold)" : "var(--muted-2)" }}>{unread}</div>
          </div>
        </div>
        {career.news.length ? (
          <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 10 }} onClick={markAllRead}>
            <CheckCheck size={14} /> Marcar todas como lidas
          </button>
        ) : null}
      </div>

      {career.news.length === 0 ? (
        <EmptyState icon={<Newspaper size={20} />}>A imprensa ainda não escreveu sobre ti. Joga, treina e marca para apareceres nos jornais.</EmptyState>
      ) : (
        <div className="stack-8">
          {career.news.map((item) => {
            const Icon = ICONS[item.icon] ?? TYPE_ICON[item.type] ?? Newspaper;
            return (
              <article className={`news-item ${item.read ? "" : "unread"}`} key={item.id}>
                <div className="news-icon"><Icon size={15} /></div>
                <div style={{ minWidth: 0 }}>
                  <div className="news-title">{item.title}</div>
                  <div className="news-body">{item.body}</div>
                  <div className="news-meta">Época {item.season} · semana {item.week} · {TYPE_LABEL[item.type]}</div>
                </div>
                {!item.read ? <span className="unread-dot" /> : null}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
