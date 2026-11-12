import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { getClub } from "../game/data/clubs";

export function Crest({
  clubId,
  size = "md",
  className = "",
}: {
  clubId: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const club = getClub(clubId);
  const sizeClass = size === "sm" ? "sm" : size === "lg" ? "lg" : "";
  return (
    <span
      className={`crest ${sizeClass} ${className}`}
      style={
        {
          "--c1": club.colors.primary,
          "--c2": club.colors.secondary,
        } as React.CSSProperties
      }
      aria-label={club.name}
      title={club.name}
    >
      <span className="crest-letter">{club.short.slice(0, 3)}</span>
    </span>
  );
}

export function OvrRing({
  value,
  size = 92,
  max = 99,
  label = "OVERALL",
}: {
  value: number;
  size?: number;
  max?: number;
  label?: string;
}) {
  const radius = size / 2 - 6;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(1, value / max);
  return (
    <div className="ovr-ring" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={5} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#ovrGold)"
          strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray={`${circumference * progress} ${circumference}`}
        />
        <defs>
          <linearGradient id="ovrGold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffe9b7" />
            <stop offset="55%" stopColor="#f5c451" />
            <stop offset="100%" stopColor="#d8a02c" />
          </linearGradient>
        </defs>
      </svg>
      <div className="ovr-value" style={{ fontSize: size * 0.38 }}>
        {value}
      </div>
      <div className="ovr-label">{label}</div>
    </div>
  );
}

export function MeterBar({
  value,
  color = "gold",
  max = 100,
  className = "",
}: {
  value: number;
  color?: "gold" | "lime" | "blue" | "red";
  max?: number;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={`bar bar-${color} ${className}`}>
      <span style={{ width: `${pct}%` }} />
    </div>
  );
}

export function MiniStat({
  label,
  value,
  className = "",
}: {
  label: string;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mini-stat ${className}`}>
      <div className="ms-label">{label}</div>
      <div className="ms-value">{value}</div>
    </div>
  );
}

export function StatBox({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="stat-box">
      <div className="sb-label">{label}</div>
      <div className="sb-value">{value}</div>
      {hint ? <div className="small-note" style={{ marginTop: 2 }}>{hint}</div> : null}
    </div>
  );
}

export function Sheet({
  open,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="sheet-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label={title}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          {icon ? <div className="sheet-icon">{icon}</div> : null}
          <div>
            <h2>{title}</h2>
            {subtitle ? <div className="sh-sub">{subtitle}</div> : null}
          </div>
          <button type="button" className="sheet-close" onClick={onClose} aria-label="Fechar">
            <X size={17} />
          </button>
        </div>
        <div className="sheet-body">{children}</div>
        {footer ? <div className="sheet-footer">{footer}</div> : null}
      </div>
    </div>
  );
}

export function Modal({
  open,
  children,
  onClose,
  width = 480,
}: {
  open: boolean;
  children: ReactNode;
  onClose?: () => void;
  width?: number;
}) {
  if (!open) return null;
  return (
    <div className="menu-dim" onClick={onClose}>
      <div className="menu-modal" style={{ maxWidth: width }} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

export function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="toast-stack">
      <div className="toast">{message}</div>
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  small = false,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  small?: boolean;
}) {
  return (
    <div className={`seg ${small ? "seg-sm" : ""}`} role="tablist">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={option.value === value}
          className={option.value === value ? "active" : ""}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function EmptyState({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  return (
    <div className="empty-state">
      {icon ? <div className="es-icon">{icon}</div> : null}
      {children}
    </div>
  );
}
