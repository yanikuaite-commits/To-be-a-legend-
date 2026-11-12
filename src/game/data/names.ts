const LATIN_FIRST = [
  "João", "Diogo", "Rui", "Tiago", "André", "Bruno", "Gonçalo", "Miguel", "Pedro", "Rafael",
  "Sérgio", "Vasco", "Duarte", "Tomás", "Afonso", "Rodrigo", "Martim", "Guilherme", "Renato", "Hugo",
  "Gabriel", "Lucas", "Mateus", "Enzo", "Santiago", "Diego", "Thiago", "Felipe", "Caio", "Vinícius",
  "Alejandro", "Javier", "Sergio", "Álvaro", "Iker", "Pau", "Marc", "Nico", "Adrián", "Bruno",
];

const LATIN_LAST = [
  "Silva", "Costa", "Ferreira", "Pereira", "Oliveira", "Almeida", "Cardoso", "Sousa", "Rodrigues", "Martins",
  "Lopes", "Gomes", "Ribeiro", "Carvalho", "Teixeira", "Moreira", "Mendes", "Nunes", "Fonseca", "Machado",
  "Santos", "Lima", "Araújo", "Barbosa", "Rocha", "Dias", "Alves", "Monteiro", "Freitas", "Pinto",
  "García", "Martínez", "López", "Sánchez", "Romero", "Vargas", "Castro", "Ramos", "Ortega", "Navas",
];

const GERMANIC_FIRST = [
  "Lukas", "Jonas", "Felix", "Leon", "Maximilian", "Niklas", "Tim", "Jan", "Erik", "Moritz",
  "Sven", "Kai", "Lars", "Finn", "Noah", "Elias", "Oscar", "Hugo", "Arthur", "Louis",
  "Daan", "Bram", "Siem", "Tijn", "Milan", "Ruben", "Jamie", "Thomas", "James", "Harry",
];

const GERMANIC_LAST = [
  "Müller", "Schmidt", "Weber", "Wagner", "Becker", "Hoffmann", "Koch", "Richter", "Klein", "Wolf",
  "Neumann", "Schwarz", "Bauer", "Vogel", "Krüger", "Jansen", "van Dijk", "de Vries", "Bakker", "Visser",
  "Smith", "Johnson", "Williams", "Brown", "Taylor", "Wilson", "Walker", "Hughes", "Turner", "Ward",
];

const SLAVIC_FIRST = [
  "Luka", "Ivan", "Marko", "Nikola", "Petar", "Stefan", "Dusan", "Milan", "Andrej", "Mateo",
  "Kacper", "Jakub", "Szymon", "Ante", "Josip", "Toma", "Vuk", "Filip", "Goran", "Zoran",
];

const SLAVIC_LAST = [
  "Modrić", "Kovačić", "Perišić", "Brozović", "Jurić", "Marić", "Novak", "Horvat", "Knežević", "Vuković",
  "Petrović", "Jovanović", "Nikolić", "Ilić", "Marković", "Pavlović", "Zielinski", "Lewandowski", "Kowalski", "Nowak",
];

const AFRICAN_FIRST = [
  "Kwame", "Kofi", "Chidi", "Emeka", "Tunde", "Femi", "Sekou", "Amadou", "Moussa", "Ibrahima",
  "Youssef", "Rachid", "Karim", "Aziz", "Samuel", "Daniel", "Kingsley", "Mohammed", "Ali", "Abdoulaye",
];

const AFRICAN_LAST = [
  "Mensah", "Owusu", "Okafor", "Eze", "Adeyemi", "Balogun", "Diallo", "Traoré", "Koné", "Touré",
  "Keita", "Camara", "Benali", "Amrani", "El Amrani", "Hassan", "Obeng", "Boateng", "Sarr", "Ndiaye",
];

const ASIAN_FIRST = [
  "Haruto", "Yuto", "Ren", "Sota", "Riku", "Kaito", "Minjun", "Jihoon", "Seojun", "Takumi",
  "Hiroto", "Kenta", "Daichi", "Sho", "Yuki", "Ryo", "Kenji", "Jin", "Sungmin", "Taehyun",
];

