import { useState } from "react";
import {
  BookOpen,
  ChevronRight,
  FolderOpen,
  Gamepad2,
  Info,
  Play,
  Settings as SettingsIcon,
  Sparkles,
  Trash2,
  Trophy,
  Volume2,
  VolumeX,
  Vibrate,
  X,
} from "lucide-react";
import type { SaveSlotMeta } from "../game/types";
import { CharacterImage } from "../components/CharacterArt";
import { Modal } from "../components/ui";
import type { Appearance, Kit } from "../game/types";

const MASCOT_APPEARANCE: Appearance = {
  baseId: "base_05",
  skin: "#D9895A",
  hairStyle: "casual_13",
  hairColor: "#1B1514",
  brow: "natural",
  eyeColor: "#5B3A1E",
  accessory: "headband",
  height: 0,
  build: 0,
};

const MASCOT_KIT: Kit = {
  pattern: "stripes",
  primary: "#f5c451",
  secondary: "#0a1528",
  shorts: "#0a1528",
  socks: "#f5c451",
  trim: "#f8fafc",
  number: "#0a1528",
  gk: false,
};

export interface GameSettings {
  sound: boolean;
  haptics: boolean;
  reducedMotion: boolean;
}

export function MainMenu({
  saves,
  latestAppearance,
  latestKit,
  hasSave,
  onContinue,
  onNew,
  onLoad,
  onDeleteSave,
  settings,
  onSettingsChange,
}: {
  saves: SaveSlotMeta[];
  latestAppearance?: Appearance;
  latestKit?: Kit;
  hasSave: boolean;
  onContinue: () => void;
  onNew: () => void;
  onLoad: (id: string) => void;
  onDeleteSave: (id: string) => void;
  settings: GameSettings;
  onSettingsChange: (settings: GameSettings) => void;
}) {
  const [loadOpen, setLoadOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [creditsOpen, setCreditsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <div className="menu-root">
      <div className="menu-stadium">
        <div className="floodlight left" />
        <div className="floodlight right" />
        <div className="menu-crowd" />
      </div>

      <div className="menu-content">
        <div className="menu-topbar">
          <div className="brand-mark">
            <span className="brand-ball" />
            <div>
              <div className="kicker" style={{ letterSpacing: "0.3em" }}>To be a Legend</div>
              <div style={{ fontSize: "0.58rem", color: "var(--muted-2)", letterSpacing: "0.18em", textTransform: "uppercase" }}>
                Football Player Career
              </div>
            </div>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSettingsOpen(true)}>
            <SettingsIcon size={14} /> Definições
          </button>
        </div>

        <div className="menu-hero">
          <div>
            <div className="menu-logo">
              <div className="pre">A tua história. O teu legado.</div>
              <h1>
                To be a<br />
                <span className="gold">Legend</span>
              </h1>
            </div>
            <p className="menu-tagline">
              Nasce numa academia, conquista o balneário e escreve o teu nome na história do futebol.
              Um jogo de carreira individual: só tu, a bola e as decisões que te tornam lendário.
            </p>
            <div className="menu-badge-row">
              <div className="menu-stat"><Trophy size={13} /> Carreira individual</div>
              <div className="menu-stat"><Sparkles size={13} /> 50 clubes · 5 ligas</div>
              <div className="menu-stat"><Gamepad2 size={13} /> 2D · toque total</div>
            </div>
            <div className="menu-actions">
              {hasSave ? (
                <button type="button" className="btn-menu primary" onClick={onContinue}>
                  <span className="b-icon"><Play size={17} fill="currentColor" /></span>
                  Continuar Carreira
                  <span className="b-sub">Retomar</span>
                </button>
              ) : null}
              <button type="button" className={hasSave ? "btn-menu" : "btn-menu primary"} onClick={onNew}>
                <span className="b-icon"><Sparkles size={17} /></span>
                Novo Jogo
                <span className="b-sub">Criar jogador</span>
              </button>
              <button type="button" className="btn-menu" onClick={() => setLoadOpen(true)}>
                <span className="b-icon"><FolderOpen size={17} /></span>
                Carregar Carreira
                <span className="b-sub">{saves.length} save{saves.length === 1 ? "" : "s"}</span>
              </button>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => setHelpOpen(true)}>
                  <BookOpen size={14} /> Como jogar
                </button>
                <button type="button" className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => setCreditsOpen(true)}>
                  <Info size={14} /> Créditos
                </button>
              </div>
            </div>
          </div>

          <div className="menu-figure">
            <div className="halo" />
            <div className="ring" />
            <div className="ring r2" />
            <img className="ball-float" src="/assets/props/ball.png" alt="" aria-hidden="true" />
            <CharacterImage
              appearance={latestAppearance ?? MASCOT_APPEARANCE}
              kit={latestKit ?? MASCOT_KIT}
              number={10}
              mode="full"
              className="menu-character"
              alt="Jogador principal"
            />
            <div className="pedestal" />
          </div>
        </div>

        <div className="menu-footer">
          <span>To be a Legend · v{__APP_VERSION__}</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <ChevronRight size={12} /> Desliza e toca. Sem analógico.
          </span>
        </div>
      </div>

      <Modal open={loadOpen} onClose={() => setLoadOpen(false)} width={520}>
        <div className="row-between" style={{ marginBottom: 14 }}>
          <div>
            <div className="kicker">Carreiras guardadas</div>
            <h2 className="display" style={{ fontSize: "1.7rem", margin: "4px 0 0" }}>Carregar</h2>
          </div>
          <button type="button" className="icon-btn-plain" onClick={() => setLoadOpen(false)} aria-label="Fechar">
            <X size={15} />
          </button>
        </div>
        {saves.length === 0 ? (
          <div className="empty-state">
            <div className="es-icon"><FolderOpen size={20} /></div>
            Ainda não tens carreiras guardadas. Cria o teu primeiro jogador.
          </div>
        ) : (
          saves.map((save) => (
            <div className="save-row" key={save.id}>
              <div className="sr-main">
                <div className="sr-name">{save.name}</div>
                <div className="sr-meta">
                  {save.position} · {save.club} · {save.seasonLabel} · {save.overall} OVR · {save.age} anos
                </div>
              </div>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setLoadOpen(false);
                  onLoad(save.id);
                }}
              >
                Carregar
              </button>
              <button
                type="button"
                className="icon-btn-plain"
                aria-label="Apagar carreira"
                onClick={() => {
                  if (confirm(`Apagar a carreira de ${save.name}?`)) onDeleteSave(save.id);
                }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </Modal>

      <Modal open={settingsOpen} onClose={() => setSettingsOpen(false)} width={460}>
        <div className="kicker">Definições</div>
        <h2 className="display" style={{ fontSize: "1.8rem", margin: "4px 0 14px" }}>Jogo</h2>
        <div className="stack-8">
          <button
            type="button"
            className="btn btn-ghost"
            style={{ justifyContent: "space-between" }}
            onClick={() => onSettingsChange({ ...settings, sound: !settings.sound })}
          >
            <span className="inline-6">{settings.sound ? <Volume2 size={16} /> : <VolumeX size={16} />} Som</span>
            <span className={settings.sound ? "chip chip-lime" : "chip"}>{settings.sound ? "Ligado" : "Desligado"}</span>
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            style={{ justifyContent: "space-between" }}
            onClick={() => onSettingsChange({ ...settings, haptics: !settings.haptics })}
          >
            <span className="inline-6"><Vibrate size={16} /> Vibração</span>
            <span className={settings.haptics ? "chip chip-lime" : "chip"}>{settings.haptics ? "Ligada" : "Desligada"}</span>
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            style={{ justifyContent: "space-between" }}
            onClick={() => onSettingsChange({ ...settings, reducedMotion: !settings.reducedMotion })}
          >
            <span className="inline-6"><Sparkles size={16} /> Reduzir animações</span>
            <span className={settings.reducedMotion ? "chip chip-lime" : "chip"}>{settings.reducedMotion ? "Sim" : "Não"}</span>
          </button>
        </div>
        <p className="small-note" style={{ marginTop: 14 }}>
          O jogo funciona offline. O progresso fica guardado neste dispositivo automaticamente após cada ação.
        </p>
        <button type="button" className="btn btn-primary btn-block" style={{ marginTop: 16 }} onClick={() => setSettingsOpen(false)}>
          Concluído
        </button>
      </Modal>

      <Modal open={helpOpen} onClose={() => setHelpOpen(false)} width={560}>
        <div className="kicker">Manual rápido</div>
        <h2 className="display" style={{ fontSize: "1.8rem", margin: "4px 0 12px" }}>Como jogar</h2>
        <div className="stack-8" style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
          <p style={{ margin: 0 }}><b className="gold-text">Simulação:</b> a equipa joga sozinha. Quando recebes a bola, o jogo congela e decides.</p>
          <p style={{ margin: 0 }}><b className="gold-text">Toca num companheiro</b> para passe rasteiro. <b className="gold-text">Duplo toque</b> para passe aéreo.</p>
          <p style={{ margin: 0 }}><b className="gold-text">Toca no relvado</b> para conduzir a bola até esse ponto.</p>
          <p style={{ margin: 0 }}><b className="gold-text">Arrasta o dedo</b> desde a tua posição até à baliza para rematar. A direção e a força do gesto contam.</p>
          <p style={{ margin: 0 }}><b className="gold-text">Sem a bola</b>, desliza o dedo na direção do adversário com bola para fazer um desarme.</p>
          <p style={{ margin: 0 }}><b className="gold-text">Treino semanal:</b> escolhe o foco e a intensidade para evoluir os atributos. Gere pontos de evolução e gasta-os no separador Evolução.</p>
          <p style={{ margin: 0 }}><b className="gold-text">Carreira:</b> joga, marca, sobe de divisão, recebe propostas e constrói uma lenda.</p>
        </div>
        <button type="button" className="btn btn-primary btn-block" style={{ marginTop: 16 }} onClick={() => setHelpOpen(false)}>
          Entendido
        </button>
      </Modal>

      <Modal open={creditsOpen} onClose={() => setCreditsOpen(false)} width={520}>
        <div className="kicker">Créditos</div>
        <h2 className="display" style={{ fontSize: "1.8rem", margin: "4px 0 12px" }}>To be a Legend</h2>
        <p className="small-note" style={{ lineHeight: 1.7 }}>
          Jogo de carreira individual de futebol 2D. Conceito e direção: To be a Legend.
          <br /><br />
          Personagens chibi e biblioteca de cabelos: pacote de assets 2D fornecido pelo projeto (13 personagens base, 40 penteados e rig de 4 peças).
          Equipamentos, padrões de camisola e uniformes gerados proceduralmente sobre as camadas originais.
          <br /><br />
          Campograma, estádio, HUD e navegação desenhados para este jogo. Ícones: Lucide. Tipografia: Barlow Condensed e Inter (incluídas no bundle, funcionamento offline).
          <br /><br />
          Motor de jogo: React + HTML5 Canvas 2D, sem dependências de simulação externas.
        </p>
        <button type="button" className="btn btn-primary btn-block" style={{ marginTop: 16 }} onClick={() => setCreditsOpen(false)}>
          Fechar
        </button>
      </Modal>
    </div>
  );
}
