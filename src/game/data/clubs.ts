import type { Club, League } from "../types";

export const LEAGUES: League[] = [
  {
    id: "por1",
    name: "Liga Principal",
    short: "LIGA PT",
    country: "POR",
    tier: 1,
    color: "#f5c451",
    prize: 2_800_000,
    reputation: 82,
    description: "O topo do futebol português. Estádios cheios, exigência máxima.",
  },
  {
    id: "por2",
    name: "Liga Promessa",
    short: "LIGA 2",
    country: "POR",
    tier: 2,
    color: "#38bdf8",
    prize: 700_000,
    reputation: 67,
    description: "A montra dos jovens talentos e a última paragem antes da elite.",
  },
  {
    id: "por3",
    name: "Liga Formação",
    short: "LIGA 3",
    country: "POR",
    tier: 3,
    color: "#4ade80",
    prize: 180_000,
    reputation: 54,
    description: "Onde tudo começa. Academias, campos relvados e sonhos grandes.",
  },
  {
    id: "eng1",
    name: "Premier Division",
    short: "PREMIER",
    country: "ENG",
    tier: 1,
    color: "#c084fc",
    prize: 9_500_000,
    reputation: 92,
    description: "A liga mais mediática do mundo. Futebol rápido e brutal.",
  },
  {
    id: "esp1",
    name: "La División",
    short: "LA DIV",
    country: "ESP",
    tier: 1,
    color: "#f87171",
    prize: 8_200_000,
    reputation: 90,
    description: "Tiki-taka, técnica e palcos lendários.",
  },
];

export const LEAGUE_MAP: Record<string, League> = Object.fromEntries(LEAGUES.map((l) => [l.id, l]));

type ClubSeed = [
  id: string,
  name: string,
  short: string,
  city: string,
  overall: number,
  reputation: number,
  primary: string,
  secondary: string,
  accent: string,
  stadium: string,
  coach: string,
];

const POR1: ClubSeed[] = [
  ["atl-lisboa", "Atlético Lisboa", "ATL", "Lisboa", 84, 88, "#c8102e", "#f8fafc", "#f5c451", "Estádio da Luz Nova", "Álvaro Pinheiro"],
  ["porto-atl", "Porto Atlântico", "POR", "Porto", 83, 87, "#1e40af", "#f8fafc", "#f5c451", "Arena do Douro", "Nuno Salgado"],
  ["real-sintra", "Real Sintra", "SIN", "Sintra", 80, 79, "#6d28d9", "#f8fafc", "#f5c451", "Serra Park", "Marco Vinícius"],
  ["braga-uniao", "Braga União", "BRA", "Braga", 79, 78, "#dc2626", "#f8fafc", "#111827", "Estádio do Minho", "Paulo Cerqueira"],
  ["tejo-fc", "Clube do Tejo", "TEJ", "Lisboa", 77, 74, "#0f766e", "#f8fafc", "#f5c451", "Tejo Arena", "Rui Belém"],
  ["vitoriano", "Vitoriano FC", "VIT", "Setúbal", 76, 70, "#065f46", "#f8fafc", "#f5c451", "Bonfim Stadium", "Carlos Neves"],
  ["acad-norte", "Académica do Norte", "ACN", "Coimbra", 74, 67, "#111827", "#f8fafc", "#f5c451", "Cidade Académica", "João Trindade"],
  ["estrela-alg", "Estrela do Algarve", "EAL", "Faro", 73, 64, "#7c2d12", "#fde68a", "#0f172a", "Algarve Sun", "Pedro Viegas"],
  ["leca-atl", "Leça Atlético", "LEC", "Matosinhos", 72, 60, "#1d4ed8", "#f8fafc", "#f97316", "Leça Park", "Mário Bastos"],
  ["maritimo-ins", "Marítimo Insular", "MAR", "Funchal", 71, 62, "#065f46", "#dc2626", "#f8fafc", "Ilha Arena", "Sérgio Andrade"],
];

