import { useEffect, useState } from "react";
import { getPortrait } from "../game/characters/assets";
import type { Appearance, Kit } from "../game/types";

export function CharacterImage({
  appearance,
  kit,
  number = 10,
  mode = "head",
  className = "",
  alt = "Jogador",
  style,
}: {
  appearance: Appearance;
  kit: Kit;
  number?: number;
  mode?: "head" | "full";
  className?: string;
  alt?: string;
  style?: React.CSSProperties;
}) {
  const [url, setUrl] = useState<string>("");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let mounted = true;
    setFailed(false);
    getPortrait(appearance, kit, mode, number)
      .then((result) => {
        if (mounted) setUrl(result);
      })
      .catch(() => {
        if (mounted) setFailed(true);
      });
    return () => {
      mounted = false;
    };
  }, [appearance, kit, mode, number]);

  if (failed) {
    return (
      <div
        className={className}
        style={{
          width: 120,
          height: 120,
          borderRadius: "50%",
          background: "linear-gradient(160deg,#153750,#081521)",
          border: "1px solid rgba(148,190,230,0.2)",
          ...style,
        }}
      />
    );
  }

  if (!url) {
    return (
      <div
        className={className}
        style={{
          background: "linear-gradient(180deg, rgba(20,50,70,0.3), transparent)",
          borderRadius: 18,
          minHeight: mode === "head" ? 160 : 260,
          ...style,
        }}
        aria-label={alt}
      />
    );
  }

  return <img src={url} alt={alt} className={className} style={style} draggable={false} />;
}

export function PlayerCrestLine({ kit }: { kit: Kit }) {
  return (
    <span
      style={{
        width: 10,
        height: 10,
        borderRadius: "50%",
        background: `linear-gradient(140deg, ${kit.primary}, ${kit.secondary})`,
        border: "1px solid rgba(255,255,255,0.5)",
        display: "inline-block",
      }}
    />
  );
}
