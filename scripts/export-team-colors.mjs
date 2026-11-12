// Exporta o mapa de cores/uniformes tal como o jogo os calcula.
// Replica hash(), PATTERNS e kitForClub()/kitForNational() de src/game/data/appearance.ts
import { readFileSync, writeFileSync } from "node:fs";

const DARK = "#0b1220";
const LIGHT = "#f8fafc";
const PATTERNS = ["solid", "stripes", "halves", "sash", "hoops"];

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}
function isLight(hex) {
  const c = hex.replace("#", "");
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150;
}
function kitForClub(club, variant = "home") {
  const h = hash(club.id);
  const { primary, secondary, accent } = club.colors;
  if (variant === "gk") {
    const pal = ["#22d3ee", "#a3e635", "#f59e0b", "#c084fc", "#f472b6"];
    const shirt = pal[h % pal.length];
    return { pattern: "solid", primary: shirt, secondary: DARK, shorts: DARK, socks: shirt, trim: LIGHT, number: isLight(shirt) ? DARK : LIGHT };
  }
  let shirt = primary, alt = secondary, shorts = secondary, socks = primary;
  let pattern = PATTERNS[h % PATTERNS.length];
  if (variant === "away") {
    shirt = secondary; alt = primary; shorts = primary; socks = secondary;
    pattern = isLight(secondary) ? "solid" : "stripes";
    if (primary === LIGHT && secondary === LIGHT) shirt = accent;
  }
  if (variant === "third") {
    shirt = accent; alt = isLight(shirt) ? DARK : LIGHT; shorts = DARK; socks = accent; pattern = "sash";
  }
  if (isLight(shirt) && isLight(alt) && Math.abs(h % 3) === 0) shirt = accent;
  return { pattern, primary: shirt, secondary: alt, shorts, socks, trim: isLight(shirt) ? DARK : LIGHT, number: isLight(shirt) ? DARK : LIGHT };
}
function kitForNational(country, variant = "home") {
  const [primary, secondary] = country.colors;
  const shirt = variant === "home" ? primary : secondary;
  const alt = variant === "home" ? secondary : primary;
  return { pattern: variant === "home" ? "stripes" : "solid", primary: shirt, secondary: alt, shorts: alt, socks: shirt, trim: isLight(shirt) ? DARK : LIGHT, number: isLight(shirt) ? DARK : LIGHT };
}

const src = readFileSync("src/game/data/clubs.ts", "utf8");
const seedRe = /\[\s*"([a-z0-9-]+)",\s*"([^"]+)",\s*"([^"]+)",\s*"([^"]+)",\s*\d+,\s*\d+,\s*"(#[0-9a-fA-F]{6})",\s*"(#[0-9a-fA-F]{6})",\s*"(#[0-9a-fA-F]{6})"/g;
const leagueOf = {};
for (const m of src.matchAll(/const (POR1|POR2|POR3|ENG1|ESP1): ClubSeed\[\]/g)) leagueOf[m[1]] = m[1].toLowerCase();
const blocks = src.split(/const (POR1|POR2|POR3|ENG1|ESP1): ClubSeed\[\] = \[/);
const clubs = [];
for (let i = 1; i < blocks.length; i += 2) {
  const league = blocks[i].toLowerCase();
  for (const m of blocks[i + 1].matchAll(seedRe)) {
    clubs.push({ id: m[1], name: m[2], short: m[3], city: m[4], league, colors: { primary: m[5], secondary: m[6], accent: m[7] } });
  }
}
const cSrc = readFileSync("src/game/data/countries.ts", "utf8");
const countries = [...cSrc.matchAll(/\{\s*code:\s*"([A-Z]{3})",\s*name:\s*"([^"]+)",\s*flag:\s*"[^"]*",\s*colors:\s*\["([^"]+)",\s*"([^"]+)"\]/g)]
  .map((m) => ({ code: m[1], name: m[2], colors: [m[3], m[4]] }));

const out = {
  generatedFrom: "src/game/data/{clubs,countries}.ts + appearance.ts (hash/PATTERNS)",
  dark: DARK, light: LIGHT, patterns: PATTERNS,
  clubs: clubs.map((c) => ({ ...c, kits: { home: kitForClub(c, "home"), away: kitForClub(c, "away"), third: kitForClub(c, "third"), gk: kitForClub(c, "gk") } })),
  nations: countries.map((c) => ({ ...c, kits: { home: kitForNational(c, "home"), away: kitForNational(c, "away") } })),
};
writeFileSync("public/assets/config/team-kits.json", JSON.stringify(out, null, 2));

const hex = (k) => `${k.pattern.padEnd(8)} ${k.primary} ${k.secondary} ${k.shorts} ${k.socks}`;
let md = `# Mapa de cores e uniformes\n\nGerado a partir do código (não editar à mão).\n\n- Escuro: \`${DARK}\` | Claro: \`${LIGHT}\`\n- Padrões: ${PATTERNS.join(", ")}\n\n`;
for (const league of ["por1", "por2", "por3", "eng1", "esp1"]) {
  md += `## ${league.toUpperCase()}\n\n| Clube | ID | Escudo | Camisola (primary) | Detalhe (secondary) | Calções | Meias | Padrão |\n|---|---|---|---|---|---|---|---|\n`;
  for (const c of out.clubs.filter((c) => c.league === league)) {
    const k = c.kits.home;
    md += `| ${c.name} | \`${c.id}\` | ${c.short} | \`${k.primary}\` | \`${k.secondary}\` | \`${k.shorts}\` | \`${k.socks}\` | ${k.pattern} |\n`;
  }
  md += "\n";
}
md += `## Seleções\n\n| País | Código | Casa | Fora |\n|---|---|---|---|\n`;
for (const n of out.nations) md += `| ${n.flag ?? ""} ${n.name} | \`${n.code}\` | \`${n.kits.home.primary}\` / \`${n.kits.home.secondary}\` | \`${n.kits.away.primary}\` / \`${n.kits.away.secondary}\` |\n`;
writeFileSync("docs/mapa-de-cores.md", md);
console.log(`clubes: ${clubs.length} | seleções: ${countries.length}`);
console.log("home sample:", clubs[0].name, hex(kitForClub(clubs[0], "home")));