const POR2: ClubSeed[] = [
  ["beiras-cd", "CD das Beiras", "BEI", "Viseu", 70, 59, "#166534", "#f8fafc", "#facc15", "Campo das Beiras", "Hélder Matos"],
  ["alentejo-fc", "Alentejo FC", "ALE", "Évora", 69, 56, "#7f1d1d", "#f8fafc", "#facc15", "Planície Arena", "Vítor Calado"],
  ["ribatejo-sp", "Ribatejo Sport", "RIB", "Santarém", 68, 55, "#0c4a6e", "#f8fafc", "#38bdf8", "Tejo Sul", "Fernando Brás"],
  ["aveiro-nau", "Aveiro Náutico", "AVE", "Aveiro", 68, 54, "#0284c7", "#f8fafc", "#111827", "Ria Stadium", "Luís Bento"],
  ["coimbra-univ", "Coimbra Universitário", "CUN", "Coimbra", 67, 53, "#111827", "#f8fafc", "#f5c451", "Estádio da Sé", "Rogério Nunes"],
  ["guimaraes-real", "Guimarães Real", "GUI", "Guimarães", 66, 55, "#f8fafc", "#1e40af", "#f5c451", "Berço Arena", "André Faria"],
  ["fafe-atl", "Fafe Atlético", "FAF", "Fafe", 65, 50, "#b91c1c", "#f8fafc", "#111827", "Fafe Municipal", "Zé Carlos"],
  ["viseu-fc", "Viseu FC", "VIS", "Viseu", 65, 49, "#ca8a04", "#111827", "#f8fafc", "Fontelo Park", "Ricardo Sá"],
  ["portimao-mar", "Portimão Mar", "PTM", "Portimão", 64, 48, "#0891b2", "#f8fafc", "#facc15", "Praia Arena", "Bruno Tavares"],
  ["setubal-costa", "Setúbal Costa", "SET", "Setúbal", 63, 46, "#15803d", "#f8fafc", "#f5c451", "Costa Verde", "Nuno Faísca"],
];

/** Clubs where a 16-year-old can start. */
const POR3: ClubSeed[] = [
  ["acad-futuro", "Academia do Futuro", "AFU", "Lisboa", 58, 46, "#0f766e", "#f8fafc", "#facc15", "Campo 1 da Academia", "Nuno Lobo"],
  ["escola-talentos", "Escola de Talentos", "ETA", "Porto", 57, 44, "#7c3aed", "#f8fafc", "#facc15", "Talento Park", "Ivo Magalhães"],
  ["gd-bairro", "GD Bairro Alto", "BAI", "Lisboa", 56, 42, "#b91c1c", "#f8fafc", "#111827", "Campo do Bairro", "Chico Rocha"],
  ["lusitano-juv", "Lusitano Juvenil", "LUS", "Leiria", 55, 40, "#166534", "#facc15", "#f8fafc", "Lusitano Campus", "Fernando Reis"],
  ["seixal-form", "Seixal Formação", "SEI", "Seixal", 55, 43, "#1d4ed8", "#f8fafc", "#facc15", "Seixal Soccer Park", "Rui Barreto"],
  ["minho-academy", "Minho Academy", "MIN", "Braga", 54, 39, "#0e7490", "#ffffff", "#111827", "Minho Training Ground", "Paulo Serra"],
  ["estoril-form", "Estoril Formação", "EST", "Estoril", 53, 38, "#facc15", "#1e3a8a", "#ffffff", "Estoril Campo 2", "André Fonseca"],
  ["olhao-sc", "Olhão SC", "OLH", "Olhão", 52, 36, "#0f766e", "#f8fafc", "#f97316", "Olhão Arena", "Válter Pires"],
  ["beira-acad", "Beira Academia", "BEA", "Covilhã", 51, 34, "#7f1d1d", "#f8fafc", "#facc15", "Serra Campo", "Domingos Alves"],
  ["nova-sintra", "Nova Sintra", "NSI", "Sintra", 50, 33, "#4338ca", "#f8fafc", "#facc15", "Nova Relva", "Sérgio Palma"],
];

const ENG1: ClubSeed[] = [
  ["london-ath", "London Athletic", "LON", "London", 89, 93, "#1e40af", "#f8fafc", "#f5c451", "Crown Stadium", "James Whitmore"],
  ["manchester-reds", "Manchester Reds", "MAN", "Manchester", 87, 92, "#dc2626", "#f8fafc", "#111827", "North Gate", "Rob Keane"],
  ["mersey-fc", "Mersey FC", "MER", "Liverpool", 85, 90, "#0ea5e9", "#f8fafc", "#111827", "Dockside Park", "Sean Doyle"],
  ["thames-rovers", "Thames Rovers", "THA", "London", 84, 86, "#f8fafc", "#111827", "#dc2626", "Riverside Bowl", "Mark Ellis"],
  ["newcastle-north", "Newcastle North", "NEW", "Newcastle", 82, 82, "#111827", "#f8fafc", "#f5c451", "Coal Arena", "Alan Bruce"],
  ["yorkshire-utd", "Yorkshire United", "YOR", "Leeds", 80, 78, "#f8fafc", "#1e40af", "#f5c451", "White Rose Park", "Paul Hart"],
  ["midlands-fc", "Midlands FC", "MID", "Birmingham", 79, 75, "#7c3aed", "#f8fafc", "#f5c451", "Midlands Arena", "Dean Cooper"],
  ["brighton-coast", "Brighton Coast", "BRI", "Brighton", 77, 72, "#0ea5e9", "#f8fafc", "#111827", "Coast Stadium", "Graham Pike"],
  ["bristol-harb", "Bristol Harbour", "BRS", "Bristol", 76, 69, "#dc2626", "#f8fafc", "#111827", "Harbour Ground", "Lee Stanton"],
  ["leeds-white", "Leeds White", "LEE", "Leeds", 74, 66, "#f8fafc", "#111827", "#f5c451", "Elland Park", "Neil Dawson"],
];

