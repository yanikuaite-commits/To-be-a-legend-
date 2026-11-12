import type { Country } from "../types";

export const COUNTRIES: Country[] = [
  { code: "POR", name: "Portugal", flag: "🇵🇹", colors: ["#c8102e", "#046a38"] },
  { code: "BRA", name: "Brasil", flag: "🇧🇷", colors: ["#ffd93b", "#009c3b"] },
  { code: "ESP", name: "Espanha", flag: "🇪🇸", colors: ["#c60b1e", "#f1bf00"] },
  { code: "ENG", name: "Inglaterra", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", colors: ["#ffffff", "#cf142b"] },
  { code: "FRA", name: "França", flag: "🇫🇷", colors: ["#1e3a8a", "#ffffff"] },
  { code: "ITA", name: "Itália", flag: "🇮🇹", colors: ["#1e40af", "#ffffff"] },
  { code: "GER", name: "Alemanha", flag: "🇩🇪", colors: ["#111827", "#fbbf24"] },
  { code: "ARG", name: "Argentina", flag: "🇦🇷", colors: ["#6cb4ee", "#ffffff"] },
  { code: "URU", name: "Uruguai", flag: "🇺🇾", colors: ["#5dade2", "#ffffff"] },
  { code: "COL", name: "Colômbia", flag: "🇨🇴", colors: ["#fcd116", "#003893"] },
  { code: "BEL", name: "Bélgica", flag: "🇧🇪", colors: ["#111827", "#ef4444"] },
  { code: "NED", name: "Holanda", flag: "🇳🇱", colors: ["#f97316", "#111827"] },
  { code: "CRO", name: "Croácia", flag: "🇭🇷", colors: ["#ef4444", "#ffffff"] },
  { code: "SRB", name: "Sérvia", flag: "🇷🇸", colors: ["#dc2626", "#1e40af"] },
  { code: "NGA", name: "Nigéria", flag: "🇳🇬", colors: ["#16a34a", "#ffffff"] },
  { code: "GHA", name: "Gana", flag: "🇬🇭", colors: ["#dc2626", "#facc15"] },
  { code: "SEN", name: "Senegal", flag: "🇸🇳", colors: ["#16a34a", "#facc15"] },
  { code: "MAR", name: "Marrocos", flag: "🇲🇦", colors: ["#dc2626", "#16a34a"] },
  { code: "JPN", name: "Japão", flag: "🇯🇵", colors: ["#1e40af", "#ffffff"] },
  { code: "USA", name: "Estados Unidos", flag: "🇺🇸", colors: ["#1e40af", "#dc2626"] },
  { code: "MEX", name: "México", flag: "🇲🇽", colors: ["#16a34a", "#dc2626"] },
  { code: "NOR", name: "Noruega", flag: "🇳🇴", colors: ["#b91c1c", "#1e3a8a"] },
  { code: "SWE", name: "Suécia", flag: "🇸🇪", colors: ["#2563eb", "#facc15"] },
  { code: "DEN", name: "Dinamarca", flag: "🇩🇰", colors: ["#b91c1c", "#ffffff"] },
];

export const COUNTRY_MAP: Record<string, Country> = Object.fromEntries(COUNTRIES.map((c) => [c.code, c]));

export function countryName(code: string): string {
  return COUNTRY_MAP[code]?.name ?? code;
}

export function countryFlag(code: string): string {
  return COUNTRY_MAP[code]?.flag ?? "🏳️";
}
