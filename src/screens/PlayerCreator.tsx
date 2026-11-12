import { useMemo, useState } from "react";
import { ArrowLeft, Check, Dices, Sparkles, Shirt, UserRound } from "lucide-react";
import {
  ACCESSORY_OPTIONS,
  BASE_FACES,
  BROW_OPTIONS,
  EYE_COLORS,
  HAIR_COLORS,
  HAIR_STYLES,
  SKIN_TONES,
  defaultAppearance,
  kitForClub,
} from "../game/data/appearance";
import { COUNTRIES } from "../game/data/countries";
import { LEAGUE_MAP, START_CLUBS, getClub } from "../game/data/clubs";
import { NAME_SUGGESTIONS } from "../game/data/names";
import { POSITION_LABEL, POSITIONS } from "../game/config";
import type { Appearance, Foot, PositionCode } from "../game/types";
import type { CreateCareerInput } from "../game/engine/career";
import { CharacterImage } from "../components/CharacterArt";
import { Crest } from "../components/ui";

export function PlayerCreator({
  onBack,
  onCreate,
}: {
  onBack: () => void;
  onCreate: (input: CreateCareerInput) => void;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [nationality, setNationality] = useState("POR");
  const [position, setPosition] = useState<PositionCode>("PL");
  const [shirtNumber, setShirtNumber] = useState(10);
  const [foot, setFoot] = useState<Foot>("right");
  const [clubId, setClubId] = useState(START_CLUBS[0]);
  const [appearance, setAppearance] = useState<Appearance>(defaultAppearance());
  const [error, setError] = useState<string | null>(null);

  const club = getClub(clubId);
  const kit = useMemo(() => kitForClub(club, "home"), [club]);
  const fullName = `${firstName || "O TEU"} ${lastName || "NOME"}`.trim();
  const league = LEAGUE_MAP[club.leagueId];
  const suggestions = NAME_SUGGESTIONS[nationality] ?? NAME_SUGGESTIONS.POR;

  function set<K extends keyof Appearance>(key: K, value: Appearance[K]) {
    setAppearance((prev) => ({ ...prev, [key]: value }));
  }

  function randomName() {
    const first = suggestions.first[Math.floor(Math.random() * suggestions.first.length)];
    const last = suggestions.last[Math.floor(Math.random() * suggestions.last.length)];
    setFirstName(first);
    setLastName(last);
  }

  function submit() {
    if (firstName.trim().length < 2) {
      setError("Escreve o teu primeiro nome.");
      return;
    }
    if (lastName.trim().length < 2) {
      setError("Escreve o teu apelido.");
      return;
    }
    if (!Number.isFinite(shirtNumber) || shirtNumber < 1 || shirtNumber > 99) {
      setError("O número deve estar entre 1 e 99.");
      return;
    }
    setError(null);
    onCreate({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      nationality,
      position,
      shirtNumber,
      foot,
      appearance,
      clubId,
    });
  }

  return (
    <div className="app-shell">
      <div className="creator-header">
        <button type="button" className="btn btn-ghost btn-sm" onClick={onBack}>
          <ArrowLeft size={15} /> Menu
        </button>
        <div style={{ textAlign: "right" }}>
          <div className="kicker">Novo jogo</div>
          <div className="display" style={{ fontSize: "1.4rem", marginTop: 2 }}>Cria o teu jogador</div>
        </div>
      </div>

      <div className="creator-grid">
        <aside className="creator-preview">
          <div className="row-between">
            <div className="kicker" style={{ color: "var(--lime)" }}>Pré-visualização</div>
            <span className="chip chip-gold" style={{ fontSize: "0.6rem" }}>16 anos · Promessa</span>
          </div>
          <div className="creator-stage">
            <div className="stage-ring" />
            <div className="stage-floor" />
            <CharacterImage
              appearance={appearance}
              kit={kit}
              number={shirtNumber}
              mode="full"
              alt={fullName}
            />
          </div>
          <div className="creator-name-preview">
            <div className="n">{fullName}</div>
            <div className="s">
              {POSITION_LABEL[position]} · {COUNTRIES.find((c) => c.code === nationality)?.flag} {COUNTRIES.find((c) => c.code === nationality)?.name}
            </div>
          </div>
          <div className="panel" style={{ marginTop: 12, padding: 12 }}>
            <div className="inline-6" style={{ marginBottom: 8 }}>
              <Crest clubId={clubId} size="sm" />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: "0.76rem", fontWeight: 700 }}>{club.name}</div>
                <div style={{ fontSize: "0.6rem", color: "var(--muted-2)" }}>{league?.name} · {club.city}</div>
              </div>
              <span className="chip chip-lime" style={{ marginLeft: "auto", fontSize: "0.6rem" }}>{club.overall} OVR</span>
            </div>
            <div className="bars-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <div className="bar-block">
                <div className="bb-top"><span className="bb-label">Potencial</span><span className="bb-value">Alto</span></div>
                <div className="bar bar-lime"><span style={{ width: "86%" }} /></div>
              </div>
              <div className="bar-block">
                <div className="bb-top"><span className="bb-label">Reputação</span><span className="bb-value">Iniciante</span></div>
                <div className="bar bar-gold"><span style={{ width: "8%" }} /></div>
              </div>
            </div>
          </div>
          <div className="scout-line" style={{ marginTop: 10 }}>
            <Sparkles size={14} style={{ color: "var(--gold)", flexShrink: 0 }} />
            <span>
              Vais começar na formação, com contrato de promessa. Os teus atributos e potencial são gerados
              com base na posição e no clube escolhido.
            </span>
          </div>
        </aside>

        <div className="creator-form">
          <section className="form-section">
            <h3><UserRound size={16} /> Identidade</h3>
            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="firstName">Primeiro nome</label>
                <input
                  id="firstName"
                  className="input"
                  value={firstName}
                  maxLength={16}
                  placeholder="Ex.: Diogo"
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="form-field">
                <label htmlFor="lastName">Apelido</label>
                <input
                  id="lastName"
                  className="input"
                  value={lastName}
                  maxLength={18}
                  placeholder="Ex.: Cardoso"
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
              <div className="form-field">
                <label htmlFor="nationality">Nacionalidade</label>
                <select
                  id="nationality"
                  className="select"
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                >
                  {COUNTRIES.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.flag} {country.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label htmlFor="shirtNumber">Número preferido</label>
                <input
                  id="shirtNumber"
                  className="input"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={99}
                  value={shirtNumber}
                  onChange={(e) => setShirtNumber(Number(e.target.value))}
                />
              </div>
              <div className="form-field">
                <label>Pé dominante</label>
                <div className="seg">
                  <button type="button" className={foot === "right" ? "active" : ""} onClick={() => setFoot("right")}>
                    Direito
                  </button>
                  <button type="button" className={foot === "left" ? "active" : ""} onClick={() => setFoot("left")}>
                    Esquerdo
                  </button>
                </div>
              </div>
              <div className="form-field" style={{ justifyContent: "flex-end" }}>
                <label>&nbsp;</label>
                <button type="button" className="btn btn-ghost" onClick={randomName}>
                  <Dices size={15} /> Sugerir nome
                </button>
              </div>
            </div>
          </section>

          <section className="form-section">
            <h3><Shirt size={16} /> Posição</h3>
            <div className="option-grid" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
              {POSITIONS.map((code) => (
                <button
                  key={code}
                  type="button"
                  className={`option-chip ${position === code ? "active" : ""}`}
                  onClick={() => setPosition(code)}
                  title={POSITION_LABEL[code]}
                >
                  {code}
                </button>
              ))}
            </div>
            <div className="small-note" style={{ marginTop: 8 }}>
              {POSITION_LABEL[position]} — o Overall e o estilo de jogo são calculados a partir desta posição.
            </div>
          </section>

          <section className="form-section">
            <h3><Sparkles size={16} /> Aparência</h3>
            <div className="form-field full" style={{ marginBottom: 12 }}>
              <label>Rosto base (13 personagens disponíveis)</label>
              <div className="option-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(88px, 1fr))" }}>
                {BASE_FACES.map((face) => (
                  <button
                    key={face.id}
                    type="button"
                    className={`option-chip face-option ${appearance.baseId === face.id ? "active" : ""}`}
                    onClick={() => set("baseId", face.id)}
                    aria-label={`${face.label}, selecionar rosto base`}
                    aria-pressed={appearance.baseId === face.id}
                  >
                    <img
                      src={`/assets/characters/base/${face.id}.png`}
                      alt=""
                      loading="lazy"
                      draggable={false}
                    />
                    {face.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-grid">
              <div className="form-field full">
                <label>Tom de pele</label>
                <div className="swatch-grid">
                  {SKIN_TONES.map((tone) => (
                    <button
                      key={tone.id}
                      type="button"
                      className={`swatch ${appearance.skin === tone.hex ? "active" : ""}`}
                      style={{ background: tone.hex }}
                      onClick={() => set("skin", tone.hex)}
                      aria-label={tone.label}
                      title={tone.label}
                    />
                  ))}
                </div>
              </div>
              <div className="form-field">
                <label htmlFor="hairStyle">Penteado</label>
                <select
                  id="hairStyle"
                  className="select"
                  value={appearance.hairStyle}
                  onChange={(e) => set("hairStyle", e.target.value)}
                >
                  {HAIR_STYLES.map((style) => (
                    <option key={style.id} value={style.id}>{style.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label>Cor do cabelo</label>
                <select
                  className="select"
                  value={appearance.hairColor}
                  onChange={(e) => set("hairColor", e.target.value)}
                >
                  {HAIR_COLORS.map((color) => (
                    <option key={color.id} value={color.hex}>{color.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-field full">
                <label>Cor do cabelo (paleta rápida)</label>
                <div className="swatch-grid" style={{ gridTemplateColumns: "repeat(13, minmax(0, 1fr))" }}>
                  {HAIR_COLORS.map((color) => (
                    <button
                      key={color.id}
                      type="button"
                      className={`swatch ${appearance.hairColor === color.hex ? "active" : ""}`}
                      style={{ background: color.hex }}
                      onClick={() => set("hairColor", color.hex)}
                      aria-label={color.label}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>
              <div className="form-field">
                <label htmlFor="eyeColor">Cor dos olhos</label>
                <select
                  id="eyeColor"
                  className="select"
                  value={appearance.eyeColor}
                  onChange={(e) => set("eyeColor", e.target.value)}
                >
                  {EYE_COLORS.map((color) => (
                    <option key={color.id} value={color.hex}>{color.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label htmlFor="accessory">Acessório</label>
                <select
                  id="accessory"
                  className="select"
                  value={appearance.accessory}
                  onChange={(e) => set("accessory", e.target.value as Appearance["accessory"])}
                >
                  {ACCESSORY_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-field full">
                <label>Sobrancelhas</label>
                <div className="seg">
                  {BROW_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={appearance.brow === option.id ? "active" : ""}
                      onClick={() => set("brow", option.id)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-field">
                <label>Altura</label>
                <div className="seg">
                  <button type="button" className={appearance.height === -1 ? "active" : ""} onClick={() => set("height", -1)}>
                    Baixo
                  </button>
                  <button type="button" className={appearance.height === 0 ? "active" : ""} onClick={() => set("height", 0)}>
                    Médio
                  </button>
                  <button type="button" className={appearance.height === 1 ? "active" : ""} onClick={() => set("height", 1)}>
                    Alto
                  </button>
                </div>
              </div>
              <div className="form-field">
                <label>Físico</label>
                <div className="seg">
                  <button type="button" className={appearance.build === -1 ? "active" : ""} onClick={() => set("build", -1)}>
                    Leve
                  </button>
                  <button type="button" className={appearance.build === 0 ? "active" : ""} onClick={() => set("build", 0)}>
                    Normal
                  </button>
                  <button type="button" className={appearance.build === 1 ? "active" : ""} onClick={() => set("build", 1)}>
                    Forte
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="form-section">
            <h3><Shirt size={16} /> Clube inicial</h3>
            <div className="club-picker">
              {START_CLUBS.map((id) => {
                const startClub = getClub(id);
                return (
                  <button
                    key={id}
                    type="button"
                    className={`club-option ${clubId === id ? "active" : ""}`}
                    onClick={() => setClubId(id)}
                  >
                    <Crest clubId={id} size="sm" />
                    <span style={{ minWidth: 0 }}>
                      <span className="co-name" style={{ display: "block" }}>{startClub.name}</span>
                      <span className="co-meta">{startClub.city} · {startClub.overall} OVR</span>
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="small-note" style={{ marginTop: 8 }}>
              Todos os clubes desta lista competem na Liga Formação. Começas como promessa desconhecida.
            </div>
          </section>

          {error ? <div className="chip chip-red" style={{ padding: "10px 12px" }}>{error}</div> : null}

          <div className="creator-actions">
            <button type="button" className="btn btn-ghost" onClick={onBack}>
              <ArrowLeft size={15} /> Voltar
            </button>
            <button type="button" className="btn btn-primary" onClick={submit}>
              <Check size={16} /> Começar carreira
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