const ESP1: ClubSeed[] = [
  ["madrid-blanco", "Madrid Blanco", "MAD", "Madrid", 90, 95, "#f8fafc", "#f5c451", "#111827", "Estadio Central", "Sergio Arnau"],
  ["barcelona-blau", "Barcelona Blau", "BAR", "Barcelona", 88, 94, "#1e40af", "#dc2626", "#f5c451", "Camp Blau", "Pep Ferrer"],
  ["sevilla-sur", "Sevilla Sur", "SEV", "Sevilla", 84, 84, "#f8fafc", "#dc2626", "#111827", "Sur Arena", "Manolo Prieto"],
  ["atletico-rojo", "Atlético Rojo", "ATR", "Madrid", 84, 85, "#dc2626", "#f8fafc", "#111827", "Metropolitano Nuevo", "Diego Marín"],
  ["valencia-nar", "Valencia Naranja", "VAL", "Valencia", 82, 80, "#f97316", "#111827", "#f8fafc", "Mestalla Nueva", "Voro Pérez"],
  ["bilbao-norte", "Bilbao Norte", "BIL", "Bilbao", 81, 78, "#dc2626", "#f8fafc", "#111827", "Norte Arena", "Iñaki Landa"],
  ["villarreal-am", "Villarreal Amarillo", "VIL", "Villarreal", 80, 75, "#facc15", "#1e40af", "#f8fafc", "Amarillo Park", "Xavi Soler"],
  ["sociedad-real", "Sociedad Real", "SOC", "San Sebastián", 79, 74, "#1e40af", "#f8fafc", "#f5c451", "Bahía Stadium", "Aitor Zubia"],
  ["girona-costa", "Girona Costa", "GIR", "Girona", 78, 70, "#f8fafc", "#dc2626", "#f5c451", "Costa Brava", "Oriol Mas"],
  ["zaragoza-leon", "Zaragoza León", "ZAR", "Zaragoza", 75, 68, "#f8fafc", "#1e40af", "#111827", "León Arena", "Javier Luna"],
];

const TACTICS = ["4-3-3 Ofensivo", "4-2-3-1 Equilibrado", "4-4-2 Compacto", "3-5-2 Pressão Alta", "4-3-3 Posse"];
const FOUNDED = [1921, 1934, 1908, 1947, 1919, 1962, 1928, 1955, 1941, 1973];

function buildClubs(seeds: ClubSeed[], leagueId: string, country: string): Club[] {
  return seeds.map((s, i) => {
    const [id, name, short, city, overall, reputation, primary, secondary, accent, stadium, coach] = s;
    return {
      id,
      name,
      short,
      city,
      country,
      leagueId,
      overall,
      reputation,
      stadium,
      budget: Math.round((overall - 45) * 900_000),
      coach,
      tactic: TACTICS[i % TACTICS.length],
      colors: { primary, secondary, accent },
      form: "V-E-D-V-V",
      founded: FOUNDED[i % FOUNDED.length] + (i % 3) * 2,
    };
  });
}

export const CLUBS: Club[] = [
  ...buildClubs(POR1, "por1", "POR"),
  ...buildClubs(POR2, "por2", "POR"),
  ...buildClubs(POR3, "por3", "POR"),
  ...buildClubs(ENG1, "eng1", "ENG"),
  ...buildClubs(ESP1, "esp1", "ESP"),
];

export const CLUB_MAP: Record<string, Club> = Object.fromEntries(CLUBS.map((c) => [c.id, c]));

export function getClub(id: string): Club {
  return CLUB_MAP[id] ?? CLUBS[0];
}

export function clubsInLeague(leagueId: string): Club[] {
  return CLUBS.filter((c) => c.leagueId === leagueId);
}

export const START_CLUBS = POR3.map((s) => s[0]);

export const FOREIGN_CLUB_IDS = [...ENG1.map((s) => s[0]), ...ESP1.map((s) => s[0])];

/** Initial league membership (mutated across seasons via career.clubLeagues). */
export const INITIAL_CLUB_LEAGUES: Record<string, string> = Object.fromEntries(
  CLUBS.map((c) => [c.id, c.leagueId]),
);

export function buildInitialClubLeagues(): Record<string, string> {
  return { ...INITIAL_CLUB_LEAGUES };
}
