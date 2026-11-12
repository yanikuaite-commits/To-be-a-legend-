import { getClub } from "../game/data/clubs";

interface JerseyProps {
  clubId: string;
  playerNumber?: number;
  playerNumberPosition?: "top" | "bottom" | "left" | "right";
  size?: "sm" | "md" | "lg";
  className?: string;
  showDetails?: boolean;
}

export function Jersey({
  clubId,
  playerNumber,
  playerNumberPosition = "bottom",
  size = "md",
  className = "",
  showDetails = true,
}: JerseyProps) {
  const club = getClub(clubId);
  
  const sizeClasses = {
    sm: "w-12 h-12 text-xs",
    md: "w-16 h-16 text-sm", 
    lg: "w-20 h-20 text-base"
  };

  const numberPositionClasses = {
    top: "top-2",
    bottom: "bottom-2",
    left: "left-2",
    right: "right-2"
  };

  return (
    <div 
      className={`
        relative flex flex-col items-center justify-center
        rounded-lg border-2 border-white/20 shadow-lg
        ${sizeClasses[size]} ${className}
      `}
      style={{
        background: `linear-gradient(135deg, ${club.colors.primary} 0%, ${club.colors.secondary} 100%)`,
      }}
      title={club.name}
    >
      {/* Club Crest Area */}
      <div className="absolute top-1 left-1 w-4 h-4 bg-white/90 rounded-full flex items-center justify-center">
        <span 
          className="text-[8px] font-bold truncate max-w-[12px]"
          style={{ color: club.colors.primary }}
        >
          {club.short.slice(0, 2)}
        </span>
      </div>

      {/* Player Number */}
      {playerNumber && showDetails && (
        <div 
          className={`
            absolute font-bold text-white drop-shadow-md
            ${numberPositionClasses[playerNumberPosition]}
          `}
          style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.5)" }}
        >
          {playerNumber}
        </div>
      )}

      {/* Club Name (for larger sizes) */}
      {size !== "sm" && showDetails && (
        <div className="absolute bottom-1 text-[8px] text-white/80 font-medium truncate px-1">
          {club.name.slice(0, 6)}
        </div>
      )}
    </div>
  );
}