const ASIAN_LAST = [
  "Tanaka", "Sato", "Suzuki", "Takahashi", "Watanabe", "Ito", "Yamamoto", "Nakamura", "Kobayashi", "Kato",
  "Kim", "Park", "Lee", "Choi", "Jung", "Kang", "Yoon", "Cho", "Hwang", "Seo",
];

const AMERICAN_FIRST = [
  "Tyler", "Mason", "Ethan", "Logan", "Austin", "Brandon", "Christian", "Jordan", "Cameron", "Hunter",
  "Diego", "Santiago", "Mateo", "Emiliano", "Joaquín", "Facundo", "Tomás", "Bruno", "Agustín", "Lautaro",
];

const AMERICAN_LAST = [
  "Miller", "Davis", "Anderson", "Thomas", "Moore", "Jackson", "White", "Harris", "Clark", "Lewis",
  "González", "Fernández", "Álvarez", "Romero", "Suárez", "Cabrera", "Medina", "Silva", "Pereyra", "Acosta",
];

const NORDIC_FIRST = [
  "Erik", "Magnus", "Oskar", "Emil", "Sander", "Henrik", "Mathias", "Anders", "Fredrik", "Viktor",
  "Noah", "William", "Lucas", "Oliver", "Aksel", "Jonas", "Mikkel", "Rasmus", "Emil", "Kasper",
];

const NORDIC_LAST = [
  "Nielsen", "Larsen", "Andersen", "Johansen", "Hansen", "Pedersen", "Nilsen", "Berg", "Lund", "Dahl",
  "Svensson", "Johansson", "Lindberg", "Nilsson", "Eriksen", "Møller", "Jensen", "Holm", "Sandvik", "Hauge",
];

const POOLS: Record<string, { first: string[]; last: string[] }> = {
  POR: { first: LATIN_FIRST, last: LATIN_LAST },
  BRA: { first: LATIN_FIRST, last: LATIN_LAST },
  ESP: { first: LATIN_FIRST, last: LATIN_LAST },
  ARG: { first: AMERICAN_FIRST, last: AMERICAN_LAST },
  URU: { first: AMERICAN_FIRST, last: AMERICAN_LAST },
  COL: { first: AMERICAN_FIRST, last: AMERICAN_LAST },
  MEX: { first: AMERICAN_FIRST, last: AMERICAN_LAST },
  ENG: { first: GERMANIC_FIRST, last: GERMANIC_LAST },
  FRA: { first: GERMANIC_FIRST, last: GERMANIC_LAST },
  BEL: { first: GERMANIC_FIRST, last: GERMANIC_LAST },
  NED: { first: GERMANIC_FIRST, last: GERMANIC_LAST },
  GER: { first: GERMANIC_FIRST, last: GERMANIC_LAST },
  ITA: { first: LATIN_FIRST, last: LATIN_LAST },
  CRO: { first: SLAVIC_FIRST, last: SLAVIC_LAST },
  SRB: { first: SLAVIC_FIRST, last: SLAVIC_LAST },
  NGA: { first: AFRICAN_FIRST, last: AFRICAN_LAST },
  GHA: { first: AFRICAN_FIRST, last: AFRICAN_LAST },
  SEN: { first: AFRICAN_FIRST, last: AFRICAN_LAST },
  MAR: { first: AFRICAN_FIRST, last: AFRICAN_LAST },
  JPN: { first: ASIAN_FIRST, last: ASIAN_LAST },
  USA: { first: AMERICAN_FIRST, last: AMERICAN_LAST },
  NOR: { first: NORDIC_FIRST, last: NORDIC_LAST },
  SWE: { first: NORDIC_FIRST, last: NORDIC_LAST },
  DEN: { first: NORDIC_FIRST, last: NORDIC_LAST },
};

export const NAME_SUGGESTIONS: Record<string, { first: string[]; last: string[] }> = POOLS;

export function randomName(country: string, rand: () => number): { first: string; last: string } {
  const pool = POOLS[country] ?? POOLS.POR;
  return {
    first: pool.first[Math.floor(rand() * pool.first.length)],
    last: pool.last[Math.floor(rand() * pool.last.length)],
  };
}

export function allNames() {
  return { first: LATIN_FIRST, last: LATIN_LAST };
}
