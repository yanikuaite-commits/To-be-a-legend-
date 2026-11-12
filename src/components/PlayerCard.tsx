import { Jersey } from "./Jersey";
import { Crest } from "./ui";

interface PlayerCardProps {
  clubId: string;
  number: number;
  name: string;
  position: string;
  overall: number;
  appearance?: {
    height?: number;
    build?: number;
  };
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
}

export function PlayerCard({
  clubId,
  number,
  name,
  position,
  overall,
  appearance,
  size = "md",
  onClick,
}: PlayerCardProps) {
  const sizeClasses = {
    sm: "w-24 p-2",
    md: "w-32 p-3",
    lg: "w-40 p-4",
  };

  return (
    <div
      className={`
        bg-slate-800/80 rounded-lg shadow-lg border border-white/10
        overflow-hidden transition-transform hover:scale-105
        ${sizeClasses[size]}
        ${onClick ? "cursor-pointer" : ""}
      `}
      onClick={onClick}
    >
      <div className="flex flex-col items-center">
        {/* Uniforme do jogador */}
        <Jersey
          clubId={clubId}
          playerNumber={number}
          size={size}
          showDetails={size !== "sm"}
        />

        {/* Informações do jogador */}
        <div className="mt-2 text-center">
          <div className="text-white font-bold text-sm truncate px-1">
            {name}
          </div>
          <div className="text-slate-300 text-xs">{position}</div>
          <div className="flex items-center justify-center gap-1 mt-1">
            <Crest clubId={clubId} size="sm" />
            <span className="text-xs text-slate-400">#{number}</span>
          </div>
        </div>

        {/* Overall rating */}
        <div className="mt-2">
          <div className="text-lg font-bold text-yellow-400">{overall}</div>
          <div className="text-[10px] text-slate-400 uppercase tracking-wide">OVR</div>
        </div>
      </div>
    </div>
  );
}
